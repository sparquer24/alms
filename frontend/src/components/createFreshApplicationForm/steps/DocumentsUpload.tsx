import React from 'react';

const DocumentsUpload: React.FC<{ formData:any; onFileChange:(name:string,file:File|null)=>void }> = ({ formData, onFileChange }) => {
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    onFileChange(e.target.name, f);
  };

  return (
    <div>
      <h3 className="text-lg font-bold">Documents Upload</h3>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm">Aadhaar / ID Proof</label>
          <input type="file" name="idProofUploaded" accept="image/*,application/pdf" onChange={handle} />
          {formData?.idProofUploaded && typeof formData.idProofUploaded !== 'boolean' && (<p className="text-sm text-gray-600 mt-1">Selected: {formData.idProofUploaded.name}</p>)}
        </div>
        <div>
          <label className="block text-sm">Address Proof</label>
          <input type="file" name="addressProofUploaded" accept="image/*,application/pdf" onChange={handle} />
          {formData?.addressProofUploaded && typeof formData.addressProofUploaded !== 'boolean' && (<p className="text-sm text-gray-600 mt-1">Selected: {formData.addressProofUploaded.name}</p>)}
        </div>
        <div>
          <label className="block text-sm">Photograph</label>
          <input type="file" name="photographUploaded" accept="image/*,application/pdf" onChange={handle} />
          {formData?.photographUploaded && typeof formData.photographUploaded !== 'boolean' && (<p className="text-sm text-gray-600 mt-1">Selected: {formData.photographUploaded.name}</p>)}
        </div>

        <div>
          <label className="block text-sm">PAN Card</label>
          <input type="file" name="panCardUploaded" accept="image/*,application/pdf" onChange={handle} />
          {formData?.panCardUploaded && typeof formData.panCardUploaded !== 'boolean' && (<p className="text-sm text-gray-600 mt-1">Selected: {formData.panCardUploaded.name}</p>)}
        </div>

        <div>
          <label className="block text-sm">Character Certificate</label>
          <input type="file" name="characterCertificateUploaded" accept="image/*,application/pdf" onChange={handle} />
          {formData?.characterCertificateUploaded && typeof formData.characterCertificateUploaded !== 'boolean' && (<p className="text-sm text-gray-600 mt-1">Selected: {formData.characterCertificateUploaded.name}</p>)}
        </div>

        <div>
          <label className="block text-sm">Medical Certificate</label>
          <input type="file" name="medicalCertificateUploaded" accept="image/*,application/pdf" onChange={handle} />
          {formData?.medicalCertificateUploaded && typeof formData.medicalCertificateUploaded !== 'boolean' && (<p className="text-sm text-gray-600 mt-1">Selected: {formData.medicalCertificateUploaded.name}</p>)}
        </div>

        <div>
          <label className="block text-sm">Training Certificate</label>
          <input type="file" name="trainingCertificateUploaded" accept="image/*,application/pdf" onChange={handle} />
          {formData?.trainingCertificateUploaded && typeof formData.trainingCertificateUploaded !== 'boolean' && (<p className="text-sm text-gray-600 mt-1">Selected: {formData.trainingCertificateUploaded.name}</p>)}
        </div>

        <div>
          <label className="block text-sm">Other State License</label>
          <input type="file" name="otherStateLicenseUploaded" accept="image/*,application/pdf" onChange={handle} />
          {formData?.otherStateLicenseUploaded && typeof formData.otherStateLicenseUploaded !== 'boolean' && (<p className="text-sm text-gray-600 mt-1">Selected: {formData.otherStateLicenseUploaded.name}</p>)}
        </div>
      </div>
    </div>
  );
};

export default DocumentsUpload;
