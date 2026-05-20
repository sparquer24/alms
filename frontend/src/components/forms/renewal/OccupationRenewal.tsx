'use client';
import React, { useState, useEffect } from 'react';
import { Input, TextArea } from '../elements/Input';
import { Select } from '../elements/Select';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRenewalForm } from './RenewalFormContext';
import { getNextRenewalRoute, getPreviousRenewalRoute } from './renewalRoutes';
import { useLocationHierarchy } from '../../../hooks/useLocationHierarchy';
import { patchData } from '../../../api/axiosConfig';

interface OccupationData {
  occupation: string;
  officeAddress: string;
  officeState: string;
  officeDistrict: string;
  cropLocation: string;
  areaUnderCultivation: string;
}

const initialState: OccupationData = {
  occupation: '',
  officeAddress: '',
  officeState: '',
  officeDistrict: '',
  cropLocation: '',
  areaUnderCultivation: '',
};

// Removed mockPrefill. Only real API data will be used.

const validateOccupationInfo = (formData: OccupationData): string[] => {
  const validationErrors: string[] = [];

  if (!formData.occupation?.trim()) {
    validationErrors.push('Occupation is required');
  }
  if (!formData.officeAddress?.trim()) {
    validationErrors.push('Office/Business address is required');
  }

  return validationErrors;
};

