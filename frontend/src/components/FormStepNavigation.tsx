import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MultiStepForm from "./MultiStepForm";

interface NavigationMultiStepFormProps { }

const NavigationMultiStepForm: React.FC<NavigationMultiStepFormProps> = () => {
    const navigate = useNavigate();

    const steps = [
        "ApplicantIdentity",
        "AddressInformation",
        "OccupationBusiness",
        "CriminalHistory",
        "LicenseHistory",
        "LicenseDetails",
        "SpecialConsiderationClaims",
        "WildLifePermit",
    ];

    const [currentStep, setCurrentStep] = useState<string>(steps[0]);

    useEffect(() => {
        // Update the URL when the current step changes
        navigate(`?action=${currentStep}`, { replace: true });
    }, [currentStep, navigate]);

    const handleStepChange = (step: string) => {
        setCurrentStep(step);
    };

    const handleNextStep = () => {
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex < steps.length - 1) {
            setCurrentStep(steps[currentIndex + 1]);
        }
    };

    const handlePreviousStep = () => {
        const currentIndex = steps.indexOf(currentStep);
        if (currentIndex > 0) {
            setCurrentStep(steps[currentIndex - 1]);
        }
    };

    const renderStepContent = (step: string): React.ReactNode => {
        const stepContentMap: { [key: string]: string } = {
            ApplicantIdentity: "Applicant Identity Step Content",
            AddressInformation: "Address Information Step Content",
            OccupationBusiness: "Occupation & Business Step Content",
            CriminalHistory: "Criminal History Step Content",
            LicenseHistory: "License History Step Content",
            LicenseDetails: "License Details Step Content",
            SpecialConsiderationClaims: "Special Consideration & Claims Step Content",
            WildLifePermit: "Wild Life Permit Step Content",
        };
        return <div>{stepContentMap[step]}</div>;
    };

    const renderNavButton = (step: string) => (
        <button
            key={step}
            onClick={() => handleStepChange(step)}
            className={`py-2 px-4 whitespace-nowrap rounded-lg ${currentStep === step ? "bg-blue-500 text-white" : "hover:bg-blue-600"}`}
            aria-current={currentStep === step ? "step" : undefined}
        >
            {step.replace(/([A-Z])/g, " $1").trim()} {/* Add spaces for camelCase */}
        </button>
    );

    return (
    <div className="w-full max-w-8xl mx-auto p-6 border border-gray-200 rounded-lg">
            <div className="mt-3 w-full text-center justify-between">{renderStepContent(currentStep)}</div>
            <div className="mt-1 overflow-x-auto bg-blue-700 text-white">
                <div className="flex space-x-4 mb-6 p-2">
                    {steps.map(renderNavButton)}
                </div>
            </div>

            <MultiStepForm/>

            <div className="flex justify-between mt-6">
                <button
                    onClick={handlePreviousStep}
                    disabled={steps.indexOf(currentStep) === 0}
                    className="py-2 px-4 bg-gray-500 text-white rounded-lg disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    onClick={handleNextStep}
                    disabled={steps.indexOf(currentStep) === steps.length - 1}
                    className="py-2 px-4 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                >
                    Next
                </button>
            </div>
        </div>
    );
};

export default NavigationMultiStepForm;
