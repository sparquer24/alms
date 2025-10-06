// components/ui/FileUpload.tsx
import React from 'react';

interface FileUploadProps {
  label: string;
  name: string;
  acceptedTypes?: string;
  onFileSelect: (file: File) => void;
  required?: boolean;
  error?: string;
  uploaded?: boolean;
  fileName?: string;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  label,
  name,
  acceptedTypes = '.pdf,.jpg,.jpeg,.png',
  onFileSelect,
  required = false,
  error,
  uploaded = false,
  fileName,
  className = '',
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className={className}>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center transition-colors hover:border-gray-400">
        <input
          type="file"
          id={name}
          name={name}
          accept={acceptedTypes}
          onChange={handleFileChange}
          className="hidden"
        />
        <label
          htmlFor={name}
          className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
            />
          </svg>
          {uploaded ? 'Replace File' : 'Upload File'}
        </label>
        
        {uploaded && fileName && (
          <div className="mt-3 flex items-center justify-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-green-500 mr-2" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2" 
                d="M5 13l4 4L19 7" 
              />
            </svg>
            <span className="text-sm text-gray-600 truncate max-w-xs">
              {fileName}
            </span>
          </div>
        )}
      </div>
      
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};