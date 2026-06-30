import { apiClient } from '../config/authenticatedApiClient';
import { ApiResponse } from '../types/api';

export interface FileUploadRequest {
  fileType: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  description?: string;
}

export interface FileUploadResponse {
  id: number;
  applicationId: number;
  fileType: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
}

export interface FileUploadWithFile extends Omit<FileUploadRequest, 'fileUrl'> {
  file: File;
}

/**
 * Service for handling file uploads in the fresh application form
 */
export class FileUploadService {
  /**
   * Upload a file for a specific application
   * Note: This assumes the file has already been uploaded to a storage service
   * and we're just storing the metadata in the database
   */
  static async uploadFile(
    applicationId: number,
    uploadData: FileUploadRequest
  ): Promise<FileUploadResponse> {
    try {
      const response = await apiClient.post(
        `/application-form/${applicationId}/upload-file`,
        uploadData
      );
      return (response as unknown as ApiResponse<FileUploadResponse>).data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload multiple files for a specific application
   */
  static async uploadMultipleFiles(
    applicationId: number,
    uploads: FileUploadRequest[]
  ): Promise<FileUploadResponse[]> {
    try {
      const results = await Promise.allSettled(
        uploads.map(upload => this.uploadFile(applicationId, upload))
      );

      const successful: FileUploadResponse[] = [];
      const failed: string[] = [];

      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          successful.push(result.value);
        } else {
          failed.push(`File ${index + 1}: ${result.reason?.message || 'Unknown error'}`);
        }
      });

      if (failed.length > 0) {
      }
      return successful;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload actual file to storage and then save metadata
   * This method handles the full upload process — converts the file to a base64
   * data URL so the stored fileUrl can be displayed directly in the browser.
   */
  static async uploadFileWithStorage(
    applicationId: number,
    file: File,
    fileType: string,
    description?: string
  ): Promise<FileUploadResponse> {
    try {
      // Convert the file to a base64 data URL so it can be rendered inline
      const base64Url = await this.fileToBase64(file);

      const uploadData: FileUploadRequest = {
        fileType,
        fileUrl: base64Url,
        fileName: file.name,
        fileSize: file.size,
        description
      };

      return await this.uploadFile(applicationId, uploadData);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Convert a File to a base64 data URL string.
   */
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to convert file to base64'));
      };
      reader.readAsDataURL(file);
    });
  }

  /**
   * Validate file before upload
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 10MB'
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'File type not supported. Please upload JPG, PNG, or PDF files.'
      };
    }

    return { isValid: true };
  }

  /**
   * Delete an uploaded file by its ID
   * Calls DELETE /api/application-form/file/{id}
   */
  static async deleteFile(fileId: number): Promise<void> {
    try {
      await apiClient.delete(`/application-form/file/${fileId}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get uploaded files for an application (if needed)
   */
  static async getUploadedFiles(applicationId: number): Promise<FileUploadResponse[]> {
    try {
      // This endpoint might not exist yet, but included for completeness
      const response = await apiClient.get(`/application-form/${applicationId}/files`);
      return (response as unknown as ApiResponse<FileUploadResponse[]>).data;
    } catch (error) {
      throw error;
    }
  }
}

export default FileUploadService;