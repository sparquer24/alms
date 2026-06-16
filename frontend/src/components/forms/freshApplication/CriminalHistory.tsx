"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Input } from '../elements/Input';
import FormFooter from '../elements/footer';
import { FormSkeleton } from '../elements/FormSkeleton';
import { useRouter } from 'next/navigation';
import { useApplicationForm } from '../../../hooks/useApplicationForm';
import { FORM_ROUTES } from '../../../config/formRoutes';
import { validateText, validateGeneralText, validateDate, filterText, filterAlphaNumeric } from '../../../utils/validation';

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

// Validation rules for criminal history using centralized validators
const validateCriminalHistory = (formData: any) => {
	const errors: Record<string, string> = {};
	const history = formData.criminalHistories?.[0];
	if (!history) return errors;

	if (history.isConvicted) {
		if (!history.firDetails || history.firDetails.length === 0) {
			errors.conviction_general = 'At least one conviction provision must be added.';
		} else {
			history.firDetails.forEach((prov: any, idx: number) => {
				// Alphanumeric fields (allow letters, numbers, spaces)
				const generalFields = [
					{ key: 'firNumber', val: prov.firNumber, msg: 'FIR Number is required' },
					{ key: 'underSection', val: prov.underSection, msg: 'Under Section is required' },
					{ key: 'policeStation', val: prov.policeStation, msg: 'Police Station is required' },
					{ key: 'unit', val: prov.unit, msg: 'Unit is required' },
					{ key: 'offence', val: prov.offence, msg: 'Offence is required' },
					{ key: 'sentence', val: prov.sentence, msg: 'Sentence is required' },
				];
				generalFields.forEach(({ key, val, msg }) => {
					const err = validateGeneralText(val ?? '', true, { required: msg });
					if (err) errors[`${key}_${idx}`] = err;
				});
				// Alpha-only fields (only letters + spaces — no numbers)
				const alphaFields = [
					{ key: 'district', val: prov.District || prov.district, msg: 'District is required' },
					{ key: 'state', val: prov.state, msg: 'State is required' },
				];
				alphaFields.forEach(({ key, val, msg }) => {
					const err = validateText(val ?? '', true, { required: msg });
					if (err) errors[`${key}_${idx}`] = err;
				});
				// Date field
				const dateVal = prov.DateOfSentence || prov.dateOfSentence || '';
				const dateErr = validateDate(dateVal, true, undefined, { required: 'Date of Sentence is required' });
				if (dateErr) errors[`dateOfSentence_${idx}`] = dateErr;
			});
		}
	}

	if (history.isBondExecuted) {
		const bondDateErr = validateDate(history.bondDate ?? '', true, undefined, { required: 'Bond date is required' });
		if (bondDateErr) errors.bondDate = bondDateErr;
		const bondPeriodErr = validateGeneralText(history.bondPeriod ?? '', true, { required: 'Bond period is required' });
		if (bondPeriodErr) errors.bondPeriod = bondPeriodErr;
	}

	if (history.isProhibited) {
		const prohibDateErr = validateDate(history.prohibitionDate ?? '', true, undefined, { required: 'Prohibition date is required' });
		if (prohibDateErr) errors.prohibitionDate = prohibDateErr;
		const prohibPeriodErr = validateGeneralText(history.prohibitionPeriod ?? '', true, { required: 'Prohibition period is required' });
		if (prohibPeriodErr) errors.prohibitionPeriod = prohibPeriodErr;
	}

	return errors;
};

