'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '../elements/Input';
import { TextArea } from '../elements/Input';
import { Checkbox } from '../elements/Checkbox';
import { LocationHierarchy } from '../elements/LocationHierarchy';
import FormFooter from '../elements/footer';
import { useRouter, useSearchParams } from 'next/navigation';
import { useRenewalForm } from './RenewalFormContext';
import { getNextRenewalRoute, getPreviousRenewalRoute } from './renewalRoutes';

interface AddressFormData {
  presentAddress: string;
  presentState: string;
  presentDistrict: string;
  presentZone: string;
  presentDivision: string;
  presentPoliceStation: string;
  presentSince: string;
  sameAsPresent: boolean;
  permanentAddress: string;
  permanentState: string;
  permanentDistrict: string;
  permanentZone: string;
  permanentDivision: string;
  permanentPoliceStation: string;
  telephoneOffice: string;
  telephoneResidence: string;
  officeMobileNumber: string;
  alternativeMobile: string;
}

const initialState: AddressFormData = {
  presentAddress: '',
  presentState: '',
  presentDistrict: '',
  presentZone: '',
  presentDivision: '',
  presentPoliceStation: '',
  presentSince: '',
  sameAsPresent: false,
  permanentAddress: '',
  permanentState: '',
  permanentDistrict: '',
  permanentZone: '',
  permanentDivision: '',
  permanentPoliceStation: '',
  telephoneOffice: '',
  telephoneResidence: '',
  officeMobileNumber: '',
  alternativeMobile: '',
};

// Removed mockPrefillAddress. Only real API data will be used.
// Removed leftover mockPrefillAddress object. Only real API data will be used.

const validateAddressInfo = (formData: AddressFormData): string[] => {
  const validationErrors: string[] = [];

  if (!formData.presentAddress?.trim()) {
    validationErrors.push('Present address is required');
  }
  if (!formData.presentState?.trim()) {
    validationErrors.push('Present state is required');
  }
  if (!formData.presentDistrict?.trim()) {
    validationErrors.push('Present district is required');
  }
  if (!formData.permanentAddress?.trim()) {
    validationErrors.push('Permanent address is required');
  }

  return validationErrors;
};

