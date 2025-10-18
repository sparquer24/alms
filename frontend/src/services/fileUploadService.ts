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
      console.log('🔄 FileUploadService - Uploading file metadata:', {
        applicationId,
        uploadData
      });

      const response = await apiClient.post(
        `/application-form/${applicationId}/upload-file`,
        uploadData
      );

      console.log('✅ FileUploadService - File upload successful:', response);
      
      return (response as unknown as ApiResponse<FileUploadResponse>).data;
    } catch (error) {
      console.error('❌ FileUploadService - Upload failed:', error);
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
      console.log('🔄 FileUploadService - Uploading multiple files:', {
        applicationId,
        count: uploads.length
      });

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
        console.warn('⚠️ FileUploadService - Some uploads failed:', failed);
      }

      console.log('✅ FileUploadService - Multiple file upload completed:', {
        successful: successful.length,
        failed: failed.length
      });

      return successful;
    } catch (error) {
      console.error('❌ FileUploadService - Multiple upload failed:', error);
      throw error;
    }
  }

  /**
   * Upload actual file to storage and then save metadata
   * This method handles the full upload process including file storage
   */
  static async uploadFileWithStorage(
    applicationId: number,
    file: File,
    fileType: string,
    description?: string
  ): Promise<FileUploadResponse> {
    try {
      console.log('🔄 FileUploadService - Starting file upload with storage:', {
        applicationId,
        fileName: file.name,
        fileSize: file.size,
        fileType
      });

      // For now, we'll simulate file upload to storage
      // In a real implementation, this would upload to S3, Azure Blob, etc.
      const mockFileUrl = this.generateMockFileUrl(applicationId, file, fileType);

      const uploadData: FileUploadRequest = {
        fileType,
        fileUrl: mockFileUrl,
        fileName: file.name,
        fileSize: file.size,
        description
      };

      return await this.uploadFile(applicationId, uploadData);
    } catch (error) {
      console.error('❌ FileUploadService - File upload with storage failed:', error);
      throw error;
    }
  }

  /**
   * Generate a mock file URL for demonstration purposes
   * In production, this would be replaced with actual file storage logic
   */
  private static generateMockFileUrl(applicationId: number, file: File, fileType: string): string {
    const timestamp = Date.now();
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `https://example.com/files/${fileType}_${timestamp}_${sanitizedFileName}`;
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
   * Get uploaded files for an application (if needed)
   */
  static async getUploadedFiles(applicationId: number): Promise<FileUploadResponse[]> {
    try {
      // This endpoint might not exist yet, but included for completeness
      const response = await apiClient.get(`/application-form/${applicationId}/files`);
      return (response as unknown as ApiResponse<FileUploadResponse[]>).data;
    } catch (error) {
      console.error('❌ FileUploadService - Failed to get uploaded files:', error);
      throw error;
    }
  }
}

export default FileUploadService;