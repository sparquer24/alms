import React, { forwardRef, useImperativeHandle } from 'react';
import { Input } from '../../elements/Input';

type ErrorsMap = Record<string, string | undefined>;

const CriminalHistory = forwardRef(function CriminalHistory(
  props: { formData:any; onChange:(e:any)=>void; errors?: ErrorsMap },
  ref: any
) {
  const { formData, onChange, errors = {} } = props;

  const radioGroup = (name: string, value: boolean) => (
    <div className='flex items-center gap-6'>
      <label className='inline-flex items-center gap-2'>
        <input type='radio' name={name} checked={value === true} onChange={() => onChange({ target: { name, value: true } })} />
        <span className='text-sm font-medium'>Yes</span>
      </label>
      <label className='inline-flex items-center gap-2'>
        <input type='radio' name={name} checked={value === false} onChange={() => onChange({ target: { name, value: false } })} />
        <span className='text-sm font-medium'>No</span>
      </label>
    </div>
  );

  useImperativeHandle(ref, () => ({
    focusFirstInvalid: () => {
      const firstKey = Object.keys(errors).find(key => !!errors[key]);
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
    <div className='space-y-6'>
      <div>
        <p className='text-sm font-semibold text-gray-900 mb-4'>Whether the applicant has been -</p>
        
        <div className='space-y-6'>
          <div>
            <p className='text-sm font-medium text-yellow-700 mb-3'>(a) Convicted</p>
            {radioGroup('convictedStatus', formData.convictedStatus)}
            
            {formData.convictedStatus && (
              <>
                <div className='mt-4'>
                  <p className='text-sm font-semibold text-gray-800 mb-3'>i. Provisions to Enter–</p>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    <Input label='FIR Number' name='firNumber' value={formData.firNumber || ''} onChange={onChange} placeholder='Enter FIR number' required error={errors['firNumber']} />
                    <Input label='Under Section' name='underSection' value={formData.underSection || ''} onChange={onChange} placeholder='Enter section' required error={errors['underSection']} />
                    <Input label='Police Station' name='policeStationCriminal' value={formData.policeStationCriminal || ''} onChange={onChange} placeholder='Enter police station' required error={errors['policeStationCriminal']} />
                    <Input label='Unit' name='criminalUnit' value={formData.criminalUnit || ''} onChange={onChange} placeholder='Enter unit' required error={errors['criminalUnit']} />
                    <Input label='District' name='criminalDistrict' value={formData.criminalDistrict || ''} onChange={onChange} placeholder='Enter district' required error={errors['criminalDistrict']} />
                    <Input label='State' name='criminalState' value={formData.criminalState || ''} onChange={onChange} placeholder='Enter state' required error={errors['criminalState']} />
                  </div>
                </div>

                <div className='mt-4'>
                  <p className='text-sm font-semibold text-gray-800 mb-3'>If Yes details thereof-</p>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                    <Input label='Offence' name='offence' value={formData.offence || ''} onChange={onChange} placeholder='Enter offence' required error={errors['offence']} />
                    <Input label='Sentence' name='sentence' value={formData.sentence || ''} onChange={onChange} placeholder='Enter sentence' required error={errors['sentence']} />
                    <Input label='Date of Sentence' type='date' name='sentenceDate' value={formData.sentenceDate || ''} onChange={onChange} required error={errors['sentenceDate']} />
                  </div>
                </div>
              </>
            )}
          </div>

          <div>
            <p className='text-sm font-medium text-yellow-700 mb-3'>(b) Ordered to execute a bond under Chapter IX of Bharath Nagarik Suraksha Sameeksha, 1973 (2 of 1947) for keeping the peace or for good behavior</p>
            {radioGroup('bondStatus', formData.bondStatus)}
            {formData.bondStatus && (
              <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-6'>
                <Input label='Date of Sentence' type='date' name='bondSentenceDate' value={formData.bondSentenceDate || ''} onChange={onChange} required error={errors['bondSentenceDate']} />
                <Input label='Period of which bond' name='bondPeriod' value={formData.bondPeriod || ''} onChange={onChange} placeholder='Enter period' required error={errors['bondPeriod']} />
              </div>
            )}
          </div>

          <div>
            <p className='text-sm font-medium text-yellow-700 mb-3'>(c) Prohibited under the Arms Act, 1959, or any other law from having the arms off ammunition</p>
            {radioGroup('prohibitedStatus', formData.prohibitedStatus)}
            {formData.prohibitedStatus && (
              <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-6'>
                <Input label='Date of Sentence' type='date' name='prohibitedSentenceDate' value={formData.prohibitedSentenceDate || ''} onChange={onChange} required error={errors['prohibitedSentenceDate']} />
                <Input label='Period of which bound' name='prohibitedPeriod' value={formData.prohibitedPeriod || ''} onChange={onChange} placeholder='Enter period' required error={errors['prohibitedPeriod']} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default CriminalHistory;
