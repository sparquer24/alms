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

const initialState = {
	occupation: '',
	officeAddress: '',
	officeState: '',
	officeDistrict: '',
	cropLocation: '',
	areaUnderCultivation: '',
};

// Validation rules for occupation information
const validateOccupationInfo = (formData: any) => {
	const validationErrors = [];
	
	if (!formData.occupation?.trim()) {
		validationErrors.push('Occupation is required');
	}
	if (!formData.officeAddress?.trim()) {
		validationErrors.push('Office/Business address is required');
	}
	
	return validationErrors;
};

const OccupationBussiness: React.FC = () => {
	const router = useRouter();
	
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
	} = useApplicationForm({
		initialState,
		formSection: 'occupation',
		validationRules: validateOccupationInfo,
	});

	// Enhanced handleChange to support both input and textarea
	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setForm((prev: any) => ({ ...prev, [name]: value }));
	};

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

	const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		locationActions.setSelectedState(value);
		setForm((prev: any) => ({ 
			...prev, 
			officeState: value,
			officeDistrict: '', // Clear district when state changes
		}));
	};

	const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
		const value = e.target.value;
		locationActions.setSelectedDistrict(value);
		setForm((prev: any) => ({ ...prev, officeDistrict: value }));
	};

	const handleSaveToDraft = async () => {
		await saveFormData();
	};

	const handleNext = async () => {
		const savedApplicantId = await saveFormData(undefined, undefined, true);
		
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
					{/* <strong>Application ID: {applicantId ?? '—'}</strong> */}
					{almsLicenseId && <strong className='text-sm'>License ID: {almsLicenseId}</strong>}
				</div>
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
				placeholder="Enter occupation"
				className="mb-4"
				required
			/>
			<TextArea
				label="11. Office/Business address"
				name="officeAddress"
				value={form.officeAddress}
				onChange={handleChange}
				placeholder="Enter office or business address"
				rows={2}
				className="mb-4"
				required
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
					placeholder="Enter location"
				/>
				<Input
					label="Area of land under cultivation"
					name="areaUnderCultivation"
					value={form.areaUnderCultivation}
					onChange={handleChange}
					placeholder="Enter area (in acres)"
				/>
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

export default OccupationBussiness;
