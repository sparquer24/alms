import React, { forwardRef, useImperativeHandle } from 'react';
import { Input } from '../../elements/Input';
import { FormField } from '../../elements/FormField';

type ErrorsMap = Record<string, string | undefined>;

const PersonalDetailsSection = forwardRef(function PersonalDetailsSection(
  props: { formData: any; onChange: (e: any) => void; errors?: ErrorsMap },
  ref,
) {
  const { formData, onChange, errors = {} } = props;
  const gender = String(formData.applicantGender || '').toUpperCase();

  useImperativeHandle(ref, () => ({
    focusFirstInvalid: () => {
      const firstKey = Object.keys(errors).find(k => !!errors[k]);
      if (firstKey) {
        const el = document.getElementById(firstKey);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          try { (el as HTMLElement).focus(); } catch { /* ignore focus errors */ }
        }
      }
    },
  }));

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
          required
          error={errors['applicantName']}
        />

        <Input
          label={'Applicant Middle Name (optional)'}
          name='applicantMiddleName'
          value={formData.applicantMiddleName || ''}
          onChange={onChange}
          placeholder='Enter middle name'
          error={errors['applicantMiddleName']}
        />

        <Input
          label='Applicant Last Name'
          name='applicantLastName'
          value={formData.applicantLastName || ''}
          onChange={onChange}
          placeholder='Enter last name'
          required
          error={errors['applicantLastName']}
        />

        <Input
          label='Application filled by (ZS name)'
          name='filledBy'
          value={formData.filledBy || ''}
          onChange={onChange}
          placeholder='Enter ZS name'
          required
          error={errors['filledBy']}
        />

        <Input
          label='Parent/ Spouse Name'
          name='fatherName'
          value={formData.fatherName || ''}
          onChange={onChange}
          placeholder='Enter parent or spouse name'
          required
          error={errors['fatherName']}
        />

        <FormField label='Gender' required error={errors['applicantGender']}>
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
          </div>
        </FormField>

        <Input
          label='Place of Birth'
          name='placeOfBirth'
          value={formData.placeOfBirth || ''}
          onChange={onChange}
          placeholder='Enter place of birth'
          required
          error={errors['placeOfBirth']}
        />

        <Input
          label='Date of Birth'
          name='applicantDateOfBirth'
          type='date'
          value={formData.applicantDateOfBirth || ''}
          onChange={onChange}
          required
          error={errors['applicantDateOfBirth']}
          max={new Date(new Date().setFullYear(new Date().getFullYear() - 21)).toISOString().split('T')[0]}
        />

        <Input
          label='PAN'
          name='panNumber'
          value={formData.panNumber || ''}
          onChange={onChange}
          placeholder='Enter PAN'
          maxLength={10}
          required
          error={errors['panNumber']}
        />

        <Input
          label='Aadhar Number'
          name='aadharNumber'
          value={formData.aadharNumber || ''}
          onChange={onChange}
          placeholder='Enter Aadhar number'
          maxLength={12}
          required
          error={errors['aadharNumber']}
        />

        <Input
          label='Date of Birth in Words'
          name='dobInWords'
          value={formData.dobInWords || ''}
          onChange={onChange}
          placeholder='Enter date of birth in words'
          required
          error={errors['dobInWords']}
        />
      </div>
    </section>
  );
});

export default PersonalDetailsSection;
