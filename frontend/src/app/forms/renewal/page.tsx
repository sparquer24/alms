'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApplicationService } from '../../../api/applicationService';
import { FileUploadService } from '../../../api/fileUploadService';
import { getDocumentUploadMeta } from '../../../services/fileHandler';
import { locationAPI } from '../../../api/locationApi';
import { RenewalService } from '../../../api/renewalService';
import RenewalHeader from '../../../components/forms/renewal/RenewalHeader';
import {
  applyPrefilledDocumentUploads,
  syncPendingRenewalDocuments,
} from '../../../utils/renewalFileUpload';
import { usePrefilledDocumentSync } from '../../../hooks/usePrefilledDocumentSync';
import { asPendingRenewalDocument, collectRenewalFileIds } from '../../../utils/renewalFileUpload';
import PersonalDetailsSection from '../../../components/forms/renewal/sections/PersonalDetailsSection';
import AddressDetailsSection from '../../../components/forms/renewal/sections/AddressDetailsSection';
import OccupationSection from '../../../components/forms/renewal/sections/OccupationSection';
import CriminalHistory from '../../../components/forms/renewal/sections/CriminalHistory';
import LicenseHistory from '../../../components/forms/renewal/sections/LicenseHistory';
import LicenseDetailsSection from '../../../components/forms/renewal/sections/LicenseDetailsSection';
import BiometricInformation from '../../../components/forms/renewal/sections/BiometricInformation';
import DocumentsSection from '../../../components/forms/renewal/sections/DocumentsSection';
import DeclarationSection from '../../../components/forms/renewal/sections/DeclarationSection';

type RenewalFormState = {
  renewalApplicationId: string;
  applicationId: string;
  licenseNumber: string;
  acknowledgementNo: string;
  applicantName: string;
  applicantMiddleName: string;
  applicantLastName: string;
  fatherName: string;
  motherName: string;
  maritalStatus: string;
  nationality: string;
  applicantGender: string;
  applicantDateOfBirth: string;
  placeOfBirth: string;
  applicantIdType: string;
  applicantIdNumber: string;
  aadharNumber: string;
  panNumber: string;
  applicantMobile: string;
  applicantEmail: string;
  filledBy: string;
  dobInWords: string;
  presentAddress: string;
  presentState: string;
  presentDistrict: string;
  presentZone: string;
  presentDivision: string;
  presentPoliceStation: string;
  jurisdictionPoliceStation: string;
  residingSince: string;
  sameAsPresent: boolean;
  permanentAddress: string;
  permanentState: string;
  permanentDistrict: string;
  permanentZone: string;
  permanentDivision: string;
  permanentPoliceStation: string;
  officePhone: string;
  residencePhone: string;
  officeMobile: string;
  alternativeMobile: string;
  occupation: string;
  officeBusinessAddress: string;
  officeBusinessState: string;
  officeBusinessDistrict: string;
  officeBusinessStateName: string;
  officeBusinessDistrictName: string;
  cropProtectionLocation: string;
  cultivatedArea: string;
  applicationType: string;
  armsOptionType: string;
  ammunitionDescription: string;
  carryAreaDistrict: boolean;
  carryAreaState: boolean;
  carryAreaIndia: boolean;
  specialConsiderationClaim: string;
  formIVPlaceArea: string;
  formIVWildBeastsSpec: string;
  weaponType: string;
  weaponId: string;
  requestedWeaponIds: number[];
  weaponReason: string;
  licenseValidity: string;
  licenseType: string;
  hasPreviousLicense: boolean;
  previousApplicationDetails?: any;
  convictedStatus: boolean;
  bondStatus: boolean;
  bondSentenceDate: string;
  bondPeriod: string;
  prohibitedStatus: boolean;
  prohibitedSentenceDate: string;
  prohibitedPeriod: string;
  firNumber: string;
  underSection: string;
  policeStationCriminal: string;
  criminalUnit: string;
  criminalDistrict: string;
  criminalState: string;
  offence: string;
  sentence: string;
  sentenceDate: string;
  // License History fields
  hasAppliedBefore: boolean;
  applicationDate: string;
  authorityAppliedTo: string;
  applicationResult: string;
  licenseRevokedOrSuspended: boolean;
  revokedByAuthority: string;
  revokedReason: string;
  familyMemberHasLicense: boolean;
  familyMemberName: string;
  familyLicenseNumber: string;
  weaponEndorsedList: any[];
  hasSafeCustody: boolean;
  safeCustodyDetails: string;
  hasTrainingUnderRule10: boolean;
  trainingDetails: string;
  idProofUploaded?: File | null;
  addressProofUploaded?: File | null;
  photographUploaded?: File | null;
  panCardUploaded?: File | null;
  characterCertificateUploaded?: File | null;
  medicalCertificateUploaded?: File | null;
  trainingCertificateUploaded?: File | null;
  otherStateLicenseUploaded?: File | null;
  existingArmsLicenseUploaded?: File | null;
  safeCustodyUploaded?: File | null;
  specialEvidenceUploaded?: File | null;
  specialEvidenceFiles?: (File | any)[];
  selectedFingerprint?: string;
  signature?: string;
  irisScan?: string;
  declaration: {
    agreeToTruth: boolean;
    understandLegalConsequences: boolean;
    agreeToTerms: boolean;
  };
  hasSubmittedTrueInfo: boolean;
};

const initialFormState: RenewalFormState = {
  renewalApplicationId: '',
  applicationId: '',
  licenseNumber: '',
  acknowledgementNo: '',
  applicantName: '',
  applicantMiddleName: '',
  applicantLastName: '',
  fatherName: '',
  motherName: '',
  maritalStatus: '',
  nationality: 'Indian',
  applicantGender: '',
  applicantDateOfBirth: '',
  placeOfBirth: '',
  applicantIdType: '',
  applicantIdNumber: '',
  aadharNumber: '',
  panNumber: '',
  applicantMobile: '',
  applicantEmail: '',
  filledBy: '',
  dobInWords: '',
  presentAddress: '',
  presentState: '',
  presentDistrict: '',
  presentZone: '',
presentDivision: '',
   presentPoliceStation: '',
   jurisdictionPoliceStation: '',
   presentPincode: '',
   residingSince: '',
   sameAsPresent: false,
   permanentAddress: '',
   permanentState: '',
   permanentDistrict: '',
   permanentZone: '',
   permanentDivision: '',
   permanentPoliceStation: '',
   permanentPincode: '',
   officePhone: '',
   residencePhone: '',
   officeMobile: '',
   alternativeMobile: '',
  occupation: '',
  officeBusinessAddress: '',
  officeBusinessState: '',
  officeBusinessDistrict: '',
  officeBusinessStateName: '',
  officeBusinessDistrictName: '',
  cropProtectionLocation: '',
  cultivatedArea: '',
  applicationType: 'Renewal',
  armsOptionType: '',
  ammunitionDescription: '',
  carryAreaDistrict: false,
  carryAreaState: false,
  carryAreaIndia: false,
  specialConsiderationClaim: '',
  formIVPlaceArea: '',
  formIVWildBeastsSpec: '',
  weaponType: '',
  weaponId: '',
  requestedWeaponIds: [],
  weaponReason: '',
  licenseValidity: '',
  licenseType: '',
  hasPreviousLicense: false,
  previousApplicationDetails: undefined,
  convictedStatus: false,
  bondStatus: false,
  bondSentenceDate: '',
  bondPeriod: '',
  prohibitedStatus: false,
  prohibitedSentenceDate: '',
  prohibitedPeriod: '',
  firNumber: '',
  underSection: '',
  policeStationCriminal: '',
  criminalUnit: '',
  criminalDistrict: '',
  criminalState: '',
  offence: '',
  sentence: '',
  sentenceDate: '',
  // License History fields
  hasAppliedBefore: false,
  applicationDate: '',
  authorityAppliedTo: '',
  applicationResult: '',
  licenseRevokedOrSuspended: false,
  revokedByAuthority: '',
  revokedReason: '',
  familyMemberHasLicense: false,
  familyMemberName: '',
  familyLicenseNumber: '',
  weaponEndorsedList: [],
  hasSafeCustody: false,
  safeCustodyDetails: '',
  hasTrainingUnderRule10: false,
  trainingDetails: '',
  idProofUploaded: null,
  addressProofUploaded: null,
  photographUploaded: null,
  panCardUploaded: null,
  characterCertificateUploaded: null,
  medicalCertificateUploaded: null,
  trainingCertificateUploaded: null,
  otherStateLicenseUploaded: null,
  existingArmsLicenseUploaded: null,
  safeCustodyUploaded: null,
  specialEvidenceUploaded: null,
  specialEvidenceFiles: [],
  selectedFingerprint: 'RIGHT_THUMB',
  signature: '',
  irisScan: '',
  declaration: {
    agreeToTruth: false,
    understandLegalConsequences: false,
    agreeToTerms: false,
  },
  hasSubmittedTrueInfo: false,
};

const formatDate = (value: any) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
};

const extractData = (response: any) => {
  const root = response?.data ?? response?.body ?? response;
  if (
    root &&
    typeof root === 'object' &&
    root.data &&
    typeof root.data === 'object' &&
    !Array.isArray(root.data)
  ) {
    return root.data;
  }
  return root;
};

const getTextValue = (...values: any[]) => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value;
    if (typeof value === 'number') return String(value);
  }
  return '';
};

const toNumber = (value: any) => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'number') return Number.isNaN(value) ? undefined : value;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const getLicenseNumber = (data: any) =>
  getTextValue(
    data?.licenseNumber,
    data?.almsLicenseId,
    data?.licenseId,
    data?.previousLicenseNumber,
    data?.licenseHistories?.[0]?.previousLicenseNumber,
    data?.licenseHistory?.[0]?.previousLicenseNumber,
    data?.previousApplicationDetails?.previousLicenseNumber
  );

/** Split combined applicantName when API omits firstName/middleName/lastName */
const parseApplicantNameParts = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { first: '', middle: '', last: '' };
  if (parts.length === 1) return { first: parts[0], middle: '', last: '' };
  if (parts.length === 2) return { first: parts[0], middle: '', last: parts[1] };
  return {
    first: parts[0],
    middle: parts.slice(1, -1).join(' '),
    last: parts[parts.length - 1],
  };
};

const getApplicantNameFields = (data: any, personalDetails?: any) => {
  const first = getTextValue(data?.firstName, personalDetails?.firstName, data?.applicantFirstName);
  const middle = getTextValue(
    data?.middleName,
    personalDetails?.middleName,
    data?.applicantMiddleName
  );
  const last = getTextValue(data?.lastName, personalDetails?.lastName, data?.applicantLastName);

  if (first || middle || last) {
    return { applicantName: first, applicantMiddleName: middle, applicantLastName: last };
  }

  const combined = getTextValue(data?.applicantName, personalDetails?.applicantName);
  if (!combined) {
    return { applicantName: '', applicantMiddleName: '', applicantLastName: '' };
  }

  const parsed = parseApplicantNameParts(combined);
  return {
    applicantName: parsed.first,
    applicantMiddleName: parsed.middle,
    applicantLastName: parsed.last,
  };
};

const getSexValue = (value: any) => {
  const normalized = String(value || '')
    .trim()
    .toUpperCase();
  if (['M', 'MALE'].includes(normalized)) return 'MALE';
  if (['F', 'FEMALE'].includes(normalized)) return 'FEMALE';
  if (!normalized) return '';
  return normalized;
};

const normalizeLicensePurpose = (value?: string) => {
  if (!value) return undefined;
  const normalized = String(value).toUpperCase();

  switch (normalized) {
    case 'SELF_PROTECTION':
    case 'SELF_DEFENSE':
    case 'SELF-DEFENSE':
      return 'SELF_PROTECTION';
    case 'SPORTS':
    case 'CROP_PROTECTION':
      return 'SPORTS';
    case 'HEIRLOOM_POLICY':
    case 'BUSINESS_SECURITY':
      return 'HEIRLOOM_POLICY';
    default:
      return normalized;
  }
};

const normalizeArmsCategoryForApi = (value?: string) => {
  const normalized = String(value || '').toUpperCase();
  if (normalized === 'RESTRICTED' || normalized === 'PERMISSIBLE') return normalized;
  if (normalized.includes('RESTRICT')) return 'RESTRICTED';
  if (normalized.includes('PERMISS')) return 'PERMISSIBLE';
  return undefined;
};

const hasCompleteAddressPayload = (formData: RenewalFormState) =>
  Boolean(
    getTextValue(formData.presentAddress) &&
    toNumber(formData.presentState) !== undefined &&
    toNumber(formData.presentDistrict) !== undefined &&
    toNumber(formData.presentPoliceStation) !== undefined &&
    toNumber(formData.presentZone) !== undefined &&
    toNumber(formData.presentDivision) !== undefined &&
    getTextValue(formData.residingSince)
  );

const hasCompleteOccupationPayload = (formData: RenewalFormState) =>
  Boolean(
    getTextValue(formData.occupation) &&
    getTextValue(formData.officeBusinessAddress) &&
    toNumber(formData.officeBusinessState) !== undefined &&
    toNumber(formData.officeBusinessDistrict) !== undefined
  );

const mapLicensePurposeToUiValue = (value?: string) => {
  if (!value) return '';
  const normalized = String(value).toUpperCase();

  switch (normalized) {
    case 'SELF_PROTECTION':
      return 'self_defense';
    case 'SPORTS':
      return 'sports';
    case 'HEIRLOOM_POLICY':
      return 'business_security';
    default:
      return String(value);
  }
};

