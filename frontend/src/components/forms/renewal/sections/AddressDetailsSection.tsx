import React, { forwardRef, useImperativeHandle, useState, useEffect } from 'react';
import { Input, TextArea } from '../../elements/Input';
import { Checkbox } from '../../elements/Checkbox';
import { LocationHierarchy } from '../../elements/LocationHierarchy';
import { getUserFromCookie } from '../../../../utils/authCookies';

// Get user location data for pre-filling
const getUserLocationDefaults = () => {
  const userData = getUserFromCookie();
  if (userData && userData.location) {
    return {
      presentState: userData.location.state?.id ? String(userData.location.state.id) : '',
      presentDistrict: userData.location.district?.id ? String(userData.location.district.id) : '',
      presentZone: userData.location.zone?.id ? String(userData.location.zone.id) : '',
      presentStateName: userData.location.state?.name || '',
      presentDistrictName: userData.location.district?.name || '',
      presentZoneName: userData.location.zone?.name || '',
    };
  }
  return {
    presentState: '',
    presentDistrict: '',
    presentZone: '',
    presentStateName: '',
    presentDistrictName: '',
    presentZoneName: '',
  };
};

type ErrorsMap = Record<string, string | undefined>;

const AddressDetailsSection = forwardRef(function AddressDetailsSection(
  props: { formData:any; onChange:(e:any)=>void; errors?: ErrorsMap },
  ref,
) {
  const { formData, onChange, errors = {} } = props;
  const [isZSRole, setIsZSRole] = useState(false);

  useEffect(() => {
    const userData = getUserFromCookie();
    const isZS = userData?.role?.name === 'ZS' || userData?.role === 'ZS';
    setIsZSRole(isZS);

    // Only pre-fill if all three fields are empty (no existing data) or if user is ZS role
    if (isZS || (!formData.presentState && !formData.presentDistrict && !formData.presentZone)) {
      const locationDefaults = getUserLocationDefaults();
      
      if (locationDefaults.presentState) {
        // Prevent infinite loop by only updating if different
        if (formData.presentState !== locationDefaults.presentState || 
          formData.presentDistrict !== locationDefaults.presentDistrict || 
          formData.presentZone !== locationDefaults.presentZone) {
          
          onChange({ target: { name: 'presentState', value: locationDefaults.presentState } });
          onChange({ target: { name: 'presentDistrict', value: locationDefaults.presentDistrict } });
          onChange({ target: { name: 'presentZone', value: locationDefaults.presentZone } });
        }
      }
    }
  }, [formData.presentState, formData.presentDistrict, formData.presentZone, onChange]);

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

  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='md:col-span-2'>
          <TextArea label='Present Address' name='presentAddress' value={formData.presentAddress || ''} onChange={onChange} rows={2} required error={errors['presentAddress']} />
        </div>

        <div className='md:col-span-2'>
          <LocationHierarchy
            namePrefix='present'
            values={{
              state: formData.presentState || '',
              district: formData.presentDistrict || '',
              zone: formData.presentZone || '',
              division: formData.presentDivision || '',
              policeStation: formData.presentPoliceStation || '',
            }}
            onChange={(field, value) => onChange({ target: { name: field, value } })}
            required
            disabledFields={{
              state: isZSRole,
              district: isZSRole,
              zone: isZSRole
            }}
          />
        </div>

        <div>
          <Input 
            label='Residing Since' 
            type='date' 
            name='residingSince' 
            value={formData.residingSince || ''} 
            onChange={onChange} 
            error={errors['residingSince']} 
            max={new Date().toISOString().split('T')[0]}
          />
        </div>

        <div className='col-span-1 md:col-span-2'>
          <Checkbox label='Permanent address is same as present address' name='sameAsPresent' checked={Boolean(formData.sameAsPresent)} onChange={(v)=>onChange({ target: { name: 'sameAsPresent', value: v } })} />
        </div>

        {!formData.sameAsPresent && (
          <>
            <div>
              <TextArea label='Permanent Address' name='permanentAddress' value={formData.permanentAddress || ''} onChange={onChange} rows={2} required error={errors['permanentAddress']} />
            </div>

            <div className='md:col-span-2'>
              <LocationHierarchy
                namePrefix='permanent'
                values={{
                  state: formData.permanentState || '',
                  district: formData.permanentDistrict || '',
                  zone: formData.permanentZone || '',
                  division: formData.permanentDivision || '',
                  policeStation: formData.permanentPoliceStation || '',
                }}
                onChange={(field, value) => onChange({ target: { name: field, value } })}
                required
              />
            </div>

            </>
        )}

        {/* Contact Numbers (optional) */}
        <div>
          <label htmlFor='officePhone' className='block text-sm font-medium text-gray-700'>Office Phone</label>
          <input id='officePhone' name='officePhone' value={formData.officePhone || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors['officePhone'] ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
          {errors['officePhone'] && <p className='text-red-500 text-xs mt-1'>{errors['officePhone']}</p>}
        </div>

        <div>
          <label htmlFor='residencePhone' className='block text-sm font-medium text-gray-700'>Residence Phone</label>
          <input id='residencePhone' name='residencePhone' value={formData.residencePhone || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors['residencePhone'] ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
          {errors['residencePhone'] && <p className='text-red-500 text-xs mt-1'>{errors['residencePhone']}</p>}
        </div>

        <div>
          <label htmlFor='officeMobile' className='block text-sm font-medium text-gray-700'>Office Mobile</label>
          <input id='officeMobile' name='officeMobile' value={formData.officeMobile || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors['officeMobile'] ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
          {errors['officeMobile'] && <p className='text-red-500 text-xs mt-1'>{errors['officeMobile']}</p>}
        </div>

        <div>
          <label htmlFor='alternativeMobile' className='block text-sm font-medium text-gray-700'>Alternative Mobile</label>
          <input id='alternativeMobile' name='alternativeMobile' value={formData.alternativeMobile || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors['alternativeMobile'] ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
          {errors['alternativeMobile'] && <p className='text-red-500 text-xs mt-1'>{errors['alternativeMobile']}</p>}
        </div>
      </div>
    </div>
  );
});

export default AddressDetailsSection;