const OccupationRenewal: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const {
    state,
    updateFormData,
    setIsSubmitting,
    setSubmitError,
    setSubmitSuccess,
    registerRefresh,
  } = useRenewalForm();

  // Prefer the renewal application id stored in context (created via POST). Fall back to route params.
  const applicantId = state?.applicantId;

  const [form, setForm] = useState<OccupationData>(initialState);

  const [locationState, locationActions] = useLocationHierarchy();

  useEffect(() => {
    const fetchData = async () => {
      if (applicantId) {
        setIsSubmitting(true);
        setSubmitError(null);
        try {
          // Try to get from context first
          const contextData = state.formData.occupationBusiness;
          if (contextData && Object.keys(contextData).length > 0) {
            setForm(prev => ({ ...prev, ...contextData }));
            if (contextData.officeState) locationActions.setSelectedState(contextData.officeState);
            if (contextData.officeDistrict) locationActions.setSelectedDistrict(contextData.officeDistrict);
            setSubmitSuccess('Occupation data loaded');
            setTimeout(() => setSubmitSuccess(null), 3000);
          } else {
            // Otherwise, fetch from API
            const { FormDataLoader } = await import('../../../utils/formDataLoader');
            const data = await FormDataLoader.loadAllSections(applicantId);
            if (data.occupationBusiness) {
              setForm(prev => ({ ...prev, ...data.occupationBusiness }));
              updateFormData('occupationBusiness', data.occupationBusiness);
              if (data.occupationBusiness.officeState) locationActions.setSelectedState(data.occupationBusiness.officeState);
              if (data.occupationBusiness.officeDistrict) locationActions.setSelectedDistrict(data.occupationBusiness.officeDistrict);
              setSubmitSuccess('Occupation data loaded');
              setTimeout(() => setSubmitSuccess(null), 3000);
            }
          }
        } catch (err: any) {
          setSubmitError('Failed to load occupation data.');
        } finally {
          setIsSubmitting(false);
        }
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]);

  const handleRefreshData = async () => {
    if (!applicantId) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const { FormDataLoader } = await import('../../../utils/formDataLoader');
      const data = await FormDataLoader.loadAllSections(applicantId);
      if (data.occupationBusiness) {
        setForm(prev => ({ ...prev, ...data.occupationBusiness }));
        updateFormData('occupationBusiness', data.occupationBusiness);
        if (data.occupationBusiness.officeState) locationActions.setSelectedState(data.occupationBusiness.officeState);
        if (data.occupationBusiness.officeDistrict) locationActions.setSelectedDistrict(data.occupationBusiness.officeDistrict);
        setSubmitSuccess('Data refreshed');
        setTimeout(() => setSubmitSuccess(null), 3000);
      }
    } catch (err: any) {
      setSubmitError('Failed to refresh data.');
    } finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    if (registerRefresh) registerRefresh(handleRefreshData);
    return () => { if (registerRefresh) registerRefresh(null); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]);

  useEffect(() => {
    if (form.officeState && form.officeState !== locationState.selectedState) {
      locationActions.setSelectedState(form.officeState);
    }
  }, [form.officeState]);

  useEffect(() => {
    if (form.officeDistrict && form.officeDistrict !== locationState.selectedDistrict) {
      locationActions.setSelectedDistrict(form.officeDistrict);
    }
  }, [form.officeDistrict]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    locationActions.setSelectedState(value);
    setForm(prev => ({
      ...prev,
      officeState: value,
      officeDistrict: '',
    }));
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    locationActions.setSelectedDistrict(value);
    setForm(prev => ({ ...prev, officeDistrict: value }));
  };

  const handleSaveToDraft = async () => {
    const errors = validateOccupationInfo(form);
    if (errors.length > 0) {
      setSubmitError(errors.join(', '));
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      updateFormData('occupationBusiness', form);

      // If applicationId exists, update via PATCH API
      if (applicantId && Number(applicantId)) {
        const applicationId = Number(applicantId);
        const payload = {
          occupationAndBusiness: {
            occupation: form.occupation,
            officeAddress: form.officeAddress,
            stateId: parseInt(form.officeState) || 1,
            districtId: parseInt(form.officeDistrict) || 1,
            cropLocation: form.cropLocation,
            areaUnderCultivation: form.areaUnderCultivation ? parseFloat(form.areaUnderCultivation) : undefined,
          },
        };

        await patchData(`/renewal-forms/${applicationId}`, payload);
      }

      setSubmitSuccess('Draft saved!');
      setTimeout(() => setSubmitSuccess(null), 3000);
    } catch (error: any) {
      setSubmitError(error?.message || 'Failed to save draft');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    const errors = validateOccupationInfo(form);
    if (errors.length > 0) {
      setSubmitError(errors.join(', '));
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      updateFormData('occupationBusiness', form);

      // If applicationId exists, update via PATCH API
      if (applicantId && Number(applicantId)) {
        const applicationId = Number(applicantId);
        const payload = {
          occupationAndBusiness: {
            occupation: form.occupation,
            officeAddress: form.officeAddress,
            stateId: parseInt(form.officeState) || 1,
            districtId: parseInt(form.officeDistrict) || 1,
            cropLocation: form.cropLocation,
            areaUnderCultivation: form.areaUnderCultivation ? parseFloat(form.areaUnderCultivation) : undefined,
          },
        };

        await patchData(`/renewal-forms/${applicationId}`, payload);
      }

      const nextRoute = getNextRenewalRoute('/forms/renewal/occupation');
      router.push(`${nextRoute}${applicantId ? `?id=${applicantId}` : ''}`);
    } catch (error: any) {
      setSubmitError(error?.message || 'Failed to save and proceed to next step');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrevious = () => {
    const prevRoute = getPreviousRenewalRoute('/forms/renewal/occupation');
    router.push(`${prevRoute}${applicantId ? `?id=${applicantId}` : ''}`);
  };


  return (
    <form className="">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Occupation and Business Details</h2>
      </div>
      {/* Application ID and refresh moved to layout header */}

      {state.submitSuccess && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">{state.submitSuccess}</div>
      )}
      {state.submitError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">{state.submitError}</div>
      )}

      <Input
        label="10. Occupation"
        name="occupation"
        value={form.occupation}
        onChange={handleChange}
        placeholder="Enter occupation"
        className="mb-4"
        required
      />
      <TextArea
        label="11. Office/Business address"
        name="officeAddress"
        value={form.officeAddress}
        onChange={handleChange}
        placeholder="Enter office or business address"
        rows={2}
        className="mb-4"
        required
      />
      <div className="grid grid-cols-2 gap-6 mb-4">
        <Select
          label="State"
          name="officeState"
          value={form.officeState}
          onChange={handleStateChange}
          options={locationActions.getSelectOptions().stateOptions}
          placeholder={locationState.loadingStates ? "Loading states..." : "Select state"}
          disabled={locationState.loadingStates}
        />
        <Select
          label="District"
          name="officeDistrict"
          value={form.officeDistrict}
          onChange={handleDistrictChange}
          options={locationActions.getSelectOptions().districtOptions}
          placeholder={
            locationState.loadingDistricts
              ? "Loading districts..."
              : !form.officeState
              ? "Select state first"
              : "Select district"
          }
          disabled={!form.officeState || locationState.loadingDistricts}
        />
      </div>
      {locationState.error && (
        <div className="mb-4 text-red-500 text-sm">
          Error loading locations: {locationState.error}
        </div>
      )}
      <div className="mb-2 text-sm font-semibold">12. Additional particulars if the licence is required for crop protection under rule 35</div>
      <div className="grid grid-cols-2 gap-6">
        <Input
          label="Location"
          name="cropLocation"
          value={form.cropLocation}
          onChange={handleChange}
          placeholder="Enter location"
        />
        <Input
          label="Area of land under cultivation"
          name="areaUnderCultivation"
          value={form.areaUnderCultivation}
          onChange={handleChange}
          placeholder="Enter area (in acres)"
        />
      </div>

    </form>
  );
};

export default OccupationRenewal;