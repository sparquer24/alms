'use client';
import React, { useEffect } from 'react';
import { IoMdHome } from 'react-icons/io';
import { useRouter, useSearchParams } from 'next/navigation';

import { ApplicationService } from '../../../api/applicationService';
import { postData } from '../../../api/axiosConfig';

import PersonalInformationRenewal from '../../../components/forms/renewal/PersonalInformationRenewal';
import AddressDetailsRenewal from '../../../components/forms/renewal/AddressDetailsRenewal';
import OccupationRenewal from '../../../components/forms/renewal/OccupationRenewal';
import CriminalHistoryRenewal from '../../../components/forms/renewal/CriminalHistoryRenewal';
import LicenseHistoryRenewal from '../../../components/forms/renewal/LicenseHistoryRenewal';
import LicenseDetailsRenewal from '../../../components/forms/renewal/LicenseDetailsRenewal';
import BiometricInformationRenewal from '../../../components/forms/renewal/BiometricInformationRenewal';
import DocumentsUploadRenewal from '../../../components/forms/renewal/DocumentsUploadRenewal';
import DeclarationRenewal from '../../../components/forms/renewal/DeclarationRenewal';
import { RenewalFormProvider, useRenewalForm } from '../../../components/forms/renewal/RenewalFormContext';
import RenewalFormLayout from '../../../components/forms/renewal/RenewalFormLayout';
import { FormDataLoader } from '../../../utils/formDataLoader';

const RenewalPage: React.FC = () => {
  return (
    <RenewalFormProvider>
      <RenewalFormContent />
    </RenewalFormProvider>
  );
};

const RenewalFormContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, setApplicantId, setAlmsLicenseId } = useRenewalForm();
  const { updateFormData, setIsLoading, setSubmitSuccess, setSubmitError } = useRenewalForm();

  const handleGoHome = () => {
    router.push('/inbox?type=renewal');
  };

  // `sourceApplicationId` is the original (fresh) application id passed in the route.
  // We will create a separate renewal application via POST and store its id in context `state.applicantId`.
  const sourceApplicationId = searchParams?.get('id') || searchParams?.get('applicationId') || '';
  const applicationId = state.applicantId || '';
  const licenseId = state.almsLicenseId || '';

  useEffect(() => {
    const loadApplicationMeta = async () => {
      // If we already have a renewal application id in context, use it.
      if (applicationId) {
        setApplicantId(applicationId);
        return;
      }

      // If there's a source application id (fresh application), fetch its data and create a renewal record.
      if (!sourceApplicationId) return;

      try {
        const resp = await ApplicationService.getApplication(sourceApplicationId);
        const data = resp?.data || resp;

        // Extract personal section suitable for renewal creation
        const personal = ApplicationService.extractSectionData(data, 'personal') || {};

        // Try to include licenseNumber if available on the source application
        const licenseNumber = data?.licenseNumber || data?.almsLicenseId || data?.licenseId || undefined;

        const createPayload: any = {
          ...personal,
        };
        if (licenseNumber) createPayload.licenseNumber = licenseNumber;

        // Create renewal record via POST - this will return a new renewal application id
        const createResp: any = await postData('/renewal-forms', createPayload);
        const createdId = createResp?.applicationId || createResp?.id || createResp?.data?.id || createResp?.renewalId || createResp?.application_id || null;
        if (createdId) {
          const renewalId = String(createdId);
          setApplicantId(renewalId);

          // Replace the route id so the renewal page uses the renewal application id everywhere.
          const nextUrl = new URL(globalThis.location.href);
          nextUrl.searchParams.set('id', renewalId);
          nextUrl.searchParams.delete('applicationId');
          router.replace(nextUrl.pathname + nextUrl.search);

          // Load license id if present
          const resolvedLicenseId = createResp?.almsLicenseId || createResp?.licenseNumber || data?.almsLicenseId || null;
          if (resolvedLicenseId) setAlmsLicenseId(String(resolvedLicenseId));
        }
      } catch (error) {
        console.warn('Failed to create renewal form from source application', error);
      }
    };

    void loadApplicationMeta();
  }, [applicationId, router, setApplicantId, setAlmsLicenseId, sourceApplicationId]);

  useEffect(() => {
    const loadAllSections = async () => {
      // use `applicationId` from context which should be the renewal application id
      if (!applicationId) return;
      try {
        setIsLoading(true);
        const data = await FormDataLoader.loadAllSections(applicationId);
        // Populate context for all sections so individual components can read from context
        if (data.personalInformation) updateFormData('personalInformation', data.personalInformation);
        if (data.addressDetails) updateFormData('addressDetails', data.addressDetails);
        if (data.occupationBusiness) updateFormData('occupationBusiness', data.occupationBusiness);
        if (data.criminalHistory) updateFormData('criminalHistory', data.criminalHistory);
        if (data.licenseDetails) {
          updateFormData('licenseDetails', data.licenseDetails);
          console.debug('[RenewalPage] loaded licenseDetails:', data.licenseDetails);
        }
        if (data.licenseHistory) updateFormData('licenseHistory', data.licenseHistory);
        if (data.documentsUpload) updateFormData('documentsUpload', data.documentsUpload);
        setSubmitSuccess('All sections prefilled from existing data');
        setTimeout(() => setSubmitSuccess(null), 2500);
      } catch {
        setSubmitError('Failed to prefill all sections');
      } finally {
        setIsLoading(false);
      }
    };

    void loadAllSections();
  }, [applicationId, updateFormData, setIsLoading, setSubmitSuccess, setSubmitError]);

  return (
    <div
      className="relative min-h-screen overflow-auto"
      style={{
        backgroundImage: 'url(/backgroundIMGALMS.jpeg)',
        backgroundSize: 'cover',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
      }}
    >
      <div className="fixed top-4 left-6 z-50">
        <button
          onClick={handleGoHome}
          className="flex items-center justify-center w-12 h-12 bg-white hover:bg-gray-50 rounded-full shadow-lg border-2 border-blue-500 transition-all duration-200 hover:scale-105"
          title="Go to Home"
        >
          <IoMdHome className="text-2xl text-[#0d2977]" />
        </button>
      </div>

      <div className="flex justify-center px-2 sm:px-6 pt-12 pb-8 h-full">
        <div className="w-full max-w-[1400px]">
          <div className="mb-4 px-6 py-2 text-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 tracking-wide uppercase mx-auto">
              Renewal Application Form
            </h1>
          </div>
          <RenewalFormLayout title="Renewal Application Form">
            <div className="px-6 py-4 border-b border-blue-100 bg-blue-50/70">
              <div className="flex flex-wrap gap-3 items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">Application ID</p>
                  <p className="text-xl font-bold text-blue-900">{applicationId || 'Loading...'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">License ID</p>
                  <p className="text-xl font-bold text-blue-900">{licenseId || 'Loading...'}</p>
                </div>
              </div>
            </div>

            <div className="space-y-8 px-6 py-4">
              <PersonalInformationRenewal />
              <AddressDetailsRenewal />
              <OccupationRenewal />
              <CriminalHistoryRenewal />
              <LicenseHistoryRenewal />
              <LicenseDetailsRenewal />
              <BiometricInformationRenewal />
              <DocumentsUploadRenewal />
              <DeclarationRenewal />
            </div>
          </RenewalFormLayout>
        </div>
      </div>
    </div>
  );
};

export default RenewalPage;
