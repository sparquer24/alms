// Application Request Types
export interface CreateApplicationRequest {
  applicantName: string;
  applicantMobile: string;
  applicantEmail: string;
  fatherName: string;
  gender: string;
  dob: string;
  address: string;
  applicationType: string;
  weaponType: string;
  weaponReason: string;
  licenseType: string;
  licenseValidity: string;
  isPreviouslyHeldLicense: boolean;
  previousLicenseNumber?: string;
  hasCriminalRecord: boolean;
  criminalRecordDetails?: string;
  comments?: string;
}
