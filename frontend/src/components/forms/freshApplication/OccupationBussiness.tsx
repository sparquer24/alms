"use client";
import React from 'react';
import { Input, TextArea } from '../elements/Input';
import { Select } from '../elements/Select';
import FormFooter from '../elements/footer';
import { useRouter } from 'next/navigation';
import { FormSkeleton } from '../elements/FormSkeleton';
import { useApplicationForm } from '../../../hooks/useApplicationForm';
import { FORM_ROUTES } from '../../../config/formRoutes';
import { useLocationHierarchy } from '../../../hooks/useLocationHierarchy';
import { FieldRule } from '../../../utils/validation/types';
import { useFormValidation } from '../../../hooks/useFormValidation';

// ─── Validation rules ─────────────────────────────────────────────────────────

const occupationRules: FieldRule[] = [
	{ name: 'occupation', type: 'text', required: true, errorMessages: { required: 'Occupation is required.' } },
	{ name: 'officeAddress', type: 'address', required: true, minLength: 10, maxLength: 250, errorMessages: { required: 'Office/Business Address is required.', format: 'Please enter a valid Office/Business Address.' } },
	{ name: 'officeState', type: 'select', required: true, errorMessages: { required: 'Please select State.' } },
	{ name: 'officeDistrict', type: 'select', required: true, dependsOn: 'officeState', dependsOnMessage: 'Please select State first.', errorMessages: { required: 'Please select District.' } },
	{ name: 'cropLocation', type: 'custom', condition: (form) => !!(form.cropLocation?.trim() || form.areaUnderCultivation?.trim()), required: true, customValidator: (value) => {
		const v = value?.trim() || '';
		if (!v) return 'Location is required for Crop Protection under Rule 35.';
		if (v.startsWith(' ')) return 'Location cannot start with a space.';
		if (/^[^A-Za-z0-9]/.test(v)) return 'Location cannot start with a special character.';
		if (!/^[A-Za-z0-9\s]+$/.test(v)) return 'Only alphabets, numbers, and spaces are allowed.';
		return '';
	}},
	{ name: 'areaUnderCultivation', type: 'area', condition: (form) => !!(form.cropLocation?.trim() || form.areaUnderCultivation?.trim()), required: true, maxDecimals: 2, minValue: 0, errorMessages: { required: 'Area of Land Under Cultivation is required.', format: 'Enter a valid positive area value.' } },
];

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState = {
	occupation: '',
	officeAddress: '',
	officeState: '',
	officeDistrict: '',
	cropLocation: '',
	areaUnderCultivation: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

const OccupationBussiness: React.FC = () => {
	const router = useRouter();
	const validation = useFormValidation(occupationRules);
	
	const {
		form,
		setForm,
		applicantId,
		isSubmitting,
		almsLicenseId,
		submitError,
		submitSuccess,
		isLoading,
		handleChange: baseHandleChange,
		saveFormData,
		navigateToNext,
		loadExistingData,
		fieldErrors,
		setFieldErrors,
	} = useApplicationForm({
		initialState,
		formSection: 'occupation',
		validationRules: validation.validateAll,
	});

	// Location hierarchy for state and district
	const [locationState, locationActions] = useLocationHierarchy();

	// Sync location state with form values (only when data is loaded from backend)
	React.useEffect(() => {
		if (isLoading) return;
		if (!form.officeState) return;

		const values = {
			state: form.officeState,
			district: form.officeDistrict || '',
			zone: '',
			division: '',
			policeStation: '',
			stateName: form.officeStateName,
			districtName: form.officeDistrictName,
		};

		// Only sync if the selected state/district is different from location state
		const isOutOfSync = 
			form.officeState !== locationState.selectedState ||
			form.officeDistrict !== locationState.selectedDistrict;

		if (isOutOfSync) {
			locationActions.hydrateFromValues(values);
		}
	}, [form.officeState, form.officeDistrict, isLoading, locationState.selectedState, locationState.selectedDistrict]);

	// ── handleChange with real-time validation + input filtering ──
	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		const { value: filtered, error } = validation.processChange(name, value, form);
		setForm((prev: any) => ({ ...prev, [name]: filtered }));
		setFieldErrors((prev: any) => ({ ...prev, [name]: error }));
	};

	// ── Blur handler: auto-trim + re-validate ──
	const handleBlur = (
		e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>,
	) => {
		const { name, value } = e.target;
		const { value: trimmed, error } = validation.processBlur(name, value, form);
		if (trimmed !== value) {
			setForm((prev: any) => ({ ...prev, [name]: trimmed }));
		}
		setFieldErrors((prev: any) => ({ ...prev, [name]: error }));
	};

	// ── State change handler with real-time validation ──
	const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		locationActions.setSelectedState(value);

		const updatedForm = { ...form, officeState: value, officeDistrict: '' };
		setForm(updatedForm);

		// Validate state
		const { error: stateError } = validation.processChange('officeState', value, updatedForm);
		// Reset district error
		const { error: districtError } = validation.processChange('officeDistrict', '', updatedForm);
		setFieldErrors((prev: any) => ({
			...prev,
			officeState: stateError,
			officeDistrict: districtError,
		}));
	};

	// ── District change handler with real-time validation ──
	const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		locationActions.setSelectedDistrict(value);

		const updatedForm = { ...form, officeDistrict: value };
		setForm(updatedForm);

		const { error } = validation.processChange('officeDistrict', value, updatedForm);
		setFieldErrors((prev: any) => ({ ...prev, officeDistrict: error }));
	};

	// ── Trim all values before submission ──
	const getTrimmedForm = () => {
		const trimmed: any = {};
		for (const key of Object.keys(form)) {
			trimmed[key] = typeof form[key] === 'string' ? form[key].trim() : form[key];
		}
		return trimmed;
	};

	const handleSaveToDraft = async () => {
		const trimmed = getTrimmedForm();
		setForm(trimmed);
		await saveFormData(undefined, trimmed);
	};

	const handleNext = async () => {
		const trimmed = getTrimmedForm();
		setForm(trimmed);

		const savedApplicantId = await saveFormData(undefined, trimmed, true);
		
		if (savedApplicantId) {
			navigateToNext(FORM_ROUTES.CRIMINAL_HISTORY, savedApplicantId);
		}
	};

	const handlePrevious = async () => {
		// Refresh data from backend before navigating back
		if (applicantId) {
			await loadExistingData(applicantId);
			navigateToNext(FORM_ROUTES.ADDRESS_DETAILS, applicantId);
		} else {
			router.back();
		}
	};

	// Show loading state if data is being loaded
	if (isLoading) {
		return <FormSkeleton title="Occupation and Business" rows={3} />;
	}

	return (
		<form className="p-6">
			<h2 className="text-xl font-bold mb-4">Occupation and Business Details</h2>
			
		{/* Display Applicant ID and License ID if available */}
		{(applicantId || almsLicenseId) && (
			<div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
				<div className="flex flex-col">
					{/* <strong>Application ID: {applicantId ?? '—'}</strong> */}</div>
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

			<Input
				label="10. Occupation"
				name="occupation"
				value={form.occupation}
				onChange={handleChange}
				onBlur={handleBlur as any}
				placeholder="e.g., Business Owner"
				className="mb-4"
				required
				error={fieldErrors.occupation}
			/>
			<TextArea
				label="11. Office/Business address"
				name="officeAddress"
				value={form.officeAddress}
				onChange={handleChange}
				onBlur={handleBlur as any}
				placeholder="e.g., Shop No. 5, Commercial Complex, MG Road"
				rows={2}
				maxLength={250}
				className="mb-4"
				required
				error={fieldErrors.officeAddress}
			/>
			<div className="grid grid-cols-2 gap-6 mb-4">
				<Select
					label="State"
					name="officeState"
					value={form.officeState}
					onChange={handleStateChange}
					onFocus={() => {
						if (locationState.states.length <= 1) {
							locationActions.loadStates();
						}
					}}
					options={locationActions.getSelectOptions().stateOptions}
					placeholder={locationState.loadingStates ? "Loading states..." : "Select state"}
					disabled={locationState.loadingStates}
					required
					error={fieldErrors.officeState}
				/>
				<Select
					label="District"
					name="officeDistrict"
					value={form.officeDistrict}
					onChange={handleDistrictChange}
					onFocus={() => {
						if (form.officeState && locationState.districts.length <= 1) {
							locationActions.loadDistricts(form.officeState);
						}
					}}
					options={locationActions.getSelectOptions().districtOptions}
					placeholder={
						locationState.loadingDistricts 
							? "Loading districts..." 

							: !form.officeState 
							? "Select state first" 
							: "Select district"
					}
					disabled={!form.officeState || locationState.loadingDistricts}
					disabledMessage={!form.officeState ? "Please select State first." : undefined}
					required
					error={fieldErrors.officeDistrict}
				/>
			</div>
			{locationState.error && (
				<div className="mb-4 text-red-500 text-sm">
					Error loading locations: {locationState.error}
				</div>
			)}
			<div className="mb-2 text-sm font-semibold">12. Additional particulars if the licence is required for crop protection under rule 35</div>
			<div className="grid grid-cols-2 gap-6">
				<Input
					label="Location"
					name="cropLocation"
					value={form.cropLocation}
					onChange={handleChange}
					onBlur={handleBlur as any}
					placeholder="e.g., Survey No 45 Ranga Reddy"
					error={fieldErrors.cropLocation}
				/>
				<Input
					label="Area of land under cultivation"
					name="areaUnderCultivation"
					value={form.areaUnderCultivation}
					onChange={handleChange}
					onBlur={handleBlur as any}
					placeholder="e.g., 12.50"
					error={fieldErrors.areaUnderCultivation}
				/>
			</div>
			
			<FormFooter
				onSaveToDraft={handleSaveToDraft}
				onNext={handleNext}
				onPrevious={handlePrevious}
				isLoading={isSubmitting}
				disableActions={!validation.isValid(form)}
				errors={fieldErrors}
			/>
		</form>
	);
};

export default OccupationBussiness;
