import React from 'react';

interface Props { name:string; label?:string; value:any; onChange:(e:React.ChangeEvent<HTMLInputElement>)=>void; error?:string }
export default function TextInput({ name, label, value, onChange, error }: Props){
  return (
    <div>
      {label && <label className="block text-sm font-medium">{label}</label>}
      <input name={name} value={value} onChange={onChange} className={`mt-1 block w-full p-2 border ${error? 'border-red-500':'border-gray-300'} rounded`} />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
