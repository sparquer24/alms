'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-toastify';
import { ApplicationService } from '../api/applicationService';
import { RenewalService } from '../api/renewalService';

export type RenewalFormState = {
  renewalApplicationId: string;
  licenseId: string | number;
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

export const initialRenewalFormState: RenewalFormState = {
  renewalApplicationId: '',
  licenseId: '',
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

export function extractPrefillFromApplicationAndLicense(lic: any, appData: any = {}) {
  const applicantName =
    appData?.firstName ||
    lic?.applicantName ||
    appData?.applicantName ||
    '';

  const fatherName = lic?.fatherName || appData?.fatherName || appData?.parentOrSpouseName || '';
  const applicantGender = lic?.applicantGender || lic?.gender || appData?.applicantGender || appData?.sex || '';
  const applicantMobile =
    lic?.applicantMobile ||
    lic?.mobile ||
    appData?.applicantMobile ||
    appData?.mobile ||
    appData?.presentAddress?.officeMobileNumber ||
    '';
  const applicantEmail = lic?.applicantEmail || lic?.email || appData?.applicantEmail || appData?.email || '';

  const presentAddrObj = appData?.presentAddress || {};
  const presentAddress =
    lic?.presentAddress ||
    (typeof presentAddrObj === 'string' ? presentAddrObj : presentAddrObj?.addressLine || '');

  const permanentAddrObj = appData?.permanentAddress || {};
  const permanentAddress =
    lic?.permanentAddress ||
    (typeof permanentAddrObj === 'string' ? permanentAddrObj : permanentAddrObj?.addressLine || '');

  const occObj = appData?.occupationAndBusiness || {};
  const occupation = lic?.occupation || occObj?.occupation || appData?.occupation || '';
  const officeBusinessAddress = lic?.officeBusinessAddress || occObj?.officeAddress || appData?.officeBusinessAddress || '';

  const aadharNumber = lic?.aadharNumber || appData?.aadharNumber || '';
  const panNumber = lic?.panNumber || appData?.panNumber || '';

  let applicantDateOfBirth = lic?.applicantDateOfBirth || appData?.applicantDateOfBirth || appData?.dateOfBirth || '';
  if (applicantDateOfBirth && applicantDateOfBirth.includes('T')) {
    applicantDateOfBirth = applicantDateOfBirth.split('T')[0];
  }

  const placeOfBirth = lic?.placeOfBirth || appData?.placeOfBirth || '';
  const dobInWords = lic?.dobInWords || appData?.dobInWords || '';

  return {
    applicantName,
    applicantMiddleName: appData?.middleName || lic?.applicantMiddleName || '',
    applicantLastName: appData?.lastName || lic?.applicantLastName || '',
    fatherName,
    applicantGender,
    applicantMobile,
    applicantEmail,
    presentAddress,
    presentState: presentAddrObj.stateId ? String(presentAddrObj.stateId) : lic?.presentState || '',
    presentDistrict: presentAddrObj.districtId ? String(presentAddrObj.districtId) : lic?.presentDistrict || '',
    presentRangeOffice: presentAddrObj.rangeOfficeId ? String(presentAddrObj.rangeOfficeId) : lic?.presentRangeOffice || '',
    presentZone: presentAddrObj.zoneId ? String(presentAddrObj.zoneId) : lic?.presentZone || '',
    presentDivision: presentAddrObj.divisionId ? String(presentAddrObj.divisionId) : lic?.presentDivision || '',
    presentPoliceStation: presentAddrObj.policeStationId ? String(presentAddrObj.policeStationId) : lic?.presentPoliceStation || '',
    presentStateName: presentAddrObj.state?.name || lic?.presentStateName || '',
    presentDistrictName: presentAddrObj.district?.name || lic?.presentDistrictName || '',
    presentRangeOfficeName: presentAddrObj.RangeOffices?.name || lic?.presentRangeOfficeName || '',
    presentZoneName: presentAddrObj.zone?.name || lic?.presentZoneName || '',
    presentDivisionName: presentAddrObj.division?.name || lic?.presentDivisionName || '',
    presentPoliceStationName: presentAddrObj.policeStation?.name || lic?.presentPoliceStationName || '',
    residingSince: presentAddrObj.sinceResiding ? presentAddrObj.sinceResiding.split('T')[0] : lic?.residingSince || '',
    officeMobile: presentAddrObj.officeMobileNumber || lic?.officeMobile || '',
    permanentAddress,
    permanentState: permanentAddrObj.stateId ? String(permanentAddrObj.stateId) : lic?.permanentState || '',
    permanentDistrict: permanentAddrObj.districtId ? String(permanentAddrObj.districtId) : lic?.permanentDistrict || '',
    permanentRangeOffice: permanentAddrObj.rangeOfficeId ? String(permanentAddrObj.rangeOfficeId) : lic?.permanentRangeOffice || '',
    permanentZone: permanentAddrObj.zoneId ? String(permanentAddrObj.zoneId) : lic?.permanentZone || '',
    permanentDivision: permanentAddrObj.divisionId ? String(permanentAddrObj.divisionId) : lic?.permanentDivision || '',
    permanentPoliceStation: permanentAddrObj.policeStationId ? String(permanentAddrObj.policeStationId) : lic?.permanentPoliceStation || '',
    permanentStateName: permanentAddrObj.state?.name || lic?.permanentStateName || '',
    permanentDistrictName: permanentAddrObj.district?.name || lic?.permanentDistrictName || '',
    occupation,
    officeBusinessAddress,
    officeBusinessState: occObj.stateId ? String(occObj.stateId) : lic?.officeBusinessState || '',
    officeBusinessDistrict: occObj.districtId ? String(occObj.districtId) : lic?.officeBusinessDistrict || '',
    officeBusinessStateName: occObj.state?.name || lic?.officeBusinessStateName || '',
    officeBusinessDistrictName: occObj.district?.name || lic?.officeBusinessDistrictName || '',
    cropProtectionLocation: occObj.cropLocation || lic?.cropProtectionLocation || '',
    cultivatedArea: occObj.areaUnderCultivation ? String(occObj.areaUnderCultivation) : lic?.cultivatedArea || '',
    aadharNumber,
    panNumber,
    applicantDateOfBirth,
    placeOfBirth,
    dobInWords,
    filledBy: appData?.filledBy || lic?.filledBy || '',
  };
}

export function useRenewalApplicationForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const licenseId = searchParams?.get('licenseId') || '';
  const renewalId = searchParams?.get('renewalId') || searchParams?.get('id') || '';

  const [formData, setFormData] = useState<RenewalFormState>(initialRenewalFormState);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasInitializedRef = useRef(false);

  const patchFormData = useCallback((patch: Partial<RenewalFormState>) => {
    setFormData((prev) => ({ ...prev, ...patch }));
  }, []);

  useEffect(() => {
    if (hasInitializedRef.current) return;

    const initRenewalForm = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let lic: any = null;
        let appData: any = {};
        const effectiveLicenseId = licenseId;

        // 1. Fetch license and fresh application background data whenever licenseId is available (or find by renewal)
        if (effectiveLicenseId) {
          try {
            const licenseResp = await ApplicationService.getLicense(effectiveLicenseId);
            lic = licenseResp?.data || licenseResp;
            
            const lastModifiedAppType = String(lic?.lastModifiedAppType || '').toUpperCase();
            const freshAppId = lic?.freshApplicationId || (lastModifiedAppType === 'FRESH' ? lic?.lastModifiedAppId : null);

            if (freshAppId) {
              const appResp = await ApplicationService.getApplication(String(freshAppId));
              appData = appResp?.data || appResp || {};
            }
          } catch (lErr) {
            console.warn('Could not fetch license data for prefill:', lErr);
          }
        }

        const prefilledBase = extractPrefillFromApplicationAndLicense(lic, appData);
        const licenseNo = lic?.licenseNumber || lic?.licenseNo || '';

        // 2. If renewalId exists in URL, load renewal draft and merge on top of prefilledBase
        if (renewalId) {
          try {
            const resp = await RenewalService.getRenewalForm(renewalId);
            const draftData = resp?.data || resp || {};
            
            // If lic was not loaded yet, load it using draftData.licenseId
            if (!lic && draftData.licenseId) {
              try {
                const licenseResp = await ApplicationService.getLicense(String(draftData.licenseId));
                lic = licenseResp?.data || licenseResp;
                const freshAppId = lic?.freshApplicationId;
                if (freshAppId) {
                  const appResp = await ApplicationService.getApplication(String(freshAppId));
                  appData = appResp?.data || appResp || {};
                }
              } catch (e) { /* ignore */ }
            }

            const freshPrefill = extractPrefillFromApplicationAndLicense(lic, appData);

            setFormData((prev) => ({
              ...prev,
              ...freshPrefill,
              ...draftData,
              applicantName: draftData?.applicantName || freshPrefill.applicantName,
              fatherName: draftData?.fatherName || freshPrefill.fatherName,
              applicantGender: draftData?.applicantGender || freshPrefill.applicantGender,
              applicantMobile: draftData?.applicantMobile || freshPrefill.applicantMobile,
              applicantEmail: draftData?.applicantEmail || freshPrefill.applicantEmail,
              presentAddress: draftData?.presentAddress || freshPrefill.presentAddress,
              permanentAddress: draftData?.permanentAddress || freshPrefill.permanentAddress,
              occupation: draftData?.occupation || freshPrefill.occupation,
              officeBusinessAddress: draftData?.officeBusinessAddress || freshPrefill.officeBusinessAddress,
              aadharNumber: draftData?.aadharNumber || freshPrefill.aadharNumber,
              panNumber: draftData?.panNumber || freshPrefill.panNumber,
              applicantDateOfBirth: draftData?.applicantDateOfBirth || freshPrefill.applicantDateOfBirth,
              placeOfBirth: draftData?.placeOfBirth || freshPrefill.placeOfBirth,
              renewalApplicationId: String(draftData?.id || renewalId),
              licenseId: draftData?.licenseId || lic?.licenseId || lic?.id || licenseId,
              licenseNumber: draftData?.licenseNumber || licenseNo,
            }));
          } catch (rErr) {
            console.warn('Failed to load renewal form by renewalId:', rErr);
          }
        } else if (effectiveLicenseId && lic) {
          // 3. If no renewalId in URL yet, check existing draft or create new draft
          const existingDraft = await RenewalService.findRenewalByLicenseNumber(licenseNo);
          if (existingDraft && existingDraft.id) {
            const draftId = String(existingDraft.id);
            setFormData((prev) => ({
              ...prev,
              ...prefilledBase,
              ...existingDraft,
              applicantName: existingDraft.applicantName || prefilledBase.applicantName,
              fatherName: existingDraft.fatherName || prefilledBase.fatherName,
              applicantGender: existingDraft.applicantGender || prefilledBase.applicantGender,
              applicantMobile: existingDraft.applicantMobile || prefilledBase.applicantMobile,
              applicantEmail: existingDraft.applicantEmail || prefilledBase.applicantEmail,
              presentAddress: existingDraft.presentAddress || prefilledBase.presentAddress,
              permanentAddress: existingDraft.permanentAddress || prefilledBase.permanentAddress,
              renewalApplicationId: draftId,
              licenseId: lic.licenseId || lic.id || effectiveLicenseId,
              licenseNumber: licenseNo,
            }));
            router.replace(
              `/forms/renewal/personal-information?licenseId=${encodeURIComponent(
                effectiveLicenseId
              )}&renewalId=${encodeURIComponent(draftId)}`
            );
          } else {
            const payload = {
              licenseId: lic.licenseId || lic.id || effectiveLicenseId,
              licenseNumber: licenseNo,
              ...prefilledBase,
              licenseValidity: lic.licenseValidity || appData.licenseValidity || '',
              licenseType: lic.licenseType || appData.licenseType || '',
            };
            try {
              const createResp = await RenewalService.createRenewalForm(payload);
              const created = createResp?.data || createResp;
              const newId = String(created?.id || created?.renewalApplicationId || '');
              if (newId) {
                setFormData((prev) => ({
                  ...prev,
                  ...prefilledBase,
                  ...created,
                  renewalApplicationId: newId,
                  licenseId: lic.licenseId || lic.id || effectiveLicenseId,
                  licenseNumber: licenseNo,
                }));
                router.replace(
                  `/forms/renewal/personal-information?licenseId=${encodeURIComponent(
                    effectiveLicenseId
                  )}&renewalId=${encodeURIComponent(newId)}`
                );
              }
            } catch (createErr: any) {
              if (createErr?.status === 409 && licenseNo) {
                const draft = await RenewalService.findRenewalByLicenseNumber(licenseNo);
                if (draft && draft.id) {
                  const draftId = String(draft.id);
                  setFormData((prev) => ({
                    ...prev,
                    ...prefilledBase,
                    ...draft,
                    applicantName: draft.applicantName || prefilledBase.applicantName,
                    fatherName: draft.fatherName || prefilledBase.fatherName,
                    applicantGender: draft.applicantGender || prefilledBase.applicantGender,
                    applicantMobile: draft.applicantMobile || prefilledBase.applicantMobile,
                    applicantEmail: draft.applicantEmail || prefilledBase.applicantEmail,
                    presentAddress: draft.presentAddress || prefilledBase.presentAddress,
                    permanentAddress: draft.permanentAddress || prefilledBase.permanentAddress,
                    renewalApplicationId: draftId,
                    licenseId: lic.licenseId || lic.id || effectiveLicenseId,
                    licenseNumber: licenseNo,
                  }));
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to initialize renewal application form:', err);
        setError(err.message || 'Failed to initialize renewal application');
      } finally {
        setIsLoading(false);
        hasInitializedRef.current = true;
      }
    };

    initRenewalForm();
  }, [licenseId, renewalId, router]);

  const saveStep = useCallback(
    async (partialData?: Partial<RenewalFormState>, options?: { isSubmit?: boolean }) => {
      const currentRenewalId = formData.renewalApplicationId || renewalId;
      if (!currentRenewalId) return;

      setIsSaving(true);
      try {
        const payloadToSave = { ...formData, ...(partialData || {}) };
        await RenewalService.updateRenewalForm(currentRenewalId, payloadToSave, options);
        if (partialData) {
          patchFormData(partialData);
        }
      } catch (err: any) {
        console.error('Failed to save renewal step:', err);
        toast.error('Failed to save changes. Please try again.');
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [formData, renewalId, patchFormData]
  );

  return {
    formData,
    setFormData,
    patchFormData,
    isLoading,
    isSaving,
    error,
    saveStep,
    licenseId,
    renewalId: formData.renewalApplicationId || renewalId,
  };
}
