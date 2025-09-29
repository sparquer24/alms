import React from 'react';

const OccupationBusiness: React.FC<{ formData:any; onChange:(e:any)=>void }> = ({ formData, onChange }) => (
  <div>
    <h3 className="text-lg font-bold">Occupation & Business</h3>
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium">Occupation</label>
        <input name="occupation" value={formData.occupation || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </div>

      <div>
        <label className="block text-sm font-medium">Office / Business Address</label>
        <textarea name="officeBusinessAddress" value={formData.officeBusinessAddress || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </div>

      <div>
        <label className="block text-sm font-medium">Office Business State</label>
        <input name="officeBusinessState" value={formData.officeBusinessState || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </div>

      <div>
        <label className="block text-sm font-medium">Office Business District</label>
        <input name="officeBusinessDistrict" value={formData.officeBusinessDistrict || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </div>

      <div>
        <label className="block text-sm font-medium">Office Phone</label>
        <input name="officePhone" value={formData.officePhone || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </div>

      <div>
        <label className="block text-sm font-medium">Residence Phone</label>
        <input name="residencePhone" value={formData.residencePhone || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </div>

      <div>
        <label className="block text-sm font-medium">Office Mobile</label>
        <input name="officeMobile" value={formData.officeMobile || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </div>

      <div>
        <label className="block text-sm font-medium">Alternative Mobile</label>
        <input name="alternativeMobile" value={formData.alternativeMobile || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </div>

      <div>
        <label className="block text-sm font-medium">Crop Protection Location</label>
        <input name="cropProtectionLocation" value={formData.cropProtectionLocation || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </div>

      <div>
        <label className="block text-sm font-medium">Cultivated Area (in acres)</label>
        <input name="cultivatedArea" value={formData.cultivatedArea || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
      </div>
    </div>
  </div>
);

export default OccupationBusiness;
