import React from 'react';
interface Props { onFile: (file:File)=>void; accept?:string }
export default function FileUpload({ onFile, accept='image/*,application/pdf' }: Props){
  return (
    <input type="file" accept={accept} onChange={(e)=>{ if (e.target.files && e.target.files[0]) onFile(e.target.files[0]); }} />
  );
}
