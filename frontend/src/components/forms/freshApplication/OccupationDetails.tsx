"use client";
import React from 'react';
import { Input } from '../elements/Input';
import { useRouter } from 'next/navigation';
import FormFooter from '../elements/footer';
import { useApplicationForm } from '../../../hooks/useApplicationForm';
import { FORM_ROUTES } from '../../../config/formRoutes';

const initialState = {
	occupation: '',
	employerName: '',
	businessDetails: '',
	annualIncome: '',
	workExperience: '',
	businessType: '',
};

// Validation rules for occupation information
const validateOccupationInfo = (formData: any) => {
	const validationErrors = [];
	
	if (!formData.occupation?.trim()) {
		validationErrors.push('Occupation is required');
	}
	if (!formData.annualIncome?.trim()) {
		validationErrors.push('Annual income is required');
	}
	
	return validationErrors;
};

const OccupationDetails: React.FC = () => {
	const router = useRouter();
	
	const {
		form,
		applicantId,
		isSubmitting,
		submitError,
		submitSuccess,
		isLoading,
		handleChange,
		saveFormData,
		navigateToNext,
	} = useApplicationForm({
		initialState,
		formSection: 'occupation',
		validationRules: validateOccupationInfo,
	});

	const handleSaveToDraft = async () => {
		await saveFormData();
	};

	const handleNext = async () => {
		const savedApplicantId = await saveFormData();
		
		if (savedApplicantId) {
			navigateToNext(FORM_ROUTES.CRIMINAL_HISTORY, savedApplicantId);
		}
	};

	const handlePrevious = () => {
		if (applicantId) {
			navigateToNext(FORM_ROUTES.ADDRESS_DETAILS, applicantId);
		} else {
			router.back();
		}
	};

	// Show loading state if data is being loaded
	if (isLoading) {
		return (
			<div className="p-6">
				<h2 className="text-xl font-bold mb-4">Occupation and Business Details</h2>
				<div className="flex justify-center items-center py-8">
					<div className="text-gray-500">Loading existing data...</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-6">
			<h2 className="text-xl font-bold mb-4">Occupation and Business Details</h2>
			
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

			<div className="grid grid-cols-2 gap-6 mb-6">
				<Input
					label="Occupation"
					name="occupation"
					value={form.occupation}
					onChange={handleChange}
					placeholder="Enter your occupation"
					required
				/>
				<Input
					label="Employer Name"
					name="employerName"
					value={form.employerName}
					onChange={handleChange}
					placeholder="Enter employer name"
				/>
				<Input
					label="Business Details"
					name="businessDetails"
					value={form.businessDetails}
					onChange={handleChange}
					placeholder="Enter business details"
				/>
				<Input
					label="Annual Income"
					name="annualIncome"
					type="number"
					value={form.annualIncome}
					onChange={handleChange}
					placeholder="Enter annual income"
					required
				/>
				<Input
					label="Work Experience (Years)"
					name="workExperience"
					type="number"
					value={form.workExperience}
					onChange={handleChange}
					placeholder="Enter years of experience"
				/>
				<Input
					label="Business Type"
					name="businessType"
					value={form.businessType}
					onChange={handleChange}
					placeholder="Enter business type"
				/>
			</div>
			
			<FormFooter
				onSaveToDraft={handleSaveToDraft}
				onNext={handleNext}
				onPrevious={handlePrevious}
				isLoading={isSubmitting}
			/>
		</div>
	);
};

export default OccupationDetails;