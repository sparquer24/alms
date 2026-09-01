import React from 'react';
import TextInput from './ui/TextInput';

interface Props { formData: any; setValue: (k:string,v:any)=>void; errors: Record<string,string> }

export default function PersonalInfo({ formData, setValue, errors }: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <TextInput name="applicantName" label="First name" value={formData.applicantName} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setValue('applicantName', e.target.value)} error={errors.applicantName} />
      <TextInput name="applicantMobile" label="Mobile" value={formData.applicantMobile} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setValue('applicantMobile', e.target.value)} error={errors.applicantMobile} />
      <TextInput name="applicantEmail" label="Email" value={formData.applicantEmail} onChange={(e: React.ChangeEvent<HTMLInputElement>)=>setValue('applicantEmail', e.target.value)} error={errors.applicantEmail} />
    </div>
  );
}
