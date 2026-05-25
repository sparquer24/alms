import React from 'react';
import { Input, TextArea } from '../../elements/Input';
import { Checkbox } from '../../elements/Checkbox';
import { LocationHierarchy } from '../../elements/LocationHierarchy';

const AddressDetailsSection: React.FC<{ formData:any; onChange:(e:any)=>void }> = ({ formData, onChange }) => {
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='md:col-span-2'>
          <TextArea label='Present Address' name='presentAddress' value={formData.presentAddress || ''} onChange={onChange} rows={2} />
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
          />
        </div>

        <div>
          <Input label='Present Pincode' name='presentPincode' value={formData.presentPincode || ''} onChange={onChange} />
        </div>

        <div>
          <Input label='Residing Since' type='date' name='residingSince' value={formData.residingSince || ''} onChange={onChange} />
        </div>

        <div className='col-span-1 md:col-span-2'>
          <Checkbox label='Permanent address is same as present address' name='sameAsPresent' checked={Boolean(formData.sameAsPresent)} onChange={(v)=>onChange({ target: { name: 'sameAsPresent', value: v } })} />
        </div>

        {!formData.sameAsPresent && (
          <>
            <div>
              <TextArea label='Permanent Address' name='permanentAddress' value={formData.permanentAddress || ''} onChange={onChange} rows={2} />
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
              />
            </div>

            <div>
              <Input label='Permanent Pincode' name='permanentPincode' value={formData.permanentPincode || ''} onChange={onChange} />
            </div>
          </>
        )}

        {/* Contact Numbers */}
        <div>
          <label htmlFor='officePhone' className='block text-sm font-medium text-gray-700'>Office Phone</label>
          <input id='officePhone' name='officePhone' value={formData.officePhone || ''} onChange={onChange} className='mt-1 block w-full p-2 border border-gray-300 rounded-md' />
        </div>

        <div>
          <label htmlFor='residencePhone' className='block text-sm font-medium text-gray-700'>Residence Phone</label>
          <input id='residencePhone' name='residencePhone' value={formData.residencePhone || ''} onChange={onChange} className='mt-1 block w-full p-2 border border-gray-300 rounded-md' />
        </div>

        <div>
          <label htmlFor='officeMobile' className='block text-sm font-medium text-gray-700'>Office Mobile</label>
          <input id='officeMobile' name='officeMobile' value={formData.officeMobile || ''} onChange={onChange} className='mt-1 block w-full p-2 border border-gray-300 rounded-md' />
        </div>

        <div>
          <label htmlFor='alternativeMobile' className='block text-sm font-medium text-gray-700'>Alternative Mobile</label>
          <input id='alternativeMobile' name='alternativeMobile' value={formData.alternativeMobile || ''} onChange={onChange} className='mt-1 block w-full p-2 border border-gray-300 rounded-md' />
        </div>
      </div>
    </div>
  );
};

export default AddressDetailsSection;
