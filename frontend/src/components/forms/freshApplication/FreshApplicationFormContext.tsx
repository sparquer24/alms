"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

// Define the shape of your form data here
export interface FreshApplicationFormData {
  personalInformation: Record<string, any>;
  addressDetails: Record<string, any>;
  occupationBusiness: Record<string, any>;
  criminalHistory: Record<string, any>;
  licenseDetails: Record<string, any>;
  licenseHistory: Record<string, any>;
  documentsUpload: Record<string, any>;
  
}

const defaultFormData: FreshApplicationFormData = {
  personalInformation: {},
  addressDetails: {},
  occupationBusiness: {},
  criminalHistory: {},
  licenseDetails: {},
  licenseHistory: {},
  documentsUpload: {},
};

const FreshApplicationFormContext = createContext<{
  formData: FreshApplicationFormData;
  setFormData: React.Dispatch<React.SetStateAction<FreshApplicationFormData>>;
}>({
  formData: defaultFormData,
  setFormData: () => {},
});

export const useFreshApplicationForm = () => useContext(FreshApplicationFormContext);

export const FreshApplicationFormProvider = ({ children }: { children: ReactNode }) => {
  const [formData, setFormData] = useState<FreshApplicationFormData>(defaultFormData);
  return (
    <FreshApplicationFormContext.Provider value={{ formData, setFormData }}>
      {children}
    </FreshApplicationFormContext.Provider>
  );
};
