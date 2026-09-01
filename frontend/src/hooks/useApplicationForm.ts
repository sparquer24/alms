import { useState, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ApplicationService, ApplicationFormData } from '../api/applicationService';
import { useAuth } from '@/hooks/useAuth';

interface UseApplicationFormProps {
  initialState: any;
  formSection: 'personal' | 'address' | 'occupation' | 'criminal' | 'license-history' | 'license-details';
  validationRules?: (formData: any) => Record<string, string> | string[];
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
  const [almsLicenseId, setAlmsLicenseId] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

  // Load existing application data — single GET request (no separate existence check)
  const checkAndLoadExistingData = useCallback(async (appId: string) => {
    try {
      setIsLoading(true);
      setSubmitError(null);

      const response = await ApplicationService.getApplication(appId);

      if (response.success && response.data) {
        await handleLoadedData(appId, response.data);
      } else {
        setIsLoading(false);
      }
    } catch (error: any) {
      setIsLoading(false);

      if (error.message.includes('404') || error.message.includes('Not Found')) {
        // Expected for new applications - continue with empty form
      } else if (error.message.includes('Authentication') || error.message.includes('401')) {
        setSubmitError('Session expired. Please log in again.');
      }
    }
  }, [formSection]);

  // Handle loaded data from a single GET response
  const handleLoadedData = useCallback(async (appId: string, data: any) => {
    const licenseId = data.almsLicenseId ?? data.alms_license_id ?? data.licenseId ?? null;
    if (licenseId) {
      setAlmsLicenseId(licenseId);
    }

    const sectionData = ApplicationService.extractSectionData(data, formSection);
    if (sectionData && Object.keys(sectionData).length > 0) {
      setForm((prev: any) => ({ ...prev, ...sectionData }));
      // setSubmitSuccess('Existing data loaded successfully');
      // setTimeout(() => setSubmitSuccess(null), 3000);
    }
    
    setIsLoading(false);
  }, [formSection]);

  // Load existing application data — this is now a re-export for components that need it
  const loadExistingData = useCallback(async (appId: string) => {
    try {
      setIsLoading(true);
      setSubmitError(null);

      const response = await ApplicationService.getApplication(appId);
      if (response.success && response.data) {
        await handleLoadedData(appId, response.data);
      }
    } catch (error: any) {
      if (error.message.includes('404') || error.message.includes('Not Found')) {
        // Expected for new applications
      } else if (error.message.includes('Authentication') || error.message.includes('401')) {
        setSubmitError('Session expired. Please log in again.');
      } else {
        setSubmitError('Could not load existing data. You can continue with a fresh form.');
        setTimeout(() => setSubmitError(null), 5000);
      }
    } finally {
      setIsLoading(false);
    }
  }, [formSection, handleLoadedData]);

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
  const saveFormData = useCallback(async (customValidation?: () => string[], overrideFormData?: any, background: boolean = false) => {
    if (!background) setIsSubmitting(true);
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
        const validationResult = validation(dataToSave);
        if (Array.isArray(validationResult)) {
          if (validationResult.length > 0) {
            throw new Error(validationResult.join(', '));
          }
        } else if (Object.keys(validationResult).length > 0) {
          setFieldErrors(validationResult);
          throw new Error('Please fix the errors in the form before proceeding.');
        } else {
          setFieldErrors({});
        }
      }

      const performSave = async () => {
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
            // Attempt to read returned application id and alms license id from response
            newApplicantId = response.applicationId ?? response.data?.applicationId ?? response.data?.id ?? null;
            if (newApplicantId) setApplicantId(newApplicantId);

            const createdLicenseId = response.almsLicenseId ?? response.data?.almsLicenseId ?? response.data?.alms_license_id ?? null;
            if (createdLicenseId) setAlmsLicenseId(createdLicenseId);
          }
        } else {
          throw new Error('Application ID is required for this form section');
        }

        if (response.success) {
          if (!background) setSubmitSuccess('Data saved successfully!');
          return newApplicantId;
        } else {
          throw new Error('Failed to save data. Please try again.');
        }
      };

      if (background && applicantId && formSection !== 'personal') {
        // Fire and forget, don't await
        performSave().catch(error => {
          console.error('Background save error:', error);
        });
        return applicantId;
      } else {
        // For personal section or non-background saves, we must wait
        if (background) setIsSubmitting(true); // if it was personal, we didn't set it to true initially
        const result = await performSave();
        return result;
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
    setApplicantId,
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
    almsLicenseId,
    setAlmsLicenseId,
    fieldErrors,
    setFieldErrors,
  };
};