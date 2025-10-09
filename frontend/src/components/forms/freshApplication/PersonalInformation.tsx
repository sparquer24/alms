"use client";
import React from 'react';
import { IoMdMale, IoMdFemale } from 'react-icons/io';
import { Input } from '../elements/Input';
import { useRouter } from 'next/navigation';
import FormFooter from '../elements/footer';
import { useApplicationForm } from '../../../hooks/useApplicationForm';
import { FORM_ROUTES } from '../../../config/formRoutes';

const initialState = {
	acknowledgementNo: '',
	firstName: '',
	middleName: '',
	lastName: '',
	filledBy: '',
	parentOrSpouseName: '',
	sex: '',
	placeOfBirth: '',
	dateOfBirth: '',
	panNumber: '',
	aadharNumber: '',
	dobInWords: '',
};

// Validation rules for personal information
const validatePersonalInfo = (formData: any) => {
	const validationErrors = [];
	
	if (!formData.firstName?.trim()) {
		validationErrors.push('First name is required');
	}
	if (!formData.lastName?.trim()) {
		validationErrors.push('Last name is required');
	}
	if (!formData.parentOrSpouseName?.trim()) {
		validationErrors.push('Parent/Spouse name is required');
	}
	if (!formData.sex) {
		validationErrors.push('Please select sex');
	}
	
	return validationErrors;
};

const PersonalInformation: React.FC = () => {
	const router = useRouter();
	
	const {
		form,
		applicantId,
		isSubmitting,
		submitError,
		submitSuccess,
		handleChange,
		saveFormData,
		navigateToNext,
	} = useApplicationForm({
		initialState,
		formSection: 'personal',
		validationRules: validatePersonalInfo,
	});

	const handleSaveToDraft = async () => {
		console.log('💾 Save to Draft clicked - Current applicantId:', applicantId);
		await saveFormData();
	};

	const handleNext = async () => {
		console.log('➡️ Next clicked - Current applicantId:', applicantId);
		const savedApplicantId = await saveFormData();
		
		if (savedApplicantId) {
			console.log('✅ Successfully saved, navigating with ID:', savedApplicantId);
			navigateToNext(FORM_ROUTES.ADDRESS_DETAILS, savedApplicantId);
		} else {
			console.log('❌ Failed to save, not navigating');
		}
	};

	const handlePrevious = () => {
		router.back();
	};

	return (
		<div className="p-6">
			<h2 className="text-xl font-bold mb-4">Personal Information</h2>
			
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

			<div className='mb-12'>
				<Input
				className='w-1/3'
				label="Alice Acknowledgement Number"
				name="acknowledgementNo"
				value={form.acknowledgementNo}
				onChange={handleChange}
				//placeholder="Enter number"
			/>
			</div>
			<div className="grid  grid-cols-4 gap-10 mb-4">
			<Input
				label="1. Applicant First Name"
				name="firstName"
				value={form.firstName}
				onChange={handleChange}
				required
				//placeholder="Enter first name"
			/>
			<Input
				label="Applicant Middle Name"
				name="middleName"
				value={form.middleName}
				onChange={handleChange}
				//placeholder="Enter middle name"
			/>
			<Input
				label="Applicant Last Name"
				name="lastName"
				value={form.lastName}
				onChange={handleChange}
				required
				//placeholder="Enter last name"
			/>
			   <div className="flex flex-col">
				   <label htmlFor="filledBy" className="block text-sm font-medium text-gray-700 mb-1">
					   Application filled by<br/>
					   <span className="text-xs text-gray-400 ml-1">(Zonal Superintendent name)</span>
				   </label>
				   <Input
					   label=""
					   name="filledBy"
					   value={form.filledBy}
					   onChange={handleChange}
					//    //placeholder="Self/Agent/Other"
				   />
			   </div>
			<Input
				label="2. Parent/ Spouse Name"
				name="parentOrSpouseName"
				value={form.parentOrSpouseName}
				onChange={handleChange}
				required
				//placeholder="Enter parent/spouse name"
			/>
				<div className="flex flex-col">
					<span className="block text-sm font-medium text-gray-700 mb-1">3. Sex</span>
					<div className="flex items-center gap-6">
						<label className="flex items-center gap-2">
							<input
								type="radio"
								name="sex"
								value="Male"
								checked={form.sex === 'Male'}
								onChange={handleChange}
							/>
							Male
							<IoMdMale className="text-xl" /> 
						</label>
						<label className="flex items-center gap-2">
							<input
								type="radio"
								name="sex"
								value="Female"
								checked={form.sex === 'Female'}
								onChange={handleChange}
							/>
							 Female
							<IoMdFemale className="text-xl" />
						</label>
					</div>
				</div>
				<Input
					label="4. Place of Birth (Nativity)"
					name="placeOfBirth"
					value={form.placeOfBirth}
					onChange={handleChange}
					//placeholder="Enter place of birth"
				/>
				   <div className="flex flex-col">
					   <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-1">
						   5. Date of birth in Christian era<br/>
						   <span className="text-xs text-gray-400 ml-1">(Must be 21 years old on the date of application)</span>
					   </label>
					   <Input
						   label=""
						   name="dateOfBirth"
						   type="date"
						   value={form.dateOfBirth}
						   onChange={handleChange}
						   //placeholder="mm/dd/yyyy"
					   />
				   </div>
				<Input
					label="6. PAN"
					name="panNumber"
					value={form.panNumber}
					onChange={handleChange}
					//placeholder="10-CHARACTER PAN NUMBER"
					maxLength={10}
				/>
				<Input
					label="7. Aadhar Number"
					name="aadharNumber"
					value={form.aadharNumber}
					onChange={handleChange}
					//placeholder="12-digit Aadhar number"
					maxLength={12}
				/>
				<Input
					label="Date of Birth in Words"
					name="dobInWords"
					value={form.dobInWords}
					onChange={handleChange}
					//placeholder="Enter DOB in words"
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

export default PersonalInformation;
