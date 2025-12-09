import { postData } from '../api/axiosConfig';

export interface FileUploadData {
  fileType: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  description?: string;
}

export interface FileUploadResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    applicationId: number;
    fileType: string;
    fileName: string;
    fileUrl: string;
    fileSize: number;
    uploadedAt: string;
  };
}

export class FileUploadService {
  /**
   * Upload a file for a specific application
   * @param applicationId - The application ID
   * @param file - The file to upload
   * @param fileType - Type of file (e.g., "AADHAR_CARD", "DOCUMENT_EVIDENCE")
   * @param description - Description of the file
   * @returns Upload response
   */
  static async uploadFile(
    applicationId: string,
    file: File,
    fileType: string = "OTHER",
    description: string = ""
  ): Promise<FileUploadResponse> {
    try {
      // Validate inputs
      if (!applicationId || applicationId.trim() === '') {
        throw new Error('Application ID is required for file upload');
      }
      
      if (!file) {
        throw new Error('File is required for upload');
      }
      
      if (file.size === 0) {
        throw new Error('File cannot be empty');
      }
      // Step 1: Simulate file upload to storage service
      // In a real implementation, you would upload to AWS S3, Cloudinary, etc.
      const fileUrl = await this.uploadToStorageService(file);
      
      // Step 2: Send file metadata to backend
      const fileMetadata: FileUploadData = {
        fileType: fileType as any,
        fileUrl: fileUrl,
        fileName: file.name,
        fileSize: file.size,
        description: description || undefined
      };

      const url = `/application-form/${applicationId}/upload-file`;
      const response = await postData(url, fileMetadata);
      return response;
    } catch (error: any) {
      throw new Error(`File upload failed: ${error.message}`);
    }
  }

  /**
   * Simulate uploading file to storage service.
   * Uses a configurable base URL instead of an unreachable example.com host.
   * In production, replace with real upload (S3/Blob/etc.) and return the real URL.
   */
  private static async uploadToStorageService(file: File): Promise<string> {
    return new Promise(resolve => {
      setTimeout(() => {
        const timestamp = Date.now();
        const base =
          (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_FILE_BASE_URL) ||
          (typeof window !== 'undefined' ? window.location.origin : '');
        const mockUrl = `${base}/uploads/${timestamp}_${file.name}`;
        resolve(mockUrl);
      }, 1000);
    });
  }

  /**
   * Upload multiple files for a specific application
   * @param applicationId - The application ID
   * @param files - Array of files to upload
   * @param fileType - Type of files
   * @param description - Description of the files
   * @returns Array of upload responses
   */
  static async uploadMultipleFiles(
    applicationId: string,
    files: File[],
    fileType: string = "OTHER",
    description: string = ""
  ): Promise<FileUploadResponse[]> {
    const uploadPromises = files.map(file => 
      this.uploadFile(applicationId, file, fileType, description)
    );

    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error: any) {
      throw error;
    }
  }
}