import React from 'react';
import { Input } from '../../elements/Input';
import { FormField } from '../../elements/FormField';

const PersonalDetailsSection: React.FC<{ formData: any; onChange: (e: any) => void }> = ({
  formData,
  onChange,
}) => {
  const gender = String(formData.applicantGender || '').toUpperCase();

  return (
    <section className='p-6 rounded-2xl border border-gray-100 bg-white shadow-sm'>
      <h2 className='text-xl font-bold mb-4'>Personal Information</h2>

      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-10 mb-4'>
        <Input
          label='Applicant First Name'
          name='applicantName'
          value={formData.applicantName || ''}
          onChange={onChange}
          placeholder='Enter first name'
        />

        <div className='flex flex-col w-full'>
          <label htmlFor='applicantMiddleName' className='block text-sm font-medium text-gray-700 mb-1'>
            Applicant Middle Name
            <span className='ml-1 text-xs text-gray-400 align-middle'>(optional)</span>
          </label>
          <Input
            name='applicantMiddleName'
            value={formData.applicantMiddleName || ''}
            onChange={onChange}
            placeholder='Enter middle name'
          />
        </div>

        <Input
          label='Applicant Last Name'
          name='applicantLastName'
          value={formData.applicantLastName || ''}
          onChange={onChange}
          placeholder='Enter last name'
        />

        <div className='flex flex-col w-full'>
          <label htmlFor='filledBy' className='block text-sm font-medium text-gray-700 mb-1'>
            Application filled by (ZS name)
          </label>
          <Input name='filledBy' value={formData.filledBy || ''} onChange={onChange} placeholder='Enter ZS name' />
        </div>

        <Input
          label='Parent/ Spouse Name'
          name='fatherName'
          value={formData.fatherName || ''}
          onChange={onChange}
          placeholder='Enter parent or spouse name'
        />

        <FormField label='Sex'>
          <div className='flex flex-wrap items-center gap-4 pt-1'>
            <label className='inline-flex items-center gap-2 cursor-pointer'>
              <input
                id='applicantGenderMale'
                type='radio'
                name='applicantGender'
                value='MALE'
                checked={gender === 'MALE'}
                onChange={onChange}
                className='text-indigo-600 focus:ring-indigo-500'
              />
              <span className='text-sm text-gray-700'>Male</span>
            </label>
            <label className='inline-flex items-center gap-2 cursor-pointer'>
              <input
                id='applicantGenderFemale'
                type='radio'
                name='applicantGender'
                value='FEMALE'
                checked={gender === 'FEMALE'}
                onChange={onChange}
                className='text-indigo-600 focus:ring-indigo-500'
              />
              <span className='text-sm text-gray-700'>Female</span>
            </label>
            <label className='inline-flex items-center gap-2 cursor-pointer'>
              <input
                id='applicantGenderOther'
                type='radio'
                name='applicantGender'
                value='OTHER'
                checked={gender === 'OTHER'}
                onChange={onChange}
                className='text-indigo-600 focus:ring-indigo-500'
              />
              <span className='text-sm text-gray-700'>Other</span>
            </label>
          </div>
        </FormField>

        <Input
          label='Place of Birth'
          name='placeOfBirth'
          value={formData.placeOfBirth || ''}
          onChange={onChange}
          placeholder='Enter place of birth'
        />

        <Input
          label='Date of Birth'
          name='applicantDateOfBirth'
          type='date'
          value={formData.applicantDateOfBirth || ''}
          onChange={onChange}
        />

        <Input
          label='PAN'
          name='panNumber'
          value={formData.panNumber || ''}
          onChange={onChange}
          placeholder='Enter PAN'
          maxLength={10}
        />

        <Input
          label='Aadhar Number'
          name='aadharNumber'
          value={formData.aadharNumber || ''}
          onChange={onChange}
          placeholder='Enter Aadhar number'
          maxLength={12}
        />

        <Input
          label='Date of Birth in Words'
          name='dobInWords'
          value={formData.dobInWords || ''}
          onChange={onChange}
          placeholder='Enter date of birth in words'
        />
      </div>
    </section>
  );
};

export default PersonalDetailsSection;
