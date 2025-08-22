"use client";

import { useState, useEffect } from 'react';
import React from 'react';
import { useAuth } from '../config/auth';
import { mockApplications } from '../config/mockData';
import { isZS, hasPermission } from '../config/helpers';

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
  { title: 'Declaration', description: 'Review and submit your application' }
];

export default function FreshApplicationForm({ onSubmit, onCancel }: FreshApplicationFormProps) {
  const { userRole, userName } = useAuth();
  const [formStep, setFormStep] = useState(0); // Start at 0 to match arrays
  const [districts, setDistricts] = useState<string[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(true);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // Add effect to monitor form step changes
  useEffect(() => {
    console.log("Form step changed to:", formStep);
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
  }); const [formData, setFormData] = useState({
    // Personal Information
    applicantName: '',
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
    applicantIdType: 'aadhar',
    applicantIdNumber: '',
    applicantGender: '',
    applicantDateOfBirth: '',
    
    // Document Upload fields
    idProofUploaded: false,
    addressProofUploaded: false,
    photographUploaded: false,
    panCardUploaded: false,
    characterCertificateUploaded: false,
    medicalCertificateUploaded: false,
    trainingCertificateUploaded: false,
    otherStateLicenseUploaded: false,

    // Address Information
    applicantAddress: '',
    presentPincode: '',
    presentPoliceStation: '',
    permanentPincode: '',
    permanentPoliceStation: '',
    sameAsPresent: false,

    // License Information
    applicationType: 'New License',
    weaponType: '',
    weaponReason: '',
    licenseType: 'Regular',
    licenseValidity: '3',

    // Criminal History
    isCriminalCasePending: 'No',
    firNumber: '',
    policeStation: '',
    sectionOfLaw: '',
    dateOfOffence: '',
    caseStatus: '',

    // License History
    hasPreviousLicense: 'no',
    previousLicenseNumber: '',
    licenseIssueDate: '', licenseExpiryDate: '',
    issuingAuthority: '',
    isLicenseRenewed: 'No',
    renewalDate: '',
    renewingAuthority: '',

    // Declarations
    hasCriminalRecord: 'no',
    criminalRecordDetails: '',
    hasSubmittedTrueInfo: false,

    // New fields from freshFormFilde.md
    aliceAcknowledgementNumber: '',
    applicantMiddleName: '',
    applicantLastName: '',
    applicationFilledBy: '',
    placeOfBirth: '',
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
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      console.log(`Checkbox ${name} changed to:`, checked);
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
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

  // Handle document file upload
  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>, docId: string) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
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

  // Fetch Telangana districts for address selection
  React.useEffect(() => {
    const fetchDistricts = async () => {
      try {
        // Using the public API for Indian states and districts
        const response = await fetch('https://api.covid19india.org/state_district_wise.json');
        const data = await response.json();
        // Get Telangana districts
        const telanganaDistricts = data['Telangana'] ? Object.keys(data['Telangana'].districtData) : [];
        setDistricts(telanganaDistricts.sort());
      } catch (err) {
        console.error('Error fetching districts:', err);
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

  // Update permanent address when same as present is toggled
  React.useEffect(() => {
    if (formData.sameAsPresent) {
      setFormData(prev => ({
        ...prev,
        permanentAddress: prev.applicantAddress,
        permanentState: prev.presentState,
        permanentDistrict: prev.presentDistrict,
        permanentPincode: prev.presentPincode,
        permanentPoliceStation: prev.presentPoliceStation
      }));
    }
  }, [formData.sameAsPresent]);  // Validate form fields for current step
  const validateCurrentStep = () => {
    try {
      console.log("Validating step:", formStep);
      console.log("Step name:", formSteps[formStep].title);
      const newErrors: Record<string, string> = {};

      if (formStep === 0) {
        console.log("Validating personal information");
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
        console.log("Validating address information");
        // Address Validation
        if (!formData.applicantAddress) newErrors.applicantAddress = 'Present address is required';
        if (!formData.presentState) newErrors.presentState = 'Present state is required';
        if (!formData.presentDistrict) newErrors.presentDistrict = 'Present district is required';
        if (!formData.presentPincode) newErrors.presentPincode = 'Present pincode is required';

        if (formData.sameAsPresent === false) {
          if (!formData.permanentAddress) newErrors.permanentAddress = 'Permanent address is required';
          if (!formData.permanentState) newErrors.permanentState = 'Permanent state is required';
          if (!formData.permanentDistrict) newErrors.permanentDistrict = 'Permanent district is required';
          if (!formData.permanentPincode) newErrors.permanentPincode = 'Permanent pincode is required';
        }
      }

      if (formStep === 2) {
        console.log("Validating weapon details");
        // Weapon Details Validation
        if (!formData.weaponType) newErrors.weaponType = 'Weapon type is required';
        if (!formData.weaponReason) newErrors.weaponReason = 'Reason for weapon is required';
        if (!formData.licenseType) newErrors.licenseType = 'License type is required';
      }

      if (formStep === 3) {
        console.log("Validating criminal history");
        // Criminal History Validation
        if (formData.isCriminalCasePending === 'Yes') {
          if (!formData.firNumber) newErrors.firNumber = 'FIR number is required';
          if (!formData.policeStation) newErrors.policeStation = 'Police station is required';
          if (!formData.sectionOfLaw) newErrors.sectionOfLaw = 'Section of law is required';
          if (!formData.dateOfOffence) newErrors.dateOfOffence = 'Date of offence is required';
          if (!formData.caseStatus) newErrors.caseStatus = 'Case status is required';
        }
      }

      if (formStep === 4) {
        console.log("Validating license history");
        // License History Validation
        if (formData.hasPreviousLicense === 'yes') {
          if (!formData.previousLicenseNumber) newErrors.previousLicenseNumber = 'Previous license number is required';
          if (!formData.licenseIssueDate) newErrors.licenseIssueDate = 'License issue date is required';
          if (!formData.licenseExpiryDate) newErrors.licenseExpiryDate = 'License expiry date is required';
          if (!formData.issuingAuthority) newErrors.issuingAuthority = 'Issuing authority is required';

          if (formData.isLicenseRenewed === 'Yes') {
            if (!formData.renewalDate) newErrors.renewalDate = 'Renewal date is required';
            if (!formData.renewingAuthority) newErrors.renewingAuthority = 'Renewing authority is required';
          }
        }
      }

      if (formStep === 5) {
        console.log("Validating biometric information");
        // Biometric Validation
        // Add any biometric validation if needed
      }

      if (formStep === 6) {
        console.log("Validating documents upload");
        // Documents Upload Validation
        if (!formData.idProofUploaded) newErrors.idProofUploaded = 'Aadhaar Card is required';
        if (!formData.addressProofUploaded) newErrors.addressProofUploaded = 'Address proof is required';
        if (!formData.photographUploaded) newErrors.photographUploaded = 'Passport Size Photograph is required';
        // Other documents are optional
      }

      if (formStep === 7) {
        console.log("Validating final submission");
        if (formData.hasSubmittedTrueInfo !== true) {
          newErrors.hasSubmittedTrueInfo = 'You must verify that the submitted information is true';
        }
      }

      // Set errors and return validation result
      setErrors(newErrors);
      const isValid = Object.keys(newErrors).length === 0;
      console.log("Validation errors:", newErrors);
      console.log("Validation completed with result:", isValid);
      return isValid;
    } catch (error) {
      console.error("Error during validation:", error);
      return false;
    }
  };  // Handle next step
  const handleNextStep = () => {
    console.log("Current form step:", formStep);
    
    try {
      // Validate current step before proceeding
      const isValid = validateCurrentStep();
      console.log("Form validation result:", isValid);
      
      if (isValid) {
        console.log("Moving to next step:", formStep + 1);
        // Make sure we don't go beyond the max step
        if (formStep < formSteps.length - 1) {
          setFormStep(prev => prev + 1);
        }
      } else {
        console.log("Cannot proceed due to validation errors");
      }
    } catch (error) {
      console.error("Error in handleNextStep:", error);
    }
  };
  // Handle previous step
  const handlePreviousStep = () => {
    console.log("Moving to previous step:", formStep - 1);
    if (formStep > 0) {
      setFormStep(prev => prev - 1);
    }
  };// Handle saving form as draft
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
      console.error('Error saving draft:', error);
      setSaveMessage({ type: 'error', text: 'Failed to save draft. Please try again.' });

      // Clear message after 3 seconds
      setTimeout(() => {
        setSaveMessage(null);
      }, 3000);
    }
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
      console.error('Error loading draft:', error);
    }
  }, []);
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Attempting to submit form");

    // Final validation check for the current step
    const isValid = validateCurrentStep();

    if (isValid) {
      console.log("Form validation passed, submitting application");
  // Generate new application ID using timestamp to avoid reliance on mock data
  const timestamp = Date.now();
  const newId = `AL-2025-${String(timestamp).slice(-6)}`;

      // Calculate age based on date of birth if provided
      let age = '';
      if (formData.applicantDateOfBirth) {
        const dob = new Date(formData.applicantDateOfBirth);
        const today = new Date();
        age = String(today.getFullYear() - dob.getFullYear());
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          age = String(parseInt(age) - 1);
        }
      }
      // Prepare FormData object as per interface
      const newFormData: FormData = {
        applicantName: formData.applicantName,
        applicantMobile: formData.applicantMobile,
        applicantEmail: formData.applicantEmail,
        fatherName: formData.fatherName || '',
        gender: formData.applicantGender,
        dateOfBirth: formData.applicantDateOfBirth,
        age,
        address: formData.applicantAddress,
        city: formData.presentDistrict || '',
        state: formData.presentState || '',
        pincode: formData.presentPincode || '',
        licenseType: formData.licenseType,
        weaponType: formData.weaponType,
        purposeOfWeapon: formData.weaponReason,

        // Criminal history
        hasCriminalRecord: formData.isCriminalCasePending || 'No',
        criminalRecordDetails: formData.caseStatus || '',

        // License history
        previousLicenseInfo: formData.hasPreviousLicense === 'yes' ?
          `License #: ${formData.previousLicenseNumber || ''}, Valid: ${formData.licenseIssueDate || ''} to ${formData.licenseExpiryDate || ''}` :
          'No previous license',

        // Document URLs
        photoUrl: documentFiles.photographUploaded?.preview,
        idProofUrl: documentFiles.idProofUploaded?.preview,
        addressProofUrl: documentFiles.addressProofUploaded?.preview,
      };

      onSubmit(newFormData);
    }
  };
  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="mb-6">
        {/* Success/Error messages */}
        {saveMessage && (
          <div className={`mt-4 p-3 rounded-md ${saveMessage.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {saveMessage.text}
          </div>
        )}
      </div>

      {/* Form Sections Navigation */}
      <div className="mb-6 border border-gray-200 rounded-md">
        <div className="w-full px-2 py-2 overflow-x-auto whitespace-nowrap" style={{scrollbarWidth: 'thin'}}>
          <style jsx global>{`
            ::-webkit-scrollbar {
              width: 6px;
              height: 6px;
            }
            ::-webkit-scrollbar-track {
              background: #f1f1f1;
              border-radius: 8px;
            }
            ::-webkit-scrollbar-thumb {
              background: #888;
              border-radius: 8px;
            }
            ::-webkit-scrollbar-thumb:hover {
              background: #555;
            }
          `}</style>
          <div className="flex space-x-2">
            {formSteps.map((section, index) => (
              <button
                key={index}
                onClick={() => setFormStep(index)}
                className={`flex items-center px-3 py-2 rounded-md text-sm whitespace-nowrap ${
                  formStep === index ? "bg-[#001F54] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                <span className="inline-flex items-center justify-center w-5 h-5 mr-2 font-medium bg-white rounded-full text-xs text-gray-700">
                  {index + 1}
                </span>
                <span>{section.title}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
      <form onSubmit={handleSubmit}>
        {/* Step 0: Personal Information */}
        {formStep === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Personal Information</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Alice Acknowledgement Number</label>
                <input
                  type="text"
                  name="aliceAcknowledgementNumber"
                  value={formData.aliceAcknowledgementNumber}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input
                  type="text"
                  name="applicantName"
                  value={formData.applicantName}
                  onChange={handleChange}
                  className={`mt-1 block w-full p-2 border ${errors.applicantName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                />
                {errors.applicantName && <p className="text-red-500 text-xs mt-1">{errors.applicantName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Middle Name</label>
                <input
                  type="text"
                  name="applicantMiddleName"
                  value={formData.applicantMiddleName}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  type="text"
                  name="applicantLastName"
                  value={formData.applicantLastName}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Place of Birth (Nativity)</label>
                <input
                  type="text"
                  name="placeOfBirth"
                  value={formData.placeOfBirth}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth in Words</label>
                <input
                  type="text"
                  name="dateOfBirthInWords"
                  value={formData.dateOfBirthInWords}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Mobile Number *</label>
                <input
                  type="tel"
                  name="applicantMobile"
                  value={formData.applicantMobile}
                  onChange={handleChange}
                  maxLength={10}
                  className={`mt-1 block w-full p-2 border ${errors.applicantMobile ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                />
                {errors.applicantMobile && <p className="text-red-500 text-xs mt-1">{errors.applicantMobile}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email *</label>
                <input
                  type="email"
                  name="applicantEmail"
                  value={formData.applicantEmail}
                  onChange={handleChange}
                  className={`mt-1 block w-full p-2 border ${errors.applicantEmail ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                />
                {errors.applicantEmail && <p className="text-red-500 text-xs mt-1">{errors.applicantEmail}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Gender *</label>
                <select
                  name="applicantGender"
                  value={formData.applicantGender}
                  onChange={handleChange}
                  className={`mt-1 block w-full p-2 border ${errors.applicantGender ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {errors.applicantGender && <p className="text-red-500 text-xs mt-1">{errors.applicantGender}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth *</label>
                <input
                  type="date"
                  name="applicantDateOfBirth"
                  value={formData.applicantDateOfBirth}
                  onChange={handleChange}
                  className={`mt-1 block w-full p-2 border ${errors.applicantDateOfBirth ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                />
                {errors.applicantDateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.applicantDateOfBirth}</p>}
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Residential Address *</label>
                <textarea
                  name="applicantAddress"
                  value={formData.applicantAddress}
                  onChange={handleChange}
                  className={`mt-1 block w-full p-2 border ${errors.applicantAddress ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                  rows={3}
                />
                {errors.applicantAddress && <p className="text-red-500 text-xs mt-1">{errors.applicantAddress}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">ID Type *</label>
                <select
                  name="applicantIdType"
                  value={formData.applicantIdType}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                >
                  <option value="aadhar">Aadhar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="voter">Voter ID</option>
                  <option value="driving">Driving License</option>
                  <option value="passport">Passport</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">ID Number *</label>
                <input
                  type="text"
                  name="applicantIdNumber"
                  value={formData.applicantIdNumber}
                  onChange={handleChange}
                  className={`mt-1 block w-full p-2 border ${errors.applicantIdNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                />
                {errors.applicantIdNumber && <p className="text-red-500 text-xs mt-1">{errors.applicantIdNumber}</p>}
              </div>
            </div>
          </div>
        )}        {/* Step 1: Address Details */}
        {formStep === 1 && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Present Address</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Complete Address *</label>
                  <textarea
                    name="applicantAddress"
                    value={formData.applicantAddress}
                    onChange={handleChange}
                    className={`mt-1 block w-full p-2 border ${errors.applicantAddress ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                    rows={2}
                  />
                  {errors.applicantAddress && <p className="text-red-500 text-xs mt-1">{errors.applicantAddress}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">State *</label>
                  <select
                    name="presentState"
                    value={formData.presentState}
                    onChange={handleChange}
                    className={`mt-1 block w-full p-2 border ${errors.presentState ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                  >
                    <option value="">Select State</option>
                    <option value="Telangana">Telangana</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Tamil Nadu">Tamil Nadu</option>
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.presentState && <p className="text-red-500 text-xs mt-1">{errors.presentState}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">District *</label>
                  <select
                    name="presentDistrict"
                    value={formData.presentDistrict}
                    onChange={handleChange}
                    className={`mt-1 block w-full p-2 border ${errors.presentDistrict ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                    disabled={loadingDistricts}
                  >
                    <option value="">Select District</option>
                    {districts.map((district) => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                  {loadingDistricts && <p className="text-gray-500 text-xs mt-1">Loading districts...</p>}
                  {errors.presentDistrict && <p className="text-red-500 text-xs mt-1">{errors.presentDistrict}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Pincode *</label>
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

                <div>
                  <label className="block text-sm font-medium text-gray-700">Nearest Police Station</label>
                  <input
                    type="text"
                    name="presentPoliceStation"
                    value={formData.presentPoliceStation}
                    onChange={handleChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                  />
                </div>

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
                  <label className="block text-sm font-medium text-gray-700">Jurisdiction Police Station</label>
                  <input
                    type="text"
                    name="jurisdictionPoliceStation"
                    value={formData.jurisdictionPoliceStation}
                    onChange={handleChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                  />
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
        )}        {/* Step 2: Weapon Details */}
        {formStep === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Weapon Details</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Application Type *</label>
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
                <label className="block text-sm font-medium text-gray-700">Weapon Type *</label>
                <select
                  name="weaponType"
                  value={formData.weaponType}
                  onChange={handleChange}
                  className={`mt-1 block w-full p-2 border ${errors.weaponType ? 'border-red-500' : 'border-gray-300'} rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]`}
                >
                  <option value="">Select Weapon Type</option>
                  <option value="Rifle">Rifle</option>
                  <option value="Shotgun">Shotgun</option>
                  <option value="Handgun">Handgun</option>
                  <option value="Pistol">Pistol</option>
                  <option value="Revolver">Revolver</option>
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

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Reason for Weapon *</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700">Have you previously held an arms license?</label>
                <div className="mt-1 flex gap-4">
                  <label className="inline-flex items-center">                    <input
                    type="radio"
                    name="hasPreviousLicense"
                    value="yes"
                    checked={formData.hasPreviousLicense === 'yes'}
                    onChange={handleChange}
                    className="h-4 w-4 text-[#6366F1]"
                  />
                    <span className="ml-2">Yes</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="hasPreviousLicense"
                      value="no"
                      checked={formData.hasPreviousLicense === 'no'}
                      onChange={handleChange}
                      className="h-4 w-4 text-[#6366F1]"
                    />
                    <span className="ml-2">No</span>
                  </label>
                </div>
              </div>

              {formData.hasPreviousLicense === 'yes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Previous License Number</label>
                  <input
                    type="text"
                    name="previousLicenseNumber"
                    value={formData.previousLicenseNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                  />
                </div>
              )}

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Do you have any criminal records?</label>
                <div className="mt-1 flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="hasCriminalRecord"
                      value="yes"
                      checked={formData.hasCriminalRecord === 'yes'}
                      onChange={handleChange}
                      className="h-4 w-4 text-[#6366F1]"
                    />
                    <span className="ml-2">Yes</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="hasCriminalRecord"
                      value="no"
                      checked={formData.hasCriminalRecord === 'no'}
                      onChange={handleChange}
                      className="h-4 w-4 text-[#6366F1]"
                    />
                    <span className="ml-2">No</span>
                  </label>
                </div>
              </div>

              {formData.hasCriminalRecord === 'yes' && (
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Criminal Record Details</label>
                  <textarea
                    name="criminalRecordDetails"
                    value={formData.criminalRecordDetails}
                    onChange={handleChange}
                    className="mt-1 block w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#6366F1]"
                    rows={3}
                    placeholder="Please provide details of your criminal record"
                  />
                </div>
              )}
            </div>
          </div>
        )}        {/* Step 3: Criminal History */}
        {formStep === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">Criminal History</h3>

            <div className="border-b border-gray-200 pb-4 mb-4">
              <h4 className="text-md font-medium text-gray-700 mb-3">
                Whether the applicant has been convicted?
              </h4>

              <div className="mt-2">
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="convicted"
                      value="yes"
                      checked={formData.convicted === true}
                      onChange={handleChange}
                      className="h-4 w-4 text-[#6366F1]"
                    />
                    <span className="ml-2">Yes</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="convicted"
                      value="no"
                      checked={formData.convicted === false}
                      onChange={handleChange}
                      className="h-4 w-4 text-[#6366F1]"
                    />
                    <span className="ml-2">No</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}        
        {/* Step 4: License Details */}
        {formStep === 4 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800">License Details</h3>

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
            <h3 className="text-lg font-medium text-gray-800">Biometric Information</h3>

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
            <h3 className="text-lg font-medium text-gray-800">Documents Upload</h3>
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {formData.panCardUploaded ? 'Replace File' : 'Upload File'}
                  </label>
                  
                  {documentFiles.panCardUploaded && (
                    <div className="mt-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {formData.trainingCertificateUploaded ? 'Replace File' : 'Upload File'}
                  </label>
                  
                  {documentFiles.trainingCertificateUploaded && (
                    <div className="mt-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-600 truncate max-w-xs">
                        {documentFiles.trainingCertificateUploaded.file?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Other State License (if applicable) */}
              <div className="border border-gray-200 rounded-md p-4">
                <h4 className="font-medium text-gray-800 mb-2">Other State License (if applicable)</h4>
                <div className="mt-2">
                  <input
                    type="file"
                    id="otherStateLicenseUploaded"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => handleDocumentUpload(e, 'otherStateLicenseUploaded')}
                  />
                  <label
                    htmlFor="otherStateLicenseUploaded"
                    className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {formData.otherStateLicenseUploaded ? 'Replace File' : 'Upload File'}
                  </label>
                  
                  {documentFiles.otherStateLicenseUploaded && (
                    <div className="mt-3 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm text-gray-600 truncate max-w-xs">
                        {documentFiles.otherStateLicenseUploaded.file?.name}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}        {/* Step 7: Declaration */}
        {formStep === 7 && (
          <div className="space-y-6">
            <h3 className="text-lg font-medium text-gray-800">Declaration</h3>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-700 mb-3">Declaration Statement</h4>
              <p className="text-sm text-gray-600 mb-4">
                I hereby declare that the information provided above is true and correct to the best of my knowledge and belief. I understand that providing false information may lead to rejection of my application and legal action.
              </p>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="hasSubmittedTrueInfo"
                  checked={formData.hasSubmittedTrueInfo === true}
                  onChange={handleChange}
                  className={`h-4 w-4 text-[#6366F1] border-gray-300 rounded focus:ring-[#6366F1] ${errors.hasSubmittedTrueInfo ? 'border-red-500' : ''}`}
                />
                <label className="ml-2 text-sm text-gray-700">
                  I agree to the above declaration.
                </label>
              </div>
              {errors.hasSubmittedTrueInfo && <p className="text-red-500 text-xs mt-1">{errors.hasSubmittedTrueInfo}</p>}
            </div>
          </div>
        )}

        {/* Form Navigation */}
        <div className="flex justify-between mt-8 pt-4 border-t border-gray-200">
          <div>
            {formStep > 0 ? (
              <button
                type="button"
                onClick={handlePreviousStep}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-[#EEF2FF]"
              >
                Previous
              </button>
            ) : (
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-[#EEF2FF]"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="flex gap-4">            
            <button
              type="button"
              className="px-4 py-2 border border-[#FFCC00] text-[#FFCC00] rounded-md hover:bg-[#FFF8E6]"
              onClick={handleSaveAsDraft}
            >
              Save as Draft
            </button>
            
            {formStep < formSteps.length - 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-4 py-2 bg-[#6366F1] text-white rounded-md hover:bg-[#3B82F6]"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="px-4 py-2 bg-[#6366F1] text-white rounded-md hover:bg-[#3B82F6]"
              >
                Submit Application
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
