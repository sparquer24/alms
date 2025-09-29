"use client";
import React, { useState, useRef } from 'react';
import PersonalInfo from './steps/PersonalInfo';
import AddressDetails from './steps/AddressDetails';
import OccupationBusiness from './steps/OccupationBusiness';
import CriminalHistory from './steps/CriminalHistory';
import LicenseDetails from './steps/LicenseDetails';
import BiometricInfo from './steps/BiometricInfo';
import DocumentsUpload from './steps/DocumentsUpload';
import PreviewStep from './steps/PreviewStep';
import Declaration from './steps/Declaration';
import StepNavigation from './StepNavigation';
import { createApplication } from './api';
import { formSteps, requiredFieldsByStep } from './steps/stepsConfig';
import { DocumentApi } from '../../config/APIClient';

const steps = [
  { title: 'Personal Information', comp: PersonalInfo },
  { title: 'Address Details', comp: AddressDetails },
  { title: 'Occupation & Business', comp: OccupationBusiness },
  { title: 'Criminal History', comp: CriminalHistory },
  { title: 'License Details', comp: LicenseDetails },
  { title: 'Biometric Information', comp: BiometricInfo },
  { title: 'Documents Upload', comp: DocumentsUpload },
  { title: 'Preview', comp: PreviewStep },
  { title: 'Declaration', comp: Declaration }
];

export default function FreshApplicationForm({ onSubmit, onCancel }: { onSubmit?: (d:any)=>void; onCancel?: ()=>void }) {
  const [formStep, setFormStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [errors, setErrors] = useState<Record<string,string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const previewRef = useRef<HTMLDivElement|null>(null);

  const StepComp: any = steps[formStep].comp;

  const handleChange = (e: any) => {
    const { name, value, type } = e.target as any;
    if (type === 'checkbox') {
      setFormData((p:any) => ({ ...p, [name]: Boolean(value) }));
    } else {
      setFormData((p:any) => ({ ...p, [name]: value }));
    }
    setErrors({});
  };

  const handleFileChange = (name: string, file: File | null) => {
    setFormData((p:any) => ({ ...p, [name]: file }));
  };

  // Minimal per-step required fields mapping is in stepsConfig; we'll import it dynamically for validation
  const validateAllSteps = (): { ok: boolean; firstErrorStep?: number; errors?: Record<string,string> } => {
    // iterate steps and check required fields
    for (let i = 0; i < formSteps.length; i++) {
      const key = formSteps[i].key;
      const required: string[] = requiredFieldsByStep[key] || [];
      for (const f of required) {
        const parts = f.split('.');
        let val: any = formData;
        for (const p of parts) val = val ? val[p] : undefined;
        if (val === undefined || val === '' || val === false) {
          return { ok: false, firstErrorStep: i, errors: { [f]: 'This field is required' } };
        }
      }
    }
    return { ok: true };
  };

  // Map local form file keys to DocumentApi document types
  const documentTypeMap: Record<string,string> = {
    idProofUploaded: 'AADHAR_CARD',
    panCardUploaded: 'PAN_CARD',
    addressProofUploaded: 'OTHER',
    photographUploaded: 'OTHER',
    characterCertificateUploaded: 'OTHER',
    medicalCertificateUploaded: 'MEDICAL_REPORT',
    trainingCertificateUploaded: 'TRAINING_CERTIFICATE',
    otherStateLicenseUploaded: 'OTHER_STATE_LICENSE'
  };

  const handleSubmit = async () => {
    // Run client-side validation for all steps
    const validation = validateAllSteps();
    if (!validation.ok) {
      setErrors(validation.errors || {});
      if (typeof validation.firstErrorStep === 'number') setFormStep(validation.firstErrorStep);
      return;
    }

    try {
      setIsSubmitting(true);

      // Build payload: avoid embedding File objects. Shallow copy excluding File entries
      const payload: any = {};
      for (const [k, v] of Object.entries(formData)) {
        // if value is a File, skip here; will upload separately
        if (v instanceof File) continue;
        payload[k] = v;
      }

      // Create application (no files)
      const resp = await createApplication(payload);
      const created = (resp as any)?.data ?? (resp as any)?.body ?? resp;
      const applicationId = String(created?.id || created?.applicationId || created?.data?.id || created?.id || '');

      if (!applicationId) {
        throw new Error('Failed to extract application id from response');
      }

      // Upload files one-by-one using DocumentApi.upload
      const uploadPromises: Promise<any>[] = [];
      for (const [fieldName, docType] of Object.entries(documentTypeMap)) {
        const fileOrFlag = formData[fieldName];
        if (fileOrFlag instanceof File) {
          try {
            uploadPromises.push(DocumentApi.upload(applicationId, fileOrFlag, docType));
          } catch (e) {
            console.warn('Document upload scheduling failed for', fieldName, e);
          }
        }
      }

      // Wait for uploads to finish (if any)
      if (uploadPromises.length > 0) {
        try {
          await Promise.all(uploadPromises);
        } catch (uploadErr) {
          console.warn('Some document uploads failed', uploadErr);
          // Continue - application was created. Surface a message to the caller.
        }
      }

      // Call parent callback
      onSubmit?.(created);
    } catch (err: any) {
      console.error('Create application failed', err);
      alert(err?.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="sticky top-0 w-full z-50 bg-white shadow-sm border-b flex-shrink-0">
        <div className="px-3 sm:px-6 py-1 flex items-center justify-between">
          <button onClick={() => window.history.back()} className="px-4 py-2 bg-gray-400 text-white rounded-md">Back</button>
          <h1 className="text-xl font-bold">Fresh Application Form</h1>
          <div />
        </div>
      </div>

      <div className="flex-1 overflow-hidden px-3 sm:px-6 pt-2 pb-2">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-full overflow-y-auto p-8">
          <form onSubmit={(e)=>{ e.preventDefault(); handleSubmit(); }}>
            <StepComp formData={formData} onChange={handleChange} onFileChange={handleFileChange} errors={errors} />

            <StepNavigation
              onPrev={() => setFormStep(s => Math.max(0, s-1))}
              onNext={() => setFormStep(s => Math.min(steps.length-1, s+1))}
              onSubmit={formStep === steps.length-1 ? handleSubmit : undefined}
              disablePrev={formStep === 0}
              disableNext={formStep >= steps.length-1}
              submitting={isSubmitting}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
  // Note: previous barrel exports were removed during refactor. Keep this file as the
  // canonical FreshApplicationForm entrypoint for the createFreshApplicationForm folder.
