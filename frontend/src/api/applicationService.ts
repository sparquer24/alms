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
  telOffice?: string;
  telResidence?: string;
  mobOffice?: string;
  mobAlternative?: string;

  // Occupation Fields
  occupation?: string;
  officeAddress?: string;
  officeState?: string;
  officeDistrict?: string;
  stateId?: string;
  districtId?: string;
  cropLocation?: string;
  cropArea?: string;
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
        console.error('❌ Invalid date of birth:', personalData.dateOfBirth);
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

    console.log('🔵 Creating new application (POST):', '/application-form/personal-details', cleanPayload);
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
    const payload = this.preparePayload(formData, section);

    const cleanPayload = Object.fromEntries(
      Object.entries(payload).filter(([_, value]) => value !== undefined)
    );

    const url = `/application-form/${applicantId}`;
    console.log(`🟡 Updating application (PATCH) - URL: ${url}, Section: ${section}, ID: ${applicantId}`, cleanPayload);

    return await patchData(url, cleanPayload);
  }

  /**
   * Get application data by ID
   * @param applicantId - The application ID
   * @returns Application data
   */
  static async getApplication(applicantId: string) {
    const url = `/application-form?applicationId=${applicantId}`;
    console.log('🟢 Fetching application (GET):', url);
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
        return applicationData.personalDetails || {};
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
          telOffice: presentAddr.telephoneOffice || permanentAddr.telephoneOffice || '',
          telResidence: presentAddr.telephoneResidence || permanentAddr.telephoneResidence || '',
          mobOffice: presentAddr.officeMobileNumber || permanentAddr.officeMobileNumber || '',
          mobAlternative: presentAddr.alternativeMobile || permanentAddr.alternativeMobile || '',
          // Checkbox state
          sameAsPresent: false,
        };
      case 'occupation':
        const occupationData = applicationData.occupationAndBusiness || {};
        console.log('🔵 Extracting occupation data:', occupationData);
        const extracted = {
          occupation: occupationData.occupation || '',
          officeAddress: occupationData.officeAddress || '',
          officeState: occupationData.stateId ? String(occupationData.stateId) : '',
          officeDistrict: occupationData.districtId ? String(occupationData.districtId) : '',
          cropLocation: occupationData.cropLocation || '',
          cropArea: occupationData.areaUnderCultivation ? String(occupationData.areaUnderCultivation) : '',
        };
        console.log('🟢 Extracted occupation form data:', extracted);
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
        return applicationData.licenseDetails || {};
      default:
        return applicationData;
    }
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
            console.error('❌ Invalid date of birth:', formData.dateOfBirth);
          }
        }

        return {
          ...formData,
          sex: formData.sex?.toUpperCase(),
          dateOfBirth: formattedDateOfBirth,
        };
      case 'address':
        console.log('🟠 Preparing address payload:', formData);

        // Validate and format presentSince date
        let formattedPresentSince = undefined;
        if (formData.presentSince) {
          const presentSinceDate = new Date(formData.presentSince);
          if (!isNaN(presentSinceDate.getTime())) {
            formattedPresentSince = presentSinceDate.toISOString();
          } else {
            console.error('❌ Invalid presentSince date:', formData.presentSince);
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
            telephoneOffice: formData.telOffice || undefined,
            telephoneResidence: formData.telResidence || undefined,
            officeMobileNumber: formData.mobOffice || undefined,
            alternativeMobile: formData.mobAlternative || undefined,
          },
          permanentAddress: {
            addressLine: formData.permanentAddress,
            stateId: parseInt(formData.permanentState || '0'),
            districtId: parseInt(formData.permanentDistrict || '0'),
            zoneId: parseInt(formData.permanentZone || '0'),
            divisionId: parseInt(formData.permanentDivision || '0'),
            policeStationId: parseInt(formData.permanentPoliceStation || '0'),
            sinceResiding: formData.presentSince ? new Date(formData.presentSince).toISOString() : undefined,
            telephoneOffice: formData.telOffice || undefined,
            telephoneResidence: formData.telResidence || undefined,
            officeMobileNumber: formData.mobOffice || undefined,
            alternativeMobile: formData.mobAlternative || undefined,
          },
        };
      case 'occupation':
        console.log('🟠 Preparing occupation payload from form data:', formData);
        const occupationPayload = {
          occupationAndBusiness: {
            occupation: formData.occupation,
            officeAddress: formData.officeAddress || undefined,
            stateId: parseInt(formData.officeState || formData.stateId || '0'),
            districtId: parseInt(formData.officeDistrict || formData.districtId || '0'),
            cropLocation: formData.cropLocation || undefined,
            areaUnderCultivation: (formData.cropArea || formData.areaUnderCultivation) ? parseFloat((formData.cropArea || formData.areaUnderCultivation)!) : undefined,
            employerName: formData.employerName || undefined,
            businessDetails: formData.businessDetails || undefined,
            annualIncome: formData.annualIncome || undefined,
            workExperience: formData.workExperience || undefined,
            businessType: formData.businessType || undefined,
          },
        };
        console.log('🟢 Final occupation payload:', occupationPayload);
        return occupationPayload;
      case 'criminal':
        console.log('🟠 Preparing criminal payload from form data:', formData);
        const criminalPayload = {
          criminalHistories: (formData.criminalHistories || []).map((history: any) => ({
            isConvicted: history.isConvicted || false,
            convictionDetails: history.convictionDetails || undefined,
            isBondExecuted: history.isBondExecuted || false,
            bondDetails: history.bondDetails || undefined,
            isProhibited: history.isProhibited || false,
            prohibitionDetails: history.prohibitionDetails || undefined,
          })),
        };
        console.log('🟢 Final criminal payload:', criminalPayload);
        return criminalPayload;
      case 'license-history':
        console.log('🟠 Preparing license history payload from form data:', formData);
        const licenseHistoryPayload = {
          licenseHistories: (formData.licenseHistories || []).map((history: any) => ({
            hasAppliedBefore: history.hasAppliedBefore || false,
            applicationDetails: history.applicationDetails || undefined,
            hasLicenceSuspended: history.hasLicenceSuspended || false,
            suspensionDetails: history.suspensionDetails || undefined,
            hasFamilyLicence: history.hasFamilyLicence || false,
            familyLicenceDetails: history.familyLicenceDetails || undefined,
            hasSafePlace: history.hasSafePlace || false,
            safePlaceDetails: history.safePlaceDetails || undefined,
            hasTraining: history.hasTraining || false,
            trainingDetails: history.trainingDetails || undefined,
          })),
        };
        console.log('🟢 Final license history payload:', licenseHistoryPayload);
        return licenseHistoryPayload;
      case 'license-details':
        console.log('🟠 Preparing license details payload from form data:', formData);
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
        console.log('🟢 Final license details payload:', licenseDetailsPayload);
        return licenseDetailsPayload;
      default:
        return formData;
    }
  }
}