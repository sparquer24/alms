import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import cache from '../../cache/cache';

export interface CaptchaResult {
  captchaId: string;
  svg: string;
}

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  
  // Character pools excluding visually ambiguous characters (0, O, o, 1, l, I)
  private readonly NUMBERS = '23456789';
  private readonly UPPER_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  private readonly LOWER_LETTERS = 'abcdefghijkmnpqrstuvwxyz';
  private readonly CAPTCHA_TTL_SECONDS = 300; // 5 minutes

  /**
   * Generate a 6-character captcha containing at least 2 numbers and 4 capital or small letters.
   * Characters are randomly shuffled so number and letter positions vary every time.
   */
  async generateCaptcha(): Promise<CaptchaResult> {
    const captchaId = crypto.randomUUID();
    const chars: string[] = [];

    // 1. Guaranteed at least 2 numbers
    for (let i = 0; i < 2; i++) {
      chars.push(this.NUMBERS[crypto.randomInt(0, this.NUMBERS.length)]);
    }

    // 2. Guaranteed at least 1 uppercase and 1 lowercase letter
    chars.push(this.UPPER_LETTERS[crypto.randomInt(0, this.UPPER_LETTERS.length)]);
    chars.push(this.LOWER_LETTERS[crypto.randomInt(0, this.LOWER_LETTERS.length)]);

    // 3. Remaining 2 characters from capital or small letters
    const allLetters = this.UPPER_LETTERS + this.LOWER_LETTERS;
    for (let i = 0; i < 2; i++) {
      chars.push(allLetters[crypto.randomInt(0, allLetters.length)]);
    }

    // 4. Cryptographic Fisher-Yates shuffle to randomize positions
    for (let i = chars.length - 1; i > 0; i--) {
      const j = crypto.randomInt(0, i + 1);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    const text = chars.join('');

    // Save exact case in cache (Redis or in-memory fallback)
    await cache.set(`captcha:${captchaId}`, text, this.CAPTCHA_TTL_SECONDS);

    const svg = this.renderSvg(text);

    return {
      captchaId,
      svg,
    };
  }

  /**
   * Validate user-provided CAPTCHA code with case sensitivity and consume it (single-use)
   */
  async validateCaptcha(
    captchaId?: string,
    userCode?: string,
  ): Promise<{ isValid: boolean; message?: string }> {
    // If explicitly disabled via environment (e.g. automated test pipelines)
    if (process.env.DISABLE_CAPTCHA === 'true') {
      return { isValid: true };
    }

    if (!captchaId || !userCode || !userCode.trim()) {
      return {
        isValid: false,
        message: 'Please enter the CAPTCHA security code.',
      };
    }

    const cacheKey = `captcha:${captchaId}`;
    const storedCode = await cache.get<string>(cacheKey);

    // Delete immediately to prevent replay attacks or brute forcing
    try {
      await cache.del(cacheKey);
    } catch {
      // best-effort cache delete
    }

    if (!storedCode) {
      return {
        isValid: false,
        message: 'CAPTCHA code has expired or is invalid. Please refresh the code and try again.',
      };
    }

    // Case-sensitive comparison for capital and small letters
    if (storedCode.trim() !== userCode.trim()) {
      return {
        isValid: false,
        message: 'Incorrect CAPTCHA security code. Please check capital and small letters.',
      };
    }

    return { isValid: true };
  }

  /**
   * Render a challenging SVG with cross-hatch background, character rotation/wobble,
   * multiple font styles, and foreground strike-through curves.
   */
  private renderSvg(text: string): string {
    const width = 180;
    const height = 46;
    const colors = [
      '#0f172a', // slate-900
      '#1e3a8a', // blue-900
      '#065f46', // emerald-800
      '#831843', // pink-900
      '#7c2d12', // orange-900
      '#4c1d95', // purple-900
      '#1f2937', // gray-800
      '#991b1b', // red-800
      '#115e59', // teal-800
    ];

    const fonts = [
      'Arial, sans-serif',
      'Verdana, sans-serif',
      'Georgia, serif',
      'Trebuchet MS, sans-serif',
      '"Courier New", monospace',
    ];

    // 1. Background grid / cross-hatch lines
    let bgGrid = '';
    for (let x = 10; x < width; x += 18) {
      bgGrid += `<line x1="${x}" y1="0" x2="${x + 15}" y2="${height}" stroke="#cbd5e1" stroke-width="0.8" opacity="0.45" />`;
    }
    for (let x = width - 10; x > 0; x -= 18) {
      bgGrid += `<line x1="${x}" y1="0" x2="${x - 15}" y2="${height}" stroke="#cbd5e1" stroke-width="0.8" opacity="0.45" />`;
    }

    // 2. Background wavy lines
    let bgCurves = '';
    for (let i = 0; i < 2; i++) {
      const stroke = colors[crypto.randomInt(0, colors.length)];
      const startX = crypto.randomInt(0, 20);
      const startY = crypto.randomInt(10, 36);
      const ctrlX = crypto.randomInt(40, 140);
      const ctrlY = crypto.randomInt(5, 42);
      const endX = crypto.randomInt(150, 180);
      const endY = crypto.randomInt(10, 36);
      bgCurves += `<path d="M${startX},${startY} Q${ctrlX},${ctrlY} ${endX},${endY}" stroke="${stroke}" stroke-width="1.8" fill="none" opacity="0.3" />`;
    }

    // 3. Characters with mixed fonts, rotation (-22° to +22°), scale & vertical jitter
    let charElements = '';
    const startX = 14;
    const spacing = 26;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const charColor = colors[crypto.randomInt(0, colors.length)];
      const font = fonts[crypto.randomInt(0, fonts.length)];
      const isItalic = crypto.randomInt(0, 2) === 1 ? 'italic' : 'normal';
      const fontSize = crypto.randomInt(24, 29);
      const x = startX + i * spacing + crypto.randomInt(-2, 3);
      const y = crypto.randomInt(28, 35);
      const rot = crypto.randomInt(-22, 23);

      charElements += `<text x="${x}" y="${y}" font-family='${font}' font-style="${isItalic}" font-weight="900" font-size="${fontSize}" fill="${charColor}" transform="rotate(${rot} ${x + 6} ${y - 10})">${char}</text>`;
    }

    // 4. Foreground strike-through curves across characters (makes OCR difficult)
    let fgCurves = '';
    for (let i = 0; i < 2; i++) {
      const stroke = colors[crypto.randomInt(0, colors.length)];
      const startX = crypto.randomInt(0, 25);
      const startY = crypto.randomInt(12, 34);
      const ctrlX1 = crypto.randomInt(45, 90);
      const ctrlY1 = crypto.randomInt(6, 40);
      const ctrlX2 = crypto.randomInt(95, 145);
      const ctrlY2 = crypto.randomInt(6, 40);
      const endX = crypto.randomInt(155, 180);
      const endY = crypto.randomInt(12, 34);
      fgCurves += `<path d="M${startX},${startY} C${ctrlX1},${ctrlY1} ${ctrlX2},${ctrlY2} ${endX},${endY}" stroke="${stroke}" stroke-width="1.6" fill="none" opacity="0.45" />`;
    }

    // 5. Dense noise scatter dots (40 dots)
    let noiseDots = '';
    for (let i = 0; i < 40; i++) {
      const cx = crypto.randomInt(3, width - 3);
      const cy = crypto.randomInt(3, height - 3);
      const r = (crypto.randomInt(8, 22) / 10).toFixed(1);
      const fill = colors[crypto.randomInt(0, colors.length)];
      noiseDots += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" opacity="0.35"/>`;
    }

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" style="background-color: #f1f5f9; border-radius: 6px; user-select: none;">
      <rect width="100%" height="100%" fill="#f1f5f9" rx="6" />
      ${bgGrid}
      ${bgCurves}
      ${charElements}
      ${fgCurves}
      ${noiseDots}
    </svg>`.replace(/\s+/g, ' ').trim();
  }
}
