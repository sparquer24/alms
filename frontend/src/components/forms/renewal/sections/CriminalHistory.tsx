import React, { forwardRef, useImperativeHandle } from 'react';
import { Input } from '../../elements/Input';
import { Button } from '../../elements/Button';

type ErrorsMap = Record<string, string | undefined>;

type FirDetail = {
  id: string;
  firNumber?: string;
  underSection?: string;
  policeStation?: string;
  unit?: string;
  district?: string;
  state?: string;
  offence?: string;
  sentence?: string;
  sentenceDate?: string;
};

const CriminalHistory = forwardRef(function CriminalHistory(
  props: { formData: any; onChange: (e: any) => void; errors?: ErrorsMap },
  ref: any
) {
  const { formData, onChange, errors = {} } = props;

  const initialFirDetails: FirDetail[] =
    Array.isArray(formData.firDetailsList) && formData.firDetailsList.length > 0
      ? formData.firDetailsList.map((item: any, index: number) => ({
          id: item?.id || `fir-${index + 1}`,
          firNumber: item?.firNumber || '',
          underSection: item?.underSection || '',
          policeStation: item?.policeStation || '',
          unit: item?.unit || '',
          district: item?.district || item?.District || formData.criminalDistrict || '',
          state: item?.state || '',
          offence: item?.offence || '',
          sentence: item?.sentence || '',
          sentenceDate:
            item?.sentenceDate ||
            item?.DateOfSentence ||
            item?.date ||
            item?.dateOfSentence ||
            formData.sentenceDate ||
            '',
        }))
      : [
          {
            id: `fir-1`,
            firNumber: formData.firNumber || '',
            underSection: formData.underSection || '',
            policeStation: formData.policeStationCriminal || '',
            unit: formData.criminalUnit || '',
            district: formData.criminalDistrict || '',
            state: formData.criminalState || '',
            offence: formData.offence || '',
            sentence: formData.sentence || '',
            sentenceDate: formData.sentenceDate || '',
          },
        ];

  const updateFirDetail = (id: string, key: keyof FirDetail, value: string) => {
    const next = initialFirDetails.map(item => (item.id === id ? { ...item, [key]: value } : item));
    onChange({ target: { name: 'firDetailsList', value: next } });
  };

  const addFirDetail = () => {
    onChange({
      target: {
        name: 'firDetailsList',
        value: [
          ...initialFirDetails,
          {
            id: `fir-${Date.now()}`,
            firNumber: '',
            underSection: '',
            policeStation: '',
            unit: '',
            district: '',
            state: '',
            offence: '',
            sentence: '',
            sentenceDate: '',
          },
        ],
      },
    });
  };

  const removeFirDetail = (id: string) => {
    const next = initialFirDetails.filter(item => item.id !== id);
    onChange({ target: { name: 'firDetailsList', value: next } });
  };

  const radioGroup = (name: string, value: boolean) => (
    <div className='flex items-center gap-6'>
      <label className='inline-flex items-center gap-2'>
        <input
          type='radio'
          name={name}
          checked={value === true}
          onChange={() => onChange({ target: { name, value: true } })}
        />
        <span className='text-sm font-medium'>Yes</span>
      </label>
      <label className='inline-flex items-center gap-2'>
        <input
          type='radio'
          name={name}
          checked={value === false}
          onChange={() => onChange({ target: { name, value: false } })}
        />
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
          try {
            (el as HTMLElement).focus();
          } catch {
            /* ignore */
          }
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
                <div className='mt-4 space-y-4'>
                  {initialFirDetails.map((item, index) => (
                    <div key={item.id} className='rounded-lg border border-gray-200 p-4'>
                      <div className='flex items-center justify-between gap-4 mb-4'>
                        <p className='text-sm font-semibold'>FIR detail {index + 1}</p>
                        {initialFirDetails.length > 1 && (
                          <Button
                            type='button'
                            size='sm'
                            className='h-[38px] px-3'
                            onClick={() => removeFirDetail(item.id)}
                          >
                            Remove
                          </Button>
                        )}
                      </div>

                      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                        <Input
                          label='FIR Number'
                          name={`firNumber-${item.id}`}
                          value={item.firNumber || ''}
                          onChange={e => updateFirDetail(item.id, 'firNumber', e.target.value)}
                          placeholder='Enter FIR number'
                          required
                          error={errors[`fir_${index}_firNumber`]}
                        />
                        <Input
                          label='Under Section'
                          name={`underSection-${item.id}`}
                          value={item.underSection || ''}
                          onChange={e => updateFirDetail(item.id, 'underSection', e.target.value)}
                          placeholder='Enter section'
                          required
                          error={errors[`fir_${index}_underSection`]}
                        />
                        <Input
                          label='Police Station'
                          name={`policeStation-${item.id}`}
                          value={item.policeStation || ''}
                          onChange={e => updateFirDetail(item.id, 'policeStation', e.target.value)}
                          placeholder='Enter police station'
                          required
                          error={errors[`fir_${index}_policeStation`]}
                        />
                        <Input
                          label='Unit'
                          name={`unit-${item.id}`}
                          value={item.unit || ''}
                          onChange={e => updateFirDetail(item.id, 'unit', e.target.value)}
                          placeholder='Enter unit'
                          required
                          error={errors[`fir_${index}_unit`]}
                        />
                        <Input
                          label='District'
                          name={`district-${item.id}`}
                          value={item.district || ''}
                          onChange={e => updateFirDetail(item.id, 'district', e.target.value)}
                          placeholder='Enter district'
                          required
                          error={errors[`fir_${index}_district`]}
                        />
                        <Input
                          label='State'
                          name={`state-${item.id}`}
                          value={item.state || ''}
                          onChange={e => updateFirDetail(item.id, 'state', e.target.value)}
                          placeholder='Enter state'
                          required
                          error={errors[`fir_${index}_state`]}
                        />
                      </div>

                      <div className='mt-4 grid grid-cols-1 md:grid-cols-3 gap-6'>
                        <Input
                          label='Offence'
                          name={`offence-${item.id}`}
                          value={item.offence || ''}
                          onChange={e => updateFirDetail(item.id, 'offence', e.target.value)}
                          placeholder='Enter offence'
                          required
                          error={errors[`fir_${index}_offence`]}
                        />
                        <Input
                          label='Sentence'
                          name={`sentence-${item.id}`}
                          value={item.sentence || ''}
                          onChange={e => updateFirDetail(item.id, 'sentence', e.target.value)}
                          placeholder='Enter sentence'
                          required
                          error={errors[`fir_${index}_sentence`]}
                        />
                        <Input
                          label='Date of Sentence'
                          type='date'
                          name={`sentenceDate-${item.id}`}
                          value={item.sentenceDate || ''}
                          onChange={e => updateFirDetail(item.id, 'sentenceDate', e.target.value)}
                          required
                          error={errors[`fir_${index}_sentenceDate`]}
                        />
                      </div>
                    </div>
                  ))}

                  <div className='mt-3'>
                    <Button
                      type='button'
                      size='sm'
                      className='h-[38px] px-3'
                      onClick={addFirDetail}
                    >
                      + Add FIR
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div>
            <p className='text-sm font-medium text-yellow-700 mb-3'>
              (b) Ordered to execute a bond under Chapter IX of Bharath Nagarik Suraksha Sameeksha,
              1973 (2 of 1947) for keeping the peace or for good behavior
            </p>
            {radioGroup('bondStatus', formData.bondStatus)}
            {formData.bondStatus && (
              <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-6'>
                <Input
                  label='Date of Sentence'
                  type='date'
                  name='bondSentenceDate'
                  value={formData.bondSentenceDate || ''}
                  onChange={onChange}
                  required
                  error={errors['bondSentenceDate']}
                />
                <Input
                  label='Period of which bond'
                  name='bondPeriod'
                  value={formData.bondPeriod || ''}
                  onChange={onChange}
                  placeholder='Enter period'
                  required
                  error={errors['bondPeriod']}
                />
              </div>
            )}
          </div>

          <div>
            <p className='text-sm font-medium text-yellow-700 mb-3'>
              (c) Prohibited under the Arms Act, 1959, or any other law from having the arms off
              ammunition
            </p>
            {radioGroup('prohibitedStatus', formData.prohibitedStatus)}
            {formData.prohibitedStatus && (
              <div className='mt-4 grid grid-cols-1 md:grid-cols-2 gap-6'>
                <Input
                  label='Date of Sentence'
                  type='date'
                  name='prohibitedSentenceDate'
                  value={formData.prohibitedSentenceDate || ''}
                  onChange={onChange}
                  required
                  error={errors['prohibitedSentenceDate']}
                />
                <Input
                  label='Period of which bound'
                  name='prohibitedPeriod'
                  value={formData.prohibitedPeriod || ''}
                  onChange={onChange}
                  placeholder='Enter period'
                  required
                  error={errors['prohibitedPeriod']}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default CriminalHistory;
