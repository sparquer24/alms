'use client';

import React, { useEffect, useState } from 'react';
import { IoMdFemale, IoMdMale } from 'react-icons/io';
import { useSearchParams } from 'next/navigation';

import { Input } from '../elements/Input';
import { useRenewalForm } from './RenewalFormContext';
import { FormDataLoader } from '../../../utils/formDataLoader';

const IoMdMaleFixed = IoMdMale as any;
const IoMdFemaleFixed = IoMdFemale as any;

interface PersonalFormData {
  acknowledgementNo: string;
  firstName: string;
  middleName: string;
  lastName: string;
  filledBy: string;
  parentOrSpouseName: string;
  sex: string;
  placeOfBirth: string;
  dateOfBirth: string;
  panNumber: string;
  aadharNumber: string;
  dobInWords: string;
}

const initialState: PersonalFormData = {
  acknowledgementNo: '',
  firstName: '',
  middleName: '',
  lastName: '',
  filledBy: '',
  parentOrSpouseName: '',
  sex: '',
  placeOfBirth: '',
  dateOfBirth: '',
  panNumber: '',
  aadharNumber: '',
  dobInWords: '',
};

const PersonalInformationRenewal: React.FC = () => {
  const searchParams = useSearchParams();
  const { updateFormData, setApplicantId, setSubmitSuccess, state } = useRenewalForm();
  const applicantId = state.applicantId;

  const [form, setForm] = useState<PersonalFormData>(initialState);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const loadExistingData = async () => {
      if (!applicantId) return;

      setApplicantId(applicantId);
      setLoading(true);
      setLoadError(null);

      try {
        const data = await FormDataLoader.loadAllSections(applicantId);
        if (data.personalInformation) {
          setForm(prev => ({ ...prev, ...data.personalInformation }));
          updateFormData('personalInformation', data.personalInformation);
          setSubmitSuccess('Existing data loaded successfully');
          setTimeout(() => setSubmitSuccess(null), 3000);
        }
      } catch {
        setLoadError('Failed to load existing data.');
      } finally {
        setLoading(false);
      }
    };

    void loadExistingData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicantId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  if (loading) {
    return <div className="p-4 text-center">Loading existing data...</div>;
  }

  if (loadError) {
    return <div className="p-4 text-center text-red-600">{loadError}</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-2">Personal Information</h2>
      </div>

      <div className="grid grid-cols-4 gap-10 mb-4">
        <Input
          label="1. Applicant First Name"
          name="firstName"
          value={form.firstName}
          onChange={handleChange}
          required
        />
        <div className="flex flex-col">
          <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="middleName">
            Applicant Middle Name <span className="text-xs text-gray-400 align-middle">(optional)</span>
          </label>
          <Input label="" name="middleName" value={form.middleName} onChange={handleChange} />
        </div>
        <Input
          label="Applicant Last Name"
          name="lastName"
          value={form.lastName}
          onChange={handleChange}
          required
        />
        <div className="flex flex-col">
          <label htmlFor="filledBy" className="block text-sm font-medium text-gray-700 mb-1">
            Application filled by (ZS name)
          </label>
          <Input label="" name="filledBy" value={form.filledBy} onChange={handleChange} />
        </div>

        <Input
          label="2. Parent/ Spouse Name"
          name="parentOrSpouseName"
          value={form.parentOrSpouseName}
          onChange={handleChange}
          required
        />
        <div className="flex flex-col">
          <span className="block text-sm font-medium text-gray-700 mb-1">3. Sex</span>
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sex"
                value="MALE"
                checked={form.sex === 'MALE'}
                onChange={handleChange}
                suppressHydrationWarning
              />
              Male
              <IoMdMaleFixed className="text-xl" />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="radio"
                name="sex"
                value="FEMALE"
                checked={form.sex === 'FEMALE'}
                onChange={handleChange}
                suppressHydrationWarning
              />
              Female
              <IoMdFemaleFixed className="text-xl" />
            </label>
          </div>
        </div>
        <Input
          label="4. Place of Birth (Nativity)"
          name="placeOfBirth"
          value={form.placeOfBirth}
          onChange={handleChange}
        />
        <div className="flex flex-col">
          <label
            htmlFor="dateOfBirth"
            className="block text-sm font-medium text-gray-700 mb-1 relative group"
          >
            5. Date of birth in Christian era <span className="text-blue-500 cursor-help">ⓘ</span>
            <span className="invisible group-hover:visible absolute left-0 top-full mt-1 w-64 p-2 bg-gray-800 text-white text-xs rounded shadow-lg z-10">
              Must be 21 years old on the date of application
            </span>
          </label>
          <Input label="" name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
        </div>
        <Input
          label="6. PAN"
          name="panNumber"
          value={form.panNumber}
          onChange={handleChange}
          maxLength={10}
        />
        <Input
          label="7. Aadhar Number"
          name="aadharNumber"
          value={form.aadharNumber}
          onChange={handleChange}
          maxLength={12}
        />
        <Input
          label="Date of Birth in Words"
          name="dobInWords"
          value={form.dobInWords}
          onChange={handleChange}
        />
      </div>
    </div>
  );
};

export default PersonalInformationRenewal;
