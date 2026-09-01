"use client";
import React, { useEffect } from 'react';
import { Input } from '../elements/Input';
import { TextArea } from '../elements/Input';
import { Checkbox } from '../elements/Checkbox';
import { LocationHierarchy } from '../elements/LocationHierarchy';
import { FormSkeleton } from '../elements/FormSkeleton';
import FormFooter from '../elements/footer';
import { AddressFormData } from '../../../types/location';
import { useRouter } from 'next/navigation';
import { useApplicationForm } from '../../../hooks/useApplicationForm';
import { FORM_ROUTES } from '../../../config/formRoutes';
import { getUserFromCookie } from '../../../utils/authCookies';
import { FieldRule } from '../../../utils/validation/types';
import { useFormValidation } from '../../../hooks/useFormValidation';

// ─── Validation rules ─────────────────────────────────────────────────────────

const addressRules: FieldRule[] = [
	{ name: 'presentAddress', type: 'address', required: true, minLength: 10, maxLength: 250, errorMessages: { required: 'Present Address is required.' } },
	{ name: 'presentState', type: 'select', required: true, errorMessages: { required: 'Present state is required' } },
	{ name: 'presentDistrict', type: 'select', required: true, errorMessages: { required: 'Present district is required' } },
	{ name: 'presentSince', type: 'date', required: true, noFuture: true, errorMessages: { required: 'Residing since date is required' } },
	{ name: 'permanentAddress', type: 'address', required: true, minLength: 10, maxLength: 250, condition: (form) => !form.sameAsPresent },
	{ name: 'officeMobileNumber', type: 'mobile', required: true, errorMessages: { required: 'Mobile Number is required.', format: 'Mobile Number must contain exactly 10 digits.' } },
	{ name: 'telephoneResidence', type: 'phone', errorMessages: { format: 'Residence Number must contain 10 to 15 digits.' } },
	{ name: 'alternativeMobile', type: 'mobile', required: false, notEqualField: 'officeMobileNumber', errorMessages: { format: 'Alternative Mobile Number must contain exactly 10 digits.', matchField: 'Alternative Mobile Number cannot be the same as Mobile Number.' } },
	{ name: 'telephoneOffice', type: 'phone', errorMessages: { format: 'Telephone Number must contain 10 to 15 digits.' } },
];

// ─── Get user location defaults for pre-filling ───────────────────────────────

const getUserLocationDefaults = () => {
	const userData = getUserFromCookie();
	if (userData && userData.location) {
		return {
			presentState: userData.location.state?.id ? String(userData.location.state.id) : '',
			presentDistrict: userData.location.district?.id ? String(userData.location.district.id) : '',
			presentZone: userData.location.zone?.id ? String(userData.location.zone.id) : '',
			presentRangeOffice: userData.location.rangeOffice?.id ? String(userData.location.rangeOffice.id) : '',
			presentStateName: userData.location.state?.name || '',
			presentDistrictName: userData.location.district?.name || '',
			presentZoneName: userData.location.zone?.name || '',
			presentRangeOfficeName: userData.location.rangeOffice?.name || '',
		};
	}
	return {
		presentState: '',
		presentDistrict: '',
		presentZone: '',
		presentRangeOffice: '',
		presentStateName: '',
		presentDistrictName: '',
		presentZoneName: '',
		presentRangeOfficeName: '',
	};
};

// ─── Initial state ────────────────────────────────────────────────────────────

const initialState: AddressFormData = {
	presentAddress: '',
	presentState: '',
	presentDistrict: '',
	presentRangeOffice: '',
	presentZone: '',
	presentDivision: '',
	presentPoliceStation: '',
	presentSince: '',
	sameAsPresent: false,
	permanentAddress: '',
	permanentState: '',
	permanentDistrict: '',
	permanentRangeOffice: '',
	permanentZone: '',
	permanentDivision: '',
	permanentPoliceStation: '',
	telephoneOffice: '',
	telephoneResidence: '',
	officeMobileNumber: '',
	alternativeMobile: '',
};