const CriminalHistory = () => {
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
		fieldErrors,
		setFieldErrors,
	} = useApplicationForm({
		initialState,
		formSection: 'criminal',
		validationRules: validateCriminalHistory,
	});

	const [convicted, setConvicted] = useState('no');
	const [provisions, setProvisions] = useState([{ ...initialProvision }]);
	const [bond, setBond] = useState('no');
	const [bondDetails, setBondDetails] = useState({ dateOfSentence: '', period: '' });
	const [prohibited, setProhibited] = useState('no');
	const [prohibitedDetails, setProhibitedDetails] = useState({ dateOfSentence: '', period: '' });
	
	// Add flag to prevent backend data from overwriting fresh form data
	const isUpdatingForm = useRef(false);

	// Load existing data into local state when form data changes
	useEffect(() => {
		// Skip loading if we're currently updating the form to prevent overwriting
		if (isUpdatingForm.current) {
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
		}
	}, [form.criminalHistories]);

	const handleProvisionChange = (idx: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		isUpdatingForm.current = true;
		const { name, value } = e.target;

		// Input filtering by field type
		const alphaOnlyFields = ['state', 'district'];
		let processedValue = value;
		if (name === 'dateOfSentence') {
			processedValue = value; // no filtering for dates
		} else if (alphaOnlyFields.includes(name)) {
			processedValue = filterText(value); // alphabets + spaces only
		} else {
			processedValue = filterAlphaNumeric(value); // alphanumeric + spaces
		}

		setProvisions(prev => prev.map((p, i) => i === idx ? { ...p, [name]: processedValue } : p));

		// Real-time validation
		const errorKey = `${name}_${idx}`;
		const fieldLabel = name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1');
		if (name === 'dateOfSentence') {
			const err = validateDate(processedValue, true, undefined, { required: 'Date of Sentence is required' });
			setFieldErrors((prev: any) => ({ ...prev, [errorKey]: err }));
		} else if (alphaOnlyFields.includes(name)) {
			const err = validateText(processedValue, true, { required: `${fieldLabel} is required` });
			setFieldErrors((prev: any) => ({ ...prev, [errorKey]: err }));
		} else {
			const err = validateGeneralText(processedValue, true, { required: `${fieldLabel} is required` });
			setFieldErrors((prev: any) => ({ ...prev, [errorKey]: err }));
		}
	};

	const handleProvisionBlur = (idx: number, e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		const trimmed = value.trim();
		if (trimmed !== value) {
			setProvisions(prev => prev.map((p, i) => i === idx ? { ...p, [name]: trimmed } : p));
		}
		const errorKey = `${name}_${idx}`;
		const alphaOnlyFields = ['state', 'district'];
		if (name === 'dateOfSentence') {
			const err = validateDate(trimmed, true, undefined, { required: 'Date of Sentence is required' });
			setFieldErrors((prev: any) => ({ ...prev, [errorKey]: err }));
		} else if (alphaOnlyFields.includes(name)) {
			const err = validateText(trimmed, true, { required: 'This field is required' });
			setFieldErrors((prev: any) => ({ ...prev, [errorKey]: err }));
		} else {
			const err = validateGeneralText(trimmed, true, { required: 'This field is required' });
			setFieldErrors((prev: any) => ({ ...prev, [errorKey]: err }));
		}
	};

	const addProvision = () => {
		setProvisions((prev) => [...prev, { ...initialProvision }]);
		if (fieldErrors.conviction_general) {
			setFieldErrors((prev: any) => ({ ...prev, conviction_general: '' }));
		}
	};
	
	const removeProvision = (idx: number) => {
		setProvisions((prev) => prev.filter((_, i) => i !== idx));
		// Clear errors for removed index
		setFieldErrors((prev: any) => {
			const nextErrors = { ...prev };
			Object.keys(nextErrors).forEach(key => {
				if (key.endsWith(`_${idx}`)) {
					delete nextErrors[key];
				}
			});
			return nextErrors;
		});
	};

	const handleBondChange = (field: 'dateOfSentence' | 'period', value: string) => {
		isUpdatingForm.current = true;
		let processedValue = value;
		if (field === 'period') {
			processedValue = filterAlphaNumeric(value);
		}
		setBondDetails(d => ({ ...d, [field]: processedValue }));
		const errorKey = field === 'dateOfSentence' ? 'bondDate' : 'bondPeriod';
		const err = field === 'dateOfSentence'
			? validateDate(processedValue, true, undefined, { required: 'Bond date is required' })
			: validateGeneralText(processedValue, true, { required: 'Bond period is required' });
		setFieldErrors((prev: any) => ({ ...prev, [errorKey]: err }));
	};

	const handleProhibitedChange = (field: 'dateOfSentence' | 'period', value: string) => {
		isUpdatingForm.current = true;
		let processedValue = value;
		if (field === 'period') {
			processedValue = filterAlphaNumeric(value);
		}
		setProhibitedDetails(d => ({ ...d, [field]: processedValue }));
		const errorKey = field === 'dateOfSentence' ? 'prohibitionDate' : 'prohibitionPeriod';
		const err = field === 'dateOfSentence'
			? validateDate(processedValue, true, undefined, { required: 'Prohibition date is required' })
			: validateGeneralText(processedValue, true, { required: 'Prohibition period is required' });
		setFieldErrors((prev: any) => ({ ...prev, [errorKey]: err }));
	};

	const getTransformedHistory = () => {
		return [{
			isConvicted: convicted === 'yes',
			isBondExecuted: bond === 'yes',
			bondDate: bond === 'yes' ? (bondDetails.dateOfSentence || null) : null,
			bondPeriod: bond === 'yes' ? (bondDetails.period || null) : null,
			isProhibited: prohibited === 'yes',
			prohibitionDate: prohibited === 'yes' ? (prohibitedDetails.dateOfSentence || null) : null,
			prohibitionPeriod: prohibited === 'yes' ? (prohibitedDetails.period || null) : null,
			firDetails: convicted === 'yes' ? provisions.map(prov => ({
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
	};

	// Compute form validity from transformed data using centralized validation
	const isFormValid = useMemo(() => {
		const transformed = { criminalHistories: getTransformedHistory() };
		const errs = validateCriminalHistory(transformed);
		return Object.keys(errs).length === 0;
	}, [convicted, provisions, bond, bondDetails, prohibited, prohibitedDetails]);

	const handleSaveToDraft = async () => {
		const criminalHistories = getTransformedHistory();

		// Set flag to prevent useEffect from overwriting our data
		isUpdatingForm.current = true;
		setForm((prev: any) => ({ ...prev, criminalHistories }));
		
		await saveFormData();
		
		// Reset flag after a delay to allow for data loading
		setTimeout(() => isUpdatingForm.current = false, 1000);
	};

	const handleNext = async () => {
		const criminalHistories = getTransformedHistory();
		
		// Set flag to prevent useEffect from overwriting our data
		isUpdatingForm.current = true;
		setForm((prev: any) => ({ ...prev, criminalHistories }));
		
		const formDataToSave = {
			...form,
			criminalHistories
		};
		
		const savedApplicantId = await saveFormData(undefined, formDataToSave, true);
		
		if (savedApplicantId) {
			navigateToNext(FORM_ROUTES.LICENSE_HISTORY, savedApplicantId);
		}
		
		// Reset flag after navigation
		setTimeout(() => isUpdatingForm.current = false, 1000);
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
		return <FormSkeleton title="Criminal History" rows={4} />;
	}

	return (
		<form className="p-6">
			<h2 className="text-xl font-bold mb-4">Criminal History</h2>
			
			{/* Display Applicant ID and License ID if available */}
			{(applicantId || almsLicenseId) && (
				<div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded flex justify-between items-center">
					<div className="flex flex-col">
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
							onChange={() => {
								setConvicted('yes');
								setFieldErrors((prev: any) => ({ ...prev, conviction_general: '' }));
							}} 
							className="cursor-pointer"
						/> Yes
					</label>
					<label className="flex items-center gap-2 cursor-pointer">
						<input 
							type="radio" 
							name="convicted" 
							value="no" 
							checked={convicted === 'no'} 
							onChange={() => {
								setConvicted('no');
								// Clear conviction-related errors
								setFieldErrors((prev: any) => {
									const nextErrors = { ...prev };
									Object.keys(nextErrors).forEach(key => {
										if (key.includes('firNumber_') || key.includes('underSection_') || 
											key.includes('policeStation_') || key.includes('unit_') || 
											key.includes('district_') || key.includes('state_') || 
											key.includes('offence_') || key.includes('sentence_') || 
											key.includes('dateOfSentence_') || key === 'conviction_general') {
											delete nextErrors[key];
										}
									});
									return nextErrors;
								});
							}} 
							className="cursor-pointer"
						/> No
					</label>
				</div>
				
				{fieldErrors.conviction_general && (
					<p className="text-red-500 text-xs mb-4">{fieldErrors.conviction_general}</p>
				)}

				{convicted === 'yes' && provisions.map((prov, idx) => (
					<div key={idx} className="mb-6 border-b pb-4">
						<div className="font-medium mb-2">{idx === 0 ? 'i. Provisions to Enter–' : `ii. Provisions to Enter–`}</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-2">
							<Input 
								label="FIR Number" 
								name="firNumber" 
								value={prov.firNumber} 
								onChange={e => handleProvisionChange(idx, e)} 
								onBlur={e => handleProvisionBlur(idx, e)}
								placeholder="e.g., FIR 2023001" 
								error={fieldErrors[`firNumber_${idx}`]}
								required
							/>
							<Input 
								label="Under Section" 
								name="underSection" 
								value={prov.underSection} 
								onChange={e => handleProvisionChange(idx, e)} 
								onBlur={e => handleProvisionBlur(idx, e)}
								placeholder="e.g., Section 302 IPC" 
								error={fieldErrors[`underSection_${idx}`]}
								required
							/>
							<Input 
								label="Police Station" 
								name="policeStation" 
								value={prov.policeStation} 
								onChange={e => handleProvisionChange(idx, e)} 
								onBlur={e => handleProvisionBlur(idx, e)}
								placeholder="e.g., Saifabad PS" 
								error={fieldErrors[`policeStation_${idx}`]}
								required
							/>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-2">
							<Input 
								label="Unit" 
								name="unit" 
								value={prov.unit} 
								onChange={e => handleProvisionChange(idx, e)} 
								onBlur={e => handleProvisionBlur(idx, e)}
								placeholder="e.g., Central Zone" 
								error={fieldErrors[`unit_${idx}`]}
								required
							/>
							<Input 
								label="District" 
								name="district" 
								value={prov.district} 
								onChange={e => handleProvisionChange(idx, e)} 
								onBlur={e => handleProvisionBlur(idx, e)}
								placeholder="e.g., Hyderabad" 
								error={fieldErrors[`district_${idx}`]}
								required
							/>
							<Input 
								label="State" 
								name="state" 
								value={prov.state} 
								onChange={e => handleProvisionChange(idx, e)} 
								onBlur={e => handleProvisionBlur(idx, e)}
								placeholder="e.g., Telangana" 
								error={fieldErrors[`state_${idx}`]}
								required
							/>
						</div>
						<div className="font-medium mb-2">If Yes details thereof-</div>
						<div className="grid grid-cols-3 gap-6 mb-2">
							<Input 
								label="Offence" 
								name="offence" 
								value={prov.offence} 
								onChange={e => handleProvisionChange(idx, e)} 
								onBlur={e => handleProvisionBlur(idx, e)}
								placeholder="e.g., Arms Act Violation" 
								error={fieldErrors[`offence_${idx}`]}
								required
							/>
							<Input 
								label="Sentence" 
								name="sentence" 
								value={prov.sentence} 
								onChange={e => handleProvisionChange(idx, e)} 
								onBlur={e => handleProvisionBlur(idx, e)}
								placeholder="e.g., 6 Months Imprisonment" 
								error={fieldErrors[`sentence_${idx}`]}
								required
							/>
							<Input 
								label="Date of Sentence" 
								name="dateOfSentence" 
								type="date" 
								value={prov.dateOfSentence} 
								onChange={e => handleProvisionChange(idx, e)} 
								onBlur={e => handleProvisionBlur(idx, e)}
								placeholder="DD/MM/YYYY" 
								error={fieldErrors[`dateOfSentence_${idx}`]}
								required
							/>
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
							onChange={() => {
								setBond('no');
								// Clear bond-related errors
								setFieldErrors((prev: any) => {
									const nextErrors = { ...prev };
									delete nextErrors.bondDate;
									delete nextErrors.bondPeriod;
									return nextErrors;
								});
							}} 
							className="cursor-pointer"
						/> No
					</label>
				</div>
				{bond === 'yes' && (
					<div className="grid grid-cols-2 gap-6 mb-2">
						<Input 
							label="Date of Sentence" 
							name="dateOfSentence" 
							type="date" 
							value={bondDetails.dateOfSentence} 
							onChange={e => handleBondChange('dateOfSentence', e.target.value)} 
							placeholder="DD/MM/YYYY" 
							error={fieldErrors.bondDate}
							required
						/>
						<Input 
							label="Period of which bound" 
							name="period" 
							value={bondDetails.period} 
							onChange={e => handleBondChange('period', e.target.value)} 
							placeholder="e.g., 12 Months" 
							error={fieldErrors.bondPeriod}
							required
						/>
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
							onChange={() => {
								setProhibited('no');
								// Clear prohibited-related errors
								setFieldErrors((prev: any) => {
									const nextErrors = { ...prev };
									delete nextErrors.prohibitionDate;
									delete nextErrors.prohibitionPeriod;
									return nextErrors;
								});
							}} 
							className="cursor-pointer"
						/> No
					</label>
				</div>
				{prohibited === 'yes' && (
					<div className="grid grid-cols-2 gap-6 mb-2">
						<Input 
							label="Date of Sentence" 
							name="dateOfSentence" 
							type="date" 
							value={prohibitedDetails.dateOfSentence} 
							onChange={e => handleProhibitedChange('dateOfSentence', e.target.value)} 
							placeholder="DD/MM/YYYY" 
							error={fieldErrors.prohibitionDate}
							required
						/>
						<Input 
							label="Period of which bound" 
							name="period" 
							value={prohibitedDetails.period} 
							onChange={e => handleProhibitedChange('period', e.target.value)} 
							placeholder="e.g., 24 Months" 
							error={fieldErrors.prohibitionPeriod}
							required
						/>
					</div>
				)}
			</div>
			
			<FormFooter
				onSaveToDraft={handleSaveToDraft}
				onNext={handleNext}
				onPrevious={handlePrevious}
				isLoading={isSubmitting}
				disableActions={!isFormValid}
			/>
		</form>
	);
};

export default CriminalHistory;
