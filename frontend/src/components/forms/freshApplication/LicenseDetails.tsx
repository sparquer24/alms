'use client';
import React, { useState, useEffect } from 'react';
import { Input } from '../elements/Input';
import { Checkbox } from '../elements/Checkbox';
import FormFooter from '../elements/footer';
import { WeaponsService, Weapon } from '../../../services/weapons';
import { FileUploadService, FileUploadResponse } from '../../../services/fileUpload';
import { useRouter } from 'next/navigation';
import { useApplicationForm } from '../../../hooks/useApplicationForm';
import { FORM_ROUTES } from '../../../config/formRoutes';

const initialState = {
  licenseDetails: [
    {
      needForLicense: '',
      armsCategory: '',
      requestedWeaponIds: [],
      areaOfValidity: '',
      ammunitionDescription: '', // Added missing field
      specialConsiderationReason: '',
      licencePlaceArea: '',
      wildBeastsSpecification: '',
      specialClaimsEvidence: [], // Local files before upload
      uploadedFiles: [], // API response data for uploaded files
    },
  ],
};

const LicenseDetails = () => {
  const router = useRouter();

  const {
    form,
    setForm,
    applicantId,
    isSubmitting,
    submitError,
    submitSuccess,
    isLoading,
    saveFormData,
    navigateToNext,
    loadExistingData,
  } = useApplicationForm({
    initialState,
    formSection: 'license-details',
  });

  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loadingWeapons, setLoadingWeapons] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  // Helper function to safely get license detail
  const getLicenseDetail = () => {
    return form.licenseDetails?.[0] || {};
  };

  useEffect(() => {
    // Debug: Log initial form state
  }, []);

  // Upload pending files when applicationId becomes available
  useEffect(() => {
    if (applicantId) {
      uploadPendingFiles();
    }
  }, [applicantId]);

  // Fetch weapons on component mount
  useEffect(() => {
    const loadWeapons = async () => {
      try {
        setLoadingWeapons(true);
        const list = await WeaponsService.getAll();
        const items = (list || []).map(w => ({ id: w.id, name: w.name })) as Weapon[];
        setWeapons(items);
      } catch (e) {
        // Fallback weapons if API fails
        setWeapons([
          { id: 1, name: 'Revolver' },
          { id: 2, name: 'Pistol' },
          { id: 3, name: 'Rifle' },
          { id: 4, name: 'Shotgun' },
          { id: 5, name: 'Airgun' },
        ]);
      } finally {
        setLoadingWeapons(false);
      }
    };
    loadWeapons();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox' && 'checked' in e.target) {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev: any) => {
        // Ensure licenseDetails array exists and has at least one element
        const currentLicenseDetails = prev.licenseDetails || [{}];
        const currentDetail = currentLicenseDetails[0] || {};

        const newForm = {
          ...prev,
          licenseDetails: [
            {
              ...currentDetail,
              [name]: checked,
            },
          ],
        };
        return newForm;
      });
    } else {
      setForm((prev: any) => {
        // Ensure licenseDetails array exists and has at least one element
        const currentLicenseDetails = prev.licenseDetails || [{}];
        const currentDetail = currentLicenseDetails[0] || {};

        const newForm = {
          ...prev,
          licenseDetails: [
            {
              ...currentDetail,
              [name]: value,
            },
          ],
        };
        return newForm;
      });
    }
  };

  const handleWeaponChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const weaponId = Number(e.target.value);
    if (weaponId === 0) return; // Skip if no weapon selected

    setForm((prev: any) => {
      // Ensure licenseDetails array exists and has at least one element
      const currentLicenseDetails = prev.licenseDetails || [{}];
      const currentDetail = currentLicenseDetails[0] || {};
      const currentWeapons = currentDetail.requestedWeaponIds || [];

      const updatedWeapons = currentWeapons.includes(weaponId)
        ? currentWeapons.filter((id: number) => id !== weaponId)
        : [...currentWeapons, weaponId];

      const newForm = {
        ...prev,
        licenseDetails: [
          {
            ...currentDetail,
            requestedWeaponIds: updatedWeapons,
          },
        ],
      };
      return newForm;
    });
  };

  const handleAreaChange = (area: string, checked: boolean) => {
    setForm((prev: any) => {
      // Ensure licenseDetails array exists and has at least one element
      const currentLicenseDetails = prev.licenseDetails || [{}];
      const currentDetail = currentLicenseDetails[0] || {};
      const currentAreas = currentDetail.areaOfValidity
        ? currentDetail.areaOfValidity.split(', ').filter(Boolean)
        : [];

      const updatedAreas = checked
        ? [...currentAreas.filter((a: string) => a !== area), area]
        : currentAreas.filter((a: string) => a !== area);

      const newForm = {
        ...prev,
        licenseDetails: [
          {
            ...currentDetail,
            areaOfValidity: updatedAreas.join(', '),
          },
        ],
      };
      return newForm;
    });
  };

  // File upload handler for multiple files with API integration
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }

    // Check current file count limit
    const currentFiles = getLicenseDetail().specialClaimsEvidence || [];
    const uploadedFiles = getLicenseDetail().uploadedFiles || [];
    const totalFiles = currentFiles.length + uploadedFiles.length;

    if (totalFiles >= 5) {
      alert('Maximum 5 files allowed. Please remove a file before uploading more.');
      return;
    }
    // If we have an applicationId, upload immediately
    if (applicantId) {
      try {
        setUploadingFiles(true);
        setUploadProgress(`Uploading ${file.name}...`);

        const uploadResponse = await FileUploadService.uploadFile(
          applicantId,
          file,
          'MEDICAL_REPORT',
          'Evidence document for special consideration claims'
        );

        // Add uploaded file reference to form state
        setForm((prev: any) => {
          const currentLicenseDetails = prev.licenseDetails || [{}];
          const currentDetail = currentLicenseDetails[0] || {};
          const currentUploadedFiles = currentDetail.uploadedFiles || [];

          const newForm = {
            ...prev,
            licenseDetails: [
              {
                ...currentDetail,
                uploadedFiles: [...currentUploadedFiles, uploadResponse.data],
              },
            ],
          };
          return newForm;
        });

        setUploadProgress('');
      } catch (error: any) {
        alert(`File upload failed: ${error.message}`);
        setUploadProgress('');
      } finally {
        setUploadingFiles(false);
      }
    } else {
      // If no applicationId, store locally for later upload
      setForm((prev: any) => {
        const currentLicenseDetails = prev.licenseDetails || [{}];
        const currentDetail = currentLicenseDetails[0] || {};
        const currentFiles = currentDetail.specialClaimsEvidence || [];

        const updatedFiles = [...currentFiles, file];

        const newForm = {
          ...prev,
          licenseDetails: [
            {
              ...currentDetail,
              specialClaimsEvidence: updatedFiles,
            },
          ],
        };
        return newForm;
      });
    }

    // Reset the input to allow selecting the same file again
    e.target.value = '';
  };

  // Remove specific file (local or uploaded)
  const removeFile = (indexToRemove: number, isUploaded: boolean = false) => {
    setForm((prev: any) => {
      const currentLicenseDetails = prev.licenseDetails || [{}];
      const currentDetail = currentLicenseDetails[0] || {};

      if (isUploaded) {
        const currentUploadedFiles = currentDetail.uploadedFiles || [];
        const updatedUploadedFiles = currentUploadedFiles.filter(
          (_: any, index: number) => index !== indexToRemove
        );

        return {
          ...prev,
          licenseDetails: [
            {
              ...currentDetail,
              uploadedFiles: updatedUploadedFiles,
            },
          ],
        };
      } else {
        const currentFiles = currentDetail.specialClaimsEvidence || [];
        const updatedFiles = currentFiles.filter(
          (_: any, index: number) => index !== indexToRemove
        );

        return {
          ...prev,
          licenseDetails: [
            {
              ...currentDetail,
              specialClaimsEvidence: updatedFiles,
            },
          ],
        };
      }
    });
  };

  // Upload pending local files when applicationId becomes available
  const uploadPendingFiles = async () => {
    if (!applicantId) return;

    const pendingFiles = getLicenseDetail().specialClaimsEvidence || [];
    if (pendingFiles.length === 0) return;

    try {
      setUploadingFiles(true);
      setUploadProgress(`Uploading ${pendingFiles.length} files...`);

      const uploadResponses = await FileUploadService.uploadMultipleFiles(
        applicantId,
        pendingFiles,
        'MEDICAL_REPORT',
        'Evidence document for special consideration claims'
      );

      // Move files from pending to uploaded
      setForm((prev: any) => {
        const currentLicenseDetails = prev.licenseDetails || [{}];
        const currentDetail = currentLicenseDetails[0] || {};
        const currentUploadedFiles = currentDetail.uploadedFiles || [];

        return {
          ...prev,
          licenseDetails: [
            {
              ...currentDetail,
              specialClaimsEvidence: [], // Clear pending files
              uploadedFiles: [...currentUploadedFiles, ...uploadResponses.map(r => r.data)],
            },
          ],
        };
      });
    } catch (error: any) {
      alert(`Failed to upload some files: ${error.message}`);
    } finally {
      setUploadingFiles(false);
      setUploadProgress('');
    }
  };

  const handleSaveToDraft = async () => {
    // Debug: Log the current form data before saving
    const detail = getLicenseDetail();
    Object.keys(detail).forEach(key => {});

    // Enhanced debugging for requestedWeaponIds specifically
    // The form data is already in the correct format (licenseDetails array)
    await saveFormData();
  };

  const handleNext = async () => {
    // Debug: Log the current form data before save
    const detail = getLicenseDetail();
    Object.keys(detail).forEach(key => {});

    // Enhanced debugging for requestedWeaponIds specifically
    // The form data is already in the correct format (licenseDetails array)
    const savedApplicantId = await saveFormData();

    if (savedApplicantId) {
      // Navigate to the Biometric Information step first
      navigateToNext(FORM_ROUTES.BIOMETRIC_INFO, savedApplicantId);
    }
  };

  const handlePrevious = async () => {
    if (applicantId) {
      await loadExistingData(applicantId);
      navigateToNext(FORM_ROUTES.LICENSE_HISTORY, applicantId);
    } else {
      router.back();
    }
  };

  // Show loading state if data is being loaded
  if (isLoading) {
    return (
      <div className='p-6'>
        <h2 className='text-xl font-bold mb-4'>License Details</h2>
        <div className='flex justify-center items-center py-8'>
          <div className='text-gray-500'>Loading...</div>
        </div>
      </div>
    );
  }

  // Debug: Log current form state on render
  return (
    <form className='p-6'>
      <h2 className='text-xl font-bold mb-4'>License Details</h2>

      {/* Display Applicant ID if available */}
      {applicantId && (
        <div className='mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded'>
          <strong>Application ID: {applicantId}</strong>
        </div>
      )}

      {/* Display success/error messages */}
      {submitSuccess && (
        <div className='mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded'>
          {submitSuccess}
        </div>
      )}
      {submitError && (
        <div className='mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded'>
          {submitError}
        </div>
      )}
      <div className='grid grid-cols-2 gap-8'>
        {/* Left column: 15 above 16 */}
        <div className='flex flex-col gap-8'>
          {/* 15. Need for license */}
          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              15. Need for license (see note 1 below)
            </label>
            <select
              name='needForLicense'
              value={getLicenseDetail().needForLicense || ''}
              onChange={handleChange}
              className='border-0 border-b-2 border-gray-300 focus:border-blue-500 focus:ring-0 w-full py-2 bg-transparent'
            >
              <option value=''>Select reason</option>
              <option value='SELF_PROTECTION'>Self-Protection</option>
              <option value='SPORTS'>Sports</option>
              <option value='HEIRLOOM_POLICY'>Heirloom Policy</option>
            </select>
          </div>
          {/* 16. Description of arms */}
          <div className='mb-4'>
            <div className='font-medium mb-2'>
              16. Description of arms for which license is being sought
            </div>
            <div className='mb-2'>(a) Select any of the options</div>
            <div className='flex gap-6 mb-2'>
              <label className='flex items-center gap-2'>
                <input
                  type='radio'
                  name='armsCategory'
                  value='RESTRICTED'
                  checked={getLicenseDetail().armsCategory === 'RESTRICTED'}
                  onChange={handleChange}
                />{' '}
                Restricted
              </label>
              <label className='flex items-center gap-2'>
                <input
                  type='radio'
                  name='armsCategory'
                  value='PERMISSIBLE'
                  checked={getLicenseDetail().armsCategory === 'PERMISSIBLE'}
                  onChange={handleChange}
                />{' '}
                Permissible
              </label>
            </div>
            <div className='mb-2'>(b) Select weapon types (multiple allowed)</div>
            <select
              name='weaponSelection'
              value={0}
              onChange={handleWeaponChange}
              className='border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 mb-2'
              disabled={loadingWeapons}
            >
              <option value={0}>
                {loadingWeapons ? 'Loading weapons...' : 'Select weapon type to add'}
              </option>
              {weapons.map(weapon => (
                <option key={weapon.id} value={weapon.id}>
                  {weapon.name}
                </option>
              ))}
            </select>
            {/* Display selected weapons */}
            {getLicenseDetail().requestedWeaponIds?.length > 0 && (
              <div className='mt-2'>
                <div className='text-sm font-medium mb-1'>Selected Weapons:</div>
                <div className='flex flex-wrap gap-2'>
                  {getLicenseDetail().requestedWeaponIds.map((weaponId: number) => {
                    const weapon = weapons.find(w => w.id === weaponId);
                    return weapon ? (
                      <span
                        key={weaponId}
                        className='inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'
                      >
                        {weapon.name}
                        <button
                          type='button'
                          onClick={() =>
                            handleWeaponChange({ target: { value: String(weaponId) } } as any)
                          }
                          className='ml-1 text-blue-600 hover:text-blue-800'
                        >
                          ×
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
        {/* Right column: 17 above 18 */}
        <div className='flex flex-col gap-8'>
          {/* 17. Areas within which applicant wishes to carry arms */}
          <div className='mb-4'>
            <div className='font-medium mb-1'>
              17. Areas within which applicant wishes to carry arms
            </div>
            <div className='text-xs text-gray-600 mb-1'>Tick any of the options</div>
            <div className='flex gap-6'>
              <Checkbox
                label='District'
                name='areaDistrict'
                checked={getLicenseDetail().areaOfValidity?.includes('District-wide') || false}
                onChange={checked => handleAreaChange('District-wide', checked)}
              />
              <Checkbox
                label='State'
                name='areaState'
                checked={getLicenseDetail().areaOfValidity?.includes('State-wide') || false}
                onChange={checked => handleAreaChange('State-wide', checked)}
              />
              <Checkbox
                label='Throughout India'
                name='areaIndia'
                checked={getLicenseDetail().areaOfValidity?.includes('Throughout India') || false}
                onChange={checked => handleAreaChange('Throughout India', checked)}
              />
            </div>
          </div>

          {/* Ammunition Description */}
          <div className='mb-4'>
            <label className='block text-sm font-medium text-gray-700 mb-1'>
              Ammunition Description
            </label>
            <input
              type='text'
              name='ammunitionDescription'
              value={getLicenseDetail().ammunitionDescription || ''}
              onChange={handleChange}
              className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400'
              placeholder='e.g., 50 rounds of .32 ammunition'
            />
          </div>
          {/* 18. Claims for special consideration */}
          <div className='mb-4'>
            <label className='block font-medium mb-1'>
              18. Claims for special consideration for obtaining the licence, if any
            </label>
            <span className='block italic text-xs text-gray-500 mb-2'>
              (attach documentary evidence)
            </span>
            <textarea
              name='specialConsiderationReason'
              value={getLicenseDetail().specialConsiderationReason || ''}
              onChange={handleChange}
              className='w-full border border-gray-300 rounded px-3 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-400'
              rows={2}
              placeholder='Enter your claim (if any)'
            />

            {/* Document Upload Section */}
            <div className='border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 transition-colors'>
              <div className='text-center'>
                <svg
                  className='mx-auto h-12 w-12 text-gray-400'
                  stroke='currentColor'
                  fill='none'
                  viewBox='0 0 48 48'
                >
                  <path
                    d='M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02'
                    strokeWidth='2'
                    strokeLinecap='round'
                    strokeLinejoin='round'
                  />
                </svg>
                <div className='mt-4'>
                  <label htmlFor='specialClaimsEvidence' className='cursor-pointer'>
                    <span className='mt-2 block text-sm font-medium text-gray-900'>
                      {uploadingFiles ? 'Uploading...' : 'Upload documentary evidence'}
                    </span>
                    <span className='mt-1 block text-xs text-gray-500'>
                      PDF, DOC, DOCX, JPG, PNG up to 10MB each • Multiple files allowed
                    </span>
                  </label>
                  <input
                    id='specialClaimsEvidence'
                    name='specialClaimsEvidence'
                    type='file'
                    className='sr-only'
                    accept='.pdf,.doc,.docx,.jpg,.jpeg,.png'
                    onChange={handleFileChange}
                    disabled={uploadingFiles}
                  />
                </div>
              </div>

              {/* Upload Progress */}
              {uploadingFiles && uploadProgress && (
                <div className='mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg'>
                  <div className='flex items-center'>
                    <svg
                      className='animate-spin h-5 w-5 text-blue-500 mr-2'
                      fill='none'
                      viewBox='0 0 24 24'
                    >
                      <circle
                        className='opacity-25'
                        cx='12'
                        cy='12'
                        r='10'
                        stroke='currentColor'
                        strokeWidth='4'
                      ></circle>
                      <path
                        className='opacity-75'
                        fill='currentColor'
                        d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                      ></path>
                    </svg>
                    <span className='text-sm text-blue-700'>{uploadProgress}</span>
                  </div>
                </div>
              )}

              {/* Show uploaded files (from API) */}
              {getLicenseDetail().uploadedFiles && getLicenseDetail().uploadedFiles.length > 0 && (
                <div className='mt-4 space-y-2'>
                  <div className='text-sm font-medium text-gray-700'>
                    Uploaded Documents ({getLicenseDetail().uploadedFiles.length}):
                  </div>
                  {getLicenseDetail().uploadedFiles.map((uploadedFile: any, index: number) => (
                    <div
                      key={`uploaded-${index}`}
                      className='flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg'
                    >
                      <div className='flex items-center'>
                        <svg
                          className='h-5 w-5 text-green-400 mr-2'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                            clipRule='evenodd'
                          />
                        </svg>
                        <div>
                          <span className='text-sm text-green-700 font-medium'>
                            {uploadedFile.fileName}
                          </span>
                          <div className='text-xs text-green-600'>
                            {(uploadedFile.fileSize / 1024 / 1024).toFixed(2)} MB • Uploaded
                          </div>
                        </div>
                      </div>
                      <button
                        type='button'
                        onClick={() => removeFile(index, true)}
                        className='text-red-500 hover:text-red-700 p-1'
                        title='Remove file'
                      >
                        <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20'>
                          <path
                            fillRule='evenodd'
                            d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                            clipRule='evenodd'
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Show local files (pending upload) */}
              {getLicenseDetail().specialClaimsEvidence &&
                getLicenseDetail().specialClaimsEvidence.length > 0 && (
                  <div className='mt-4 space-y-2'>
                    <div className='text-sm font-medium text-gray-700'>
                      Pending Upload ({getLicenseDetail().specialClaimsEvidence.length}):
                    </div>
                    {getLicenseDetail().specialClaimsEvidence.map((file: File, index: number) => (
                      <div
                        key={`pending-${index}`}
                        className='flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg'
                      >
                        <div className='flex items-center'>
                          <svg
                            className='h-5 w-5 text-yellow-400 mr-2'
                            fill='currentColor'
                            viewBox='0 0 20 20'
                          >
                            <path
                              fillRule='evenodd'
                              d='M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z'
                              clipRule='evenodd'
                            />
                          </svg>
                          <div>
                            <span className='text-sm text-yellow-700 font-medium'>{file.name}</span>
                            <div className='text-xs text-yellow-600'>
                              {(file.size / 1024 / 1024).toFixed(2)} MB • Waiting for Application ID
                            </div>
                          </div>
                        </div>
                        <button
                          type='button'
                          onClick={() => removeFile(index, false)}
                          className='text-red-500 hover:text-red-700 p-1'
                          title='Remove file'
                        >
                          <svg className='h-5 w-5' fill='currentColor' viewBox='0 0 20 20'>
                            <path
                              fillRule='evenodd'
                              d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                              clipRule='evenodd'
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              {/* Upload limit info */}
              {(() => {
                const totalFiles =
                  (getLicenseDetail().specialClaimsEvidence?.length || 0) +
                  (getLicenseDetail().uploadedFiles?.length || 0);
                return (
                  totalFiles >= 5 && (
                    <div className='mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700'>
                      ⚠️ Maximum 5 files allowed. Remove a file to upload more.
                    </div>
                  )
                );
              })()}
            </div>
          </div>
          {/* 19. Details for an application for license in Form IV */}
          <div className='mb-4'>
            <div className='font-medium mb-3'>
              19. Details for an application for license in Form IV
            </div>

            {/* (a) Place or area for which the licence is sought */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                (a) Place or area for which the licence is sought
              </label>
              <input
                type='text'
                name='licencePlaceArea'
                value={getLicenseDetail().licencePlaceArea || ''}
                onChange={handleChange}
                className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400'
                placeholder='Enter place or area'
              />
            </div>

            {/* (b) Specification of wild beasts */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>
                (b) Specification of the wild beasts which are permitted to be destroyed as per the
                permit granted under the Wild life (Protection) Act, 1972 (53 of 1972) to the
                applicant
              </label>
              <textarea
                name='wildBeastsSpecification'
                value={getLicenseDetail().wildBeastsSpecification || ''}
                onChange={handleChange}
                className='w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400'
                rows={3}
                placeholder='Enter specification of wild beasts permitted to be destroyed'
              />
            </div>
          </div>
        </div>
      </div>
      <FormFooter
        onSaveToDraft={handleSaveToDraft}
        onNext={handleNext}
        onPrevious={handlePrevious}
        isLoading={isSubmitting}
      />
    </form>
  );
};

export default LicenseDetails;