// Reverse mapping: UI value → API enum
const mapUiValueToLicensePurpose = (value?: string) => {
  if (!value) return '';
  const normalized = String(value).toLowerCase();

  switch (normalized) {
    case 'self_defense':
      return 'SELF_PROTECTION';
    case 'sports':
      return 'SPORTS';
    case 'business_security':
      return 'HEIRLOOM_POLICY';
    default:
      return value;
  }
};

const getPresentAddress = (data: any) => data?.presentAddress || data?.addressDetails;

const normalizeLocationId = (value: any) => {
  if (value === undefined || value === null || value === '') return '';
  return String(value);
};

const getAddressLine = (addr: any) => {
  if (!addr) return '';
  if (typeof addr === 'string') return addr.trim();
  return getTextValue(addr.addressLine, addr.address, addr.line1, addr.street);
};

const hasSavedAddress = (addr: any) => {
  if (!addr) return false;
  if (typeof addr === 'string') return addr.trim().length > 0;
  return Boolean(
    getAddressLine(addr) ||
    addr.stateId ||
    addr.districtId ||
    addr.zoneId ||
    addr.divisionId ||
    addr.policeStationId
  );
};

const mapPresentAddressFields = (data: any) => {
  const presentAddress = getPresentAddress(data);
  if (!hasSavedAddress(presentAddress)) return {};

  return {
    presentAddress: getAddressLine(presentAddress),
    presentState: normalizeLocationId(presentAddress?.stateId ?? presentAddress?.state?.id),
    presentDistrict: normalizeLocationId(
      presentAddress?.districtId ?? presentAddress?.district?.id
    ),
    presentZone: normalizeLocationId(presentAddress?.zoneId ?? presentAddress?.zone?.id),
    presentDivision: normalizeLocationId(
      presentAddress?.divisionId ?? presentAddress?.division?.id
    ),
    presentPoliceStation: normalizeLocationId(
      presentAddress?.policeStationId ?? presentAddress?.policeStation?.id
    ),
    jurisdictionPoliceStation: getTextValue(data?.jurisdictionPoliceStation),
    residingSince: formatDate(
      presentAddress?.sinceResiding || data?.residingSince || data?.presentSince
    ),
    sameAsPresent: Boolean(data?.sameAsPresent),
    officePhone: getTextValue(
      presentAddress?.telephoneOffice,
      data?.telephoneOffice,
      data?.officePhone
    ),
    residencePhone: getTextValue(
      presentAddress?.telephoneResidence,
      data?.telephoneResidence,
      data?.residencePhone
    ),
    officeMobile: getTextValue(
      presentAddress?.officeMobileNumber,
      data?.officeMobileNumber,
      data?.officeMobile
    ),
    alternativeMobile: getTextValue(presentAddress?.alternativeMobile, data?.alternativeMobile),
  };
};

const mapPermanentAddressFields = (data: any) => {
  const permanentAddress = data?.permanentAddress;
  if (!hasSavedAddress(permanentAddress)) return {};

  return {
    permanentAddress: getAddressLine(permanentAddress),
    permanentState: normalizeLocationId(permanentAddress?.stateId ?? permanentAddress?.state?.id),
    permanentDistrict: normalizeLocationId(
      permanentAddress?.districtId ?? permanentAddress?.district?.id
    ),
    permanentZone: normalizeLocationId(permanentAddress?.zoneId ?? permanentAddress?.zone?.id),
    permanentDivision: normalizeLocationId(
      permanentAddress?.divisionId ?? permanentAddress?.division?.id
    ),
    permanentPoliceStation: normalizeLocationId(
      permanentAddress?.policeStationId ?? permanentAddress?.policeStation?.id
    ),
  };
};

const ADDRESS_FORM_KEYS: (keyof RenewalFormState)[] = [
  'presentAddress',
  'presentState',
  'presentDistrict',
  'presentZone',
  'presentDivision',
  'presentPoliceStation',
  'jurisdictionPoliceStation',
  'residingSince',
  'sameAsPresent',
  'permanentAddress',
  'permanentState',
  'permanentDistrict',
  'permanentZone',
  'permanentDivision',
  'permanentPincode',
  'permanentPoliceStation',
  'officePhone',
  'residencePhone',
  'officeMobile',
  'alternativeMobile',
];

const OCCUPATION_FORM_KEYS: (keyof RenewalFormState)[] = [
  'occupation',
  'officeBusinessAddress',
  'officeBusinessState',
  'officeBusinessDistrict',
  'officeBusinessStateName',
  'officeBusinessDistrictName',
  'cropProtectionLocation',
  'cultivatedArea',
];

const CRIMINAL_FORM_KEYS: (keyof RenewalFormState)[] = [
  'convictedStatus',
  'bondStatus',
  'bondSentenceDate',
  'bondPeriod',
  'prohibitedStatus',
  'prohibitedSentenceDate',
  'prohibitedPeriod',
  'firNumber',
  'underSection',
  'policeStationCriminal',
  'criminalUnit',
  'criminalDistrict',
  'criminalState',
  'offence',
  'sentence',
  'sentenceDate',
];

const LICENSE_HISTORY_EXTRA_KEYS = [
  'hasPreviousLicense',
  'previousApplicationDetails',
  'hasAppliedBefore',
  'applicationDate',
  'authorityAppliedTo',
  'applicationResult',
  'licenseRevokedOrSuspended',
  'revokedByAuthority',
  'revokedReason',
  'familyMemberHasLicense',
  'familyMemberName',
  'familyLicenseNumber',
  'weaponEndorsedList',
  'hasSafeCustody',
  'safeCustodyDetails',
  'hasTrainingUnderRule10',
  'trainingDetails',
] as const;

const LICENSE_DETAIL_FORM_KEYS: (keyof RenewalFormState)[] = [
  'armsOptionType',
  'carryAreaDistrict',
  'carryAreaState',
  'carryAreaIndia',
  'ammunitionDescription',
  'specialConsiderationClaim',
  'formIVPlaceArea',
  'formIVWildBeastsSpec',
  'weaponType',
  'weaponId',
  'requestedWeaponIds',
  'weaponReason',
  'licenseValidity',
  'licenseType',
];

const normalizeArmsCategory = (value?: string) => {
  const normalized = String(value || '')
    .trim()
    .toUpperCase();
  if (normalized === 'RESTRICTED' || normalized === 'PERMISSIBLE') return normalized;
  return '';
};

const weaponNameToSelectValue = (name?: string) => {
  const lower = String(name || '').toLowerCase();
  if (lower.includes('revolver')) return 'revolver';
  if (lower.includes('pistol')) return 'pistol';
  if (lower.includes('rifle')) return 'rifle';
  if (lower.includes('shotgun')) return 'shotgun';
  return lower;
};

// Map UI arms option to API armsCategory enum
const mapArmsOptionToCategory = (armsOption?: string): string => {
  if (!armsOption) return '';
  const normalized = String(armsOption).toUpperCase();

  // Map common arm types to RESTRICTED or PERMISSIBLE
  if (normalized.includes('PISTOL') || normalized.includes('REVOLVER')) {
    return 'RESTRICTED';
  }
  if (normalized.includes('RIFLE') || normalized.includes('SHOTGUN')) {
    return 'RESTRICTED';
  }
  if (normalized.includes('PERMISSIBLE')) {
    return 'PERMISSIBLE';
  }
  if (normalized.includes('RESTRICTED')) {
    return 'RESTRICTED';
  }
  return 'RESTRICTED'; // default to RESTRICTED
};

const parseCarryAreaFlags = (areaOfValidity?: string) => {
  const area = String(areaOfValidity || '').trim();
  if (!area) {
    return {
      carryAreaDistrict: false,
      carryAreaState: false,
      carryAreaIndia: false,
    };
  }

  return {
    carryAreaDistrict: area.includes('District-wide') || /\bDISTRICT\b/i.test(area),
    carryAreaState:
      area.includes('State-wide') || (/\bSTATE\b/i.test(area) && !/Throughout India/i.test(area)),
    carryAreaIndia: area.includes('Throughout India') || /\bINDIA\b/i.test(area),
  };
};

const buildAreaOfValidityPayload = (formData: RenewalFormState) => {
  const areas = [
    formData.carryAreaDistrict ? 'District-wide' : '',
    formData.carryAreaState ? 'State-wide' : '',
    formData.carryAreaIndia ? 'Throughout India' : '',
  ].filter(Boolean);

  return areas.length ? areas.join(', ') : undefined;
};

const BIOMETRIC_FORM_KEYS: (keyof RenewalFormState)[] = [
  'selectedFingerprint',
  'signature',
  'irisScan',
];

const DOCUMENT_FORM_KEYS = [
  'idProofUploaded',
  'addressProofUploaded',
  'photographUploaded',
  'panCardUploaded',
  'characterCertificateUploaded',
  'medicalCertificateUploaded',
  'trainingCertificateUploaded',
  'otherStateLicenseUploaded',
  'existingArmsLicenseUploaded',
  'safeCustodyUploaded',
  'specialEvidenceUploaded',
  'specialEvidenceFiles',
] as const;

const hasSavedOccupation = (data: any) => {
  const occ = data?.occupationAndBusiness;
  return Boolean(
    occ &&
    (occ.occupation ||
      occ.officeAddress ||
      occ.stateId ||
      occ.districtId ||
      occ.cropLocation ||
      occ.areaUnderCultivation)
  );
};

const hasSavedCriminal = (data: any) =>
  Boolean(Array.isArray(data?.criminalHistories) && data.criminalHistories.length > 0);

const getPrimaryLicenseHistory = (data: any) => {
  if (Array.isArray(data?.licenseHistories) && data.licenseHistories.length)
    return data.licenseHistories[0];
  if (Array.isArray(data?.licenseHistory) && data.licenseHistory.length)
    return data.licenseHistory[0];
  return data?.previousApplicationDetails || null;
};

const hasSavedLicenseHistory = (data: any) =>
  Boolean(
    getPrimaryLicenseHistory(data) ||
    (Array.isArray(data?.licenseHistories) && data.licenseHistories.length > 0) ||
    (Array.isArray(data?.licenseHistory) && data.licenseHistory.length > 0)
  );

const hasSavedLicenseDetails = (data: any) =>
  Boolean(Array.isArray(data?.licenseDetails) && data.licenseDetails.length > 0);

const hasSavedBiometric = (data: any) => {
  const biometric = data?.biometricData?.biometricData || data?.biometricData;
  return Boolean(
    biometric &&
    (biometric.id ||
      biometric.signature ||
      biometric.irisScan ||
      (Array.isArray(biometric.fingerprints) && biometric.fingerprints.length > 0))
  );
};

const FILE_TYPE_TO_FORM_FIELD: Record<string, string> = {
  AADHAR_CARD: 'idProofUploaded',
  PAN_CARD: 'panCardUploaded',
  TRAINING_CERTIFICATE: 'trainingCertificateUploaded',
  MEDICAL_REPORT: 'medicalCertificateUploaded',
  OTHER_STATE_LICENSE: 'otherStateLicenseUploaded',
  EXISTING_LICENSE: 'existingArmsLicenseUploaded',
  SAFE_CUSTODY: 'safeCustodyUploaded',
  ADDRESS_PROOF: 'addressProofUploaded',
  PHOTOGRAPH: 'photographUploaded',
  CHARACTER_CERTIFICATE: 'characterCertificateUploaded',
  CLAIM_DOCS: 'specialEvidenceUploaded',
  CLAIM_DOCUMENTS: 'specialEvidenceUploaded',
};

const normalizeUploadRecord = (file: any) => {
  if (!file) return null;
  const fileType = String(file?.fileType || file?.type || '').toUpperCase();
  return {
    ...file,
    id:
      typeof file?.id === 'number'
        ? file.id
        : typeof file?.fileId === 'number'
          ? file.fileId
          : undefined,
    fileName: file?.fileName || file?.name || file?.file_name || 'document',
    fileUrl: file?.fileUrl || file?.url || file?.path || file?.file_url,
    fileType,
  };
};

const collectUploadedFilesFromApi = (data: any): any[] => {
  if (!data || typeof data !== 'object') return [];

  const sources = [
    data.fileUploads,
    data.renewalFileUploads,
    data.uploads,
    data.file_uploads,
    data.documents,
  ];

  for (const source of sources) {
    if (Array.isArray(source) && source.length) {
      return source.map(normalizeUploadRecord).filter(Boolean);
    }
  }

  return [];
};

const getUploadedFiles = (data: any) => collectUploadedFilesFromApi(data);

const hasSavedDocuments = (data: any) => getUploadedFiles(data).length > 0;

const resolveFreshApplicationId = (renewalData: any, urlApplicationId: string) =>
  getTextValue(
    urlApplicationId,
    renewalData?.applicationId,
    renewalData?.freshApplicationId,
    renewalData?.sourceApplicationId
  );

const fetchFreshApplicationWithFiles = async (applicationId: string) => {
  if (!applicationId) return null;

  const freshResponse = await ApplicationService.getApplication(applicationId);
  let freshData = extractData(freshResponse);
  if (!freshData) return null;

  if (!collectUploadedFilesFromApi(freshData).length) {
    try {
      const files = await FileUploadService.getFiles(applicationId);
      if (Array.isArray(files) && files.length) {
        freshData = { ...freshData, fileUploads: files };
      }
    } catch (fileErr) {
      console.warn('Unable to load fresh application file uploads', fileErr);
    }
  }

  return freshData;
};

