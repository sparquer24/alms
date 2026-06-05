import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { Input, TextArea } from '../../elements/Input';
import { Select } from '../../elements/Select';
import { locationAPI, toSelectOptions } from '../../../../api/locationApi';

type ErrorsMap = Record<string, string | undefined>;

const OccupationSection = forwardRef(function OccupationSection(
  props: { formData: any; onChange: (e: any) => void; errors?: ErrorsMap },
  ref,
) {
  const { formData, onChange, errors = {} } = props;
  const [stateOptions, setStateOptions] = useState<{ value: string; label: string }[]>([]);
  const [districtOptions, setDistrictOptions] = useState<{ value: string; label: string }[]>([]);
  const [loadingStates, setLoadingStates] = useState(false);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  useEffect(() => {
    const loadStates = async () => {
      try {
        setLoadingStates(true);
        const states = await locationAPI.getAllStates();
        setStateOptions(toSelectOptions(states));
      } finally {
        setLoadingStates(false);
      }
    };
    loadStates();
  }, []);

  useEffect(() => {
    const stateId = formData.officeBusinessState;
    if (!stateId || !/^\d+$/.test(String(stateId))) {
      setDistrictOptions([]);
      return;
    }

    const loadDistricts = async () => {
      try {
        setLoadingDistricts(true);
        const districts = await locationAPI.getDistrictsByState(Number(stateId));
        setDistrictOptions(toSelectOptions(districts));
      } finally {
        setLoadingDistricts(false);
      }
    };
    loadDistricts();
  }, [formData.officeBusinessState]);

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
    const label = stateOptions.find((option) => option.value === value)?.label || '';
    onChange({ target: { name: 'officeBusinessState', value } });
    onChange({ target: { name: 'officeBusinessStateName', value: label } });
    onChange({ target: { name: 'officeBusinessDistrict', value: '' } });
    onChange({ target: { name: 'officeBusinessDistrictName', value: '' } });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const label = districtOptions.find((option) => option.value === value)?.label || '';
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
          options={stateOptions}
          placeholder={loadingStates ? 'Loading states...' : 'Select state'}
          disabled={loadingStates}
          required
          error={errors['officeBusinessState']}
        />
        <Select
          label='District'
          name='officeBusinessDistrict'
          value={formData.officeBusinessDistrict || ''}
          onChange={handleDistrictChange}
          options={districtOptions}
          placeholder={
            loadingDistricts
              ? 'Loading districts...'
              : !formData.officeBusinessState
              ? 'Select state first'
              : 'Select district'
          }
          disabled={loadingDistricts || !formData.officeBusinessState}
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
