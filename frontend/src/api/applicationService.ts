import { postData, patchData, fetchData, putData } from './axiosConfig';

export interface ApplicationFormData {
  // Personal Information Fields
  acknowledgementNo?: string;
  firstName?: string;
  middleName?: string;
  lastName?: string;
  filledBy?: string;
  parentOrSpouseName?: string;
  sex?: string;
  placeOfBirth?: string;
  dateOfBirth?: string;
  panNumber?: string;
  aadharNumber?: string;
  dobInWords?: string;
  
  // Address Details Fields
  permanentAddress?: {
    houseNo?: string;
    street?: string;
    locality?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  currentAddress?: {
    houseNo?: string;
    street?: string;
    locality?: string;
    district?: string;
    state?: string;
    pincode?: string;
  };
  
  // Occupation Fields
  occupation?: string;
  employerName?: string;
  businessDetails?: string;
  annualIncome?: number;
  
  // Criminal History Fields
  criminalHistory?: {
    hasHistory?: boolean;
    details?: string;
  };
  
  // License History Fields
  licenseHistory?: {
    hasExistingLicense?: boolean;
    licenseNumber?: string;
    issuingAuthority?: string;
  };
  
  // License Details Fields
  licenseType?: string;
  category?: string;
  validityPeriod?: string;
}

export class ApplicationService {
  /**
   * Create new application (POST) - Only for Personal Information
   * @param personalData - Personal information data
   * @returns Response with applicationId
   */
  static async createApplication(personalData: Partial<ApplicationFormData>) {
    const payload = {
      ...personalData,
      sex: personalData.sex?.toUpperCase(),
      dateOfBirth: personalData.dateOfBirth ? new Date(personalData.dateOfBirth).toISOString() : undefined,
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, value]) => value !== undefined)
    );

    console.log('🔵 Creating new application (POST):', '/application-form', cleanPayload);
    // 🔧 FIXED: Use /application-form instead of /application-form/personal-details
    return await postData('/application-form', cleanPayload);
  }

  /**
   * Update existing application (PUT) - For all forms  
   * Note: Using PUT since PATCH endpoints don't exist in backend yet
   * @param applicantId - The application ID
   * @param formData - Form data to update
   * @param section - Form section being updated
   * @returns Response confirmation
   */
  static async updateApplication(
    applicantId: string, 
    formData: Partial<ApplicationFormData>,
    section: 'personal' | 'address' | 'occupation' | 'criminal' | 'license-history' | 'license-details'
  ) {
    const payload = this.preparePayload(formData, section);
    
    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, value]) => value !== undefined)
    );

    const url = `/application-form/${applicantId}`;
    console.log(`🟡 Updating application (PUT) - URL: ${url}, Section: ${section}, ID: ${applicantId}`, cleanPayload);
    
    // � FIXED: Use PUT instead of PATCH since PATCH endpoints don't exist
    // Include section info in the payload so backend knows what to update
    const fullPayload = {
      ...cleanPayload,
      section: section, // Tell backend which section we're updating
    };
    
    return await putData(url, fullPayload);
  }

  /**
   * Get application data by ID
   * @param applicantId - The application ID
   * @returns Application data
   */
  static async getApplication(applicantId: string) {
    const url = `/application-form/${applicantId}`;
    console.log('🟢 Fetching application (GET):', url);
    return await fetchData(url);
  }

  /**
   * Prepare payload based on form section
   * @param formData - Raw form data
   * @param section - Form section
   * @returns Prepared payload
   */
  private static preparePayload(formData: Partial<ApplicationFormData>, section: string) {
    switch (section) {
      case 'personal':
        return {
          ...formData,
          sex: formData.sex?.toUpperCase(),
          dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
        };
      case 'address':
        return {
          permanentAddress: formData.permanentAddress,
          currentAddress: formData.currentAddress,
        };
      case 'occupation':
        return {
          occupation: formData.occupation,
          employerName: formData.employerName,
          businessDetails: formData.businessDetails,
          annualIncome: formData.annualIncome,
        };
      case 'criminal':
        return {
          criminalHistory: formData.criminalHistory,
        };
      case 'license-history':
        return {
          licenseHistory: formData.licenseHistory,
        };
      case 'license-details':
        return {
          licenseType: formData.licenseType,
          category: formData.category,
          validityPeriod: formData.validityPeriod,
        };
      default:
        return formData;
    }
  }
}