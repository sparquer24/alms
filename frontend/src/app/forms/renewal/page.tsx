'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { ApplicationFormSkeleton } from '../../../components/Skeleton';
import { ApplicationService } from '../../../api/applicationService';
import { FileUploadService } from '../../../api/fileUploadService';
import { getDocumentUploadMeta } from '../../../services/fileHandler';
import { locationAPI } from '../../../api/locationApi';
import { RenewalService } from '../../../api/renewalService';
import LicenseService from '../../../services/licenseService';
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
import MantraSDKService from '../../../services/mantraSDKService';
import BiometricAPIService from '../../../services/biometricAPIService';

type RenewalFormState = {
  renewalApplicationId: string;
  applicationId: string;
  licenseId?: number;
  freshLicenseId?: number;
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
  presentRangeOffice: string;
  presentZone: string;
  presentDivision: string;
  presentPoliceStation: string;
  presentStateName?: string;
  presentDistrictName?: string;
  presentRangeOfficeName?: string;
  presentZoneName?: string;
  presentDivisionName?: string;
  presentPoliceStationName?: string;
  jurisdictionPoliceStation: string;
  presentPincode: string;
  residingSince: string;
  sameAsPresent: boolean;
  permanentAddress: string;
  permanentState: string;
  permanentDistrict: string;
  permanentRangeOffice: string;
  permanentZone: string;
  permanentDivision: string;
  permanentPoliceStation: string;
  permanentStateName?: string;
  permanentDistrictName?: string;
  permanentRangeOfficeName?: string;
  permanentZoneName?: string;
  permanentDivisionName?: string;
  permanentPoliceStationName?: string;
  permanentPincode: string;
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
  firDetailsList: any[];
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
  licenseId: undefined,
  freshLicenseId: undefined,
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
  presentRangeOffice: '',
  presentZone: '',
  presentDivision: '',
  presentPoliceStation: '',
  presentStateName: '',
  presentDistrictName: '',
  presentRangeOfficeName: '',
  presentZoneName: '',
  presentDivisionName: '',
  presentPoliceStationName: '',
  jurisdictionPoliceStation: '',
  presentPincode: '',
  residingSince: '',
  sameAsPresent: false,
  permanentAddress: '',
  permanentState: '',
  permanentDistrict: '',
  permanentRangeOffice: '',
  permanentZone: '',
  permanentDivision: '',
  permanentPoliceStation: '',
  permanentStateName: '',
  permanentDistrictName: '',
  permanentRangeOfficeName: '',
  permanentZoneName: '',
  permanentDivisionName: '',
  permanentPoliceStationName: '',
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
  firDetailsList: [],
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
    case 'CROP_PROTECTION':
      return 'crop_protection';
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
    case 'self-defense':
    case 'self protection':
      return 'SELF_PROTECTION';
    case 'sports':
      return 'SPORTS';
    case 'crop_protection':
    case 'crop protection':
      return 'CROP_PROTECTION';
    case 'business_security':
    case 'business-security':
      return 'HEIRLOOM_POLICY';
    default:
      return String(value).toUpperCase().replace(/\s+/g, '_');
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
    presentRangeOffice: normalizeLocationId(
      presentAddress?.rangeOfficeId ?? presentAddress?.rangeOffice?.id
    ),
    presentZone: normalizeLocationId(presentAddress?.zoneId ?? presentAddress?.zone?.id),
    presentDivision: normalizeLocationId(
      presentAddress?.divisionId ?? presentAddress?.division?.id
    ),
    presentPoliceStation: normalizeLocationId(
      presentAddress?.policeStationId ?? presentAddress?.policeStation?.id
    ),
    presentStateName: getTextValue(presentAddress?.state?.name, presentAddress?.stateName),
    presentDistrictName: getTextValue(presentAddress?.district?.name, presentAddress?.districtName),
    presentRangeOfficeName: getTextValue(presentAddress?.rangeOffice?.name, presentAddress?.rangeOfficeName),
    presentZoneName: getTextValue(presentAddress?.zone?.name, presentAddress?.zoneName),
    presentDivisionName: getTextValue(presentAddress?.division?.name, presentAddress?.divisionName),
    presentPoliceStationName: getTextValue(
      presentAddress?.policeStation?.name,
      presentAddress?.policeStationName
    ),
    presentPincode: getTextValue(
      presentAddress?.pincode,
      presentAddress?.postalCode,
      data?.presentPincode
    ),
    jurisdictionPoliceStation: getTextValue(data?.jurisdictionPoliceStation),
    residingSince: formatDate(
      presentAddress?.sinceResiding || data?.residingSince || data?.presentSince
    ),
    sameAsPresent:
      Boolean(data?.sameAsPresent) ||
      Boolean(
        data?.permanentAddress &&
        getAddressLine(presentAddress) === getAddressLine(data.permanentAddress) &&
        normalizeLocationId(presentAddress?.stateId ?? presentAddress?.state?.id) ===
          normalizeLocationId(data.permanentAddress.stateId ?? data.permanentAddress.state?.id) &&
        normalizeLocationId(presentAddress?.districtId ?? presentAddress?.district?.id) ===
          normalizeLocationId(
            data.permanentAddress.districtId ?? data.permanentAddress.district?.id
          ) &&
        normalizeLocationId(presentAddress?.zoneId ?? presentAddress?.zone?.id) ===
          normalizeLocationId(data.permanentAddress.zoneId ?? data.permanentAddress.zone?.id) &&
        normalizeLocationId(presentAddress?.divisionId ?? presentAddress?.division?.id) ===
          normalizeLocationId(
            data.permanentAddress.divisionId ?? data.permanentAddress.division?.id
          ) &&
        normalizeLocationId(
          presentAddress?.policeStationId ?? presentAddress?.policeStation?.id
        ) ===
          normalizeLocationId(
            data.permanentAddress.policeStationId ?? data.permanentAddress.policeStation?.id
          )
      ),
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
    permanentRangeOffice: normalizeLocationId(
      permanentAddress?.rangeOfficeId ?? permanentAddress?.rangeOffice?.id
    ),
    permanentZone: normalizeLocationId(permanentAddress?.zoneId ?? permanentAddress?.zone?.id),
    permanentDivision: normalizeLocationId(
      permanentAddress?.divisionId ?? permanentAddress?.division?.id
    ),
    permanentPoliceStation: normalizeLocationId(
      permanentAddress?.policeStationId ?? permanentAddress?.policeStation?.id
    ),
    permanentPincode: getTextValue(
      permanentAddress?.pincode,
      permanentAddress?.postalCode,
      data?.permanentPincode
    ),
    permanentStateName: getTextValue(permanentAddress?.state?.name, permanentAddress?.stateName),
    permanentDistrictName: getTextValue(permanentAddress?.district?.name, permanentAddress?.districtName),
    permanentRangeOfficeName: getTextValue(permanentAddress?.rangeOffice?.name, permanentAddress?.rangeOfficeName),
    permanentZoneName: getTextValue(permanentAddress?.zone?.name, permanentAddress?.zoneName),
    permanentDivisionName: getTextValue(
      permanentAddress?.division?.name,
      permanentAddress?.divisionName
    ),
    permanentPoliceStationName: getTextValue(
      permanentAddress?.policeStation?.name,
      permanentAddress?.policeStationName
    ),
  };
};

