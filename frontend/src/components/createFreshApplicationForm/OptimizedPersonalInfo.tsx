import React from 'react';
import useFreshFormStore from '../../stores/useFreshFormStore';
import PersonalInfo from './PersonalInfo';
import useFileUpload from '../../hooks/useFileUpload';

export default function OptimizedPersonalInfo(){
  const { formData, setField } = useFreshFormStore();
  const { uploads, add } = useFileUpload();

  const setValue = (k:string,v:any) => setField(k,v);

  return (
    <div>
      <PersonalInfo formData={formData} setValue={setValue} errors={{}} />
      <div className="mt-4">
        <label className="block text-sm">Upload Photo (optimized)</label>
        <input type="file" onChange={async (e)=>{ if (e.target.files && e.target.files[0]) await add('photographUploaded', e.target.files[0]); }} />
        {uploads.photographUploaded && <img src={uploads.photographUploaded.preview} alt="preview" className="w-24 h-24 object-cover mt-2" />}
      </div>
    </div>
  );
}
