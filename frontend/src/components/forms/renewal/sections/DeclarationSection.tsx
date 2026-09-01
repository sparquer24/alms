import React, { forwardRef, useImperativeHandle } from 'react';
import { Checkbox } from '../../elements/Checkbox';

type ErrorsMap = Record<string, string | undefined>;

const DeclarationSection = forwardRef(function DeclarationSection(
  props: { formData: any; onChange: (e: any) => void; errors?: ErrorsMap },
  ref: any,
) {
  const { formData, onChange, errors = {} } = props;

  useImperativeHandle(ref, () => ({
    focusFirstInvalid: () => {
      const order = ['agreeToTruth', 'understandLegalConsequences', 'agreeToTerms'];
      const firstKey = order.find((key) => errors[key]);
      if (firstKey) {
        const el = document.getElementById(`declaration.${firstKey}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          try { (el as HTMLElement).focus(); } catch { /* ignore */ }
        }
      }
    },
  }));

  const hasErrors = Object.values(errors).some((v) => !!v);

  return (
    <section className={`rounded-2xl border p-6 shadow-sm ${hasErrors ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'}`}>
      <div className='space-y-3'>
        <Checkbox
          label='I declare that the information provided is true'
          name='declaration.agreeToTruth'
          required
          error={errors['agreeToTruth']}
          checked={Boolean(formData.declaration?.agreeToTruth)}
          onChange={(v) => onChange({ target: { name: 'declaration.agreeToTruth', value: v } })}
        />
        <Checkbox
          label='I understand the legal consequences of providing false information'
          name='declaration.understandLegalConsequences'
          required
          error={errors['understandLegalConsequences']}
          checked={Boolean(formData.declaration?.understandLegalConsequences)}
          onChange={(v) => onChange({ target: { name: 'declaration.understandLegalConsequences', value: v } })}
        />
        <Checkbox
          label='I agree to the terms and conditions'
          name='declaration.agreeToTerms'
          required
          error={errors['agreeToTerms']}
          checked={Boolean(formData.declaration?.agreeToTerms)}
          onChange={(v) => onChange({ target: { name: 'declaration.agreeToTerms', value: v } })}
        />
      </div>
    </section>
  );
});

DeclarationSection.displayName = 'DeclarationSection';

export default DeclarationSection;