const mergeDocumentFieldsFromFresh = (
  merged: RenewalFormState,
  fresh: RenewalFormState,
  renewalFileIds?: ReadonlySet<number>
) => {
  for (const key of DOCUMENT_FORM_KEYS) {
    if (key === 'specialEvidenceFiles') continue;
    const mergedMeta = getDocumentUploadMeta((merged as Record<string, unknown>)[key]);
    const freshMeta = getDocumentUploadMeta((fresh as Record<string, unknown>)[key]);
    if (!mergedMeta.uploaded && freshMeta.uploaded) {
      (merged as Record<string, unknown>)[key] =
        asPendingRenewalDocument((fresh as Record<string, unknown>)[key], renewalFileIds ?? null) ??
        (fresh as Record<string, unknown>)[key];
    }
  }

  const mergedEvidence = Array.isArray(merged.specialEvidenceFiles)
    ? merged.specialEvidenceFiles
    : [];
  const freshEvidence = Array.isArray(fresh.specialEvidenceFiles) ? fresh.specialEvidenceFiles : [];
  if (!mergedEvidence.length && freshEvidence.length) {
    merged.specialEvidenceFiles = freshEvidence
      .map(file => asPendingRenewalDocument(file, renewalFileIds ?? null))
      .filter(Boolean) as RenewalFormState['specialEvidenceFiles'];
    merged.specialEvidenceUploaded = (asPendingRenewalDocument(
      fresh.specialEvidenceUploaded,
      renewalFileIds ?? null
    ) ?? fresh.specialEvidenceUploaded) as any;
  }
};

const restoreSectionFromFresh = (
  merged: RenewalFormState,
  fresh: RenewalFormState,
  keys: readonly (keyof RenewalFormState | string)[]
) => {
  for (const key of keys) {
    (merged as Record<string, unknown>)[key] = (fresh as Record<string, unknown>)[key];
  }
};

const mergeRenewalStateOverFresh = (
  fresh: RenewalFormState,
  renewal: RenewalFormState,
  renewalData: any
): RenewalFormState => {
  const merged: RenewalFormState = { ...fresh, ...renewal };

  merged.renewalApplicationId = renewal.renewalApplicationId || fresh.renewalApplicationId;
  merged.applicationId = renewal.applicationId || fresh.applicationId;
  merged.licenseNumber = renewal.licenseNumber || fresh.licenseNumber;
  merged.acknowledgementNo = renewal.acknowledgementNo || fresh.acknowledgementNo;

  const personalPreferFreshKeys: (keyof RenewalFormState)[] = [
    'applicantName',
    'applicantMiddleName',
    'applicantLastName',
    'placeOfBirth',
    'filledBy',
    'dobInWords',
    'motherName',
    'maritalStatus',
  ];
  for (const key of personalPreferFreshKeys) {
    const renewalValue = renewal[key];
    if (typeof renewalValue === 'string' && !renewalValue.trim()) {
      (merged as Record<string, unknown>)[key] = fresh[key];
    }
  }

  if (!hasSavedAddress(getPresentAddress(renewalData))) {
    restoreSectionFromFresh(merged, fresh, ADDRESS_FORM_KEYS);
  } else if (!hasSavedAddress(renewalData?.permanentAddress)) {
    restoreSectionFromFresh(merged, fresh, [
      'permanentAddress',
      'permanentState',
      'permanentDistrict',
      'permanentZone',
      'permanentDivision',
      'permanentPincode',
      'permanentPoliceStation',
    ]);
  }

  if (!hasSavedOccupation(renewalData)) {
    restoreSectionFromFresh(merged, fresh, OCCUPATION_FORM_KEYS);
  }

  if (!hasSavedCriminal(renewalData)) {
    restoreSectionFromFresh(merged, fresh, CRIMINAL_FORM_KEYS);
  }

  if (!hasSavedLicenseHistory(renewalData)) {
    restoreSectionFromFresh(merged, fresh, LICENSE_HISTORY_EXTRA_KEYS);
  }

  if (!hasSavedLicenseDetails(renewalData)) {
    restoreSectionFromFresh(merged, fresh, LICENSE_DETAIL_FORM_KEYS);
  } else {
    const renewalLicense = renewalData.licenseDetails?.[0];
    const partialLicenseKeys: string[] = [];

    if (!String(renewalLicense?.areaOfValidity || '').trim()) {
      partialLicenseKeys.push('carryAreaDistrict', 'carryAreaState', 'carryAreaIndia');
    }
    if (!normalizeArmsCategory(renewalLicense?.armsCategory)) {
      partialLicenseKeys.push('armsOptionType', 'licenseType');
    }
    if (
      !Array.isArray(renewalLicense?.requestedWeapons) ||
      renewalLicense.requestedWeapons.length === 0
    ) {
      partialLicenseKeys.push('requestedWeaponIds', 'weaponType', 'weaponId');
    }

    if (partialLicenseKeys.length) {
      restoreSectionFromFresh(merged, fresh, partialLicenseKeys);
    }

    const licenseFieldKeys = [
      ...LICENSE_DETAIL_FORM_KEYS,
      'specialEvidenceUploaded',
      'specialEvidenceFiles',
    ] as const;
    for (const key of licenseFieldKeys) {
      const renewalValue = (renewal as Record<string, unknown>)[key];
      const freshValue = (fresh as Record<string, unknown>)[key];
      const renewalEmpty =
        renewalValue === null ||
        renewalValue === undefined ||
        renewalValue === '' ||
        (Array.isArray(renewalValue) && renewalValue.length === 0) ||
        (typeof renewalValue === 'boolean' &&
          key.startsWith('carryArea') &&
          renewalValue === false &&
          freshValue === true);
      if (renewalEmpty) {
        (merged as Record<string, unknown>)[key] = freshValue;
      }
    }
  }

  if (!getTextValue(merged.presentPincode) && getTextValue(fresh.presentPincode)) {
    merged.presentPincode = fresh.presentPincode;
  }

  const renewalClaimFiles = getUploadedFiles(renewalData).filter((file: any) => {
    const type = String(file?.fileType || file?.type || '').toUpperCase();
    return type === 'CLAIM_DOCS' || type === 'CLAIM_DOCUMENTS';
  });
  if (!renewalClaimFiles.length) {
    restoreSectionFromFresh(merged, fresh, ['specialEvidenceUploaded', 'specialEvidenceFiles']);
  }

  if (!hasSavedBiometric(renewalData)) {
    restoreSectionFromFresh(merged, fresh, BIOMETRIC_FORM_KEYS);
  }

  if (renewalData?.isDeclarationAccepted !== undefined || renewalData?.isAwareOfLegalConsequences !== undefined || renewalData?.isTermsAccepted !== undefined || renewalData?.declaration) {
    merged.declaration = {
      agreeToTruth: Boolean(renewalData?.declaration?.agreeToTruth ?? renewalData?.isDeclarationAccepted),
      understandLegalConsequences: Boolean(renewalData?.declaration?.understandLegalConsequences ?? renewalData?.isAwareOfLegalConsequences),
      agreeToTerms: Boolean(renewalData?.declaration?.agreeToTerms ?? renewalData?.isTermsAccepted),
    };
  }

  const renewalFileIds = collectRenewalFileIds(renewalData);

  if (!hasSavedDocuments(renewalData)) {
    restoreSectionFromFresh(merged, fresh, DOCUMENT_FORM_KEYS);
    for (const key of DOCUMENT_FORM_KEYS) {
      if (key === 'specialEvidenceFiles') {
        if (Array.isArray(merged.specialEvidenceFiles)) {
          merged.specialEvidenceFiles = merged.specialEvidenceFiles
            .map(file => asPendingRenewalDocument(file, renewalFileIds))
            .filter(Boolean) as RenewalFormState['specialEvidenceFiles'];
        }
        continue;
      }
      const pending = asPendingRenewalDocument(
        (merged as Record<string, unknown>)[key],
        renewalFileIds
      );
      if (pending) (merged as Record<string, unknown>)[key] = pending;
    }
  }

  mergeDocumentFieldsFromFresh(merged, fresh, renewalFileIds);

  return merged;
};

const mapOccupationFields = (data: any) => {
  if (!hasSavedOccupation(data)) return {};

  const occ = data.occupationAndBusiness;
  return {
    occupation: getTextValue(occ?.occupation, data?.occupation),
    officeBusinessAddress: getTextValue(occ?.officeAddress, data?.officeBusinessAddress),
    officeBusinessState: normalizeLocationId(occ?.stateId ?? occ?.state?.id),
    officeBusinessDistrict: normalizeLocationId(occ?.districtId ?? occ?.district?.id),
    officeBusinessStateName: getTextValue(occ?.state?.name, occ?.stateName),
    officeBusinessDistrictName: getTextValue(occ?.district?.name, occ?.districtName),
    cropProtectionLocation: getTextValue(occ?.cropLocation, data?.cropProtectionLocation),
    cultivatedArea: getTextValue(occ?.areaUnderCultivation, data?.cultivatedArea),
  };
};

const mapSpecialEvidenceFields = (data: any) => {
  const uploads = getUploadedFiles(data);
  const hasSpecialClaim = Boolean(
    getTextValue(
      data?.licenseDetails?.[0]?.specialConsiderationReason,
      data?.specialConsiderationClaim
    )?.trim()
  );

  let claimFiles = uploads.filter((file: any) => {
    const type = String(file?.fileType || file?.type || '').toUpperCase();
    return type === 'CLAIM_DOCS' || type === 'CLAIM_DOCUMENTS';
  });

  if (!claimFiles.length && hasSpecialClaim) {
    claimFiles = uploads.filter((file: any) => {
      const type = String(file?.fileType || file?.type || '').toUpperCase();
      return type === 'MEDICAL_REPORT';
    });
  }

  const licenseUploaded = data?.licenseDetails?.[0]?.uploadedFiles;
  if (Array.isArray(licenseUploaded) && licenseUploaded.length) {
    claimFiles = [...claimFiles, ...licenseUploaded];
  }

  if (!claimFiles.length) {
    return { specialEvidenceUploaded: null, specialEvidenceFiles: [] as any[] };
  }

  const normalized = claimFiles.map((file: any) => ({
    ...file,
    fileName: file.fileName || file.name,
    fileUrl: file.fileUrl || file.url || file.path,
  }));

  return {
    specialEvidenceUploaded: normalized[0],
    specialEvidenceFiles: normalized,
  };
};

const mapLicenseDetailFields = (data: any) => {
  const primary =
    Array.isArray(data?.licenseDetails) && data.licenseDetails.length
      ? data.licenseDetails[0]
      : null;
  if (!primary) return {};

  const requestedWeapons = Array.isArray(primary?.requestedWeapons) ? primary.requestedWeapons : [];
  const requestedWeaponIds = requestedWeapons
    .map((weapon: any) => Number(weapon?.id))
    .filter((id: number) => !Number.isNaN(id));

  return {
    armsOptionType: normalizeArmsCategory(
      primary?.armsCategory ?? primary?.armsOption ?? data?.armsOption
    ),
    ...parseCarryAreaFlags(primary?.areaOfValidity),
    ammunitionDescription: getTextValue(
      primary?.ammunitionDescription,
      data?.ammunitionDescription
    ),
    specialConsiderationClaim: getTextValue(
      primary?.specialConsiderationReason,
      data?.specialConsiderationClaim
    ),
    formIVPlaceArea: getTextValue(primary?.licencePlaceArea, data?.formIVPlaceArea),
    formIVWildBeastsSpec: getTextValue(
      primary?.wildBeastsSpecification,
      data?.formIVWildBeastsSpec,
      data?.wildBeastsSpecification
    ),
    requestedWeaponIds,
    weaponId: requestedWeaponIds[0] ? String(requestedWeaponIds[0]) : '',
    weaponType: requestedWeapons[0]
      ? weaponNameToSelectValue(requestedWeapons[0]?.name)
      : getTextValue(data?.weaponType),
    weaponReason: mapLicensePurposeToUiValue(
      getTextValue(primary?.needForLicense, data?.weaponReason)
    ),
    licenseValidity: getTextValue(primary?.licenseValidity, data?.licenseValidity),
    licenseType: normalizeArmsCategory(primary?.armsCategory) || getTextValue(data?.licenseType),
    ...mapSpecialEvidenceFields(data),
  };
};

const mapLicenseResultToUi = (value?: string) => {
  const normalized = String(value || '')
    .trim()
    .toUpperCase();
  if (normalized === 'APPROVED') return 'approved';
  if (normalized === 'REJECTED') return 'rejected';
  if (normalized === 'PENDING') return 'pending';
  return String(value || '')
    .trim()
    .toLowerCase();
};

const mapLicenseHistoryFields = (data: any) => {
  if (!hasSavedLicenseHistory(data)) return {};

  const licenseHistory = getPrimaryLicenseHistory(data);
  const familyWeapons = licenseHistory?.familyWeaponsEndorsed;
  const weaponEndorsedList = Array.isArray(familyWeapons)
    ? familyWeapons.map((weapon: string, index: number) => ({
        id: `weapon-${index}-${weapon}`,
        value: String(weapon).toLowerCase(),
      }))
    : undefined;

  return {
    hasPreviousLicense: Boolean(
      data?.hasPreviousLicense || data?.licenseHistories?.length || data?.licenseHistory?.length
    ),
    previousApplicationDetails: licenseHistory || undefined,
    hasAppliedBefore: Boolean(licenseHistory?.hasAppliedBefore || data?.hasAppliedBefore),
    applicationDate: formatDate(licenseHistory?.dateAppliedFor || data?.applicationDate),
    authorityAppliedTo: getTextValue(
      licenseHistory?.previousAuthorityName,
      data?.authorityAppliedTo
    ),
    applicationResult: getTextValue(licenseHistory?.previousResult, data?.applicationResult),
    licenseRevokedOrSuspended: Boolean(
      licenseHistory?.hasLicenceSuspended || data?.licenseRevokedOrSuspended
    ),
    revokedByAuthority: getTextValue(
      licenseHistory?.suspensionAuthorityName,
      data?.revokedByAuthority
    ),
    revokedReason: getTextValue(licenseHistory?.suspensionReason, data?.revokedReason),
    familyMemberHasLicense: Boolean(
      licenseHistory?.hasFamilyLicence || data?.familyMemberHasLicense
    ),
    familyMemberName: getTextValue(licenseHistory?.familyMemberName, data?.familyMemberName),
    familyLicenseNumber: getTextValue(
      licenseHistory?.familyLicenceNumber,
      data?.familyLicenseNumber
    ),
    hasSafeCustody: Boolean(licenseHistory?.hasSafePlace || data?.hasSafeCustody),
    safeCustodyDetails: getTextValue(licenseHistory?.safePlaceDetails, data?.safeCustodyDetails),
    hasTrainingUnderRule10: Boolean(licenseHistory?.hasTraining || data?.hasTrainingUnderRule10),
    trainingDetails: getTextValue(licenseHistory?.trainingDetails, data?.trainingDetails),
    ...(weaponEndorsedList ? { weaponEndorsedList } : {}),
  };
};