const ADDRESS_FORM_KEYS: (keyof RenewalFormState)[] = [
  'presentAddress',
  'presentState',
  'presentDistrict',
  'presentRangeOffice',
  'presentZone',
  'presentDivision',
  'presentPoliceStation',
  'jurisdictionPoliceStation',
  'residingSince',
  'sameAsPresent',
  'permanentAddress',
  'permanentState',
  'permanentDistrict',
  'permanentRangeOffice',
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
  'firDetailsList',
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

const resolveFirDetailValue = (item: any, keys: string[], fallbackValue = '') => {
  for (const key of keys) {
    const value = item?.[key];
    if (value === null || value === undefined) continue;
    const normalized = typeof value === 'string' ? value.trim() : String(value).trim();
    if (normalized) return normalized;
  }
  return fallbackValue;
};

const normalizeFirDetailsList = (value: any, fallbackData: any = {}) => {
  let firDetailsList: any = value || [];
  if (typeof firDetailsList === 'string') {
    try {
      firDetailsList = JSON.parse(firDetailsList);
    } catch {
      firDetailsList = [];
    }
  }
  if (firDetailsList && !Array.isArray(firDetailsList)) {
    firDetailsList = [firDetailsList];
  }
  if (!Array.isArray(firDetailsList)) {
    firDetailsList = [];
  }

  return firDetailsList.map((item: any, index: number) => {
    const rawDateValue = resolveFirDetailValue(
      item,
      ['sentenceDate', 'date', 'DateOfSentence', 'dateOfSentence'],
      fallbackData?.sentenceDate || ''
    );
    const normalizedDateValue = rawDateValue ? formatDate(rawDateValue) : '';
    const districtValue = resolveFirDetailValue(
      item,
      ['district', 'District', 'districtName', 'DistrictName'],
      fallbackData?.criminalDistrict || ''
    );

    return {
      id: item?.id || `fir-${index}`,
      ...(typeof item === 'object' && item ? item : {}),
      district: districtValue,
      District: districtValue,
      sentenceDate: normalizedDateValue,
      DateOfSentence: normalizedDateValue,
      date: normalizedDateValue,
      dateOfSentence: normalizedDateValue,
    };
  });
};

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

  const freshResponse = await ApplicationService.getLicense(applicationId);
  console.log(freshResponse)
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

  // Note: specialEvidenceFiles/specialEvidenceUploaded intentionally NOT copied
  // from fresh application -- renewal form should only show its own uploaded evidence.
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

    const licenseFieldKeys = [...LICENSE_DETAIL_FORM_KEYS] as const;
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

  if (!hasSavedBiometric(renewalData)) {
    restoreSectionFromFresh(merged, fresh, BIOMETRIC_FORM_KEYS);
  }

  if (
    renewalData?.isDeclarationAccepted !== undefined ||
    renewalData?.isAwareOfLegalConsequences !== undefined ||
    renewalData?.isTermsAccepted !== undefined ||
    renewalData?.declaration
  ) {
    merged.declaration = {
      agreeToTruth: Boolean(
        renewalData?.declaration?.agreeToTruth ?? renewalData?.isDeclarationAccepted
      ),
      understandLegalConsequences: Boolean(
        renewalData?.declaration?.understandLegalConsequences ??
        renewalData?.isAwareOfLegalConsequences
      ),
      agreeToTerms: Boolean(renewalData?.declaration?.agreeToTerms ?? renewalData?.isTermsAccepted),
    };
  }

  const renewalFileIds = collectRenewalFileIds(renewalData);

  // Populate document fields strictly from renewalData (not from fresh application)
  const mappedDocs = mapDocumentUploadFields(renewalData, collectRenewalFileIds(renewalData));
  Object.assign(merged, mappedDocs);

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
        id: `weapon-${index}-${String(weapon).replace(/\s+/g, '-').toLowerCase()}`,
        value: String(weapon),
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
    applicationResult: mapLicenseResultToUi(
      getTextValue(licenseHistory?.previousResult, data?.applicationResult)
    ),
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

  const primaryCriminal = data.criminalHistories?.[0];
  const firDetailsList = normalizeFirDetailsList(primaryCriminal?.firDetails || [], data);
  const firstFirDetail = firDetailsList?.[0];

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
    firDetailsList,
    firNumber: getTextValue(firstFirDetail?.firNumber, data?.firNumber),
    underSection: getTextValue(firstFirDetail?.underSection, data?.underSection),
    policeStationCriminal: getTextValue(firstFirDetail?.policeStation, data?.policeStationCriminal),
    criminalUnit: getTextValue(firstFirDetail?.unit, data?.criminalUnit),
    criminalDistrict: resolveFirDetailValue(
      firstFirDetail,
      ['district', 'District', 'districtName', 'DistrictName'],
      getTextValue(primaryCriminal?.district, primaryCriminal?.District, data?.criminalDistrict)
    ),
    criminalState: resolveFirDetailValue(
      firstFirDetail,
      ['state', 'State', 'stateName', 'StateName'],
      getTextValue(primaryCriminal?.state, primaryCriminal?.State, data?.criminalState)
    ),
    offence: getTextValue(firstFirDetail?.offence, data?.offence),
    sentence: getTextValue(firstFirDetail?.sentence, data?.sentence),
    sentenceDate: firstFirDetail?.sentenceDate
      ? firstFirDetail.sentenceDate
      : resolveFirDetailValue(
          firstFirDetail,
          ['DateOfSentence', 'date', 'sentenceDate', 'dateOfSentence'],
          getTextValue(data?.sentenceDate)
        ),
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
    freshLicenseId: typeof data?.id === 'number' ? data.id : (data?.id ? Number(data.id) : undefined),
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
          presentStateName: extractedAddress.presentStateName || '',
          presentDistrictName: extractedAddress.presentDistrictName || '',
          presentZoneName: extractedAddress.presentZoneName || '',
          presentDivisionName: extractedAddress.presentDivisionName || '',
          presentPoliceStationName: extractedAddress.presentPoliceStationName || '',
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
          permanentStateName: extractedAddress.permanentStateName || '',
          permanentDistrictName: extractedAddress.permanentDistrictName || '',
          permanentZoneName: extractedAddress.permanentZoneName || '',
          permanentDivisionName: extractedAddress.permanentDivisionName || '',
          permanentPoliceStationName: extractedAddress.permanentPoliceStationName || '',
        }
      : {}),

    ...mapOccupationFields(data),
    ...(extractedOccupation.occupation
      ? {
          occupation: extractedOccupation.occupation,
          officeBusinessAddress: extractedOccupation.officeAddress || '',
          officeBusinessState: extractedOccupation.officeState || '',
          officeBusinessDistrict: extractedOccupation.officeDistrict || '',
          officeBusinessStateName: extractedOccupation.officeStateName || '',
          officeBusinessDistrictName: extractedOccupation.officeDistrictName || '',
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
  ...(formData.freshLicenseId !== undefined && { freshLicenseId: formData.freshLicenseId }),
  ...(formData.licenseId !== undefined && { licenseId: formData.licenseId }),
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
  presentRangeOffice: formData.presentRangeOffice,
  presentZone: formData.presentZone,
  presentDivision: formData.presentDivision,
  presentPoliceStation: formData.presentPoliceStation,
  jurisdictionPoliceStation: formData.jurisdictionPoliceStation,
  residingSince: formData.residingSince,
  sameAsPresent: formData.sameAsPresent,
  permanentAddress: formData.permanentAddress,
  permanentState: formData.permanentState,
  permanentDistrict: formData.permanentDistrict,
  permanentRangeOffice: formData.permanentRangeOffice,
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
  const rangeOfficeId = toNumber(formData.presentRangeOffice);
  if (rangeOfficeId !== undefined) addressDetails.rangeOfficeId = rangeOfficeId;
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
  const cultAreaNum = toNumber(formData.cultivatedArea);
  if (cultAreaNum !== undefined) occupationAndBusiness.areaUnderCultivation = cultAreaNum;

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

  if (formData.ammunitionDescription)
    licenseDetails.ammunitionDescription = formData.ammunitionDescription;
  if (formData.specialConsiderationClaim)
    licenseDetails.specialConsiderationReason = formData.specialConsiderationClaim;
  if (formData.formIVPlaceArea) licenseDetails.licencePlaceArea = formData.formIVPlaceArea;
  if (formData.formIVWildBeastsSpec)
    licenseDetails.wildBeastsSpecification = formData.formIVWildBeastsSpec;

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

  // License History - map all fields to request body
  const licenseHistoryPayload: Record<string, any> = {
    hasAppliedBefore: Boolean(formData.hasAppliedBefore),
    dateAppliedFor: formData.applicationDate || undefined,
    previousAuthorityName: formData.authorityAppliedTo || '',
    previousResult: formData.applicationResult ? formData.applicationResult.toUpperCase() : undefined,
    hasLicenceSuspended: Boolean(formData.licenseRevokedOrSuspended),
    suspensionAuthorityName: formData.revokedByAuthority || '',
    suspensionReason: formData.revokedReason || '',
    hasFamilyLicence: Boolean(formData.familyMemberHasLicense),
    familyMemberName: formData.familyMemberName || '',
    familyLicenceNumber: formData.familyLicenseNumber || '',
    familyWeaponsEndorsed: formData.weaponEndorsedList
      ? formData.weaponEndorsedList.map((w: any) => w?.value || w).filter(Boolean)
      : [],
    hasSafePlace: Boolean(formData.hasSafeCustody),
    safePlaceDetails: formData.safeCustodyDetails || '',
    hasTraining: Boolean(formData.hasTrainingUnderRule10),
    trainingDetails: formData.trainingDetails || '',
  };
  payload.licenseHistories = [licenseHistoryPayload];

  // Criminal History - map all fields to request body
  const normalizedFirDetails =
    Array.isArray(formData.firDetailsList) && formData.firDetailsList.length > 0
      ? formData.firDetailsList.map((item: any) => {
          const districtValue =
            item?.district ||
            item?.District ||
            item?.districtName ||
            item?.DistrictName ||
            formData.criminalDistrict ||
            '';
          const sentenceDateValue =
            item?.sentenceDate ||
            item?.DateOfSentence ||
            item?.date ||
            item?.dateOfSentence ||
            formData.sentenceDate ||
            undefined;

          return {
            firNumber: item.firNumber || '',
            underSection: item.underSection || '',
            policeStation: item.policeStation || '',
            unit: item.unit || '',
            District: districtValue,
            district: districtValue,
            state: item.state || '',
            offence: item.offence || '',
            sentence: item.sentence || '',
            DateOfSentence: sentenceDateValue,
            sentenceDate: sentenceDateValue,
          };
        })
      : [
          {
            firNumber: formData.firNumber || '',
            underSection: formData.underSection || '',
            policeStation: formData.policeStationCriminal || '',
            unit: formData.criminalUnit || '',
            District: formData.criminalDistrict || '',
            district: formData.criminalDistrict || '',
            state: formData.criminalState || '',
            offence: formData.offence || '',
            sentence: formData.sentence || '',
            DateOfSentence: formData.sentenceDate || undefined,
            sentenceDate: formData.sentenceDate || undefined,
          },
        ];

  payload.criminalHistories = [
    {
      isConvicted: Boolean(formData.convictedStatus),
      isBondExecuted: Boolean(formData.bondStatus),
      bondDate: formData.bondSentenceDate || undefined,
      bondPeriod: formData.bondPeriod || '',
      isProhibited: Boolean(formData.prohibitedStatus),
      prohibitionDate: formData.prohibitedSentenceDate || undefined,
      prohibitionPeriod: formData.prohibitedPeriod || '',
      firDetails: normalizedFirDetails,
    },
  ];

  // Biometric Details
  payload.biometricData = {
    fingerprints: formData.selectedFingerprint || null,
    signature: formData.signature || null,
    irisScan: formData.irisScan || null,
  };

  // Document Uploads
  const getFileUrlAndName = (fileState: any) => {
    if (!fileState) return null;
    if (typeof fileState === 'string') return { fileUrl: fileState, fileName: 'document' };
    if (fileState.url || fileState.fileUrl) {
      return {
        fileUrl: fileState.url || fileState.fileUrl,
        fileName: fileState.name || fileState.fileName || 'document',
        fileSize: fileState.size || fileState.fileSize || 0,
      };
    }
    return null;
  };

  const documentKeysMap: Record<string, string> = {
    idProofUploaded: 'AADHAR_CARD',
    panCardUploaded: 'PAN_CARD',
    trainingCertificateUploaded: 'TRAINING_CERTIFICATE',
    medicalCertificateUploaded: 'MEDICAL_REPORT',
    otherStateLicenseUploaded: 'OTHER_STATE_LICENSE',
    existingArmsLicenseUploaded: 'EXISTING_LICENSE',
    safeCustodyUploaded: 'SAFE_CUSTODY',
    photographUploaded: 'PHOTOGRAPH',
    claimDocsUploaded: 'CLAIM_DOCS',
    otherUploaded: 'OTHER',
  };

  const fileUploads: any[] = [];
  Object.entries(documentKeysMap).forEach(([formKey, fileType]) => {
    const fileData = getFileUrlAndName((formData as any)[formKey]);
    if (fileData) {
      fileUploads.push({
        fileType,
        fileUrl: fileData.fileUrl,
        fileName: fileData.fileName,
        fileSize: fileData.fileSize || 0,
      });
    }
  });

  if (fileUploads.length > 0) {
    payload.fileUploads = fileUploads;
  }

  payload.acceptanceFlags = {
    isDeclarationAccepted: Boolean(formData.declaration?.agreeToTruth),
    isAwareOfLegalConsequences: Boolean(formData.declaration?.understandLegalConsequences),
    isTermsAccepted: Boolean(formData.declaration?.agreeToTerms),
  };

  // Include licenseId/licenseNumber on the parent record if available
  if (formData.licenseId !== undefined) {
    payload.licenseId = formData.licenseId;
  }
  if (formData.licenseNumber) {
    payload.licenseNumber = formData.licenseNumber;
  }

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
    licenseId: data?.licenseId !== undefined ? Number(data.licenseId) : undefined,
    freshLicenseId: data?.freshLicenseId ? Number(data.freshLicenseId) : undefined,
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
    applicantMobile: getTextValue(
      data?.applicantMobile,
      personalDetails?.applicantMobile,
      data?.presentAddress?.officeMobileNumber,
      data?.permanentAddress?.officeMobileNumber
    ),
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
      agreeToTruth: Boolean(data?.declaration?.agreeToTruth ?? data?.isDeclarationAccepted),
      understandLegalConsequences: Boolean(
        data?.declaration?.understandLegalConsequences ?? data?.isAwareOfLegalConsequences
      ),
      agreeToTerms: Boolean(data?.declaration?.agreeToTerms ?? data?.isTermsAccepted),
    },
    hasSubmittedTrueInfo: Boolean(data?.hasSubmittedTrueInfo || data?.isSubmit),
  };
};

