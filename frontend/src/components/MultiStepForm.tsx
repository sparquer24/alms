import React, { useState } from "react";

const MultiStepForm: React.FC = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState<any>({});

    const handleNextStep = () => setCurrentStep(currentStep + 1);
    const handlePreviousStep = () => setCurrentStep(currentStep - 1);

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <Step1 formData={formData} setFormData={setFormData} />;
            case 2:
                return <Step2 formData={formData} setFormData={setFormData} />;
            case 3:
                return <Step3 formData={formData} setFormData={setFormData} />;
            case 4:
                return <Step4 formData={formData} setFormData={setFormData} />;
            default:
                return <Step1 formData={formData} setFormData={setFormData} />;
        }
    };

    return (
        <div
                className="min-h-screen bg-cover bg-center flex flex-col overflow-hidden bg-black bg-opacity-10"
                style={{
                    backgroundImage: `url('src/assets/backgroundIMGALMS.jpeg')`,
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: 'cover',
                }}
            >
            <div className="w-full max-w-4xl mx-auto mt-8 p-6 border bg-white border-gray-200 rounded-lg">
                <div className="mt-4 flex space-x-4 mb-6 ">
                    <button
                        onClick={() => setCurrentStep(1)}
                        className={`py-2 px-4 rounded-lg ${currentStep === 1 ? "bg-blue-500 text-white" : "hover:bg-gray-200"
                            }`}
                    >
                        Applicant Identity
                    </button>
                    <button
                        onClick={() => setCurrentStep(2)}
                        className={`py-2 px-4 rounded-lg ${currentStep === 2 ? "bg-blue-500 text-white" : "hover:bg-gray-200"
                            }`}
                    >
                        Address Information
                    </button>
                    <button
                        onClick={() => setCurrentStep(3)}
                        className={`py-2 px-4 rounded-lg ${currentStep === 3 ? "bg-blue-500 text-white" : "hover:bg-gray-200"
                            }`}
                    >
                        File Upload
                    </button>
                </div>

                {renderStep()}

                <div className="flex justify-between mt-6">
                    {currentStep > 1 && (
                        <button
                            onClick={handlePreviousStep}
                            className="bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300"
                        >
                            Previous
                        </button>
                    )}
                    {currentStep < 4 && (
                        <button
                            onClick={handleNextStep}
                            className="bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
                        >
                            Next
                        </button>
                    )}
                </div>

                <footer className="text-center text-xs text-gray-500 mt-4">
                    All fields are mandatory unless specified otherwise.
                </footer>
            </div>
        </div>
    );
};


const Step1: React.FC<{ formData: any; setFormData: any }> = ({
    formData,
    setFormData,
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="grid grid-cols-2 gap-4 ">
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Name</label>
                <input
                    type="text"
                    name="name"
                    value={formData.name || ""}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg py-2 px-3 w-full focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Parent/Spouse Name</label>
                <input
                    type="text"
                    name="parentSpouseName"
                    value={formData.parentSpouseName || ""}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg py-2 px-3 w-full focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Sex</label>
                <div className="space-x-4">
                    <label>
                        <input
                            type="radio"
                            name="sex"
                            value="Male"
                            checked={formData.sex === "Male"}
                            onChange={handleChange}
                        />
                        Male
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="sex"
                            value="Female"
                            checked={formData.sex === "Female"}
                            onChange={handleChange}
                        />
                        Female
                    </label>
                    <label>
                        <input
                            type="radio"
                            name="sex"
                            value="Other"
                            checked={formData.sex === "Other"}
                            onChange={handleChange}
                        />
                        Other
                    </label>
                </div>
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">PAN Card Number</label>
                <input
                    type="text"
                    name="panNumber"
                    value={formData.panNumber || ""}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg py-2 px-3 w-full focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Aadhaar Number</label>
                <input
                    type="text"
                    name="aadhaarNumber"
                    value={formData.aadhaarNumber || ""}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg py-2 px-3 w-full focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                    type="date"
                    name="dob"
                    value={formData.dob || ""}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg py-2 px-3 w-full focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Phone Numbers</label>
                <input
                    type="text"
                    name="officePhone"
                    value={formData.officePhone || ""}
                    onChange={handleChange}
                    placeholder="Office"
                    className="border border-gray-300 rounded-lg py-2 px-3 w-full focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="text"
                    name="residencePhone"
                    value={formData.residencePhone || ""}
                    onChange={handleChange}
                    placeholder="Residence"
                    className="border border-gray-300 rounded-lg py-2 px-3 w-full focus:ring-2 focus:ring-blue-500"
                />
                <input
                    type="text"
                    name="mobilePhone"
                    value={formData.mobilePhone || ""}
                    onChange={handleChange}
                    placeholder="Mobile"
                    className="border border-gray-300 rounded-lg py-2 px-3 w-full focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <p className="text-xs text-gray-500 mt-2">Must be 21 years old on the date of application</p>
        </div>
    );
};

