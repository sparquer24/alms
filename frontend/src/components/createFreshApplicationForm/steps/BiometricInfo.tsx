import React from 'react';

const BiometricInfo: React.FC<{ formData:any; onChange:(e:any)=>void }> = ({ formData, onChange }) => (
  <div>
    <h3 className="text-lg font-bold">Biometric Information</h3>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium">Signature (base64)</label>
        <textarea name="signature" value={formData.signature || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </div>

      <div>
        <label className="block text-sm font-medium">Iris Scan (base64)</label>
        <textarea name="irisScan" value={formData.irisScan || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </div>

      <div>
        <label className="block text-sm font-medium">Photograph (base64)</label>
        <textarea name="photograph" value={formData.photograph || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </div>
    </div>
  </div>
);

export default BiometricInfo;
