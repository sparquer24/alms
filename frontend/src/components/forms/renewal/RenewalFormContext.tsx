"use client";
import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

export interface RenewalFormData {
  personalInformation: Record<string, any>;
  addressDetails: Record<string, any>;
  occupationBusiness: Record<string, any>;
  criminalHistory: Record<string, any>;
  licenseDetails: Record<string, any>;
  licenseHistory: Record<string, any>;
  biometricInformation: Record<string, any>;
  documentsUpload: Record<string, any>;
  declaration: Record<string, any>;
}

export interface RenewalState {
  currentStep: number;
  formData: RenewalFormData;
  applicantId: string | null;
  almsLicenseId: string | null;
  isLoading: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  submitSuccess: string | null;
}

const defaultFormData: RenewalFormData = {
  personalInformation: {},
  addressDetails: {},
  occupationBusiness: {},
  criminalHistory: {},
  licenseDetails: {},
  licenseHistory: {},
  biometricInformation: {},
  documentsUpload: {},
  declaration: {},
};

const initialState: RenewalState = {
  currentStep: 0,
  formData: defaultFormData,
  applicantId: null,
  almsLicenseId: null,
  isLoading: false,
  isSubmitting: false,
  submitError: null,
  submitSuccess: null,
};

interface RenewalFormContextType {
  state: RenewalState;
  setCurrentStep: (step: number) => void;
  updateFormData: (section: keyof RenewalFormData, data: Record<string, any>) => void;
  setApplicantId: (id: string | null) => void;
  setAlmsLicenseId: (id: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  setIsSubmitting: (submitting: boolean) => void;
  setSubmitError: (error: string | null) => void;
  setSubmitSuccess: (success: string | null) => void;
  getFormData: (section: keyof RenewalFormData) => Record<string, any>;
  resetForm: () => void;
  goToNextStep: () => void;
  goToPreviousStep: () => void;
}

const RenewalFormContext = createContext<RenewalFormContextType | undefined>(undefined);

export const useRenewalForm = () => {
  const context = useContext(RenewalFormContext);
  if (!context) {
    throw new Error("useRenewalForm must be used within a RenewalFormProvider");
  }
  return context;
};

export const RenewalFormProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<RenewalState>(initialState);

  const setCurrentStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, currentStep: step }));
  }, []);

  const updateFormData = useCallback((section: keyof RenewalFormData, data: Record<string, any>) => {
    setState(prev => ({
      ...prev,
      formData: {
        ...prev.formData,
        [section]: { ...prev.formData[section], ...data },
      },
    }));
  }, []);

  const setApplicantId = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, applicantId: id }));
  }, []);

  const setAlmsLicenseId = useCallback((id: string | null) => {
    setState(prev => ({ ...prev, almsLicenseId: id }));
  }, []);

  const setIsLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  }, []);

  const setIsSubmitting = useCallback((submitting: boolean) => {
    setState(prev => ({ ...prev, isSubmitting: submitting }));
  }, []);

  const setSubmitError = useCallback((error: string | null) => {
    setState(prev => ({ ...prev, submitError: error }));
  }, []);

  const setSubmitSuccess = useCallback((success: string | null) => {
    setState(prev => ({ ...prev, submitSuccess: success }));
  }, []);

  const getFormData = useCallback((section: keyof RenewalFormData) => {
    return state.formData[section] || {};
  }, [state.formData]);

  const resetForm = useCallback(() => {
    setState(initialState);
  }, []);

  const goToNextStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: prev.currentStep + 1 }));
  }, []);

  const goToPreviousStep = useCallback(() => {
    setState(prev => ({ ...prev, currentStep: Math.max(0, prev.currentStep - 1) }));
  }, []);

  const value: RenewalFormContextType = {
    state,
    setCurrentStep,
    updateFormData,
    setApplicantId,
    setAlmsLicenseId,
    setIsLoading,
    setIsSubmitting,
    setSubmitError,
    setSubmitSuccess,
    getFormData,
    resetForm,
    goToNextStep,
    goToPreviousStep,
  };

  return (
    <RenewalFormContext.Provider value={value}>
      {children}
    </RenewalFormContext.Provider>
  );
};