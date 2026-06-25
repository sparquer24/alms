import React, { useEffect, forwardRef, useImperativeHandle } from 'react';
import { Input, TextArea } from '../../elements/Input';
import { Select } from '../../elements/Select';
import { useLocationHierarchy } from '../../../../hooks/useLocationHierarchy';

type ErrorsMap = Record<string, string | undefined>;

const OccupationSection = forwardRef(function OccupationSection(
  props: { formData: any; onChange: (e: any) => void; errors?: ErrorsMap },
  ref,
) {
  const { formData, onChange, errors = {} } = props;

  // Location hierarchy for state and district
  const [locationState, locationActions] = useLocationHierarchy({ isRenewal: true });

  // Sync location state with form values (only when data is loaded from backend)
  useEffect(() => {
    if (!formData.officeBusinessState) return;

    const values = {
      state: formData.officeBusinessState,
      district: formData.officeBusinessDistrict || '',
      zone: '',
      division: '',
      policeStation: '',
      stateName: formData.officeBusinessStateName,
      districtName: formData.officeBusinessDistrictName,
    };

    // Only sync if the selected state/district is different from location state
    const isOutOfSync = 
      formData.officeBusinessState !== locationState.selectedState ||
      formData.officeBusinessDistrict !== locationState.selectedDistrict;

    if (isOutOfSync) {
      locationActions.hydrateFromValues(values);
    }
  }, [
    formData.officeBusinessState,
    formData.officeBusinessDistrict,
    locationState.selectedState,
    locationState.selectedDistrict,
    formData.officeBusinessStateName,
    formData.officeBusinessDistrictName
  ]);

  useImperativeHandle(ref, () => ({
    focusFirstInvalid: () => {
      const firstKey = Object.keys(errors).find(k => !!errors[k]);
      if (firstKey) {
        const el = document.getElementById(firstKey);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          try { (el as HTMLElement).focus(); } catch { /* ignore */ }
        }
      }
    },
  }));

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const label = locationActions.getSelectOptions().stateOptions.find((option) => option.value === value)?.label || '';
    locationActions.setSelectedState(value);
    onChange({ target: { name: 'officeBusinessState', value } });
    onChange({ target: { name: 'officeBusinessStateName', value: label } });
    onChange({ target: { name: 'officeBusinessDistrict', value: '' } });
    onChange({ target: { name: 'officeBusinessDistrictName', value: '' } });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const label = locationActions.getSelectOptions().districtOptions.find((option) => option.value === value)?.label || '';
    locationActions.setSelectedDistrict(value);
    onChange({ target: { name: 'officeBusinessDistrict', value } });
    onChange({ target: { name: 'officeBusinessDistrictName', value: label } });
  };

  return (
    <div className='space-y-6'>
      <div>
        <Input label='10. Occupation' name='occupation' value={formData.occupation || ''} onChange={onChange} placeholder='Enter occupation' required error={errors['occupation']} />
      </div>

      <div>
        <TextArea
          label='11. Office/Business address'
          name='officeBusinessAddress'
          value={formData.officeBusinessAddress || ''}
          onChange={onChange}
          placeholder='Enter office or business address'
          rows={2}
          required
          error={errors['officeBusinessAddress']}
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        <Select
          label='State'
          name='officeBusinessState'
          value={formData.officeBusinessState || ''}
          onChange={handleStateChange}
          onFocus={() => {
            if (locationState.states.length <= 1) {
              locationActions.loadStates();
            }
          }}
          options={locationActions.getSelectOptions().stateOptions}
          placeholder={locationState.loadingStates ? 'Loading states...' : 'Select state'}
          disabled={locationState.loadingStates}
          required
          error={errors['officeBusinessState']}
        />
        <Select
          label='District'
          name='officeBusinessDistrict'
          value={formData.officeBusinessDistrict || ''}
          onChange={handleDistrictChange}
          onFocus={() => {
            if (formData.officeBusinessState && locationState.districts.length <= 1) {
              locationActions.loadDistricts(formData.officeBusinessState);
            }
          }}
          options={locationActions.getSelectOptions().districtOptions}
          placeholder={
            locationState.loadingDistricts
              ? 'Loading districts...'
              : !formData.officeBusinessState
              ? 'Select state first'
              : 'Select district'
          }
          disabled={locationState.loadingDistricts || !formData.officeBusinessState}
          required
          error={errors['officeBusinessDistrict']}
        />
      </div>

      <div>
        <p className='text-sm font-semibold text-gray-900 mb-4'>
          12. Additional particulars if the licence is required for crop protection under rule 35
        </p>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Input
            label='Location'
            name='cropProtectionLocation'
            value={formData.cropProtectionLocation || ''}
            onChange={onChange}
            placeholder='Enter location'
            required
            error={errors['cropProtectionLocation']}
          />
          <Input
            label='Area of land under cultivation'
            name='cultivatedArea'
            value={formData.cultivatedArea || ''}
            onChange={onChange}
            placeholder='Enter area (in acres)'
            required
            error={errors['cultivatedArea']}
          />
        </div>
      </div>
    </div>
  );
});

export default OccupationSection;
