import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApplicationService, ApplicationFormData } from '../api/applicationService';
import { useAuth } from '../config/auth';

interface UseApplicationFormProps {
  initialState: any;
  formSection: 'personal' | 'address' | 'occupation' | 'criminal' | 'license-history' | 'license-details';
  validationRules?: (formData: any) => string[];
}

export const useApplicationForm = ({
  initialState,
  formSection,
  validationRules
}: UseApplicationFormProps) => {
  const [form, setForm] = useState(initialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [applicantId, setApplicantId] = useState<string | null>(null);
  const [applicantIdKey, setApplicantIdKey] = useState<'applicantId' | 'id' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, token } = useAuth();

  // Initialize applicant ID from URL and check if application exists before loading data
  useEffect(() => {
    const applicantIdFromApplicantKey = searchParams?.get('applicantId');
    const applicantIdFromIdKey = searchParams?.get('id');
    const urlApplicantId = applicantIdFromApplicantKey || applicantIdFromIdKey;
    if (urlApplicantId) {
      setApplicantId(urlApplicantId);
      // remember which key was used so we preserve it when navigating
      setApplicantIdKey(applicantIdFromApplicantKey ? 'applicantId' : 'id');

      // First check if application exists before attempting to load data
      checkAndLoadExistingData(urlApplicantId);
    }
  }, [searchParams, formSection]);

  // Check if application exists before loading data
  const checkAndLoadExistingData = useCallback(async (appId: string) => {
    try {
      setIsLoading(true);
      setSubmitError(null);

      // First, check if the application exists
      const response = await ApplicationService.getApplication(appId);

      if (response.success && response.data) {
        // Application exists, now load the data
        await loadExistingData(appId);
      } else {
        // Application doesn't exist, this is a new application
        setIsLoading(false);
      }
    } catch (error: any) {
      setIsLoading(false);

      // Handle different scenarios
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        // This is expected for new applications - don't show error
      } else if (error.message.includes('Authentication') || error.message.includes('401')) {
        setSubmitError('Session expired. Please log in again.');
      } else {
        // Don't show error to user for application existence check
      }
    }
  }, [formSection]);

  // Load existing application data for all sections
  const loadExistingData = useCallback(async (appId: string) => {
    try {
      setIsLoading(true);
      setSubmitError(null); // Clear any previous errors

      const response = await ApplicationService.getApplication(appId);
      if (response.success && response.data) {
        // Extract section-specific data using the service method
        const sectionData = ApplicationService.extractSectionData(response.data, formSection);
        if (sectionData && Object.keys(sectionData).length > 0) {
          // Merge section data with initial state, prioritizing loaded data
          setForm((prev: any) => {
            const mergedData = { ...prev, ...sectionData };
            return mergedData;
          });

          // Show success message for better UX
          setSubmitSuccess('Existing data loaded successfully');
          setTimeout(() => setSubmitSuccess(null), 3000); // Clear after 3 seconds
        } else {
          // This is normal for new applications or sections not yet filled
        }
      } else {
        // Don't show error - let user continue with empty form
      }
    } catch (error: any) {
      // Handle different types of errors gracefully
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        // Don't show error to user - just continue with empty form
      } else if (error.message.includes('Authentication') || error.message.includes('401')) {
        setSubmitError('Session expired. Please log in again.');
      } else {
        // Show a gentle message to user but don't block form usage
        setSubmitError('Could not load existing data. You can continue with a fresh form.');
        setTimeout(() => setSubmitError(null), 5000); // Clear after 5 seconds
      }
    } finally {
      setIsLoading(false);
    }
  }, [formSection]);

  // Handle form field changes
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: value }));
  }, []);

  // Handle nested object changes (for address, etc.)
  const handleNestedChange = useCallback((parentKey: string, childKey: string, value: string) => {
    setForm((prev: any) => ({
      ...prev,
      [parentKey]: {
        ...prev[parentKey],
        [childKey]: value
      }
    }));
  }, []);

  // Save form data
  const saveFormData = useCallback(async (customValidation?: () => string[], overrideFormData?: any) => {
    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      // Use override data if provided, otherwise use form state
      const dataToSave = overrideFormData || form;
      if (!isAuthenticated || !token) {
        throw new Error('Please log in to continue');
      }

      // Run validation
      const validation = customValidation || validationRules;
      if (validation) {
        const validationErrors = validation(dataToSave);
        if (validationErrors.length > 0) {
          throw new Error(validationErrors.join(', '));
        }
      }

      let response;
      let newApplicantId;

      if (applicantId && formSection !== 'personal') {
        // Update existing application (PATCH) for non-personal forms
        response = await ApplicationService.updateApplication(applicantId, dataToSave, formSection);
        newApplicantId = applicantId;
      } else if (formSection === 'personal') {
        if (applicantId) {
          // Update personal information (PATCH)
          response = await ApplicationService.updateApplication(applicantId, dataToSave, formSection);
          newApplicantId = applicantId;
        } else {
          // Create new application (POST)
          response = await ApplicationService.createApplication(dataToSave);
          newApplicantId = response.applicationId;
          setApplicantId(newApplicantId);
        }
      } else {
        throw new Error('Application ID is required for this form section');
      }
      if (response.success) {
        setSubmitSuccess('Data saved successfully!');
        return newApplicantId;
      } else {
        throw new Error('Failed to save data. Please try again.');
      }
    } catch (error: any) {
      if (error.message === 'Authentication required' || error.message.includes('log in')) {
        setSubmitError('Authentication expired. Please log in again.');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return null;
      }

      setSubmitError(error.message || 'An error occurred while saving data.');
      return null;
    } finally {
      setIsSubmitting(false);
    }
  }, [applicantId, isAuthenticated, token, router, form, formSection, validationRules]);

  // Navigate to next form section
  const navigateToNext = useCallback((nextRoute: string, currentApplicantId?: string) => {
    const idToUse = currentApplicantId || applicantId;
    if (idToUse) {
      const key = applicantIdKey || 'id';
      router.push(`${nextRoute}?${key}=${encodeURIComponent(idToUse)}`);
    } else {
      // If no applicant ID, just navigate without query param
      router.push(nextRoute);
    }
  }, [applicantId, router]);

  // Utility function to load existing data for all sections at once
  const loadCompleteApplicationData = useCallback(async (appId: string) => {
    try {
      setIsLoading(true);

      const response = await ApplicationService.getApplication(appId);

      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error('Failed to load application data');
      }
    } catch (error: any) {
      setSubmitError('Could not load application data');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    form,
    setForm,
    applicantId,
    isSubmitting,
    submitError,
    submitSuccess,
    isLoading,
    handleChange,
    handleNestedChange,
    saveFormData,
    navigateToNext,
    loadExistingData,
    loadCompleteApplicationData,
    setSubmitError,
    setSubmitSuccess,
  };
};