import React from 'react';
import { Input } from '../../elements/Input';

const CriminalHistory: React.FC<{ formData:any; onChange:(e:any)=>void }> = ({ formData, onChange }) => {
  const radioGroup = (label: string, name: string, value: boolean) => (
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

  return (
    <div className='space-y-6'>
      <div>
        <p className='text-sm font-semibold text-gray-900 mb-4'>13. Whether the applicant has been -</p>
        
        <div className='space-y-6'>
          <div>
            <p className='text-sm font-medium text-yellow-700 mb-3'>(a) Convicted</p>
            {radioGroup('convictedStatus', 'convictedStatus', formData.convictedStatus)}
            
            <div className='mt-4'>
              <p className='text-sm font-semibold text-gray-800 mb-3'>i. Provisions to Enter–</p>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <Input label='FIR Number' name='firNumber' value={formData.firNumber || ''} onChange={onChange} placeholder='Enter FIR number' />
                <Input label='Under Section' name='underSection' value={formData.underSection || ''} onChange={onChange} placeholder='Enter section' />
                <Input label='Police Station' name='policeStationCriminal' value={formData.policeStationCriminal || ''} onChange={onChange} placeholder='Enter police station' />
                <Input label='Unit' name='criminalUnit' value={formData.criminalUnit || ''} onChange={onChange} placeholder='Enter unit' />
                <Input label='District' name='criminalDistrict' value={formData.criminalDistrict || ''} onChange={onChange} placeholder='Enter district' />
                <Input label='State' name='criminalState' value={formData.criminalState || ''} onChange={onChange} placeholder='Enter state' />
              </div>
            </div>
            
            <div className='mt-4'>
              <p className='text-sm font-semibold text-gray-800 mb-3'>If Yes details thereof-</p>
              <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                <Input label='Offence' name='offence' value={formData.offence || ''} onChange={onChange} placeholder='Enter offence' />
                <Input label='Sentence' name='sentence' value={formData.sentence || ''} onChange={onChange} placeholder='Enter sentence' />
                <Input label='Date of Sentence' type='date' name='sentenceDate' value={formData.sentenceDate || ''} onChange={onChange} />
              </div>
            </div>
          </div>

          <div>
            <p className='text-sm font-medium text-yellow-700 mb-3'>(b) Ordered to execute a bond under Chapter IX of Bharath Nagarik Suraksha Sameeksha, 1973 (2 of 1947) for keeping the peace or for good behavior</p>
            {radioGroup('bondStatus', 'bondStatus', formData.bondStatus)}
            {formData.bondStatus && (
              <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-6'>
                <Input label='Date of Sentence' type='date' name='bondSentenceDate' value={formData.bondSentenceDate || ''} onChange={onChange} />
                <Input label='Period of which bond' name='bondPeriod' value={formData.bondPeriod || ''} onChange={onChange} placeholder='Enter period' />
              </div>
            )}
          </div>

          <div>
            <p className='text-sm font-medium text-yellow-700 mb-3'>(c) Prohibited under the Arms Act, 1959, or any other law from having the arms off ammunition</p>
            {radioGroup('prohibitedStatus', 'prohibitedStatus', formData.prohibitedStatus)}
            {formData.prohibitedStatus && (
              <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-6'>
                <Input label='Date of Sentence' type='date' name='prohibitedSentenceDate' value={formData.prohibitedSentenceDate || ''} onChange={onChange} />
                <Input label='Period of which bound' name='prohibitedPeriod' value={formData.prohibitedPeriod || ''} onChange={onChange} placeholder='Enter period' />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriminalHistory;
