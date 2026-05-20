/**
 * Comprehensive Form Data Loader Utility
 * 
 * This utility provides centralized functions to load existing application data
 * and populate forms across all sections of the Fresh Application Form.
 * 
 * Features:
 * - Loads data for all form sections
 * - Handles data transformation from backend to frontend format
 * - Provides error handling and graceful fallbacks
 * - Supports both individual section loading and complete data loading
 */

import React from 'react';
import { ApplicationService } from '../api/applicationService';
import { FileUploadService } from '../api/fileUploadService';
import { DOCUMENT_TYPE_MAPPING } from '../config/documenttypes';

export interface LoadedFormData {
  personalInformation?: any;
  addressDetails?: any;
  occupationBusiness?: any;
  criminalHistory?: any;
  licenseHistory?: any;
  licenseDetails?: any;
  documentsUpload?: any;
}

export class FormDataLoader {
  /**
   * Load existing data for all form sections
   * @param applicationId - The application ID to load data for
   * @returns Promise<LoadedFormData> - Object containing data for all sections
   */
  static async loadAllSections(applicationId: string): Promise<LoadedFormData> {
    try {
      const response = await ApplicationService.getApplication(applicationId);

      // ApplicationService.getApplication sometimes returns the raw axios `data`
      // (already unwrapped) and sometimes a wrapper like { success, data }.
      // Normalize both shapes into `applicationData`.
      let applicationData: any = null;
      if (response && typeof response === 'object' && ('success' in response || 'data' in response)) {
        applicationData = response.data ?? (response as any);
      } else {
        applicationData = response;
      }
      if (!applicationData) {
        throw new Error('Failed to load application data');
      }

      // Debug: log raw response for troubleshooting missing sections
      // (logs appear in browser console because this is invoked from client code)
      try {
        // eslint-disable-next-line no-console
        console.debug('[FormDataLoader] raw response:', response);
      } catch (e) {}

      // Keep backend attribute names intact so the renewal form can consume the original shape
      // Normalize personal information and ensure `dateOfBirth` is in yyyy-MM-dd for date inputs
      const rawPersonal = applicationData.personalDetails ? { ...applicationData.personalDetails } : { ...applicationData };
      if (rawPersonal.dateOfBirth) {
        try {
          rawPersonal.dateOfBirth = new Date(rawPersonal.dateOfBirth).toISOString().split('T')[0];
        } catch (e) {
          // leave as-is if parsing fails
        }
      }

      const loadedData: LoadedFormData = {
        personalInformation: rawPersonal,
        addressDetails: {
          presentAddress: applicationData.presentAddress || null,
          permanentAddress: applicationData.permanentAddress || null,
        },
        occupationBusiness: applicationData.occupationAndBusiness || null,
        criminalHistory: { criminalHistories: applicationData.criminalHistories || [] },
        licenseHistory: { licenseHistories: applicationData.licenseHistories || [] },
        licenseDetails: { licenseDetails: applicationData.licenseDetails || [] },
        documentsUpload: await (async () => {
          try {
            const uploaded = await FileUploadService.getFiles(applicationId);
            const filesMap: Record<string, any[]> = {};

            // Build reverse lookup for fileType -> displayName
            const reverseMap: Record<string, string> = {};
            Object.keys(DOCUMENT_TYPE_MAPPING).forEach((display) => {
              const cfg = DOCUMENT_TYPE_MAPPING[display];
              reverseMap[cfg.fileType] = display;
            });

            for (const f of uploaded) {
              const displayName = reverseMap[f.fileType] || 'Other Documents';
              if (!filesMap[displayName]) filesMap[displayName] = [];

              filesMap[displayName].push({
                file: { name: f.fileName },
                uploading: false,
                uploaded: true,
                uploadId: f.id,
                serverSize: f.fileSize,
                fileUrl: f.fileUrl,
                uploadedAt: f.uploadedAt,
                // keep original backend fields for reference
                raw: f
              });
            }

            // Debug: log mapped files
            try {
              // eslint-disable-next-line no-console
              console.debug('[FormDataLoader] documentsUpload:', filesMap);
            } catch (e) {}

            return filesMap;
          } catch (e) {
            return {};
          }
        })()
      };

      return loadedData;
      
    } catch (error: any) {
      throw new Error(`Could not load application data: ${error.message}`);
    }
  }
  