const mapCriminalHistoryFields = (data: any) => {
  if (!hasSavedCriminal(data)) return {};

  const primaryCriminal = data.criminalHistories[0];
  let firDetails = primaryCriminal?.firDetails || [];
  if (typeof firDetails === 'string') {
    try {
      firDetails = JSON.parse(firDetails);
    } catch {
      firDetails = [];
    }
  }
  if (!Array.isArray(firDetails)) {
    firDetails = [];
  }

  return {
    convictedStatus: primaryCriminal
      ? Boolean(primaryCriminal.isConvicted)
      : Boolean(data?.convictedStatus),
    bondStatus: primaryCriminal
      ? Boolean(primaryCriminal.isBondExecuted)
      : Boolean(data?.bondStatus),
    bondSentenceDate: primaryCriminal?.bondDate
      ? formatDate(primaryCriminal.bondDate)
      : getTextValue(data?.bondSentenceDate),
    bondPeriod: getTextValue(primaryCriminal?.bondPeriod, data?.bondPeriod),
    prohibitedStatus: primaryCriminal
      ? Boolean(primaryCriminal.isProhibited)
      : Boolean(data?.prohibitedStatus),
    prohibitedSentenceDate: primaryCriminal?.prohibitionDate
      ? formatDate(primaryCriminal.prohibitionDate)
      : getTextValue(data?.prohibitedSentenceDate),
    prohibitedPeriod: getTextValue(primaryCriminal?.prohibitionPeriod, data?.prohibitedPeriod),
    firNumber: getTextValue(firDetails?.[0]?.firNumber, data?.firNumber),
    underSection: getTextValue(firDetails?.[0]?.underSection, data?.underSection),
    policeStationCriminal: getTextValue(
      firDetails?.[0]?.policeStation,
      data?.policeStationCriminal
    ),
    criminalUnit: getTextValue(firDetails?.[0]?.unit, data?.criminalUnit),
    criminalDistrict: getTextValue(
      firDetails?.[0]?.district,
      firDetails?.[0]?.District,
      data?.criminalDistrict
    ),
    criminalState: getTextValue(firDetails?.[0]?.state, data?.criminalState),
    offence: getTextValue(firDetails?.[0]?.offence, data?.offence),
    sentence: getTextValue(firDetails?.[0]?.sentence, data?.sentence),
    sentenceDate: firDetails?.[0]?.date
      ? formatDate(firDetails[0].date)
      : firDetails?.[0]?.DateOfSentence
        ? formatDate(firDetails[0].DateOfSentence)
        : getTextValue(data?.sentenceDate),
  };
};

const mapBiometricFields = (data: any) => {
  if (!hasSavedBiometric(data)) return {};

  const biometric = data?.biometricData?.biometricData || data?.biometricData || null;

  return {
    selectedFingerprint:
      getTextValue(biometric?.fingerprints?.[0]?.position, data?.selectedFingerprint) ||
      initialFormState.selectedFingerprint,
    signature: getTextValue(biometric?.signature, data?.signature),
    irisScan: getTextValue(biometric?.irisScan, data?.irisScan),
  };
};

const mapDocumentUploadFields = (data: any, renewalFileIds?: ReadonlySet<number> | null) => {
  const uploads = getUploadedFiles(data);
  const filesByType: Record<string, any> = {};
  const filesByField: Record<string, any> = {};

  for (const f of uploads) {
    const normalized = normalizeUploadRecord(f);
    if (!normalized) continue;
    if (normalized.fileType) filesByType[normalized.fileType] = normalized;
    const fieldKey = FILE_TYPE_TO_FORM_FIELD[normalized.fileType];
    if (fieldKey && !filesByField[fieldKey]) {
      filesByField[fieldKey] = normalized;
    }
  }

  const toRenewalFieldValue = (file: any) => {
    if (!file) return null;
    return (
      asPendingRenewalDocument(file, renewalFileIds === undefined ? null : renewalFileIds) ||
      normalizeUploadRecord(file)
    );
  };

  const pickField = (fieldKey: string, ...typeKeys: string[]) => {
    const direct = data?.[fieldKey];
    const directMeta = getDocumentUploadMeta(direct);
    if (directMeta.uploaded) {
      return toRenewalFieldValue({ ...direct, ...directMeta }) || toRenewalFieldValue(direct);
    }
    if (filesByField[fieldKey]) return toRenewalFieldValue(filesByField[fieldKey]);
    for (const typeKey of typeKeys) {
      if (filesByType[typeKey]) return toRenewalFieldValue(filesByType[typeKey]);
    }
    return null;
  };

  const claimFiles = uploads
    .filter((file: any) => {
      const type = String(file?.fileType || file?.type || '').toUpperCase();
      return type === 'CLAIM_DOCS' || type === 'CLAIM_DOCUMENTS';
    })
    .map((file: any) => toRenewalFieldValue(file))
    .filter(Boolean);

  const mapped = {
    idProofUploaded: pickField('idProofUploaded', 'AADHAR_CARD'),
    addressProofUploaded: pickField('addressProofUploaded', 'ADDRESS_PROOF'),
    photographUploaded: pickField('photographUploaded', 'PHOTOGRAPH'),
    panCardUploaded: pickField('panCardUploaded', 'PAN_CARD'),
    characterCertificateUploaded: pickField(
      'characterCertificateUploaded',
      'CHARACTER_CERTIFICATE'
    ),
    trainingCertificateUploaded: pickField('trainingCertificateUploaded', 'TRAINING_CERTIFICATE'),
    medicalCertificateUploaded: pickField('medicalCertificateUploaded', 'MEDICAL_REPORT'),
    otherStateLicenseUploaded: pickField('otherStateLicenseUploaded', 'OTHER_STATE_LICENSE'),
    existingArmsLicenseUploaded: pickField('existingArmsLicenseUploaded', 'EXISTING_LICENSE'),
    safeCustodyUploaded: pickField('safeCustodyUploaded', 'SAFE_CUSTODY'),
    specialEvidenceUploaded: pickField('specialEvidenceUploaded', 'CLAIM_DOCS', 'CLAIM_DOCUMENTS'),
    specialEvidenceFiles: claimFiles.length
      ? claimFiles
      : Array.isArray(data?.specialEvidenceFiles)
        ? data.specialEvidenceFiles.map((file: any) => toRenewalFieldValue(file)).filter(Boolean)
        : [],
  };

  if (
    !mapped.specialEvidenceUploaded &&
    Array.isArray(mapped.specialEvidenceFiles) &&
    mapped.specialEvidenceFiles.length
  ) {
    mapped.specialEvidenceUploaded = mapped.specialEvidenceFiles[0];
  }

  const hasAnyDocument = DOCUMENT_FORM_KEYS.some(key => {
    if (key === 'specialEvidenceFiles') {
      return Array.isArray(mapped.specialEvidenceFiles) && mapped.specialEvidenceFiles.length > 0;
    }
    return Boolean(getDocumentUploadMeta((mapped as Record<string, unknown>)[key]).uploaded);
  });

  return hasAnyDocument ? mapped : {};
};

const buildFieldStateFromFreshApplication = (
  applicationId: string,
  data: any
): RenewalFormState => {
  const firstName = getTextValue(
    data?.firstName,
    data?.personalDetails?.firstName,
    data?.applicantName,
    data?.name
  );
  const middleName = getTextValue(data?.middleName, data?.personalDetails?.middleName);
  const lastName = getTextValue(data?.lastName, data?.personalDetails?.lastName);

  let extractedAddress: Record<string, string> = {};
  let extractedOccupation: Record<string, string> = {};
  try {
    extractedAddress = ApplicationService.extractSectionData(data, 'address') as Record<
      string,
      string
    >;
    extractedOccupation = ApplicationService.extractSectionData(data, 'occupation') as Record<
      string,
      string
    >;
  } catch {
    extractedAddress = {};
    extractedOccupation = {};
  }

  return {
    ...initialFormState,
    applicationId,
    licenseNumber: getLicenseNumber(data),
    acknowledgementNo: getTextValue(
      data?.acknowledgementNo,
      data?.personalDetails?.acknowledgementNo
    ),
    applicantName: firstName,
    applicantMiddleName: middleName,
    applicantLastName: lastName,
    fatherName: getTextValue(
      data?.parentOrSpouseName,
      data?.fatherName,
      data?.personalDetails?.parentOrSpouseName
    ),
    motherName: getTextValue(data?.motherName),
    maritalStatus: getTextValue(data?.maritalStatus),
    nationality: getTextValue(data?.nationality) || 'Indian',
    applicantGender: getSexValue(data?.sex || data?.gender || data?.personalDetails?.sex),
    applicantDateOfBirth: formatDate(
      data?.dateOfBirth || data?.personalDetails?.dateOfBirth || data?.dob
    ),
    placeOfBirth: getTextValue(data?.placeOfBirth, data?.personalDetails?.placeOfBirth),
    applicantIdType: getTextValue(data?.applicantIdType),
    applicantIdNumber: getTextValue(data?.applicantIdNumber),
    aadharNumber: getTextValue(data?.aadharNumber, data?.aadhaarNumber),
    panNumber: getTextValue(data?.panNumber),
    applicantMobile: getTextValue(
      data?.applicantMobile,
      data?.mobileNumber,
      data?.phoneNumber,
      extractedAddress.officeMobileNumber,
      getPresentAddress(data)?.officeMobileNumber
    ),
    applicantEmail: getTextValue(data?.applicantEmail, data?.email),
    filledBy: getTextValue(data?.filledBy, data?.personalDetails?.filledBy),
    dobInWords: getTextValue(data?.dobInWords, data?.personalDetails?.dobInWords),

    ...mapPresentAddressFields(data),
    ...mapPermanentAddressFields(data),
    ...(extractedAddress.presentAddress
      ? {
          presentAddress: extractedAddress.presentAddress,
          presentState: extractedAddress.presentState || '',
          presentDistrict: extractedAddress.presentDistrict || '',
          presentZone: extractedAddress.presentZone || '',
          presentDivision: extractedAddress.presentDivision || '',
          presentPoliceStation: extractedAddress.presentPoliceStation || '',
          residingSince:
            extractedAddress.presentSince || formatDate(getPresentAddress(data)?.sinceResiding),
          officePhone: extractedAddress.telephoneOffice || '',
          residencePhone: extractedAddress.telephoneResidence || '',
          officeMobile: extractedAddress.officeMobileNumber || '',
          alternativeMobile: extractedAddress.alternativeMobile || '',
          sameAsPresent:
            extractedAddress.sameAsPresent !== undefined
              ? String(extractedAddress.sameAsPresent).toLowerCase() === 'true'
              : Boolean(data?.sameAsPresent),
        }
      : {}),
    ...(extractedAddress.permanentAddress
      ? {
          permanentAddress: extractedAddress.permanentAddress,
          permanentState: extractedAddress.permanentState || '',
          permanentDistrict: extractedAddress.permanentDistrict || '',
          permanentZone: extractedAddress.permanentZone || '',
          permanentDivision: extractedAddress.permanentDivision || '',
          permanentPoliceStation: extractedAddress.permanentPoliceStation || '',
        }
      : {}),

    ...mapOccupationFields(data),
    ...(extractedOccupation.occupation
      ? {
          occupation: extractedOccupation.occupation,
          officeBusinessAddress: extractedOccupation.officeAddress || '',
          officeBusinessState: extractedOccupation.officeState || '',
          officeBusinessDistrict: extractedOccupation.officeDistrict || '',
          cropProtectionLocation: extractedOccupation.cropLocation || '',
          cultivatedArea: extractedOccupation.areaUnderCultivation || '',
        }
      : {}),
    ...(data?.occupationAndBusiness?.state?.name
      ? { officeBusinessStateName: data.occupationAndBusiness.state.name }
      : {}),
    ...(data?.occupationAndBusiness?.district?.name
      ? { officeBusinessDistrictName: data?.occupationAndBusiness.district.name }
      : {}),

    applicationType: 'Renewal',

    ...mapLicenseDetailFields(data),
    ...mapLicenseHistoryFields(data),
    ...mapCriminalHistoryFields(data),
    ...mapBiometricFields(data),
    // Not prefill document upload fields from the fresh application here.
    // Renewal documents should be uploaded separately in the renewal form.

    declaration: {
      agreeToTruth: Boolean(data?.isDeclarationAccepted),
      understandLegalConsequences: Boolean(data?.isAwareOfLegalConsequences),
      agreeToTerms: Boolean(data?.isTermsAccepted),
    },
    hasSubmittedTrueInfo: Boolean(data?.isSubmit),
  };
};

