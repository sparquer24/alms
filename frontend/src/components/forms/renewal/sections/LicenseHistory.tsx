import React, { forwardRef, useImperativeHandle } from 'react';
import { Input, TextArea } from '../../elements/Input';
import { Select } from '../../elements/Select';
import { Button } from '../../elements/Button';

type ErrorsMap = Record<string, string | undefined>;

type WeaponItem = {
  id: string;
  value: string;
};

const LicenseHistory = forwardRef(function LicenseHistory(
  props: { formData: any; onChange: (e: any) => void; errors?: ErrorsMap },
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
          try {
            (el as HTMLElement).focus();
          } catch {
            /* ignore */
          }
        }
      }
    },
  }));

  const yn = (name: string, value: boolean) => (
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

  const weaponsRaw: any[] = Array.isArray(formData.weaponEndorsedList)
    ? formData.weaponEndorsedList
    : [];

  const weapons: WeaponItem[] = weaponsRaw.length
    ? weaponsRaw.map((w: any, index: number) =>
        typeof w === 'string'
          ? { id: `legacy-${index}-${w}`, value: w }
          : { id: w.id || `weapon-${index}`, value: w.value || '' }
      )
    : [{ id: `weapon-${Date.now()}`, value: '' }];

  const updateWeapon = (id: string, value: string) => {
    const next = weapons.map(w => (w.id === id ? { ...w, value } : w));
    onChange({ target: { name: 'weaponEndorsedList', value: next } });
  };

  const addWeapon = () => {
    onChange({
      target: {
        name: 'weaponEndorsedList',
        value: [...weapons, { id: `weapon-${Date.now()}`, value: '' }],
      },
    });
  };

  const removeWeapon = (id: string) => {
    const next = weapons.filter(w => w.id !== id);
    onChange({ target: { name: 'weaponEndorsedList', value: next } });
  };

  return (
    <div className='space-y-4'>
      <div className='space-y-5'>
        <div>
          <p className='text-sm font-medium'>Whether the applicant has applied for -</p>
          <p className='text-sm mt-2'>(a) Arms License before?</p>
          {yn('hasAppliedBefore', Boolean(formData.hasAppliedBefore))}
          {formData.hasAppliedBefore && (
            <div className='mt-3 grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input
                label='Date of Application'
                type='date'
                name='applicationDate'
                value={formData.applicationDate || ''}
                onChange={onChange}
                required
                error={errors['applicationDate']}
              />
              <Input
                label='To which authority'
                name='authorityAppliedTo'
                value={formData.authorityAppliedTo || ''}
                onChange={onChange}
                placeholder='Enter authority'
                required
                error={errors['authorityAppliedTo']}
              />
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
              <Input
                label='By which authority'
                name='revokedByAuthority'
                value={formData.revokedByAuthority || ''}
                onChange={onChange}
                placeholder='Enter authority'
                required
                error={errors['revokedByAuthority']}
              />
              <Input
                label='Reason'
                name='revokedReason'
                value={formData.revokedReason || ''}
                onChange={onChange}
                placeholder='Enter reason'
                required
                error={errors['revokedReason']}
              />
            </div>
          )}
        </div>

        <div>
          <p className='text-sm'>(c) Any member of the family holds a license</p>
          {yn('familyMemberHasLicense', Boolean(formData.familyMemberHasLicense))}
          {formData.familyMemberHasLicense && (
            <div className='mt-3 grid grid-cols-1 md:grid-cols-2 gap-4'>
              <Input
                label='Name'
                name='familyMemberName'
                value={formData.familyMemberName || ''}
                onChange={onChange}
                placeholder='Enter name'
                required
                error={errors['familyMemberName']}
              />
              <Input
                label='License Number'
                name='familyLicenseNumber'
                value={formData.familyLicenseNumber || ''}
                onChange={onChange}
                placeholder='Enter license number'
                required
                error={errors['familyLicenseNumber']}
              />
            </div>
          )}
          {formData.familyMemberHasLicense && (
            <div className='mt-3 space-y-3'>
              <p className='text-sm font-medium mb-2'>Weapons Endorsed</p>
              {weapons.map((weapon, index) => (
                <div key={weapon.id} className='flex flex-col gap-2 md:flex-row md:items-end'>
                  <div className='flex-1'>
                    <Input
                      label={`Weapon ${index + 1}`}
                      name={`weaponEndorsed-${weapon.id}`}
                      value={weapon.value}
                      onChange={e => updateWeapon(weapon.id, e.target.value)}
                      placeholder='Enter weapon'
                      required
                      error={index === 0 ? errors['weaponEndorsedList'] : undefined}
                    />
                  </div>
                  <div className='flex gap-2'>
                    {weapons.length > 1 && (
                      <Button
                        type='button'
                        size='sm'
                        className='h-[38px] px-3'
                        onClick={() => removeWeapon(weapon.id)}
                      >
                        Remove
                      </Button>
                    )}
                    {index === weapons.length - 1 && (
                      <Button type='button' size='sm' className='h-[38px] px-3' onClick={addWeapon}>
                        +
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className='text-sm'>
            (d) The applicant has a safe place to keep the arms and ammunition
          </p>
          {yn('hasSafeCustody', Boolean(formData.hasSafeCustody))}
          {formData.hasSafeCustody && (
            <TextArea
              label='If Yes details thereof'
              name='safeCustodyDetails'
              value={formData.safeCustodyDetails || ''}
              onChange={onChange}
              rows={3}
              placeholder='Enter details'
              required
              error={errors['safeCustodyDetails']}
            />
          )}
        </div>

        <div>
          <p className='text-sm'>
            (e) The applicant has undergone training as specified under rule 10
          </p>
          {yn('hasTrainingUnderRule10', Boolean(formData.hasTrainingUnderRule10))}
          {formData.hasTrainingUnderRule10 && (
            <TextArea
              label='If Yes details thereof'
              name='trainingDetails'
              value={formData.trainingDetails || ''}
              onChange={onChange}
              rows={3}
              placeholder='Enter details'
              required
              error={errors['trainingDetails']}
            />
          )}
        </div>
      </div>
    </div>
  );
});

export default LicenseHistory;