// ─── Component ────────────────────────────────────────────────────────────────

const AddressDetails: React.FC = () => {
	const router = useRouter();
	const validation = useFormValidation(addressRules);
	
	const {
		form,
		setForm,
		applicantId,
		almsLicenseId,
		isSubmitting,
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
		formSection: 'address',
		validationRules: validation.validateAll,
	});

	const [isZSRole, setIsZSRole] = React.useState(false);

	// Pre-fill Present Address location fields only if they're empty (no existing data)
	useEffect(() => {
		// Wait for loading to complete
		if (isLoading) return;

		const userData = getUserFromCookie();
		const isZS = userData?.role?.name === 'ZS' || userData?.role === 'ZS';
		setIsZSRole(isZS);
		
		// Only pre-fill if all location fields are empty (no existing data)
		if (!form.presentState && !form.presentDistrict && !form.presentZone && !form.presentRangeOffice) {
			const locationDefaults = getUserLocationDefaults();
			
			if (locationDefaults.presentState) {
				// Prevent infinite loop by only updating if different
				if (form.presentState !== locationDefaults.presentState || 
					form.presentDistrict !== locationDefaults.presentDistrict || 
					form.presentZone !== locationDefaults.presentZone ||
					form.presentRangeOffice !== locationDefaults.presentRangeOffice) {
					setForm((prev: any) => ({
						...prev,
						presentState: locationDefaults.presentState,
						presentDistrict: locationDefaults.presentDistrict,
						presentZone: locationDefaults.presentZone,
						presentRangeOffice: locationDefaults.presentRangeOffice,
						presentStateName: locationDefaults.presentStateName,
						presentDistrictName: locationDefaults.presentDistrictName,
						presentZoneName: locationDefaults.presentZoneName,
						presentRangeOfficeName: locationDefaults.presentRangeOfficeName,
					}));
				}
			}
		}
	}, [isLoading, form.presentState, form.presentDistrict, form.presentZone, form.presentRangeOffice]);

	// ── Sync permanent address when sameAsPresent is checked ──
	useEffect(() => {
		if (form.sameAsPresent) {
			setForm((prev: any) => ({
				...prev,
				permanentAddress: prev.presentAddress,
				permanentState: prev.presentState,
				permanentDistrict: prev.presentDistrict,
				permanentRangeOffice: prev.presentRangeOffice,
				permanentZone: prev.presentZone,
				permanentDivision: prev.presentDivision,
				permanentPoliceStation: prev.presentPoliceStation,
			}));
			// Clear permanent address errors when syncing
			setFieldErrors((prev: any) => {
				const cleaned = { ...prev };
				delete cleaned.permanentAddress;
				delete cleaned.permanentState;
				delete cleaned.permanentDistrict;
				delete cleaned.permanentRangeOffice;
				delete cleaned.permanentZone;
				delete cleaned.permanentDivision;
				delete cleaned.permanentPoliceStation;
				return cleaned;
			});
		}
	}, [
		form.sameAsPresent,
		form.presentAddress,
		form.presentState,
		form.presentDistrict,
		form.presentRangeOffice,
		form.presentZone,
		form.presentDivision,
		form.presentPoliceStation,
	]);

	// ── handleChange with real-time validation + input filtering ──
	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		const { value: filtered, error } = validation.processChange(name, value, form);
		setForm((prev: any) => ({ ...prev, [name]: filtered }));
		setFieldErrors((prev: any) => ({ ...prev, [name]: error }));
	};

	// ── Blur handler: auto-trim + re-validate ──
	const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		const { value: trimmed, error } = validation.processBlur(name, value, form);
		if (trimmed !== value) setForm((prev: any) => ({ ...prev, [name]: trimmed }));
		setFieldErrors((prev: any) => ({ ...prev, [name]: error }));
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
			navigateToNext(FORM_ROUTES.OCCUPATION_DETAILS, savedApplicantId);
		}
	};

	const handlePrevious = async () => {
		// Refresh data from backend before navigating back
		if (applicantId) {
			await loadExistingData(applicantId);
			navigateToNext(FORM_ROUTES.PERSONAL_INFO, applicantId);
		} else {
			router.back();
		}
	};

	const handleLocationChange = (field: string, value: string) => {
		setForm((prev: any) => ({ ...prev, [field]: value }));
		if (fieldErrors[field]) {
			setFieldErrors((prev: any) => ({ ...prev, [field]: '' }));
		}
	};

	const handleCheckbox = (checked: boolean) => {
		setForm((prev: any) => ({ ...prev, sameAsPresent: checked }));
		if (checked) {
			setForm((prev: any) => ({
				...prev,
				sameAsPresent: true,
				permanentAddress: prev.presentAddress,
				permanentState: prev.presentState,
				permanentDistrict: prev.presentDistrict,
				permanentRangeOffice: prev.presentRangeOffice,
				permanentZone: prev.presentZone,
				permanentDivision: prev.presentDivision,
				permanentPoliceStation: prev.presentPoliceStation,
			}));
			// Clear all permanent address errors
			setFieldErrors((prev: any) => {
				const cleaned = { ...prev };
				delete cleaned.permanentAddress;
				delete cleaned.permanentState;
				delete cleaned.permanentDistrict;
				delete cleaned.permanentRangeOffice;
				delete cleaned.permanentZone;
				delete cleaned.permanentDivision;
				delete cleaned.permanentPoliceStation;
				return cleaned;
			});
		}
	};

	// Show loading state if data is being loaded
	if (isLoading) {
		return <FormSkeleton title="Address Details" rows={5} />;
	}

	return (
		<form className="p-6">
			<h2 className="text-xl font-bold mb-4">Address Details</h2>
			
			{/* Display Applicant ID and License ID if available */}
			{(applicantId || almsLicenseId) && (
				<div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded flex justify-between items-center">
					<div className="flex flex-col">
						{/* <strong>Application ID: {applicantId ?? '—'}</strong> */}
						{almsLicenseId && <strong className='text-sm'>Acknowledgement No.: {almsLicenseId}</strong>}
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

			<div className="grid grid-cols-2 gap-6 mb-2">
				<div className="col-span-2">
					<TextArea
						label="8. Present address"
						name="presentAddress"
						value={form.presentAddress}
						onChange={handleChange}
						onBlur={handleBlur as any}
						placeholder="e.g., H.No. 12-34, Main Road, Secunderabad"
						rows={2}
						maxLength={250}
						error={fieldErrors.presentAddress}
						required
					/>
				</div>
				
				<LocationHierarchy
					namePrefix="present"
					values={{
						state: form.presentState,
						district: form.presentDistrict,
						rangeOffice: form.presentRangeOffice || '',
						zone: form.presentZone,
						division: form.presentDivision,
						policeStation: form.presentPoliceStation,
						stateName: form.presentStateName,
						districtName: form.presentDistrictName,
						rangeOfficeName: form.presentRangeOfficeName,
						zoneName: form.presentZoneName,
						divisionName: form.presentDivisionName,
						policeStationName: form.presentPoliceStationName,
					}}
					onChange={handleLocationChange}
					required={true}
					className="col-span-2"
					errors={fieldErrors}
					disabledFields={{
						state: isZSRole,
						district: isZSRole,
						rangeOffice: isZSRole,
						zone: isZSRole,
					}}
				/>
				
				<Input
					label="Since when residing at present address"
					name="presentSince"
					type="date"
					value={form.presentSince}
					onChange={handleChange}
					placeholder="DD/MM/YYYY"
					error={fieldErrors.presentSince}
					max={new Date().toISOString().split('T')[0]}
					required
				/>
			</div>
			<div className="text-xs text-gray-700 mb-2">
				NOTE: Nearest Police Station means the Police Station under whose jurisdiction the place given in the address comes
			</div>
			<Checkbox
				label="Same as present address"
				name="sameAsPresent"
				checked={form.sameAsPresent}
				onChange={handleCheckbox}
				className="mb-2"
			/>
			<br/>
			<div className="grid grid-cols-2 gap-6 mb-2">
				<div className="col-span-2">
					<TextArea
						label="9. Permanent address"
						name="permanentAddress"
						value={form.permanentAddress}
						onChange={handleChange}
						onBlur={!form.sameAsPresent ? handleBlur as any : undefined}
						placeholder="e.g., Plot 56, Gandhi Nagar, Vizag"
						rows={2}
						maxLength={250}
						error={!form.sameAsPresent ? fieldErrors.permanentAddress : undefined}
						required={!form.sameAsPresent}
						disabled={form.sameAsPresent}
						readOnly={form.sameAsPresent}
					/>
				</div>
				
				<LocationHierarchy
					namePrefix="permanent"
					values={{
						state: form.permanentState,
						district: form.permanentDistrict,
						rangeOffice: form.permanentRangeOffice || '',
						zone: form.permanentZone,
						division: form.permanentDivision,
						policeStation: form.permanentPoliceStation,
						stateName: form.permanentStateName,
						districtName: form.permanentDistrictName,
						rangeOfficeName: form.permanentRangeOfficeName,
						zoneName: form.permanentZoneName,
						divisionName: form.permanentDivisionName,
						policeStationName: form.permanentPoliceStationName,
					}}
					onChange={handleLocationChange}
					required={!form.sameAsPresent}
					disabled={form.sameAsPresent}
					className="col-span-2"
					errors={!form.sameAsPresent ? fieldErrors : {}}
				/>
			</div>
			<div className="text-xs text-gray-700 mb-4">
				NOTE: Nearest Police Station means the Police Station under whose jurisdiction the place given in the address comes
			</div>          <div className="bg-blue-50 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-2">
				<Input
					label="Mobile Number\Office"
					name="officeMobileNumber"
					value={form.officeMobileNumber}
					onChange={handleChange}
					onBlur={handleBlur as any}
					placeholder="e.g., 9876543210"
					error={fieldErrors.officeMobileNumber}
					maxLength={10}
					required
				/>
				<div className="flex flex-col">
					<label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="telephoneResidence">
						Residence
						<span className="ml-1 text-xs text-gray-400 align-middle">(optional)</span>
					</label>
					<Input
						label=""
						name="telephoneResidence"
						value={form.telephoneResidence}
						onChange={handleChange}
						onBlur={handleBlur as any}
						placeholder="e.g., 04027654321"
						error={fieldErrors.telephoneResidence}
						maxLength={15}
					/>
				</div>
				<div className="flex flex-col">
					<label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="alternativeMobile">
						Alternative Mobile Number
						<span className="ml-1 text-xs text-gray-400 align-middle">(optional)</span>
					</label>
					<Input
						label=""
						name="alternativeMobile"
						value={form.alternativeMobile}
						onChange={handleChange}
						onBlur={handleBlur as any}
						placeholder="e.g., 8765432109"
						error={fieldErrors.alternativeMobile}
						maxLength={10}
					/>
				</div>
				<div className="flex flex-col">
					<label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="telephoneOffice">
						Telephone Number\Office
						<span className="ml-1 text-xs text-gray-400 align-middle">(optional)</span>
					</label>
					<Input
						label=""
						name="telephoneOffice"
						value={form.telephoneOffice}
						onChange={handleChange}
						onBlur={handleBlur as any}
						placeholder="e.g., 04023456789"
						error={fieldErrors.telephoneOffice}
						maxLength={15}
					/>
				</div>

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

export default AddressDetails;
