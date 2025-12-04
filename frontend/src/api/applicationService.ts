import { postData, patchData, fetchData, putData, debugTokenStatus } from './axiosConfig';

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

  // Address Details Fields - Form fields
  presentAddress?: string;
  presentState?: string;
  presentDistrict?: string;
  presentZone?: string;
  presentDivision?: string;
  presentPoliceStation?: string;
  presentSince?: string;
  permanentAddress?: string;
  permanentState?: string;
  permanentDistrict?: string;
  permanentZone?: string;
  permanentDivision?: string;
  permanentPoliceStation?: string;
  telephoneOffice?: string;
  telephoneResidence?: string;
  officeMobileNumber?: string;
  alternativeMobile?: string;

  // Occupation Fields
  occupation?: string;
  officeAddress?: string;
  officeState?: string;
  officeDistrict?: string;
  stateId?: string;
  districtId?: string;
  cropLocation?: string;
  areaUnderCultivation?: string;
  employerName?: string;
  businessDetails?: string;
  annualIncome?: string;
  workExperience?: string;
  businessType?: string;

  // Criminal History Fields - will be transformed to array
  criminalHistories?: any[];

  // License History Fields - will be transformed to array
  licenseHistories?: any[];

  // License Details Fields
  needForLicense?: string;
  armsOption?: string;
  armsType?: string;
  weaponId?: number;
  areaDistrict?: boolean;
  areaState?: boolean;
  areaIndia?: boolean;
  ammunitionDescription?: string;
  specialClaims?: string;
  licencePlaceArea?: string;
  wildBeastsSpecification?: string;

  // License Details Fields - will be transformed to array
  licenseDetails?: any[];
}

