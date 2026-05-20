'use client';
import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Frown } from 'lucide-react';
import { Checkbox } from '../elements/Checkbox';
import RenewalFooter from '../elements/footer';
import SuccessModal from '../../modals/SuccessModal';
import { patchData, postData } from '../../../api/axiosConfig';
import { useRenewalForm } from './RenewalFormContext';

const FrownFixed = Frown as any;

const initialState = {
  declareTrue: false,
  declareFalseInfo: false,
  declareTerms: false,
};

const getLicenseDetail = (raw: any) => {
  if (!raw) return {};
  if (Array.isArray(raw)) return raw[0] || {};
  if (Array.isArray(raw.licenseDetails)) return raw.licenseDetails[0] || {};
  return raw;
};

const buildSubmitPayload = (args: {
  applicationId: number | null;
  personal: Record<string, any>;
  addressCtx: Record<string, any>;
  occupationCtx: Record<string, any>;
  licenseDetail: Record<string, any>;
  form: typeof initialState;
}) => {
  const { applicationId, personal, addressCtx, occupationCtx, licenseDetail, form } = args;

  return {
    applicationId,
    personalDetails: {
      firstName: personal.firstName ?? '',
      middleName: personal.middleName ?? '',
      lastName: personal.lastName ?? '',
      parentOrSpouseName: personal.parentOrSpouseName ?? '',
      sex: personal.sex ?? '',
      dateOfBirth: personal.dateOfBirth ?? null,
      dobInWords: personal.dobInWords ?? '',
      panNumber: personal.panNumber ?? '',
      aadharNumber: personal.aadharNumber ?? '',
    },
    addressDetails: {
      addressLine: addressCtx.addressLine || addressCtx.presentAddress?.addressLine || '',
      stateId: addressCtx.presentState || addressCtx.presentAddress?.stateId || addressCtx.stateId || null,
      districtId: addressCtx.presentDistrict || addressCtx.presentAddress?.districtId || addressCtx.districtId || null,
      policeStationId: addressCtx.presentPoliceStation || addressCtx.presentAddress?.policeStationId || null,
      zoneId: addressCtx.presentZone || addressCtx.presentAddress?.zoneId || null,
      divisionId: addressCtx.presentDivision || addressCtx.presentAddress?.divisionId || null,
      sinceResiding: addressCtx.presentSince || addressCtx.presentAddress?.sinceResiding || null,
      telephoneOffice: addressCtx.telephoneOffice || addressCtx.presentAddress?.telephoneOffice || '',
      telephoneResidence: addressCtx.telephoneResidence || addressCtx.presentAddress?.telephoneResidence || '',
      officeMobileNumber: addressCtx.officeMobileNumber || addressCtx.presentAddress?.officeMobileNumber || '',
      alternativeMobile: addressCtx.alternativeMobile || addressCtx.presentAddress?.alternativeMobile || '',
    },
    occupationAndBusiness: {
      occupation: occupationCtx.occupation || '',
      officeAddress: occupationCtx.officeAddress || '',
      stateId: occupationCtx.officeState || occupationCtx.stateId || null,
      districtId: occupationCtx.officeDistrict || occupationCtx.districtId || null,
      cropLocation: occupationCtx.cropLocation || '',
      areaUnderCultivation: occupationCtx.areaUnderCultivation || null,
    },
    licenseDetails: {
      needForLicense: licenseDetail.needForLicense || '',
      armsCategory: licenseDetail.armsCategory || '',
      areaOfValidity: licenseDetail.areaOfValidity || '',
      ammunitionDescription: licenseDetail.ammunitionDescription || '',
      specialConsiderationReason: licenseDetail.specialConsiderationReason || '',
      licencePlaceArea: licenseDetail.licencePlaceArea || '',
      requestedWeaponIds: licenseDetail.requestedWeaponIds || (licenseDetail.requestedWeapons ? licenseDetail.requestedWeapons.map((w: any) => w.id) : []),
    },
    acceptanceFlags: {
      isDeclarationAccepted: form.declareTrue,
      isAwareOfLegalConsequences: form.declareFalseInfo,
      isTermsAccepted: form.declareTerms,
    },
    isSubmit: true,
  };
};

const buildCreatePayload = (args: {
  applicationId: number | null;
  licenseNumber: string;
  idToUse: string | null;
  personal: Record<string, any>;
}) => {
  const { applicationId, licenseNumber, idToUse, personal } = args;
  return {
    applicationId,
    licenseNumber: licenseNumber || undefined,
    acknowledgementNo: idToUse,
    firstName: personal.firstName || '',
    middleName: personal.middleName || '',
    lastName: personal.lastName || '',
    parentOrSpouseName: personal.parentOrSpouseName || '',
    sex: personal.sex || '',
    dateOfBirth: personal.dateOfBirth || null,
    dobInWords: personal.dobInWords || '',
    panNumber: personal.panNumber || '',
    aadharNumber: personal.aadharNumber || '',
    filledBy: personal.filledBy || '',
  };
};

const getRenewalMatches = (searchResult: any) => {
  if (Array.isArray(searchResult?.data)) return searchResult.data;
  if (Array.isArray(searchResult)) return searchResult;
  return [];
};