const AddressDetailsRenewal: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicantId = searchParams?.get('id') || searchParams?.get('applicantId');

  const {
    state,
    updateFormData,
    setIsLoading,
    setIsSubmitting,
    setSubmitError,
    setSubmitSuccess,
  } = useRenewalForm();

  const [form, setForm] = useState<AddressFormData>(initialState);

  useEffect(() => {
    const fetchData = async () => {
      if (applicantId) {
        setIsLoading(true);
        setSubmitError(null);
        try {
          // Try to get from context first
          const contextData = state.formData.addressDetails;
          if (contextData && Object.keys(contextData).length > 0) {
            setForm(prev => ({ ...prev, ...contextData }));
            setSubmitSuccess('Address data loaded successfully');
            setTimeout(() => setSubmitSuccess(null), 3000);
          } else {
            // Otherwise, fetch from API
            const { FormDataLoader } = await import('../../../utils/formDataLoader');
            const data = await FormDataLoader.loadAllSections(applicantId);
            if (data.addressDetails) {
              setForm(prev => ({ ...prev, ...data.addressDetails }));
              updateFormData('addressDetails', data.addressDetails);
              setSubmitSuccess('Address data loaded successfully');
              setTimeout(() => setSubmitSuccess(null), 3000);
            }
          }
        } catch (err: any) {
          setSubmitError('Failed to load address data.');
        } finally {
          setIsLoading(false);
        }
      }
    };
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]);
  // Add a Refresh Data button similar to PersonalInformationRenewal
  // Place this button above the form fields, after the step header
  // (You may adjust placement as needed in your UI)


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleLocationChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckbox = (checked: boolean) => {
    setForm(prev => {
      const newForm = { ...prev, sameAsPresent: checked };
      if (checked) {
        newForm.permanentAddress = prev.presentAddress;
        newForm.permanentState = prev.presentState;
        newForm.permanentDistrict = prev.presentDistrict;
        newForm.permanentZone = prev.presentZone;
        newForm.permanentDivision = prev.presentDivision;
        newForm.permanentPoliceStation = prev.presentPoliceStation;
      }
      return newForm;
    });
  };

  const handleSaveToDraft = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      updateFormData('addressDetails', form);
      setSubmitSuccess('Address saved to draft!');
      setTimeout(() => setSubmitSuccess(null), 3000);
    } catch (error) {
      setSubmitError('Failed to save address');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    const errors = validateAddressInfo(form);
    if (errors.length > 0) {
      setSubmitError(errors.join(', '));
      return;
    }

    updateFormData('addressDetails', form);
    const nextRoute = getNextRenewalRoute('/forms/renewal/address-details');
    if (nextRoute) {
      router.push(`${nextRoute}${applicantId ? `?id=${applicantId}` : ''}`);
    }
  };

  const handlePrevious = () => {
    const prevRoute = getPreviousRenewalRoute('/forms/renewal/address-details');
    if (prevRoute) {
      router.push(`${prevRoute}${applicantId ? `?id=${applicantId}` : ''}`);
    }
  };

  if (state.isLoading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Address Details</h2>
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500">Loading...</div>
        </div>
      </div>
    );
  }


  return (
    <form className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Address Details</h2>
        <p className="text-sm text-gray-600">Step 2 of 10 - Renewal Application</p>
      </div>
      {applicantId && (
        <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded flex justify-between items-center">
          <div className="flex flex-col">
            <strong>Application ID: {applicantId}</strong>
          </div>
          <button
            type="button"
            onClick={async () => {
              setIsLoading(true);
              setSubmitError(null);
              try {
                const { FormDataLoader } = await import('../../../utils/formDataLoader');
                const data = await FormDataLoader.loadAllSections(applicantId);
                if (data.addressDetails) {
                  setForm(prev => ({ ...prev, ...data.addressDetails }));
                  updateFormData('addressDetails', data.addressDetails);
                  setSubmitSuccess('Data refreshed');
                  setTimeout(() => setSubmitSuccess(null), 3000);
                }
              } catch (err: any) {
                setSubmitError('Failed to refresh data.');
              } finally {
                setIsLoading(false);
              }
            }}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Data
          </button>
        </div>
      )}

      {state.submitSuccess && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          {state.submitSuccess}
        </div>
      )}
      {state.submitError && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {state.submitError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 mb-2">
        <div className="col-span-2">
          <TextArea
            label="8. Present address"
            name="presentAddress"
            value={form.presentAddress}
            onChange={handleChange}
            placeholder="Enter present address"
            rows={2}
          />
        </div>

        <LocationHierarchy
          namePrefix="present"
          values={{
            state: form.presentState,
            district: form.presentDistrict,
            zone: form.presentZone,
            division: form.presentDivision,
            policeStation: form.presentPoliceStation,
          }}
          onChange={handleLocationChange}
          required={true}
          className="col-span-2"
        />

        <Input
          label="Since when residing at present address"
          name="presentSince"
          type="date"
          value={form.presentSince}
          onChange={handleChange}
        />
      </div>
      <div className="text-xs text-gray-700 mb-2">
        NOTE: Nearest Police Station means the Police Station under whose jurisdiction the place given in the address comes
      </div>
      <Checkbox
        label="Same as present address"
        name="sameAsPresent"
        checked={form.sameAsPresent}
        onChange={handleCheckbox}
        className="mb-2"
      />
      <br />
      <div className="grid grid-cols-2 gap-6 mb-2">
        <div className="col-span-2">
          <TextArea
            label="9. Permanent address"
            name="permanentAddress"
            value={form.permanentAddress}
            onChange={handleChange}
            placeholder="Enter permanent address"
            rows={2}
            disabled={form.sameAsPresent}
          />
        </div>

        <LocationHierarchy
          namePrefix="permanent"
          values={{
            state: form.permanentState,
            district: form.permanentDistrict,
            zone: form.permanentZone,
            division: form.permanentDivision,
            policeStation: form.permanentPoliceStation,
          }}
          onChange={handleLocationChange}
          required={true}
          disabled={form.sameAsPresent}
          className="col-span-2"
        />
      </div>
      <div className="text-xs text-gray-700 mb-4">
        NOTE: Nearest Police Station means the Police Station under whose jurisdiction the place given in the address comes
      </div>
      <div className="bg-blue-50 rounded-lg p-4 grid grid-cols-4 gap-4 mb-2 h-30">
        <Input
          label="Mobile Number\Office"
          name="officeMobileNumber"
          value={form.officeMobileNumber}
          onChange={handleChange}
          placeholder="0000 0000 0000"
        />
        <Input
          label="Residence"
          name="telephoneResidence"
          value={form.telephoneResidence}
          onChange={handleChange}
          placeholder="0000 0000 0000"
        />
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="alternativeMobile">
            Alternative Mobile Number
            <span className="ml-1 text-xs text-gray-400 align-middle">(optional)</span>
          </label>
          <Input
            label=""
            name="alternativeMobile"
            value={form.alternativeMobile}
            onChange={handleChange}
            placeholder="0000 0000 0000"
          />
        </div>
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="telephoneOffice">
            Telephone Number\Office
            <span className="ml-1 text-xs text-gray-400 align-middle">(optional)</span>
          </label>
          <Input
            label=""
            name="telephoneOffice"
            value={form.telephoneOffice}
            onChange={handleChange}
            placeholder="0000 0000 0000"
          />
        </div>
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

export default AddressDetailsRenewal;