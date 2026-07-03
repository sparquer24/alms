// components/ui/FileUpload.tsx
import React from 'react';
import { toast } from 'react-toastify';

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
  variant?: 'default' | 'browseCard';
  hintText?: string;
  disabled?: boolean;
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
  variant = 'default',
  hintText,
  disabled = false,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE_MB = 10;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast.error(`File size exceeds the maximum allowed limit of ${MAX_FILE_SIZE_MB} MB.`);
        // Reset so the same file can be re-selected after correction
        e.target.value = '';
        return;
      }
      onFileSelect(file);
    }
  };

  const handleBrowseClick = () => {
    if (disabled) {
      toast.error('Save the renewal draft first to enable file uploads.');
      return;
    }
    fileInputRef.current?.click();
  };

  if (variant === 'browseCard') {
    return (
      <div className={className}>
        <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>

        <div className="border border-dashed border-sky-300 rounded-md p-3 min-h-[92px] text-center">
          <input
            type="file"
            id={name}
            name={name}
            accept={acceptedTypes}
            onChange={handleFileChange}
            className="hidden"
            ref={fileInputRef}
          />

          {uploaded && fileName ? (
            <div className="flex flex-col items-center">
              <p className="text-xs text-green-700 truncate mb-2">{fileName}</p>
              <span
                className={`cursor-pointer inline-flex items-center px-3 py-1 text-sm ${disabled ? 'text-gray-400 cursor-not-allowed pointer-events-none' : 'text-blue-700 hover:text-blue-900 border border-blue-300 rounded hover:bg-blue-50 transition-colors'}`}
                onClick={handleBrowseClick}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4-4m0 0l4 4m-4-4v12" />
                </svg>
                Replace
              </span>
            </div>
          ) : (
            <span
              className={`cursor-pointer inline-flex flex-col items-center ${disabled ? 'text-gray-400 cursor-not-allowed pointer-events-none' : 'text-blue-700 hover:text-blue-900'}`}
              onClick={handleBrowseClick}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M8 12l4-4m0 0l4 4m-4-4v12" />
              </svg>
              <span className={`underline text-sm mt-1 ${disabled ? 'pointer-events-none' : ''}`}>Browse</span>
              <span className="text-[11px] text-gray-500 mt-1">Max 10 MB per file</span>
            </span>
          )}

          <p className="mt-2 text-[11px] text-gray-500 text-left">{hintText || 'Supported formats: .jpg, .jpeg, .png, .pdf'}</p>
        </div>

        {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
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
          ref={fileInputRef}
        />
        <span
          onClick={handleBrowseClick}
          className={`cursor-pointer inline-flex items-center px-4 py-2 rounded-md transition-colors ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
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
        </span>
        
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