const buildFormDataFromRenewalRecord = async (renewalData: any, _applicationId: string) => {
  // When a renewal record exists, use it as the sole source of truth.
  // Do NOT fetch fresh application data — renewal data takes full precedence.
  return buildRootDataFromRenewal(renewalData);
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
    `/forms/renewal?licenseId=${encodeURIComponent(applicationId)}&renewalId=${encodeURIComponent(existingRenewalId)}`
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
      `/forms/renewal?licenseId=${encodeURIComponent(applicationId)}&renewalId=${encodeURIComponent(newRenewalId)}`
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
  const licenseId = searchParams?.get('licenseId') || '';
  const urlLicenseId =
    licenseId ||
    searchParams?.get('applicationId') ||
    searchParams?.get('freshApplicationId') || '';
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
  // Tracks whether the user has actively edited the form, so auto-navigation
  // between sections only triggers after real interaction (not on initial load).
  const hasUserInteractedRef = React.useRef(false);
  // Tracks the previous per-section validity so we can detect when a section
  // newly becomes complete and auto-scroll to the next incomplete section.
  const sectionValidityRef = React.useRef<Record<string, boolean> | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [renewalRecord, setRenewalRecord] = useState<any>(null);
  const [formData, setFormData] = useState<RenewalFormState>(initialFormState);
  const activeRenewalId = renewalId || createdRenewalIdRef.current || '';

  // Biometric verification states
  const [enteredLicenseId, setEnteredLicenseId] = useState(urlLicenseId || '');
  const resolvedLicenseId = urlLicenseId || enteredLicenseId;
  const [isVerified, setIsVerified] = useState(false);
  const [verificationChecking, setVerificationChecking] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    'ENTER_APP_ID' | 'VERIFYING_BIOMETRICS' | 'VERIFIED' | 'FAILED'
  >('ENTER_APP_ID');
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [biometricTargetThumb, setBiometricTargetThumb] = useState<string | null>(null);
  const [applicantDetails, setApplicantDetails] = useState<{
    name: string;
    licenseNumber: string;
    licenseId: string;
  } | null>(null);
  const [deviceConnected, setDeviceConnected] = useState(false);
  const [deviceChecking, setDeviceChecking] = useState(false);
  const [fingerprintCapturing, setFingerprintCapturing] = useState(false);
  const [verificationMsg, setVerificationMsg] = useState<string | null>(null);
  const [enrolledTemplates, setEnrolledTemplates] = useState<any[]>([]);

  // States matching fresh biometric capture UI
  const [mantraSDKReady, setMantraSDKReady] = useState(false);
  const [showFingerprintPreviewModal, setShowFingerprintPreviewModal] = useState(false);
  const [pendingCaptureResult, setPendingCaptureResult] = useState<any | null>(null);
  const [fingerprintPreviewImage, setFingerprintPreviewImage] = useState<string | null>(null);
  const [showDeviceSettings, setShowDeviceSettings] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [showCapturingModal, setShowCapturingModal] = useState(false);
  const [capturingStep, setCapturingStep] = useState<string>('');
  const [diagnosticLoading, setDiagnosticLoading] = useState<string | null>(null);
  const [diagnosticResults, setDiagnosticResults] = useState<Record<string, any>>({});

  const checkDeviceConnection = async () => {
    try {
      setDeviceChecking(true);
      const initialized = await MantraSDKService.initialize();
      setMantraSDKReady(initialized);
      if (initialized) {
        const status = await MantraSDKService.isDeviceConnected();
        setDeviceConnected(status.isConnected);
      } else {
        setDeviceConnected(false);
      }
    } catch {
      setDeviceConnected(false);
    } finally {
      setDeviceChecking(false);
    }
  };

  // Diagnostic test functions matching fresh biometric capture UI
  const testCheckDevice = async () => {
    const result = await MantraSDKService.isDeviceConnected();
    if (!result.isConnected) {
      throw new Error(result.errorMessage || 'Device not connected');
    }
    return { connected: result.isConnected, info: result };
  };

  const testGetConnectedDevice = async () => {
    const result = await MantraSDKService.getConnectedDeviceList();
    if (!result || result.length === 0) {
      throw new Error('No connected devices found');
    }
    return { devices: result };
  };

  const testGetSupportedDevice = async () => {
    const result = await MantraSDKService.getSupportedDeviceList();
    if (!result || result.length === 0) {
      throw new Error('No supported devices found');
    }
    return { devices: result };
  };

  const testGetInfo = async () => {
    const result = await MantraSDKService.getDeviceInfo();
    if (!result) {
      throw new Error('Failed to get device info');
    }
    return { info: result };
  };

  const testCapture = async () => {
    const result = await MantraSDKService.captureFinger(60, 10000);
    if (!result.success) {
      const error = new Error(result.errorMessage || 'Capture failed');
      (error as any).errorCode = result.errorCode;
      throw error;
    }
    return {
      success: true,
      quality: result.quality,
      template: result.template ? 'Present' : 'Missing',
    };
  };

  const testGetImage = async () => {
    const result = await MantraSDKService.getImage('0');
    if (!result) {
      throw new Error('Failed to get fingerprint image');
    }
    return { imageSize: result.length, format: 'BMP (base64)' };
  };

  const testGetTemplate = async () => {
    const result = await MantraSDKService.getTemplate();
    if (!result) {
      throw new Error('Failed to get template');
    }
    return { template: result ? 'Present' : 'Missing', size: result ? result.length : 0 };
  };

  const testMatch = async () => {
    if (enrolledTemplates.length === 0) {
      throw new Error('No enrolled fingerprints to match against');
    }
    const template = await MantraSDKService.getTemplate();
    if (!template) {
      throw new Error('No template available from last capture');
    }
    const result = await MantraSDKService.verifyTemplate(
      enrolledTemplates[0].template,
      template,
      65
    );
    return { matchScore: result.score, matched: result.isMatch };
  };

  const runDiagnostic = async (testName: string, testFn: () => Promise<any>) => {
    try {
      setDiagnosticLoading(testName);
      const result = await testFn();
      setDiagnosticResults((prev: any) => ({
        ...prev,
        [testName]: {
          success: true,
          data: result,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
      toast.success(`✓ ${testName} passed`);
    } catch (error: any) {
      setDiagnosticResults((prev: any) => ({
        ...prev,
        [testName]: {
          success: false,
          error: error.message,
          errorCode: error.errorCode,
          timestamp: new Date().toLocaleTimeString(),
        },
      }));
      toast.error(`✗ ${testName} failed: ${error.message}`);
    } finally {
      setDiagnosticLoading(null);
    }
  };

  const checkBiometricRequirement = async (licenseIdentifier: string) => {
    try {
      setVerificationChecking(true);
      setVerificationError(null);

      // Fetch the license record by License ID or License Number to confirm
      // existence and load its enrolled biometrics for verification.
      const freshResponse = await ApplicationService.getLicense(licenseIdentifier);
      const freshData = extractData(freshResponse);
      if (!freshData) {
        throw new Error('No license data found for the provided License ID or License Number.');
      }

      const numericLicenseId = String(
        freshData.licenseId ||freshData.id || licenseIdentifier
      );
      const bioData = freshData.biometricData?.biometricData || freshData.biometricData || null;
      const fingerprints = bioData?.fingerprints || [];

      const userThumbprints = fingerprints
        .filter((f: any) => f.position === 'RIGHT_THUMB' || f.position === 'LEFT_THUMB')
        .map((f: any) => ({
          template: f.template,
          fingerPosition: f.position,
          applicationId: numericLicenseId,
        }));

      const name =
        [freshData.firstName, freshData.middleName, freshData.lastName].filter(Boolean).join(' ') ||
        freshData.applicantName ||
        'Applicant';

      const details = {
        name,
        licenseNumber: getLicenseNumber(freshData) || 'Pending',
        licenseId: numericLicenseId,
      };
      setApplicantDetails(details);

      if (userThumbprints.length > 0) {
        // Biometrics enrolled - require verification
        setEnrolledTemplates(userThumbprints);
        const target = userThumbprints[0].fingerPosition;
        setBiometricTargetThumb(target);
        setVerificationStatus('VERIFYING_BIOMETRICS');
        checkDeviceConnection();
      } else {
        // No biometrics enrolled - proceed directly to form
        setIsVerified(true);
        setVerificationStatus('VERIFIED');
      }
    } catch (err: any) {
      setVerificationError(err?.message || 'Failed to fetch license details.');
      setVerificationStatus('ENTER_APP_ID');
    } finally {
      setVerificationChecking(false);
    }
  };

  const resolveRenewalLicenseAndCheck = async (rId: string) => {
    try {
      setVerificationChecking(true);
      setVerificationError(null);
      const renewalResponse = await RenewalService.getRenewalForm(rId);
      const renewalData = extractData(renewalResponse);

      // If the renewal application has already been submitted, skip the
      // verification page entirely and take the user straight to the Renewal
      // Application Details page (Information tab).
      if (renewalData?.isSubmit) {
        const targetRenewalId = getTextValue(renewalData?.id, rId);
        router.replace(`/renewalApplication/${encodeURIComponent(targetRenewalId)}?tab=info`);
        return;
      }

      const resolvedLicense = getTextValue(
        renewalData?.licenseId,
        renewalData?.freshLicenseId,
        renewalData?.licenseNumber,
        renewalData?.applicationId,
        renewalData?.freshApplicationId,
        renewalData?.sourceApplicationId
      );
      if (!resolvedLicense) {
        throw new Error('Could not resolve License ID or License Number from the renewal.');
      }
      setEnteredLicenseId(resolvedLicense);
      await checkBiometricRequirement(resolvedLicense);
    } catch (err: any) {
      setVerificationError(err?.message || 'Failed to resolve license details.');
      setVerificationStatus('ENTER_APP_ID');
      setVerificationChecking(false);
    }
  };

  const resolveLicenseId = async (lid: string) => {
    try {
      setVerificationChecking(true);
      setVerificationError(null);
      await checkBiometricRequirement(lid);
    } catch (err: any) {
      setVerificationError(err?.message || 'Failed to resolve license details.');
      setVerificationStatus('ENTER_APP_ID');
    } finally {
      setVerificationChecking(false);
    }
  };

  const handleLicenseLookup = async () => {
    const value = enteredLicenseId.trim();
    if (!value) {
      setVerificationError('Enter a License ID or License Number.');
      return;
    }
    try {
      setVerificationChecking(true);
      setVerificationError(null);
      const licenseResponse = await ApplicationService.getLicense(value);
      const licenseData = extractData(licenseResponse);
      if (!licenseData) {
        throw new Error('No license data found for the provided License ID or License Number.');
      }
      router.push(`/forms/renewal?licenseId=${encodeURIComponent(value)}`);
    } catch (err: any) {
      setVerificationError(err?.message || 'Failed to verify License ID or License Number.');
    } finally {
      setVerificationChecking(false);
    }
  };

  const handleVerifyBiometrics = async () => {
    try {
      setFingerprintCapturing(true);
      setShowCapturingModal(true);
      setCapturingStep('Initializing fingerprint device...');
      setVerificationError(null);

      const status = await MantraSDKService.isDeviceConnected();
      if (!status.isConnected) {
        setVerificationError(
          'Fingerprint device is not connected. Please connect the device and try again.'
        );
        setDeviceConnected(false);
        setShowDeviceSettings(true);
        setShowCapturingModal(false);
        setFingerprintCapturing(false);
        return;
      }

      setCapturingStep('Place your thumb on the scanner...');
      const captureResult = await MantraSDKService.captureFinger(60, 10000);
      if (!captureResult.success) {
        setVerificationError(`Fingerprint capture failed: ${captureResult.errorMessage}`);
        setShowCapturingModal(false);
        setFingerprintCapturing(false);
        return;
      }

      setCapturingStep('Processing captured fingerprint...');
      setCapturingStep('Generating preview...');

      try {
        let previewImage: string | null = captureResult.bitmapData || null;
        if (!previewImage) {
          previewImage = await MantraSDKService.getImage('0');
        }
        setPendingCaptureResult(captureResult);
        if (previewImage) {
          setFingerprintPreviewImage(`data:image/bmp;base64,${previewImage}`);
        } else {
          setFingerprintPreviewImage(null);
        }
        setShowCapturingModal(false);
        setShowFingerprintPreviewModal(true);
      } catch (imageError) {
        setPendingCaptureResult(captureResult);
        setFingerprintPreviewImage(null);
        setShowCapturingModal(false);
        setShowFingerprintPreviewModal(true);
      }
    } catch (err: any) {
      setVerificationError(err?.message || 'Biometric verification failed.');
      setShowCapturingModal(false);
    } finally {
      setFingerprintCapturing(false);
      setCapturingStep('');
    }
  };

  const handleAcceptFingerprintPreview = async () => {
    if (!pendingCaptureResult) {
      setVerificationError('Invalid capture data');
      return;
    }

    try {
      setFingerprintCapturing(true);
      setVerificationChecking(true);

      let matchFound = false;
      const liveTemplate = pendingCaptureResult.template;

      for (const storedFp of enrolledTemplates) {
        try {
          const matchResult = await MantraSDKService.verifyTemplate(
            storedFp.template,
            liveTemplate,
            65
          );
          if (matchResult.isMatch || matchResult.score >= 65) {
            matchFound = true;
            break;
          }
        } catch (matchErr) {
          console.warn('[Mantra verifyTemplate] Match failed for template comparison', matchErr);
        }
      }

      setShowFingerprintPreviewModal(false);
      setFingerprintPreviewImage(null);
      setPendingCaptureResult(null);

      if (matchFound) {
        setVerificationMsg('Verification successful!');
        setIsVerified(true);
        setVerificationStatus('VERIFIED');
      } else {
        setVerificationError(
          'Verification failed: Scanned fingerprint does not match. Please try again.'
        );
      }
    } catch (error: any) {
      setVerificationError(error.message || 'Verification check failed.');
    } finally {
      setFingerprintCapturing(false);
      setVerificationChecking(false);
    }
  };

  useEffect(() => {
    if (renewalId) {
      resolveRenewalLicenseAndCheck(renewalId);
    } else if (urlLicenseId) {
      setEnteredLicenseId(urlLicenseId);
      resolveLicenseId(urlLicenseId);
    } else {
      setVerificationStatus('ENTER_APP_ID');
      setIsLoading(false);
    }
  }, [urlLicenseId, renewalId]);

  const handleFormPatch = (patch: Record<string, unknown>) => {
    hasUserInteractedRef.current = true;
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

  // Smoothly scroll the top of a given accordion section into view.
  const scrollToSectionTop = (sectionKey: string) => {
    setTimeout(() => {
      const el = document.getElementById(`renewal-section-${sectionKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 120);
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

  const [sectionCompleted, setSectionCompleted] = useState<Record<string, boolean>>({
    personal: false,
    address: false,
    occupation: false,
    criminal: false,
    licenseDetails: false,
    licenseHistory: false,
    biometric: false,
    documents: false,
  });

  const allSectionsCompleted = Object.values(sectionCompleted).every(Boolean);

  const [savingSection, setSavingSection] = useState<string | null>(null);
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
    if (!isVerified) return;
    const resolvedLicenseId = urlLicenseId || enteredLicenseId;
    if (!resolvedLicenseId && !renewalId) {
      setError('No application context was provided.');
      setIsLoading(false);
      return;
    }

    const loadRenewalById = async (rId: string) => {
      const renewalResponse = await RenewalService.getRenewalForm(rId);
      const renewalData = extractData(renewalResponse);
      if (!renewalData) {
        throw new Error('No saved renewal data was returned for the renewal ID.');
      }

      const workflowCode = String(
        renewalData?.workflowStatus?.code || renewalData?.workflowStatus?.name || ''
      ).toUpperCase();
      const isSubmitted = Boolean(renewalData?.isSubmit);
      if (isSubmitted) {
        // Already submitted — do not show the editable renewal form. Redirect to
        // the Renewal Application Details page (Information tab).
        const targetRenewalId = getTextValue(renewalData?.id, rId);
        router.replace(`/renewalApplication/${encodeURIComponent(targetRenewalId)}?tab=info`);
        return renewalData;
      }
      if (workflowCode === 'APPROVED') {
        setIsReadOnly(true);
        setShowReadOnlyModal(true);
      }

      setRenewalRecord(renewalData);

      // Fetch fresh application data to display and pre-fill renewal form
      const freshData = await fetchFreshApplicationWithFiles(resolvedLicenseId);
      let mergedFormData: RenewalFormState;
      if (freshData) {
        const freshFormState = buildFieldStateFromFreshApplication(
          resolvedLicenseId,
          freshData
        );
        const renewalFormData = await buildFormDataFromRenewalRecord(
          renewalData,
          resolvedLicenseId
        );
        mergedFormData = mergeRenewalStateOverFresh(freshFormState, renewalFormData, renewalData);
      } else {
        mergedFormData = await buildFormDataFromRenewalRecord(renewalData, resolvedLicenseId);
      }

      const { formData: syncedForm, synced } = await applyPrefilledDocumentUploads(
        rId,
        mergedFormData
      );
      setFormData(syncedForm as RenewalFormState);
      setStatusMessage(
        synced
          ? `Loaded renewal ${getTextValue(renewalData?.acknowledgementNo, renewalData?.id, rId)}; prefilled documents saved via upload-file.`
          : `Loaded renewal application ${getTextValue(renewalData?.acknowledgementNo, renewalData?.id, rId)}.`
      );
      return renewalData;
    };

    const load = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setStatusMessage(null);

        // Path A: renewalId is already known — load renewal directly, no fresh data needed.
        if (renewalId) {
          await loadRenewalById(renewalId);
          return;
        }

        // Path B: Only licenseId — fetch license, check for existing renewal.
        // Step 1: Fetch fresh application data to extract licenseNumber.
        const freshData = await fetchFreshApplicationWithFiles(resolvedLicenseId);

        if (!freshData) {
          throw new Error('No fresh application data found for the provided ID.');
        }

        const licenseNumber = getLicenseNumber(freshData);

        // Step 2: Search for existing renewal by licenseNumber.
        if (licenseNumber) {
          const existingRenewal = await RenewalService.findRenewalByLicenseNumber(licenseNumber);

          if (existingRenewal) {
            // Existing renewal found — load renewal data as sole source of truth.
            const existingRenewalId = getTextValue(
              existingRenewal?.id,
              existingRenewal?.renewalApplicationId
            );
            if (existingRenewalId) {
              createdRenewalIdRef.current = existingRenewalId;
              await loadRenewalById(existingRenewalId);
              // Update URL to include renewalId.
              router.replace(
                `/forms/renewal?licenseId=${encodeURIComponent(resolvedLicenseId)}&renewalId=${encodeURIComponent(existingRenewalId)}`
              );
              return;
            }
          }
        }

        const prefilledForm = buildFieldStateFromFreshApplication(resolvedLicenseId, freshData);

        // Validate that the fresh application has been submitted.
        const applicationCheckResponse =
          await ApplicationService.getLicense(resolvedLicenseId);
        const isSubmitted =
          applicationCheckResponse?.isSubmit === true ||
          applicationCheckResponse?.data?.isSubmit === true;
        if (!isSubmitted) {
          throw new Error('Your application has not been submitted.');
        }

        await createDraftRenewalFromFreshApplication(
          resolvedLicenseId,
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
  }, [isVerified, urlLicenseId, enteredLicenseId, renewalId, router]);

  function handleChange(
    event:
      | React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
      | { target: { name: string; value: unknown; type?: string; checked?: boolean } }
  ) {
    if (isReadOnly) {
      setShowReadOnlyModal(true);
      return;
    }
    // Mark that the user has actively edited the form so section auto-navigation
    // is only triggered by genuine user input.
    hasUserInteractedRef.current = true;
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
        next.permanentRangeOffice = next.presentRangeOffice || '';
        next.permanentZone = next.presentZone || '';
        next.permanentDivision = next.presentDivision || '';
        next.permanentPoliceStation = next.presentPoliceStation || '';
        next.permanentPincode = next.presentPincode || '';
        next.permanentStateName = next.presentStateName || '';
        next.permanentDistrictName = next.presentDistrictName || '';
        next.permanentRangeOfficeName = next.presentRangeOfficeName || '';
        next.permanentZoneName = next.presentZoneName || '';
        next.permanentDivisionName = next.presentDivisionName || '';
        next.permanentPoliceStationName = next.presentPoliceStationName || '';
      } else if (name === 'sameAsPresent' && rawValue === false) {
        // Clear permanent address fields when unchecked so user can enter different address
      }

      // If sameAsPresent is checked, keep permanent fields in sync when present fields change
      if (next.sameAsPresent) {
        if (name === 'presentAddress') next.permanentAddress = rawValue as any;
        if (name === 'presentState') {
          next.permanentState = rawValue as any;
          next.permanentStateName = next.presentStateName;
        }
        if (name === 'presentStateName') next.permanentStateName = rawValue as any;
        if (name === 'presentDistrict') {
          next.permanentDistrict = rawValue as any;
          next.permanentDistrictName = next.presentDistrictName;
        }
        if (name === 'presentDistrictName') next.permanentDistrictName = rawValue as any;
        if (name === 'presentRangeOffice') {
          next.permanentRangeOffice = rawValue as any;
          next.permanentRangeOfficeName = next.presentRangeOfficeName;
        }
        if (name === 'presentRangeOfficeName') next.permanentRangeOfficeName = rawValue as any;
        if (name === 'presentZone') {
          next.permanentZone = rawValue as any;
          next.permanentZoneName = next.presentZoneName;
        }
        if (name === 'presentZoneName') next.permanentZoneName = rawValue as any;
        if (name === 'presentDivision') {
          next.permanentDivision = rawValue as any;
          next.permanentDivisionName = next.presentDivisionName;
        }
        if (name === 'presentDivisionName') next.permanentDivisionName = rawValue as any;
        if (name === 'presentPoliceStation') {
          next.permanentPoliceStation = rawValue as any;
          next.permanentPoliceStationName = next.presentPoliceStationName;
        }
        if (name === 'presentPoliceStationName') next.permanentPoliceStationName = rawValue as any;
        if (name === 'presentPincode') next.permanentPincode = rawValue as any;
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
        next.firDetailsList = [];
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
        next.weaponEndorsedList = [];
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
        'firDetailsList',
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
      clearErrorKeys(setLicenseHistoryErrors, [
        'familyMemberName',
        'familyLicenseNumber',
        'weaponEndorsedList',
      ]);
    }

    if (name === 'hasSafeCustody' && rawValue === false) {
      clearErrorKeys(setLicenseHistoryErrors, ['safeCustodyDetails']);
    }

    if (name === 'hasTrainingUnderRule10' && rawValue === false) {
      clearErrorKeys(setLicenseHistoryErrors, ['trainingDetails']);
    }
  }

  function handleFileChange(name: string, file: File | null) {
    hasUserInteractedRef.current = true;
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

  const validateAddressDetails = (data: RenewalFormState) => {
    const errs: Record<string, string> = {};
    const requireField = (key: string, label: string) => {
      const v = (data as any)[key];
      if (!v || String(v).trim() === '') errs[key] = `${label} is required`;
    };
    requireField('presentAddress', 'Present address');
    requireField('presentState', 'Present state');
    requireField('presentDistrict', 'Present district');
    if (!data.sameAsPresent) {
      requireField('permanentAddress', 'Permanent address');
      requireField('permanentState', 'Permanent state');
      requireField('permanentDistrict', 'Permanent district');
    }
    return errs;
  };

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

  const validateLicenseDetails = (data: RenewalFormState) => {
    const errs: Record<string, string> = {};
    const requireField = (key: string, label: string) => {
      const v = (data as any)[key];
      if (!v || String(v).trim() === '') errs[key] = `${label} is required`;
    };
    requireField('weaponReason', 'Need for license (15)');
    requireField('ammunitionDescription', 'Ammunition Description');
    if (!data.specialEvidenceUploaded) {
      errs['specialEvidenceUploaded'] = 'Documentary evidence is required.';
    }
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

  const validateCriminalHistory = (data: RenewalFormState) => {
    const errs: Record<string, string> = {};
    const requireField = (key: string, label: string) => {
      const v = (data as any)[key];
      if (!v || String(v).trim() === '') errs[key] = `${label} is required`;
    };

    if (data.convictedStatus) {
      const firList = Array.isArray(data.firDetailsList) ? data.firDetailsList : [];
      if (firList.length === 0) {
        errs['firDetailsList'] = 'At least one FIR detail is required';
      } else {
        firList.forEach((item: any, idx: number) => {
          const missing = [
            { key: 'firNumber', label: 'FIR Number' },
            { key: 'underSection', label: 'Under Section' },
            { key: 'policeStation', label: 'Police Station' },
            { key: 'unit', label: 'Unit' },
            { key: 'district', label: 'District' },
            { key: 'state', label: 'State' },
            { key: 'offence', label: 'Offence' },
            { key: 'sentence', label: 'Sentence' },
            { key: 'sentenceDate', label: 'Date of Sentence' },
          ];
          missing.forEach(field => {
            const value = item?.[field.key];
            if (!value || String(value).trim() === '') {
              errs['firDetailsList'] = 'Complete all FIR details';
            }
          });
        });
      }
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

  const validateLicenseHistory = (data: RenewalFormState) => {
    const errs: Record<string, string> = {};
    const requireField = (key: string, label: string) => {
      const v = (data as any)[key];
      if (!v || String(v).trim() === '') errs[key] = `${label} is required`;
    };

    if (data.hasAppliedBefore) {
      requireField('applicationDate', 'Date of Application');
      requireField('authorityAppliedTo', 'Authority Applied To');
      requireField('applicationResult', 'Result');
    }

    if (data.licenseRevokedOrSuspended) {
      requireField('revokedByAuthority', 'Revoked by Authority');
      requireField('revokedReason', 'Reason');
    }

    if (data.familyMemberHasLicense) {
      requireField('familyMemberName', 'Name');
      requireField('familyLicenseNumber', 'License Number');

      const weapons = Array.isArray(data.weaponEndorsedList) ? data.weaponEndorsedList : [];
      if (weapons.length === 0) {
        errs['weaponEndorsedList'] = 'At least one weapon is required';
      } else {
        const hasEmptyWeapon = weapons.some((w: any) => {
          if (typeof w === 'string') return w.trim() === '';
          return !w.value || String(w.value).trim() === '';
        });
        if (hasEmptyWeapon) {
          errs['weaponEndorsedList'] = 'Please select all weapons';
        }
      }
    }

    if (data.hasSafeCustody) {
      requireField('safeCustodyDetails', 'Safe Custody Details');
    }

    if (data.hasTrainingUnderRule10) {
      requireField('trainingDetails', 'Training Details');
    }

    return errs;
  };

  const validateDocumentsUpload = (data: RenewalFormState) => {
    const errs: Record<string, string> = {};
    if (!data.idProofUploaded) errs['idProofUploaded'] = 'Aadhar Card document is required.';
    if (!data.panCardUploaded) errs['panCardUploaded'] = 'PAN Card document is required.';
    if (!data.medicalCertificateUploaded)
      errs['medicalCertificateUploaded'] = 'Medical Certificate document is required.';
    return errs;
  };

  const validateDeclaration = (data: RenewalFormState) => {
    const errs: Record<string, string> = {};
    if (!data.declaration?.agreeToTruth)
      errs['agreeToTruth'] = 'Please accept this declaration.';
    if (!data.declaration?.understandLegalConsequences)
      errs['understandLegalConsequences'] = 'Please accept this declaration.';
    if (!data.declaration?.agreeToTerms)
      errs['agreeToTerms'] = 'Please accept the terms and conditions.';
    return errs;
  };

  // Ordered list of sections used for real-time progress, auto-navigation, and
  // submit-time validation. `biometric` has no required fields, so it is always
  // considered complete for progress/navigation purposes.
  const SECTION_FLOW_ORDER = [
    'personal',
    'address',
    'occupation',
    'criminal',
    'licenseDetails',
    'licenseHistory',
    'biometric',
    'documents',
  ] as const;

  const computeSectionValidity = (data: RenewalFormState): Record<string, boolean> => ({
    personal: Object.keys(validatePersonalDetails(data)).length === 0,
    address: Object.keys(validateAddressDetails(data)).length === 0,
    occupation: Object.keys(validateOccupationDetails(data)).length === 0,
    criminal: Object.keys(validateCriminalHistory(data)).length === 0,
    licenseDetails: Object.keys(validateLicenseDetails(data)).length === 0,
    licenseHistory: Object.keys(validateLicenseHistory(data)).length === 0,
    biometric: true,
    documents: Object.keys(validateDocumentsUpload(data)).length === 0,
  });

  const buildSectionSpecificPayload = (
    sectionKey: string,
    formData: RenewalFormState
  ): Record<string, any> => {
    const full = buildRenewalPatchPayload(formData);
    switch (sectionKey) {
      case 'personal':
        return full.personalDetails ? { personalDetails: full.personalDetails } : {};
      case 'address':
        return full.addressDetails ? { addressDetails: full.addressDetails } : {};
      case 'occupation':
        return full.occupationAndBusiness
          ? { occupationAndBusiness: full.occupationAndBusiness }
          : {};
      case 'criminal':
        return { criminalHistories: full.criminalHistories };
      case 'licenseDetails':
        return full.licenseDetails ? { licenseDetails: full.licenseDetails } : {};
      case 'licenseHistory':
        return { licenseHistories: full.licenseHistories };
      case 'biometric':
        return { biometricData: full.biometricData };
      case 'documents':
        return full.fileUploads ? { fileUploads: full.fileUploads } : {};
      default:
        return {};
    }
  };

  const handleSectionComplete = async (sectionKey: string) => {
    const activeRenewalId = renewalId || createdRenewalIdRef.current;
    if (!activeRenewalId) {
      toast.error('Renewal ID not available yet. Please wait for the form to load.');
      setSectionCompleted(prev => ({ ...prev, [sectionKey]: false }));
      return;
    }

    // Run section-specific validation
    let sectionErrors: Record<string, string> = {};
    if (sectionKey === 'personal') {
      sectionErrors = validatePersonalDetails(formData);
      if (Object.keys(sectionErrors).length > 0) {
        setPersonalErrors(sectionErrors);
        scheduleSectionFocus(personalSectionRef, 'personal');
      }
    } else if (sectionKey === 'address') {
      sectionErrors = validateAddressDetails(formData);
      if (Object.keys(sectionErrors).length > 0) {
        setAddressErrors(sectionErrors);
        scheduleSectionFocus(addressSectionRef, 'address');
      }
    } else if (sectionKey === 'occupation') {
      sectionErrors = validateOccupationDetails(formData);
      if (Object.keys(sectionErrors).length > 0) {
        setOccupationErrors(sectionErrors);
        scheduleSectionFocus(occupationSectionRef, 'occupation');
      }
    } else if (sectionKey === 'criminal') {
      sectionErrors = validateCriminalHistory(formData);
      if (Object.keys(sectionErrors).length > 0) {
        // We don't have a specific state for criminalErrors in page.tsx right now,
        // but returning them stops completion. We can add setCriminalErrors if needed,
        // or just rely on toast.
        // For now, this effectively stops it from saving and shows the generic "Failed to save" or "Fix validation errors" via toast.
      }
    } else if (sectionKey === 'licenseDetails') {
      sectionErrors = validateLicenseDetails(formData);
      if (Object.keys(sectionErrors).length > 0) {
        setLicenseDetailsErrors(sectionErrors);
        scheduleSectionFocus(licenseDetailsSectionRef, 'licenseDetails');
      }
    } else if (sectionKey === 'licenseHistory') {
      sectionErrors = validateLicenseHistory(formData);
      if (Object.keys(sectionErrors).length > 0) {
        // Also missing setLicenseHistoryErrors state, but returning errors prevents completion
      }
    } else if (sectionKey === 'documents') {
      sectionErrors = validateDocumentsUpload(formData);
      if (Object.keys(sectionErrors).length > 0) {
        setDocumentsErrors(sectionErrors);
        scheduleSectionFocus(documentsSectionRef, 'documents');
      }
    }

    if (Object.keys(sectionErrors).length > 0) {
      toast.error('Please fix validation errors in this section before marking it complete.');
      setSectionCompleted(prev => ({ ...prev, [sectionKey]: false }));
      return;
    }

    try {
      setIsSaving(true);
      setSavingSection(sectionKey);
      setError(null);
      const sectionPayload = buildSectionSpecificPayload(sectionKey, formData);
      if (Object.keys(sectionPayload).length === 0) {
        toast.warning('No data to save for this section.');
        setSectionCompleted(prev => ({ ...prev, [sectionKey]: true }));
        return;
      }
      await RenewalService.updateRenewalForm(activeRenewalId, sectionPayload);
      setSectionCompleted(prev => ({ ...prev, [sectionKey]: true }));
      toast.success(
        `${sectionKey.charAt(0).toUpperCase() + sectionKey.slice(1)} section saved successfully.`
      );
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save section. Please try again.');
      setSectionCompleted(prev => ({ ...prev, [sectionKey]: false }));
    } finally {
      setIsSaving(false);
      setSavingSection(null);
    }
  };

  useEffect(() => {
    // Keep the section progress indicator in sync with field validity in real time,
    // and auto-navigate to the next incomplete section as each one is completed.
    if (isLoading) return;

    const validity = computeSectionValidity(formData);

    setSectionCompleted(prev => {
      const changed = SECTION_FLOW_ORDER.some(key => prev[key] !== validity[key]);
      return changed ? { ...prev, ...validity } : prev;
    });

    const prevValidity = sectionValidityRef.current;
    sectionValidityRef.current = validity;

    // Skip the very first computation and any change not driven by the user so the
    // form does not jump around on initial load / prefill.
    if (!prevValidity || !hasUserInteractedRef.current) return;

    const newlyCompleted = SECTION_FLOW_ORDER.find(
      key => validity[key] && !prevValidity[key]
    );
    if (!newlyCompleted) return;

    const startIdx = SECTION_FLOW_ORDER.indexOf(newlyCompleted);
    const nextIncomplete = SECTION_FLOW_ORDER.slice(startIdx + 1).find(key => !validity[key]);
    const target = nextIncomplete ?? 'declaration';

    setExpandedSections(prev => ({ ...prev, [target]: true }));
    scrollToSectionTop(target);
  }, [formData, isLoading]);

  const persistRenewalForm = async (isSubmit: boolean) => {
    const activeRenewalId = renewalId || createdRenewalIdRef.current;

    if (!activeRenewalId) {
      setError('Renewal ID not available yet.');
      return false;
    }

    // Client-side validation before saving/submitting
    const preSaveErrors = validatePersonalDetails(formData);
    if (Object.keys(preSaveErrors).length > 0) {
      setPersonalErrors(preSaveErrors);
      scheduleSectionFocus(personalSectionRef, 'personal');
      setError('Please fix validation errors before continuing.');
      return false;
    }

    const addressValidationErrors = validateAddressDetails(formData);
    if (Object.keys(addressValidationErrors).length > 0) {
      setAddressErrors(addressValidationErrors);
      scheduleSectionFocus(addressSectionRef, 'address');
      setError('Please fix validation errors in Address Details before continuing.');
      return false;
    }

    const occupationValidationErrors = validateOccupationDetails(formData);
    if (Object.keys(occupationValidationErrors).length > 0) {
      setOccupationErrors(occupationValidationErrors);
      scheduleSectionFocus(occupationSectionRef, 'occupation');
      setError('Please fix validation errors in Occupation section before continuing.');
      return false;
    }

    const criminalValidationErrors = validateCriminalHistory(formData);
    if (Object.keys(criminalValidationErrors).length > 0) {
      setError('Please fix validation errors in Criminal History before continuing.');
      return false;
    }

    const licenseDetailsValidationErrors = validateLicenseDetails(formData);
    if (Object.keys(licenseDetailsValidationErrors).length > 0) {
      setLicenseDetailsErrors(licenseDetailsValidationErrors);
      scheduleSectionFocus(licenseDetailsSectionRef, 'licenseDetails');
      setError('Please fix validation errors in License Details before continuing.');
      return false;
    }

    const licenseHistoryValidationErrors = validateLicenseHistory(formData);
    if (Object.keys(licenseHistoryValidationErrors).length > 0) {
      setError('Please fix validation errors in License History before continuing.');
      return false;
    }

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
      const saved = extractData(reloadResponse);
      setRenewalRecord(saved);

      if (saved) {
        const mergedFormData = await buildFormDataFromRenewalRecord(
          saved,
          resolveFreshApplicationId(saved, resolvedLicenseId)
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

  /**
   * Validate every section of the renewal form for submission.
   * Publishes all validation errors so invalid fields are highlighted with their
   * messages, then scrolls to and focuses the first section containing errors.
   * Returns true when the whole form is valid.
   */
  const runSubmitValidation = (): boolean => {
    const checks: Array<{
      key: string;
      errors: Record<string, string>;
      set: React.Dispatch<React.SetStateAction<Record<string, string>>>;
      ref: React.RefObject<any>;
    }> = [
      {
        key: 'personal',
        errors: validatePersonalDetails(formData),
        set: setPersonalErrors,
        ref: personalSectionRef,
      },
      {
        key: 'address',
        errors: validateAddressDetails(formData),
        set: setAddressErrors,
        ref: addressSectionRef,
      },
      {
        key: 'occupation',
        errors: validateOccupationDetails(formData),
        set: setOccupationErrors,
        ref: occupationSectionRef,
      },
      {
        key: 'criminal',
        errors: validateCriminalHistory(formData),
        set: setCriminalErrors,
        ref: criminalSectionRef,
      },
      {
        key: 'licenseDetails',
        errors: validateLicenseDetails(formData),
        set: setLicenseDetailsErrors,
        ref: licenseDetailsSectionRef,
      },
      {
        key: 'licenseHistory',
        errors: validateLicenseHistory(formData),
        set: setLicenseHistoryErrors,
        ref: licenseHistorySectionRef,
      },
      {
        key: 'documents',
        errors: validateDocumentsUpload(formData),
        set: setDocumentsErrors,
        ref: documentsSectionRef,
      },
      {
        key: 'declaration',
        errors: validateDeclaration(formData),
        set: setDeclarationErrors,
        ref: declarationSectionRef,
      },
    ];

    // Publish every section's validation result at once so all invalid fields are
    // highlighted with their messages, not just the first failing section.
    checks.forEach(check => check.set(check.errors));

    const firstInvalid = checks.find(check => Object.keys(check.errors).length > 0);
    if (!firstInvalid) {
      setError(null);
      return true;
    }

    // Reveal, scroll to, and focus the first section that has validation errors.
    setExpandedSections(prev => ({ ...prev, [firstInvalid.key]: true }));
    scrollToSectionTop(firstInvalid.key);
    setTimeout(() => {
      try {
        firstInvalid.ref.current?.focusFirstInvalid();
      } catch {
        /* ignore if the section is not mounted yet */
      }
    }, 300);

    setError('Please complete all required fields highlighted below before submitting.');
    toast.error('Please complete all required fields before submitting.');
    return false;
  };

  const handleRenewalSubmit = async () => {
    if (isReadOnly) {
      setShowReadOnlyModal(true);
      return;
    }

    // The Submit button always stays enabled; validation is enforced here.
    if (!runSubmitValidation()) return;

    // Persist the full form (declaration flags and isSubmit are part of the payload),
    // then show the success confirmation.
    const persisted = await persistRenewalForm(true);
    if (persisted) {
      setSuccessMessage('Renewal application is submitted');
      setShowSuccessModal(true);
    }
  };

  const handleSuccessContinue = () => {
    setShowSuccessModal(false);
    router.push('/inbox?type=all');
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
        resolveFreshApplicationId(renewalData, resolvedLicenseId)
      );
      const { formData: syncedForm } = await applyPrefilledDocumentUploads(activeRenewalId, merged);
      setFormData(syncedForm as RenewalFormState);
      setStatusMessage(
        `Reloaded renewal data for ID ${getTextValue(renewalData?.id, activeRenewalId)}.`
      );
    } catch (reloadError: any) {
      setError(reloadError?.message || 'Failed to reload renewal data.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVerified) {
    return (
      <div
        className="min-h-screen flex flex-col bg-cover bg-center bg-fixed relative overflow-hidden bg-[url('/backgroundIMGALMS.jpeg')]"
        role='main'
      >
        <div
          className='absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/50 backdrop-blur-[2px]'
          aria-hidden='true'
        />
        <div className='relative flex-grow flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 z-10'>
          <div className='max-w-md w-full space-y-6 bg-white/90 p-10 rounded-lg shadow-xl backdrop-blur-sm border border-white/40 transition-all duration-300'>
            {verificationChecking && verificationStatus === 'ENTER_APP_ID' ? (
              <div className='space-y-6 py-8 text-center'>
                <div className='mx-auto w-12 h-12 border-4 border-[#001F54] border-t-transparent rounded-full animate-spin flex items-center justify-center'>
                  <span className='text-xl'>🪪</span>
                </div>
                <h3 className='text-lg font-bold text-gray-900'>Loading Application Context...</h3>
                <p className='text-sm text-gray-500'>Checking biometric requirements</p>
              </div>
            ) : (
              verificationStatus === 'ENTER_APP_ID' && (
                <div className='space-y-6'>
                  <div className='text-center'>
                    <div className='mb-6 flex justify-center'>
                      <img
                        src='/icon-alms.svg'
                        alt='ALMS Logo'
                        width={100}
                        height={100}
                        className='drop-shadow-md h-auto'
                      />
                    </div>
                    <h2 className='text-2xl font-bold tracking-tight text-gray-900'>
                      License Renewal Verification
                    </h2>
                    <p className='mt-2 text-sm text-gray-600'>
                      Please enter your License ID or License Number to verify your identity and start
                      the renewal process.
                    </p>
                  </div>

                  {verificationError && (
                    <div className='rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
                      {verificationError}
                    </div>
                  )}

                  <div className='space-y-4'>
                    <div>
                      <label
                        htmlFor='license-id'
                        className='block text-sm font-semibold text-gray-700 mb-1'
                      >
                        License ID or License Number
                      </label>
                      <input
                        id='license-id'
                        type='text'
                        value={enteredLicenseId}
                        onChange={e => setEnteredLicenseId(e.target.value)}
                        placeholder='e.g. 12 or LUAN20260703132128000625'
                        className='w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-[#D4AF37] bg-white text-gray-900 font-semibold'
                      />
                    </div>

                    <button
                      onClick={handleLicenseLookup}
                      disabled={verificationChecking || !enteredLicenseId.trim()}
                      className='w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-md text-sm font-semibold text-gray-900 bg-[#D4AF37] hover:bg-[#C4A02F] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37] disabled:opacity-60 disabled:cursor-not-allowed transition-all hover:scale-[1.01]'
                    >
                      {verificationChecking ? 'Checking...' : 'Verify / Continue'}
                    </button>
                  </div>
                </div>
              )
            )}

            {verificationStatus === 'VERIFYING_BIOMETRICS' && applicantDetails && (
              <div className='space-y-6'>
                <div className='text-center'>
                  <div className='mb-6 flex justify-center'>
                    <img
                      src='/icon-alms.svg'
                      alt='ALMS Logo'
                      width={100}
                      height={100}
                      className='drop-shadow-md h-auto'
                    />
                  </div>
                  <h2 className='text-2xl font-bold tracking-tight text-gray-900'>
                    Biometric Identity Match
                  </h2>
                  <p className='mt-2 text-sm text-gray-600'>
                    Verify you are the same applicant as registered in the original application.
                  </p>
                </div>

                <div className='bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-500 font-medium'>Applicant Name</span>
                    <span className='text-gray-800 font-semibold'>{applicantDetails.name}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-500 font-medium'>License ID</span>
                    <span className='text-gray-800 font-semibold'>
                      {applicantDetails.licenseId}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-500 font-medium'>License Number</span>
                    <span className='text-gray-800 font-semibold'>
                      {applicantDetails.licenseNumber}
                    </span>
                  </div>
                </div>

                {verificationError && (
                  <div className='rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
                    {verificationError}
                  </div>
                )}

                {/* Signature/Thumb Impression section layout from fresh form */}
                <div className='p-6 rounded-xl border border-gray-200 bg-white shadow-sm space-y-4 text-left'>
                  <div className='flex justify-between items-center mb-2'>
                    <div className='font-semibold text-gray-800'>Signature / Thumb Impression</div>
                    <div className='flex items-center gap-2'>
                      {/* Info Icon with Tooltip */}
                      <div className='relative'>
                        <button
                          type='button'
                          onClick={() => setShowInfoTooltip(!showInfoTooltip)}
                          className='p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition-colors'
                          title='Device setup information'
                        >
                          <svg className='w-5 h-5' fill='currentColor' viewBox='0 0 20 20'>
                            <path
                              fillRule='evenodd'
                              d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                              clipRule='evenodd'
                            />
                          </svg>
                        </button>
                        {/* Info Tooltip Popover */}
                        {showInfoTooltip && (
                          <div className='absolute right-0 top-8 w-80 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-4'>
                            <div className='flex justify-between items-start mb-3'>
                              <h4 className='font-semibold text-gray-800 flex items-center gap-2'>
                                <svg
                                  className='w-5 h-5 text-blue-600'
                                  fill='currentColor'
                                  viewBox='0 0 20 20'
                                >
                                  <path
                                    fillRule='evenodd'
                                    d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                                    clipRule='evenodd'
                                  />
                                </svg>
                                Device Setup Guide
                              </h4>
                              <button
                                type='button'
                                onClick={() => setShowInfoTooltip(false)}
                                className='text-gray-400 hover:text-gray-600'
                              >
                                ✕
                              </button>
                            </div>
                            <div className='space-y-2 text-sm text-gray-600'>
                              <p>✔ Connect Mantra MFS500 via USB</p>
                              <p>✔ Install Mantra drivers</p>
                              <p>✔ Run Mantra RD Service</p>
                              <p>✔ Start MorfinAuth SDK on port 8030</p>
                            </div>
                          </div>
                        )}
                      </div>
                      <button
                        type='button'
                        onClick={() => setShowDeviceSettings(!showDeviceSettings)}
                        className='px-3 py-1 text-sm bg-gray-600 hover:bg-gray-700 text-white rounded flex items-center gap-1'
                        title='Open device diagnostics and settings'
                      >
                        ⚙️ Settings
                      </button>
                    </div>
                  </div>

                  <div className='space-y-2'>
                    <div className='mb-4'>
                      <label className='block text-sm font-semibold text-gray-700 mb-1'>
                        Required Hand & Finger
                      </label>
                      <select
                        value={biometricTargetThumb || 'RIGHT_THUMB'}
                        disabled
                        className='w-full p-2.5 border border-gray-300 rounded-md shadow-sm bg-gray-100 cursor-not-allowed text-gray-700 font-semibold'
                      >
                        <option value='RIGHT_THUMB'>Right Hand Thumb</option>
                        <option value='LEFT_THUMB'>Left Hand Thumb</option>
                      </select>
                      <p className='text-sm text-blue-600 mt-1 font-medium'>
                        Please scan your enrolled{' '}
                        {biometricTargetThumb === 'LEFT_THUMB'
                          ? 'Left hand thumb print'
                          : 'Right hand thumb print'}
                        .
                      </p>
                    </div>

                    {/* Mantra SDK Fingerprint Capture */}
                    {mantraSDKReady && deviceConnected ? (
                      <div className='flex items-center space-x-3'>
                        <button
                          type='button'
                          onClick={handleVerifyBiometrics}
                          disabled={fingerprintCapturing}
                          className='px-5 py-2.5 bg-[#D4AF37] hover:bg-[#C4A02F] text-gray-900 rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-md'
                        >
                          <svg
                            className='w-5 h-5'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.858.571-4.177'
                            />
                          </svg>
                          {fingerprintCapturing ? 'Capturing...' : 'Scan Fingerprint'}
                        </button>
                        <span className='text-sm text-green-600 font-medium'>✓ Device Ready</span>
                      </div>
                    ) : (
                      <div className='flex items-center space-x-3'>
                        <button
                          type='button'
                          onClick={() => checkDeviceConnection()}
                          className='px-5 py-2.5 bg-gray-300 text-gray-600 rounded-md font-semibold cursor-not-allowed flex items-center gap-2'
                          disabled
                        >
                          <svg
                            className='w-5 h-5'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.2-2.858.571-4.177'
                            />
                          </svg>
                          Scan Fingerprint
                        </button>
                        <span className='text-sm text-gray-500 font-medium'>
                          {!mantraSDKReady ? 'Mantra SDK not initialized' : 'Device not connected'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className='space-y-3'>
                  <button
                    onClick={() => {
                      setVerificationStatus('ENTER_APP_ID');
                      setVerificationError(null);
                    }}
                    className='w-full flex justify-center py-2.5 px-4 border border-gray-300 rounded-md text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm'
                  >
                     Change License ID / Number
                  </button>
                </div>
              </div>
            )}

            {/* ⚙️ DEVICE SETTINGS & DIAGNOSTICS MODAL */}
            {showDeviceSettings && (
              <div
                className='fixed inset-0 bg-black/75 flex items-center justify-center z-[9999] p-4 text-left font-normal'
                style={{
                  display: 'flex',
                  visibility: 'visible',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div className='bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto flex flex-col'>
                  <div className='border-b px-6 py-4 sticky top-0 bg-white flex justify-between items-center z-10'>
                    <div>
                      <h2 className='text-2xl font-bold text-gray-800'>
                        Device Settings & Diagnostics
                      </h2>
                      <p className='text-sm text-gray-500 mt-1'>
                        Test Mantra MFS500 device connectivity and API endpoints
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDeviceSettings(false)}
                      className='text-gray-600 hover:text-gray-900 text-2xl font-bold'
                    >
                      ✕
                    </button>
                  </div>

                  <div className='px-6 py-6 overflow-y-auto flex-1'>
                    <div
                      className='mb-6 p-4 rounded-lg border-2'
                      style={{
                        backgroundColor: deviceConnected ? '#ecfdf5' : '#fef2f2',
                        borderColor: deviceConnected ? '#10b981' : '#ef4444',
                      }}
                    >
                      <p
                        className='font-semibold'
                        style={{ color: deviceConnected ? '#059669' : '#dc2626' }}
                      >
                        {deviceConnected ? '✓ Device Connected' : '✗ Device Not Connected'}
                      </p>
                      <p className='text-sm text-gray-600 mt-1'>
                        {deviceConnected
                          ? 'Device is online and ready for testing'
                          : 'Device is offline. Please check the connection and restart the device service.'}
                      </p>
                    </div>

                    <div className='grid grid-cols-2 gap-3 mb-6'>
                      <button
                        onClick={() => runDiagnostic('Check Device', testCheckDevice)}
                        disabled={diagnosticLoading === 'Check Device'}
                        className='px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors'
                      >
                        {diagnosticLoading === 'Check Device' ? '⟳ Testing...' : 'Check Device'}
                      </button>

                      <button
                        onClick={() =>
                          runDiagnostic('Get Connected Device', testGetConnectedDevice)
                        }
                        disabled={diagnosticLoading === 'Get Connected Device'}
                        className='px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors'
                      >
                        {diagnosticLoading === 'Get Connected Device'
                          ? '⟳ Testing...'
                          : 'Get Connected Device'}
                      </button>

                      <button
                        onClick={() =>
                          runDiagnostic('Get Supported Device', testGetSupportedDevice)
                        }
                        disabled={diagnosticLoading === 'Get Supported Device'}
                        className='px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors'
                      >
                        {diagnosticLoading === 'Get Supported Device'
                          ? '⟳ Testing...'
                          : 'Get Supported Device'}
                      </button>

                      <button
                        onClick={() => runDiagnostic('Get Info', testGetInfo)}
                        disabled={diagnosticLoading === 'Get Info'}
                        className='px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors'
                      >
                        {diagnosticLoading === 'Get Info' ? '⟳ Testing...' : 'Get Info'}
                      </button>

                      <button
                        onClick={() => runDiagnostic('Capture', testCapture)}
                        disabled={diagnosticLoading === 'Capture' || !deviceConnected}
                        className='px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors'
                      >
                        {diagnosticLoading === 'Capture' ? '⟳ Testing...' : 'Capture'}
                      </button>

                      <button
                        onClick={() => runDiagnostic('Get Image', testGetImage)}
                        disabled={diagnosticLoading === 'Get Image'}
                        className='px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors'
                      >
                        {diagnosticLoading === 'Get Image' ? '⟳ Testing...' : 'Get Image'}
                      </button>

                      <button
                        onClick={() => runDiagnostic('Get Template', testGetTemplate)}
                        disabled={diagnosticLoading === 'Get Template'}
                        className='px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors'
                      >
                        {diagnosticLoading === 'Get Template' ? '⟳ Testing...' : 'Get Template'}
                      </button>

                      <button
                        onClick={() => runDiagnostic('Match', testMatch)}
                        disabled={diagnosticLoading === 'Match' || enrolledTemplates.length === 0}
                        className='px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors'
                      >
                        {diagnosticLoading === 'Match' ? '⟳ Testing...' : 'Match'}
                      </button>
                    </div>

                    {Object.keys(diagnosticResults).length > 0 && (
                      <div className='mt-6 pt-6 border-t border-gray-200'>
                        <div className='flex justify-between items-center mb-4'>
                          <p className='font-bold text-lg text-gray-800'>📊 Test Results</p>
                          <span className='text-sm text-gray-600'>
                            {Object.values(diagnosticResults).filter((r: any) => r.success).length}/
                            {Object.keys(diagnosticResults).length} Passed
                          </span>
                        </div>

                        <div className='space-y-3'>
                          {Object.entries(diagnosticResults).map(
                            ([testName, result]: [string, any]) => (
                              <div
                                key={testName}
                                className='p-4 rounded-lg border-2 transition-all'
                                style={{
                                  backgroundColor: result.success ? '#ecfdf5' : '#fef2f2',
                                  borderColor: result.success ? '#10b981' : '#ef4444',
                                }}
                              >
                                <div className='flex justify-between items-start'>
                                  <div className='flex-1'>
                                    <p
                                      className='font-bold flex items-center gap-2'
                                      style={{ color: result.success ? '#059669' : '#dc2626' }}
                                    >
                                      {result.success ? '✓' : '✗'} {testName}
                                    </p>
                                    {result.timestamp && (
                                      <p className='text-xs text-gray-500 mt-1'>
                                        {result.timestamp}
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {result.success ? (
                                  <div className='mt-3 text-sm text-gray-700'>
                                    <details className='cursor-pointer'>
                                      <summary className='font-medium text-gray-700 hover:text-gray-900'>
                                        📋 View Details
                                      </summary>
                                      <pre className='bg-gray-100 p-3 rounded border border-gray-300 text-xs overflow-auto max-h-48 mt-2 text-gray-800'>
                                        {JSON.stringify(result.data, null, 2)}
                                      </pre>
                                    </details>
                                  </div>
                                ) : (
                                  <div className='mt-3 text-sm' style={{ color: '#991b1b' }}>
                                    <p className='font-semibold'>
                                      {result.error || 'Unknown error'}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                    {Object.keys(diagnosticResults).length > 0 && (
                      <button
                        onClick={() => setDiagnosticResults({})}
                        className='mt-6 w-full px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium text-sm'
                      >
                        Clear Results
                      </button>
                    )}

                    <button
                      onClick={() => setShowDeviceSettings(false)}
                      className='mt-4 w-full px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold'
                    >
                      Close Settings
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Fingerprint Preview Modal */}
            {showFingerprintPreviewModal && pendingCaptureResult && (
              <div
                className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 text-left font-normal'
                style={{ display: 'flex', visibility: 'visible' }}
              >
                <div className='bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-auto border border-gray-200'>
                  <div className='bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5'>
                    <div className='flex items-center gap-4'>
                      <div className='bg-white/20 rounded-full p-3'>
                        <svg
                          className='w-8 h-8 text-white'
                          fill='none'
                          stroke='currentColor'
                          viewBox='0 0 24 24'
                        >
                          <path
                            strokeLinecap='round'
                            strokeLinejoin='round'
                            strokeWidth={2}
                            d='M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11'
                          />
                        </svg>
                      </div>
                      <div>
                        <h2 className='text-xl font-bold text-white'>Fingerprint Preview</h2>
                        <p className='text-blue-100 text-sm mt-1'>
                          Review quality before verifying identity
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className='px-6 py-6'>
                    <div className='mb-6'>
                      <div
                        className={`p-4 rounded-xl border-2 ${
                          (pendingCaptureResult?.quality || 0) >= 80
                            ? 'bg-green-50 border-green-300'
                            : (pendingCaptureResult?.quality || 0) >= 60
                              ? 'bg-yellow-50 border-yellow-300'
                              : 'bg-red-50 border-red-300'
                        }`}
                      >
                        <div className='flex items-center justify-between mb-3'>
                          <div className='flex items-center gap-2'>
                            <span
                              className={`font-semibold ${
                                (pendingCaptureResult?.quality || 0) >= 80
                                  ? 'text-green-700'
                                  : (pendingCaptureResult?.quality || 0) >= 60
                                    ? 'text-yellow-700'
                                    : 'text-red-700'
                              }`}
                            >
                              {(pendingCaptureResult?.quality || 0) >= 80
                                ? 'Excellent Quality'
                                : (pendingCaptureResult?.quality || 0) >= 60
                                  ? 'Good Quality'
                                  : 'Low Quality - Consider Retaking'}
                            </span>
                          </div>
                          <span
                            className={`text-3xl font-bold ${
                              (pendingCaptureResult?.quality || 0) >= 80
                                ? 'text-green-600'
                                : (pendingCaptureResult?.quality || 0) >= 60
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {pendingCaptureResult?.quality || 0}%
                          </span>
                        </div>
                        <div className='w-full bg-gray-200 rounded-full h-3 overflow-hidden'>
                          <div
                            className={`h-3 rounded-full transition-all duration-500 ${
                              (pendingCaptureResult?.quality || 0) >= 80
                                ? 'bg-green-500'
                                : (pendingCaptureResult?.quality || 0) >= 60
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${pendingCaptureResult?.quality || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    <div className='mb-6'>
                      <h3 className='text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide'>
                        Captured Fingerprint
                      </h3>
                      <div className='flex justify-center bg-gradient-to-b from-gray-50 to-gray-100 rounded-xl p-6 min-h-[280px] items-center border border-gray-200'>
                        {fingerprintPreviewImage ? (
                          <div className='flex flex-col items-center gap-3'>
                            <div className='relative'>
                              <img
                                src={fingerprintPreviewImage}
                                alt='Fingerprint Preview'
                                className='max-w-full max-h-80 border-4 border-white rounded-lg shadow-lg'
                              />
                            </div>
                          </div>
                        ) : (
                          <div className='text-center py-8'>
                            <p className='text-gray-500 font-medium'>No preview image available</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className='mb-6'>
                      <h3 className='text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide'>
                        Finger Position
                      </h3>
                      <div className='flex items-center gap-3 p-4 bg-blue-50 rounded-lg border border-blue-200'>
                        <div className='bg-blue-600 rounded-full p-2 text-white'>👆</div>
                        <div>
                          <p className='font-bold text-blue-900'>
                            {biometricTargetThumb === 'LEFT_THUMB'
                              ? 'Left hand thumb print'
                              : 'Right hand thumb print'}
                          </p>
                          <p className='text-xs text-blue-700'>Matches required biometric type</p>
                        </div>
                      </div>
                    </div>

                    <div className='flex justify-end gap-3 pt-4 border-t border-gray-100'>
                      <button
                        onClick={() => {
                          setShowFingerprintPreviewModal(false);
                          setFingerprintPreviewImage(null);
                          setPendingCaptureResult(null);
                        }}
                        className='px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors'
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          setShowFingerprintPreviewModal(false);
                          setFingerprintPreviewImage(null);
                          setPendingCaptureResult(null);
                          handleVerifyBiometrics();
                        }}
                        className='px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-semibold transition-colors'
                      >
                        Retake
                      </button>
                      <button
                        onClick={handleAcceptFingerprintPreview}
                        className='px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors shadow-sm'
                      >
                        Accept & Verify
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Capturing Status Modal */}
            {showCapturingModal && (
              <div
                className='fixed inset-0 bg-black/60 flex items-center justify-center z-[9999] p-4 text-left font-normal'
                style={{ display: 'flex', visibility: 'visible' }}
              >
                <div className='bg-white rounded-xl shadow-2xl max-w-md w-full p-6 text-center space-y-4'>
                  <div className='mx-auto w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin flex items-center justify-center'>
                    <span className='text-2xl'>👆</span>
                  </div>
                  <h3 className='text-lg font-bold text-gray-900'>Biometric Scan in Progress</h3>
                  <p className='text-sm text-gray-500'>{capturingStep}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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
            <h2 className='text-center text-lg font-semibold text-gray-900'>
              Application Read-Only
            </h2>
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
            licenseId={urlLicenseId || enteredLicenseId}
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
              handleRenewalSubmit();
            }}
            className='space-y-6 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-gray-100'
          >
            <div className='rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900'>
              <div className='flex flex-wrap items-center gap-3'>
                <span className='font-semibold'>License ID:</span>
                <span>{urlLicenseId || enteredLicenseId || 'Not provided'}</span>
                <span className='font-semibold'>Renewal ID:</span>
                <span>{renewalId || createdRenewalIdRef.current || 'Pending'}</span>
                {statusMessage && (
                  <span className='ml-auto font-medium text-blue-700'>{statusMessage}</span>
                )}
              </div>
            </div>

            {isLoading && <ApplicationFormSkeleton />}
            {error && (
              <div className='rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700'>
                {error}
              </div>
            )}

            {!isLoading && (
              <>
                <AccordionSection
                  title='Personal Information'
                  id='renewal-section-personal'
                  isOpen={expandedSections.personal}
                  onToggle={() => toggleSection('personal')}
                  showCompletionCheckbox
                  isCompleted={sectionCompleted.personal}
                  onCompletionChange={checked => {
                    if (checked) handleSectionComplete('personal');
                    else setSectionCompleted(prev => ({ ...prev, personal: false }));
                  }}
                  isSavingSection={savingSection === 'personal'}
                  isReadOnly={isReadOnly}
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
                  id='renewal-section-address'
                  isOpen={expandedSections.address}
                  onToggle={() => toggleSection('address')}
                  showCompletionCheckbox
                  isCompleted={sectionCompleted.address}
                  onCompletionChange={checked => {
                    if (checked) handleSectionComplete('address');
                    else setSectionCompleted(prev => ({ ...prev, address: false }));
                  }}
                  isSavingSection={savingSection === 'address'}
                  isReadOnly={isReadOnly}
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
                  id='renewal-section-occupation'
                  isOpen={expandedSections.occupation}
                  onToggle={() => toggleSection('occupation')}
                  showCompletionCheckbox
                  isCompleted={sectionCompleted.occupation}
                  onCompletionChange={checked => {
                    if (checked) handleSectionComplete('occupation');
                    else setSectionCompleted(prev => ({ ...prev, occupation: false }));
                  }}
                  isSavingSection={savingSection === 'occupation'}
                  isReadOnly={isReadOnly}
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
                  id='renewal-section-criminal'
                  isOpen={expandedSections.criminal}
                  onToggle={() => toggleSection('criminal')}
                  showCompletionCheckbox
                  isCompleted={sectionCompleted.criminal}
                  onCompletionChange={checked => {
                    if (checked) handleSectionComplete('criminal');
                    else setSectionCompleted(prev => ({ ...prev, criminal: false }));
                  }}
                  isSavingSection={savingSection === 'criminal'}
                  isReadOnly={isReadOnly}
                >
                  <CriminalHistory
                    ref={criminalSectionRef}
                    formData={formData}
                    onChange={handleChange}
                    errors={criminalErrors}
                  />
                </AccordionSection>

                <AccordionSection
                  title='License Details'
                  id='renewal-section-licenseDetails'
                  isOpen={expandedSections.licenseDetails}
                  onToggle={() => toggleSection('licenseDetails')}
                  showCompletionCheckbox
                  isCompleted={sectionCompleted.licenseDetails}
                  onCompletionChange={checked => {
                    if (checked) handleSectionComplete('licenseDetails');
                    else setSectionCompleted(prev => ({ ...prev, licenseDetails: false }));
                  }}
                  isSavingSection={savingSection === 'licenseDetails'}
                  isReadOnly={isReadOnly}
                >
                  <LicenseDetailsSection
                    formData={formData}
                    renewalId={activeRenewalId}
                    isSyncingPrefilled={isSyncingEvidence}
                    onChange={handleChange}
                    onPatch={patch => setFormData(prev => ({ ...prev, ...patch }))}
                    onError={setError}
                    onStatus={setStatusMessage}
                    errors={licenseDetailsErrors}
                    ref={licenseDetailsSectionRef}
                  />
                </AccordionSection>

                <AccordionSection
                  title='License History'
                  id='renewal-section-licenseHistory'
                  isOpen={expandedSections.licenseHistory}
                  onToggle={() => toggleSection('licenseHistory')}
                  showCompletionCheckbox
                  isCompleted={sectionCompleted.licenseHistory}
                  onCompletionChange={checked => {
                    if (checked) handleSectionComplete('licenseHistory');
                    else setSectionCompleted(prev => ({ ...prev, licenseHistory: false }));
                  }}
                  isSavingSection={savingSection === 'licenseHistory'}
                  isReadOnly={isReadOnly}
                >
                  <LicenseHistory
                    ref={licenseHistorySectionRef}
                    formData={formData}
                    onChange={handleChange}
                    errors={licenseHistoryErrors}
                  />
                </AccordionSection>

                <AccordionSection
                  title='Biometric Information'
                  id='renewal-section-biometric'
                  isOpen={expandedSections.biometric}
                  onToggle={() => toggleSection('biometric')}
                  showCompletionCheckbox
                  isCompleted={sectionCompleted.biometric}
                  onCompletionChange={checked => {
                    if (checked) handleSectionComplete('biometric');
                    else setSectionCompleted(prev => ({ ...prev, biometric: false }));
                  }}
                  isSavingSection={savingSection === 'biometric'}
                  isReadOnly={isReadOnly}
                >
                  <BiometricInformation
                    formData={formData}
                    renewalId={activeRenewalId}
                    onChange={handleChange}
                    onFileChange={handleFileChange}
                    errors={biometricErrors}
                    isReadOnly={isReadOnly}
                    onPrevious={() => {
                      if (renewalId)
                        router.push(
                          `/forms/renewal?licenseId=${encodeURIComponent(resolvedLicenseId)}&renewalId=${encodeURIComponent(renewalId)}#license-details`
                        );
                      else router.back();
                    }}
                    onNext={() => {
                      if (activeRenewalId)
                        router.push(
                          `/forms/renewal?licenseId=${encodeURIComponent(resolvedLicenseId)}&renewalId=${encodeURIComponent(activeRenewalId)}#documents`
                        );
                    }}
                    onSaveToDraft={saveRenewalDraft}
                  />
                </AccordionSection>

                <AccordionSection
                  title='Upload Documents'
                  id='renewal-section-documents'
                  isOpen={expandedSections.documents}
                  onToggle={() => toggleSection('documents')}
                  showCompletionCheckbox
                  isCompleted={sectionCompleted.documents}
                  onCompletionChange={checked => {
                    if (checked) handleSectionComplete('documents');
                    else setSectionCompleted(prev => ({ ...prev, documents: false }));
                  }}
                  isSavingSection={savingSection === 'documents'}
                  isReadOnly={isReadOnly}
                >
                  <DocumentsSection
                    ref={documentsSectionRef}
                    formData={formData}
                    renewalId={activeRenewalId}
                    onPatch={handleFormPatch}
                    onError={setError}
                    onStatus={setStatusMessage}
                    errors={documentsErrors}
                    isReadOnly={isReadOnly}
                    onReload={reloadRenewalData}
                  />
                </AccordionSection>

                <AccordionSection
                  title='Declaration'
                  id='renewal-section-declaration'
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
                {/* Section completion progress */}
                <div className='flex items-center gap-2 text-sm text-gray-600'>
                  <span className='font-medium'>
                    {Object.values(sectionCompleted).filter(Boolean).length} /{' '}
                    {Object.values(sectionCompleted).length} sections completed
                  </span>
                  <div className='flex gap-1'>
                    {Object.entries(sectionCompleted).map(([key, done]) => (
                      <span
                        key={key}
                        title={key}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${
                          done ? 'bg-green-500' : 'bg-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  {allSectionsCompleted && (
                    <span className='ml-1 text-xs font-semibold text-green-600'>
                      ✓ All sections completed
                    </span>
                  )}
                </div>

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
                    onClick={handleRenewalSubmit}
                    disabled={isSaving}
                    className={`rounded-md px-5 py-2 text-sm font-medium text-white transition-all disabled:cursor-not-allowed disabled:opacity-60 ${
                      isReadOnly
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-[#001F54] hover:bg-[#012a73] shadow-sm hover:shadow-md'
                    }`}
                  >
                    {isSaving ? 'Submitting...' : 'Submit'}
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
    <Suspense fallback={<ApplicationFormSkeleton />}>
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
    id?: string;
    showCompletionCheckbox?: boolean;
    isCompleted?: boolean;
    onCompletionChange?: (checked: boolean) => void;
    isSavingSection?: boolean;
    isReadOnly?: boolean;
  }>
) {
  const {
    title,
    isOpen,
    onToggle,
    children,
    id,
    showCompletionCheckbox,
    isCompleted,
    onCompletionChange,
    isSavingSection,
    isReadOnly,
  } = props;

  return (
    <section
      id={id}
      className={`scroll-mt-24 rounded-2xl border bg-white shadow-sm transition-colors duration-200 ${
        showCompletionCheckbox && isCompleted
          ? 'border-green-300 ring-1 ring-green-200'
          : 'border-gray-100'
      }`}
    >
      <div className='flex w-full items-center justify-between px-5 py-4'>
        {/* Toggle button takes most of the header */}
        <button
          type='button'
          onClick={onToggle}
          className='flex flex-1 items-center gap-3 text-left'
          aria-expanded={isOpen}
        >
          {/* Status indicator dot */}
          {showCompletionCheckbox && (
            <span
              className={`flex-shrink-0 w-2.5 h-2.5 rounded-full transition-colors ${
                isCompleted ? 'bg-green-500' : 'bg-gray-300'
              }`}
            />
          )}
          <h3 className='text-lg font-semibold text-gray-900'>{title}</h3>
          {showCompletionCheckbox && isCompleted && (
            <span className='ml-1 text-xs font-semibold text-green-600 bg-green-50 border border-green-200 rounded-full px-2 py-0.5'>
              ✓ Saved
            </span>
          )}
        </button>

        <div className='flex items-center gap-4 flex-shrink-0'>
          {/* Completion checkbox */}
          {showCompletionCheckbox && (
            <label
              className='flex items-center gap-2 cursor-pointer select-none'
              onClick={e => e.stopPropagation()}
              title={
                isCompleted ? 'Section saved — uncheck to revise' : 'Check to save this section'
              }
            >
              <span className='text-xs font-medium text-gray-500 whitespace-nowrap'>
                {isCompleted ? 'Completed' : 'Mark complete'}
              </span>
              <span className='relative'>
                <input
                  type='checkbox'
                  checked={isCompleted ?? false}
                  disabled={isSavingSection || isReadOnly}
                  onChange={e => onCompletionChange?.(e.target.checked)}
                  className='sr-only peer'
                  aria-label={`Mark ${title} as complete`}
                />
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-md border-2 transition-all duration-200 ${
                    isCompleted
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 bg-white hover:border-[#001F54]'
                  } ${
                    isSavingSection || isReadOnly
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  {isCompleted ? (
                    <svg
                      className='w-3.5 h-3.5'
                      viewBox='0 0 12 12'
                      fill='none'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2.5}
                        d='M2 6l3 3 5-5'
                      />
                    </svg>
                  ) : isSavingSection ? (
                    <span className='w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin' />
                  ) : null}
                </span>
              </span>
            </label>
          )}

          {/* Expand / collapse arrow */}
          <button
            type='button'
            onClick={onToggle}
            className='text-sm font-semibold text-[#001F54] w-6 text-center'
            aria-label={isOpen ? 'Collapse section' : 'Expand section'}
          >
            {isOpen ? '▲' : '▼'}
          </button>
        </div>
      </div>

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