export class ApplicationService {
  /**
   * Debug function to test if application exists and check API connectivity
   * @param applicantId - The application ID to test
   */
  static async debugApplicationStatus(applicantId: string) {
    try {
      // Test GET first to see if application exists
      const getResult = await this.getApplication(applicantId);
      return { exists: true, data: getResult };
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        return { exists: false, error: 'Application not found' };
      }
      
      return { exists: false, error: error.message };
    }
  }

  /**
   * Create new application (POST) - Only for Personal Information
   * @param personalData - Personal information data
   * @returns Response with applicationId
   */
  static async createApplication(personalData: Partial<ApplicationFormData>) {
    // Validate and format date of birth
    let formattedDateOfBirth = undefined;
    if (personalData.dateOfBirth) {
      const dobDate = new Date(personalData.dateOfBirth);
      // Check if date is valid
      if (!isNaN(dobDate.getTime())) {
        formattedDateOfBirth = dobDate.toISOString();
      } else {
        throw new Error('Invalid date of birth format');
      }
    }

    const payload = {
      ...personalData,
      sex: personalData.sex?.toUpperCase(),
      dateOfBirth: formattedDateOfBirth,
    };

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, value]) => value !== undefined && value !== null && value !== '')
    );
    return await postData('/application-form/personal-details', cleanPayload);
  }

  /**
   * Update existing application (PATCH) - For all forms
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
    try {
      const payload = this.preparePayload(formData, section);

      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([_, value]) => value !== undefined)
      );

      const url = `/application-form?applicationId=${applicantId}`;
      return await patchData(url, cleanPayload);
    } catch (error: any) {
      // If 404, the application doesn't exist
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        // For personal section, we can create a new application
        if (section === 'personal') {
          try {
            const createResult = await this.createApplication(formData);
            return createResult;
          } catch (createError: any) {
            throw new Error(`Cannot update application ${applicantId}: Application not found and creation failed - ${createError.message}`);
          }
        } else {
          throw new Error(`Cannot update application ${applicantId}: Application not found. Please create the application with personal details first.`);
        }
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Get application data by ID with optional isOwned parameter
   * @param applicantId - The application ID
   * @param isOwned - Optional ownership parameter
   * @returns Application data
   */
  static async getApplication(applicantId: string, isOwned?: boolean) {
    let url = `/application-form?applicationId=${applicantId}`;
    
    // Add isOwned parameter if provided
    if (isOwned !== undefined) {
      url += `&isOwned=${isOwned}`;
    }
    return await fetchData(url);
  }

  /**
   * Extract section-specific data from complete application response
   * @param applicationData - Complete application data from GET API
   * @param section - Section to extract
   * @returns Section-specific data
   */
  static extractSectionData(applicationData: any, section: string) {
    if (!applicationData) return null;

    switch (section) {
      case 'personal':
        const personalData = applicationData.personalDetails || applicationData;
        // Handle date formatting for frontend
        let dateOfBirth = '';
        if (personalData.dateOfBirth) {
          try {
            dateOfBirth = new Date(personalData.dateOfBirth).toISOString().split('T')[0];
          } catch (error) {
          }
        }
        
        const extractedPersonal = {
          acknowledgementNo: personalData.acknowledgementNo || '',
          firstName: personalData.firstName || '',
          middleName: personalData.middleName || '',
          lastName: personalData.lastName || '',
          filledBy: personalData.filledBy || '',
          parentOrSpouseName: personalData.parentOrSpouseName || '',
          sex: personalData.sex || '',
          placeOfBirth: personalData.placeOfBirth || '',
          dateOfBirth: dateOfBirth,
          panNumber: personalData.panNumber || '',
          aadharNumber: personalData.aadharNumber || '',
          dobInWords: personalData.dobInWords || '',
        };
        return extractedPersonal;
      case 'address':
        const presentAddr = applicationData.presentAddress || {};
        const permanentAddr = applicationData.permanentAddress || {};
        return {
          // Present address fields
          presentAddress: presentAddr.addressLine || '',
          presentState: presentAddr.stateId ? String(presentAddr.stateId) : '',
          presentDistrict: presentAddr.districtId ? String(presentAddr.districtId) : '',
          presentZone: presentAddr.zoneId ? String(presentAddr.zoneId) : '',
          presentDivision: presentAddr.divisionId ? String(presentAddr.divisionId) : '',
          presentPoliceStation: presentAddr.policeStationId ? String(presentAddr.policeStationId) : '',
          presentSince: presentAddr.sinceResiding ? new Date(presentAddr.sinceResiding).toISOString().split('T')[0] : '',
          // Permanent address fields
          permanentAddress: permanentAddr.addressLine || '',
          permanentState: permanentAddr.stateId ? String(permanentAddr.stateId) : '',
          permanentDistrict: permanentAddr.districtId ? String(permanentAddr.districtId) : '',
          permanentZone: permanentAddr.zoneId ? String(permanentAddr.zoneId) : '',
          permanentDivision: permanentAddr.divisionId ? String(permanentAddr.divisionId) : '',
          permanentPoliceStation: permanentAddr.policeStationId ? String(permanentAddr.policeStationId) : '',
          // Contact details
          telephoneOffice: presentAddr.telephoneOffice || permanentAddr.telephoneOffice || '',
          telephoneResidence: presentAddr.telephoneResidence || permanentAddr.telephoneResidence || '',
          officeMobileNumber: presentAddr.officeMobileNumber || permanentAddr.officeMobileNumber || '',
          alternativeMobile: presentAddr.alternativeMobile || permanentAddr.alternativeMobile || '',
          // Checkbox state
          sameAsPresent: false,
        };
      case 'occupation':
        const occupationData = applicationData.occupationAndBusiness || {};
        const extracted = {
          occupation: occupationData.occupation || '',
          officeAddress: occupationData.officeAddress || '',
          officeState: occupationData.stateId ? String(occupationData.stateId) : '',
          officeDistrict: occupationData.districtId ? String(occupationData.districtId) : '',
          cropLocation: occupationData.cropLocation || '',
          areaUnderCultivation: occupationData.areaUnderCultivation ? String(occupationData.areaUnderCultivation) : '',
        };
        return extracted;
      case 'criminal':
        return {
          criminalHistories: applicationData.criminalHistories || [],
        };
      case 'license-history':
        return {
          licenseHistories: applicationData.licenseHistories || [],
        };
      case 'license-details':
        const licenseDetailsData = applicationData.licenseDetails || [];
        
        // Return in the new format that matches our form structure
        if (licenseDetailsData.length > 0) {
          // Transform backend data to match frontend form structure
          const transformedLicenseDetails = licenseDetailsData.map((detail: any) => {
            // Extract weapon IDs from requestedWeapons relationship
            const requestedWeaponIds = detail.requestedWeapons 
              ? detail.requestedWeapons.map((weapon: any) => weapon.id)
              : [];
            // Destructure to remove requestedWeapons and keep only the needed fields
            const { requestedWeapons, ...cleanDetail } = detail;
            
            return {
              ...cleanDetail,
              requestedWeaponIds // Override with extracted IDs
            };
          });
          
          return {
            licenseDetails: transformedLicenseDetails
          };
        } else {
          // Return default structure if no data exists
          return {
            licenseDetails: [{
              needForLicense: '',
              armsCategory: '',
              requestedWeaponIds: [],
              areaOfValidity: '',
              ammunitionDescription: '',
              specialConsiderationReason: '',
              licencePlaceArea: '',
              wildBeastsSpecification: ''
            }]
          };
        }
      default:
        return applicationData;
    }
  }

  /**
   * Complete debugging utility - call this to diagnose all issues
   * @param applicantId - The application ID to debug
   */
  static async completeDebugCheck(applicantId: string) {
    // 1. Check token status
    const tokenStatus = debugTokenStatus();
    
    // 2. Test if application exists
    const appStatus = await this.debugApplicationStatus(applicantId);
    
    // 3. Summary
    if (!tokenStatus.cookieToken) {
    }
    
    if (!appStatus.exists) {
    }
    return { tokenStatus, appStatus };
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
        // Validate and format date of birth
        let formattedDateOfBirth = undefined;
        if (formData.dateOfBirth) {
          const dobDate = new Date(formData.dateOfBirth);
          // Check if date is valid
          if (!isNaN(dobDate.getTime())) {
            formattedDateOfBirth = dobDate.toISOString();
          } else {
          }
        }

        return {
          ...formData,
          sex: formData.sex?.toUpperCase(),
          dateOfBirth: formattedDateOfBirth,
        };
      case 'address':
        // Validate and format presentSince date
        let formattedPresentSince = undefined;
        if (formData.presentSince) {
          const presentSinceDate = new Date(formData.presentSince);
          if (!isNaN(presentSinceDate.getTime())) {
            formattedPresentSince = presentSinceDate.toISOString();
          } else {
          }
        }

        return {
          presentAddress: {
            addressLine: formData.presentAddress,
            stateId: parseInt(formData.presentState || '0'),
            districtId: parseInt(formData.presentDistrict || '0'),
            zoneId: parseInt(formData.presentZone || '0'),
            divisionId: parseInt(formData.presentDivision || '0'),
            policeStationId: parseInt(formData.presentPoliceStation || '0'),
            sinceResiding: formattedPresentSince,
            telephoneOffice: formData.telephoneOffice || undefined,
            telephoneResidence: formData.telephoneResidence || undefined,
            officeMobileNumber: formData.officeMobileNumber || undefined,
            alternativeMobile: formData.alternativeMobile || undefined,
          },
          permanentAddress: {
            addressLine: formData.permanentAddress,
            stateId: parseInt(formData.permanentState || '0'),
            districtId: parseInt(formData.permanentDistrict || '0'),
            zoneId: parseInt(formData.permanentZone || '0'),
            divisionId: parseInt(formData.permanentDivision || '0'),
            policeStationId: parseInt(formData.permanentPoliceStation || '0'),
            sinceResiding: formData.presentSince ? new Date(formData.presentSince).toISOString() : undefined,
            // Phone numbers are now only included in presentAddress
          },
        };
      case 'occupation':
        const occupationPayload = {
          occupationAndBusiness: {
            occupation: formData.occupation,
            officeAddress: formData.officeAddress || undefined,
            stateId: parseInt(formData.officeState || formData.stateId || '0'),
            districtId: parseInt(formData.officeDistrict || formData.districtId || '0'),
            cropLocation: formData.cropLocation || undefined,
            areaUnderCultivation: formData.areaUnderCultivation ? parseFloat(formData.areaUnderCultivation) : undefined,
            employerName: formData.employerName || undefined,
            businessDetails: formData.businessDetails || undefined,
            annualIncome: formData.annualIncome || undefined,
            workExperience: formData.workExperience || undefined,
            businessType: formData.businessType || undefined,
          },
        };
        return occupationPayload;
      case 'criminal':
        // The issue: formData.criminalHistories contains backend response data, not form data
        // We need to check if this is fresh form data or stale backend data
        
        const criminalHistories = formData.criminalHistories || [];
        // Check if this is backend response data (has database fields like id, createdAt)
        const isBackendData = criminalHistories.length > 0 && 
          (criminalHistories[0].hasOwnProperty('id') || 
           criminalHistories[0].hasOwnProperty('createdAt') || 
           criminalHistories[0].hasOwnProperty('updatedAt'));
        if (isBackendData) {
        } else {
        }
        
        // Create payload with detailed logging for each field
        const mappedHistories = criminalHistories.map((history: any) => {
          const mapped = {
            isConvicted: history.isConvicted || false,
            isBondExecuted: history.isBondExecuted || false,
            bondDate: history.bondDate || null,
            bondPeriod: history.bondPeriod || null,
            isProhibited: history.isProhibited || false,
            prohibitionDate: history.prohibitionDate || null,
            prohibitionPeriod: history.prohibitionPeriod || null,
            firDetails: history.firDetails || []
          };
          return mapped;
        });
        
        const criminalPayload = {
          criminalHistories: mappedHistories
        };
        
        // Add validation logging
        criminalPayload.criminalHistories.forEach((history: any, index: number) => {
        });
        return criminalPayload;
      case 'license-history':
        const licenseHistoryPayload = {
          licenseHistories: (formData.licenseHistories || []).map((history: any) => ({
            hasAppliedBefore: history.hasAppliedBefore || false,
            dateAppliedFor: history.dateAppliedFor || null,
            previousAuthorityName: history.previousAuthorityName || null,
            previousResult: history.previousResult || null,
            hasLicenceSuspended: history.hasLicenceSuspended || false,
            suspensionAuthorityName: history.suspensionAuthorityName || null,
            suspensionReason: history.suspensionReason || null,
            hasFamilyLicence: history.hasFamilyLicence || false,
            familyMemberName: history.familyMemberName || null,
            familyLicenceNumber: history.familyLicenceNumber || null,
            familyWeaponsEndorsed: history.familyWeaponsEndorsed || [],
            hasSafePlace: history.hasSafePlace || false,
            safePlaceDetails: history.safePlaceDetails || null,
            hasTraining: history.hasTraining || false,
            trainingDetails: history.trainingDetails || null,
          })),
        };
        return licenseHistoryPayload;
      case 'license-details':
        // Check if form data is already in the correct format (new structure)
        if (formData.licenseDetails && Array.isArray(formData.licenseDetails)) {
          // Clean the license details to remove file-related fields and backend-only fields that are handled separately
          const cleanedLicenseDetails = formData.licenseDetails.map(detail => {
            const { uploadedFiles, specialClaimsEvidence, requestedWeapons, ...cleanDetail } = detail;
            return cleanDetail;
          });
          
          const licenseDetailsPayload = {
            licenseDetails: cleanedLicenseDetails
          };
          return licenseDetailsPayload;
        }
        
        // Fallback for old format (legacy support)
        const licenseDetailsPayload = {
          licenseDetails: [{
            needForLicense: formData.needForLicense || undefined,
            armsCategory: formData.armsOption || undefined,
            requestedWeaponIds: formData.weaponId ? [formData.weaponId] : [],
            areaOfValidity: [
              formData.areaDistrict && 'DISTRICT',
              formData.areaState && 'STATE',
              formData.areaIndia && 'INDIA'
            ].filter(Boolean).join(', ') || undefined,
            ammunitionDescription: formData.ammunitionDescription || undefined,
            specialConsiderationReason: formData.specialClaims || undefined,
            licencePlaceArea: formData.licencePlaceArea || undefined,
            wildBeastsSpecification: formData.wildBeastsSpecification || undefined,
          }],
        };
        return licenseDetailsPayload;
      default:
        return formData;
    }
  }
}