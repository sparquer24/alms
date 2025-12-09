"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Input, TextArea } from '../elements/Input';
import FormFooter from '../elements/footer';
import { FileUploadService } from '../../../api/fileUploadService';
import { getFileTypeFromDisplayName, validateFileForDocumentType, DOCUMENT_TYPE_MAPPING } from '../../../config/documentTypes';
import { useApplicationForm } from '../../../hooks/useApplicationForm';
import { FORM_ROUTES } from '../../../config/formRoutes';

type UploadedFile = {
	file: File;
	uploading?: boolean;
	uploaded?: boolean;
	uploadId?: string | number;
	serverSize?: number; // size reported by server in bytes
	error?: string;
};

const initialState = {
	claims: '',
};

const DocumentsUpload = () => {
   const router = useRouter();
   
   // Use the application form hook for proper state management and navigation
   const {
       form,
       setForm,
       applicantId,
		almsLicenseId,
       isSubmitting,
       submitError,
       submitSuccess,
       isLoading,
       saveFormData,
       navigateToNext,
       loadExistingData,
   } = useApplicationForm({
       initialState,
       formSection: 'license-details', // Use existing formSection type
   });
   
   // Get application ID from hook (which reads from URL params)
   const applicationId = applicantId;
   
   // State for each document type
   const documentTypes = [
	   'Aadhar Card',
	   'PAN Card',
	   'Training certificate',
	   'Medical Reports',
	   'Other state Arms License',
	   'Existing Arms License',
	   'Safe custody'
   ];
   // Documents that are mandatory before proceeding
   const requiredDocuments = ['Aadhar Card'];
   const [files, setFiles] = useState<{ [key: string]: UploadedFile[] }>({});
   const [fileError, setFileError] = useState<{ [key: string]: string }>({});

	 // Create reverse mapping from backend fileType -> display name
	 const fileTypeToDisplay: Record<string, string> = {};
	 documentTypes.forEach(dt => {
		 const config = DOCUMENT_TYPE_MAPPING[dt];
		 if (config) {
			 fileTypeToDisplay[config.fileType] = dt;
		 }
	 });

	 // Hydrate files for an application from server when applicationId becomes available
	 useEffect(() => {
		 const loadUploadedFiles = async () => {
			 if (!applicationId) return;
			 try {
				 const serverFiles = await FileUploadService.getFiles(applicationId);
				 console.debug('[DocumentsUpload] loaded server files:', serverFiles);
				 const grouped: { [key: string]: UploadedFile[] } = {};
				 (serverFiles || []).forEach((f: any) => {
					 const displayName = fileTypeToDisplay[f.fileType] || f.fileType || 'Other';
					 console.debug('[DocumentsUpload] mapping server file', f.id, 'type:', f.fileType, '->', displayName);
					 // create a lightweight File for UI display (empty blob)
					 const blob = new Blob([], { type: f.contentType || 'application/octet-stream' });
					 const fileObj = new File([blob], f.fileName || `file-${f.id}`, { type: f.contentType || 'application/octet-stream' });
					 const uploadedFile: UploadedFile = {
						 file: fileObj,
						 uploadId: f.id,
						 uploading: false,
						 uploaded: true,
						 serverSize: f.fileSize,
					 };
					 grouped[displayName] = [...(grouped[displayName] || []), uploadedFile];
				 });

				 // Merge server-side files with any local (unsaved) files; local wins
				 setFiles(prev => ({ ...grouped, ...prev }));
			 } catch (err) {
				 // swallow errors for now - could set a file loading error state
			 }
		 };

		 loadUploadedFiles();
	 }, [applicationId]);

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
	   const { name, value } = e.target;
	   setForm((prev: any) => ({ ...prev, [name]: value }));
   };

   const handleFileChange = (docType: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
	   if (e.target.files && applicationId) {
		   const newFiles = Array.from(e.target.files as FileList);
		   
		   for (const file of newFiles) {
			   // Validate file
			   const validation = validateFileForDocumentType(file, docType);
			   if (!validation.isValid) {
				   setFileError(prev => ({ ...prev, [docType]: validation.error || 'Invalid file' }));
				   continue;
			   }

			   // Clear any previous errors
			   setFileError(prev => ({ ...prev, [docType]: '' }));

			   // Create UploadedFile object with uploading state
			   const uploadedFile: UploadedFile = {
				   file,
				   uploading: true,
				   uploaded: false,
			   };

			   // Add to files state immediately to show uploading status
			   setFiles((prev) => ({
				   ...prev,
				   [docType]: [...(prev[docType] || []), uploadedFile],
			   }));

			   try {
				   // Get FileType enum value
				   const fileType = getFileTypeFromDisplayName(docType);
				   
				   // Upload file
				   const response = await FileUploadService.uploadFile(
					   applicationId,
					   file,
					   fileType,
					   `${docType} document`
				   );

				   // Update file state with success
				   setFiles((prev) => ({
					   ...prev,
					   [docType]: prev[docType].map((f) =>
						   f.file === file
							   ? { ...f, uploading: false, uploaded: true, uploadId: response.data.id }
							   : f
					   ),
				   }));
			   } catch (error: any) {
				   // Update file state with error
				   setFiles((prev) => ({
					   ...prev,
					   [docType]: prev[docType].map((f) =>
						   f.file === file
							   ? { ...f, uploading: false, uploaded: false, error: error.message || 'Upload failed' }
							   : f
					   ),
				   }));

				   setFileError(prev => ({ 
					   ...prev, 
					   [docType]: error.message || 'Upload failed' 
				   }));
			   }
		   }
	   } else if (!applicationId) {
		   setFileError(prev => ({ 
			   ...prev, 
			   [docType]: 'Application ID not found. Please save previous steps first.' 
		   }));
	   }
   };

   const removeFile = async (docType: string, idx: number) => {
	   const fileToRemove = files[docType]?.[idx];
	   if (!fileToRemove) return;

	   // If file was uploaded to server, try to delete it
	   if (fileToRemove.uploaded && fileToRemove.uploadId) {
		   try {
			   // Ensure uploadId is a number before calling deleteFile
			   const parsedId = typeof fileToRemove.uploadId === 'number'
				   ? fileToRemove.uploadId
				   : parseInt(String(fileToRemove.uploadId), 10);

			   if (!isNaN(parsedId)) {
				   await FileUploadService.deleteFile(parsedId);
			   }
		   } catch (error) {
			   // Continue with local removal even if server deletion fails
		   }
	   }

	   // Remove from local state
	   setFiles((prev) => ({
		   ...prev,
		   [docType]: prev[docType].filter((_, i) => i !== idx),
	   }));
   };

	// Navigation handlers
	const handleSaveToDraft = async () => {
		await saveFormData();
	};

	const handleNext = async () => {
		// Ensure required documents are uploaded (uploaded === true)
		for (const req of requiredDocuments) {
			const docFiles = files[req] || [];
			const uploadedCount = docFiles.filter(f => f.uploaded).length;
			if (uploadedCount === 0) {
				setFileError(prev => ({ ...prev, [req]: 'This document is required before proceeding.' }));
				// Focus is optional: user will see the error under the doc
				return;
			}
		}

		const savedApplicantId = await saveFormData();

		if (savedApplicantId) {
			navigateToNext(FORM_ROUTES.PREVIEW, savedApplicantId);
		} else {
		}
	};

	const handlePrevious = async () => {
		if (applicantId) {
			await loadExistingData(applicantId);
			// Biometric step removed - go back to license details
			navigateToNext(FORM_ROUTES.LICENSE_DETAILS, applicantId);
		} else {
			router.back();
		}
	};

	// Show loading state if data is being loaded
	if (isLoading) {
		return (
			<div className="p-6">
				<h2 className="text-xl font-bold mb-4">Documents Upload</h2>
				<div className="flex justify-center items-center py-8">
					<div className="text-gray-500">Loading...</div>
				</div>
			</div>
		);
	}

	return (
		<form className="p-6">
			<h2 className="text-xl font-bold mb-4">Documents Upload</h2>
			
		{/* Display Application ID and License ID if available */}
		{(applicationId || almsLicenseId) && (
			<div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded flex justify-between items-center">
				<div className="flex flex-col">
					{/* <strong>Application ID: {applicationId ?? '—'}</strong> */}
					{almsLicenseId && <strong className='text-sm'>License ID: {almsLicenseId}</strong>}
				</div>
				{typeof loadExistingData === 'function' && (
					<button
						type='button'
						onClick={() => applicationId && loadExistingData(applicationId)}
						disabled={isLoading}
						className='px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
					>
						{isLoading ? 'Loading...' : 'Refresh Data'}
					</button>
				)}
			</div>
		)}			{/* Display success/error messages */}
			{submitSuccess && (
				<div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
					{submitSuccess}
				</div>
			)}
			{submitError && (
				<div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
					{submitError}
				</div>
			)}

			{/* Documents Summary */}
			{Object.keys(files).length > 0 && (
				<div className="mb-4 p-3 bg-gray-100 border border-gray-300 rounded">
					<div className="text-sm font-medium text-gray-700 mb-2">Upload Summary:</div>
					{documentTypes.map((docType) => {
						const docFiles = files[docType] || [];
						const uploadedCount = docFiles.filter(f => f.uploaded).length;
						const uploadingCount = docFiles.filter(f => f.uploading).length;
						const errorCount = docFiles.filter(f => f.error).length;
						
						if (docFiles.length === 0) return null;
						
						return (
							<div key={docType} className="text-xs text-gray-600 flex justify-between">
								<span>{docType}:</span>
								<span>
									{uploadedCount > 0 && <span className="text-green-600">{uploadedCount} uploaded</span>}
									{uploadingCount > 0 && <span className="text-blue-600 ml-2">{uploadingCount} uploading</span>}
									{errorCount > 0 && <span className="text-red-600 ml-2">{errorCount} failed</span>}
								</span>
							</div>
						);
					})}
				</div>
			)}
			<div className="mb-6">
				<div className="font-medium mb-2">18. Claims for special consideration for obtaining the license, if any</div>
				<div className="text-xs mb-2">(attach documentary evidence)</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{documentTypes.map((docType) => (
						<div key={docType} className="mb-2 border-2 border-dashed border-blue-300 rounded-lg p-2">
									<div className="font-semibold mb-1">
										{docType}
										{requiredDocuments.includes(docType) ? (
											<span className="ml-1 text-xs text-red-600 align-middle">(required)</span>
										) : (
											['Other state Arms License', 'Existing Arms License', 'Safe custody'].includes(docType) && (
												<span className="ml-1 text-xs text-gray-400 align-middle">(optional)</span>
											)
										)}
									</div>
							<div className="flex flex-col items-center mb-1">
								<span className="text-blue-500 text-xl mb-1">📤</span>
								<label className="text-blue-700 underline cursor-pointer">
									Browse
									<input
										type="file"
										className="hidden"
										accept=".jpg,.jpeg,.png,.pdf"
										multiple
										onChange={handleFileChange(docType)}
									/>
								</label>
								   <span className="text-xs text-gray-500">Max 10 MB per file</span>
								   {fileError[docType] && (
									   <span className="text-xs text-red-500">{fileError[docType]}</span>
								   )}
							</div>
							<div className="text-xs text-gray-500 mb-1">Supported formats: .jpg, .jpeg, .png, .pdf</div>
							{/* Error message for file size/type is now always from validation, not hardcoded */}
							<div className="bg-white rounded-lg p-1">
								{(files[docType] || []).map((uploadedFile, idx) => (
									<div key={idx} className="flex items-center gap-2 border-b py-1">
										<div className="flex items-center gap-2">
											{uploadedFile.uploading ? (
												<span className="text-xl animate-spin">⏳</span>
											) : uploadedFile.uploaded ? (
												<span className="text-xl text-green-500">✅</span>
											) : uploadedFile.error ? (
												<span className="text-xl text-red-500">❌</span>
											) : (
												<span className="text-xl">📁</span>
											)}
										</div>
										<div className="flex-1">
											<span className="text-xs">{uploadedFile.file.name}</span>
											<span className="text-gray-400 ml-2 text-xs">
												{Math.round(((uploadedFile.serverSize ?? uploadedFile.file.size) || 0) / 1024)}kb
											</span>
											{uploadedFile.uploading && (
												<span className="text-blue-500 ml-2 text-xs">Uploading...</span>
											)}
											{uploadedFile.uploaded && (
												<span className="text-green-500 ml-2 text-xs">Uploaded</span>
											)}
											{uploadedFile.error && (
												<span className="text-red-500 ml-2 text-xs">{uploadedFile.error}</span>
											)}
										</div>
										<button 
											type="button" 
											className="text-gray-400 hover:text-red-600" 
											onClick={() => removeFile(docType, idx)}
											disabled={uploadedFile.uploading}
										>
											✕
										</button>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
			<FormFooter
				onSaveToDraft={handleSaveToDraft}
				onNext={handleNext}
				onPrevious={handlePrevious}
				isLoading={isSubmitting}
			/>
		</form>
	);
};

export default DocumentsUpload;

