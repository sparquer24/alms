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
   * Simulate uploading file to storage service
   * In production, this would upload to AWS S3, Cloudinary, or similar service
   * @param file - The file to upload
   * @returns Promise<string> - The file URL
   */
  private static async uploadToStorageService(file: File): Promise<string> {
    return new Promise((resolve) => {
      // Simulate upload delay
      setTimeout(() => {
        // Generate a mock file URL
        const timestamp = Date.now();
        const fileExtension = file.name.split('.').pop();
        const mockUrl = `https://storage.example.com/uploads/${timestamp}_${file.name}`;
        resolve(mockUrl);
      }, 1000); // 1 second delay to simulate upload
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