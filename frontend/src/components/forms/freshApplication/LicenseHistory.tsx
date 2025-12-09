"use client";
import React, { useState, useEffect } from 'react';
import { Input, TextArea } from '../elements/Input';
import { Checkbox } from '../elements/Checkbox';
import FormFooter from '../elements/footer';
import { WeaponsService, Weapon } from '../../../services/weapons';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApplicationForm } from '../../../hooks/useApplicationForm';
import { FORM_ROUTES } from '../../../config/formRoutes';
import FileUploadService from '../../../services/fileUploadService';

const initialFamily = { name: '', licenseNumber: '', weapons: [0] }; // Use weapon IDs instead of strings

const initialState = {
	licenseHistories: [] as any[],
};

const LicenseHistory = () => {
	const [appliedBefore, setAppliedBefore] = useState('no');
	const [appliedDetails, setAppliedDetails] = useState({ date: '', authority: '', result: '' });
	const [rejectedFiles, setRejectedFiles] = useState<File[]>([]);
	const [fileError, setFileError] = useState<string>('');
	const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
	const [uploading, setUploading] = useState<boolean>(false);
	const [uploadProgress, setUploadProgress] = useState<Record<string, boolean>>({});
	const [suspended, setSuspended] = useState('no');
	const [suspendedDetails, setSuspendedDetails] = useState({ authority: '', reason: '' });
	const [family, setFamily] = useState('no');
	const [familyDetails, setFamilyDetails] = useState([{ ...initialFamily }]);
	const [safePlace, setSafePlace] = useState('no');
	const [safePlaceDetails, setSafePlaceDetails] = useState('');
	const [training, setTraining] = useState('no');
	const [trainingDetails, setTrainingDetails] = useState('');
	const [weapons, setWeapons] = useState<Weapon[]>([]);
	const [loadingWeapons, setLoadingWeapons] = useState(false);
	
	// Add flag to prevent backend data from overwriting fresh form data
	const [isUpdatingForm, setIsUpdatingForm] = useState(false);

	const router = useRouter();
	
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
		setSubmitError,
		setSubmitSuccess,
	} = useApplicationForm({
		initialState,
		formSection: 'license-history',
	});

	// Load existing data into local state when form data changes
	useEffect(() => {
		// Skip loading if we're currently updating the form to prevent overwriting
		if (isUpdatingForm) {
			return;
		}
		
		if (form.licenseHistories && form.licenseHistories.length > 0) {
			const history = form.licenseHistories[0]; // Get the first license history record
			// Map backend data to local state
			if (history.hasAppliedBefore !== undefined) {
				setAppliedBefore(history.hasAppliedBefore ? 'yes' : 'no');
				
				if (history.hasAppliedBefore && (history.dateAppliedFor || history.previousAuthorityName || history.previousResult)) {
					setAppliedDetails({
						date: history.dateAppliedFor ? history.dateAppliedFor.split('T')[0] : '',
						authority: history.previousAuthorityName || '',
						result: history.previousResult?.toLowerCase() || ''
					});
				}
			}
			
			if (history.hasLicenceSuspended !== undefined) {
				setSuspended(history.hasLicenceSuspended ? 'yes' : 'no');
				
				if (history.hasLicenceSuspended && (history.suspensionAuthorityName || history.suspensionReason)) {
					setSuspendedDetails({
						authority: history.suspensionAuthorityName || '',
						reason: history.suspensionReason || ''
					});
				}
			}
			
			if (history.hasFamilyLicence !== undefined) {
				setFamily(history.hasFamilyLicence ? 'yes' : 'no');
				
				if (history.hasFamilyLicence && (history.familyMemberName || history.familyLicenceNumber || history.familyWeaponsEndorsed)) {
					// Map weapon names back to IDs
					const weaponIds = (history.familyWeaponsEndorsed || []).map((weaponName: string) => {
						const weapon = weapons.find(w => w.name === weaponName);
						return weapon ? weapon.id : 0;
					}).filter((id: number) => id !== 0);
					
					setFamilyDetails([{
						name: history.familyMemberName || '',
						licenseNumber: history.familyLicenceNumber || '',
						weapons: weaponIds.length > 0 ? weaponIds : [0]
					}]);
				}
			}
			
			if (history.hasSafePlace !== undefined) {
				setSafePlace(history.hasSafePlace ? 'yes' : 'no');
				if (history.hasSafePlace && history.safePlaceDetails) {
					setSafePlaceDetails(history.safePlaceDetails);
				}
			}
			
			if (history.hasTraining !== undefined) {
				setTraining(history.hasTraining ? 'yes' : 'no');
				if (history.hasTraining && history.trainingDetails) {
					setTrainingDetails(history.trainingDetails);
				}
			}
		}
	}, [form.licenseHistories, weapons, isUpdatingForm]); // Include isUpdatingForm in dependency array

	// Fetch weapons on component mount
	useEffect(() => {
		const loadWeapons = async () => {
			try {
				setLoadingWeapons(true);
				const list = await WeaponsService.getAll();
				const items = (list || []).map(w => ({ id: w.id, name: w.name })) as Weapon[];
				setWeapons(items);
			} catch (e) {
				// Fallback weapons if API fails
				setWeapons([
					{ id: 1, name: 'Pistol' },
					{ id: 2, name: 'Revolver' },
					{ id: 3, name: 'Rifle' },
					{ id: 4, name: 'Shotgun' },
				]);
			} finally {
				setLoadingWeapons(false);
			}
		};
		loadWeapons();
	}, []);

	const handleAppliedDetails = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setAppliedDetails(prev => ({ ...prev, [name]: value }));
	};

	const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = e.target.files;
		setFileError('');
		
		if (!files || files.length === 0) return;
		
		const newFiles: File[] = [];
		const maxSize = 5 * 1024 * 1024; // 5MB
		
		for (let i = 0; i < files.length; i++) {
			const file = files[i];
			
			// Check file size
			if (file.size > maxSize) {
				setFileError(`File "${file.name}" exceeds 5MB size limit`);
				return;
			}
			
			// Validate file type
			const validation = FileUploadService.validateFile(file);
			if (!validation.isValid) {
				setFileError(`File "${file.name}": ${validation.error}`);
				return;
			}
			
			// Check if file already exists
			const isDuplicate = rejectedFiles.some(existingFile => 
				existingFile.name === file.name && existingFile.size === file.size
			);
			
			if (!isDuplicate) {
				newFiles.push(file);
			}
		}
		
		if (newFiles.length > 0) {
			// Add files to local state first
			setRejectedFiles(prev => [...prev, ...newFiles]);
			
			// Upload files if applicationId is available
			if (applicantId) {
				await uploadFiles(newFiles);
			}
		}
		
		// Clear the input so the same file can be selected again if needed
		e.target.value = '';
	};

	const uploadFiles = async (files: File[]) => {
		if (!applicantId) {
			return;
		}

		setUploading(true);
		
		try {
			const uploadPromises = files.map(async (file) => {
				const fileKey = `${file.name}_${file.size}`;
				setUploadProgress(prev => ({ ...prev, [fileKey]: true }));
				
				try {
					const result = await FileUploadService.uploadFileWithStorage(
						Number(applicantId),
						file,
						'REJECTED_LICENSE', // Specific file type for rejected license documents
					);
					setUploadProgress(prev => ({ ...prev, [fileKey]: false }));
					return result;
				} catch (error) {
					setUploadProgress(prev => ({ ...prev, [fileKey]: false }));
					throw error;
				}
			});

			const results = await Promise.allSettled(uploadPromises);
			
			const successful = results
				.filter(result => result.status === 'fulfilled')
				.map(result => (result as PromiseFulfilledResult<any>).value);
			
			const failed = results
				.filter(result => result.status === 'rejected')
				.map(result => (result as PromiseRejectedResult).reason);

			if (successful.length > 0) {
				setUploadedFiles(prev => [...prev, ...successful]);
				// Show success message
				setSubmitSuccess(`Successfully uploaded ${successful.length} file(s)`);
				setTimeout(() => setSubmitSuccess(''), 3000);
			}

			if (failed.length > 0) {
				setFileError(`Failed to upload ${failed.length} file(s). Please try again.`);
			}

		} catch (error) {
			setFileError('Failed to upload files. Please try again.');
		} finally {
			setUploading(false);
		}
	};

	// Retry upload for files that haven't been uploaded yet
	const retryUploads = async () => {
		if (!applicantId) {
			setFileError('Please save your application data first');
			return;
		}

		const pendingFiles = rejectedFiles.filter(file => 
			!uploadedFiles.some(uploaded => uploaded.fileName === file.name)
		);

		if (pendingFiles.length > 0) {
			await uploadFiles(pendingFiles);
		}
	};

	const removeFile = (index: number) => {
		const fileToRemove = rejectedFiles[index];
		if (fileToRemove) {
			// Remove from local files array
			setRejectedFiles(prev => prev.filter((_, i) => i !== index));
			
			// Remove from uploaded files array if it was uploaded
			setUploadedFiles(prev => prev.filter(uploaded => uploaded.fileName !== fileToRemove.name));
			
			// Clean up upload progress
			const fileKey = `${fileToRemove.name}_${fileToRemove.size}`;
			setUploadProgress(prev => {
				const newProgress = { ...prev };
				delete newProgress[fileKey];
				return newProgress;
			});
		}
		
		setFileError('');
	};

	const handleSuspendedDetails = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setSuspendedDetails(prev => ({ ...prev, [name]: value }));
	};

	const handleFamilyDetails = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFamilyDetails(prev => prev.map((fam, i) => i === idx ? { ...fam, [name]: value } : fam));
	};

	const handleWeaponChange = (famIdx: number, weapIdx: number, e: React.ChangeEvent<HTMLSelectElement>) => {
		const weaponId = parseInt(e.target.value);
		setFamilyDetails(prev => prev.map((fam, i) => 
			i === famIdx ? { ...fam, weapons: fam.weapons.map((w, wi) => wi === weapIdx ? weaponId : w) } : fam
		));
	};

	const addWeapon = (famIdx: number) => {
		setFamilyDetails(prev => prev.map((fam, i) => 
			i === famIdx ? { ...fam, weapons: [...fam.weapons, 0] } : fam
		));
	};

	const removeWeapon = (famIdx: number, weapIdx: number) => {
		setFamilyDetails(prev => prev.map((fam, i) => 
			i === famIdx ? { ...fam, weapons: fam.weapons.filter((_, wi) => wi !== weapIdx) } : fam
		));
	};

	const removeFamily = (idx: number) => setFamilyDetails(prev => prev.filter((_, i) => i !== idx));

	// Show loading state if data is being loaded
	if (isLoading) {
		return (
			<div className="p-6">
				<h2 className="text-xl font-bold mb-4">License History</h2>
				<div className="flex justify-center items-center py-8">
					<div className="text-gray-500">Loading...</div>
				</div>
			</div>
		);
	}

	const transformFormData = () => {
		// Transform to new API format matching the exact backend payload structure
		return [{
			hasAppliedBefore: appliedBefore === 'yes',
			dateAppliedFor: appliedBefore === 'yes' && appliedDetails.date ? new Date(appliedDetails.date).toISOString() : null,
			previousAuthorityName: appliedBefore === 'yes' ? appliedDetails.authority || null : null,
			previousResult: appliedBefore === 'yes' ? appliedDetails.result?.toUpperCase() || null : null,
			rejectedLicenseFiles: appliedDetails.result === 'rejected' ? rejectedFiles.map(file => ({
				name: file.name,
				size: file.size,
				type: file.type
			})) : [],
			hasLicenceSuspended: suspended === 'yes',
			suspensionAuthorityName: suspended === 'yes' ? suspendedDetails.authority || null : null,
			suspensionReason: suspended === 'yes' ? suspendedDetails.reason || null : null,
			hasFamilyLicence: family === 'yes',
			familyMemberName: family === 'yes' && familyDetails.length > 0 ? familyDetails[0].name || null : null,
			familyLicenceNumber: family === 'yes' && familyDetails.length > 0 ? familyDetails[0].licenseNumber || null : null,
			familyWeaponsEndorsed: family === 'yes' && familyDetails.length > 0 
				? familyDetails[0].weapons
					.filter(weaponId => weaponId !== 0) // Filter out unselected weapons
					.map(weaponId => {
						const weapon = weapons.find(w => w.id === weaponId);
						return weapon ? weapon.name : null;
					})
					.filter(Boolean) // Remove null values
				: [],
			hasSafePlace: safePlace === 'yes',
			safePlaceDetails: safePlace === 'yes' ? safePlaceDetails || null : null,
			hasTraining: training === 'yes',
			trainingDetails: training === 'yes' ? trainingDetails || null : null,
		}];
	};

	const handleSaveToDraft = async () => {
		// Debug current state before transformation
		// Transform local state to API format before saving
		const licenseHistories = transformFormData();
		
		// Log the payload being sent
		// Set flag to prevent useEffect from overwriting our data
		setIsUpdatingForm(true);
		
		// Instead of using setForm which might get overridden, pass the data directly
		// Create the form data structure that includes the license histories
		const formDataToSave = {
			...form,
			licenseHistories
		};
		
		// Add debugging to see what's in the form state right before save
		// Also update the form state for UI consistency
		setForm((prev: any) => ({ ...prev, licenseHistories }));
		
		// Pass the correct license histories directly to saveFormData to avoid timing issues
		const savedApplicantId = await saveFormData(undefined, formDataToSave);
		
		// If we have pending files and now have an application ID, upload them
		if (savedApplicantId && rejectedFiles.length > 0) {
			const pendingFiles = rejectedFiles.filter(file => 
				!uploadedFiles.some(uploaded => uploaded.fileName === file.name)
			);
			
			if (pendingFiles.length > 0) {
				await uploadFiles(pendingFiles);
			}
		}
		
		// Reset flag after a delay to allow for data loading
		setTimeout(() => setIsUpdatingForm(false), 1000);
	};

	const handleNext = async () => {
		// Debug current state before transformation
		// Transform local state to API format before saving
		const licenseHistories = transformFormData();
		
		// Log the payload being sent
		// Set flag to prevent useEffect from overwriting our data
		setIsUpdatingForm(true);
		
		// Instead of using setForm which might get overridden, pass the data directly
		// Create the form data structure that includes the license histories
		const formDataToSave = {
			...form,
			licenseHistories
		};
		
		// Add debugging to see what's in the form state right before save
		// Also update the form state for UI consistency
		setForm((prev: any) => ({ ...prev, licenseHistories }));
		
		// Pass the correct license histories directly to saveFormData to avoid timing issues
		const savedApplicantId = await saveFormData(undefined, formDataToSave);
		
		// If we have pending files and now have an application ID, upload them before proceeding
		if (savedApplicantId && rejectedFiles.length > 0) {
			const pendingFiles = rejectedFiles.filter(file => 
				!uploadedFiles.some(uploaded => uploaded.fileName === file.name)
			);
			
			if (pendingFiles.length > 0) {
				await uploadFiles(pendingFiles);
			}
		}
		
		if (savedApplicantId) {
			navigateToNext(FORM_ROUTES.LICENSE_DETAILS, savedApplicantId);
		}
		
		// Reset flag after navigation
		setTimeout(() => setIsUpdatingForm(false), 1000);
	};

	const handlePrevious = async () => {
		if (applicantId) {
			await loadExistingData(applicantId);
			navigateToNext(FORM_ROUTES.CRIMINAL_HISTORY, applicantId);
		} else {
			router.back();
		}
	};

	return (
		<form className="p-6">
			<h2 className="text-xl font-bold mb-4">License History</h2>
			
			{/* Display Applicant ID and License ID if available */}
			{(applicantId || almsLicenseId) && (
				<div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded flex justify-between items-center">
					<div className="flex flex-col">
						{/* <strong>Application ID: {applicantId ?? '—'}</strong> */}
						{almsLicenseId && <strong className='text-sm'>License ID: {almsLicenseId}</strong>}
					</div>
					{typeof loadExistingData === 'function' && (
						<button
							type='button'
							onClick={() => applicantId && loadExistingData(applicantId)}
							disabled={isLoading}
							className='px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
						>
							{isLoading ? 'Loading...' : 'Refresh Data'}
						</button>
					)}
				</div>
			)}
			
			{/* Display success/error messages */}
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

			<div className="mb-6">
				<div className="font-semibold mb-2">14. Whether the applicant has applied for -</div>
				<div className="mb-2">(a) Arms License before?</div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2 cursor-pointer">
						<input 
							type="radio" 
							name="appliedBefore" 
							value="yes" 
							checked={appliedBefore === 'yes'} 
							onChange={() => setAppliedBefore('yes')} 
							className="cursor-pointer"
						/> Yes
					</label>
					<label className="flex items-center gap-2 cursor-pointer">
						<input 
							type="radio" 
							name="appliedBefore" 
							value="no" 
							checked={appliedBefore === 'no'} 
							onChange={() => setAppliedBefore('no')} 
							className="cursor-pointer"
						/> No
					</label>
				</div>
				{appliedBefore === 'yes' && (
					<div className="grid grid-cols-2 gap-6 mb-2">
						<Input label="Date of Application" name="date" type="date" value={appliedDetails.date} onChange={handleAppliedDetails} placeholder="DD/MM/YYYY" />
						<Input label="To which authority" name="authority" value={appliedDetails.authority} onChange={handleAppliedDetails} placeholder="Enter authority" />
						<div className="flex flex-col">
							<label className="block text-sm font-medium text-gray-700 mb-1">Result</label>
							<select name="result" value={appliedDetails.result} onChange={(e) => setAppliedDetails(prev => ({ ...prev, result: e.target.value }))} className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
								<option value="">Select Result</option>
								<option value="approved">Approved</option>
								<option value="rejected">Rejected</option>
								<option value="pending">Pending</option>
							</select>
						</div>
						{appliedDetails.result === 'rejected' && (
							<div className="col-span-2">
								<label className="block text-sm font-medium text-gray-700 mb-2">
									Upload previously rejected license documents
								</label>
								
								{/* Upload Button */}
								<div className="mb-3">
									<label className={`inline-flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-colors ${uploading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white`}>
										<span>📤</span>
										<span>{uploading ? 'Uploading...' : 'Choose Files'}</span>
										<input 
											type="file" 
											accept=".pdf,.jpg,.jpeg,.png" 
											onChange={handleFileChange} 
											className="hidden"
											multiple
											disabled={uploading}
										/>
									</label>
									<span className="ml-3 text-sm text-gray-500">
										Multiple files allowed (Max 5MB each)
									</span>
									{rejectedFiles.length > 0 && !applicantId && (
										<div className="mt-2 text-sm text-orange-600">
											⚠️ Files will be uploaded automatically once you save your application data
										</div>
									)}
								</div>

								{/* Error Message */}
								{fileError && (
									<div className="text-red-600 text-sm mb-3 p-2 bg-red-50 border border-red-200 rounded">
										{fileError}
									</div>
								)}

								{/* Uploaded Files List */}
								{rejectedFiles.length > 0 && (
									<div className="border border-gray-200 rounded-md">
										<div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
											<span className="text-sm font-medium text-gray-700">
												Selected Files ({rejectedFiles.length})
												{uploading && <span className="ml-2 text-blue-600">Uploading...</span>}
											</span>
										</div>
										<div className="divide-y divide-gray-200">
											{rejectedFiles.map((file, index) => {
												const fileKey = `${file.name}_${file.size}`;
												const isUploading = uploadProgress[fileKey];
												const uploadedFile = uploadedFiles.find(uploaded => uploaded.fileName === file.name);
												
												return (
													<div key={index} className="flex items-center justify-between p-3">
														<div className="flex items-center gap-3">
															<span className={`text-lg ${uploadedFile ? 'text-green-500' : 'text-blue-500'}`}>
																{uploadedFile ? '✅' : '📄'}
															</span>
															<div>
																<div className="text-sm font-medium text-gray-900">
																	{file.name}
																	{isUploading && <span className="ml-2 text-xs text-blue-600">(Uploading...)</span>}
																	{uploadedFile && <span className="ml-2 text-xs text-green-600">(Uploaded)</span>}
																</div>
																<div className="text-xs text-gray-500">
																	{(file.size / 1024 / 1024).toFixed(2)} MB
																	{uploadedFile && (
																		<span className="ml-2 text-green-600">
																			• File ID: {uploadedFile.id}
																		</span>
																	)}
																</div>
															</div>
														</div>
														<button
															type="button"
															onClick={() => removeFile(index)}
															className="text-red-500 hover:text-red-700 transition-colors p-1"
															title="Remove file"
															disabled={isUploading}
														>
															<span className="text-lg">×</span>
														</button>
													</div>
												);
											})}
										</div>
									</div>
								)}

								{/* File Format Info */}
								<div className="mt-2 text-xs text-gray-500">
									Supported formats: PDF, JPG, JPEG, PNG
								</div>
							</div>
						)}
					</div>
				)}
			</div>
			<div className="mb-6">
				<div className="mb-2">(b) License been revoked or suspended</div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2 cursor-pointer">
						<input 
							type="radio" 
							name="suspended" 
							value="yes" 
							checked={suspended === 'yes'} 
							onChange={() => setSuspended('yes')} 
							className="cursor-pointer"
						/> Yes
					</label>
					<label className="flex items-center gap-2 cursor-pointer">
						<input 
							type="radio" 
							name="suspended" 
							value="no" 
							checked={suspended === 'no'} 
							onChange={() => setSuspended('no')} 
							className="cursor-pointer"
						/> No
					</label>
				</div>
				{suspended === 'yes' && (
					<div className="grid grid-cols-2 gap-6 mb-2">
						<Input label="By which authority" name="authority" value={suspendedDetails.authority} onChange={handleSuspendedDetails} placeholder="Enter authority" />
						<Input label="Reason" name="reason" value={suspendedDetails.reason} onChange={handleSuspendedDetails} placeholder="Enter reason" />
					</div>
				)}
			</div>
			<div className="mb-6">
				<div className="mb-2">(c) Any member of the family holds a license</div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2 cursor-pointer">
						<input 
							type="radio" 
							name="family" 
							value="yes" 
							checked={family === 'yes'} 
							onChange={() => setFamily('yes')} 
							className="cursor-pointer"
						/> Yes
					</label>
					<label className="flex items-center gap-2 cursor-pointer">
						<input 
							type="radio" 
							name="family" 
							value="no" 
							checked={family === 'no'} 
							onChange={() => setFamily('no')} 
							className="cursor-pointer"
						/> No
					</label>
				</div>
				{family === 'yes' && familyDetails.map((fam, idx) => (
					<div key={idx} className="mb-4 border-b pb-2">
						<div className="grid grid-cols-2 gap-6 mb-2">
							<Input label="Name" name="name" value={fam.name} onChange={e => handleFamilyDetails(idx, e)} placeholder="Enter name" />
							<Input label="License Number" name="licenseNumber" value={fam.licenseNumber} onChange={e => handleFamilyDetails(idx, e)} placeholder="Enter license number" />
						</div>
						<div className="mb-2">Weapons Endorsed</div>
						{fam.weapons.map((weaponId, widx) => (
							<div key={widx} className="flex items-center gap-2 mb-1">
								<div className="flex-1">
									<label className="block text-sm font-medium text-gray-700 mb-1">Weapon {widx + 1}</label>
									<select
										value={weaponId}
										onChange={e => handleWeaponChange(idx, widx, e)}
										className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
										disabled={loadingWeapons}
									>
										<option value={0}>{loadingWeapons ? 'Loading weapons...' : 'Select Weapon'}</option>
										{weapons.map(weapon => (
											<option key={weapon.id} value={weapon.id}>{weapon.name}</option>
										))}
									</select>
								</div>
								<button type="button" className="bg-blue-900 text-white px-2 py-1 rounded" onClick={() => addWeapon(idx)}>+</button>
								{fam.weapons.length > 1 && <button type="button" className="bg-red-600 text-white px-2 py-1 rounded" onClick={() => removeWeapon(idx, widx)}>-</button>}
							</div>
						))}
						{familyDetails.length > 1 && <button type="button" className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1 mt-2" onClick={() => removeFamily(idx)}>- Remove</button>}
					</div>
				))}
			</div>
			<div className="mb-6">
				<div className="mb-2">(d) The applicant has a safe place to keep the arms and ammunition</div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2 cursor-pointer">
						<input 
							type="radio" 
							name="safePlace" 
							value="yes" 
							checked={safePlace === 'yes'} 
							onChange={() => setSafePlace('yes')} 
							className="cursor-pointer"
						/> Yes
					</label>
					<label className="flex items-center gap-2 cursor-pointer">
						<input 
							type="radio" 
							name="safePlace" 
							value="no" 
							checked={safePlace === 'no'} 
							onChange={() => setSafePlace('no')} 
							className="cursor-pointer"
						/> No
					</label>
				</div>
				{safePlace === 'yes' && (
					<TextArea label="If Yes details thereof" name="safePlaceDetails" value={safePlaceDetails} onChange={e => setSafePlaceDetails(e.target.value)} placeholder="Enter details" />
				)}
			</div>
			<div className="mb-6">
				<div className="mb-2">(e) The applicant has undergone training as specified under rule 10 <span className="italic text-xs">(whenever made applicable by the Central Government)</span></div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2 cursor-pointer">
						<input 
							type="radio" 
							name="training" 
							value="yes" 
							checked={training === 'yes'} 
							onChange={() => setTraining('yes')} 
							className="cursor-pointer"
						/> Yes
					</label>
					<label className="flex items-center gap-2 cursor-pointer">
						<input 
							type="radio" 
							name="training" 
							value="no" 
							checked={training === 'no'} 
							onChange={() => setTraining('no')} 
							className="cursor-pointer"
						/> No
					</label>
				</div>
				{training === 'yes' && (
					<TextArea label="If Yes details thereof" name="trainingDetails" value={trainingDetails} onChange={e => setTrainingDetails(e.target.value)} placeholder="Enter details" />
				)}
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

export default LicenseHistory;