const buildRenewalPayload = (formData: RenewalFormState) => ({
  licenseNumber: formData.licenseNumber,
  acknowledgementNo: formData.acknowledgementNo,
  firstName: formData.applicantName,
  middleName: formData.applicantMiddleName,
  lastName: formData.applicantLastName,
  parentOrSpouseName: formData.fatherName,
  motherName: formData.motherName,
  maritalStatus: formData.maritalStatus,
  nationality: formData.nationality,
  sex: formData.applicantGender,
  dateOfBirth: formData.applicantDateOfBirth,
  dobInWords: formData.dobInWords,
  placeOfBirth: formData.placeOfBirth,
  applicantIdType: formData.applicantIdType,
  applicantIdNumber: formData.applicantIdNumber,
  panNumber: formData.panNumber,
  aadharNumber: formData.aadharNumber,
  applicantMobile: formData.applicantMobile,
  applicantEmail: formData.applicantEmail,
  filledBy: formData.filledBy,
  presentAddress: formData.presentAddress,
  presentState: formData.presentState,
  presentDistrict: formData.presentDistrict,
  presentZone: formData.presentZone,
  presentDivision: formData.presentDivision,
  presentPoliceStation: formData.presentPoliceStation,
  jurisdictionPoliceStation: formData.jurisdictionPoliceStation,
  residingSince: formData.residingSince,
  sameAsPresent: formData.sameAsPresent,
  permanentAddress: formData.permanentAddress,
  permanentState: formData.permanentState,
  permanentDistrict: formData.permanentDistrict,
  permanentZone: formData.permanentZone,
  permanentDivision: formData.permanentDivision,
  permanentPincode: formData.permanentPincode,
  permanentPoliceStation: formData.permanentPoliceStation,
  officePhone: formData.officePhone,
  residencePhone: formData.residencePhone,
  officeMobile: formData.officeMobile,
  alternativeMobile: formData.alternativeMobile,
  occupation: formData.occupation,
  officeBusinessAddress: formData.officeBusinessAddress,
  officeBusinessState: formData.officeBusinessState,
  officeBusinessDistrict: formData.officeBusinessDistrict,
  cropProtectionLocation: formData.cropProtectionLocation,
  cultivatedArea: formData.cultivatedArea,
  applicationType: formData.applicationType,
  weaponType: formData.weaponType,
  weaponId: formData.weaponId,
  weaponReason: formData.weaponReason,
  licenseValidity: formData.licenseValidity,
  licenseType: formData.licenseType,
  hasPreviousLicense: formData.hasPreviousLicense,
  previousApplicationDetails: formData.previousApplicationDetails,
  // License History fields
  hasAppliedBefore: formData.hasAppliedBefore,
  applicationDate: formData.applicationDate,
  authorityAppliedTo: formData.authorityAppliedTo,
  applicationResult: formData.applicationResult,
  licenseRevokedOrSuspended: formData.licenseRevokedOrSuspended,
  revokedByAuthority: formData.revokedByAuthority,
  revokedReason: formData.revokedReason,
  familyMemberHasLicense: formData.familyMemberHasLicense,
  familyMemberName: formData.familyMemberName,
  familyLicenseNumber: formData.familyLicenseNumber,
  weaponEndorsedList: formData.weaponEndorsedList,
  hasSafeCustody: formData.hasSafeCustody,
  safeCustodyDetails: formData.safeCustodyDetails,
  hasTrainingUnderRule10: formData.hasTrainingUnderRule10,
  trainingDetails: formData.trainingDetails,
  declaration: formData.declaration,
  hasSubmittedTrueInfo: formData.hasSubmittedTrueInfo,
});

const buildRenewalPatchPayload = (formData: RenewalFormState) => {
  // Build nested structure matching the new API request format
  const payload: Record<string, any> = {};

  const personalDetails: Record<string, any> = {};
  const addressDetails: Record<string, any> = {};
  const occupationAndBusiness: Record<string, any> = {};
  const licenseDetails: Record<string, any> = {};

  // Personal Details
  if (formData.applicantName) personalDetails.firstName = formData.applicantName;
  if (formData.applicantMiddleName) personalDetails.middleName = formData.applicantMiddleName;
  if (formData.applicantLastName) personalDetails.lastName = formData.applicantLastName;
  if (formData.fatherName) personalDetails.parentOrSpouseName = formData.fatherName;
  if (formData.applicantGender) personalDetails.sex = formData.applicantGender;
  if (formData.applicantDateOfBirth) personalDetails.dateOfBirth = formData.applicantDateOfBirth;
  if (formData.dobInWords) personalDetails.dobInWords = formData.dobInWords;
  if (formData.panNumber) personalDetails.panNumber = formData.panNumber;
  if (formData.aadharNumber) personalDetails.aadharNumber = formData.aadharNumber;

  // Address Details (Present Address)
  if (formData.presentAddress) addressDetails.addressLine = formData.presentAddress;
  const stateId = toNumber(formData.presentState);
  if (stateId !== undefined) addressDetails.stateId = stateId;
  const districtId = toNumber(formData.presentDistrict);
  if (districtId !== undefined) addressDetails.districtId = districtId;
  const policeStationId = toNumber(formData.presentPoliceStation);
  if (policeStationId !== undefined) addressDetails.policeStationId = policeStationId;
  const zoneId = toNumber(formData.presentZone);
  if (zoneId !== undefined) addressDetails.zoneId = zoneId;
  const divisionId = toNumber(formData.presentDivision);
  if (divisionId !== undefined) addressDetails.divisionId = divisionId;
  if (formData.residingSince) addressDetails.sinceResiding = formData.residingSince;
  if (formData.officePhone) addressDetails.telephoneOffice = formData.officePhone;
  if (formData.residencePhone) addressDetails.telephoneResidence = formData.residencePhone;
  if (formData.officeMobile) addressDetails.officeMobileNumber = formData.officeMobile;
  if (formData.alternativeMobile) addressDetails.alternativeMobile = formData.alternativeMobile;

  // Occupation and Business
  if (formData.occupation) occupationAndBusiness.occupation = formData.occupation;
  if (formData.officeBusinessAddress)
    occupationAndBusiness.officeAddress = formData.officeBusinessAddress;
  const occStateId = toNumber(formData.officeBusinessState);
  if (occStateId !== undefined) occupationAndBusiness.stateId = occStateId;
  const occDistrictId = toNumber(formData.officeBusinessDistrict);
  if (occDistrictId !== undefined) occupationAndBusiness.districtId = occDistrictId;
  if (formData.cropProtectionLocation)
    occupationAndBusiness.cropLocation = formData.cropProtectionLocation;
  if (formData.cultivatedArea) occupationAndBusiness.areaUnderCultivation = formData.cultivatedArea;

  // License Details - with reverse mapping to API enum values
  if (formData.weaponReason) {
    const needForLicense = mapUiValueToLicensePurpose(formData.weaponReason);
    if (needForLicense) licenseDetails.needForLicense = needForLicense;
  }

  // Map arms category from weaponType or armsOptionType
  const armsCategory = mapArmsOptionToCategory(formData.weaponType || formData.armsOptionType);
  if (armsCategory) {
    licenseDetails.armsCategory = armsCategory;
  }

  // Map area of validity from checkboxes
  const areaOfValidityParts: string[] = [];
  if (formData.carryAreaDistrict) areaOfValidityParts.push('DISTRICT');
  if (formData.carryAreaState) areaOfValidityParts.push('STATE');
  if (formData.carryAreaIndia) areaOfValidityParts.push('INDIA');
  if (areaOfValidityParts.length > 0) {
    licenseDetails.areaOfValidity = areaOfValidityParts.join(', ');
  }

  if (formData.ammunitionDescription) licenseDetails.ammunitionDescription = formData.ammunitionDescription;
  if (formData.specialConsiderationClaim) licenseDetails.specialConsiderationReason = formData.specialConsiderationClaim;
  if (formData.formIVPlaceArea) licenseDetails.licencePlaceArea = formData.formIVPlaceArea;
  if (formData.formIVWildBeastsSpec) licenseDetails.wildBeastsSpecification = formData.formIVWildBeastsSpec;

  // Convert requestedWeaponIds to array of numbers
  const weaponIds: number[] = [];
  if (formData.requestedWeaponIds && Array.isArray(formData.requestedWeaponIds)) {
    formData.requestedWeaponIds.forEach((id: any) => {
      const numId = toNumber(id);
      if (numId !== undefined) weaponIds.push(numId);
    });
  } else if (formData.weaponId) {
    const weaponIdNum = toNumber(formData.weaponId);
    if (weaponIdNum !== undefined) weaponIds.push(weaponIdNum);
  }
  if (weaponIds.length > 0) {
    licenseDetails.requestedWeaponIds = weaponIds;
  }

  // Add non-empty sections to payload
  if (Object.keys(personalDetails).length > 0) payload.personalDetails = personalDetails;
  if (Object.keys(addressDetails).length > 0) payload.addressDetails = addressDetails;
  if (Object.keys(occupationAndBusiness).length > 0)
    payload.occupationAndBusiness = occupationAndBusiness;
  if (Object.keys(licenseDetails).length > 0) payload.licenseDetails = licenseDetails;

  // License History - conditional submission based on Yes/No selections
  const licenseHistoryPayload: Record<string, any> = {};
  if (formData.hasAppliedBefore) {
    licenseHistoryPayload.hasAppliedBefore = formData.hasAppliedBefore;
    if (formData.applicationDate) licenseHistoryPayload.dateAppliedFor = formData.applicationDate;
    if (formData.authorityAppliedTo)
      licenseHistoryPayload.previousAuthorityName = formData.authorityAppliedTo;
    if (formData.applicationResult)
      licenseHistoryPayload.previousResult = formData.applicationResult.toUpperCase();
  }
  if (formData.licenseRevokedOrSuspended) {
    licenseHistoryPayload.hasLicenceSuspended = formData.licenseRevokedOrSuspended;
    if (formData.revokedByAuthority)
      licenseHistoryPayload.suspensionAuthorityName = formData.revokedByAuthority;
    if (formData.revokedReason) licenseHistoryPayload.suspensionReason = formData.revokedReason;
  }
  if (formData.familyMemberHasLicense) {
    licenseHistoryPayload.hasFamilyLicence = formData.familyMemberHasLicense;
    if (formData.familyMemberName)
      licenseHistoryPayload.familyMemberName = formData.familyMemberName;
    if (formData.familyLicenseNumber)
      licenseHistoryPayload.familyLicenceNumber = formData.familyLicenseNumber;
    if (formData.weaponEndorsedList && formData.weaponEndorsedList.length > 0) {
      licenseHistoryPayload.familyWeaponsEndorsed = formData.weaponEndorsedList
        .map((w: any) => w.value)
        .filter(Boolean);
    }
  }
  if (formData.hasSafeCustody) {
    licenseHistoryPayload.hasSafePlace = formData.hasSafeCustody;
    if (formData.safeCustodyDetails)
      licenseHistoryPayload.safePlaceDetails = formData.safeCustodyDetails;
  }
  if (formData.hasTrainingUnderRule10) {
    licenseHistoryPayload.hasTraining = formData.hasTrainingUnderRule10;
    if (formData.trainingDetails) licenseHistoryPayload.trainingDetails = formData.trainingDetails;
  }
  if (Object.keys(licenseHistoryPayload).length > 0) {
    payload.licenseHistories = [licenseHistoryPayload];
  }

  payload.acceptanceFlags = {
    isDeclarationAccepted: Boolean(formData.declaration?.agreeToTruth),
    isAwareOfLegalConsequences: Boolean(formData.declaration?.understandLegalConsequences),
    isTermsAccepted: Boolean(formData.declaration?.agreeToTerms),
  };

  return payload;
};

const buildRootDataFromRenewal = (data: any): RenewalFormState => {
  const personalDetails = data?.personalDetails;
  const nameFields = getApplicantNameFields(data, personalDetails);

  return {
    ...initialFormState,
    renewalApplicationId: getTextValue(data?.id, data?.renewalApplicationId),
    applicationId: getTextValue(
      data?.applicationId,
      data?.freshApplicationId,
      data?.sourceApplicationId
    ),
    licenseNumber: getTextValue(data?.licenseNumber),
    acknowledgementNo: getTextValue(data?.acknowledgementNo, personalDetails?.acknowledgementNo),
    ...nameFields,
    fatherName: getTextValue(data?.parentOrSpouseName, personalDetails?.parentOrSpouseName),
    motherName: getTextValue(data?.motherName, personalDetails?.motherName),
    maritalStatus: getTextValue(data?.maritalStatus, personalDetails?.maritalStatus),
    nationality: getTextValue(data?.nationality, personalDetails?.nationality) || 'Indian',
    applicantGender: getSexValue(data?.sex || personalDetails?.sex),
    applicantDateOfBirth: formatDate(data?.dateOfBirth || personalDetails?.dateOfBirth),
    placeOfBirth: getTextValue(data?.placeOfBirth, personalDetails?.placeOfBirth),
    applicantIdType: getTextValue(data?.applicantIdType, personalDetails?.applicantIdType),
    applicantIdNumber: getTextValue(data?.applicantIdNumber, personalDetails?.applicantIdNumber),
    aadharNumber: getTextValue(data?.aadharNumber, personalDetails?.aadharNumber),
    panNumber: getTextValue(data?.panNumber, personalDetails?.panNumber),
    applicantMobile: getTextValue(data?.applicantMobile, personalDetails?.applicantMobile),
    applicantEmail: getTextValue(data?.applicantEmail, personalDetails?.applicantEmail),
    filledBy: getTextValue(data?.filledBy, personalDetails?.filledBy),
    dobInWords: getTextValue(data?.dobInWords, personalDetails?.dobInWords),
    ...mapPresentAddressFields(data),
    ...mapPermanentAddressFields(data),
    ...mapOccupationFields(data),
    applicationType: getTextValue(data?.applicationType) || 'Renewal',
    ...mapLicenseDetailFields(data),
    ...mapLicenseHistoryFields(data),
    ...mapCriminalHistoryFields(data),
    ...mapBiometricFields(data),
    ...mapDocumentUploadFields(data, collectRenewalFileIds(data)),
    declaration: {
      agreeToTruth: Boolean(
        data?.declaration?.agreeToTruth ?? data?.isDeclarationAccepted
      ),
      understandLegalConsequences: Boolean(
        data?.declaration?.understandLegalConsequences ??
        data?.isAwareOfLegalConsequences
      ),
      agreeToTerms: Boolean(
        data?.declaration?.agreeToTerms ?? data?.isTermsAccepted
      ),
    },
    hasSubmittedTrueInfo: Boolean(data?.hasSubmittedTrueInfo || data?.isSubmit),
  };
};

