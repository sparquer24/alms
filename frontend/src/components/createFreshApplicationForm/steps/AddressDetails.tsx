import React from 'react';
import { FormData } from './stepsConfig';

const AddressDetails: React.FC<{ formData: Partial<FormData>; onChange: (e:any)=>void; errors?: Record<string,string> }> = ({ formData, onChange, errors = {} }) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold text-gray-800">Address Details</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Present Address <span className="text-red-500">*</span></label>
          <textarea name="presentAddress" value={formData.presentAddress || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors.presentAddress ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
          {errors.presentAddress && <p className="text-red-500 text-xs mt-1">{errors.presentAddress}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Present State <span className="text-red-500">*</span></label>
          <input name="presentState" value={formData.presentState || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors.presentState ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
          {errors.presentState && <p className="text-red-500 text-xs mt-1">{errors.presentState}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Present District <span className="text-red-500">*</span></label>
          <input name="presentDistrict" value={formData.presentDistrict || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors.presentDistrict ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
          {errors.presentDistrict && <p className="text-red-500 text-xs mt-1">{errors.presentDistrict}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Present Pincode <span className="text-red-500">*</span></label>
          <input name="presentPincode" value={(formData as any).presentPincode || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors.presentPincode ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
          {errors.presentPincode && <p className="text-red-500 text-xs mt-1">{errors.presentPincode}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Present Police Station <span className="text-red-500">*</span></label>
          <input name="presentPoliceStation" value={(formData as any).presentPoliceStation || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors.presentPoliceStation ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
          {errors.presentPoliceStation && <p className="text-red-500 text-xs mt-1">{errors.presentPoliceStation}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Jurisdiction Police Station</label>
          <input name="jurisdictionPoliceStation" value={(formData as any).jurisdictionPoliceStation || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors.jurisdictionPoliceStation ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Residing Since</label>
          <input name="residingSince" value={(formData as any).residingSince || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors.residingSince ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
        </div>

        <div className="col-span-1 md:col-span-2">
          <label className="inline-flex items-center">
            <input type="checkbox" name="sameAsPresent" checked={Boolean((formData as any).sameAsPresent)} onChange={onChange} className="mr-2" />
            <span>Permanent address is same as present address</span>
          </label>
        </div>

        {!((formData as any).sameAsPresent) && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700">Permanent Address <span className="text-red-500">*</span></label>
              <textarea name="permanentAddress" value={(formData as any).permanentAddress || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors.permanentAddress ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
              {errors.permanentAddress && <p className="text-red-500 text-xs mt-1">{errors.permanentAddress}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Permanent State <span className="text-red-500">*</span></label>
              <input name="permanentState" value={(formData as any).permanentState || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors.permanentState ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Permanent District <span className="text-red-500">*</span></label>
              <input name="permanentDistrict" value={(formData as any).permanentDistrict || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors.permanentDistrict ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Permanent Pincode</label>
              <input name="permanentPincode" value={(formData as any).permanentPincode || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors.permanentPincode ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Permanent Police Station</label>
              <input name="permanentPoliceStation" value={(formData as any).permanentPoliceStation || ''} onChange={onChange} className={`mt-1 block w-full p-2 border ${errors.permanentPoliceStation ? 'border-red-500' : 'border-gray-300'} rounded-md`} />
            </div>
          </>
        )}

        {/* Contact Numbers */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Office Phone</label>
          <input name="officePhone" value={(formData as any).officePhone || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Residence Phone</label>
          <input name="residencePhone" value={(formData as any).residencePhone || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Office Mobile</label>
          <input name="officeMobile" value={(formData as any).officeMobile || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Alternative Mobile</label>
          <input name="alternativeMobile" value={(formData as any).alternativeMobile || ''} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded-md" />
        </div>
      </div>
    </div>
  );
};

export default AddressDetails;
