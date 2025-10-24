"use client";
import React, { useState } from 'react';
import { Checkbox } from '../elements/Checkbox';
import { Frown } from 'lucide-react';
import FormFooter from '../elements/footer';
import { useSearchParams, useRouter } from 'next/navigation';
import { patchData } from '../../../api/axiosConfig';
import { FORM_ROUTES } from '../../../config/formRoutes';
import SuccessModal from '../../modals/SuccessModal';

const initialState = {
	declareTrue: false,
	declareFalseInfo: false,
	declareTerms: false,
};

const Declaration = () => {
	const router = useRouter();
	const [form, setForm] = useState(initialState);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const searchParams = useSearchParams();
	const applicantId = searchParams?.get('applicantId') || searchParams?.get('id');

	// Debug logging
	console.log('🔍 Declaration component loaded');
	console.log('📋 Form state:', form);
	console.log('🆔 Applicant ID:', applicantId);
	console.log('📍 Search params:', searchParams?.toString());

	const handleCheck = (name: string, checked: boolean) => {
		setForm((prev) => ({ ...prev, [name]: checked }));
		// Clear error when user interacts
		if (error) setError(null);
	};

	const validateForm = (): boolean => {
		// All checkboxes must be checked to proceed
		if (!form.declareTrue || !form.declareFalseInfo || !form.declareTerms) {
			setError('Please accept all declarations to proceed with submission.');
			return false;
		}
		return true;
	};

	const handleSubmit = async () => {
		if (!validateForm()) {
			return;
		}

		if (!applicantId) {
			setError('Application ID not found. Please complete previous steps first.');
			return;
		}

		setIsSubmitting(true);
		setError(null);

		try {
			// Prepare PATCH payload with declaration fields
			const payload = {
				isDeclarationAccepted: form.declareTrue,
				isAwareOfLegalConsequences: form.declareFalseInfo,
				isTermsAccepted: form.declareTerms,
			};

			console.log('🔄 Submitting declaration with payload:', payload);

			// Make PATCH request to submit application with isSubmit=true parameter
			const response = await patchData(
				`/application-form?applicationId=${applicantId}&isSubmit=true`,
				payload
			);

			console.log('✅ Declaration submitted successfully:', response);

			// Show success modal instead of alert
			setShowSuccessModal(true);

		} catch (err: any) {
			console.error('❌ Error submitting declaration:', err);
			setError(
				err?.message ||
				err?.response?.data?.error ||
				'Failed to submit application. Please try again.'
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handlePrevious = () => {
		// Navigate to Preview step
		if (applicantId) {
			console.log('🔙 Navigating back to Preview with ID:', applicantId);
			router.push(`${FORM_ROUTES.PREVIEW}?id=${applicantId}`);
		} else {
			console.log('🔙 No applicant ID, using browser back');
			router.back();
		}
	};

	const handleCloseSuccessModal = () => {
		setShowSuccessModal(false);
	};

	const handleNavigateHome = () => {
		setShowSuccessModal(false);
		router.push('/inbox?type=freshform'); // Navigate to dashboard or home page
	};

	return (
		<div className="p-4 bg-white">
			{/* <div className=""> */}
				<div className="max-w-6xl mx-auto">
					<div className="text-center mb-6">
						<h2 className="text-3xl font-bold mb-2 text-gray-800">Declaration & Submit</h2>
						<div className="w-24 h-1 bg-blue-600 mx-auto rounded-full mb-4"></div>
					</div>
					<form onSubmit={(e) => e.preventDefault()} className="">
						{/* Display Application ID if available */}
						{applicantId && (
							<div className="mb-6 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded text-lg font-semibold max-w-md mx-auto text-center">
								Application ID: <span className="font-bold">{applicantId}</span>
							</div>
						)}

						{error && (
							<div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md max-w-lg mx-auto">
								<div className="flex items-start">
									<Frown className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
									<p className="text-sm text-red-800">{error}</p>
								</div>
							</div>
						)}

						<div className="mb-8 max-w-2xl mx-auto">
							<div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
								<div className="text-lg font-medium text-gray-900 mb-4 text-center">Please check all boxes to proceed:</div>
								<div className="flex flex-col gap-4">
									<Checkbox
										label="I hereby declare that the information provided above is true and correct to the best of my knowledge and belief."
										name="declareTrue"
										checked={form.declareTrue}
										onChange={(checked) => handleCheck('declareTrue', checked)}
									/>
									<Checkbox
										label="I understand that providing false information may result in legal consequences and rejection of my application."
										name="declareFalseInfo"
										checked={form.declareFalseInfo}
										onChange={(checked) => handleCheck('declareFalseInfo', checked)}
									/>
									<Checkbox
										label="I agree to abide by all terms and conditions related to the arms license and will use the weapon responsibly."
										name="declareTerms"
										checked={form.declareTerms}
										onChange={(checked) => handleCheck('declareTerms', checked)}
									/>
								</div>
							</div>
						</div>

						<FormFooter
							isDeclarationStep
							onSubmit={handleSubmit}
							onPrevious={handlePrevious}
							isLoading={isSubmitting}
						/>
					</form>
				</div>
			{/* </div> */}
			{/* Success Modal */}
			<SuccessModal
				isOpen={showSuccessModal}
				onClose={handleCloseSuccessModal}
				title="Application Submitted Successfully!"
				onNavigateHome={handleNavigateHome}
			/>
		</div>
	);
};

export default Declaration;