const Step4: React.FC<{ formData: any; setFormData: any }> = ({
    formData,
    setFormData,
}) => {
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files).map((file) => file.name);
            setFormData({ ...formData, uploadedFiles: fileArray });
        }
    };

    return (
        <div>
            <div
                className="border-dashed border-2 border-gray-400 rounded-lg h-40 flex justify-center items-center text-sm text-gray-600"
            >
                <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                    Drag and drop or click to upload PDF files
                </label>
            </div>

            <div className="mt-4">
                {formData.uploadedFiles && formData.uploadedFiles.length > 0 ? (
                    <div>
                        {formData.uploadedFiles.map((fileName: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-md mb-2">
                                <span className="text-sm">{fileName}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500">No files uploaded yet.</p>
                )}
            </div>
        </div>
    );
};

const Step2: React.FC<{ formData: any; setFormData: any }> = ({
    formData,
    setFormData,
}) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Address Line 1</label>
                <input
                    type="text"
                    name="addressLine1"
                    value={formData.addressLine1 || ""}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg py-2 px-3 w-full focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Address Line 2</label>
                <input
                    type="text"
                    name="addressLine2"
                    value={formData.addressLine2 || ""}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg py-2 px-3 w-full focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">City</label>
                <input
                    type="text"
                    name="city"
                    value={formData.city || ""}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg py-2 px-3 w-full focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">State</label>
                <input
                    type="text"
                    name="state"
                    value={formData.state || ""}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg py-2 px-3 w-full focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Postal Code</label>
                <input
                    type="text"
                    name="postalCode"
                    value={formData.postalCode || ""}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg py-2 px-3 w-full focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="flex flex-col">
                <label className="text-sm font-medium text-gray-700">Country</label>
                <input
                    type="text"
                    name="country"
                    value={formData.country || ""}
                    onChange={handleChange}
                    className="border border-gray-300 rounded-lg py-2 px-3 w-full focus:ring-2 focus:ring-blue-500"
                />
            </div>
        </div>
    );
};

const Step3: React.FC<{ formData: any; setFormData: any }> = ({
    formData,
    setFormData,
}) => {
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (files) {
            const fileArray = Array.from(files).map((file) => file.name);
            setFormData({ ...formData, uploadedFiles: fileArray });
        }
    };

    return (
        <div>
            <div
                className="border-dashed border-2 border-gray-400 rounded-lg h-40 flex justify-center items-center text-sm text-gray-600"
            >
                <input
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                    Drag and drop or click to upload PDF files
                </label>
            </div>

            <div className="mt-4">
                {formData.uploadedFiles && formData.uploadedFiles.length > 0 ? (
                    <div>
                        {formData.uploadedFiles.map((fileName: string, index: number) => (
                            <div key={index} className="flex items-center space-x-2 bg-gray-100 px-4 py-2 rounded-md mb-2">
                                <span className="text-sm">{fileName}</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-gray-500">No files uploaded yet.</p>
                )}
            </div>
        </div>
    );
};

export default MultiStepForm;
