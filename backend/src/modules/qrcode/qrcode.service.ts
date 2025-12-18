import { Injectable } from '@nestjs/common';
import prisma from '../../db/prismaClient';

/**
 * QR Code Service
 * Handles QR code generation logic
 * Implements proper QR code encoding that can be scanned
 */
@Injectable()
export class QRCodeService {
    /**
     * Generate QR Code for an application
     * Returns a data URL containing the QR code image
     */
    async generateQRCode(applicationId: number): Promise<[any | null, any | null]> {
        try {
            // First verify the application exists
            const application = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
                where: { id: applicationId },
                select: {
                    id: true,
                    acknowledgementNo: true,
                    firstName: true,
                    lastName: true,
                },
            });

            if (!application) {
                return ['Application not found', null];
            }

            // Build the public URL for the QR code
            // The frontend public URL will be configured via environment variable
            const frontendBaseUrl = process.env.FRONTEND_URL || process.env.PUBLIC_URL || 'http://localhost:5000';
            const publicUrl = `${frontendBaseUrl}/public/application/${applicationId}`;

            // Generate QR code as data URL using proper QR encoding
            const qrCodeDataUrl = this.generateQRCodeSvg(publicUrl);

            return [
                null,
                {
                    applicationId: application.id,
                    acknowledgementNo: application.acknowledgementNo,
                    qrCodeDataUrl,
                    publicUrl,
                },
            ];
        } catch (error: any) {
            console.error('[QRCodeService] Error generating QR code:', error);
            return [error?.message || 'Failed to generate QR code', null];
        }
    }

    /**
     * Check if an application exists
     */
    async checkApplicationExists(applicationId: number): Promise<[any | null, boolean]> {
        try {
            const application = await prisma.freshLicenseApplicationPersonalDetails.findUnique({
                where: { id: applicationId },
                select: { id: true },
            });

            return [null, !!application];
        } catch (error: any) {
            return [error?.message || 'Failed to check application', false];
        }
    }

    /**
     * Generate a proper QR code SVG that can be scanned
     * Uses QR Code Version 4, Error Correction Level L
     */
    private generateQRCodeSvg(text: string): string {
        // Encode the text into QR code data
        const qrData = this.encodeQRCode(text);

        // Convert to SVG
        const moduleSize = 8;
        const quietZone = 4; // 4 module quiet zone
        const size = qrData.length;
        const totalSize = (size + quietZone * 2) * moduleSize;

        let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalSize} ${totalSize}" width="${totalSize}" height="${totalSize}">`;
        svg += `<rect width="100%" height="100%" fill="white"/>`;

        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (qrData[y][x]) {
                    const px = (x + quietZone) * moduleSize;
                    const py = (y + quietZone) * moduleSize;
                    svg += `<rect x="${px}" y="${py}" width="${moduleSize}" height="${moduleSize}" fill="black"/>`;
                }
            }
        }

        svg += '</svg>';

        // Return as data URL
        const base64 = Buffer.from(svg).toString('base64');
        return `data:image/svg+xml;base64,${base64}`;
    }

    /**
     * Encode text into QR code matrix using proper QR code specification
     * Supports alphanumeric mode for URLs
     */
    private encodeQRCode(text: string): boolean[][] {
        // Use Version 4-L (33x33 modules, 78 alphanumeric chars capacity)
        const size = 33;
        const matrix: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
        const reserved: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));

        // Step 1: Add finder patterns
        this.addFinderPattern(matrix, reserved, 0, 0);
        this.addFinderPattern(matrix, reserved, size - 7, 0);
        this.addFinderPattern(matrix, reserved, 0, size - 7);

        // Step 2: Add separators
        this.addSeparators(matrix, reserved, size);

        // Step 3: Add alignment pattern (Version 4 has one at position 22)
        this.addAlignmentPattern(matrix, reserved, 22, 22);

        // Step 4: Add timing patterns
        this.addTimingPatterns(matrix, reserved, size);

        // Step 5: Add dark module
        matrix[size - 8][8] = true;
        reserved[size - 8][8] = true;

        // Step 6: Reserve format and version info areas
        this.reserveFormatAreas(reserved, size);

        // Step 7: Encode the data
        const dataCodewords = this.encodeData(text);

        // Step 8: Add error correction
        const allCodewords = this.addErrorCorrection(dataCodewords);

        // Step 9: Place data in matrix
        this.placeData(matrix, reserved, allCodewords, size);

        // Step 10: Apply mask pattern 0 and add format info
        this.applyMaskAndFormat(matrix, reserved, size);

        return matrix;
    }

    private addFinderPattern(matrix: boolean[][], reserved: boolean[][], row: number, col: number): void {
        for (let r = 0; r < 7; r++) {
            for (let c = 0; c < 7; c++) {
                const isBlack = (r === 0 || r === 6 || c === 0 || c === 6) ||
                    (r >= 2 && r <= 4 && c >= 2 && c <= 4);
                matrix[row + r][col + c] = isBlack;
                reserved[row + r][col + c] = true;
            }
        }
    }

    private addSeparators(matrix: boolean[][], reserved: boolean[][], size: number): void {
        // Top-left separator
        for (let i = 0; i < 8; i++) {
            reserved[7][i] = true;
            reserved[i][7] = true;
        }
        // Top-right separator
        for (let i = 0; i < 8; i++) {
            reserved[7][size - 8 + i] = true;
            reserved[i][size - 8] = true;
        }
        // Bottom-left separator
        for (let i = 0; i < 8; i++) {
            reserved[size - 8][i] = true;
            reserved[size - 8 + i][7] = true;
        }
    }

    private addAlignmentPattern(matrix: boolean[][], reserved: boolean[][], row: number, col: number): void {
        for (let r = -2; r <= 2; r++) {
            for (let c = -2; c <= 2; c++) {
                const isBlack = (r === -2 || r === 2 || c === -2 || c === 2) || (r === 0 && c === 0);
                matrix[row + r][col + c] = isBlack;
                reserved[row + r][col + c] = true;
            }
        }
    }

    private addTimingPatterns(matrix: boolean[][], reserved: boolean[][], size: number): void {
        for (let i = 8; i < size - 8; i++) {
            const isBlack = i % 2 === 0;
            matrix[6][i] = isBlack;
            matrix[i][6] = isBlack;
            reserved[6][i] = true;
            reserved[i][6] = true;
        }
    }

    private reserveFormatAreas(reserved: boolean[][], size: number): void {
        // Format info around top-left finder
        for (let i = 0; i < 9; i++) {
            reserved[8][i] = true;
            reserved[i][8] = true;
        }
        // Format info around top-right finder
        for (let i = 0; i < 8; i++) {
            reserved[8][size - 8 + i] = true;
        }
        // Format info around bottom-left finder
        for (let i = 0; i < 7; i++) {
            reserved[size - 7 + i][8] = true;
        }
    }

    private encodeData(text: string): number[] {
        // Use byte mode for URLs (mode indicator: 0100)
        const modeIndicator = 0b0100;
        const bits: number[] = [];

        // Add mode indicator (4 bits)
        for (let i = 3; i >= 0; i--) {
            bits.push((modeIndicator >> i) & 1);
        }

        // Add character count (8 bits for byte mode, version 1-9)
        const length = Math.min(text.length, 78);
        for (let i = 7; i >= 0; i--) {
            bits.push((length >> i) & 1);
        }

        // Add data (8 bits per character)
        for (let i = 0; i < length; i++) {
            const charCode = text.charCodeAt(i);
            for (let j = 7; j >= 0; j--) {
                bits.push((charCode >> j) & 1);
            }
        }

        // Add terminator (up to 4 zeros)
        const dataCapacityBits = 80 * 8; // Version 4-L data capacity
        let terminatorLength = Math.min(4, dataCapacityBits - bits.length);
        for (let i = 0; i < terminatorLength; i++) {
            bits.push(0);
        }

        // Pad to byte boundary
        while (bits.length % 8 !== 0) {
            bits.push(0);
        }

        // Add padding codewords
        const padBytes = [0b11101100, 0b00010001];
        let padIndex = 0;
        while (bits.length < dataCapacityBits) {
            const padByte = padBytes[padIndex % 2];
            for (let i = 7; i >= 0; i--) {
                bits.push((padByte >> i) & 1);
            }
            padIndex++;
        }

        // Convert bits to codewords
        const codewords: number[] = [];
        for (let i = 0; i < bits.length; i += 8) {
            let byte = 0;
            for (let j = 0; j < 8; j++) {
                byte = (byte << 1) | (bits[i + j] || 0);
            }
            codewords.push(byte);
        }

        return codewords.slice(0, 80); // Version 4-L has 80 data codewords
    }

    private addErrorCorrection(data: number[]): number[] {
        // Version 4-L: 1 block, 80 data codewords, 20 EC codewords
        const ecCodewords = this.calculateReedSolomon(data, 20);
        return [...data, ...ecCodewords];
    }

    private calculateReedSolomon(data: number[], ecCount: number): number[] {
        // Simplified Reed-Solomon for QR codes
        // Generator polynomial coefficients for 20 EC codewords
        const generator = [1, 152, 185, 240, 5, 111, 99, 6, 220, 112, 150, 69, 36, 187, 22, 228, 198, 121, 121, 165, 174];

        const result = new Array(ecCount).fill(0);

        for (const byte of data) {
            const factor = byte ^ result[0];
            for (let i = 0; i < ecCount - 1; i++) {
                result[i] = result[i + 1] ^ this.gfMul(generator[i + 1], factor);
            }
            result[ecCount - 1] = this.gfMul(generator[ecCount], factor);
        }

        return result;
    }

    private gfMul(a: number, b: number): number {
        if (a === 0 || b === 0) return 0;

        // GF(256) multiplication using log/antilog tables
        const logTable = this.getLogTable();
        const antilogTable = this.getAntilogTable();

        return antilogTable[(logTable[a] + logTable[b]) % 255];
    }

    private getLogTable(): number[] {
        const table = new Array(256).fill(0);
        let x = 1;
        for (let i = 0; i < 255; i++) {
            table[x] = i;
            x = x << 1;
            if (x >= 256) x ^= 0x11d;
        }
        return table;
    }

    private getAntilogTable(): number[] {
        const table = new Array(256).fill(0);
        let x = 1;
        for (let i = 0; i < 255; i++) {
            table[i] = x;
            x = x << 1;
            if (x >= 256) x ^= 0x11d;
        }
        return table;
    }

    private placeData(matrix: boolean[][], reserved: boolean[][], codewords: number[], size: number): void {
        let bitIndex = 0;
        const totalBits = codewords.length * 8;
        let upward = true;

        for (let right = size - 1; right >= 1; right -= 2) {
            if (right === 6) right = 5; // Skip timing column

            for (let vert = 0; vert < size; vert++) {
                const y = upward ? size - 1 - vert : vert;

                for (let dx = 0; dx <= 1; dx++) {
                    const x = right - dx;
                    if (!reserved[y][x] && bitIndex < totalBits) {
                        const codewordIndex = Math.floor(bitIndex / 8);
                        const bitOffset = 7 - (bitIndex % 8);
                        matrix[y][x] = ((codewords[codewordIndex] >> bitOffset) & 1) === 1;
                        bitIndex++;
                    }
                }
            }
            upward = !upward;
        }
    }

    private applyMaskAndFormat(matrix: boolean[][], reserved: boolean[][], size: number): void {
        // Apply mask pattern 0 (checkerboard) to data modules
        for (let y = 0; y < size; y++) {
            for (let x = 0; x < size; x++) {
                if (!reserved[y][x] && (y + x) % 2 === 0) {
                    matrix[y][x] = !matrix[y][x];
                }
            }
        }

        // Format info for mask 0, EC level L: 111011111000100
        const formatBits = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];

        // Place format info around top-left finder
        for (let i = 0; i < 6; i++) {
            matrix[8][i] = formatBits[i] === 1;
        }
        matrix[8][7] = formatBits[6] === 1;
        matrix[8][8] = formatBits[7] === 1;
        matrix[7][8] = formatBits[8] === 1;
        for (let i = 9; i < 15; i++) {
            matrix[14 - i][8] = formatBits[i] === 1;
        }

        // Place format info around other finders
        for (let i = 0; i < 7; i++) {
            matrix[size - 1 - i][8] = formatBits[i] === 1;
        }
        for (let i = 0; i < 8; i++) {
            matrix[8][size - 8 + i] = formatBits[7 + i] === 1;
        }
    }
}