const buildFormDataFromRenewalRecord = async (renewalData: any, applicationId: string) => {
  const renewalState = buildRootDataFromRenewal(renewalData);
  const freshAppId = resolveFreshApplicationId(renewalData, applicationId);

  if (!freshAppId) {
    return renewalState;
  }

  try {
    const freshData = await fetchFreshApplicationWithFiles(freshAppId);
    if (freshData) {
      const freshState = buildFieldStateFromFreshApplication(freshAppId, freshData);
      return mergeRenewalStateOverFresh(freshState, renewalState, renewalData);
    }
  } catch (freshError) {
    console.warn('Unable to fetch fresh application fallback data', freshError);
  }

  return renewalState;
};

const loadExistingRenewalByLicenseNumber = async (
  applicationId: string,
  licenseNumber: string,
  setRenewalRecord: React.Dispatch<React.SetStateAction<any>>,
  setFormData: React.Dispatch<React.SetStateAction<RenewalFormState>>,
  setStatusMessage: React.Dispatch<React.SetStateAction<string | null>>,
  router: ReturnType<typeof useRouter>,
  createdRenewalIdRef: React.MutableRefObject<string | null>
): Promise<boolean> => {
  const existing = await RenewalService.findRenewalByLicenseNumber(licenseNumber);
  if (!existing) return false;

  const existingRenewalId = getTextValue(existing?.id, existing?.renewalApplicationId);
  if (!existingRenewalId) {
    throw new Error('A matching renewal license was found but no renewal ID was returned.');
  }

  const renewalResponse = await RenewalService.getRenewalForm(existingRenewalId);
  const renewalData = extractData(renewalResponse);
  if (!renewalData) {
    throw new Error('No saved renewal data was returned for the matching license number.');
  }

  createdRenewalIdRef.current = existingRenewalId;
  setRenewalRecord(renewalData);
  const mergedFormData = await buildFormDataFromRenewalRecord(renewalData, applicationId);
  const { formData: syncedForm, synced } = await applyPrefilledDocumentUploads(
    existingRenewalId,
    mergedFormData
  );
  setFormData(syncedForm as RenewalFormState);
  setStatusMessage(
    synced
      ? `Loaded renewal ${getTextValue(renewalData?.acknowledgementNo, existingRenewalId)}; prefilled documents saved via upload-file.`
      : `Loaded existing renewal application ${getTextValue(renewalData?.acknowledgementNo, existingRenewalId)} for license ${licenseNumber}.`
  );
  router.replace(
    `/forms/renewal?applicationId=${encodeURIComponent(applicationId)}&renewalId=${encodeURIComponent(existingRenewalId)}`
  );
  return true;
};

const createDraftRenewalFromFreshApplication = async (
  applicationId: string,
  prefilledForm: RenewalFormState,
  setRenewalRecord: React.Dispatch<React.SetStateAction<any>>,
  setFormData: React.Dispatch<React.SetStateAction<RenewalFormState>>,
  setStatusMessage: React.Dispatch<React.SetStateAction<string | null>>,
  router: ReturnType<typeof useRouter>,
  createdRenewalIdRef: React.MutableRefObject<string | null>
) => {
  if (createdRenewalIdRef.current) return;

  const licenseNumber = prefilledForm.licenseNumber.trim();
  if (licenseNumber) {
    const loadedExisting = await loadExistingRenewalByLicenseNumber(
      applicationId,
      licenseNumber,
      setRenewalRecord,
      setFormData,
      setStatusMessage,
      router,
      createdRenewalIdRef
    );
    if (loadedExisting) return;
  }

  setFormData(prefilledForm);

  try {
    const createResponse = await RenewalService.createRenewalForm(
      buildRenewalPayload(prefilledForm)
    );
    const created = extractData(createResponse);
    const newRenewalId = getTextValue(created?.id, created?.renewalApplicationId);

    if (!newRenewalId) {
      throw new Error('Renewal application was created but no renewal ID was returned.');
    }

    createdRenewalIdRef.current = newRenewalId;
    const { formData: syncedForm, synced } = await applyPrefilledDocumentUploads(
      newRenewalId,
      prefilledForm
    );
setFormData(syncedForm as RenewalFormState);
     setStatusMessage(
       synced
         ? `Created renewal ${getTextValue(created?.acknowledgementNo, newRenewalId)}; prefilled documents saved via upload-file.`
         : `Created renewal application ${getTextValue(created?.acknowledgementNo, newRenewalId)}.`
     );
    router.replace(
      `/forms/renewal?applicationId=${encodeURIComponent(applicationId)}&renewalId=${encodeURIComponent(newRenewalId)}`
    );
  } catch (createError: any) {
    const message = String(createError?.message || '');
    const renewalAlreadyExists =
      /renewal application for this license already exists/i.test(message) ||
      /already exists/i.test(message);

    if (renewalAlreadyExists && licenseNumber) {
      const loadedExisting = await loadExistingRenewalByLicenseNumber(
        applicationId,
        licenseNumber,
        setRenewalRecord,
        setFormData,
        setStatusMessage,
        router,
        createdRenewalIdRef
      );
      if (loadedExisting) return;
    }

    throw createError;
  }
};

function RenewalFormPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId =
    searchParams?.get('applicationId') || searchParams?.get('freshApplicationId') || '';
  const renewalId = searchParams?.get('renewalId') || searchParams?.get('id') || '';
  const createdRenewalIdRef = useRef<string | null>(null);
  const personalSectionRef = React.useRef<any>(null);
  const addressSectionRef = React.useRef<any>(null);
  const occupationSectionRef = React.useRef<any>(null);
  const criminalSectionRef = React.useRef<any>(null);
  const licenseHistorySectionRef = React.useRef<any>(null);
  const licenseDetailsSectionRef = React.useRef<any>(null);
  const documentsSectionRef = React.useRef<any>(null);
  const declarationSectionRef = React.useRef<any>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [renewalRecord, setRenewalRecord] = useState<any>(null);
  const [formData, setFormData] = useState<RenewalFormState>(initialFormState);
  const activeRenewalId = renewalId || createdRenewalIdRef.current || '';

  const handleFormPatch = (patch: Record<string, unknown>) => {
    setFormData(prev => ({ ...prev, ...patch }));
    const documentKeys = Object.keys(patch).filter(key =>
      (DOCUMENT_FORM_KEYS as readonly string[]).includes(key)
    );
    if (documentKeys.length) {
      setDocumentsErrors(prevErrs => {
        if (!prevErrs) return prevErrs;
        const copy = { ...prevErrs };
        let changed = false;
        documentKeys.forEach(key => {
          if (patch[key] && key in copy) {
            delete copy[key];
            changed = true;
          }
        });
        return changed ? copy : prevErrs;
      });
    }
  };

  const scheduleSectionFocus = (
    sectionRef: React.RefObject<any>,
    sectionKey?: keyof typeof expandedSections
  ) => {
    if (sectionKey) {
      setExpandedSections(prev => ({ ...prev, [sectionKey]: true }));
    }

    setTimeout(() => {
      try {
        sectionRef.current?.focusFirstInvalid();
      } catch {
        // ignore if section not mounted yet
      }
    }, 0);
  };

  const { isSyncingPrefilled: isSyncingEvidence } = usePrefilledDocumentSync(
    isLoading ? '' : activeRenewalId,
    formData,
    handleFormPatch,
    setError,
    msg => {
      if (msg) setStatusMessage(msg);
    },
    'evidence'
  );

  const [expandedSections, setExpandedSections] = useState({
    personal: true,
    address: true,
    occupation: true,
    criminal: true,
    licenseHistory: true,
    licenseDetails: true,
    biometric: true,
    documents: true,
    declaration: true,
  });

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [showReadOnlyModal, setShowReadOnlyModal] = useState(false);
  const [personalErrors, setPersonalErrors] = useState<Record<string, string>>({});
  const [addressErrors, setAddressErrors] = useState<Record<string, string>>({});
  const [occupationErrors, setOccupationErrors] = useState<Record<string, string>>({});
  const [criminalErrors, setCriminalErrors] = useState<Record<string, string>>({});
  const [licenseHistoryErrors, setLicenseHistoryErrors] = useState<Record<string, string>>({});
  const [licenseDetailsErrors, setLicenseDetailsErrors] = useState<Record<string, string>>({});
  const [documentsErrors, setDocumentsErrors] = useState<Record<string, string>>({});
  const [biometricErrors, setBiometricErrors] = useState<Record<string, string>>({});
  const [declarationErrors, setDeclarationErrors] = useState<Record<string, string>>({});

  const toggleSection = (key: keyof typeof expandedSections) => {
    if (isReadOnly) {
      setShowReadOnlyModal(true);
      return;
    }
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (!applicationId && !renewalId) {
      setError('No application context was provided.');
      setIsLoading(false);
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setStatusMessage(null);

        if (renewalId) {
          const renewalResponse = await RenewalService.getRenewalForm(renewalId);
          const renewalData = extractData(renewalResponse);
          if (!renewalData) {
            throw new Error('No saved renewal data was returned for the renewal ID.');
          }

          const workflowCode = String(renewalData?.workflowStatus?.code || renewalData?.workflowStatus?.name || '').toUpperCase();
          if (workflowCode === 'APPROVED') {
            setIsReadOnly(true);
            setShowReadOnlyModal(true);
          }

          setRenewalRecord(renewalData);
          const mergedFormData = await buildFormDataFromRenewalRecord(renewalData, applicationId);
          const { formData: syncedForm, synced } = await applyPrefilledDocumentUploads(
            renewalId,
            mergedFormData
          );
          setFormData(syncedForm as RenewalFormState);
          setStatusMessage(
            synced
              ? `Loaded renewal ${getTextValue(renewalData?.acknowledgementNo, renewalData?.id, renewalId)}; prefilled documents saved via upload-file.`
              : `Loaded renewal application ${getTextValue(renewalData?.acknowledgementNo, renewalData?.id, renewalId)}.`
          );
          return;
        }

        const freshData = await fetchFreshApplicationWithFiles(applicationId);

        if (!freshData) {
          throw new Error('No fresh application data found for the provided ID.');
        }

        console.log('Renewal load:', {
          applicationId,
          fileUploads: collectUploadedFilesFromApi(freshData),
        });
        const prefilledForm = buildFieldStateFromFreshApplication(applicationId, freshData);

        // Validate that the fresh application has been submitted
        const applicationCheckResponse = await ApplicationService.getApplication(applicationId);
        console.log('Application check response:', applicationCheckResponse);

        // Check if application is submitted (isSubmit should be true)
        const isSubmitted =
          applicationCheckResponse?.isSubmit === true ||
          applicationCheckResponse?.data?.isSubmit === true;
        if (!isSubmitted) {
          throw new Error('Your application has not been submitted.');
        }

        await createDraftRenewalFromFreshApplication(
          applicationId,
          prefilledForm,
          setRenewalRecord,
          setFormData,
          setStatusMessage,
          router,
          createdRenewalIdRef
        );
      } catch (loadError: any) {
        setError(loadError?.message || 'Failed to load the renewal form.');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [applicationId, renewalId, router]);

  function handleChange(
          event:
            | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
            | { target: { name: string; value: unknown; type?: string; checked?: boolean } }
        ) {
          if (isReadOnly) {
            setShowReadOnlyModal(true);
            return;
          }
    const { name, type, value, checked } = event.target as {
      name: string;
      value?: unknown;
      type?: string;
      checked?: boolean;
    };
    const rawValue =
      value !== undefined
        ? value
        : type === 'checkbox'
          ? Boolean(checked)
          : (event.target as HTMLInputElement).value;

    const clearErrorKeys = (
      setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
      keys: string[]
    ) => {
      setErrors(prevErrs => {
        if (!prevErrs) return prevErrs;
        const copy = { ...prevErrs };
        let changed = false;
        keys.forEach(key => {
          if (key in copy) {
            delete copy[key];
            changed = true;
          }
        });
        return changed ? copy : prevErrs;
      });
    };

    const clearFieldError = (fieldName: string) => {
      clearErrorKeys(setPersonalErrors, [fieldName]);
      clearErrorKeys(setAddressErrors, [fieldName]);
      clearErrorKeys(setOccupationErrors, [fieldName]);
      clearErrorKeys(setCriminalErrors, [fieldName]);
      clearErrorKeys(setLicenseHistoryErrors, [fieldName]);
      clearErrorKeys(setLicenseDetailsErrors, [fieldName]);
      clearErrorKeys(setDocumentsErrors, [fieldName]);
      if (fieldName.startsWith('declaration.')) {
        clearErrorKeys(setDeclarationErrors, [fieldName.replace('declaration.', '')]);
      } else {
        clearErrorKeys(setDeclarationErrors, [fieldName]);
      }
    };

    setFormData(prev => {
      const next = { ...prev } as RenewalFormState & Record<string, any>;

      if (name.startsWith('declaration.')) {
        const declarationKey = name.replace('declaration.', '');
        next.declaration = {
          ...next.declaration,
          [declarationKey]: rawValue,
        };
      } else {
        next[name] = rawValue;
      }

      // clear validation error for this field as user edits (both personal and address)
      clearFieldError(name);

      if (name === 'sameAsPresent' && rawValue === true) {
        next.permanentAddress = next.presentAddress || '';
        next.permanentState = next.presentState || '';
        next.permanentDistrict = next.presentDistrict || '';
        next.permanentZone = next.presentZone || '';
        next.permanentDivision = next.presentDivision || '';
        next.permanentPoliceStation = next.presentPoliceStation || '';
        next.permanentPincode = next.presentPincode || '';
      } else if (name === 'sameAsPresent' && rawValue === false) {
        // Clear permanent address fields when unchecked so user can enter different address
      }

      if (name === 'convictedStatus' && rawValue === false) {
        next.firNumber = '';
        next.underSection = '';
        next.policeStationCriminal = '';
        next.criminalUnit = '';
        next.criminalDistrict = '';
        next.criminalState = '';
        next.offence = '';
        next.sentence = '';
        next.sentenceDate = '';
      }

      if (name === 'bondStatus' && rawValue === false) {
        next.bondSentenceDate = '';
        next.bondPeriod = '';
      }

      if (name === 'prohibitedStatus' && rawValue === false) {
        next.prohibitedSentenceDate = '';
        next.prohibitedPeriod = '';
      }

      if (name === 'hasAppliedBefore' && rawValue === false) {
        next.applicationDate = '';
        next.authorityAppliedTo = '';
        next.applicationResult = '';
      }

      if (name === 'licenseRevokedOrSuspended' && rawValue === false) {
        next.revokedByAuthority = '';
        next.revokedReason = '';
      }

      if (name === 'familyMemberHasLicense' && rawValue === false) {
        next.familyMemberName = '';
        next.familyLicenseNumber = '';
      }

      if (name === 'hasSafeCustody' && rawValue === false) {
        next.safeCustodyDetails = '';
      }

      if (name === 'hasTrainingUnderRule10' && rawValue === false) {
        next.trainingDetails = '';
      }

      return next;
    });

    if (name === 'sameAsPresent' && rawValue === true) {
      clearErrorKeys(setAddressErrors, [
        'permanentAddress',
        'permanentState',
        'permanentDistrict',
        'permanentZone',
        'permanentDivision',
        'permanentPoliceStation',
        'permanentPincode',
      ]);
    }

    if (name === 'convictedStatus' && rawValue === false) {
      clearErrorKeys(setCriminalErrors, [
        'firNumber',
        'underSection',
        'policeStationCriminal',
        'criminalUnit',
        'criminalDistrict',
        'criminalState',
        'offence',
        'sentence',
        'sentenceDate',
      ]);
    }

    if (name === 'bondStatus' && rawValue === false) {
      clearErrorKeys(setCriminalErrors, ['bondSentenceDate', 'bondPeriod']);
    }

    if (name === 'prohibitedStatus' && rawValue === false) {
      clearErrorKeys(setCriminalErrors, ['prohibitedSentenceDate', 'prohibitedPeriod']);
    }

    if (name === 'hasAppliedBefore' && rawValue === false) {
      clearErrorKeys(setLicenseHistoryErrors, [
        'applicationDate',
        'authorityAppliedTo',
        'applicationResult',
      ]);
    }

    if (name === 'licenseRevokedOrSuspended' && rawValue === false) {
      clearErrorKeys(setLicenseHistoryErrors, ['revokedByAuthority', 'revokedReason']);
    }

    if (name === 'familyMemberHasLicense' && rawValue === false) {
      clearErrorKeys(setLicenseHistoryErrors, ['familyMemberName', 'familyLicenseNumber']);
    }

    if (name === 'hasSafeCustody' && rawValue === false) {
      clearErrorKeys(setLicenseHistoryErrors, ['safeCustodyDetails']);
    }

    if (name === 'hasTrainingUnderRule10' && rawValue === false) {
      clearErrorKeys(setLicenseHistoryErrors, ['trainingDetails']);
    }
  }

  function handleFileChange(name: string, file: File | null) {
    if (!file) {
      setFormData(prev => ({ ...prev, [name]: null }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: file }));

    const activeRenewalId = renewalId || createdRenewalIdRef.current;
    if (!activeRenewalId) return;

    (async () => {
      try {
        setStatusMessage('Uploading document...');
        const uploaded = await RenewalService.uploadDocument(activeRenewalId, name, file);
        setFormData(prev => ({
          ...prev,
          [name]: {
            id: uploaded.id,
            fileName: uploaded.fileName,
            fileUrl: uploaded.fileUrl,
            fileType: uploaded.fileType,
          },
        }));
        setStatusMessage('Document uploaded');
      } catch (uploadErr: any) {
        setError(uploadErr?.message || 'Failed to upload document.');
      }
    })();
  }

  const buildRenewalPatchPayloadAsync = async (formData: RenewalFormState) => {
    const base = buildRenewalPatchPayload(formData);

    // Try to enrich occupation state/district with human-readable names
    try {
      const stateId = toNumber(formData.officeBusinessState);
      if (stateId !== undefined && formData.officeBusinessState) {
        const state = await locationAPI.getStateById(stateId);
        if (state?.name) {
          base.officeBusinessStateName = state.name;
        }
      }

      const districtId = toNumber(formData.officeBusinessDistrict);
      if (districtId !== undefined && formData.officeBusinessDistrict) {
        const district = await locationAPI.getDistrictById(districtId);
        if (district?.name) {
          base.officeBusinessDistrictName = district.name;
        }
      }
    } catch (err) {
      // Non-fatal: if location name lookup fails, proceed with numeric ids
    }

    return base;
  };

  const persistRenewalForm = async (isSubmit: boolean) => {
    const activeRenewalId = renewalId || createdRenewalIdRef.current;

    if (!activeRenewalId) {
      setError('Renewal ID not available yet.');
      return false;
    }

    // Client-side validation before saving/submitting
    const validatePersonalDetails = (data: RenewalFormState) => {
      const errs: Record<string, string> = {};
      const requireField = (key: keyof RenewalFormState, label: string) => {
        const v = (data as any)[key];
        if (!v || String(v).trim() === '') errs[key as string] = `${label} is required`;
      };

      requireField('applicantName', 'First name');
      requireField('applicantLastName', 'Last name');
      requireField('filledBy', 'Application filled by');
      requireField('fatherName', 'Parent/Spouse name');
      requireField('placeOfBirth', 'Place of birth');
      requireField('applicantDateOfBirth', 'Date of birth');
      requireField('dobInWords', 'Date of birth in words');
      requireField('panNumber', 'PAN');
      requireField('aadharNumber', 'Aadhar number');

      if (
        data.panNumber &&
        String(data.panNumber).trim().length > 0 &&
        String(data.panNumber).trim().length !== 10
      )
        errs['panNumber'] = 'PAN must be 10 characters';
      if (data.aadharNumber && !/^\d{12}$/.test(String(data.aadharNumber).trim()))
        errs['aadharNumber'] = 'Aadhar must be 12 digits';

      if (!data.applicantGender) errs['applicantGender'] = 'Please select sex';
      return errs;
    };

    const preSaveErrors = validatePersonalDetails(formData);
    if (Object.keys(preSaveErrors).length > 0) {
      setPersonalErrors(preSaveErrors);
      scheduleSectionFocus(personalSectionRef, 'personal');
      setError('Please fix validation errors before continuing.');
      return false;
    }

    // Address validation (core fields required)
    const validateAddressDetails = (data: RenewalFormState) => {
      const errs: Record<string, string> = {};
      const requireField = (key: string, label: string) => {
        const v = (data as any)[key];
        if (!v || String(v).trim() === '') errs[key] = `${label} is required`;
      };

      requireField('presentAddress', 'Present address');
      requireField('presentState', 'Present state');
      requireField('presentDistrict', 'Present district');
      // Residing since is optional as it may not always be available
      // Location hierarchy (zone, division, police station) may be optional based on jurisdiction

      if (!data.sameAsPresent) {
        requireField('permanentAddress', 'Permanent address');
        requireField('permanentState', 'Permanent state');
        requireField('permanentDistrict', 'Permanent district');
        // Location hierarchy for permanent is optional
      }

      return errs;
    };

    const addressValidationErrors = validateAddressDetails(formData);
    if (Object.keys(addressValidationErrors).length > 0) {
      setAddressErrors(addressValidationErrors);
      scheduleSectionFocus(addressSectionRef, 'address');
      setError('Please fix validation errors in Address Details before continuing.');
      return false;
    }

    // Occupation validation (all required)
    const validateOccupationDetails = (data: RenewalFormState) => {
      const errs: Record<string, string> = {};
      const requireField = (key: string, label: string) => {
        const v = (data as any)[key];
        if (!v || String(v).trim() === '') errs[key] = `${label} is required`;
      };

      requireField('occupation', 'Occupation');
      requireField('officeBusinessAddress', 'Office/Business address');
      requireField('officeBusinessState', 'Office/Business state');
      requireField('officeBusinessDistrict', 'Office/Business district');
      requireField('cropProtectionLocation', 'Location');
      requireField('cultivatedArea', 'Area of land under cultivation');

      return errs;
    };

    const occupationValidationErrors = validateOccupationDetails(formData);
    if (Object.keys(occupationValidationErrors).length > 0) {
      setOccupationErrors(occupationValidationErrors);
      scheduleSectionFocus(occupationSectionRef, 'occupation');
      setError('Please fix validation errors in Occupation section before continuing.');
      return false;
    }

    const validateCriminalDetails = (data: RenewalFormState) => {
      const errs: Record<string, string> = {};
      const requireField = (key: string, label: string) => {
        const v = (data as any)[key];
        if (!v || String(v).trim() === '') errs[key] = `${label} is required`;
      };

      if (data.convictedStatus) {
        requireField('firNumber', 'FIR Number');
        requireField('underSection', 'Under Section');
        requireField('policeStationCriminal', 'Police Station');
        requireField('criminalUnit', 'Unit');
        requireField('criminalDistrict', 'District');
        requireField('criminalState', 'State');
        requireField('offence', 'Offence');
        requireField('sentence', 'Sentence');
        requireField('sentenceDate', 'Date of Sentence');
      }

      if (data.bondStatus) {
        requireField('bondSentenceDate', 'Date of Sentence');
        requireField('bondPeriod', 'Period of which bond');
      }

      if (data.prohibitedStatus) {
        requireField('prohibitedSentenceDate', 'Date of Sentence');
        requireField('prohibitedPeriod', 'Period of which bound');
      }

      return errs;
    };

    const criminalValidationErrors = validateCriminalDetails(formData);
    if (Object.keys(criminalValidationErrors).length > 0) {
      setCriminalErrors(criminalValidationErrors);
      scheduleSectionFocus(criminalSectionRef, 'criminal');
      setError('Please fix validation errors in Criminal History before continuing.');
      return false;
    }

    const validateLicenseHistoryDetails = (data: RenewalFormState) => {
      const errs: Record<string, string> = {};
      const requireField = (key: string, label: string) => {
        const v = (data as any)[key];
        if (!v || String(v).trim() === '') errs[key] = `${label} is required`;
      };

      if (data.hasAppliedBefore) {
        requireField('applicationDate', 'Application Date');
        requireField('authorityAppliedTo', 'Authority Applied To');
        requireField('applicationResult', 'Application Result');
      }

      if (data.licenseRevokedOrSuspended) {
        requireField('revokedByAuthority', 'Revoked By Authority');
        requireField('revokedReason', 'Revoked Reason');
      }

      if (data.familyMemberHasLicense) {
        requireField('familyMemberName', 'Family Member Name');
        requireField('familyLicenseNumber', 'Family License Number');
      }

      if (data.hasSafeCustody) {
        requireField('safeCustodyDetails', 'Safe Custody Details');
      }

      if (data.hasTrainingUnderRule10) {
        requireField('trainingDetails', 'Training Details');
      }

      return errs;
    };

    const licenseHistoryValidationErrors = validateLicenseHistoryDetails(formData);
    if (Object.keys(licenseHistoryValidationErrors).length > 0) {
      setLicenseHistoryErrors(licenseHistoryValidationErrors);
      scheduleSectionFocus(licenseHistorySectionRef, 'licenseHistory');
      setError('Please fix validation errors in License History before continuing.');
      return false;
    }

    const validateLicenseDetails = (data: RenewalFormState) => {
      const errs: Record<string, string> = {};
      const requireField = (key: string, label: string) => {
        const v = (data as any)[key];
        if (!v || String(v).trim() === '') errs[key] = `${label} is required`;
      };

      requireField('weaponReason', 'Need for license (15)');
      requireField('ammunitionDescription', 'Ammunition Description');
      requireField('specialConsiderationClaim', 'Claims for special consideration (18)');
      requireField('formIVPlaceArea', 'Place or area for which the licence is sought (19a)');
      requireField('formIVWildBeastsSpec', 'Specification of the wild beasts (19b)');

      if (!data.carryAreaDistrict && !data.carryAreaState && !data.carryAreaIndia) {
        errs['carryAreaDistrict'] = 'Select at least one area for carrying arms (17)';
      }
      if (!data.armsOptionType) {
        errs['armsOptionType'] = 'Select Restricted or Permissible (16a)';
      }
      const selectedWeaponIds: number[] = Array.isArray(data.requestedWeaponIds)
        ? data.requestedWeaponIds
        : data.weaponId
          ? [Number(String(data.weaponId))]
          : [];
      if (!selectedWeaponIds.length) {
        errs['requestedWeaponIds'] = 'Select at least one weapon type (16b)';
      }

      return errs;
    };

    const licenseDetailsValidationErrors = validateLicenseDetails(formData);
    if (Object.keys(licenseDetailsValidationErrors).length > 0) {
      setLicenseDetailsErrors(licenseDetailsValidationErrors);
      scheduleSectionFocus(licenseDetailsSectionRef, 'licenseDetails');
      setError('Please fix validation errors in License Details before continuing.');
      return false;
    }

    const validateDocumentsUpload = (data: RenewalFormState) => {
      const errs: Record<string, string> = {};
      if (!data.idProofUploaded) errs['idProofUploaded'] = 'Aadhar Card document is required.';
      if (!data.panCardUploaded) errs['panCardUploaded'] = 'PAN Card document is required.';
      if (!data.medicalCertificateUploaded)
        errs['medicalCertificateUploaded'] = 'Medical Certificate document is required.';
      return errs;
    };

    const documentsValidationErrors = validateDocumentsUpload(formData);
    if (Object.keys(documentsValidationErrors).length > 0) {
      setDocumentsErrors(documentsValidationErrors);
      scheduleSectionFocus(documentsSectionRef, 'documents');
      setError('Please upload required documents before continuing.');
      return false;
    }

    try {
      setIsSaving(true);
      setError(null);

      // Documents are stored via POST upload-file, not PATCH — sync prefilled files first
      let dataToSave = formData;
      const pendingDocPatch = await syncPendingRenewalDocuments(activeRenewalId, formData);
      if (Object.keys(pendingDocPatch).length > 0) {
        dataToSave = { ...formData, ...pendingDocPatch };
        setFormData(dataToSave);
        setStatusMessage('Uploading existing documents to renewal record...');
      }

      const payload = await buildRenewalPatchPayloadAsync(dataToSave);
      await RenewalService.updateRenewalForm(activeRenewalId, payload, { isSubmit });

      const reloadResponse = await RenewalService.getRenewalForm(activeRenewalId);
      let saved = extractData(reloadResponse);
      setRenewalRecord(saved);

      if (saved) {
        const mergedFormData = await buildFormDataFromRenewalRecord(
          saved,
          resolveFreshApplicationId(saved, applicationId)
        );
        const { formData: syncedForm } = await applyPrefilledDocumentUploads(
          activeRenewalId,
          mergedFormData
        );
        setFormData(syncedForm as RenewalFormState);
      }

      // If this was a submit (isSubmit === true), trigger the INITIATE workflow action
      if (isSubmit) {
        setStatusMessage(
          `Renewal application ${getTextValue(saved?.id, activeRenewalId)} submitted successfully.`
        );
      } else {
        setStatusMessage(`Saved renewal draft ${getTextValue(saved?.id, activeRenewalId)}.`);
      }
      return true;
    } catch (saveError: any) {
      setError(
        saveError?.message ||
          (isSubmit ? 'Failed to submit renewal application.' : 'Failed to save renewal draft.')
      );
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const saveRenewalDraft = () => {
    if (isReadOnly) {
      setShowReadOnlyModal(true);
      return;
    }
    persistRenewalForm(false);
  };

  const saveAndContinue = async () => {
    if (isReadOnly) {
      setShowReadOnlyModal(true);
      return false;
    }
    const declarationErrors: Record<string, string> = {};
    if (!formData.declaration?.agreeToTruth)
      declarationErrors['agreeToTruth'] = 'Please accept this declaration.';
    if (!formData.declaration?.understandLegalConsequences)
      declarationErrors['understandLegalConsequences'] = 'Please accept this declaration.';
    if (!formData.declaration?.agreeToTerms)
      declarationErrors['agreeToTerms'] = 'Please accept the terms and conditions.';

    if (Object.keys(declarationErrors).length > 0) {
      setDeclarationErrors(declarationErrors);
      scheduleSectionFocus(declarationSectionRef, 'declaration');
      setError('Please accept all declarations before submitting the application.');
      return false;
    }

    const success = await persistRenewalForm(true);
    if (success) {
      setSuccessMessage('Renewal application is submitted');
      setShowSuccessModal(true);
    }
    return success;
  };

  const handleSuccessContinue = () => {
    setShowSuccessModal(false);
    router.push('/inbox?type=forwarded');
  };

  const reloadRenewalData = async () => {
    const activeRenewalId = renewalId || createdRenewalIdRef.current;
    if (!activeRenewalId) return;

    try {
      setIsLoading(true);
      const response = await RenewalService.getRenewalForm(activeRenewalId);
      const renewalData = extractData(response);
      if (!renewalData) {
        throw new Error('No renewal data returned.');
      }
      setRenewalRecord(renewalData);
      const merged = await buildFormDataFromRenewalRecord(
        renewalData,
        resolveFreshApplicationId(renewalData, applicationId)
      );
      const { formData: syncedForm } = await applyPrefilledDocumentUploads(activeRenewalId, merged);
      setFormData(syncedForm as RenewalFormState);
      setStatusMessage(
        ` ${getTextValue(renewalData?.id, activeRenewalId)}.`
      );
    } catch (reloadError: any) {
      setError(reloadError?.message || 'Failed to reload renewal data.');
    } finally {
      setIsLoading(false);
    }
  };

    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50'>
        {/* Success Modal */}
        {showSuccessModal && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
            <div className='rounded-lg bg-white shadow-lg max-w-sm w-full p-6 space-y-4'>
              <div className='flex items-center justify-center'>
                <div className='rounded-full bg-green-100 p-3'>
                  <svg
                    className='h-6 w-6 text-green-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M5 13l4 4L19 7'
                    />
                  </svg>
                </div>
              </div>
              <h2 className='text-center text-lg font-semibold text-gray-900'>Success!</h2>
              <p className='text-center text-gray-600'>{successMessage}</p>
              <button
                onClick={handleSuccessContinue}
                className='w-full rounded-md bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 transition'
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Read-Only Modal */}
        {showReadOnlyModal && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4'>
            <div className='rounded-lg bg-white shadow-lg max-w-sm w-full p-6 space-y-4'>
              <div className='flex items-center justify-center'>
                <div className='rounded-full bg-blue-100 p-3'>
                  <svg
                    className='h-6 w-6 text-blue-600'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                </div>
              </div>
              <h2 className='text-center text-lg font-semibold text-gray-900'>Application Read-Only</h2>
              <p className='text-center text-gray-600'>
                Your renewal application has already been submitted.
              </p>
              <button
                onClick={() => setShowReadOnlyModal(false)}
                className='w-full rounded-md bg-[#001F54] hover:bg-[#012a73] text-white font-medium py-2 px-4 transition'
              >
                OK
              </button>
            </div>
          </div>
        )}

      <div className='mx-auto flex min-h-screen w-full max-w-7xl 2xl:max-w-[1600px] flex-col px-4 py-8 sm:px-6 lg:px-8'>
        <div className='grid gap-6 grid-cols-1'>
          <RenewalHeader
            applicationId={applicationId}
            renewalId={renewalId || createdRenewalIdRef.current || ''}
            summaryData={formData || renewalRecord}
          />

          <form
            onSubmit={e => {
              e.preventDefault();
              if (isReadOnly) {
                setShowReadOnlyModal(true);
                return;
              }
              saveAndContinue();
            }}
            className='space-y-6 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-gray-100'
          >
            <div className='rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900'>
              <div className='flex flex-wrap items-center gap-3'>
                <span className='font-semibold'>Fresh Application ID:</span>
                <span>{applicationId || 'Not provided'}</span>
                <span className='font-semibold'>Renewal ID:</span>
                <span>{renewalId || createdRenewalIdRef.current || 'Pending'}</span>
                {statusMessage && (
                  <span className='ml-auto font-medium text-blue-700'>{statusMessage}</span>
                )}
              </div>
            </div>

            {isLoading && (
              <div className='rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600'>
                Loading renewal data...
              </div>
            )}
            {error && (
              <div className='rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
                {error}
              </div>
            )}

            {!isLoading && (
              <>
                <AccordionSection
                  title='Personal Information'
                  isOpen={expandedSections.personal}
                  onToggle={() => toggleSection('personal')}
                >
                  <PersonalDetailsSection
                    ref={personalSectionRef}
                    formData={formData}
                    onChange={handleChange}
                    errors={personalErrors}
                  />
                </AccordionSection>

                <AccordionSection
                  title='Address Details'
                  isOpen={expandedSections.address}
                  onToggle={() => toggleSection('address')}
                >
                  <AddressDetailsSection
                    ref={addressSectionRef}
                    formData={formData}
                    onChange={handleChange}
                    errors={addressErrors}
                  />
                </AccordionSection>

                <AccordionSection
                  title='Occupation/Business'
                  isOpen={expandedSections.occupation}
                  onToggle={() => toggleSection('occupation')}
                >
                  <OccupationSection
                    ref={occupationSectionRef}
                    formData={formData}
                    onChange={handleChange}
                    errors={occupationErrors}
                  />
                </AccordionSection>

                <AccordionSection
                  title='Criminal History'
                  isOpen={expandedSections.criminal}
                  onToggle={() => toggleSection('criminal')}
                >
                  <CriminalHistory
                    ref={criminalSectionRef}
                    formData={formData}
                    onChange={handleChange}
                    errors={criminalErrors}
                  />
                </AccordionSection>

                <AccordionSection
                  title='License History'
                  isOpen={expandedSections.licenseHistory}
                  onToggle={() => toggleSection('licenseHistory')}
                >
                  <LicenseHistory
                    ref={licenseHistorySectionRef}
                    formData={formData}
                    onChange={handleChange}
                    errors={licenseHistoryErrors}
                  />
                </AccordionSection>

                <AccordionSection
                  title='License Details'
                  isOpen={expandedSections.licenseDetails}
                  onToggle={() => toggleSection('licenseDetails')}
                >
                  <LicenseDetailsSection
                    formData={formData}
                    renewalId={activeRenewalId}
                    isSyncingPrefilled={isSyncingEvidence}
                    onChange={handleChange}
                    onPatch={patch => setFormData(prev => ({ ...prev, ...patch }))}
                    onError={setError}
                    onStatus={setStatusMessage}
                  />
                </AccordionSection>

                <AccordionSection
                  title='Biometric Information'
                  isOpen={expandedSections.biometric}
                  onToggle={() => toggleSection('biometric')}
                >
                  <BiometricInformation
                    formData={formData}
                    renewalId={activeRenewalId}
                    onChange={handleChange}
                    onFileChange={handleFileChange}
                    errors={biometricErrors}
                    onPrevious={() => {
                      if (renewalId)
                        router.push(
                          `/forms/renewal?applicationId=${encodeURIComponent(applicationId)}&renewalId=${encodeURIComponent(renewalId)}#license-details`
                        );
                      else router.back();
                    }}
                    onNext={() => {
                      if (activeRenewalId)
                        router.push(
                          `/forms/renewal?applicationId=${encodeURIComponent(applicationId)}&renewalId=${encodeURIComponent(activeRenewalId)}#documents`
                        );
                    }}
                    onSaveToDraft={saveRenewalDraft}
                  />
                </AccordionSection>

                <AccordionSection
                  title='Documents Upload'
                  isOpen={expandedSections.documents}
                  onToggle={() => toggleSection('documents')}
                >
                  <DocumentsSection
                    ref={documentsSectionRef}
                    formData={formData}
                    renewalId={activeRenewalId}
                    onPatch={handleFormPatch}
                    onError={setError}
                    onStatus={setStatusMessage}
                    errors={documentsErrors}
                  />
                </AccordionSection>

                <AccordionSection
                  title='Declaration'
                  isOpen={expandedSections.declaration}
                  onToggle={() => toggleSection('declaration')}
                >
                  <DeclarationSection
                    formData={formData}
                    onChange={handleChange}
                    errors={declarationErrors}
                  />
                </AccordionSection>
              </>
            )}

            {!isLoading && (
              <div className='flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4'>
                <button
                  type='button'
                  onClick={reloadRenewalData}
                  disabled={isLoading}
                  className='rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60'
                >
                  Reload Saved Renewal Data
                </button>

                  <div className='flex flex-wrap items-center gap-3'>
                  <button
                    type='button'
                    onClick={() => saveRenewalDraft()}
                    disabled={isSaving}
                    className={`rounded-md border px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                      isReadOnly
                        ? 'border-gray-300 text-gray-400 cursor-not-allowed'
                        : 'border-[#001F54] text-[#001F54] hover:bg-[#001F54]/5'
                    }`}
                  >
                    {isSaving ? 'Saving...' : 'Save Renewal Draft'}
                  </button>
                  <button
                    type='button'
                    onClick={saveAndContinue}
                    disabled={isSaving}
                    className={`rounded-md px-5 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60 ${
                      isReadOnly
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-[#001F54] hover:bg-[#012a73]'
                    }`}
                  >
                    {isSaving ? 'Submitting...' : 'Save & Continue'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

export default function RenewalFormPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-6 text-sm text-gray-600'>
          Loading renewal form...
        </div>
      }
    >
      <RenewalFormPageContent />
    </Suspense>
  );
}

function AccordionSection(
  props: Readonly<{
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
  }>
) {
  const { title, isOpen, onToggle, children } = props;

  return (
    <section className='rounded-2xl border border-gray-100 bg-white shadow-sm'>
      <button
        type='button'
        onClick={onToggle}
        className='flex w-full items-center justify-between px-5 py-4 text-left'
        aria-expanded={isOpen}
      >
        <h3 className='text-lg font-semibold text-gray-900'>{title}</h3>
        <span className='text-sm font-semibold text-[#001F54]'>{isOpen ? '▲' : '▼'}</span>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className='overflow-hidden'>
          <div className='border-t border-gray-100 px-5 py-4'>{children}</div>
        </div>
      </div>
    </section>
  );
}
