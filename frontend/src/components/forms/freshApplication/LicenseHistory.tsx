"use client";
import React, { useState, useEffect } from 'react';
import { Input, TextArea } from '../elements/Input';
import { Checkbox } from '../elements/Checkbox';
import FormFooter from '../elements/footer';
import { WeaponsService, Weapon } from '../../../services/weapons';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApplicationForm } from '../../../hooks/useApplicationForm';
import { FORM_ROUTES } from '../../../config/formRoutes';

const initialFamily = { name: '', licenseNumber: '', weapons: [0] }; // Use weapon IDs instead of strings

const initialState = {
	licenseHistories: [] as any[],
};

const LicenseHistory = () => {
	const [appliedBefore, setAppliedBefore] = useState('no');
	const [appliedDetails, setAppliedDetails] = useState({ date: '', authority: '', result: '' });
	const [rejectedFile, setRejectedFile] = useState<File | null>(null);
	const [fileError, setFileError] = useState<string>('');
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

	const router = useRouter();
	
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
		setSubmitError,
		setSubmitSuccess,
	} = useApplicationForm({
		initialState,
		formSection: 'license-history',
	});

	// Load existing data into local state when form data changes
	useEffect(() => {
		if (form.licenseHistories && form.licenseHistories.length > 0) {
			// Parse license histories from backend format
			const histories = form.licenseHistories;
			console.log('Loaded license histories:', histories);
			// TODO: Map backend data to local state format
		}
	}, [form.licenseHistories]);

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

	const handleAppliedDetails = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setAppliedDetails(prev => ({ ...prev, [name]: value }));
	};

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		setFileError('');
		if (file && file.size > 5 * 1024 * 1024) {
			setFileError('File size should not exceed 5MB');
			return;
		}
		setRejectedFile(file || null);
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

	const addFamily = () => setFamilyDetails(prev => [...prev, { ...initialFamily }]);
	const removeFamily = (idx: number) => setFamilyDetails(prev => prev.filter((_, i) => i !== idx));

	// Show loading state if data is being loaded
	if (isLoading) {
		return (
			<div className="p-6">
				<h2 className="text-xl font-bold mb-4">License History</h2>
				<div className="flex justify-center items-center py-8">
					<div className="text-gray-500">Loading existing data...</div>
				</div>
			</div>
		);
	}

	const transformFormData = () => {
		// Transform to new API format matching the payload structure
		return [{
			hasAppliedBefore: appliedBefore === 'yes',
			applicationDetails: appliedBefore === 'yes' ? JSON.stringify(appliedDetails) : undefined,
			hasLicenceSuspended: suspended === 'yes',
			suspensionDetails: suspended === 'yes' ? JSON.stringify(suspendedDetails) : undefined,
			hasFamilyLicence: family === 'yes',
			familyLicenceDetails: family === 'yes' ? JSON.stringify(familyDetails) : undefined,
			hasSafePlace: safePlace === 'yes',
			safePlaceDetails: safePlace === 'yes' ? safePlaceDetails : undefined,
			hasTraining: training === 'yes',
			trainingDetails: training === 'yes' ? trainingDetails : undefined,
		}];
	};

	const handleSaveToDraft = async () => {
		// Transform local state to API format before saving
		const licenseHistories = transformFormData();
		setForm((prev: any) => ({ ...prev, licenseHistories }));
		
		// Log the payload being sent
		console.log('🟡 License History Payload:', licenseHistories);
		
		await saveFormData();
	};

	const handleNext = async () => {
		// Transform local state to API format before saving
		const licenseHistories = transformFormData();
		setForm((prev: any) => ({ ...prev, licenseHistories }));
		
		// Log the payload being sent
		console.log('🟡 License History Payload:', licenseHistories);
		
		const savedApplicantId = await saveFormData();
		
		if (savedApplicantId) {
			navigateToNext(FORM_ROUTES.LICENSE_DETAILS, savedApplicantId);
		}
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
			
			{/* Display Applicant ID if available */}
			{applicantId && (
				<div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
					<strong>Application ID: {applicantId}</strong>
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
								<label className="block text-sm font-medium text-gray-700 mb-1">Upload Rejection Document (Optional)</label>
								<input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileChange} className="w-full p-2 border border-gray-300 rounded-md" />
								{fileError && <div className="text-red-600 text-sm mt-1">{fileError}</div>}
								{rejectedFile && <div className="text-green-600 text-sm mt-1">File selected: {rejectedFile.name}</div>}
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
						<button type="button" className="bg-blue-900 text-white px-3 py-1 rounded flex items-center gap-1 mt-2" onClick={addFamily}>+ Add</button>
						{familyDetails.length > 1 && <button type="button" className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1 mt-2 ml-2" onClick={() => removeFamily(idx)}>- Remove</button>}
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