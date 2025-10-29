"use client";
import React, { useState, useEffect } from 'react';
import { Input } from '../elements/Input';
import FormFooter from '../elements/footer';
import { useRouter } from 'next/navigation';
import { useApplicationForm } from '../../../hooks/useApplicationForm';
import { FORM_ROUTES } from '../../../config/formRoutes';

const initialProvision = {
	firNumber: '',
	underSection: '',
	policeStation: '',
	unit: '',
	district: '',
	state: '',
	offence: '',
	sentence: '',
	dateOfSentence: '',
};

const initialState = {
	criminalHistories: [] as any[],
};

const CriminalHistory = () => {
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
	} = useApplicationForm({
		initialState,
		formSection: 'criminal',
	});

	const [convicted, setConvicted] = useState('no');
	const [provisions, setProvisions] = useState([{ ...initialProvision }]);
	const [bond, setBond] = useState('no');
	const [bondDetails, setBondDetails] = useState({ dateOfSentence: '', period: '' });
	const [prohibited, setProhibited] = useState('no');
	const [prohibitedDetails, setProhibitedDetails] = useState({ dateOfSentence: '', period: '' });
	
	// Add flag to prevent backend data from overwriting fresh form data
	const [isUpdatingForm, setIsUpdatingForm] = useState(false);

	// Load existing data into local state when form data changes
	useEffect(() => {
		// Skip loading if we're currently updating the form to prevent overwriting
		if (isUpdatingForm) {
			return;
		}
		
		if (form.criminalHistories && form.criminalHistories.length > 0) {
			const history = form.criminalHistories[0]; // Get the first criminal history record
			// Set conviction status
			setConvicted(history.isConvicted ? 'yes' : 'no');
			
			// Set bond execution status and details
			setBond(history.isBondExecuted ? 'yes' : 'no');
			if (history.bondDate || history.bondPeriod) {
				setBondDetails({
					dateOfSentence: history.bondDate ? history.bondDate.split('T')[0] : '', // Convert ISO date to YYYY-MM-DD
					period: history.bondPeriod || ''
				});
			}
			
			// Set prohibition status and details
			setProhibited(history.isProhibited ? 'yes' : 'no');
			if (history.prohibitionDate || history.prohibitionPeriod) {
				setProhibitedDetails({
					dateOfSentence: history.prohibitionDate ? history.prohibitionDate.split('T')[0] : '', // Convert ISO date to YYYY-MM-DD
					period: history.prohibitionPeriod || ''
				});
			}
			
			// Set FIR details/provisions
			if (history.firDetails && history.firDetails.length > 0) {
				const mappedProvisions = history.firDetails.map((fir: any) => ({
					firNumber: fir.firNumber || '',
					underSection: fir.underSection || '',
					policeStation: fir.policeStation || '',
					unit: fir.unit || '',
					district: fir.District || '', // Note: API uses 'District' not 'district'
					state: fir.state || '',
					offence: fir.offence || '',
					sentence: fir.sentence || '',
					dateOfSentence: fir.DateOfSentence ? fir.DateOfSentence.split('T')[0] : '' // Convert ISO date to YYYY-MM-DD
				}));
				setProvisions(mappedProvisions);
			} else {
				// If no FIR details, ensure we have at least one empty provision
				setProvisions([{ ...initialProvision }]);
			}
		} else {
			// Reset to initial state if no data
		}
	}, [form.criminalHistories]);

	const handleProvisionChange = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setProvisions((prev) => prev.map((prov, i) => i === idx ? { ...prov, [name]: value } : prov));
	};

	const addProvision = () => setProvisions((prev) => [...prev, { ...initialProvision }]);
	const removeProvision = (idx: number) => setProvisions((prev) => prev.filter((_, i) => i !== idx));

	const handleSaveToDraft = async () => {
		// Debug current state before transformation
		// Transform local state to the new API format
		const criminalHistories = [{
			isConvicted: convicted === 'yes',
			isBondExecuted: bond === 'yes',
			bondDate: bondDetails.dateOfSentence || null,
			bondPeriod: bondDetails.period || null,
			isProhibited: prohibited === 'yes',
			prohibitionDate: prohibitedDetails.dateOfSentence || null,
			prohibitionPeriod: prohibitedDetails.period || null,
			firDetails: convicted === 'yes' ? provisions.filter(prov => 
				// Only include provisions that have at least some data
				prov.firNumber || prov.underSection || prov.policeStation || 
				prov.unit || prov.district || prov.state || 
				prov.offence || prov.sentence || prov.dateOfSentence
			).map(prov => ({
				firNumber: prov.firNumber || "",
				underSection: prov.underSection || "",
				policeStation: prov.policeStation || "",
				unit: prov.unit || "",
				District: prov.district || "",
				state: prov.state || "",
				offence: prov.offence || "",
				sentence: prov.sentence || "",
				DateOfSentence: prov.dateOfSentence || null
			})) : []
		}];

		// Set flag to prevent useEffect from overwriting our data
		setIsUpdatingForm(true);
		setForm((prev: any) => ({ ...prev, criminalHistories }));
		
		// Log the payload being sent
		// Add debugging to see what's in the form state right before save
		await saveFormData();
		
		// Reset flag after a delay to allow for data loading
		setTimeout(() => setIsUpdatingForm(false), 1000);
	};	const handleNext = async () => {
		// Debug current state before transformation
		// Transform local state to the new API format
		const criminalHistories = [{
			isConvicted: convicted === 'yes',
			isBondExecuted: bond === 'yes',
			bondDate: bondDetails.dateOfSentence || null,
			bondPeriod: bondDetails.period || null,
			isProhibited: prohibited === 'yes',
			prohibitionDate: prohibitedDetails.dateOfSentence || null,
			prohibitionPeriod: prohibitedDetails.period || null,
			firDetails: convicted === 'yes' ? provisions.filter(prov => 
				// Only include provisions that have at least some data
				prov.firNumber || prov.underSection || prov.policeStation || 
				prov.unit || prov.district || prov.state || 
				prov.offence || prov.sentence || prov.dateOfSentence
			).map(prov => ({
				firNumber: prov.firNumber || "",
				underSection: prov.underSection || "",
				policeStation: prov.policeStation || "",
				unit: prov.unit || "",
				District: prov.district || "",
				state: prov.state || "",
				offence: prov.offence || "",
				sentence: prov.sentence || "",
				DateOfSentence: prov.dateOfSentence || null
			})) : []
		}];
		
		// Set flag to prevent useEffect from overwriting our data
		setIsUpdatingForm(true);
		setForm((prev: any) => ({ ...prev, criminalHistories }));
		
		// Log the payload being sent
		// Instead of using setForm which might get overridden, pass the data directly
		// Create the form data structure that includes the criminal histories
		const formDataToSave = {
			...form,
			criminalHistories
		};
		
		// Add debugging to see what's in the form state right before save
		// Also update the form state for UI consistency
		setForm((prev: any) => ({ ...prev, criminalHistories }));
		
		// Pass the correct criminal histories directly to saveFormData to avoid timing issues
		const savedApplicantId = await saveFormData(undefined, formDataToSave);
		
		if (savedApplicantId) {
			navigateToNext(FORM_ROUTES.LICENSE_HISTORY, savedApplicantId);
		}
		
		// Reset flag after navigation
		setTimeout(() => setIsUpdatingForm(false), 1000);
	};

	const handlePrevious = async () => {
		if (applicantId) {
			await loadExistingData(applicantId);
			navigateToNext(FORM_ROUTES.OCCUPATION_DETAILS, applicantId);
		} else {
			router.back();
		}
	};

	// Show loading state if data is being loaded
	if (isLoading) {
		return (
			<div className="p-6">
				<h2 className="text-xl font-bold mb-4">Criminal History</h2>
				<div className="flex justify-center items-center py-8">
					<div className="text-gray-500">Loading...</div>
				</div>
			</div>
		);
	}

	return (
		<form className="p-6">
        <h2 className="text-xl font-bold mb-4">Criminal History</h2>
			
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
			<div className="mb-4">
				<div className="font-semibold mb-2">13. Whether the applicant has been -</div>
				<div className="mb-2">(a) Convicted</div>
				<div className="flex gap-6 mb-4">
					<label className="flex items-center gap-2 cursor-pointer">
						<input 
							type="radio" 
							name="convicted" 
							value="yes" 
							checked={convicted === 'yes'} 
							onChange={() => setConvicted('yes')} 
							className="cursor-pointer"
						/> Yes
					</label>
					<label className="flex items-center gap-2 cursor-pointer">
						<input 
							type="radio" 
							name="convicted" 
							value="no" 
							checked={convicted === 'no'} 
							onChange={() => setConvicted('no')} 
							className="cursor-pointer"
						/> No
					</label>
				</div>
				   {convicted === 'yes' && provisions.map((prov, idx) => (
					   <div key={idx} className="mb-6 border-b pb-4">
						   <div className="font-medium mb-2">{idx === 0 ? 'i. Provisions to Enter–' : `ii. Provisions to Enter–`}</div>
						   <div className="grid grid-cols-3 gap-6 mb-2">
							   <Input label="FIR Number" name="firNumber" value={prov.firNumber} onChange={e => handleProvisionChange(idx, e)} placeholder="Enter FIR number" />
							   <Input label="Under Section" name="underSection" value={prov.underSection} onChange={e => handleProvisionChange(idx, e)} placeholder="Enter section" />
							   <Input label="Police Station" name="policeStation" value={prov.policeStation} onChange={e => handleProvisionChange(idx, e)} placeholder="Enter police station" />
						   </div>
						   <div className="grid grid-cols-3 gap-6 mb-2">
							   <Input label="Unit" name="unit" value={prov.unit} onChange={e => handleProvisionChange(idx, e)} placeholder="Enter unit" />
							   <Input label="District" name="district" value={prov.district} onChange={e => handleProvisionChange(idx, e)} placeholder="Enter district" />
							   <Input label="State" name="state" value={prov.state} onChange={e => handleProvisionChange(idx, e)} placeholder="Enter state" />
						   </div>
						   <div className="font-medium mb-2">If Yes details thereof-</div>
						   <div className="grid grid-cols-3 gap-6 mb-2">
							   <Input label="Offence" name="offence" value={prov.offence} onChange={e => handleProvisionChange(idx, e)} placeholder="Enter offence" />
							   <Input label="Sentence" name="sentence" value={prov.sentence} onChange={e => handleProvisionChange(idx, e)} placeholder="Enter sentence" />
							   <Input label="Date of Sentence" name="dateOfSentence" type="date" value={prov.dateOfSentence} onChange={e => handleProvisionChange(idx, e)} placeholder="DD/MM/YYYY" />
						   </div>
						   <div className="flex gap-2 mt-2">
							   <button type="button" className="bg-blue-900 text-white px-4 py-1 rounded flex items-center gap-1" onClick={addProvision}>
								   Add <span role="img" aria-label="add">➕</span>
							   </button>
							   {idx > 0 && (
								   <button type="button" className="bg-red-600 text-white px-3 py-1 rounded flex items-center gap-1" onClick={() => removeProvision(idx)}>
									   <span role="img" aria-label="delete">🗑️</span>
								   </button>
							   )}
						   </div>
					   </div>
				   ))}
			</div>
			<div className="mb-4">
				<div className="mb-2">(b) Ordered to execute a bond under Chapter IX of Bharath Nagarik Suraksha Sameeksha, 1973 (2 of 1947) for keeping the peace or for good behavior</div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2 cursor-pointer">
						<input 
							type="radio" 
							name="bond" 
							value="yes" 
							checked={bond === 'yes'} 
							onChange={() => setBond('yes')} 
							className="cursor-pointer"
						/> Yes
					</label>
					<label className="flex items-center gap-2 cursor-pointer">
						<input 
							type="radio" 
							name="bond" 
							value="no" 
							checked={bond === 'no'} 
							onChange={() => setBond('no')} 
							className="cursor-pointer"
						/> No
					</label>
				</div>
				{bond === 'yes' && (
					<div className="grid grid-cols-2 gap-6 mb-2">
						<Input label="Date of Sentence" name="dateOfSentence" type="date" value={bondDetails.dateOfSentence} onChange={e => setBondDetails(d => ({ ...d, dateOfSentence: e.target.value }))} placeholder="DD/MM/YYYY" />
						<Input label="Period of which bound" name="period" value={bondDetails.period} onChange={e => setBondDetails(d => ({ ...d, period: e.target.value }))} placeholder="Enter period" />
					</div>
				)}
			</div>
			<div className="mb-4">
				<div className="mb-2">(c) Prohibited under the Arms Act, 1959, or any other law from having the arms off ammunition</div>
				<div className="flex gap-6 mb-2">
					<label className="flex items-center gap-2 cursor-pointer">
						<input 
							type="radio" 
							name="prohibited" 
							value="yes" 
							checked={prohibited === 'yes'} 
							onChange={() => setProhibited('yes')} 
							className="cursor-pointer"
						/> Yes
					</label>
					<label className="flex items-center gap-2 cursor-pointer">
						<input 
							type="radio" 
							name="prohibited" 
							value="no" 
							checked={prohibited === 'no'} 
							onChange={() => setProhibited('no')} 
							className="cursor-pointer"
						/> No
					</label>
				</div>
				{prohibited === 'yes' && (
					<div className="grid grid-cols-2 gap-6 mb-2">
						<Input label="Date of Sentence" name="dateOfSentence" type="date" value={prohibitedDetails.dateOfSentence} onChange={e => setProhibitedDetails(d => ({ ...d, dateOfSentence: e.target.value }))} placeholder="DD/MM/YYYY" />
						<Input label="Period of which bound" name="period" value={prohibitedDetails.period} onChange={e => setProhibitedDetails(d => ({ ...d, period: e.target.value }))} placeholder="Enter period" />
					</div>
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

export default CriminalHistory;
