"use client";
import React, { useEffect, useState } from 'react';
import AddressDetails from './steps/AddressDetails';
import { formSteps, initialFormData, requiredFieldsByStep, FormData } from './steps/stepsConfig';

interface Props {
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}

const STORAGE_KEY = 'fresh_app_draft_v1';

export default function FreshApplicationForm({ onSubmit, onCancel }: Props) {
  const [stepIndex, setStepIndex] = useState(0);
  const [formData, setFormData] = useState<FormData>({ ...initialFormData });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // try load draft
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setFormData((prev: any) => ({ ...prev, ...JSON.parse(raw) }));
    } catch (e) {
      // ignore
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type, checked } = e.target as any;
    const v = type === 'checkbox' ? checked : value;
  setFormData((prev: any) => ({ ...prev, [name]: v }));
  setErrors((prev: any) => ({ ...prev, [name]: '' }));
  };

  const validateStep = (index = stepIndex) => {
    const key = formSteps[index].key;
    const required = requiredFieldsByStep[key] || [];
    const newErrors: Record<string, string> = {};
    for (const f of required) {
      // support nested path like declaration.agreeToTruth
      const parts = f.split('.');
      let val: any = formData;
      for (const p of parts) val = val ? val[p] : undefined;
      if (val === undefined || val === '' || val === false) {
        newErrors[f] = 'This field is required';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const next = () => {
    if (!validateStep()) return;
    setStepIndex(i => Math.min(formSteps.length - 1, i + 1));
  };

  const prev = () => setStepIndex(i => Math.max(0, i - 1));

  const saveDraft = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(formData));
      alert('Draft saved locally');
    } catch (e) {
      console.error(e);
      alert('Failed to save draft');
    }
  };

  const submit = () => {
    if (!validateStep()) return;
    // validate all steps minimally
    for (let i = 0; i < formSteps.length; i++) {
      const key = formSteps[i].key;
      const req = requiredFieldsByStep[key] || [];
      for (const f of req) {
        const parts = f.split('.');
        let val: any = formData;
        for (const p of parts) val = val ? val[p] : undefined;
        if (val === undefined || val === '' || val === false) {
          setStepIndex(i);
          setErrors({ [f]: 'This field is required' });
          return;
        }
      }
    }

    try {
      // call parent onSubmit
      onSubmit(formData);
      // clear draft
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.error(e);
      alert('Submission failed');
    }
  };

  // Render step content
  const renderStep = () => {
    const key = formSteps[stepIndex].key;
    switch (key) {
      case 'address':
        return <AddressDetails formData={formData} onChange={handleChange} errors={errors} />;
      // For now keep other steps as simple placeholders to be progressively enhanced
      default:
        return (
          <div className="p-4">
            <h3 className="text-lg font-bold">{formSteps[stepIndex].title}</h3>
            <p className="text-sm text-gray-600 mt-2">{formSteps[stepIndex].description}</p>
            <div className="mt-4">
              {/* minimal fields for personal step */}
              {key === 'personal' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full name <span className="text-red-500">*</span></label>
                    <input name="applicantName" value={formData.applicantName || ''} onChange={handleChange} className={`mt-1 block w-full p-2 border ${errors.applicantName ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
                    {errors.applicantName && <p className="text-red-500 text-xs mt-1">{errors.applicantName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mobile <span className="text-red-500">*</span></label>
                    <input name="applicantMobile" value={formData.applicantMobile || ''} onChange={handleChange} className={`mt-1 block w-full p-2 border ${errors.applicantMobile ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
                    {errors.applicantMobile && <p className="text-red-500 text-xs mt-1">{errors.applicantMobile}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Date of Birth <span className="text-red-500">*</span></label>
                    <input type="date" name="applicantDateOfBirth" value={formData.applicantDateOfBirth || ''} onChange={handleChange} className={`mt-1 block w-full p-2 border ${errors.applicantDateOfBirth ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
                    {errors.applicantDateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.applicantDateOfBirth}</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="bg-white rounded shadow p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Fresh Application Form</h2>
        <div className="text-sm text-gray-600">Step {stepIndex + 1} / {formSteps.length}</div>
      </div>

      <div className="mb-6">
        <nav className="flex space-x-2 overflow-auto">
          {formSteps.map((s, i) => (
            <button key={s.key} onClick={() => setStepIndex(i)} className={`px-3 py-1 rounded ${i === stepIndex ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}>
              {s.title}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[260px]">{renderStep()}</div>

      <div className="mt-6 flex items-center justify-between">
        <div className="space-x-2">
          <button onClick={onCancel} className="px-3 py-2 bg-gray-200 rounded">Cancel</button>
          <button onClick={saveDraft} className="px-3 py-2 bg-yellow-100 rounded">Save draft</button>
        </div>

        <div className="space-x-2">
          {stepIndex > 0 && <button onClick={prev} className="px-3 py-2 bg-white border rounded">Previous</button>}
          {stepIndex < formSteps.length - 1 && <button onClick={next} className="px-4 py-2 bg-blue-600 text-white rounded">Next</button>}
          {stepIndex === formSteps.length - 1 && <button onClick={submit} className="px-4 py-2 bg-green-600 text-white rounded">Submit</button>}
        </div>
      </div>
    </div>
  );
}
