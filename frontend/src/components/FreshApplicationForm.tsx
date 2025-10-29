"use client";

import React, { useState, useEffect, useRef } from 'react';
import { ApplicationApi, ReportApi, DocumentApi } from '../config/APIClient';
import { useAuth } from '../config/auth';
import CascadingLocationSelect from './CascadingLocationSelect';
import { WeaponsService } from '../services/weapons';

// BackButton component to navigate to previous route
const BackButton: React.FC = () => {
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
      style={{ marginBottom: '1rem' }}
    >
      Back
    </button>
  );
};

// Create a proper interface for the form data
interface FormData {
  applicantName: string;
  applicantMobile: string;
  applicantEmail: string;
  fatherName: string;
  gender: string;
  dateOfBirth: string;
  age: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  licenseType: string;
  weaponType: string;
  purposeOfWeapon: string;
  photoUrl?: string;
  idProofUrl?: string;
  addressProofUrl?: string;
  // Document upload fields
  idProofUploaded?: boolean;
  addressProofUploaded?: boolean;
  photographUploaded?: boolean;
  panCardUploaded?: boolean;
  characterCertificateUploaded?: boolean;
  medicalCertificateUploaded?: boolean;
  trainingCertificateUploaded?: boolean;
  otherStateLicenseUploaded?: boolean;

  // New fields from freshFormFilde.md
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
  convictionDetails?: {
    firNumber?: string;
    underSection?: string;
    policeStation?: string;
    unit?: string;
    district?: string;
    state?: string;
    offence?: string;
    sentence?: string;
    dateOfSentence?: string;
  }[];
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
  [key: string]: string | undefined | boolean | any; // For other dynamic fields
}

// Interface for document files
interface DocumentFile {
  file: File;
  preview: string;
}

interface FreshApplicationFormProps {
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}

// Form step tabs - expanded based on FreshLicenseForm.jsx
const formSteps = [
  { title: 'Personal Information', description: 'Enter your personal details' },
  { title: 'Address Details', description: 'Provide your address information' },
  { title: 'Occupation & Business', description: 'Enter your occupation and business details' },
  { title: 'Criminal History', description: 'Provide information about any criminal history' },
  { title: 'License Details', description: 'Enter details about the license you are applying for' },
  { title: 'Biometric Information', description: 'Upload your biometric information' },
  { title: 'Documents Upload', description: 'Upload required documents' },
  { title: 'Preview', description: 'Review your application details' },
  { title: 'Declaration', description: 'Review and submit your application' }
];

