"use client";
import React from 'react';
import { Input } from '../elements/Input';
import { useRouter } from 'next/navigation';
import { FormSkeleton } from '../elements/FormSkeleton';
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
	const errors: Record<string, string> = {};
	
	if (!formData.occupation?.trim()) {
		errors.occupation = 'Occupation is required';
	}
	if (!formData.annualIncome?.trim()) {
		errors.annualIncome = 'Annual income is required';
	}
	
	return errors;
};

const OccupationDetails: React.FC = () => {
	const router = useRouter();
	
	const {
		form,
		applicantId,
		isSubmitting,
	    almsLicenseId,
		submitError,
		submitSuccess,
		isLoading,
		handleChange: baseHandleChange,
		saveFormData,
		navigateToNext,
		fieldErrors,
		setFieldErrors,

	} = useApplicationForm({
		initialState,
		formSection: 'occupation',
		validationRules: validateOccupationInfo,
	});

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
		baseHandleChange(e as any);
		if (fieldErrors[e.target.name]) {
			setFieldErrors((prev: any) => ({ ...prev, [e.target.name]: '' }));
		}
	};

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
		return <FormSkeleton title="Occupation and Business Details" rows={3} />;
	}

	return (
		<div className="p-6">
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

			<div className="grid grid-cols-2 gap-6 mb-6">
				<Input
					label="Occupation"
					name="occupation"
					value={form.occupation}
					onChange={handleChange}
					placeholder="Enter your occupation"
					error={fieldErrors.occupation}
					required
				/>
				<Input
					label="Employer Name"
					name="employerName"
					value={form.employerName}
					onChange={handleChange}
					placeholder="Enter employer name"
					error={fieldErrors.employerName}
				/>
				<Input
					label="Business Details"
					name="businessDetails"
					value={form.businessDetails}
					onChange={handleChange}
					placeholder="Enter business details"
					error={fieldErrors.businessDetails}
				/>
				<Input
					label="Annual Income"
					name="annualIncome"
					type="number"
					value={form.annualIncome}
					onChange={handleChange}
					placeholder="Enter annual income"
					error={fieldErrors.annualIncome}
					required
				/>
				<Input
					label="Work Experience (Years)"
					name="workExperience"
					type="number"
					value={form.workExperience}
					onChange={handleChange}
					placeholder="Enter years of experience"
					error={fieldErrors.workExperience}
				/>
				<Input
					label="Business Type"
					name="businessType"
					value={form.businessType}
					onChange={handleChange}
					placeholder="Enter business type"
					error={fieldErrors.businessType}
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