const submitRenewalApplication = async (args: {
  state: any;
  form: typeof initialState;
  idToUse: string;
  setIsSubmitting: (value: boolean) => void;
  setError: (value: string | null) => void;
  setShowSuccessModal: (value: boolean) => void;
  setAlmsLicenseId: (value: string | null) => void;
  setApplicantId: (value: string | null) => void;
}) => {
  const {
    state,
    form,
    idToUse,
    setIsSubmitting,
    setError,
    setShowSuccessModal,
    setAlmsLicenseId,
    setApplicantId,
  } = args;

  setIsSubmitting(true);
  setError(null);

  try {
    const personal = state.formData.personalInformation || {};
    const addressCtx = state.formData.addressDetails || {};
    const occupationCtx = state.formData.occupationBusiness || {};
    const licenseDetail = getLicenseDetail(state.formData.licenseDetails);
    const applicationId = Number(idToUse) || null;
    const payload = buildSubmitPayload({ applicationId, personal, addressCtx, occupationCtx, licenseDetail, form });
    const licenseNumber = state.almsLicenseId || personal.licenseNumber || '';

    // Follow create-first flow: prefer renewal id from context; if absent, create via POST and then PATCH
    const renewalIdFromState = state?.applicantId ? Number(state.applicantId) : null;

    const createPayload = buildCreatePayload({ applicationId, licenseNumber, idToUse, personal });

    if (renewalIdFromState) {
      // We already have a renewal application id (created earlier) — use it for PATCH
      const payloadWithApp = { ...payload, applicationId: applicationId ?? null };
      await patchData(`/renewal-forms/${renewalIdFromState}?isSubmit=true`, payloadWithApp);
    } else {
      // Create a renewal record first
      const createResp: any = await postData('/renewal-forms', createPayload);
      const createdId = createResp?.applicationId || createResp?.id || createResp?.data?.id || createResp?.renewalId || createResp?.applicationId || null;
      if (!createdId) throw new Error('Renewal record was created but no id was returned by the API');

      setAlmsLicenseId(String(createdId));
      setApplicantId(String(createdId));
      await patchData(`/renewal-forms/${createdId}?isSubmit=true`, { ...payload, applicationId: null });
    }

    setShowSuccessModal(true);
  } finally {
    setIsSubmitting(false);
  }
};

const DeclarationRenewal = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, setAlmsLicenseId, setApplicantId } = useRenewalForm();
  const [form, setForm] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const applicantId = state.applicantId;
  const acknowledgementNo = searchParams?.get('acknowledgementNo');

  const handleCheck = (name: string, checked: boolean) => {
    setForm(prev => ({ ...prev, [name]: checked }));
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!form.declareTrue) {
      setError('Please confirm that you declare the information to be true and correct.');
      return false;
    }
    if (!form.declareFalseInfo) {
      setError('Please confirm that you are aware of legal consequences.');
      return false;
    }
    if (!form.declareTerms) {
      setError('Please agree to the terms and conditions.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const idToUse = applicantId || acknowledgementNo;
    if (!idToUse) {
      setError('Application ID not found. Please complete previous steps first.');
      return;
    }

    try {
      await submitRenewalApplication({
        state,
        form,
        idToUse,
        setIsSubmitting,
        setError,
        setShowSuccessModal,
        setAlmsLicenseId,
        setApplicantId,
      });
    } catch (err: any) {
      setError(err?.message || 'Failed to submit application. Please try again.');
    }
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
  };

  const handleNavigateHome = () => {
    setShowSuccessModal(false);
    router.push('/inbox?type=renewal');
  };

  return (
    <div className='bg-white'>
      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <div className='mb-6 text-center'>
          <h2 className='text-2xl font-semibold text-gray-900'>Declaration & Submit</h2>
          <div className='mt-2 h-1 w-20 rounded-full bg-blue-600 mx-auto' />
        </div>
        <form onSubmit={e => e.preventDefault()}>
          {error && (
            <div className='mb-4 p-4 bg-red-50 border border-red-200 rounded-md max-w-lg mx-0'>
              <div className='flex items-start'>
                <FrownFixed className='h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5' />
                <p className='text-sm text-red-800'>{error}</p>
              </div>
            </div>
          )}

          <div className='mb-8 max-w-3xl mx-0'>
            <div className='bg-white p-6'>
              <div className='text-lg font-medium text-gray-900 mb-4 text-left'>
                Please check all boxes to proceed:
              </div>
              <div className='flex flex-col gap-4'>
                <Checkbox
                  label='I hereby declare that the information provided above is true and correct to the best of my knowledge and belief.'
                  name='declareTrue'
                  checked={form.declareTrue}
                  onChange={checked => handleCheck('declareTrue', checked)}
                />
                <Checkbox
                  label='I understand that providing false information may result in legal consequences and rejection of my application.'
                  name='declareFalseInfo'
                  checked={form.declareFalseInfo}
                  onChange={checked => handleCheck('declareFalseInfo', checked)}
                />
                <Checkbox
                  label='I agree to abide by all terms and conditions related to the arms license renewal and will use the weapon responsibly.'
                  name='declareTerms'
                  checked={form.declareTerms}
                  onChange={checked => handleCheck('declareTerms', checked)}
                />
              </div>
            </div>
          </div>

          <RenewalFooter
            isDeclarationStep
            hidePrevious
            onSubmit={handleSubmit}
            isLoading={isSubmitting}
          />
        </form>
      </div>

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={handleCloseSuccessModal}
        title='Renewal Application Submitted Successfully!'
        onNavigateHome={handleNavigateHome}
        autoRedirectSeconds={5}
        hideCloseButton={true}
      />
    </div>
  );
};

export default DeclarationRenewal;