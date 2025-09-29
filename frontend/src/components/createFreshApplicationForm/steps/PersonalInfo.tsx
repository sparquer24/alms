import React from 'react';

interface Props {
  formData: any;
  onChange: (e: React.ChangeEvent<any>) => void;
  errors?: Record<string, string>;
}

const PersonalInfo: React.FC<Props> = ({ formData, onChange, errors = {} }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">Personal Information</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Acknowledgement Number</label>
              <input name="aliceAcknowledgementNumber" value={formData.aliceAcknowledgementNumber || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
            </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">First Name <span className="text-red-500">*</span></label>
          <input name="applicantName" value={formData.applicantName || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors.applicantName ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
          {errors.applicantName && <p className="text-red-500 text-xs mt-1">{errors.applicantName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Middle Name</label>
          <input name="applicantMiddleName" value={formData.applicantMiddleName || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Last Name</label>
          <input name="applicantLastName" value={formData.applicantLastName || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Father / Spouse Name <span className="text-red-500">*</span></label>
          <input name="fatherName" value={formData.fatherName || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors.fatherName ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
          {errors.fatherName && <p className="text-red-500 text-xs mt-1">{errors.fatherName}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mother's Name</label>
          <input name="motherName" value={formData.motherName || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Marital Status</label>
          <select name="maritalStatus" value={formData.maritalStatus || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
            <option value="">Select</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Nationality</label>
          <input name="nationality" value={formData.nationality || 'Indian'} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Gender <span className="text-red-500">*</span></label>
          <select name="applicantGender" value={formData.applicantGender || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors.applicantGender ? 'border-red-500' : 'border-gray-300'} rounded-md`}>
            <option value="">Select</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>
          {errors.applicantGender && <p className="text-red-500 text-xs mt-1">{errors.applicantGender}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Birth <span className="text-red-500">*</span></label>
          <input type="date" name="applicantDateOfBirth" value={formData.applicantDateOfBirth || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors.applicantDateOfBirth ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
          {errors.applicantDateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.applicantDateOfBirth}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Place of Birth</label>
          <input name="placeOfBirth" value={formData.placeOfBirth || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">ID Type</label>
          <select name="applicantIdType" value={formData.applicantIdType || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
            <option value="">Select</option>
            <option value="aadhar">Aadhaar</option>
            <option value="passport">Passport</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">ID Number</label>
          <input name="applicantIdNumber" value={formData.applicantIdNumber || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors.applicantIdNumber ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
          {errors.applicantIdNumber && <p className="text-red-500 text-xs mt-1">{errors.applicantIdNumber}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Aadhaar Number</label>
          <input name="aadharNumber" value={formData.aadharNumber || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">PAN Number</label>
          <input name="panNumber" value={formData.panNumber || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Mobile Number <span className="text-red-500">*</span></label>
          <input name="applicantMobile" value={formData.applicantMobile || ''} onChange={onChange} maxLength={10} className={`mt-1 block w-full p-2 border ${errors.applicantMobile ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
          {errors.applicantMobile && <p className="text-red-500 text-xs mt-1">{errors.applicantMobile}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email <span className="text-red-500">*</span></label>
          <input type="email" name="applicantEmail" value={formData.applicantEmail || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors.applicantEmail ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
          {errors.applicantEmail && <p className="text-red-500 text-xs mt-1">{errors.applicantEmail}</p>}
        </div>
      </div>
    </div>
  );
};

export default PersonalInfo;
