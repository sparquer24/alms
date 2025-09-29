// Centralized steps and basic field metadata for the Fresh Application Form
export const formSteps = [
    { key: 'personal', title: 'Personal Information', description: 'Enter your personal details' },
    { key: 'address', title: 'Address Details', description: 'Provide your address information' },
    { key: 'occupation', title: 'Occupation & Business', description: 'Enter your occupation and business details' },
    { key: 'criminal', title: 'Criminal History', description: 'Provide information about any criminal history' },
    { key: 'license', title: 'License Details', description: 'Enter details about the license you are applying for' },
    { key: 'biometric', title: 'Biometric Information', description: 'Upload your biometric information' },
    { key: 'documents', title: 'Documents Upload', description: 'Upload required documents' },
    { key: 'preview', title: 'Preview', description: 'Review your application details' },
    { key: 'declaration', title: 'Declaration', description: 'Review and submit your application' }
];

// Minimal map of step -> required fields (used by the lightweight validator)
export const requiredFieldsByStep: Record<string, string[]> = {
    personal: ['applicantName', 'applicantMobile', 'applicantDateOfBirth'],
    address: ['applicantAddress', 'presentState', 'presentDistrict', 'presentPincode', 'presentPoliceStation'],
    occupation: [],
    criminal: [],
    license: ['weaponType', 'licenseType'],
    biometric: [],
    documents: [],
    preview: [],
    declaration: ['declaration.agreeToTruth']
};

// Central FormData interface matching the full form shape
export interface FormData {
    applicantName: string;
    applicantMobile: string;
    applicantEmail: string;
    fatherName?: string;
    gender?: string;
    dateOfBirth?: string;
    age?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    licenseType?: string;
    weaponType?: string;
    purposeOfWeapon?: string;
    photoUrl?: string;
    idProofUrl?: string;
    addressProofUrl?: string;
    idProofUploaded?: boolean;
    addressProofUploaded?: boolean;
    photographUploaded?: boolean;
    panCardUploaded?: boolean;
    characterCertificateUploaded?: boolean;
    medicalCertificateUploaded?: boolean;
    trainingCertificateUploaded?: boolean;
    otherStateLicenseUploaded?: boolean;
    aliceAcknowledgementNumber?: string;
    applicantMiddleName?: string;
    applicantLastName?: string;
    applicationFilledBy?: string;
    placeOfBirth?: string;
    panNumber?: string;
    aadharNumber?: string;
    dateOfBirthInWords?: string;
    presentAddress?: string;
    presentState?: string;
    presentDistrict?: string;
    residingSince?: string;
    jurisdictionPoliceStation?: string;
    permanentAddress?: string;
    permanentState?: string;
    permanentDistrict?: string;
    permanentJurisdictionPoliceStation?: string;
    officePhone?: string;
    residencePhone?: string;
    officeMobile?: string;
    alternativeMobile?: string;
    occupation?: string;
    officeBusinessAddress?: string;
    officeBusinessState?: string;
    officeBusinessDistrict?: string;
    cropProtectionLocation?: string;
    cultivatedArea?: string;
    convicted?: boolean;
    criminalHistory?: Array<{
        firNumber?: string;
        sectionOfLaw?: string;
        policeStation?: string;
        unit?: string;
        district?: string;
        state?: string;
        offence?: string;
        sentence?: string;
        dateOfSentence?: string;
    }>;
    previouslyApplied?: boolean;
    previousApplicationDetails?: {
        dateApplied?: string;
        licenseName?: string;
        authority?: string;
        result?: string;
        status?: 'approved' | 'pending' | 'rejected';
        rejectedLicenseCopy?: string;
    };
    licenseSuspended?: boolean;
    licenseSuspensionDetails?: {
        licenseDetails?: string;
    };
    licenseNeed?: string;
    armsDescription?: string;
    armsCategory?: 'restricted' | 'permissible';
    carryArea?: 'district' | 'state' | 'throughoutIndia';
    specialConsideration?: string;
    specialConsiderationDocuments?: {
        aadharCard?: string;
        panCard?: string;
        trainingCertificate?: string;
        otherStateLicense?: string;
        existingLicense?: string;
        safeCustody?: string;
        medicalReports?: string;
    };
    formIVDetails?: {
        licenseArea?: string;
        wildBeastSpecification?: string;
    };
    signature?: string;
    irisScan?: string;
    photograph?: string;
    [key: string]: string | undefined | boolean | any;
}

// Export a single initial form data object to keep the shape centralized
export const initialFormData: FormData = {
    applicantName: '',
    applicantMobile: '',
    applicantEmail: '',
    fatherName: '',
    gender: '',
    dateOfBirth: '',
    age: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    licenseType: 'Regular',
    weaponType: '',
    purposeOfWeapon: '',
    photoUrl: '',
    idProofUrl: '',
    addressProofUrl: '',
    idProofUploaded: false,
    addressProofUploaded: false,
    photographUploaded: false,
    panCardUploaded: false,
    characterCertificateUploaded: false,
    medicalCertificateUploaded: false,
    trainingCertificateUploaded: false,
    otherStateLicenseUploaded: false,
    aliceAcknowledgementNumber: '',
    applicantMiddleName: '',
    applicantLastName: '',
    applicationFilledBy: '',
    placeOfBirth: '',
    panNumber: '',
    aadharNumber: '',
    dateOfBirthInWords: '',
    presentAddress: '',
    presentState: '',
    presentDistrict: '',
    residingSince: '',
    jurisdictionPoliceStation: '',
    permanentAddress: '',
    permanentState: '',
    permanentDistrict: '',
    permanentJurisdictionPoliceStation: '',
    officePhone: '',
    residencePhone: '',
    officeMobile: '',
    alternativeMobile: '',
    occupation: '',
    officeBusinessAddress: '',
    officeBusinessState: '',
    officeBusinessDistrict: '',
    cropProtectionLocation: '',
    cultivatedArea: '',
    convicted: false,
    criminalHistory: [],
    previouslyApplied: false,
    previousApplicationDetails: {
        dateApplied: '',
        licenseName: '',
        authority: '',
        result: '',
        status: 'pending',
        rejectedLicenseCopy: ''
    },
    licenseSuspended: false,
    licenseSuspensionDetails: { licenseDetails: '' },
    licenseNeed: '',
    armsDescription: '',
    armsCategory: 'permissible',
    carryArea: 'district',
    specialConsideration: '',
    specialConsiderationDocuments: {},
    formIVDetails: { licenseArea: '', wildBeastSpecification: '' },
    signature: '',
    irisScan: '',
    photograph: ''
};
export default {};
