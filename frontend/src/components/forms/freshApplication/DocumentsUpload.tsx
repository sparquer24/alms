"use client";
import React, { useState } from 'react';
import { Input, TextArea } from '../elements/Input';
import FormFooter from '../elements/footer';

const initialState = {
	claims: '',
	place: '',
	wildBeasts: '',
};


const DocumentsUpload = () => {
   const [form, setForm] = useState(initialState);
   // State for each document type
   const documentTypes = [
	   'Aadhar Card',
	   'PAN Card',
	   'Training certificate',
	   'Other state Arms License',
	   'Existing Arms License',
	   'Safe custody',
	   'Medical Reports',
   ];
   const [files, setFiles] = useState<{ [key: string]: File[] }>({});
   const [fileError, setFileError] = useState<{ [key: string]: string }>({});

   const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
	   const { name, value } = e.target;
	   setForm((prev) => ({ ...prev, [name]: value }));
   };

   const handleFileChange = (docType: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
	   if (e.target.files) {
		   const newFiles = Array.from(e.target.files as FileList);
		   const tooLarge = newFiles.find(f => f.size > 1024 * 1024); // 1MB
		   if (tooLarge) {
			   setFileError(prev => ({ ...prev, [docType]: 'File size must be less than 1MB' }));
			   return;
		   }
		   setFileError(prev => ({ ...prev, [docType]: '' }));
		   setFiles((prev) => ({
			   ...prev,
			   [docType]: [...(prev[docType] || []), ...newFiles],
		   }));
	   }
   };

   const removeFile = (docType: string, idx: number) => {
	   setFiles((prev) => ({
		   ...prev,
		   [docType]: prev[docType].filter((_, i) => i !== idx),
	   }));
   };

	return (
		<form className="p-6">
			<h2 className="text-xl font-bold mb-4">Documents Upload</h2>
			<div className="mb-6">
				<div className="font-medium mb-2">18. Claims for special consideration for obtaining the license, if any</div>
				<div className="text-xs mb-2">(attach documentary evidence)</div>
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{documentTypes.map((docType) => (
						<div key={docType} className="mb-2 border-2 border-dashed border-blue-300 rounded-lg p-2">
							<div className="font-semibold mb-1">{docType}</div>
							<div className="flex flex-col items-center mb-1">
								<span className="text-blue-500 text-xl mb-1">📤</span>
								<label className="text-blue-700 underline cursor-pointer">
									Browse
									<input
										type="file"
										className="hidden"
										onChange={handleFileChange(docType)}
									/>
								</label>
								   <span className="text-xs text-gray-500">Max 1 MB file allowed</span>
								   {fileError[docType] && <span className="text-xs text-red-500">{fileError[docType]}</span>}
							</div>
							<div className="text-xs text-gray-500 mb-1">Only support .jpg, .png, .svg, and .zip files</div>
							<div className="bg-white rounded-lg p-1">
								{(files[docType] || []).map((file, idx) => (
									<div key={idx} className="flex items-center gap-2 border-b py-1">
										<span className="text-xl">📁</span>
										<span className="flex-1 text-xs">{file.name} <span className="text-gray-400 ml-2">{Math.round(file.size / 1024)}kb</span></span>
										<button type="button" className="text-gray-400 hover:text-red-600" onClick={() => removeFile(docType, idx)}>✕</button>
									</div>
								))}
							</div>
						</div>
					))}
				</div>
			</div>
			<div className="mb-6">
				<div className="font-medium mb-2">19. Details for an application for license in Form IV</div>
				<Input
					label="(a) Place or area for which the licence is sought"
					name="place"
					value={form.place}
					onChange={handleChange}
					placeholder="Enter place or area"
				/>
				<Input
					label="(b) Specification of the wild beasts which are permitted to be destroyed as per the permit granted under the Wild life (Protection) Act, 1972 (53 of 1972) to the applicant"
					name="wildBeasts"
					value={form.wildBeasts}
					onChange={handleChange}
					placeholder="Enter specification"
				/>
			</div>
			<FormFooter />
		</form>
	);
};

export default DocumentsUpload;

