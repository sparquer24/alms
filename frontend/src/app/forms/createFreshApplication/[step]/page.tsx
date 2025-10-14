"use client";
import React from 'react';
import { IoMdHome } from 'react-icons/io';
// freshApplication step components
import PersonalInformation from '../../../../components/forms/freshApplication/PersonalInformation'; // step1
import AddressDetails from '../../../../components/forms/freshApplication/AddressDetails'; // step2
import OccupationBussiness from '../../../../components/forms/freshApplication/OccupationBussiness'; // step3
import LicenseDetails from '../../../../components/forms/freshApplication/LicenseDetails'; // step5
import CriminalHistory from '../../../../components/forms/freshApplication/CriminalHistory'; // step6
import LicenseHistory from '../../../../components/forms/freshApplication/LicenseHistory'; // step7
import BiometricInformation from '../../../../components/forms/freshApplication/BiometricInformation'; // step8
import DocumentsUpload from '../../../../components/forms/freshApplication/DocumentsUpload'; // step9
import Preview from '../../../../components/forms/freshApplication/Preview'; // preview
import Declaration from '../../../../components/forms/freshApplication/Declaration'; // declaration
import { StepHeader } from '../../../../components/forms/elements/StepHeader';

interface StepPageProps {
	params: { step: string };
}



const steps = [
	'Personal Information',
	'Address Details',
	'Occupation/Business',
	'Criminal History',
	'License History',
	'License Details',
	'Biometric Information',
	'Documents Upload',
	'Preview',
	'Declaration & Submit',
];

// Helper to slugify step names for URLs and comparison
const stepToSlug = (name: string) =>
	name
	  .toLowerCase()
	  .replace(/&/g, 'and')
	  .replace(/[^a-z0-9]+/g, '-')
	  .replace(/(^-|-$)/g, '');


import { useRouter } from 'next/navigation';
import { use } from 'react';

const StepPage: React.FC<StepPageProps> = ({ params }) => {
	const router = useRouter();
	// Unwrap params with React.use() for Next.js app router compliance
	const { step } = params;
	let StepComponent;
	let currentStep = 0;

	   // Find the index of the current step by slug
	   // Special handling for preview and declaration which use different slug patterns
	   let stepIndex;
	   if (step === 'preview') {
		   stepIndex = 8; // Preview is at index 8
	   } else if (step === 'declaration') {
		   stepIndex = 9; // Declaration & Submit is at index 9
	   } else {
		   stepIndex = steps.findIndex(s => stepToSlug(s) === step);
	   }
	   currentStep = stepIndex >= 0 ? stepIndex : 0;
	   
	   switch (step) {
		   case stepToSlug('Personal Information'):
			   StepComponent = <PersonalInformation />;
			   break;
		   case stepToSlug('Address Details'):
			   StepComponent = <AddressDetails />;
			   break;
		   case stepToSlug('Occupation/Business'):
			   StepComponent = <OccupationBussiness />;
			   break;
		   case stepToSlug('Criminal History'):
			   StepComponent = <CriminalHistory />;
			   break;
		   case stepToSlug('License History'):
			   StepComponent = <LicenseHistory />;
			   break;
		   case stepToSlug('License Details'):
			   StepComponent = <LicenseDetails />;
			   break;
		   case stepToSlug('Biometric Information'):
			   StepComponent = <BiometricInformation />;
			   break;
		   case stepToSlug('Documents Upload'):
			   StepComponent = <DocumentsUpload />;
			   break;
		   case 'preview':
			   StepComponent = <Preview />;
			   break;
		   case 'declaration':
			   StepComponent = <Declaration />;
			   break;
		   default:
			   StepComponent = <div>Step not implemented: {step}</div>;
	   }

	// Handler to change step and update the URL
	   const handleStepClick = (idx: number) => {
		   if (idx === 8) {
			   router.push('/forms/createFreshApplication/preview');
		   } else if (idx === 9) {
			   router.push('/forms/createFreshApplication/declaration');
		   } else {
			   router.push(`/forms/createFreshApplication/${stepToSlug(steps[idx])}`);
		   }
	   };

	   // Handler for go home button
	   const handleGoHome = () => {
		   window.location.href = 'http://localhost:5000/inbox?type=forwarded';
	   };

	   // Show home button on all steps
	   const showHomeButton = true;

	   return (
		   <div
			   className="relative min-h-screen"
			   style={{
				   backgroundImage: 'url(/backgroundIMGALMS.jpeg)',
				   backgroundSize: 'cover',
				   backgroundRepeat: 'no-repeat',
				   backgroundPosition: 'center',
			   }}
		   >
			   {showHomeButton && (
				   <div className="fixed top-4 left-6 z-50">
					   <button
						   onClick={handleGoHome}
						   className="flex items-center justify-center w-12 h-12 bg-white hover:bg-gray-50 rounded-full shadow-lg border-2 border-blue-500 transition-all duration-200 hover:scale-105"
						   title="Go to Home"
					   >
						   <IoMdHome className="text-2xl text-[#0d2977]" />
					   </button>
				   </div>
			   )}
			   <StepHeader steps={steps} currentStep={currentStep} onStepClick={handleStepClick}/>
			   <div
				   className=" flex max-w-8xl px-4  justify-center sm:px-8 "
				   style={{
					   paddingTop: 100, // This creates the space between header and form
					   minHeight: '100vh',
				   }}
			   >
				   <div
					   className="rounded-2xl bg-white border border-blue-100 shadow-xl max-w-7xl w-full flex flex-col p-0"
					   style={{
						   maxHeight: 'calc(100vh - 100px )',
						   overflowY: 'auto',
					   }}
				   >
					   {StepComponent}
				   </div>
			   </div>
		   </div>
	   );
	}

	export default StepPage;
