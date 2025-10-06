"use client";
import React from "react";
import { useFreshApplicationForm } from "./FreshApplicationFormContext";
import FormFooter from "../elements/footer";

const requiredSections = [
  "personalInformation",
  "addressDetails",
  "occupationBusiness",
  "criminalHistory",
  "licenseDetails",
  "licenseHistory",
  "biometricInformation",
  "documentsUpload",
];

const sectionLabels: Record<string, string> = {
  personalInformation: "Personal Information",
  addressDetails: "Address Information",
  occupationBusiness: "Occupation & Business",
  criminalHistory: "Criminal History",
  licenseDetails: "License Details",
  licenseHistory: "License History",
  biometricInformation: "Biometric Information",
  documentsUpload: "Documents Status",
};

function isSectionFilled(section: Record<string, any>) {
  return (
    section &&
    Object.values(section).some(
      (v) => v !== "" && v !== null && v !== undefined
    )
  );
}

function renderSection(
  title: string,
  data: Record<string, any>,
  twoCol = true
) {
  if (!data || Object.keys(data).length === 0) return null;
  return (
    <section className="mb-8 bg-gray-50 rounded-xl p-8 shadow-sm">
      <h3 className="font-semibold text-xl mb-6">{title}</h3>
      <div
        className={`grid ${
          twoCol ? "grid-cols-1 md:grid-cols-2" : ""
        } gap-x-12 gap-y-3`}
      >
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="flex gap-2 mb-1">
            <span className="font-medium text-gray-600">
              {key
                .replace(/([A-Z])/g, " $1")
                .replace(/^./, (str) => str.toUpperCase())}
              :
            </span>
            <span className="text-gray-900">{String(value)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const Preview = () => {
  const { formData } = useFreshApplicationForm();

  // Check for missing sections
  const missingSections = requiredSections.filter(
    (section) => !isSectionFilled(formData[section as keyof typeof formData])
  );

  if (missingSections.length > 0) {
    return (
      <div className="max-w-3xl mx-auto p-8 bg-white rounded-xl shadow text-center mt-32">
        <h2 className="text-2xl font-bold mb-4">Application Preview</h2>
        <p className="mb-4 text-red-600 font-semibold">
          Please complete all sections of the form before previewing your
          application.
        </p>
        <ul className="mb-4 text-gray-700">
          {missingSections.map((section) => (
            <li key={section}>- {sectionLabels[section]}</li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="fixed top-24 left-0 right-0 bottom-24 z-30 flex justify-center items-start overflow-hidden">
      <div className="max-w-6xl w-full h-full bg-white rounded-xl shadow p-10 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
        <h2 className="text-2xl font-bold mb-2">Application Preview</h2>
        <p className="mb-8 text-gray-600">
          Please review all your information before submitting the application.
        </p>
        {renderSection(
          sectionLabels.personalInformation,
          formData.personalInformation
        )}
        {renderSection(sectionLabels.addressDetails, formData.addressDetails)}
        {renderSection(
          sectionLabels.occupationBusiness,
          formData.occupationBusiness
        )}
        {renderSection(sectionLabels.criminalHistory, formData.criminalHistory, false)}
        {renderSection(sectionLabels.licenseDetails, formData.licenseDetails)}
        {renderSection(sectionLabels.licenseHistory, formData.licenseHistory, false)}
        {renderSection(
          sectionLabels.biometricInformation,
          formData.biometricInformation
        )}
        {renderSection(sectionLabels.documentsUpload, formData.documentsUpload, false)}
      </div>
      <FormFooter/>
    </div>
  );
};

export default Preview;