export default function FreshApplicationForm({ onSubmit, onCancel }: FreshApplicationFormProps) {
  const { userId, userRole } = useAuth();
  const [formStep, setFormStep] = useState(0); // Start at 0 to match arrays
  const [districts, setDistricts] = useState<string[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [policeStations, setPoliceStations] = useState<{id: number, name: string}[]>([]);
  const [loadingPoliceStations, setLoadingPoliceStations] = useState(true);
  const [weapons, setWeapons] = useState<{id: number, name: string}[]>([]);
  const [loadingWeapons, setLoadingWeapons] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiErrorDetails, setApiErrorDetails] = useState<any>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  // Simple helpers for preview rendering
  const YesNo = (v?: any) => (v === true || v === 'yes' || v === 'Yes') ? 'Yes' : (v === false || v === 'no' || v === 'No') ? 'No' : (v ?? '-');
  const listOrDash = (arr?: any[]) => (Array.isArray(arr) && arr.length > 0 ? arr.join(', ') : '-');
  const Field: React.FC<{ label: string; value: any }> = ({ label, value }) => {
    const displayValue = (() => {
      if (value === null || value === undefined) return '-';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value);
    })();
    
    return (
      <p className="flex"><span className="text-gray-500 min-w-[200px] inline-block">{label}:</span> <span className="ml-1 break-all">{displayValue}</span></p>
    );
  };

  // Helper to set nested values like `formIVDetails.licenseArea`
  const setValueByPath = (obj: any, path: string, value: any) => {
    const keys = path.split('.');
    const last = keys.pop() as string;
    const newObj = { ...obj };
    let curr: any = newObj;
    for (const k of keys) {
      curr[k] = { ...(curr[k] ?? {}) };
      curr = curr[k];
    }
    curr[last] = value;
    return newObj;
  };

  // Ref for scrollable form content div
  const formContentRef = React.useRef<HTMLDivElement>(null);

  // Add effect to monitor form step changes and scroll to top of scrollable div
  useEffect(() => {
    if (formContentRef.current) {
      formContentRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [formStep]);

  // Store document files for preview
  const [documentFiles, setDocumentFiles] = useState<Record<string, DocumentFile | null>>({
    idProofUploaded: null,
    addressProofUploaded: null,
    photographUploaded: null,
    characterCertificateUploaded: null,
    medicalCertificateUploaded: null,
    trainingCertificateUploaded: null,
    panCardUploaded: null,
    otherStateLicenseUploaded: null
  });

  const [formData, setFormData] = useState({
    // Personal Information
    applicantName: '',
    applicantMiddleName: '',
    applicantLastName: '',
    applicantMobile: '',
    applicantEmail: '',
    fatherName: '',
    motherName: '',
    maritalStatus: '',
    nationality: 'Indian',
    religion: '',
    category: '',
    bloodGroup: '',
    voterId: '',
    panNumber: '',
    aadharNumber: '',
    applicantIdType: 'aadhar',
    applicantIdNumber: '',
    applicantGender: '',
    applicantDateOfBirth: '',
    dateOfBirthInWords: '',
    placeOfBirth: '',
    applicationFilledBy: '',
    // Document Upload fields
    idProofUploaded: false,
    addressProofUploaded: false,
    photographUploaded: false,
    panCardUploaded: false,
    characterCertificateUploaded: false,
    medicalCertificateUploaded: false,
    trainingCertificateUploaded: false,
    otherStateLicenseUploaded: false,
    // Declaration object for checkboxes
    declaration: {
      agreeToTruth: false,
      understandLegalConsequences: false,
      agreeToTerms: false,
    },

    // Address Information
    applicantAddress: '',
    presentState: '',
    presentDistrict: '',
    presentPincode: '',
    presentPoliceStation: '',
    jurisdictionPoliceStation: '',
    permanentAddress: '',
    permanentState: '',
    permanentDistrict: '',
    permanentPincode: '',
    permanentPoliceStation: '',
    sameAsPresent: false,
    residingSince: '',
  // IDs captured from cascading selector for present address
  presentStateId: undefined as any,
  presentDistrictId: undefined as any,
  presentZoneId: undefined as any,
  presentDivisionId: undefined as any,
  presentStationId: undefined as any,
  // Permanent IDs (from cascading selector)
  permanentStateId: undefined as any,
  permanentDistrictId: undefined as any,
  permanentZoneId: undefined as any,
  permanentDivisionId: undefined as any,
  permanentStationId: undefined as any,

    // Contact Information
    officePhone: '',
    residencePhone: '',
    officeMobile: '',
    alternativeMobile: '',

    // Occupation Information
    occupation: '',
    officeBusinessAddress: '',
    officeBusinessState: '',
    officeBusinessDistrict: '',
    cropProtectionLocation: '',
    cultivatedArea: '',

    // License Information
    applicationType: 'New License',
    weaponType: '',
    weaponReason: '',
    licenseType: 'Regular',
    licenseValidity: '3',
  weaponId: undefined as any,

    // Legacy fields (now part of arrays)
    convicted: false,

    // Criminal History (Array)
    criminalHistory: [
      {
        convicted: false,
        isCriminalCasePending: 'No',
        firNumber: '',
        policeStation: '',
        sectionOfLaw: '',
        dateOfOffence: '',
        caseStatus: ''
      }
    ],

    // License History (Array)
    licenseHistory: [
      {
        hasAppliedBefore: false,
        hasOtherApplications: false,
        familyMemberHasArmsLicense: false,
        hasSafePlaceForArms: true,
        hasUndergoneTraining: false,
        hasPreviousLicense: 'no',
        previousLicenseNumber: '',
        licenseIssueDate: '',
        licenseExpiryDate: '',
        issuingAuthority: '',
        isLicenseRenewed: 'No',
        renewalDate: '',
        renewingAuthority: ''
      }
    ],

    // Declarations
    hasCriminalRecord: 'no',
    criminalRecordDetails: '',
    hasSubmittedTrueInfo: false,

    // New fields from freshFormFilde.md
    aliceAcknowledgementNumber: '',
    convictionDetails: [],
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
    licenseSuspensionDetails: {
      licenseDetails: ''
    },
    licenseNeed: '',
    armsDescription: '',
    armsCategory: 'permissible',
    carryArea: 'district',
    specialConsideration: '',
    specialConsiderationDocuments: {
      aadharCard: '',
      panCard: '',
      trainingCertificate: '',
      otherStateLicense: '',
      existingLicense: '',
      safeCustody: '',
      medicalReports: ''
    },
    formIVDetails: {
      licenseArea: '',
      wildBeastSpecification: ''
    },
    signature: '',
    irisScan: '',
    photograph: '',

    // Additional fields needed for API
    weaponIds: [] as string[], // For requestedWeaponIds
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => setValueByPath(prev, name, checked));
    } else if (type === 'radio') {
      // Radios generally set string values; keep as-is unless we handle booleans separately
      setFormData(prev => setValueByPath(prev, name, value));
    } else if (type === 'file') {
      const files = (e.target as HTMLInputElement).files;
      const fileName = files && files[0] ? files[0].name : '';
      setFormData(prev => setValueByPath(prev, name, fileName));
    } else {
      setFormData(prev => setValueByPath(prev, name, value));
    }

    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Dedicated handler for boolean radios like `convicted`
  const handleBooleanRadioChange = (field: string, bool: boolean) => {
    setFormData(prev => setValueByPath(prev, field, bool));
  };

  // Handle adding new criminal history entry
  const addCriminalHistoryEntry = () => {
    setFormData(prev => ({
      ...prev,
      criminalHistory: [
        ...prev.criminalHistory,
        {
          convicted: false,
          isCriminalCasePending: 'No',
          firNumber: '',
          policeStation: '',
          sectionOfLaw: '',
          dateOfOffence: '',
          caseStatus: ''
        }
      ]
    }));
  };

  // Handle removing criminal history entry
  const removeCriminalHistoryEntry = (index: number) => {
    setFormData(prev => ({
      ...prev,
      criminalHistory: prev.criminalHistory.filter((_, i) => i !== index)
    }));
  };

  // Handle adding new license history entry
  const addLicenseHistoryEntry = () => {
    setFormData(prev => ({
      ...prev,
      licenseHistory: [
        ...prev.licenseHistory,
        {
          hasAppliedBefore: false,
          hasOtherApplications: false,
          familyMemberHasArmsLicense: false,
          hasSafePlaceForArms: true,
          hasUndergoneTraining: false,
          hasPreviousLicense: 'no',
          previousLicenseNumber: '',
          licenseIssueDate: '',
          licenseExpiryDate: '',
          issuingAuthority: '',
          isLicenseRenewed: 'No',
          renewalDate: '',
          renewingAuthority: ''
        }
      ]
    }));
  };

  // Handle removing license history entry
  const removeLicenseHistoryEntry = (index: number) => {
    setFormData(prev => ({
      ...prev,
      licenseHistory: prev.licenseHistory.filter((_, i) => i !== index)
    }));
  };

  // Handle array field changes
  const handleArrayFieldChange = (arrayName: string, index: number, fieldName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: Array.isArray(prev[arrayName as keyof typeof prev])
        ? (prev[arrayName as keyof typeof prev] as any[]).map((item: any, i: number) =>
          i === index ? { ...item, [fieldName]: value } : item
        )
        : []
    }));
  };

  // Handle document file upload
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];

      // Basic validation: size < 5MB and allowed types
      const allowed = ['application/pdf', 'image/jpeg', 'image/png'];
      const maxBytes = 5 * 1024 * 1024;
      if (!allowed.includes(file.type)) {
        setErrors(prev => ({ ...prev, [docId]: 'Invalid file type. Allowed: PDF, JPG, PNG' }));
        return;
      }
      if (file.size > maxBytes) {
        setErrors(prev => ({ ...prev, [docId]: 'File too large. Max size is 5MB' }));
        return;
      }

      // Create a file URL for preview
      const filePreview = URL.createObjectURL(file);

      // Store the file and its preview
      setDocumentFiles(prev => ({
        ...prev,
        [docId]: { file, preview: filePreview }
      }));

      // Update form data to indicate the file has been uploaded
      setFormData(prev => ({
        ...prev,
        [docId]: true
      }));

      // Clear error if exists
      if (errors[docId]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[docId];
          return newErrors;
        });
      }
    }
  };

  // Clean up file preview URLs when component unmounts
  React.useEffect(() => {
    return () => {
      // Revoke all URL objects to prevent memory leaks
      Object.values(documentFiles).forEach(docFile => {
        if (docFile && docFile.preview) {
          URL.revokeObjectURL(docFile.preview);
        }
      });
    };
  }, [documentFiles]);

  // Fetch Telangana districts for address selection (via internal API, with fallback)
  React.useEffect(() => {
    const fetchDistricts = async () => {
      try {
        const { apiClient } = await import('../config/authenticatedApiClient');
        // 1) Fetch states and find Telangana id
        const statesRes: any = await apiClient.get('/locations/states');
        const states = Array.isArray(statesRes?.data) ? statesRes.data : statesRes?.body || statesRes;
        const telangana = (states || []).find((s: any) => (s?.name || '').toLowerCase() === 'telangana');

        if (telangana?.id) {
          // 2) Fetch districts for Telangana
          const districtsRes: any = await apiClient.get('/locations/districts', { stateId: telangana.id });
          const districtsList = Array.isArray(districtsRes?.data) ? districtsRes.data : districtsRes?.body || districtsRes;
          const names = (districtsList || []).map((d: any) => d?.name).filter(Boolean);
          if (names?.length) {
            setDistricts([...names].sort());
            return;
          }
        }

        // Fallback if Telangana not found or districts empty
        const fallbackDistricts = [
          'Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagtial', 'Jangaon',
          'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar',
          'Khammam', 'Komaram Bheem Asifabad', 'Mahabubabad', 'Mahabubnagar',
          'Mancherial', 'Medak', 'Medchal-Malkajgiri', 'Mulugu', 'Nagarkurnool',
          'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli', 'Rajanna Sircilla',
          'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy',
          'Warangal Rural', 'Warangal Urban', 'Yadadri Bhuvanagiri'
        ];
        setDistricts(fallbackDistricts.sort());
      } catch (err) {
        // Fallback districts in case API fails
        const fallbackDistricts = [
          'Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagtial', 'Jangaon',
          'Jayashankar Bhupalpally', 'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar',
          'Khammam', 'Komaram Bheem Asifabad', 'Mahabubabad', 'Mahabubnagar',
          'Mancherial', 'Medak', 'Medchal-Malkajgiri', 'Mulugu', 'Nagarkurnool',
          'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli', 'Rajanna Sircilla',
          'Rangareddy', 'Sangareddy', 'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy',
          'Warangal Rural', 'Warangal Urban', 'Yadadri Bhuvanagiri'
        ];
        setDistricts(fallbackDistricts.sort());
      } finally {
        setLoadingDistricts(false);
      }
    };

    fetchDistricts();
  }, []);

  // Fetch weapons for Step 5 (License Details)
  React.useEffect(() => {
    const loadWeapons = async () => {
      try {
        setLoadingWeapons(true);
        const list = await WeaponsService.getAll();
        const items = (list || []).map(w => ({ id: w.id, name: w.name })) as { id: number, name: string }[];
        setWeapons(items);
      } catch (e) {
        setWeapons([
          { id: 1, name: 'Pistol' },
          { id: 2, name: 'Revolver' },
          { id: 3, name: 'Rifle' },
          { id: 4, name: 'Shotgun' },
        ]);
      } finally {
        setLoadingWeapons(false);
      }
    };
    loadWeapons();
  }, []);

  // Map changes from cascading selector to our local form values
  const handlePresentLocationChange = (sel: any) => {
    setFormData(prev => ({
      ...prev,
      presentState: sel?.state?.name || '',
      presentDistrict: sel?.district?.name || '',
      presentPoliceStation: sel?.station?.name || '',
      jurisdictionPoliceStation: sel?.station?.name || prev.jurisdictionPoliceStation,
      presentStateId: sel?.state?.id,
      presentDistrictId: sel?.district?.id,
      presentZoneId: sel?.zone?.id,
      presentDivisionId: sel?.division?.id,
      presentStationId: sel?.station?.id,
    }));
  };

  // Fetch police stations
  React.useEffect(() => {
    const fetchPoliceStations = async () => {
      try {
        const { apiClient } = await import('../config/authenticatedApiClient');
        const response: any = await apiClient.get('/locations/police-stations');
        const policeStationsList = Array.isArray(response?.data) ? response.data : response?.body || response;
        
        if (policeStationsList && policeStationsList.length > 0) {
          const formattedStations = policeStationsList.map((station: any) => ({
            id: station.id,
            name: station.name
          }));
          setPoliceStations(formattedStations.sort((a: { name: string; }, b: { name: any; }) => a.name.localeCompare(b.name)));
        } else {
          // Fallback police stations
          const fallbackStations = [
            { id: 1, name: 'Central Police Station' },
            { id: 2, name: 'North Police Station' },
            { id: 3, name: 'South Police Station' },
            { id: 4, name: 'East Police Station' },
            { id: 5, name: 'West Police Station' },
            { id: 6, name: 'Cyber Crime Police Station' },
            { id: 7, name: 'Traffic Police Station' }
          ];
          setPoliceStations(fallbackStations);
        }
      } catch (err) {
        // Fallback police stations in case API fails
        const fallbackStations = [
          { id: 1, name: 'Central Police Station' },
          { id: 2, name: 'North Police Station' },
          { id: 3, name: 'South Police Station' },
          { id: 4, name: 'East Police Station' },
          { id: 5, name: 'West Police Station' },
          { id: 6, name: 'Cyber Crime Police Station' },
          { id: 7, name: 'Traffic Police Station' }
        ];
        setPoliceStations(fallbackStations);
      } finally {
        setLoadingPoliceStations(false);
      }
    };

    fetchPoliceStations();
  }, []);

  // Keep permanent address auto-filled and in sync while "same as present" is checked
  React.useEffect(() => {
    if (!formData.sameAsPresent) return;

    setFormData(prev => {
      const next = {
        ...prev,
        permanentAddress: prev.applicantAddress,
        permanentState: prev.presentState,
        permanentDistrict: prev.presentDistrict,
        permanentPincode: prev.presentPincode,
        permanentPoliceStation: prev.presentPoliceStation,
        permanentStateId: prev.presentStateId,
        permanentDistrictId: prev.presentDistrictId,
        permanentZoneId: prev.presentZoneId,
        permanentDivisionId: prev.presentDivisionId,
        permanentStationId: prev.presentStationId,
      } as typeof prev;

      const unchanged =
        prev.permanentAddress === next.permanentAddress &&
        prev.permanentState === next.permanentState &&
        prev.permanentDistrict === next.permanentDistrict &&
        prev.permanentPincode === next.permanentPincode &&
        prev.permanentPoliceStation === next.permanentPoliceStation &&
        prev.permanentStateId === next.permanentStateId &&
        prev.permanentDistrictId === next.permanentDistrictId &&
        prev.permanentZoneId === next.permanentZoneId &&
        prev.permanentDivisionId === next.permanentDivisionId &&
        prev.permanentStationId === next.permanentStationId;

      return unchanged ? prev : next;
    });
  }, [
    formData.sameAsPresent,
    formData.applicantAddress,
    formData.presentState,
    formData.presentDistrict,
    formData.presentPincode,
    formData.presentPoliceStation,
    formData.presentStateId,
    formData.presentDistrictId,
    formData.presentZoneId,
    formData.presentDivisionId,
    formData.presentStationId,
  ]);

  // Validate form fields for current step
  const validateCurrentStep = () => {
    try {
      const newErrors: Record<string, string> = {};

      if (formStep === 0) {
        // Personal Information Validation
        if (!formData.applicantName) newErrors.applicantName = 'Applicant name is required';
        if (!formData.applicantMobile) {
          newErrors.applicantMobile = 'Mobile number is required';
        } else if (!/^[0-9]{10}$/.test(formData.applicantMobile)) {
          newErrors.applicantMobile = 'Please enter a valid 10-digit mobile number';
        }

        if (!formData.applicantEmail) {
          newErrors.applicantEmail = 'Email is required';
        } else if (!/^\S+@\S+\.\S+$/.test(formData.applicantEmail)) {
          newErrors.applicantEmail = 'Please enter a valid email address';
        }

        if (!formData.applicantGender) newErrors.applicantGender = 'Please select gender';
        if (!formData.applicantDateOfBirth) newErrors.applicantDateOfBirth = 'Date of birth is required';
        if (!formData.fatherName) newErrors.fatherName = "Father's name is required";

        if (!formData.applicantIdNumber) {
          newErrors.applicantIdNumber = 'ID number is required';
        } else if (formData.applicantIdType === 'aadhar' && !/^\d{12}$/.test(formData.applicantIdNumber)) {
          newErrors.applicantIdNumber = 'Aadhar number must be exactly 12 digits';
        }
      }

      if (formStep === 1) {
        // Address Validation
        if (!formData.applicantAddress) newErrors.applicantAddress = 'Present address is required';
        if (!formData.presentState) newErrors.presentState = 'Present state is required';
        if (!formData.presentDistrict) newErrors.presentDistrict = 'Present district is required';
        if (!formData.presentPincode) newErrors.presentPincode = 'Present pincode is required';
        if (!formData.presentPoliceStation) newErrors.presentPoliceStation = 'Nearest police station is required';
        if (!formData.jurisdictionPoliceStation) newErrors.jurisdictionPoliceStation = 'Jurisdiction police station is required';

        if (formData.sameAsPresent === false) {
          if (!formData.permanentAddress) newErrors.permanentAddress = 'Permanent address is required';
          if (!formData.permanentState) newErrors.permanentState = 'Permanent state is required';
          if (!formData.permanentDistrict) newErrors.permanentDistrict = 'Permanent district is required';
          if (!formData.permanentPincode) newErrors.permanentPincode = 'Permanent pincode is required';
          if (!formData.permanentPoliceStation) newErrors.permanentPoliceStation = 'Permanent police station is required';
        }
      }

      if (formStep === 2) {
        // Occupation & Business Validation
        if (!formData.occupation) newErrors.occupation = 'Occupation is required';
      }

      if (formStep === 3) {
        // Criminal History Validation
        if (Array.isArray(formData.criminalHistory)) {
          formData.criminalHistory.forEach((record: any, idx: number) => {
            if (record.isCriminalCasePending === 'Yes') {
              if (!record.firNumber) newErrors[`criminalHistory[${idx}].firNumber`] = 'FIR number is required';
              if (!record.policeStation) newErrors[`criminalHistory[${idx}].policeStation`] = 'Police station is required';
              if (!record.sectionOfLaw) newErrors[`criminalHistory[${idx}].sectionOfLaw`] = 'Section of law is required';
              if (!record.dateOfOffence) newErrors[`criminalHistory[${idx}].dateOfOffence`] = 'Date of offence is required';
              if (!record.caseStatus) newErrors[`criminalHistory[${idx}].caseStatus`] = 'Case status is required';
            }
          });
        }
      }

      if (formStep === 4) {
        // Weapon Details Validation
        if (!formData.weaponType) newErrors.weaponType = 'Weapon type is required';
        if (!formData.weaponReason) newErrors.weaponReason = 'Reason for weapon is required';

        // License History Validation
        if (Array.isArray(formData.licenseHistory)) {
          formData.licenseHistory.forEach((licenseRecord: any, idx: number) => {
            if (licenseRecord.hasPreviousLicense === 'yes') {
              if (!licenseRecord.previousLicenseNumber) newErrors[`licenseHistory[${idx}].previousLicenseNumber`] = 'Previous license number is required';
              if (!licenseRecord.licenseIssueDate) newErrors[`licenseHistory[${idx}].licenseIssueDate`] = 'License issue date is required';
              if (!licenseRecord.licenseExpiryDate) newErrors[`licenseHistory[${idx}].licenseExpiryDate`] = 'License expiry date is required';
              if (!licenseRecord.issuingAuthority) newErrors[`licenseHistory[${idx}].issuingAuthority`] = 'Issuing authority is required';

              if (licenseRecord.isLicenseRenewed === 'Yes') {
                if (!licenseRecord.renewalDate) newErrors[`licenseHistory[${idx}].renewalDate`] = 'Renewal date is required';
                if (!licenseRecord.renewingAuthority) newErrors[`licenseHistory[${idx}].renewingAuthority`] = 'Renewing authority is required';
              }
            }
          });
        }
      }

      if (formStep === 5) {
        // Biometric Validation
        // Add any biometric validation if needed
      }

      if (formStep === 6) {
        // Documents Upload Validation
        if (!formData.idProofUploaded) newErrors.idProofUploaded = 'Aadhaar Card is required';
        if (!formData.addressProofUploaded) newErrors.addressProofUploaded = 'Address proof is required';
        if (!formData.photographUploaded) newErrors.photographUploaded = 'Passport Size Photograph is required';
        // Other documents are optional
      }

      if (formStep === 7) {
        // Preview step - no validation needed, just review
      }

      if (formStep === 8) {
        if (formData.hasSubmittedTrueInfo !== true) {
          newErrors.hasSubmittedTrueInfo = 'You must verify that the submitted information is true';
        }
      }

      // Set errors and return validation result
  setErrors(newErrors);
  const isValid = Object.keys(newErrors || {}).length === 0;
      if (!isValid) {
      } else {
      }

      return isValid;
    } catch (error) {
      return false;
    }
  };

  // Handle next step
  const handleNextStep = () => {
    try {
      // Validate current step before proceeding
      const isValid = validateCurrentStep();
      if (isValid) {
        // Make sure we don't go beyond the max step
        if (formStep < formSteps.length - 1) {
          setFormStep(prev => prev + 1);
        }
      } else {
      }
    } catch (error) {
    }
  };

  // Handle previous step
  const handlePreviousStep = () => {
    if (formStep > 0) {
      setFormStep(prev => prev - 1);
    }
  };

  // Handle saving form as draft
  const handleSaveAsDraft = () => {
    try {
      const draftData = {
        formData,
        formStep,
        lastSaved: new Date().toISOString()
      };
      localStorage.setItem('alms-license-draft', JSON.stringify(draftData));
      setSaveMessage({ type: 'success', text: 'Application saved as draft successfully' });

      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    } catch (error) {
      setSaveMessage({ type: 'error', text: 'Failed to save draft. Please try again.' });

      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    }
  };

  // Handle filling test data
  const handleFillTestData = () => {
    // Generate random Aadhaar number (12 digits)
    const generateRandomAadhar = () => {
      return Array.from({ length: 12 }, () => Math.floor(Math.random() * 10)).join('');
    };

    const randomAadhar = generateRandomAadhar();

    const testData = {
      // Personal Information
      applicantName: 'p',
      applicantMiddleName: 'prem',
      applicantLastName: 'kumar',
      applicantMobile: '9876543210',
      applicantEmail: 'prem@example.com',
      fatherName: 'Rajesh Kumar',
      motherName: 'Priya Kumar',
      maritalStatus: 'Single',
      nationality: 'Indian',
      religion: 'Hindu',
      category: 'General',
      bloodGroup: 'O+',
      voterId: 'ABC1234567',
      panNumber: 'ABCDE1234F',
      aadharNumber: randomAadhar,
      applicantIdType: 'aadhar',
      applicantIdNumber: randomAadhar,
      applicantGender: 'male',
      applicantDateOfBirth: '1990-01-15',
      dateOfBirthInWords: 'Fifteenth January Nineteen Ninety',
      placeOfBirth: 'Hyderabad',
      applicationFilledBy: 'Self',
      // Document Upload fields
      idProofUploaded: true,
      addressProofUploaded: true,
      photographUploaded: true,
      panCardUploaded: true,
      characterCertificateUploaded: false,
      medicalCertificateUploaded: false,
      trainingCertificateUploaded: false,
      otherStateLicenseUploaded: false,
      // Declaration object for checkboxes - SET TO TRUE FOR TESTING
      declaration: {
        agreeToTruth: true,
        understandLegalConsequences: true,
        agreeToTerms: true,
      },

      // Address Information
      applicantAddress: '123 Main Street, Jubilee Hills',
      presentState: 'Telangana',
      presentDistrict: 'Hyderabad',
      presentPincode: '500033',
      presentPoliceStation: 'Central Police Station',
      jurisdictionPoliceStation: 'Central Police Station',
      permanentAddress: '123 Main Street, Jubilee Hills',
      permanentState: 'Telangana',
      permanentDistrict: 'Hyderabad',
      permanentPincode: '500033',
      permanentPoliceStation: 'Central Police Station',
      sameAsPresent: true,
      residingSince: '2015-06-01',
  // IDs for cascading selections (mock values)
  presentStateId: 1,
  presentDistrictId: 1,
  presentZoneId: 1,
  presentDivisionId: 1,
  presentStationId: 1,
  permanentStateId: 1,
  permanentDistrictId: 1,
  permanentZoneId: 1,
  permanentDivisionId: 1,
  permanentStationId: 1,

      // Contact Information
      officePhone: '040-12345678',
      residencePhone: '040-87654321',
      officeMobile: '9876543211',
      alternativeMobile: '9876543212',

      // Occupation Information
      occupation: 'Software Engineer',
      officeBusinessAddress: '456 Tech Park, Hitech City',
      officeBusinessState: 'Telangana',
      officeBusinessDistrict: 'Hyderabad',
      cropProtectionLocation: 'N/A',
      cultivatedArea: '0',

      // License Information
      applicationType: 'New License',
      weaponType: 'Revolver',
  weaponId: 2,
      weaponReason: 'Self Protection',
      licenseType: 'Regular',
      licenseValidity: '3',

      // Legacy fields (now part of arrays)
      convicted: false,

      // Criminal History (Array)
      criminalHistory: [
        {
          convicted: false,
          isCriminalCasePending: 'No',
          firNumber: '',
          policeStation: '',
          sectionOfLaw: '',
          dateOfOffence: '',
          caseStatus: ''
        }
      ],

      // License History (Array)
      licenseHistory: [
        {
          hasAppliedBefore: false,
          hasOtherApplications: false,
          familyMemberHasArmsLicense: false,
          hasSafePlaceForArms: true,
          hasUndergoneTraining: false,
          hasPreviousLicense: 'no',
          previousLicenseNumber: '',
          licenseIssueDate: '',
          licenseExpiryDate: '',
          issuingAuthority: '',
          isLicenseRenewed: 'No',
          renewalDate: '',
          renewingAuthority: ''
        }
      ],

      // Declarations
      hasCriminalRecord: 'no',
      criminalRecordDetails: '',
      hasSubmittedTrueInfo: true,

      // New fields from freshFormFilde.md
      aliceAcknowledgementNumber: 'ALMS1757266946852',
      convictionDetails: [],
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
      licenseSuspensionDetails: {
        licenseDetails: ''
      },
      licenseNeed: 'SELF_PROTECTION',
      armsDescription: 'Standard revolver for personal defense',
      armsCategory: 'PERMISSIBLE',
      carryArea: 'Hyderabad',
      specialConsideration: '',
      specialConsiderationDocuments: {
        aadharCard: '',
        panCard: '',
        trainingCertificate: '',
        otherStateLicense: '',
        existingLicense: '',
        safeCustody: '',
        medicalReports: ''
      },
      formIVDetails: {
        licenseArea: 'Hyderabad',
        wildBeastSpecification: ''
      },
      signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      irisScan: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      photograph: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',

      // Additional fields needed for API
      weaponIds: ['1'], // For requestedWeaponIds
    };

    setFormData(testData);
    setSaveMessage({ type: 'success', text: 'Test data filled successfully' });

    // Clear message after 3 seconds
    setTimeout(() => {
      setSaveMessage(null);
    }, 3000);
  };

  // Load draft data if exists
  React.useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('alms-license-draft');
      if (savedDraft) {
        const { formData: savedFormData, formStep: savedFormStep } = JSON.parse(savedDraft);
        const confirmLoad = window.confirm('A saved draft was found. Would you like to load it?');

        if (confirmLoad) {
          setFormData(savedFormData);
          setFormStep(savedFormStep);
        }
      }
    } catch (error) {
    }
  }, []);

  // State to store location data
  const [statesData, setStatesData] = useState<any[]>([]);
  const [districtsData, setDistrictsData] = useState<any[]>([]);

  // Fetch states and districts data for ID mapping
  useEffect(() => {
    const fetchLocationData = async () => {
      try {
        const { apiClient } = await import('../config/authenticatedApiClient');

        // Fetch states
        const statesRes: any = await apiClient.get('/locations/states');
        const states = Array.isArray(statesRes?.data) ? statesRes.data : statesRes?.body || statesRes;
        setStatesData(states || []);

        // Fetch districts for all states (or just Telangana if that's your focus)
        const telangana = (states || []).find((s: any) => (s?.name || '').toLowerCase() === 'telangana');
        if (telangana?.id) {
          const districtsRes: any = await apiClient.get('/locations/districts', { stateId: telangana.id });
          const districtsList = Array.isArray(districtsRes?.data) ? districtsRes.data : districtsRes?.body || districtsRes;
          setDistrictsData(districtsList || []);
        }
      } catch (error) {
      }
    };

    fetchLocationData();
  }, []);

  // Helper function to get state ID from name
  const getStateId = (stateName: string): number => {
    const state = statesData.find(s => s?.name?.toLowerCase() === stateName?.toLowerCase());
    return state?.id || 1; // Default to 1 if not found
  };

  // Helper function to get district ID from name
  const getDistrictId = (districtName: string): number => {
    const district = districtsData.find(d => d?.name?.toLowerCase() === districtName?.toLowerCase());
    return district?.id || 1; // Default to 1 if not found
  };

  // Helper function to get police station ID from name
  const getPoliceStationId = (policeStationName: string): number => {
    const station = policeStations.find(ps => ps.name === policeStationName);
    return station?.id || 1; // Default to 1 if not found
  };

  // Helper function to map weapon types to weapon IDs
  const getWeaponIds = (weaponType: string): string[] => {
    // Prefer selected weaponId when present
    if ((formData as any)?.weaponId) {
      return [String((formData as any).weaponId)];
    }
    // This is a placeholder mapping - you should replace with actual weapon ID mapping
    const weaponMap: Record<string, string[]> = {
      'pistol': ['1'],
      'revolver': ['2'],
      'rifle': ['3'],
      'shotgun': ['4'],
      'air gun': ['5'],
      'air pistol': ['6'],
      // Add more weapon types as needed
    };
    return weaponMap[weaponType?.toLowerCase()] || ['1']; // Default to weapon ID 1
  };

  // Helper function to upload files and get URLs
  const uploadFilesAndGetUrls = async (): Promise<any[]> => {
    const fileUploads: any[] = [];

    // Map of document types to their corresponding file type names
    const fileTypeMap: Record<string, string> = {
      'idProofUploaded': 'AADHAR_CARD',
      'panCardUploaded': 'PAN_CARD',
      'addressProofUploaded': 'OTHER',
      'photographUploaded': 'OTHER',
      'characterCertificateUploaded': 'OTHER',
      'medicalCertificateUploaded': 'MEDICAL_REPORT',
      'trainingCertificateUploaded': 'TRAINING_CERTIFICATE',
      'otherStateLicenseUploaded': 'OTHER_STATE_LICENSE'
    };

    // Helper function to convert file to base64 with ULTRA compression
    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        // For images, compress them aggressively
        if (file.type.startsWith('image/')) {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();

          img.onload = () => {
            // ULTRA aggressive compression settings
            const maxWidth = 300;  // Much smaller
            const maxHeight = 300; // Much smaller
            let { width, height } = img;

            // Calculate new dimensions maintaining aspect ratio
            if (width > height) {
              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }
            } else {
              if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
              }
            }

            // Ensure very small but readable dimensions
            if (width < 50) width = 50;
            if (height < 50) height = 50;

            canvas.width = width;
            canvas.height = height;
            ctx?.drawImage(img, 0, 0, width, height);
            // Convert to base64 with very low quality
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.3); // Very low quality
            // If STILL too large, make it even smaller
            if (compressedBase64.length > 100000) { // ~75KB base64 limit
              // Make it a tiny thumbnail
              canvas.width = 100;
              canvas.height = 100;
              ctx?.drawImage(img, 0, 0, 100, 100);
              const thumbnailBase64 = canvas.toDataURL('image/jpeg', 0.2); // Ultra low quality
              resolve(thumbnailBase64);
            } else {
              resolve(compressedBase64);
            }
          };

          img.onerror = () => {
            // Use minimal placeholder
            resolve('data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=');
          };

          // Read the original file
          const reader = new FileReader();
          reader.onload = (e) => {
            if (e.target?.result) {
              img.src = e.target.result as string;
            }
          };
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        } else {
          // For non-images, use minimal placeholder to avoid 413 error
          resolve('data:application/pdf;base64,JVBERi0xLjQKJcfsj6IKCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoKMiAwIG9iago8PAovVHlwZSAvUGFnZXMKL0NvdW50IDEKL0tpZHMgWzMgMCBSXQo+PgplbmRvYmoKCjMgMCBvYmoKPDwKL1R5cGUgL1BhZ2UKL1BhcmVudCAyIDAgUgovTWVkaWFCb3ggWzAgMCA2MTIgNzkyXQo+PgplbmRvYmoKCnhyZWYKMCA0CjAwMDAwMDAwMDAgNjU1MzUgZiAKMDAwMDAwMDAwOSAwMDAwMCBuIAowMDAwMDAwMDU4IDAwMDAwIG4gCjAwMDAwMDAxMTUgMDAwMDAgbiAKdHJhaWxlcgo8PAovU2l6ZSA0Ci9Sb290IDEgMCBSCj4+CnN0YXJ0eHJlZgoxODIKJSVFT0Y=');
        }
      });
    };

    for (const [docKey, fileType] of Object.entries(fileTypeMap)) {
      const docFile = documentFiles[docKey];
      if (docFile && docFile.file) {
        try {
          // Convert file to base64 and use as fileUrl (buffer data)
          const base64Data = await fileToBase64(docFile.file);

          fileUploads.push({
            fileName: docFile.file.name,
            fileSize: docFile.file.size,
            fileType: fileType,
            fileUrl: base64Data // Send buffer data directly in fileUrl
          });
        } catch (error) {
        }
      } else {
        // For test data, create smaller placeholder base64 data
        if ((formData as any)[docKey]) {
          // Create a very small 1x1 pixel PNG as base64 for test data (minimal size)
          const placeholderBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQIHWNgAAIAAAUAAY27m/MAAAAASUVORK5CYII=';

          fileUploads.push({
            fileName: `${fileType.toLowerCase()}_test.png`,
            fileSize: 60, // Smaller size
            fileType: fileType,
            fileUrl: placeholderBase64 // Very small buffer data
          });
        }
      }
    }
    // Calculate total payload size estimate
    const totalBase64Size = fileUploads.reduce((sum, upload) => sum + (upload.fileUrl?.length || 0), 0);
    const estimatedSizeKB = Math.round(totalBase64Size * 0.75 / 1024); // Base64 to bytes conversion
    // If payload is still too large, remove file uploads to prevent 413 error
    if (estimatedSizeKB > 1000) { // 1MB limit
      return []; // Return empty array to avoid 413 error
    } else if (estimatedSizeKB > 500) { // 500KB warning
    } else {
    }

    return fileUploads;
  };

  // Helper function to create the payload
  const createPayload = (formData: any, userId: string, fileUploads: any[]) => {
    return {
      firstName: formData.applicantName || "",
      middleName: formData.applicantMiddleName || "",
      lastName: formData.applicantLastName || "",
      filledBy: formData.applicationFilledBy || `${formData.applicantName}`,
      parentOrSpouseName: formData.fatherName || "",
      sex: (formData.applicantGender || "MALE").toUpperCase(),
      placeOfBirth: formData.placeOfBirth || "",
      dateOfBirth: formData.applicantDateOfBirth
        ? new Date(formData.applicantDateOfBirth).toISOString()
        : new Date().toISOString(),
      panNumber: formData.panNumber || "",
      aadharNumber: formData.aadharNumber || formData.applicantIdNumber || "",
      dobInWords: formData.dateOfBirthInWords || "",
  stateId: formData.presentStateId ?? getStateId(formData.presentState || ""),
  districtId: formData.presentDistrictId ?? getDistrictId(formData.presentDistrict || ""),
      currentUserId: parseInt(userId || "13"),
      currentRoleId: 34, // Default role ID

      presentAddress: {
        addressLine: formData.applicantAddress || "",
        stateId: formData.presentStateId ?? getStateId(formData.presentState || ""),
        districtId: formData.presentDistrictId ?? getDistrictId(formData.presentDistrict || ""),
  zoneId: formData.presentZoneId ?? undefined,
  divisionId: formData.presentDivisionId ?? undefined,
        policeStationId: formData.presentStationId ?? getPoliceStationId(formData.presentPoliceStation || ""),
        sinceResiding: formData.residingSince
          ? new Date(formData.residingSince).toISOString()
          : new Date().toISOString()
      },

      permanentAddress: {
        addressLine: formData.permanentAddress || formData.applicantAddress || "",
  stateId: formData.permanentStateId ?? getStateId(formData.permanentState || formData.presentState || ""),
  districtId: formData.permanentDistrictId ?? getDistrictId(formData.permanentDistrict || formData.presentDistrict || ""),
  zoneId: formData.permanentZoneId ?? (formData.sameAsPresent ? formData.presentZoneId : undefined),
  divisionId: formData.permanentDivisionId ?? (formData.sameAsPresent ? formData.presentDivisionId : undefined),
  policeStationId: formData.permanentStationId ?? getPoliceStationId(formData.permanentPoliceStation || formData.presentPoliceStation || ""),
        sinceResiding: formData.residingSince
          ? new Date(formData.residingSince).toISOString()
          : new Date().toISOString()
      },

      contactInfo: {
        telephoneOffice: formData.officePhone || "",
        telephoneResidence: formData.residencePhone || "",
        mobileNumber: formData.applicantMobile || "",
        officeMobileNumber: formData.officeMobile || "",
        alternativeMobile: formData.alternativeMobile || ""
      },

      occupationInfo: {
        occupation: formData.occupation || "",
        officeAddress: formData.officeBusinessAddress || "",
        stateId: getStateId(formData.officeBusinessState || ""),
        districtId: getDistrictId(formData.officeBusinessDistrict || ""),
        cropLocation: formData.cropProtectionLocation || "N/A",
        areaUnderCultivation: parseInt(formData.cultivatedArea || "0") || 0
      },

      biometricData: {
        signatureImageUrl: formData.signature || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        irisScanImageUrl: formData.irisScan || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
        photoImageUrl: formData.photograph || "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
      },

      criminalHistory: formData.criminalHistory || [
        {
          convicted: false
        }
      ],

      licenseHistory: formData.licenseHistory || [
        {
          hasAppliedBefore: false,
          hasOtherApplications: false,
          familyMemberHasArmsLicense: false,
          hasSafePlaceForArms: true,
          hasUndergoneTraining: false
        }
      ],

      licenseRequestDetails: {
        needForLicense: formData.licenseNeed || "SELF_PROTECTION",
        weaponCategory: (formData.armsCategory || "PERMISSIBLE").toUpperCase(),
        requestedWeaponIds: getWeaponIds(formData.weaponType || ""),
        areaOfValidity: formData.carryArea === 'district'
          ? formData.presentDistrict || "Kolkata"
          : formData.carryArea === 'state'
            ? formData.presentState || "Telangana"
            : "Throughout India"
      },

      fileUploads: fileUploads
    };
  };

  // Validate ALL steps for submission
  const validateAllStepsForSubmission = () => {
    const allErrors: Record<string, string> = {};

    // Step 0: Personal Information
    if (!formData.applicantName) allErrors.applicantName = 'Applicant name is required';
    if (!formData.applicantMobile) {
      allErrors.applicantMobile = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.applicantMobile)) {
      allErrors.applicantMobile = 'Please enter a valid 10-digit mobile number';
    }
    if (!formData.applicantEmail) {
      allErrors.applicantEmail = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.applicantEmail)) {
      allErrors.applicantEmail = 'Please enter a valid email address';
    }
    if (!formData.applicantGender) allErrors.applicantGender = 'Please select gender';
    if (!formData.applicantDateOfBirth) allErrors.applicantDateOfBirth = 'Date of birth is required';
    if (!formData.fatherName) allErrors.fatherName = "Father's name is required";
    if (!formData.applicantIdNumber) {
      allErrors.applicantIdNumber = 'ID number is required';
    } else if (formData.applicantIdType === 'aadhar' && !/^\d{12}$/.test(formData.applicantIdNumber)) {
      allErrors.applicantIdNumber = 'Aadhar number must be exactly 12 digits';
    }

    // Step 1: Address Information
    if (!formData.applicantAddress) allErrors.applicantAddress = 'Present address is required';
    if (!formData.presentState) allErrors.presentState = 'Present state is required';
    if (!formData.presentDistrict) allErrors.presentDistrict = 'Present district is required';
    if (!formData.presentPincode) allErrors.presentPincode = 'Present pincode is required';
    if (!formData.presentPoliceStation) allErrors.presentPoliceStation = 'Nearest police station is required';
    if (!formData.jurisdictionPoliceStation) allErrors.jurisdictionPoliceStation = 'Jurisdiction police station is required';
    if (formData.sameAsPresent === false) {
      if (!formData.permanentAddress) allErrors.permanentAddress = 'Permanent address is required';
      if (!formData.permanentState) allErrors.permanentState = 'Permanent state is required';
      if (!formData.permanentDistrict) allErrors.permanentDistrict = 'Permanent district is required';
      if (!formData.permanentPincode) allErrors.permanentPincode = 'Permanent pincode is required';
      if (!formData.permanentPoliceStation) allErrors.permanentPoliceStation = 'Permanent police station is required';
    }

    // Step 2: Occupation
    if (!formData.occupation) allErrors.occupation = 'Occupation is required';

    // Step 4: Weapon Details
    if (!formData.weaponType) allErrors.weaponType = 'Weapon type is required';
    if (!formData.weaponReason) allErrors.weaponReason = 'Reason for weapon is required';

    // Step 6: Documents
    if (!formData.idProofUploaded) allErrors.idProofUploaded = 'Aadhaar Card is required';
    if (!formData.addressProofUploaded) allErrors.addressProofUploaded = 'Address proof is required';
    if (!formData.photographUploaded) allErrors.photographUploaded = 'Passport Size Photograph is required';

    // Step 8: Declaration
    if (!formData.declaration?.agreeToTruth) allErrors['declaration.agreeToTruth'] = 'You must agree to the truth declaration';
    if (!formData.declaration?.understandLegalConsequences) allErrors['declaration.understandLegalConsequences'] = 'You must understand legal consequences';
    if (!formData.declaration?.agreeToTerms) allErrors['declaration.agreeToTerms'] = 'You must agree to terms and conditions';
    if (formData.hasSubmittedTrueInfo !== true) {
      allErrors.hasSubmittedTrueInfo = 'You must verify that the submitted information is true';
    }
  const isValid = Object.keys(allErrors || {}).length === 0;
    if (!isValid) {
      setErrors(allErrors);
    }

    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiErrorDetails(null);
    setShowErrorDetails(false);

    // Validate all steps before submission
    const isValid = validateAllStepsForSubmission();
    if (!isValid) {
      setApiError('Please fill in all required fields correctly across all steps');
      return;
    }

    try {
      setIsSubmitting(true);
      // Upload files first and get URLs
      let fileUploads = await uploadFilesAndGetUrls();
      // Build payload for API
      let payload = createPayload(formData, userId ?? "", fileUploads);
      let resp;
      try {
        resp = await ApplicationApi.create(payload as any);
      } catch (apiError: any) {
        // If we get 413 error, retry without file uploads
        if (apiError?.response?.status === 413 || apiError?.status === 413 || apiError?.message?.includes('413') || apiError?.message?.includes('too large')) {
          setApiError('Request too large. Submitting application without file attachments...');

          // Retry with empty file uploads
          fileUploads = [];
          payload = createPayload(formData, userId ?? "", []);
          resp = await ApplicationApi.create(payload as any);
          // Update user about missing files
          setApiError('Application submitted successfully, but files were too large to include. Please upload documents separately.');
        } else {
          throw apiError; // Re-throw if it's not a 413 error
        }
      }

      // Log the complete response for debugging
      // Try to extract application id and acknowledgement number from various shapes
      const createdApp: any = (resp as any)?.data && typeof (resp as any).data === 'object' ? (resp as any).data : (resp as any).body || (resp as any);
      const applicationId = String(createdApp?.id || createdApp?.applicationId || createdApp?.data?.id || '');
      const acknowledgementNo = String(createdApp?.acknowledgementNo || createdApp?.acknowledgmentNo || createdApp?.data?.acknowledgementNo || createdApp?.data?.acknowledgmentNo || '');
      // Log success details for debugging
      if ((resp as any)?.success !== undefined) {
      }
      if ((resp as any)?.message) {
      }

      // Set success message and call parent callback with acknowledgement info
      const cbData: FormData = {
        applicantName: formData.applicantName,
        applicantMobile: formData.applicantMobile,
        applicantEmail: formData.applicantEmail,
        fatherName: formData.fatherName || '',
        gender: formData.applicantGender,
        dateOfBirth: formData.applicantDateOfBirth,
        age: '',
        address: formData.applicantAddress,
        city: formData.presentDistrict || '',
        state: formData.presentState || '',
        pincode: formData.presentPincode || '',
        licenseType: formData.licenseType,
        weaponType: formData.weaponType,
        purposeOfWeapon: formData.weaponReason,
      } as any;

      // Show success message with acknowledgement number
      setApiError(null);
      setApiErrorDetails(null);
      setShowErrorDetails(false);
      try {
        onSubmit?.({
          ...cbData,
          acknowledgementNo: acknowledgementNo,
          applicationId: applicationId
        } as any);
        setIsSubmitting(false);
      } catch (callbackError) {
      }

    } catch (error: any) {
      setIsSubmitting(false);
      // Store the full error details for debugging
      setApiErrorDetails({
        fullError: error,
        responseData: error?.response?.data,
        responseStatus: error?.response?.status,
        responseHeaders: error?.response?.headers
      });

      // Extract detailed error message from nested response structure
      let errorMessage = 'Failed to submit application. Please try again.';

      try {
        // Log the complete response structure for debugging
        if (error?.response) {
        }

        if (error?.response?.data) {
          const errorData = error.response.data;

          // Check if it's the nested error structure with details.response.error
          if (errorData.details?.response?.error) {
            errorMessage = errorData.details.response.error;
          }
          // Check for details.response.message
          else if (errorData.details?.response?.message) {
            errorMessage = errorData.details.response.message;
          }
          // Fallback to details.message
          else if (errorData.details?.message) {
            errorMessage = errorData.details.message;
          }
          // Fallback to top-level error message
          else if (errorData.error) {
            errorMessage = errorData.error;
          }
          // Fallback to message field
          else if (errorData.message) {
            errorMessage = errorData.message;
          }
        }
        // Direct error message
        else if (error?.message) {
          errorMessage = error.message;
        }
      } catch (parseError) {
        errorMessage = 'An unexpected error occurred. Please try again.';
      }

      setApiError(errorMessage);
    }
  };

  // Client-side PDF from Preview panel (html2canvas + jsPDF)
  const downloadPDF = async () => {
    const el = previewRef.current;
    if (!el) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const { default: jsPDF } = await import('jspdf');
      const canvas = await html2canvas(el, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      // Draw first page
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Add extra pages if necessary
      while (heightLeft > 0) {
        position = heightLeft - imgHeight; // negative offset to shift image upwards
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }
      pdf.save(`Application_Preview.pdf`);
    } catch (err) {
    }
  };

  return (
    <>
  <div className="max-w-8xl mx-auto h-full overflow-hidden grid ">
        {/* Fixed Header with Messages */}
        <div className="">
          {/* Success/Error messages */}
          {saveMessage && (
            <div className={`mb-4 rounded-md ${saveMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {saveMessage.text}
            </div>
          )}
          {apiError && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
              {apiError}
            </div>
          )}
        </div>

        {/* Fresh Application Form Title (static within layout) */}
        <div className="w-full z-10 shadow-sm border-b">
          <div className="px-6 py-1">
            <div className="flex items-center justify-between">
              <BackButton />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-[#022258] to-[#1e3a8a] bg-clip-text text-transparent  flex-1 text-center">
                Fresh Application Form
              </h1>
            </div>
          </div>
          <div className="bg-transparent px-6 pb-1">
            <div className="border border-gray-300 rounded-lg shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-[#022258] to-[#1e3a8a]">
                <div className="flex space-x-1 p-2 tab-array">
                  {formSteps.map((section, index) => (
                    <button
                      key={index}
                      onClick={() => setFormStep(index)}
                      className={`relative px-2 py-2 text-xs font-medium whitespace-nowrap transition-all duration-300 rounded-lg transform hover:scale-105 ${formStep === index
                        ? "bg-white text-[#022258] shadow-lg border-2 border-blue-200 font-bold"
                        : "text-blue-100 hover:text-white hover:bg-blue-600/30 border-2 border-transparent"
                        }`}
                    >
                      <div className="flex flex-col items-center px-1">
                        <span className="text-6xs opacity-75 mb-0.5">Step {index + 1}</span>
                        <span className="text-6xs font-bold leading-tight text-center">{section.title}</span>
                      </div>
                      {formStep === index && (
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-white"></div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Step Navigation - Part of sticky header */}
        </div>

        {/* Content under header; only inner card scrolls */}
  <div className="px-6 pt-0 pb-2 min-h-0 h-full overflow-hidden">
          {/* Success/Error messages (below fixed header) */}
          {saveMessage && (
            <div className={`mb-4 p-3 rounded-md ${saveMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {saveMessage.text}
            </div>
          )}
          {apiError && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-700 border border-red-200">
              {apiError}
            </div>
          )}
          <div ref={formContentRef} className="bg-white rounded-lg shadow-lg border border-gray-200 h-full overflow-y-auto">
            <form onSubmit={handleSubmit} className="p-8">
              {/* Step 0: Personal Information */}
              {formStep === 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-x-8 gap-y-6">
                    {/* Row 1: Alice Ack No, First, Middle, Last Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Alice Acknowledgement Number</label>
                      <input type="text" name="aliceAcknowledgementNumber" value={formData.aliceAcknowledgementNumber} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Applicant First Name<span className="text-red-500">*</span></label>
                      <input type="text" name="applicantName" value={formData.applicantName} onChange={handleChange} className={`mt-1 block w-full p-2 border ${errors.applicantName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`} />
                      {errors.applicantName && <p className="text-red-500 text-xs mt-1">{errors.applicantName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Applicant Middle Name</label>
                      <input type="text" name="applicantMiddleName" value={formData.applicantMiddleName} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Applicant Last Name</label>
                      <input type="text" name="applicantLastName" value={formData.applicantLastName} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]" />
                    </div>

                    {/* Row 2: Application filled by, Parent/Spouse, Sex, Place of Birth */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Application filled by <span className="text-xs text-gray-400">(Zonal Superintendent name)</span></label>
                      <input type="text" name="applicationFilledBy" value={formData.applicationFilledBy} onChange={handleChange} placeholder="Self/Agent/Other" className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Parent/ Spouse Name</label>
                      <input type="text" name="fatherName" value={formData.fatherName} onChange={handleChange} className={`mt-1 block w-full p-2 border ${errors.fatherName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`} />
                      {errors.fatherName && <p className="text-red-500 text-xs mt-1">{errors.fatherName}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Sex</label>
                      <div className="flex items-center gap-4 mt-1">
                        <label className="inline-flex items-center">
                          <input type="radio" name="applicantGender" value="male" checked={formData.applicantGender === 'male'} onChange={handleChange} className="h-4 w-4 text-[#6366F1]" />
                          <span className="ml-2">Male</span>
                        </label>
                        <label className="inline-flex items-center">
                          <input type="radio" name="applicantGender" value="female" checked={formData.applicantGender === 'female'} onChange={handleChange} className="h-4 w-4 text-[#6366F1]" />
                          <span className="ml-2">Female</span>
                        </label>
                      </div>
                      {errors.applicantGender && <p className="text-red-500 text-xs mt-1">{errors.applicantGender}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Place of Birth (Nativity)</label>
                      <input type="text" name="placeOfBirth" value={formData.placeOfBirth} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]" />
                    </div>

                    {/* Row 3: Date of Birth, PAN, Aadhar, Date of Birth in Words */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of birth in Christian era <span className="text-xs text-gray-400">(Must be 21 years old on the date of application)</span></label>
                      <input type="date" name="applicantDateOfBirth" value={formData.applicantDateOfBirth} onChange={handleChange} className={`mt-1 block w-full p-2 border ${errors.applicantDateOfBirth ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`} />
                      {errors.applicantDateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.applicantDateOfBirth}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">PAN</label>
                      <input type="text" name="panNumber" value={formData.panNumber} onChange={handleChange} maxLength={10} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]" placeholder="10-character PAN number" style={{ textTransform: 'uppercase' }} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Aadhar Number</label>
                      <input type="text" name="aadharNumber" value={formData.aadharNumber} onChange={handleChange} maxLength={12} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]" placeholder="12-digit Aadhar number" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date of Birth in Words</label>
                      <input type="text" name="dateOfBirthInWords" value={formData.dateOfBirthInWords} onChange={handleChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]" />
                    </div>
                  </div>

                  {/* Note and navigation buttons */}
                  <div className="flex flex-col md:flex-row items-center justify-between mt-8">
                    <div className="text-xs text-blue-700 font-semibold">
                      SCHEDULE-III Part – II &nbsp;|&nbsp; Application Form &nbsp;|&nbsp; <span className="font-bold text-indigo-700">Form A-1</span> (for individuals) &nbsp;|&nbsp; Form of application for an arms license In <span className="font-bold text-indigo-700">Form II, III and IV</span>
                    </div>
                    <div className="flex items-center gap-4 mt-4 md:mt-0">
                      <span className="text-xs text-red-600 font-bold">NOTE:</span>
                      <span className="text-xs text-gray-700">Please review the data before submitting your Arms License application</span>
                    </div>
                  </div>
                  <div className="flex justify-end items-center gap-4 mt-6">
                    <button type="button" className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-md flex items-center gap-2 border border-yellow-300 hover:bg-yellow-200">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      Save to Draft
                    </button>
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-md flex items-center gap-2 hover:bg-indigo-700">
                      Next
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                </div>
              )} 
               {/* Step 1: Address Details */}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800 mb-3 ">Present Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Complete Address <span className="text-red-500">*</span></label>
                        <textarea
                          name="applicantAddress"
                          value={formData.applicantAddress}
                          onChange={handleChange}
                          className={`mt-1 block w-full p-2 border ${errors.applicantAddress ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                          rows={2}
                        />
                        {errors.applicantAddress && <p className="text-red-500 text-xs mt-1">{errors.applicantAddress}</p>}
                      </div>
                      <div className="col-span-1 md:col-span-2">
                        <CascadingLocationSelect
                          onChange={handlePresentLocationChange}
                          labels={{ state: 'State', district: 'District', zone: 'Zone', division: 'Division', station: 'Nearest Police Station' }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        />
                        {errors.presentState && <p className="text-red-500 text-xs mt-1">{errors.presentState}</p>}
                        {errors.presentDistrict && <p className="text-red-500 text-xs mt-1">{errors.presentDistrict}</p>}
                        {errors.presentPoliceStation && <p className="text-red-500 text-xs mt-1">{errors.presentPoliceStation}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Pincode <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="presentPincode"
                          value={formData.presentPincode}
                          onChange={handleChange}
                          className={`mt-1 block w-full p-2 border ${errors.presentPincode ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                          maxLength={6}
                        />
                        {errors.presentPincode && <p className="text-red-500 text-xs mt-1">{errors.presentPincode}</p>}
                      </div>

                      {/* Police station is selected via cascading selector. Keep pincode next to it. */}

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Since when residing at present address</label>
                        <input
                          type="date"
                          name="residingSince"
                          value={formData.residingSince}
                          onChange={handleChange}
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Jurisdiction Police Station <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          name="jurisdictionPoliceStation"
                          value={formData.jurisdictionPoliceStation}
                          onChange={handleChange}
                          className={`mt-1 block w-full p-2 border ${errors.jurisdictionPoliceStation ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                          placeholder="Selected in location above"
                        />
                        {errors.jurisdictionPoliceStation && <p className="text-red-500 text-xs mt-1">{errors.jurisdictionPoliceStation}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Permanent Address Section */}
                  <div className="border-t border-gray-200 pt-5">
                    <div className="flex items-center mb-3">
                      <input
                        type="checkbox"
                        name="sameAsPresent"
                        checked={formData.sameAsPresent === true}
                        onChange={handleChange}
                        className="h-4 w-4 text-[#6366F1] border-gray-300 rounded"
                      />
                      <label className="ml-2 text-sm text-gray-700">Permanent address same as present</label>
                    </div>

                    <h3 className="text-lg font-medium text-gray-800 mb-3">Permanent Address</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Complete Address {formData.sameAsPresent ? '' : <span className="text-red-500">*</span>}</label>
                        <textarea
                          name="permanentAddress"
                          value={formData.permanentAddress}
                          onChange={handleChange}
                          disabled={formData.sameAsPresent === true}
                          className={`mt-1 block w-full p-2 border ${errors.permanentAddress ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                          rows={2}
                        />
                        {errors.permanentAddress && <p className="text-red-500 text-xs mt-1">{errors.permanentAddress}</p>}
                      </div>

                      <div className="col-span-1 md:col-span-2">
                        <CascadingLocationSelect
                          value={formData.sameAsPresent ? {
                            state: formData.presentStateId ? { id: formData.presentStateId, name: formData.presentState } as any : undefined,
                            district: formData.presentDistrictId ? { id: formData.presentDistrictId, name: formData.presentDistrict } as any : undefined,
                            zone: formData.presentZoneId ? { id: formData.presentZoneId, name: '' } as any : undefined,
                            division: formData.presentDivisionId ? { id: formData.presentDivisionId, name: '' } as any : undefined,
                            station: formData.presentStationId ? { id: formData.presentStationId, name: formData.presentPoliceStation } as any : undefined,
                          } : {
                            state: formData.permanentStateId ? { id: formData.permanentStateId, name: formData.permanentState } as any : undefined,
                            district: formData.permanentDistrictId ? { id: formData.permanentDistrictId, name: formData.permanentDistrict } as any : undefined,
                            zone: formData.permanentZoneId ? { id: formData.permanentZoneId, name: '' } as any : undefined,
                            division: formData.permanentDivisionId ? { id: formData.permanentDivisionId, name: '' } as any : undefined,
                            station: formData.permanentStationId ? { id: formData.permanentStationId, name: formData.permanentPoliceStation } as any : undefined,
                          }}
                          onChange={(sel) => {
                            // don't override when sameAsPresent
                            if (formData.sameAsPresent === true) return;
                            setFormData(prev => ({
                              ...prev,
                              permanentState: sel?.state?.name || '',
                              permanentDistrict: sel?.district?.name || '',
                              permanentPoliceStation: sel?.station?.name || '',
                              permanentStateId: sel?.state?.id,
                              permanentDistrictId: sel?.district?.id,
                              permanentZoneId: sel?.zone?.id,
                              permanentDivisionId: sel?.division?.id,
                              permanentStationId: sel?.station?.id,
                            }));
                          }}
                          labels={{ state: 'State', district: 'District', zone: 'Zone', division: 'Division', station: 'Jurisdiction Police Station' }}
                          className="grid grid-cols-1 md:grid-cols-2 gap-4"
                          disabled={formData.sameAsPresent === true}
                        />
                        {errors.permanentState && <p className="text-red-500 text-xs mt-1">{errors.permanentState}</p>}
                        {errors.permanentDistrict && <p className="text-red-500 text-xs mt-1">{errors.permanentDistrict}</p>}
                        {errors.permanentPoliceStation && <p className="text-red-500 text-xs mt-1">{errors.permanentPoliceStation}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Pincode {formData.sameAsPresent ? '' : <span className="text-red-500">*</span>}</label>
                        <input
                          type="text"
                          name="permanentPincode"
                          value={formData.permanentPincode}
                          onChange={handleChange}
                          disabled={formData.sameAsPresent === true}
                          className={`mt-1 block w-full p-2 border ${errors.permanentPincode ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                          maxLength={6}
                        />
                        {errors.permanentPincode && <p className="text-red-500 text-xs mt-1">{errors.permanentPincode}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Jurisdiction Police Station {formData.sameAsPresent ? '' : <span className="text-red-500">*</span>}</label>
                        <input
                          type="text"
                          name="permanentPoliceStation"
                          value={formData.permanentPoliceStation}
                          onChange={handleChange}
                          disabled={formData.sameAsPresent === true}
                          className={`mt-1 block w-full p-2 border ${errors.permanentPoliceStation ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                          placeholder="Selected in location above"
                        />
                        {errors.permanentPoliceStation && <p className="text-red-500 text-xs mt-1">{errors.permanentPoliceStation}</p>}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 pt-5">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Office Phone</label>
                        <input
                          type="tel"
                          name="officePhone"
                          value={formData.officePhone}
                          onChange={handleChange}
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Residence Phone</label>
                        <input
                          type="tel"
                          name="residencePhone"
                          value={formData.residencePhone}
                          onChange={handleChange}
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Office Mobile</label>
                        <input
                          type="tel"
                          name="officeMobile"
                          value={formData.officeMobile}
                          onChange={handleChange}
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Alternative Mobile</label>
                        <input
                          type="tel"
                          name="alternativeMobile"
                          value={formData.alternativeMobile}
                          onChange={handleChange}
                          className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                        />
                      </div>
                    </div>
                  </div>
                </div>    
              {/* Step 2: Weapon Details */}
              {formStep === 2 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">Occupation & Business Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Occupation <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        name="occupation"
                        value={formData.occupation}
                        onChange={handleChange}
                        className={`mt-1 block w-full p-2 border ${errors.occupation ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                        placeholder="e.g., Farmer, Business, Service, etc."
                      />
                      {errors.occupation && <p className="text-red-500 text-xs mt-1">{errors.occupation}</p>}
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Office/Business Address</label>
                      <textarea
                        name="officeBusinessAddress"
                        value={formData.officeBusinessAddress}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                        rows={3}
                        placeholder="Complete office or business address"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Office/Business State</label>
                      <select
                        name="officeBusinessState"
                        value={formData.officeBusinessState}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                      >
                        <option value="">Select State</option>
                        <option value="Telangana">Telangana</option>
                        <option value="Andhra Pradesh">Andhra Pradesh</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Office/Business District</label>
                      <select
                        name="officeBusinessDistrict"
                        value={formData.officeBusinessDistrict}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                      >
                        <option value="">Select District</option>
                        {districts.map((district) => (
                          <option key={district} value={district}>{district}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Crop Protection Location</label>
                      <input
                        type="text"
                        name="cropProtectionLocation"
                        value={formData.cropProtectionLocation}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                        placeholder="Location where crop protection is needed (if applicable)"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Area Under Cultivation (in acres)</label>
                      <input
                        type="number"
                        name="cultivatedArea"
                        value={formData.cultivatedArea}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Criminal History */}
              {formStep === 3 && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-gray-800">Criminal History</h3>
                    <button
                      type="button"
                      onClick={addCriminalHistoryEntry}
                      className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      + Add Criminal Record
                    </button>
                  </div>

                  {formData.criminalHistory.map((criminalRecord, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="text-md font-medium text-gray-700">
                          Criminal Record #{index + 1}
                        </h4>
                        {formData.criminalHistory.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeCriminalHistoryEntry(index)}
                            className="text-red-500 hover:text-red-700 focus:outline-none"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Whether the applicant has been convicted?
                          </label>
                          <div className="flex gap-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`criminalHistory[${index}].convicted`}
                                value="yes"
                                checked={criminalRecord.convicted === true}
                                onChange={() => handleArrayFieldChange('criminalHistory', index, 'convicted', true)}
                                className="h-4 w-4 text-[#6366F1]"
                              />
                              <span className="ml-2">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`criminalHistory[${index}].convicted`}
                                value="no"
                                checked={criminalRecord.convicted === false}
                                onChange={() => handleArrayFieldChange('criminalHistory', index, 'convicted', false)}
                                className="h-4 w-4 text-[#6366F1]"
                              />
                              <span className="ml-2">No</span>
                            </label>
                          </div>
                        </div>

                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Is any criminal case pending against the applicant?
                          </label>
                          <div className="flex gap-4">
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`criminalHistory[${index}].isCriminalCasePending`}
                                value="Yes"
                                checked={criminalRecord.isCriminalCasePending === 'Yes'}
                                onChange={(e) => handleArrayFieldChange('criminalHistory', index, 'isCriminalCasePending', e.target.value)}
                                className="h-4 w-4 text-[#6366F1]"
                              />
                              <span className="ml-2">Yes</span>
                            </label>
                            <label className="inline-flex items-center">
                              <input
                                type="radio"
                                name={`criminalHistory[${index}].isCriminalCasePending`}
                                value="No"
                                checked={criminalRecord.isCriminalCasePending === 'No'}
                                onChange={(e) => handleArrayFieldChange('criminalHistory', index, 'isCriminalCasePending', e.target.value)}
                                className="h-4 w-4 text-[#6366F1]"
                              />
                              <span className="ml-2">No</span>
                            </label>
                          </div>
                        </div>

                        {criminalRecord.isCriminalCasePending === 'Yes' && (
                          <>
                            <div>
                              <label className="block text-sm font-medium text-gray-700">FIR Number</label>
                              <input
                                type="text"
                                value={criminalRecord.firNumber}
                                onChange={(e) => handleArrayFieldChange('criminalHistory', index, 'firNumber', e.target.value)}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Police Station</label>
                              <input
                                type="text"
                                value={criminalRecord.policeStation}
                                onChange={(e) => handleArrayFieldChange('criminalHistory', index, 'policeStation', e.target.value)}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Section of Law</label>
                              <input
                                type="text"
                                value={criminalRecord.sectionOfLaw}
                                onChange={(e) => handleArrayFieldChange('criminalHistory', index, 'sectionOfLaw', e.target.value)}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Date of Offence</label>
                              <input
                                type="date"
                                value={criminalRecord.dateOfOffence}
                                onChange={(e) => handleArrayFieldChange('criminalHistory', index, 'dateOfOffence', e.target.value)}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700">Case Status</label>
                              <select
                                value={criminalRecord.caseStatus}
                                onChange={(e) => handleArrayFieldChange('criminalHistory', index, 'caseStatus', e.target.value)}
                                className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                              >
                                <option value="">Select Status</option>
                                <option value="Pending">Pending</option>
                                <option value="Acquitted">Acquitted</option>
                                <option value="Convicted">Convicted</option>
                                <option value="Dismissed">Dismissed</option>
                              </select>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {/* Step 4: License Details */}
              {formStep === 4 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">License Details</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Need for license</label>
                      <textarea
                        name="licenseNeed"
                        value={formData.licenseNeed}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description of arms</label>
                      <textarea
                        name="armsDescription"
                        value={formData.armsDescription}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                        rows={3}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Arms Category</label>
                      <select
                        name="armsCategory"
                        value={formData.armsCategory}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                      >
                        <option value="restricted">Restricted</option>
                        <option value="permissible">Permissible</option>
                      </select>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <h4 className="text-md font-semibold text-gray-800 mb-3">Weapon & Application Details</h4>
                      <div className="space-y-4 bg-blue-50 p-4 rounded-lg mb-4">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700">Application Type <span className="text-red-500">*</span></label>
                            <select
                              name="applicationType"
                              value={formData.applicationType}
                              onChange={handleChange}
                              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                            >
                              <option value="New License">New License</option>
                              <option value="Renewal">Renewal</option>
                              <option value="Transfer">Transfer</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">Weapon Type <span className="text-red-500">*</span></label>
                            <select
                              name="weaponType"
                              value={String(formData.weaponId ?? '')}
                              onChange={(e) => {
                                const selId = e.target.value ? Number(e.target.value) : undefined;
                                const sel = weapons.find(w => w.id === selId);
                                setFormData(prev => ({
                                  ...prev,
                                  weaponId: selId,
                                  weaponType: sel?.name || '',
                                }));
                              }}
                              className={`mt-1 block w-full p-2 border ${errors.weaponType ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                              disabled={loadingWeapons}
                            >
                              <option value="">{loadingWeapons ? 'Loading weapons…' : 'Select Weapon Type'}</option>
                              {weapons.map(w => (
                                <option key={w.id} value={w.id}>{w.name}</option>
                              ))}
                            </select>
                            {errors.weaponType && <p className="text-red-500 text-xs mt-1">{errors.weaponType}</p>}
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">License Type</label>
                            <select
                              name="licenseType"
                              value={formData.licenseType}
                              onChange={handleChange}
                              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                            >
                              <option value="Regular">Regular</option>
                              <option value="Sports">Sports</option>
                              <option value="Security">Security</option>
                              <option value="Agricultural">Agricultural</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700">License Validity (Years)</label>
                            <select
                              name="licenseValidity"
                              value={formData.licenseValidity}
                              onChange={handleChange}
                              className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                            >
                              <option value="3">3 Years</option>
                              <option value="5">5 Years</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Reason for Weapon <span className="text-red-500">*</span></label>
                          <textarea
                            name="weaponReason"
                            value={formData.weaponReason}
                            onChange={handleChange}
                            className={`mt-1 block w-full p-2 border ${errors.weaponReason ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                            rows={3}
                            placeholder="Please provide a detailed reason why you need this weapon"
                          />
                          {errors.weaponReason && <p className="text-red-500 text-xs mt-1">{errors.weaponReason}</p>}
                        </div>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="text-md font-semibold text-gray-800">License History Questions</h4>
                        <button
                          type="button"
                          onClick={addLicenseHistoryEntry}
                          className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                        >
                          + Add License History
                        </button>
                      </div>

                      {formData.licenseHistory.map((licenseRecord, index) => (
                        <div key={index} className="space-y-4 bg-gray-50 p-4 rounded-lg mb-4 border">
                          <div className="flex justify-between items-center">
                            <h5 className="text-sm font-medium text-gray-700">
                              License History #{index + 1}
                            </h5>
                            {formData.licenseHistory.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeLicenseHistoryEntry(index)}
                                className="text-red-500 hover:text-red-700 focus:outline-none"
                              >
                                Remove
                              </button>
                            )}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Have you applied before?</label>
                              <div className="flex space-x-4">
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name={`licenseHistory[${index}].hasAppliedBefore`}
                                    value="true"
                                    checked={licenseRecord.hasAppliedBefore === true}
                                    onChange={() => handleArrayFieldChange('licenseHistory', index, 'hasAppliedBefore', true)}
                                    className="form-radio text-[#6366F1]"
                                  />
                                  <span className="ml-2">Yes</span>
                                </label>
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name={`licenseHistory[${index}].hasAppliedBefore`}
                                    value="false"
                                    checked={licenseRecord.hasAppliedBefore === false}
                                    onChange={() => handleArrayFieldChange('licenseHistory', index, 'hasAppliedBefore', false)}
                                    className="form-radio text-[#6366F1]"
                                  />
                                  <span className="ml-2">No</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Do you have any other pending applications for arms license?</label>
                              <div className="flex space-x-4">
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name={`licenseHistory[${index}].hasOtherApplications`}
                                    value="true"
                                    checked={licenseRecord.hasOtherApplications === true}
                                    onChange={() => handleArrayFieldChange('licenseHistory', index, 'hasOtherApplications', true)}
                                    className="form-radio text-[#6366F1]"
                                  />
                                  <span className="ml-2">Yes</span>
                                </label>
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name={`licenseHistory[${index}].hasOtherApplications`}
                                    value="false"
                                    checked={licenseRecord.hasOtherApplications === false}
                                    onChange={() => handleArrayFieldChange('licenseHistory', index, 'hasOtherApplications', false)}
                                    className="form-radio text-[#6366F1]"
                                  />
                                  <span className="ml-2">No</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Does any family member have an arms license?</label>
                              <div className="flex space-x-4">
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name={`licenseHistory[${index}].familyMemberHasArmsLicense`}
                                    value="true"
                                    checked={licenseRecord.familyMemberHasArmsLicense === true}
                                    onChange={() => handleArrayFieldChange('licenseHistory', index, 'familyMemberHasArmsLicense', true)}
                                    className="form-radio text-[#6366F1]"
                                  />
                                  <span className="ml-2">Yes</span>
                                </label>
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name={`licenseHistory[${index}].familyMemberHasArmsLicense`}
                                    value="false"
                                    checked={licenseRecord.familyMemberHasArmsLicense === false}
                                    onChange={() => handleArrayFieldChange('licenseHistory', index, 'familyMemberHasArmsLicense', false)}
                                    className="form-radio text-[#6366F1]"
                                  />
                                  <span className="ml-2">No</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Do you have a safe place for keeping arms?</label>
                              <div className="flex space-x-4">
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name={`licenseHistory[${index}].hasSafePlaceForArms`}
                                    value="true"
                                    checked={licenseRecord.hasSafePlaceForArms === true}
                                    onChange={() => handleArrayFieldChange('licenseHistory', index, 'hasSafePlaceForArms', true)}
                                    className="form-radio text-[#6366F1]"
                                  />
                                  <span className="ml-2">Yes</span>
                                </label>
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name={`licenseHistory[${index}].hasSafePlaceForArms`}
                                    value="false"
                                    checked={licenseRecord.hasSafePlaceForArms === false}
                                    onChange={() => handleArrayFieldChange('licenseHistory', index, 'hasSafePlaceForArms', false)}
                                    className="form-radio text-[#6366F1]"
                                  />
                                  <span className="ml-2">No</span>
                                </label>
                              </div>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Have you undergone training in the use of firearms?</label>
                              <div className="flex space-x-4">
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name={`licenseHistory[${index}].hasUndergoneTraining`}
                                    value="true"
                                    checked={licenseRecord.hasUndergoneTraining === true}
                                    onChange={() => handleArrayFieldChange('licenseHistory', index, 'hasUndergoneTraining', true)}
                                    className="form-radio text-[#6366F1]"
                                  />
                                  <span className="ml-2">Yes</span>
                                </label>
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name={`licenseHistory[${index}].hasUndergoneTraining`}
                                    value="false"
                                    checked={licenseRecord.hasUndergoneTraining === false}
                                    onChange={() => handleArrayFieldChange('licenseHistory', index, 'hasUndergoneTraining', false)}
                                    className="form-radio text-[#6366F1]"
                                  />
                                  <span className="ml-2">No</span>
                                </label>
                              </div>
                            </div>

                            <div className="col-span-1 md:col-span-2">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Have you previously held an arms license?</label>
                              <div className="flex space-x-4">
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name={`licenseHistory[${index}].hasPreviousLicense`}
                                    value="yes"
                                    checked={licenseRecord.hasPreviousLicense === 'yes'}
                                    onChange={(e) => handleArrayFieldChange('licenseHistory', index, 'hasPreviousLicense', e.target.value)}
                                    className="form-radio text-[#6366F1]"
                                  />
                                  <span className="ml-2">Yes</span>
                                </label>
                                <label className="inline-flex items-center">
                                  <input
                                    type="radio"
                                    name={`licenseHistory[${index}].hasPreviousLicense`}
                                    value="no"
                                    checked={licenseRecord.hasPreviousLicense === 'no'}
                                    onChange={(e) => handleArrayFieldChange('licenseHistory', index, 'hasPreviousLicense', e.target.value)}
                                    className="form-radio text-[#6366F1]"
                                  />
                                  <span className="ml-2">No</span>
                                </label>
                              </div>
                            </div>

                            {licenseRecord.hasPreviousLicense === 'yes' && (
                              <>
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Previous License Number</label>
                                  <input
                                    type="text"
                                    value={licenseRecord.previousLicenseNumber}
                                    onChange={(e) => handleArrayFieldChange('licenseHistory', index, 'previousLicenseNumber', e.target.value)}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700">License Issue Date</label>
                                  <input
                                    type="date"
                                    value={licenseRecord.licenseIssueDate}
                                    onChange={(e) => handleArrayFieldChange('licenseHistory', index, 'licenseIssueDate', e.target.value)}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700">License Expiry Date</label>
                                  <input
                                    type="date"
                                    value={licenseRecord.licenseExpiryDate}
                                    onChange={(e) => handleArrayFieldChange('licenseHistory', index, 'licenseExpiryDate', e.target.value)}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                                  />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Issuing Authority</label>
                                  <input
                                    type="text"
                                    value={licenseRecord.issuingAuthority}
                                    onChange={(e) => handleArrayFieldChange('licenseHistory', index, 'issuingAuthority', e.target.value)}
                                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Areas within which applicant wishes to carry arms</label>
                      <div className="mt-2 space-y-2">
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="carryArea"
                            value="district"
                            checked={formData.carryArea === 'district'}
                            onChange={handleChange}
                            className="h-4 w-4 text-[#6366F1]"
                          />
                          <span className="ml-2">District</span>
                        </label>
                        <br />
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="carryArea"
                            value="state"
                            checked={formData.carryArea === 'state'}
                            onChange={handleChange}
                            className="h-4 w-4 text-[#6366F1]"
                          />
                          <span className="ml-2">State</span>
                        </label>
                        <br />
                        <label className="inline-flex items-center">
                          <input
                            type="radio"
                            name="carryArea"
                            value="throughoutIndia"
                            checked={formData.carryArea === 'throughoutIndia'}
                            onChange={handleChange}
                            className="h-4 w-4 text-[#6366F1]"
                          />
                          <span className="ml-2">Throughout India</span>
                        </label>
                      </div>
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Claims for special consideration</label>
                      <textarea
                        name="specialConsideration"
                        value={formData.specialConsideration}
                        onChange={handleChange}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                        rows={3}
                      />
                    </div>

                    <div className="col-span-1 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Details for an application for license in Form IV</label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Place or area for which the licence is sought</label>
                          <input
                            type="text"
                            name="formIVDetails.licenseArea"
                            value={formData.formIVDetails.licenseArea}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">Specification of wild beasts</label>
                          <input
                            type="text"
                            name="formIVDetails.wildBeastSpecification"
                            value={formData.formIVDetails.wildBeastSpecification}
                            onChange={handleChange}
                            className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}        {/* Step 5: Biometric Information */}
              {formStep === 5 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">Biometric Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Signature/Thumb Impression</label>
                      <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          name="signature"
                          accept="image/*"
                          onChange={handleChange}
                          className="hidden"
                          id="signature-upload"
                        />
                        <label
                          htmlFor="signature-upload"
                          className="cursor-pointer text-sm text-gray-600 hover:text-[#6366F1]"
                        >
                          {formData.signature ? 'Change signature' : 'Upload signature'}
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Iris Scan</label>
                      <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          name="irisScan"
                          accept="image/*"
                          onChange={handleChange}
                          className="hidden"
                          id="iris-scan-upload"
                        />
                        <label
                          htmlFor="iris-scan-upload"
                          className="cursor-pointer text-sm text-gray-600 hover:text-[#6366F1]"
                        >
                          {formData.irisScan ? 'Change iris scan' : 'Upload iris scan'}
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Photograph</label>
                      <div className="mt-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input
                          type="file"
                          name="photograph"
                          accept="image/*"
                          onChange={handleChange}
                          className="hidden"
                          id="photograph-upload"
                        />
                        <label
                          htmlFor="photograph-upload"
                          className="cursor-pointer text-sm text-gray-600 hover:text-[#6366F1]"
                        >
                          {formData.photograph ? 'Change photograph' : 'Upload photograph'}
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}        {/* Step 6: Documents Upload */}
              {formStep === 6 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-gray-800">Documents Upload</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Please upload all required documents in PDF, JPG, or PNG format. Each file should be less than 5MB.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Aadhaar Card */}
                    <div className="border border-gray-200 rounded-md p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Aadhaar Card <span className="text-red-500">*</span></h4>
                      <div className="mt-2">
                        <input
                          type="file"
                          id="idProofUploaded"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(e, 'idProofUploaded')}
                        />
                        <label
                          htmlFor="idProofUploaded"
                          className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          {formData.idProofUploaded ? 'Replace File' : 'Upload File'}
                        </label>
                        {documentFiles.idProofUploaded && (
                          <div className="mt-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-600 truncate max-w-xs">
                              {documentFiles.idProofUploaded.file?.name}
                            </span>
                          </div>
                        )}

                        {errors.idProofUploaded && (
                          <p className="text-red-500 text-xs mt-1">{errors.idProofUploaded}</p>
                        )}
                      </div>
                    </div>

                    {/* PAN Card */}
                    <div className="border border-gray-200 rounded-md p-4">
                      <h4 className="font-medium text-gray-800 mb-2">PAN Card</h4>
                      <div className="mt-2">
                        <input
                          type="file"
                          id="panCardUploaded"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(e, 'panCardUploaded')}
                        />
                        <label
                          htmlFor="panCardUploaded"
                          className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5  0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          {formData.panCardUploaded ? 'Replace File' : 'Upload File'}
                        </label>

                        {documentFiles.panCardUploaded && (
                          <div className="mt-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-600 truncate max-w-xs">
                              {documentFiles.panCardUploaded.file?.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Address Proof */}
                    <div className="border border-gray-200 rounded-md p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Address Proof <span className="text-red-500">*</span></h4>
                      <div className="mt-2">
                        <input
                          type="file"
                          id="addressProofUploaded"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(e, 'addressProofUploaded')}
                        />
                        <label
                          htmlFor="addressProofUploaded"
                          className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          {formData.addressProofUploaded ? 'Replace File' : 'Upload File'}
                        </label>

                        {documentFiles.addressProofUploaded && (
                          <div className="mt-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-600 truncate max-w-xs">
                              {documentFiles.addressProofUploaded.file?.name}
                            </span>
                          </div>
                        )}

                        {errors.addressProofUploaded && (
                          <p className="text-red-500 text-xs mt-1">{errors.addressProofUploaded}</p>
                        )}
                      </div>
                    </div>

                    {/* Photograph */}
                    <div className="border border-gray-200 rounded-md p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Passport Size Photograph <span className="text-red-500">*</span></h4>
                      <div className="mt-2">
                        <input
                          type="file"
                          id="photographUploaded"
                          accept=".jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(e, 'photographUploaded')}
                        />
                        <label
                          htmlFor="photographUploaded"
                          className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 11115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          {formData.photographUploaded ? 'Replace File' : 'Upload File'}
                        </label>

                        {documentFiles.photographUploaded && (
                          <div className="mt-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-600 truncate max-w-xs">
                              {documentFiles.photographUploaded.file?.name}
                            </span>
                          </div>
                        )}

                        {errors.photographUploaded && (
                          <p className="text-red-500 text-xs mt-1">{errors.photographUploaded}</p>
                        )}
                      </div>
                    </div>

                    {/* Character Certificate */}
                    <div className="border border-gray-200 rounded-md p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Character Certificate</h4>
                      <div className="mt-2">
                        <input
                          type="file"
                          id="characterCertificateUploaded"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(e, 'characterCertificateUploaded')}
                        />
                        <label
                          htmlFor="characterCertificateUploaded"
                          className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 11115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          {formData.characterCertificateUploaded ? 'Replace File' : 'Upload File'}
                        </label>

                        {documentFiles.characterCertificateUploaded && (
                          <div className="mt-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-600 truncate max-w-xs">
                              {documentFiles.characterCertificateUploaded.file?.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Medical Certificate */}
                    <div className="border border-gray-200 rounded-md p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Medical Certificate</h4>
                      <div className="mt-2">
                        <input
                          type="file"
                          id="medicalCertificateUploaded"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(e, 'medicalCertificateUploaded')}
                        />
                        <label
                          htmlFor="medicalCertificateUploaded"
                          className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 11115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          {formData.medicalCertificateUploaded ? 'Replace File' : 'Upload File'}
                        </label>

                        {documentFiles.medicalCertificateUploaded && (
                          <div className="mt-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-600 truncate max-w-xs">
                              {documentFiles.medicalCertificateUploaded.file?.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Training Certificate */}
                    <div className="border border-gray-200 rounded-md p-4">
                      <h4 className="font-medium text-gray-800 mb-2">Training Certificate</h4>
                      <div className="mt-2">
                        <input
                          type="file"
                          id="trainingCertificateUploaded"
                          accept=".pdf,.jpg,.jpeg,.png"
                          className="hidden"
                          onChange={(e) => handleDocumentUpload(e, 'trainingCertificateUploaded')}
                        />
                        <label
                          htmlFor="trainingCertificateUploaded"
                          className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 11115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          {formData.trainingCertificateUploaded ? 'Replace File' : 'Upload File'}
                        </label>

                        {documentFiles.trainingCertificateUploaded && (
                          <div className="mt-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-600 truncate max-w-xs">
                              {documentFiles.trainingCertificateUploaded?.file.name}
                            </span>
                          </div>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Other State License</label>
                        <input
                          type="file"
                          name="otherStateLicenseUploaded"
                          onChange={(e) => handleDocumentUpload(e, 'otherStateLicenseUploaded')}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                          accept=".pdf,.jpg,.jpeg,.png"
                        />
                        {documentFiles.otherStateLicenseUploaded && (
                          <div className="mt-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                            </svg>
                            <span className="text-sm text-gray-600 truncate max-w-xs">
                              {documentFiles.otherStateLicenseUploaded?.file.name}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 7: Preview */}
              {formStep === 7 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-800">Application Preview</h3>
                  <p className="text-sm text-gray-600">Please review all your information before submitting the application.</p>

                  <div className="space-y-6 max-h-[60vh] overflow-y-auto">
                    {/* Personal Information Preview */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Personal Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <Field label="Full Name" value={`${formData.applicantName || ''} ${formData.applicantMiddleName || ''} ${formData.applicantLastName || ''}`.trim()} />
                        <Field label="Mobile" value={formData.applicantMobile} />
                        <Field label="Email" value={formData.applicantEmail} />
                        <Field label="Father's Name" value={formData.fatherName} />
                        <Field label="Gender" value={formData.applicantGender} />
                        <Field label="Date of Birth" value={formData.applicantDateOfBirth} />
                        <Field label="ID Type" value={formData.applicantIdType} />
                        <Field label="ID Number" value={formData.applicantIdNumber} />
                      </div>
                    </div>

                    {/* Address Information Preview */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Address Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <Field label="Present Address" value={formData.applicantAddress} />
                        <Field label="Present State" value={formData.presentState} />
                        <Field label="Present District" value={formData.presentDistrict} />
                        <Field label="Present Pincode" value={formData.presentPincode} />
                        <Field label="Permanent Address" value={formData.permanentAddress || formData.applicantAddress} />
                        <Field label="Permanent State" value={formData.permanentState || formData.presentState} />
                        <Field label="Permanent District" value={formData.permanentDistrict || formData.presentDistrict} />
                        <Field label="Permanent Pincode" value={formData.permanentPincode || formData.presentPincode} />
                      </div>
                    </div>

                    {/* Occupation Information Preview */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Occupation & Business</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <Field label="Occupation" value={formData.occupation} />
                        <Field label="Office Address" value={formData.officeBusinessAddress} />
                        <Field label="Office State" value={formData.officeBusinessState} />
                        <Field label="Office District" value={formData.officeBusinessDistrict} />
                        <Field label="Crop Protection Location" value={formData.cropProtectionLocation} />
                        <Field label="Cultivated Area" value={formData.cultivatedArea} />
                      </div>
                    </div>

                    {/* Criminal History Preview */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Criminal History</h4>
                      {formData.criminalHistory && formData.criminalHistory.length > 0 ? (
                        formData.criminalHistory.map((record, index) => (
                          <div key={index} className="mb-3 p-3 bg-white rounded border">
                            <p className="text-sm font-medium">Record #{index + 1}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-2">
                              <Field label="Convicted" value={YesNo(record.convicted)} />
                              <Field label="Case Pending" value={record.isCriminalCasePending} />
                              {record.isCriminalCasePending === 'Yes' && (
                                <>
                                  <Field label="FIR Number" value={record.firNumber} />
                                  <Field label="Police Station" value={record.policeStation} />
                                  <Field label="Section of Law" value={record.sectionOfLaw} />
                                  <Field label="Date of Offence" value={record.dateOfOffence} />
                                  <Field label="Case Status" value={record.caseStatus} />
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-600">No criminal records</p>
                      )}
                    </div>

                    {/* License Details Preview */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">License Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        <Field label="Application Type" value={formData.applicationType} />
                        <Field label="Weapon Type" value={formData.weaponType} />
                        <Field label="License Type" value={formData.licenseType} />
                        <Field label="License Validity" value={formData.licenseValidity} />
                        <Field label="Arms Category" value={formData.armsCategory} />
                        <Field label="Carry Area" value={formData.carryArea} />
                        <Field label="Need for License" value={formData.licenseNeed} />
                        <Field label="Arms Description" value={formData.armsDescription} />
                      </div>
                    </div>

                    {/* License History Preview */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">License History</h4>
                      {formData.licenseHistory && formData.licenseHistory.length > 0 ? (
                        formData.licenseHistory.map((record, index) => (
                          <div key={index} className="mb-3 p-3 bg-white rounded border">
                            <p className="text-sm font-medium">License History #{index + 1}</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm mt-2">
                              <Field label="Applied Before" value={YesNo(record.hasAppliedBefore)} />
                              <Field label="Other Applications" value={YesNo(record.hasOtherApplications)} />
                              <Field label="Family Member License" value={YesNo(record.familyMemberHasArmsLicense)} />
                              <Field label="Safe Place for Arms" value={YesNo(record.hasSafePlaceForArms)} />
                              <Field label="Undergone Training" value={YesNo(record.hasUndergoneTraining)} />
                              <Field label="Previous License" value={record.hasPreviousLicense} />
                              {record.hasPreviousLicense === 'yes' && (
                                <>
                                  <Field label="License Number" value={record.previousLicenseNumber} />
                                  <Field label="Issue Date" value={record.licenseIssueDate} />
                                  <Field label="Expiry Date" value={record.licenseExpiryDate} />
                                  <Field label="Issuing Authority" value={record.issuingAuthority} />
                                </>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-600">No license history</p>
                      )}
                    </div>

                    {/* Documents Preview */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-gray-800 mb-3">Documents Status</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center">
                          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${formData.idProofUploaded ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span>Aadhaar Card</span>
                          {documentFiles.idProofUploaded && (
                            <span className="ml-2 text-xs text-gray-500">({documentFiles.idProofUploaded.file?.name})</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${formData.addressProofUploaded ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span>Address Proof</span>
                          {documentFiles.addressProofUploaded && (
                            <span className="ml-2 text-xs text-gray-500">({documentFiles.addressProofUploaded.file?.name})</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${formData.photographUploaded ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span>Photograph</span>
                          {documentFiles.photographUploaded && (
                            <span className="ml-2 text-xs text-gray-500">({documentFiles.photographUploaded.file?.name})</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${formData.panCardUploaded ? 'bg-green-500' : 'bg-red-500'}`}></span>
                          <span>PAN Card</span>
                          {documentFiles.panCardUploaded && (
                            <span className="ml-2 text-xs text-gray-500">({documentFiles.panCardUploaded.file?.name})</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${formData.characterCertificateUploaded ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          <span>Character Certificate</span>
                          {documentFiles.characterCertificateUploaded && (
                            <span className="ml-2 text-xs text-gray-500">({documentFiles.characterCertificateUploaded.file?.name})</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${formData.medicalCertificateUploaded ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          <span>Medical Certificate</span>
                          {documentFiles.medicalCertificateUploaded && (
                            <span className="ml-2 text-xs text-gray-500">({documentFiles.medicalCertificateUploaded.file?.name})</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${formData.trainingCertificateUploaded ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          <span>Training Certificate</span>
                          {documentFiles.trainingCertificateUploaded && (
                            <span className="ml-2 text-xs text-gray-500">({documentFiles.trainingCertificateUploaded.file?.name})</span>
                          )}
                        </div>
                        <div className="flex items-center">
                          <span className={`inline-block w-3 h-3 rounded-full mr-2 ${formData.otherStateLicenseUploaded ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                          <span>Other State License</span>
                          {documentFiles.otherStateLicenseUploaded && (
                            <span className="ml-2 text-xs text-gray-500">({documentFiles.otherStateLicenseUploaded.file?.name})</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 8: Declaration */}
              {formStep === 8 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-bold text-gray-800">Declaration & Submit</h3>

                  {/* Declaration Checkboxes */}
                  <div className="space-y-4">
                    <h4 className="text-md font-semibold text-gray-800">Declaration</h4>

                    <div className="space-y-3">
                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          name="declaration.agreeToTruth"
                          checked={formData.declaration?.agreeToTruth || false}
                          onChange={handleChange}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.
                        </span>
                      </label>

                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          name="declaration.understandLegalConsequences"
                          checked={formData.declaration?.understandLegalConsequences || false}
                          onChange={handleChange}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          I understand that providing false information may result in legal consequences and rejection of my application.
                        </span>
                      </label>

                      <label className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          name="declaration.agreeToTerms"
                          checked={formData.declaration?.agreeToTerms || false}
                          onChange={handleChange}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">
                          I agree to abide by all terms and conditions related to the arms license and will use the weapon responsibly.
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Display Above Navigation */}
              {apiError && (
                <div className="mt-6 p-4 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3 flex-1">
                      <h3 className="text-sm font-medium text-red-800">
                        Submission Error
                      </h3>
                      <p className="mt-1 text-sm text-red-700">
                        {apiError}
                      </p>

                      {/* Additional error details from API response */}
                      {apiErrorDetails?.responseData && (
                        <div className="mt-2">
                          <button
                            type="button"
                            onClick={() => setShowErrorDetails(!showErrorDetails)}
                            className="text-xs text-red-600 hover:text-red-800 underline focus:outline-none"
                          >
                            {showErrorDetails ? 'Hide Details' : 'Show API Response Details'}
                          </button>

                          {showErrorDetails && (
                            <div className="mt-2 p-3 bg-red-100 rounded-md border border-red-300">
                              <h4 className="text-xs font-semibold text-red-800 mb-2">API Response:</h4>
                              <div className="space-y-2">
                                {/* HTTP Status */}
                                {apiErrorDetails.responseStatus && (
                                  <div className="text-xs">
                                    <span className="font-medium text-red-700">Status:</span> {apiErrorDetails.responseStatus}
                                  </div>
                                )}

                                {/* Success flag */}
                                {apiErrorDetails.responseData.success !== undefined && (
                                  <div className="text-xs">
                                    <span className="font-medium text-red-700">Success:</span> {String(apiErrorDetails.responseData.success)}
                                  </div>
                                )}

                                {/* Main error message */}
                                {apiErrorDetails.responseData.error && (
                                  <div className="text-xs">
                                    <span className="font-medium text-red-700">Error:</span> {apiErrorDetails.responseData.error}
                                  </div>
                                )}

                                {/* Nested error details */}
                                {apiErrorDetails.responseData.details && (
                                  <div className="text-xs">
                                    <span className="font-medium text-red-700">Details:</span>
                                    <div className="ml-2 mt-1 space-y-1">
                                      {apiErrorDetails.responseData.details.response?.error && (
                                        <div>
                                          <span className="font-medium text-red-600">Specific Error:</span> {apiErrorDetails.responseData.details.response.error}
                                        </div>
                                      )}
                                      {apiErrorDetails.responseData.details.status && (
                                        <div>
                                          <span className="font-medium text-red-600">Status Code:</span> {apiErrorDetails.responseData.details.status}
                                        </div>
                                      )}
                                      {apiErrorDetails.responseData.details.message && (
                                        <div>
                                          <span className="font-medium text-red-600">Message:</span> {apiErrorDetails.responseData.details.message}
                                        </div>
                                      )}
                                      {apiErrorDetails.responseData.details.name && (
                                        <div>
                                          <span className="font-medium text-red-600">Exception Type:</span> {apiErrorDetails.responseData.details.name}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}

                                {/* Raw response for debugging */}
                                <details className="mt-2">
                                  <summary className="text-xs font-medium text-red-700 cursor-pointer hover:text-red-900">
                                    Raw API Response (for debugging)
                                  </summary>
                                  <pre className="mt-1 text-xs bg-white p-2 rounded border border-red-200 overflow-x-auto max-h-32">
                                    {JSON.stringify(apiErrorDetails.responseData, null, 2)}
                                  </pre>
                                </details>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setFormStep(Math.max(0, formStep - 1))}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${formStep === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-500 text-white hover:bg-gray-600'
                    }`}
                  disabled={formStep === 0}
                >
                  ← Previous
                </button>

                {/* Test Data Button (only show in development) */}
                {process.env.NODE_ENV === 'development' && (
                  <button
                    type="button"
                    onClick={handleFillTestData}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 text-sm"
                  >
                    Fill Test Data
                  </button>
                )}

                {formStep < formSteps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={isSubmitting}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    disabled={isSubmitting || !formData.declaration?.agreeToTruth || !formData.declaration?.understandLegalConsequences || !formData.declaration?.agreeToTerms}
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </>

  );
}