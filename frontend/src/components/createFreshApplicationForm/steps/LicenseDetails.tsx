import React from 'react';

const LicenseDetails: React.FC<{ formData:any; onChange:(e:any)=>void }> = ({ formData, onChange }) => {
  const histories: any[] = formData.licenseHistory || formData.previousApplicationDetails ? [formData.previousApplicationDetails].filter(Boolean) : [];

  const changeHistory = (idx:number, field:string, value:any) => {
    const next = [...histories];
    next[idx] = { ...next[idx], [field]: value };
    onChange({ target: { name: 'licenseHistory', value: next } });
  };

  const addHistory = () => {
    const next = [...histories, { previousLicenseNumber: '', issueDate: '', expiry: '', issuingAuthority: '' }];
    onChange({ target: { name: 'licenseHistory', value: next } });
  };

  return (
    <div>
      <h3 className="text-lg font-bold">License Details</h3>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Application Type</label>
          <select name="applicationType" value={formData.applicationType || 'New License'} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md">
            <option value="New License">New License</option>
            <option value="Renewal">Renewal</option>
            <option value="Replacement">Replacement</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Weapon Type <span className="text-red-500">*</span></label>
          <input name="weaponType" value={formData.weaponType || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium">Weapon ID (if specific)</label>
          <input name="weaponId" value={formData.weaponId || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium">Reason / Purpose for Weapon <span className="text-red-500">*</span></label>
          <input name="weaponReason" value={formData.weaponReason || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium">License Validity (years)</label>
          <input name="licenseValidity" value={formData.licenseValidity || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium">License Type</label>
          <input name="licenseType" value={formData.licenseType || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="inline-flex items-center">
            <input type="checkbox" name="hasPreviousLicense" checked={Boolean(formData.hasPreviousLicense)} onChange={(e:any)=>onChange({ target: { name: 'hasPreviousLicense', value: e.target.checked } })} className="mr-2" />
            <span>Have you held a license previously?</span>
          </label>
        </div>
      </div>

      <div className="mt-4">
        <h4 className="font-medium">Previous Licenses</h4>
        {histories.map((h:any, idx:number) => (
          <div key={idx} className="border p-3 rounded-md mt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <label className="block text-sm">Previous License Number</label>
                <input value={h.previousLicenseNumber || ''} onChange={(e)=>changeHistory(idx, 'previousLicenseNumber', e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm">Issue Date</label>
                <input type="date" value={h.issueDate || ''} onChange={(e)=>changeHistory(idx, 'issueDate', e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm">Expiry Date</label>
                <input type="date" value={h.expiry || ''} onChange={(e)=>changeHistory(idx, 'expiry', e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm">Issuing Authority</label>
                <input value={h.issuingAuthority || ''} onChange={(e)=>changeHistory(idx, 'issuingAuthority', e.target.value)} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
              </div>
            </div>
          </div>
        ))}

        <div className="mt-3">
          <button type="button" onClick={addHistory} className="px-3 py-1 bg-blue-600 text-white rounded-md">Add Previous License</button>
        </div>
      </div>
    </div>
  );
};

export default LicenseDetails;
