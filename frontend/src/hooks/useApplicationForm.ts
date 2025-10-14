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
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, token } = useAuth();

  // Initialize applicant ID from URL
  useEffect(() => {
    const urlApplicantId = searchParams?.get('applicantId') || searchParams?.get('id');
    if (urlApplicantId) {
      console.log('🔍 Found applicantId in URL:', urlApplicantId);
      setApplicantId(urlApplicantId);

      // Only try to load existing data for non-personal forms OR existing personal forms
      // Skip loading for fresh personal information forms
      if (formSection !== 'personal') {
        loadExistingData(urlApplicantId);
      } else {
        // For personal forms, only load if we're sure it's an existing application
        console.log('🔵 Personal form detected, skipping auto-load of existing data');
      }
    }
  }, [searchParams, formSection]);

  // Load existing application data
  const loadExistingData = useCallback(async (appId: string) => {
    try {
      console.log('🟢 Loading existing data (GET) for applicantId:', appId, 'section:', formSection);
      setIsLoading(true);
      const response = await ApplicationService.getApplication(appId);
      console.log('📄 Full application response:', response);

      if (response.success && response.data) {
        // Extract section-specific data using the new method
        const sectionData = ApplicationService.extractSectionData(response.data, formSection);
        console.log('📋 Extracted section data for', formSection, ':', sectionData);

        if (sectionData) {
          // Merge section data with initial state, prioritizing section data
          setForm((prev: any) => ({ ...prev, ...sectionData }));
          console.log('✅ Section data loaded and merged');
        } else {
          console.log('⚠️ No data found for section:', formSection);
        }
      } else {
        console.log('⚠️ No existing data found or response unsuccessful');
      }
    } catch (error: any) {
      console.log('⚠️ Could not load existing data (this might be OK for new applications):', error.message);

      // If it's a 404 error, that's expected for new applications
      if (error.message.includes('404') || error.message.includes('Cannot GET')) {
        console.log('💡 Application not found - this is normal for new applications');
      } else {
        console.error('❌ Unexpected error loading existing data:', error);
      }

      // Don't show error to user - continue with initial state
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
      
      console.log('🔍 SaveFormData called with:', {
        applicantId,
        formSection,
        hasForm: !!form,
        formData: dataToSave,
        isUsingOverride: !!overrideFormData
      });

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
        console.log('🟡 Calling updateApplication (PATCH) for non-personal section:', formSection);
        response = await ApplicationService.updateApplication(applicantId, dataToSave, formSection);
        newApplicantId = applicantId;
      } else if (formSection === 'personal') {
        if (applicantId) {
          // Update personal information (PATCH)
          console.log('🟡 Calling updateApplication (PATCH) for existing personal info');
          response = await ApplicationService.updateApplication(applicantId, dataToSave, formSection);
          newApplicantId = applicantId;
        } else {
          // Create new application (POST)
          console.log('🔵 Calling createApplication (POST) for new personal info');
          response = await ApplicationService.createApplication(dataToSave);
          newApplicantId = response.applicationId;
          setApplicantId(newApplicantId);
        }
      } else {
        throw new Error('Application ID is required for this form section');
      }

      console.log('✅ API Response:', response);

      if (response.success) {
        setSubmitSuccess('Data saved successfully!');
        return newApplicantId;
      } else {
        throw new Error('Failed to save data. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Error saving form data:', error);

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
      router.push(`${nextRoute}?id=${idToUse}`);
    } else {
      // If no applicant ID, just navigate without query param
      router.push(nextRoute);
    }
  }, [applicantId, router]);

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
    setSubmitError,
    setSubmitSuccess,
  };
};