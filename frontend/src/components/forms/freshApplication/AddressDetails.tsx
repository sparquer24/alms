"use client";
import React from 'react';
import { Input } from '../elements/Input';
import { TextArea } from '../elements/Input';
import { Checkbox } from '../elements/Checkbox';
import { LocationHierarchy } from '../elements/LocationHierarchy';
import FormFooter from '../elements/footer';
import { AddressFormData } from '../../../types/location';
import { useRouter } from 'next/navigation';
import { useApplicationForm } from '../../../hooks/useApplicationForm';
import { FORM_ROUTES } from '../../../config/formRoutes';

const initialState: AddressFormData = {
	presentAddress: '',
	presentState: '',
	presentDistrict: '',
	presentZone: '',
	presentDivision: '',
	presentPoliceStation: '',
	presentSince: '',
	sameAsPresent: false,
	permanentAddress: '',
	permanentState: '',
	permanentDistrict: '',
	permanentZone: '',
	permanentDivision: '',
	permanentPoliceStation: '',
	telephoneOffice: '',
	telephoneResidence: '',
	officeMobileNumber: '',
	alternativeMobile: '',
};

// Validation rules for address information
const validateAddressInfo = (formData: any) => {
	const validationErrors = [];
	
	if (!formData.presentAddress?.trim()) {
		validationErrors.push('Present address is required');
	}
	if (!formData.presentState?.trim()) {
		validationErrors.push('Present state is required');
	}
	if (!formData.presentDistrict?.trim()) {
		validationErrors.push('Present district is required');
	}
	if (!formData.permanentAddress?.trim()) {
		validationErrors.push('Permanent address is required');
	}
	
	return validationErrors;
};

const AddressDetails: React.FC = () => {
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
		handleChange: baseHandleChange,
		saveFormData,
		navigateToNext,
		loadExistingData,
	} = useApplicationForm({
		initialState,
		formSection: 'address',
		validationRules: validateAddressInfo,
	});

	// Enhanced handleChange to support both input and textarea
	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setForm((prev: any) => ({ ...prev, [name]: value }));
	};

	const handleSaveToDraft = async () => {
		await saveFormData();
	};

	const handleNext = async () => {
		const savedApplicantId = await saveFormData();
		
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
	};

	const handleCheckbox = (checked: boolean) => {
		setForm((prev: any) => ({ ...prev, sameAsPresent: checked }));
		if (checked) {
			setForm((prev: any) => ({
				...prev,
				permanentAddress: prev.presentAddress,
				permanentState: prev.presentState,
				permanentDistrict: prev.presentDistrict,
				permanentZone: prev.presentZone,
				permanentDivision: prev.presentDivision,
				permanentPoliceStation: prev.presentPoliceStation,
			}));
		}
	};

	// Show loading state if data is being loaded
	if (isLoading) {
		return (
			<div className="p-6">
				<h2 className="text-xl font-bold mb-4">Address Details</h2>
				<div className="flex justify-center items-center py-8">
					<div className="text-gray-500">Loading...</div>
				</div>
			</div>
		);
	}

	return (
		<form className="p-6">
			<h2 className="text-xl font-bold mb-4">Address Details</h2>
			
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

			<div className="grid grid-cols-2 gap-6 mb-2">
				<div className="col-span-2">
					<TextArea
						label="8. Present address"
						name="presentAddress"
						value={form.presentAddress}
						onChange={handleChange}
						placeholder="Enter present address"
						rows={2}
					/>
				</div>
				
				<LocationHierarchy
					namePrefix="present"
					values={{
						state: form.presentState,
						district: form.presentDistrict,
						zone: form.presentZone,
						division: form.presentDivision,
						policeStation: form.presentPoliceStation,
					}}
					onChange={handleLocationChange}
					required={true}
					className="col-span-2"
				/>
				
				<Input
					label="Since when residing at present address"
					name="presentSince"
					type="date"
					value={form.presentSince}
					onChange={handleChange}
					placeholder="DD/MM/YYYY"
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
						placeholder="Enter permanent address"
						rows={2}
					/>
				</div>
				
				<LocationHierarchy
					namePrefix="permanent"
					values={{
						state: form.permanentState,
						district: form.permanentDistrict,
						zone: form.permanentZone,
						division: form.permanentDivision,
						policeStation: form.permanentPoliceStation,
					}}
					onChange={handleLocationChange}
					required={true}
					disabled={form.sameAsPresent}
					className="col-span-2"
				/>
			</div>
			<div className="text-xs text-gray-700 mb-4">
				NOTE: Nearest Police Station means the Police Station under whose jurisdiction the place given in the address comes
			</div>
			<div className="bg-blue-50 rounded-lg p-4 grid grid-cols-4 gap-4 mb-2 h-30">
				<Input
					label="Mobile Number\Office"
					name="officeMobileNumber"
					value={form.officeMobileNumber}
					onChange={handleChange}
					placeholder="0000 0000 0000"
				/>
				<Input
					label="Residence"
					name="telephoneResidence"
					value={form.telephoneResidence}
					onChange={handleChange}
					placeholder="0000 0000 0000"
				/>
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
						placeholder="0000 0000 0000"
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
						placeholder="0000 0000 0000"
					/>
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

export default AddressDetails;
