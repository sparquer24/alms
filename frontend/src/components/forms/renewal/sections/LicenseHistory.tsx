import React, { forwardRef, useImperativeHandle } from 'react';
import { Input, TextArea } from '../../elements/Input';
import { Select } from '../../elements/Select';
import { Button } from '../../elements/Button';

type ErrorsMap = Record<string, string | undefined>;

const LicenseHistory = forwardRef(function LicenseHistory(
  props: { formData:any; onChange:(e:any)=>void; errors?: ErrorsMap },
  ref: any
) {
  const { formData, onChange, errors = {} } = props;

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

  const yn = (name: string, value: boolean) => (
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

  const weaponsRaw: any[] = formData.weaponEndorsedList || [];

  React.useEffect(() => {
    if (!weaponsRaw.length) return;
    const needsNormalization = weaponsRaw.some((w: any) => typeof w === 'string' || !w?.id);
    if (needsNormalization) {
      const normalized = weaponsRaw.map((w: any) =>
        typeof w === 'string'
          ? { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, value: w }
          : { id: w.id || `${Date.now()}-${Math.random().toString(36).slice(2)}`, value: w.value || '' }
      );
      onChange({ target: { name: 'weaponEndorsedList', value: normalized } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const weapons = weaponsRaw.length
    ? weaponsRaw.map((w: any) =>
        typeof w === 'string'
          ? { id: `legacy-${w}`, value: w }
          : { id: w.id || `legacy-${w.value || ''}`, value: w.value || '' }
      )
    : [{ id: 'weapon-1', value: '' }];

  const addWeapon = () => {
    onChange({
      target: {
        name: 'weaponEndorsedList',
        value: [...weapons, { id: `${Date.now()}-${Math.random().toString(36).slice(2)}`, value: '' }],
      },
    });
  };

  const setWeapon = (id: string, value: string) => {
    const next = weapons.map((w: any) => (w.id === id ? { ...w, value } : w));
    onChange({ target: { name: 'weaponEndorsedList', value: next } });
  };

  return (
    <div className='space-y-4'>
      <div className='space-y-5'>
        <div>
          <p className='text-sm font-medium'>14. Whether the applicant has applied for -</p>
          <p className='text-sm mt-2'>(a) Arms License before?</p>
          {yn('hasAppliedBefore', Boolean(formData.hasAppliedBefore))}
          {formData.hasAppliedBefore && (
            <div className='mt-3 grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input label='Date of Application' type='date' name='applicationDate' value={formData.applicationDate || ''} onChange={onChange} required error={errors['applicationDate']} />
              <Input label='To which authority' name='authorityAppliedTo' value={formData.authorityAppliedTo || ''} onChange={onChange} placeholder='Enter authority' required error={errors['authorityAppliedTo']} />
              <Select
                label='Result'
                name='applicationResult'
                value={formData.applicationResult || ''}
                onChange={onChange}
                placeholder='Select Result'
                options={[
                  { value: 'approved', label: 'Approved' },
                  { value: 'rejected', label: 'Rejected' },
                  { value: 'pending', label: 'Pending' },
                ]}
                required
                error={errors['applicationResult']}
              />
            </div>
          )}
        </div>

        <div>
          <p className='text-sm'>(b) License been revoked or suspended</p>
          {yn('licenseRevokedOrSuspended', Boolean(formData.licenseRevokedOrSuspended))}
          {formData.licenseRevokedOrSuspended && (
            <div className='mt-3 grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input label='By which authority' name='revokedByAuthority' value={formData.revokedByAuthority || ''} onChange={onChange} placeholder='Enter authority' required error={errors['revokedByAuthority']} />
              <Input label='Reason' name='revokedReason' value={formData.revokedReason || ''} onChange={onChange} placeholder='Enter reason' required error={errors['revokedReason']} />
            </div>
          )}
        </div>

        <div>
          <p className='text-sm'>(c) Any member of the family holds a license</p>
          {yn('familyMemberHasLicense', Boolean(formData.familyMemberHasLicense))}
          {formData.familyMemberHasLicense && (
            <div className='mt-3 grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input label='Name' name='familyMemberName' value={formData.familyMemberName || ''} onChange={onChange} placeholder='Enter name' required error={errors['familyMemberName']} />
              <Input label='License Number' name='familyLicenseNumber' value={formData.familyLicenseNumber || ''} onChange={onChange} placeholder='Enter license number' required error={errors['familyLicenseNumber']} />
            </div>
          )}
          {formData.familyMemberHasLicense && (
            <div className='mt-3'>
              <p className='text-sm font-medium mb-2'>Weapons Endorsed</p>
              {weapons.map((w: any, i: number) => (
                <div key={w.id} className='flex gap-2 items-end mb-2'>
                  <div className='flex-1'>
                    <Select
                      label={`Weapon ${i + 1}`}
                      name={`weaponEndorsed-${i}`}
                      value={w.value}
                      onChange={(e) => setWeapon(w.id, e.target.value)}
                      placeholder='Select Weapon'
                      options={[
                        { value: 'revolver', label: 'Revolver' },
                        { value: 'pistol', label: 'Pistol' },
                        { value: 'rifle', label: 'Rifle' },
                        { value: 'shotgun', label: 'Shotgun' },
                      ]}
                    />
                  </div>
                  {i === weapons.length - 1 && (
                    <Button type='button' size='sm' onClick={addWeapon} className='h-[38px] px-3'>+</Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className='text-sm'>(d) The applicant has a safe place to keep the arms and ammunition</p>
          {yn('hasSafeCustody', Boolean(formData.hasSafeCustody))}
          {formData.hasSafeCustody && (
            <TextArea label='If Yes details thereof' name='safeCustodyDetails' value={formData.safeCustodyDetails || ''} onChange={onChange} rows={3} placeholder='Enter details' required error={errors['safeCustodyDetails']} />
          )}
        </div>

        <div>
          <p className='text-sm'>(e) The applicant has undergone training as specified under rule 10</p>
          {yn('hasTrainingUnderRule10', Boolean(formData.hasTrainingUnderRule10))}
          {formData.hasTrainingUnderRule10 && (
            <TextArea label='If Yes details thereof' name='trainingDetails' value={formData.trainingDetails || ''} onChange={onChange} rows={3} placeholder='Enter details' required error={errors['trainingDetails']} />
          )}
        </div>
      </div>
    </div>
  );
});

export default LicenseHistory;