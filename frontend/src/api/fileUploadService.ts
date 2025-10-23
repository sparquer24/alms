import { apiClient } from '../config/authenticatedApiClient';

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

export interface FileUploadError {
  success: false;
  error: string;
  details?: any;
}

/**
 * Convert file to base64 string with compression for images
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // For non-image files, use standard conversion
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
      return;
    }

    // For images, compress before converting to base64
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions (max 1200px width/height)
      const maxDimension = 1200;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxDimension) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        }
      } else {
        if (height > maxDimension) {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to JPEG with 0.7 quality for good compression
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
      
      console.log(`📊 Image compression: ${file.size} bytes → ~${Math.round(compressedBase64.length * 0.75)} bytes`);
      resolve(compressedBase64);
    };
    
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    
    // Load the image
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
};

/**
 * File Upload Service
 * Handles all file upload operations for the application form
 */
export class FileUploadService {
  /**
   * Upload a file for a specific application and document type
   * @param applicationId - The application ID
   * @param file - The file to upload
   * @param fileType - The file type enum value (e.g., 'AADHAR_CARD')
   * @param description - Optional description for the file
   * @returns Promise with upload response
   */
  static async uploadFile(
    applicationId: string | number,
    file: File,
    fileType: string,
    description?: string
  ): Promise<FileUploadResponse> {
    try {
      // Validate file size before processing (max 10MB original file)
      const maxOriginalSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxOriginalSize) {
        throw new Error(`File size too large. Maximum allowed size is ${maxOriginalSize / (1024 * 1024)}MB`);
      }

      // Convert file to base64 (with compression for images)
      const base64Data = await fileToBase64(file);
      
      // Validate base64 payload size (max ~37MB base64 ≈ 28MB binary)
      const maxBase64Size = 37 * 1024 * 1024; // 37MB base64 string
      if (base64Data.length > maxBase64Size) {
        throw new Error('Compressed file is still too large for upload. Please use a smaller file.');
      }
      
      // Prepare the payload
      const payload = {
        fileType: fileType,
        fileUrl: base64Data, // Send base64 data as fileUrl
        fileName: file.name,
        fileSize: file.size, // Original file size
        description: description
      };

      console.log(`📤 Uploading ${fileType} for application ${applicationId}:`, {
        fileName: file.name,
        originalSize: file.size,
        base64Size: base64Data.length,
        fileType: fileType
      });

      // Make API call
      const response = await apiClient.post<FileUploadResponse>(
        `/application-form/${applicationId}/upload-file`,
        payload
      );

      console.log(`✅ File uploaded successfully:`, response);
      return response;

    } catch (error: any) {
      console.error(`❌ File upload failed:`, error);
      
      // Handle specific 413 error
      if (error?.response?.status === 413 || error?.status === 413 || error?.message?.includes('413') || error?.message?.includes('too large')) {
        throw new Error('File is too large for upload. Please use a smaller file (max 2MB recommended).');
      }
      
      throw error;
    }
  }

  /**
   * Upload multiple files for different document types
   * @param applicationId - The application ID
   * @param files - Array of file upload requests
   * @returns Promise with array of upload responses
   */
  static async uploadMultipleFiles(
    applicationId: string | number,
    files: Array<{ file: File; fileType: string; description?: string }>
  ): Promise<FileUploadResponse[]> {
    const uploadPromises = files.map(({ file, fileType, description }) =>
      this.uploadFile(applicationId, file, fileType, description)
    );

    try {
      const results = await Promise.all(uploadPromises);
      console.log(`✅ All files uploaded successfully:`, results);
      return results;
    } catch (error) {
      console.error(`❌ Multiple file upload failed:`, error);
      throw error;
    }
  }

  /**
   * Delete a file by its ID
   * @param fileId - The file ID to delete
   * @returns Promise with deletion response
   */
  static async deleteFile(fileId: number): Promise<{ success: boolean; message: string }> {
    try {
      // Note: This endpoint may need to be implemented in the backend
      const response = await apiClient.delete(`/application-form/file/${fileId}`) as { success: boolean; message: string };
      console.log(`🗑️ File deleted successfully:`, response);
      return response;
    } catch (error) {
      console.error(`❌ File deletion failed:`, error);
      throw error;
    }
  }

  /**
   * Get all files for an application
   * @param applicationId - The application ID
   * @returns Promise with array of files
   */
  static async getFiles(applicationId: string | number): Promise<FileUploadResponse['data'][]> {
    try {
      const response = await apiClient.get(`/application-form/${applicationId}/files`) as FileUploadResponse['data'][];
      console.log(`📋 Files retrieved:`, response);
      return response;
    } catch (error) {
      console.error(`❌ Failed to get files:`, error);
      throw error;
    }
  }
}