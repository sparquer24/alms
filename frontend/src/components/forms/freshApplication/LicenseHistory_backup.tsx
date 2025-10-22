"use client";
import React, { useState, useEffect } from 'react';
import { Input, TextArea } from '../elements/Input';
import { Checkbox } from '../elements/Checkbox';
import FormFooter from '../elements/footer';
import { WeaponsService, Weapon } from '../../../services/weapons';
import FileUploadService from '../../../services/fileUploadService';
import { useApplicationForm } from '../../../hooks/useApplicationForm';
import toast from 'react-hot-toast';

const initialFamily = { name: '', licenseNumber: '', weapons: [0] }; // Use weapon IDs instead of strings

const initialState = {
	appliedBefore: 'no',
	appliedDetails: { date: '', authority: '', result: '', status: '' },
	suspended: 'no',
	suspendedDetails: { authority: '', reason: '' },
	family: 'no',
	familyDetails: [{ ...initialFamily }],
	safePlace: 'no',
	safePlaceDetails: '',
	training: 'no',
	trainingDetails: '',
	rejectedLicenseFile: null as File | null,
};

const LicenseHistory = () => {
	// Use the application form hook for proper state management and navigation
	const {
		form,
		setForm,
		applicantId,
		isSubmitting,
		submitError,
		submitSuccess,
		isLoading,
		saveFormData,
		navigateToNext,
		loadExistingData,
	} = useApplicationForm({
		initialState,
		formSection: 'license-history',
	});

	// Local state for form fields
	const [appliedBefore, setAppliedBefore] = useState(form.appliedBefore || 'no');
	const [appliedDetails, setAppliedDetails] = useState(form.appliedDetails || { date: '', authority: '', result: '', status: '' });
	const [rejectedFile, setRejectedFile] = useState<File | null>(form.rejectedLicenseFile || null);
	const [fileError, setFileError] = useState<string>('');
	const [uploadingFile, setUploadingFile] = useState<boolean>(false);
	const [uploadedFileInfo, setUploadedFileInfo] = useState<{ fileName: string; fileUrl: string } | null>(null);
	const [suspended, setSuspended] = useState(form.suspended || 'no');
	const [suspendedDetails, setSuspendedDetails] = useState(form.suspendedDetails || { authority: '', reason: '' });
	const [family, setFamily] = useState(form.family || 'no');
	const [familyDetails, setFamilyDetails] = useState(form.familyDetails || [{ ...initialFamily }]);
	const [safePlace, setSafePlace] = useState(form.safePlace || 'no');
	const [safePlaceDetails, setSafePlaceDetails] = useState(form.safePlaceDetails || '');
	const [training, setTraining] = useState(form.training || 'no');
	const [trainingDetails, setTrainingDetails] = useState(form.trainingDetails || '');
	const [weapons, setWeapons] = useState<Weapon[]>([]);
	const [loadingWeapons, setLoadingWeapons] = useState(false);

	// Fetch weapons on component mount
	useEffect(() => {
		const loadWeapons = async () => {
			try {
				setLoadingWeapons(true);
				const list = await WeaponsService.getAll();
				const items = (list || []).map(w => ({ id: w.id, name: w.name })) as Weapon[];
				setWeapons(items);
			} catch (e) {
				console.error('Error loading weapons list', e);
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

	// Sync local state with form state when form data changes
	useEffect(() => {
		if (form.appliedBefore) setAppliedBefore(form.appliedBefore);
		if (form.appliedDetails) setAppliedDetails(form.appliedDetails);
		if (form.suspended) setSuspended(form.suspended);
		if (form.suspendedDetails) setSuspendedDetails(form.suspendedDetails);
		if (form.family) setFamily(form.family);
		if (form.familyDetails) setFamilyDetails(form.familyDetails);
		if (form.safePlace) setSafePlace(form.safePlace);
		if (form.safePlaceDetails) setSafePlaceDetails(form.safePlaceDetails);
		if (form.training) setTraining(form.training);
		if (form.trainingDetails) setTrainingDetails(form.trainingDetails);
		if (form.rejectedLicenseFile) setRejectedFile(form.rejectedLicenseFile);
		if (form.uploadedFileInfo) setUploadedFileInfo(form.uploadedFileInfo);
	}, [form]);

	const handleAppliedDetails = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setAppliedDetails((prev: any) => ({ ...prev, [name]: value }));
	};
	const handleSuspendedDetails = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setSuspendedDetails((prev: any) => ({ ...prev, [name]: value }));
	};
	const handleFamilyDetails = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFamilyDetails((prev: any) => prev.map((f: any, i: number) => i === idx ? { ...f, [name]: value } : f));
	};
	const handleWeaponChange = (idx: number, widx: number, e: React.ChangeEvent<HTMLSelectElement>) => {
		const weaponId = Number(e.target.value);
		setFamilyDetails((prev: any) => prev.map((f: any, i: number) => i === idx ? { ...f, weapons: f.weapons.map((w: any, wi: number) => wi === widx ? weaponId : w) } : f));
	};
	const addFamily = () => setFamilyDetails((prev: any) => [...prev, { ...initialFamily }]);
	const removeFamily = (idx: number) => setFamilyDetails((prev: any) => prev.filter((_: any, i: number) => i !== idx));
	const addWeapon = (idx: number) => setFamilyDetails((prev: any) => prev.map((f: any, i: number) => i === idx ? { ...f, weapons: [...f.weapons, 0] } : f));
	const removeWeapon = (idx: number, widx: number) => setFamilyDetails((prev: any) => prev.map((f: any, i: number) => i === idx ? { ...f, weapons: f.weapons.filter((_: any, wi: number) => wi !== widx) } : f));

	// File upload handler
	const handleFileUpload = async (file: File) => {
		try {
			setUploadingFile(true);
			setFileError('');

			// Validate file
			const validation = FileUploadService.validateFile(file);
			if (!validation.isValid) {
				setFileError(validation.error || 'Invalid file');
				return;
			}

			// Get application ID from the hook
			if (!applicantId) {
				setFileError('Application ID not available. Please save previous steps first.');
				return;
			}

			// Upload file with storage
			const result = await FileUploadService.uploadFileWithStorage(
				Number(applicantId),
				file,
				'REJECTED_LICENSE_COPY',
				'Previously rejected license copy document'
			);

			setUploadedFileInfo({
				fileName: result.fileName,
				fileUrl: result.fileUrl
			});

			toast.success('File uploaded successfully!');
			
		} catch (error) {
			console.error('File upload error:', error);
			setFileError('Failed to upload file. Please try again.');
			toast.error('File upload failed');
		} finally {
			setUploadingFile(false);
		}
	};

	// Save form data function
	const handleSave = async () => {
		try {
			const formData = {
				appliedBefore,
				appliedDetails,
				suspended,
				suspendedDetails,
				family,
				familyDetails,
				safePlace,
				safePlaceDetails,
				training,
				trainingDetails,
				rejectedLicenseFile: rejectedFile,
				uploadedFileInfo,
			};

			setForm(formData);
			toast.success('License history data saved successfully!');
		} catch (error) {
			console.error('Error saving form data:', error);
			toast.error('Failed to save form data');
		}
	};

	return (
		<form className="p-6">
            			<h2 className="text-xl font-bold mb-4">Lincense History</h2>

			<div className="mb-6">
				<div className="font-medium mb-2">14. Whether -</div>
				<div className="mb-2">(a) The applicant applied for a licence before – if so, when, to whom and with what result</div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2">
						<input type="radio" name="appliedBefore" value="yes" checked={appliedBefore === 'yes'} onChange={() => setAppliedBefore('yes')} /> Yes
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" name="appliedBefore" value="no" checked={appliedBefore === 'no'} onChange={() => setAppliedBefore('no')} /> No
					</label>
				</div>
				{appliedBefore === 'yes' && (
					<div className="grid grid-cols-3 gap-6 mb-2">
						<Input label="Date of Applied for" name="date" type="date" value={appliedDetails.date} onChange={handleAppliedDetails} placeholder="DD/MM/YYYY" />
						<Input label="Name of the License Authority" name="authority" value={appliedDetails.authority} onChange={handleAppliedDetails} placeholder="Enter authority" />
						<Input label="Result (Pl. specify)" name="result" value={appliedDetails.result} onChange={handleAppliedDetails} placeholder="Enter result" />
					</div>
				)}
				<div className="mb-2">Status</div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2">
						<input type="radio" name="status" value="approved" checked={appliedDetails.status === 'approved'} onChange={handleAppliedDetails} /> Approved
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" name="status" value="pending" checked={appliedDetails.status === 'pending'} onChange={handleAppliedDetails} /> Pending
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" name="status" value="rejected" checked={appliedDetails.status === 'rejected'} onChange={handleAppliedDetails} /> Rejected
					</label>
				</div>
				   <div className="mb-2">Upload previously Rejected License Copy</div>
				   <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 flex flex-col items-center mb-2">
					   <span className="text-blue-500 text-2xl mb-2">📤</span>
					   <span>Drag your file(s) or <span 
						   className="text-blue-700 underline cursor-pointer"
						   onClick={() => document.getElementById('rejectedFileInput')?.click()}
					   >browse</span></span>
					   <span className="text-xs text-gray-500">Max 10 MB file allowed (PDF, JPG, PNG)</span>
					   <input
						   id="rejectedFileInput"
						   type="file"
						   className="hidden"
						   accept=".pdf,.jpg,.jpeg,.png"
						   onChange={async (e) => {
							   const file = e.target.files?.[0];
							   if (file) {
								   setRejectedFile(file);
								   await handleFileUpload(file);
							   }
						   }}
					   />
					   {fileError && <span className="text-xs text-red-500 mt-1">{fileError}</span>}
					   {uploadingFile && (
						   <div className="flex items-center gap-2 mt-2">
							   <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
							   <span className="text-sm text-blue-600">Uploading...</span>
						   </div>
					   )}
					   {uploadedFileInfo && (
						   <div className="flex items-center gap-2 mt-2 text-green-600">
							   <span className="text-sm">✅ {uploadedFileInfo.fileName} uploaded successfully</span>
						   </div>
					   )}
				   </div>
				   <button 
					   type="button" 
					   className={`border px-4 py-1 rounded flex items-center gap-1 ml-auto ${
						   uploadingFile 
							   ? 'border-gray-300 text-gray-500 cursor-not-allowed' 
							   : 'border-purple-500 text-purple-700 hover:bg-purple-50'
					   }`}
					   onClick={() => document.getElementById('rejectedFileInput')?.click()}
					   disabled={uploadingFile}
				   >
					   {uploadingFile ? 'Uploading...' : '+ Upload'}
				   </button>
			</div>
			<div className="mb-6">
				<div className="mb-2">(b) The applicant license ever suspended or cancelled/revoked-</div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2">
						<input type="radio" name="suspended" value="yes" checked={suspended === 'yes'} onChange={() => setSuspended('yes')} /> Yes
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" name="suspended" value="no" checked={suspended === 'no'} onChange={() => setSuspended('no')} /> No
					</label>
				</div>
				{suspended === 'yes' && (
					<>
						<Input label="Name of the Licensing Authority" name="authority" value={suspendedDetails.authority} onChange={handleSuspendedDetails} placeholder="Enter authority" />
						<TextArea label="Reason" name="reason" value={suspendedDetails.reason} onChange={handleSuspendedDetails} placeholder="Enter reason" />
					</>
				)}
			</div>
			<div className="mb-6">
				<div className="mb-2">(c) Any other member of the applicant’s family is in possession of any arms license, if so, particulars thereof</div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2">
						<input type="radio" name="family" value="yes" checked={family === 'yes'} onChange={() => setFamily('yes')} /> Yes
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" name="family" value="no" checked={family === 'no'} onChange={() => setFamily('no')} /> No
					</label>
				</div>
				{family === 'yes' && familyDetails.map((fam: any, idx: number) => (
					<div key={idx} className="mb-4 border-b pb-2">
						<div className="grid grid-cols-2 gap-6 mb-2">
							<Input label="Name" name="name" value={fam.name} onChange={e => handleFamilyDetails(idx, e)} placeholder="Enter name" />
							<Input label="License Number" name="licenseNumber" value={fam.licenseNumber} onChange={e => handleFamilyDetails(idx, e)} placeholder="Enter license number" />
						</div>
						<div className="mb-2">Weapons Endorsed</div>
						{fam.weapons.map((weaponId: any, widx: number) => (
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
						<button type="button" className="bg-blue-900 text-white px-3 py-1 rounded flex items-center gap-1 mt-2" onClick={addFamily}>+ Add</button>
						{familyDetails.length > 1 && <button type="button" className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1 mt-2 ml-2" onClick={() => removeFamily(idx)}>- Remove</button>}
					</div>
				))}
			</div>
			<div className="mb-6">
				<div className="mb-2">(d) The applicant has a safe place to keep the arms and ammunition</div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2">
						<input type="radio" name="safePlace" value="yes" checked={safePlace === 'yes'} onChange={() => setSafePlace('yes')} /> Yes
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" name="safePlace" value="no" checked={safePlace === 'no'} onChange={() => setSafePlace('no')} /> No
					</label>
				</div>
				{safePlace === 'yes' && (
					<TextArea label="If Yes details thereof" name="safePlaceDetails" value={safePlaceDetails} onChange={e => setSafePlaceDetails(e.target.value)} placeholder="Enter details" />
				)}
			</div>
			<div className="mb-6">
				<div className="mb-2">(e) The applicant has undergone training as specified under rule 10 <span className="italic text-xs">(whenever made applicable by the Central Government)</span></div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2">
						<input type="radio" name="training" value="yes" checked={training === 'yes'} onChange={() => setTraining('yes')} /> Yes
					</label>
					<label className="flex items-center gap-2">
						<input type="radio" name="training" value="no" checked={training === 'no'} onChange={() => setTraining('no')} /> No
					</label>
				</div>
				{training === 'yes' && (
					<TextArea label="If Yes details thereof" name="trainingDetails" value={trainingDetails} onChange={e => setTrainingDetails(e.target.value)} placeholder="Enter details" />
				)}
			</div>
			<FormFooter onSaveToDraft={handleSave} onNext={() => navigateToNext('/documents-upload')} isLoading={isSubmitting} />
		</form>
	);
};

export default LicenseHistory;
