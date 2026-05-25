import React from 'react';
import { Checkbox } from '../../elements/Checkbox';

const DeclarationSection: React.FC<{ formData:any; onChange:(e:any)=>void }> = ({ formData, onChange }) => {
  return (
    <section className='rounded-2xl border border-gray-100 bg-white p-6 shadow-sm'>
      <div className='space-y-3'>
        <Checkbox label='I declare that the information provided is true' name='declaration.agreeToTruth' checked={Boolean(formData.declaration?.agreeToTruth)} onChange={(v)=>onChange({ target: { name: 'declaration.agreeToTruth', value: v } })} />
        <Checkbox label='I understand the legal consequences of providing false information' name='declaration.understandLegalConsequences' checked={Boolean(formData.declaration?.understandLegalConsequences)} onChange={(v)=>onChange({ target: { name: 'declaration.understandLegalConsequences', value: v } })} />
        <Checkbox label='I agree to the terms and conditions' name='declaration.agreeToTerms' checked={Boolean(formData.declaration?.agreeToTerms)} onChange={(v)=>onChange({ target: { name: 'declaration.agreeToTerms', value: v } })} />
      </div>
    </section>
  );
};

export default DeclarationSection;
