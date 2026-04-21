'use client';
import React, { useState, useEffect } from 'react';
import { Input, TextArea } from '../elements/Input';
import { Select } from '../elements/Select';
import FormFooter from '../elements/footer';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRenewalForm } from './RenewalFormContext';
import { getNextRenewalRoute, getPreviousRenewalRoute } from './renewalRoutes';
import { useLocationHierarchy } from '../../../hooks/useLocationHierarchy';

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
  const applicantId = searchParams?.get('id') || searchParams?.get('applicantId');

  const {
    state,
    updateFormData,
    setIsSubmitting,
    setSubmitError,
    setSubmitSuccess,
  } = useRenewalForm();

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
    updateFormData('occupationBusiness', form);
    setSubmitSuccess('Draft saved!');
    setTimeout(() => setSubmitSuccess(null), 3000);
    setIsSubmitting(false);
  };

  const handleNext = () => {
    const errors = validateOccupationInfo(form);
    if (errors.length > 0) {
      setSubmitError(errors.join(', '));
      return;
    }
    updateFormData('occupationBusiness', form);
    const nextRoute = getNextRenewalRoute('/forms/renewal/occupation');
    router.push(`${nextRoute}${applicantId ? `?id=${applicantId}` : ''}`);
  };

  const handlePrevious = () => {
    const prevRoute = getPreviousRenewalRoute('/forms/renewal/occupation');
    router.push(`${prevRoute}${applicantId ? `?id=${applicantId}` : ''}`);
  };


  return (
    <form className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Occupation and Business Details</h2>
        <p className="text-sm text-gray-600">Step 3 of 10 - Renewal Application</p>
      </div>
      {applicantId && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded flex justify-between items-center">
          <div className="flex flex-col">
            <strong>Application ID: {applicantId}</strong>
          </div>
          <button
            type="button"
            onClick={async () => {
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
            }}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>
      )}

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

      <FormFooter
        onSaveToDraft={handleSaveToDraft}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isLoading={state.isSubmitting}
      />
    </form>
  );
};

export default OccupationRenewal;