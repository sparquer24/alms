import React from 'react';
interface Props { name:string; label?:string; value:any; onChange:(e:React.ChangeEvent<HTMLSelectElement>)=>void; options:{value:any,label:string}[] }
export default function SelectInput({ name, label, value, onChange, options }: Props){
  return (
    <div>
      {label && <label className="block text-sm font-medium">{label}</label>}
      <select name={name} value={value} onChange={onChange} className="mt-1 block w-full p-2 border border-gray-300 rounded">
        <option value="">Select</option>
        {options.map((o,i)=>(<option key={i} value={o.value}>{o.label}</option>))}
      </select>
    </div>
  );
}