  /**
   * Load data for a specific section
   * @param applicationId - The application ID
   * @param section - The section to load data for
   * @returns Promise<any> - Section-specific data
   */
  static async loadSection(
    applicationId: string, 
    section: 'personal' | 'address' | 'occupation' | 'criminal' | 'license-history' | 'license-details'
  ): Promise<any> {
    try {
      const response = await ApplicationService.getApplication(applicationId);
      
      if (!response.success || !response.data) {
        throw new Error(`Failed to load data for section: ${section}`);
      }
      
      const sectionData = ApplicationService.extractSectionData(response.data, section);
      return sectionData;
      
    } catch (error: any) {
      throw new Error(`Could not load ${section} data: ${error.message}`);
    }
  }
  
  /**
   * Check if application data exists and return availability status
   * @param applicationId - The application ID to check
   * @returns Promise<{exists: boolean, sections: string[]}> - Availability status
   */
  static async checkDataAvailability(applicationId: string): Promise<{
    exists: boolean;
    sections: string[];
    message: string;
  }> {
    try {
      const response = await ApplicationService.getApplication(applicationId);
      
      if (!response.success || !response.data) {
        return {
          exists: false,
          sections: [],
          message: 'No existing data found for this application ID'
        };
      }
      
      const applicationData = response.data;
      const availableSections: string[] = [];
      
      // Check which sections have data
      if (applicationData.personalDetails || applicationData.firstName) {
        availableSections.push('Personal Information');
      }
      if (applicationData.presentAddress || applicationData.permanentAddress) {
        availableSections.push('Address Details');
      }
      if (applicationData.occupationAndBusiness) {
        availableSections.push('Occupation/Business');
      }
      if (applicationData.criminalHistories && applicationData.criminalHistories.length > 0) {
        availableSections.push('Criminal History');
      }
      if (applicationData.licenseHistories && applicationData.licenseHistories.length > 0) {
        availableSections.push('License History');
      }
      if (applicationData.licenseDetails && applicationData.licenseDetails.length > 0) {
        availableSections.push('License Details');
      }
      
      return {
        exists: true,
        sections: availableSections,
        message: `Found existing data for ${availableSections.length} sections`
      };
      
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        return {
          exists: false,
          sections: [],
          message: 'Application not found - starting with fresh form'
        };
      }
      
      return {
        exists: false,
        sections: [],
        message: `Error checking data: ${error.message}`
      };
    }
  }
  
  /**
   * Load existing data with user-friendly status updates
   * @param applicationId - The application ID
   * @param onProgress - Optional callback for progress updates
   * @returns Promise<LoadedFormData> - Complete form data
   */
  static async loadWithProgress(
    applicationId: string,
    onProgress?: (message: string, progress: number) => void
  ): Promise<LoadedFormData> {
    try {
      onProgress?.('Checking application availability...', 10);
      
      // First check if data exists
      const availability = await this.checkDataAvailability(applicationId);
      
      if (!availability.exists) {
        onProgress?.('No existing data found', 100);
        return {};
      }
      
      onProgress?.(`Loading data for ${availability.sections.length} sections...`, 30);
      
      // Load all sections
      const loadedData = await this.loadAllSections(applicationId);
      
      onProgress?.('Data loaded successfully!', 100);
      
      return loadedData;
      
    } catch (error: any) {
      onProgress?.(`Error: ${error.message}`, 100);
      throw error;
    }
  }
}

/**
 * React Hook for loading form data
 * This can be used in components that need to load data outside of useApplicationForm
 */
export const useFormDataLoader = () => {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [progressMessage, setProgressMessage] = React.useState('');
  
  const loadData = React.useCallback(async (applicationId: string) => {
    setLoading(true);
    setError(null);
    setProgress(0);
    setProgressMessage('');
    
    try {
      const data = await FormDataLoader.loadWithProgress(
        applicationId,
        (message, progress) => {
          setProgressMessage(message);
          setProgress(progress);
        }
      );
      
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return {
    loadData,
    loading,
    error,
    progress,
    progressMessage
  };
};

export default FormDataLoader;