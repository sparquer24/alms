import React from 'react';

const PreviewStep: React.FC<{ formData:any }> = ({ formData }) => (
  <div>
    <h3 className="text-lg font-bold">Preview</h3>
    <pre className="mt-4 p-4 bg-gray-50 rounded-md text-xs overflow-auto">{JSON.stringify(formData, null, 2)}</pre>
  </div>
);

export default PreviewStep;
