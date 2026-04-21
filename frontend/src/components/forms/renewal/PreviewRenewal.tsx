'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import toast from 'react-hot-toast';
import { ApplicationService } from '../../../api/applicationService';
import { WeaponsService, Weapon } from '../../../services/weapons';
import { openDocumentFile } from '../../../services/fileHandler';
import { RENEWAL_ROUTES } from './renewalRoutes';
import FormFooter from '../elements/footer';

interface SectionConfig {
  title: string;
  route: string;
  dataKey?: string;
}

const sections: SectionConfig[] = [
  { title: 'Personal Information', route: RENEWAL_ROUTES.PERSONAL_INFO, dataKey: 'personalDetails' },
  { title: 'Address Details', route: RENEWAL_ROUTES.ADDRESS_DETAILS, dataKey: 'addresses' },
  {
    title: 'Occupation & Business',
    route: RENEWAL_ROUTES.OCCUPATION,
    dataKey: 'occupationAndBusiness',
  },
  { title: 'Criminal History', route: RENEWAL_ROUTES.CRIMINAL_HISTORY, dataKey: 'criminalHistories' },
  { title: 'License History', route: RENEWAL_ROUTES.LICENSE_HISTORY, dataKey: 'licenseHistories' },
  { title: 'License Details', route: RENEWAL_ROUTES.LICENSE_DETAILS, dataKey: 'licenseDetails' },
];

const PreviewRenewal = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applicationData, setApplicationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weapons, setWeapons] = useState<Weapon[]>([]);

  const applicationId =
    searchParams?.get('applicationId') ||
    searchParams?.get('id') ||
    searchParams?.get('acknowledgementNo') ||
    localStorage.getItem('applicationId');
  const acknowledgementNo =
    searchParams?.get('acknowledgementNo') || localStorage.getItem('acknowledgementNo');
  const isOwned = searchParams?.get('isOwned');

  const handleNext = () => {
    const idToUse = applicationId || acknowledgementNo;
    if (idToUse) {
      const url = new URL(RENEWAL_ROUTES.DECLARATION, window.location.origin);
      url.searchParams.set('id', idToUse);
      if (isOwned !== null) {
        url.searchParams.set('isOwned', isOwned || 'false');
      }
      router.push(url.pathname + url.search);
    } else {
      router.push(RENEWAL_ROUTES.DECLARATION);
    }
  };

  const handlePrevious = () => {
    const idToUse = applicationId || acknowledgementNo;
    if (idToUse) {
      const url = new URL(RENEWAL_ROUTES.DOCUMENTS_UPLOAD, window.location.origin);
      url.searchParams.set('id', idToUse);
      if (isOwned !== null) {
        url.searchParams.set('isOwned', isOwned || 'false');
      }
      router.push(url.pathname + url.search);
    } else {
      router.push(RENEWAL_ROUTES.DOCUMENTS_UPLOAD);
    }
  };

  useEffect(() => {
    const fetchApplicationData = async () => {
      try {
        setLoading(true);
        setError(null);

        const idToFetch = applicationId || acknowledgementNo;

        if (!idToFetch) {
          setError('No application ID or acknowledgement number found.');
          setLoading(false);
          return;
        }
        const isOwnedBool = isOwned === 'true' ? true : isOwned === 'false' ? false : undefined;

        const response = await ApplicationService.getApplication(idToFetch, isOwnedBool);
        if (response && response.success === false) {
          const errorMsg =
            response.details?.response?.error ||
            response.details?.response?.message ||
            response.details?.message ||
            'Failed to fetch application data';
          setError(errorMsg);
          setLoading(false);
          return;
        }

        let data = response;
        if (response && response.data) {
          data = response.data;
        }

        if (!data) {
          setError('No application data found');
          setLoading(false);
          return;
        }

        setApplicationData(data);
        setLoading(false);
      } catch (err: any) {
        let errorMessage = 'Failed to load application data.';
        if (err.response?.data?.details?.response?.error) {
          errorMessage = err.response.data.details.response.error;
        } else if (err.response?.data?.details?.response?.message) {
          errorMessage = err.response.data.details.response.message;
        } else if (err.response?.data?.error) {
          errorMessage = err.response.data.error;
        } else if (err.message) {
          errorMessage = err.message;
        }

        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchApplicationData();
  }, [applicationId, acknowledgementNo, isOwned]);

  useEffect(() => {
    const loadWeapons = async () => {
      try {
        const weaponsList = await WeaponsService.getAll();
        setWeapons(weaponsList || []);
      } catch (error) {
        setWeapons([
          { id: 1, name: 'Revolver' },
          { id: 2, name: 'Pistol' },
          { id: 3, name: 'Rifle' },
          { id: 4, name: 'Shotgun' },
          { id: 5, name: 'Airgun' },
        ]);
      }
    };

    loadWeapons();
  }, []);

  const handleEdit = (route: string) => {
    const idToUse = applicationId || acknowledgementNo;
    if (idToUse) {
      const url = new URL(route, window.location.origin);
      url.searchParams.set('id', idToUse);
      if (isOwned !== null) {
        url.searchParams.set('isOwned', isOwned || 'false');
      }
      router.push(url.pathname + url.search);
    } else {
      router.push(route);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getWeaponNames = (weaponIds: number[]) => {
    if (!weaponIds || weaponIds.length === 0) return 'Not Provided';

    const weaponNames = weaponIds.map(id => {
      const weapon = weapons.find(w => w.id === id);
      return weapon ? weapon.name : `Unknown Weapon (ID: ${id})`;
    });

    return weaponNames.join(', ');
  };

  const renderField = (label: string, value: any) => {
    let displayValue = value;

    if (value === null || value === undefined || value === '' || value === 'N/A') {
      displayValue = 'Not Provided';
    } else if (Array.isArray(value)) {
      displayValue = value.length > 0 ? value.join(', ') : 'Not Provided';
    } else if (typeof value === 'boolean') {
      displayValue = value ? 'Yes' : 'No';
    }

    return (
      <>
        <dt className='text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide'>
          {label}
        </dt>
        <dd
          className={`text-sm leading-relaxed max-w-xs ${
            displayValue === 'Not Provided' ? 'text-gray-400 italic' : 'text-gray-800 font-medium'
          }`}
        >
          {displayValue}
        </dd>
      </>
    );
  };

  const renderApplicationOverview = () => {
    if (!applicationData) return null;

    return (
      <div className='mb-6 border-2 border-blue-200 rounded-lg p-5 bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm'>
        <h3 className='text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2'>
          <span className='w-2 h-2 bg-blue-600 rounded-full'></span>
          Application Overview
        </h3>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          <div className='bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
              Application ID
            </span>
            <div className='text-lg font-semibold text-gray-800 mt-1'>
              {applicationData.id || 'N/A'}
            </div>
          </div>
          <div className='bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
              Acknowledgement No
            </span>
            <div className='text-lg font-semibold text-gray-800 mt-1'>
              {applicationData.acknowledgementNo || 'Not Generated'}
            </div>
          </div>
          <div className='bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
              License ID
            </span>
            <div className='text-lg font-semibold text-gray-800 mt-1'>
              {applicationData.almsLicenseId ?? applicationData.alms_license_id ?? applicationData.licenseId ?? 'Not Assigned'}
            </div>
          </div>
          <div className='bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
              Workflow Status
            </span>
            <div className='text-lg font-semibold text-green-600 mt-1'>
              {applicationData.workflowStatus?.status || 'In Progress'}
            </div>
          </div>
          <div className='bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
              Application Status
            </span>
            <div className='text-lg font-semibold text-blue-600 mt-1'>
              {applicationData.isSubmit ? 'Submitted' : 'Draft'}
            </div>
          </div>
          <div className='bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
              Created Date
            </span>
            <div className='text-sm text-gray-800 mt-1 font-medium'>
              {formatDate(applicationData.createdAt)}
            </div>
          </div>
          <div className='bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200'>
            <span className='text-xs font-medium text-gray-500 uppercase tracking-wide'>
              Last Updated
            </span>
            <div className='text-sm text-gray-800 mt-1 font-medium'>
              {formatDate(applicationData.updatedAt)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPersonalInfo = () => {
    if (!applicationData) return null;

    return (
      <div className='mb-6 border rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow duration-200'>
        <div className='flex justify-between items-center mb-5'>
          <h3 className='text-xl font-semibold text-gray-800 flex items-center gap-2'>
            <span className='w-2 h-2 bg-blue-500 rounded-full'></span>
            Personal Information
          </h3>
          <button
            type='button'
            onClick={() => handleEdit(RENEWAL_ROUTES.PERSONAL_INFO)}
            className='text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors duration-200 text-sm font-medium'
            title='Edit Personal Information'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
              />
            </svg>
            Edit
          </button>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 '>
          <div className='space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50'>
            <h4 className='text-lg font-medium text-gray-700 border-b pb-2 mb-4'>
              Basic Information
            </h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {renderField('First Name', applicationData.firstName)}
              {renderField('Middle Name', applicationData.middleName)}
              {renderField('Last Name', applicationData.lastName)}
              {renderField('Parent/Spouse Name', applicationData.parentOrSpouseName)}
              {renderField('Gender', applicationData.sex)}
              {renderField('Filled By', applicationData.filledBy)}
            </div>
          </div>

          <div className='space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50'>
            <h4 className='text-lg font-medium text-gray-700 border-b pb-2 mb-4'>
              Birth & Identity Details
            </h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {renderField('Date of Birth', formatDate(applicationData.dateOfBirth))}
              {renderField('DOB in Words', applicationData.dobInWords)}
              {renderField('Place of Birth', applicationData.placeOfBirth)}
              {renderField('Aadhar Number', applicationData.aadharNumber)}
              {renderField('PAN Number', applicationData.panNumber)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAddressDetails = () => {
    if (!applicationData) return null;

    const { presentAddress, permanentAddress, addresses } = applicationData;

    let presentAddr = presentAddress;
    let permanentAddr = permanentAddress;

    if (addresses && addresses.length > 0) {
      presentAddr =
        presentAddr || addresses.find((addr: any) => addr.type === 'present') || addresses[0];
      permanentAddr =
        permanentAddr || addresses.find((addr: any) => addr.type === 'permanent') || addresses[1];
    }

    return (
      <div className='mb-6 border rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow duration-200'>
        <div className='flex justify-between items-center mb-5'>
          <h3 className='text-xl font-semibold text-gray-800 flex items-center gap-2'>
            <span className='w-2 h-2 bg-emerald-500 rounded-full'></span>
            Address Details
          </h3>
          <button
            type='button'
            onClick={() => handleEdit(RENEWAL_ROUTES.ADDRESS_DETAILS)}
            className='text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors duration-200 text-sm font-medium'
            title='Edit Address Details'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
              />
            </svg>
            Edit
          </button>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50'>
            <h4 className='text-lg font-medium text-gray-700 border-b pb-2 mb-4'>
              Present Address
            </h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {renderField('Address Line', presentAddr?.addressLine)}
              {renderField('State', presentAddr?.state?.name || presentAddr?.state)}
              {renderField('District', presentAddr?.district?.name || presentAddr?.district)}
              {renderField('Zone', presentAddr?.zone?.name || presentAddr?.zone)}
              {renderField('Division', presentAddr?.division?.name || presentAddr?.division)}
              {renderField(
                'Police Station',
                presentAddr?.policeStation?.name || presentAddr?.policeStation
              )}
              {renderField('Residing Since', formatDate(presentAddr?.sinceResiding))}
            </div>
          </div>

          <div className='space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50'>
            <h4 className='text-lg font-medium text-gray-700 border-b pb-2 mb-4'>
              Permanent Address
            </h4>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              {renderField('Address Line', permanentAddr?.addressLine)}
              {renderField('State', permanentAddr?.state?.name || permanentAddr?.state)}
              {renderField('District', permanentAddr?.district?.name || permanentAddr?.district)}
              {renderField('Zone', permanentAddr?.zone?.name || permanentAddr?.zone)}
              {renderField('Division', permanentAddr?.division?.name || permanentAddr?.division)}
              {renderField(
                'Police Station',
                permanentAddr?.policeStation?.name || permanentAddr?.policeStation
              )}
            </div>
          </div>
        </div>

        <div className='border border-gray-200 rounded-lg p-4 bg-gray-50 mt-6'>
          <h4 className='text-lg font-medium text-gray-700 border-b pb-2 mb-4'>
            Office Contact Details
          </h4>
          <dl className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2'>
            {renderField('Office Phone', presentAddr?.telephoneOffice)}
            {renderField('Office Mobile', presentAddr?.officeMobileNumber)}
            {renderField('Alternative Mobile', presentAddr?.alternativeMobile)}
          </dl>
        </div>
      </div>
    );
  };

  const renderOccupationBusiness = () => {
    if (!applicationData) return null;

    const occupation = applicationData.occupationAndBusiness;

    return (
      <div className='mb-6 border rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow duration-200'>
        <div className='flex justify-between items-center mb-5'>
          <h3 className='text-xl font-semibold text-gray-800 flex items-center gap-2'>
            <span className='w-2 h-2 bg-purple-500 rounded-full'></span>
            Occupation & Business
          </h3>
          <button
            type='button'
            onClick={() => handleEdit(RENEWAL_ROUTES.OCCUPATION)}
            className='text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors duration-200 text-sm font-medium'
            title='Edit Occupation & Business'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
              />
            </svg>
            Edit
          </button>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
          <div className='space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50'>
            <h4 className='text-lg font-medium text-gray-700 border-b pb-2 mb-4'>
              Professional Details
            </h4>
            <dl className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2'>
              <>
                <dt className='text-xs font-semibold text-gray-600 uppercase tracking-wide'>
                  Occupation
                </dt>
                <dd className='text-sm text-gray-800 font-medium'>
                  {occupation?.occupation || (
                    <span className='text-gray-400 italic'>Not Provided</span>
                  )}
                </dd>
                <dt className='text-xs font-semibold text-gray-600 uppercase tracking-wide'>
                  Office Address
                </dt>
                <dd className='text-sm text-gray-800 font-medium'>
                  {occupation?.officeAddress || (
                    <span className='text-gray-400 italic'>Not Provided</span>
                  )}
                </dd>
                <dt className='text-xs font-semibold text-gray-600 uppercase tracking-wide'>
                  State
                </dt>
                <dd className='text-sm text-gray-800 font-medium'>
                  {occupation?.state?.name || occupation?.state || (
                    <span className='text-gray-400 italic'>Not Provided</span>
                  )}
                </dd>
                <dt className='text-xs font-semibold text-gray-600 uppercase tracking-wide'>
                  District
                </dt>
                <dd className='text-sm text-gray-800 font-medium'>
                  {occupation?.district?.name || occupation?.district || (
                    <span className='text-gray-400 italic'>Not Provided</span>
                  )}
                </dd>
              </>
            </dl>
          </div>

          <div className='space-y-4 border border-gray-200 rounded-lg p-4 bg-gray-50 '>
            <h4 className='text-lg font-medium text-gray-700 border-b pb-2 mb-4'>
              Agricultural Details
            </h4>
            <dl className='grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2'>
              <>
                <dt className='text-xs font-semibold text-gray-600 uppercase tracking-wide'>
                  Crop Location
                </dt>
                <dd className='text-sm text-gray-800 font-medium'>
                  {occupation?.cropLocation || (
                    <span className='text-gray-400 italic'>Not Provided</span>
                  )}
                </dd>
                <dt className='text-xs font-semibold text-gray-600 uppercase tracking-wide'>
                  Area Under Cultivation
                </dt>
                <dd className='text-sm text-gray-800 font-medium'>
                  {occupation?.areaUnderCultivation || (
                    <span className='text-gray-400 italic'>Not Provided</span>
                  )}
                </dd>
              </>
            </dl>
          </div>
        </div>
      </div>
    );
  };

  const renderCriminalHistory = () => {
    if (!applicationData) return null;

    const criminalHistories = applicationData.criminalHistories || [];

    return (
      <div className='mb-8 border rounded-lg p-6 bg-white shadow-sm'>
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-xl font-semibold text-gray-800 flex items-center gap-2'>
            <span className='w-2 h-2 bg-red-500 rounded-full'></span>
            Criminal History
          </h3>
          <button
            type='button'
            onClick={() => handleEdit(RENEWAL_ROUTES.CRIMINAL_HISTORY)}
            className='text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 py-1 rounded-md hover:bg-blue-50'
            title='Edit Criminal History'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
              />
            </svg>
            <span className='text-sm'>Edit</span>
          </button>
        </div>

        {criminalHistories.length > 0 ? (
          <div className='space-y-6'>
            {criminalHistories.map((history: any, index: number) => (
              <div key={index} className='border border-gray-200 rounded-lg p-5 bg-gray-50'>
                <h5 className='font-semibold text-gray-800 mb-4'>
                  Criminal History Entry {index + 1}
                </h5>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='border border-gray-200 rounded-lg p-4 bg-white'>
                    <h6 className='font-medium text-gray-700 border-b pb-1 mb-2'>Legal Status</h6>
                    <dl className='grid grid-cols-2 gap-x-4 gap-y-2 mb-2'>
                      <dt className='text-xs font-semibold text-gray-600'>Convicted</dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {typeof history.isConvicted === 'boolean' ? (
                          history.isConvicted ? (
                            'Yes'
                          ) : (
                            'No'
                          )
                        ) : (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                      <dt className='text-xs font-semibold text-gray-600'>Bond Executed</dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {typeof history.isBondExecuted === 'boolean' ? (
                          history.isBondExecuted ? (
                            'Yes'
                          ) : (
                            'No'
                          )
                        ) : (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                      <dt className='text-xs font-semibold text-gray-600'>Bond Date</dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {history.bondDate ? (
                          formatDate(history.bondDate)
                        ) : (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                      <dt className='text-xs font-semibold text-gray-600'>Bond Period</dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {history.bondPeriod || (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                    </dl>
                  </div>
                  <div className='border border-gray-200 rounded-lg p-4 bg-white'>
                    <h6 className='font-medium text-gray-700 border-b pb-1 mb-2'>
                      Prohibition Details
                    </h6>
                    <dl className='grid grid-cols-2 gap-x-4 gap-y-2 mb-2'>
                      <dt className='text-xs font-semibold text-gray-600'>Prohibited</dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {typeof history.isProhibited === 'boolean' ? (
                          history.isProhibited ? (
                            'Yes'
                          ) : (
                            'No'
                          )
                        ) : (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                      <dt className='text-xs font-semibold text-gray-600'>Prohibition Date</dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {history.prohibitionDate ? (
                          formatDate(history.prohibitionDate)
                        ) : (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                      <dt className='text-xs font-semibold text-gray-600'>Prohibition Period</dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {history.prohibitionPeriod || (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                    </dl>
                  </div>
                  {history.firDetails && history.firDetails.length > 0 && (
                    <div className='border border-gray-200 rounded-lg p-4 bg-white md:col-span-2'>
                      <h6 className='font-medium text-gray-700 border-b pb-1 mb-2'>FIR Details</h6>
                      <div className='grid gap-4'>
                        {history.firDetails.map((fir: any, firIndex: number) => (
                          <div
                            key={firIndex}
                            className='bg-gray-50 rounded-lg p-4 border border-gray-200'
                          >
                            <span className='font-medium text-gray-600 mb-2 block'>
                              FIR {firIndex + 1}
                            </span>
                            <dl className='grid grid-cols-2 gap-x-4 gap-y-2'>
                              <dt className='text-xs font-semibold text-gray-600'>FIR Number</dt>
                              <dd className='text-sm text-gray-800 font-medium'>
                                {fir.firNumber || (
                                  <span className='text-gray-400 italic'>Not Provided</span>
                                )}
                              </dd>
                              <dt className='text-xs font-semibold text-gray-600'>Under Section</dt>
                              <dd className='text-sm text-gray-800 font-medium'>
                                {fir.underSection || (
                                  <span className='text-gray-400 italic'>Not Provided</span>
                                )}
                              </dd>
                              <dt className='text-xs font-semibold text-gray-600'>
                                Police Station
                              </dt>
                              <dd className='text-sm text-gray-800 font-medium'>
                                {fir.policeStation || (
                                  <span className='text-gray-400 italic'>Not Provided</span>
                                )}
                              </dd>
                              <dt className='text-xs font-semibold text-gray-600'>Unit</dt>
                              <dd className='text-sm text-gray-800 font-medium'>
                                {fir.unit || (
                                  <span className='text-gray-400 italic'>Not Provided</span>
                                )}
                              </dd>
                              <dt className='text-xs font-semibold text-gray-600'>District</dt>
                              <dd className='text-sm text-gray-800 font-medium'>
                                {fir.District || (
                                  <span className='text-gray-400 italic'>Not Provided</span>
                                )}
                              </dd>
                              <dt className='text-xs font-semibold text-gray-600'>State</dt>
                              <dd className='text-sm text-gray-800 font-medium'>
                                {fir.state || (
                                  <span className='text-gray-400 italic'>Not Provided</span>
                                )}
                              </dd>
                              <dt className='text-xs font-semibold text-gray-600'>Offence</dt>
                              <dd className='text-sm text-gray-800 font-medium'>
                                {fir.offence || (
                                  <span className='text-gray-400 italic'>Not Provided</span>
                                )}
                              </dd>
                              <dt className='text-xs font-semibold text-gray-600'>Sentence</dt>
                              <dd className='text-sm text-gray-800 font-medium'>
                                {fir.sentence || (
                                  <span className='text-gray-400 italic'>Not Provided</span>
                                )}
                              </dd>
                              <dt className='text-xs font-semibold text-gray-600'>
                                Date of Sentence
                              </dt>
                              <dd className='text-sm text-gray-800 font-medium'>
                                {fir.DateOfSentence ? (
                                  formatDate(fir.DateOfSentence)
                                ) : (
                                  <span className='text-gray-400 italic'>Not Provided</span>
                                )}
                              </dd>
                            </dl>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-8 bg-green-50 rounded-lg border border-green-200'>
            <p className='text-green-700 font-medium'>No criminal history records found</p>
            <p className='text-green-600 text-sm mt-1'>This indicates a clean criminal record</p>
          </div>
        )}
      </div>
    );
  };

  const renderLicenseHistory = () => {
    if (!applicationData) return null;

    const licenseHistories = applicationData.licenseHistories || [];

    return (
      <div className='mb-8 border rounded-lg p-6 bg-white shadow-sm'>
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-xl font-semibold text-gray-800 flex items-center gap-2'>
            <span className='w-2 h-2 bg-amber-500 rounded-full'></span>
            License History
          </h3>
          <button
            type='button'
            onClick={() => handleEdit(RENEWAL_ROUTES.LICENSE_HISTORY)}
            className='text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 py-1 rounded-md hover:bg-blue-50'
            title='Edit License History'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
              />
            </svg>
            <span className='text-sm'>Edit</span>
          </button>
        </div>

        {licenseHistories.length > 0 ? (
          <div className='space-y-6'>
            {licenseHistories.map((history: any, index: number) => (
              <div key={index} className='border border-gray-200 rounded-lg p-5 bg-gray-50'>
                <h5 className='font-semibold text-gray-800 mb-4'>
                  License History Entry {index + 1}
                </h5>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='border border-gray-200 rounded-lg p-4 bg-white'>
                    <h6 className='font-medium text-gray-700 border-b pb-1 mb-2'>
                      Previous Applications
                    </h6>
                    <dl className='grid grid-cols-2 gap-x-4 gap-y-2 mb-2'>
                      <dt className='text-xs font-semibold text-gray-600'>Applied Before</dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {typeof history.hasAppliedBefore === 'boolean' ? (
                          history.hasAppliedBefore ? (
                            'Yes'
                          ) : (
                            'No'
                          )
                        ) : (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                      <dt className='text-xs font-semibold text-gray-600'>Date Applied For</dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {history.dateAppliedFor ? (
                          formatDate(history.dateAppliedFor)
                        ) : (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                      <dt className='text-xs font-semibold text-gray-600'>
                        Previous Authority Name
                      </dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {history.previousAuthorityName || (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                      <dt className='text-xs font-semibold text-gray-600'>Previous Result</dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {history.previousResult || (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                    </dl>
                  </div>
                  <div className='border border-gray-200 rounded-lg p-4 bg-white'>
                    <h6 className='font-medium text-gray-700 border-b pb-1 mb-2'>
                      Suspension Information
                    </h6>
                    <dl className='grid grid-cols-2 gap-x-4 gap-y-2 mb-2'>
                      <dt className='text-xs font-semibold text-gray-600'>License Suspended</dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {typeof history.hasLicenceSuspended === 'boolean' ? (
                          history.hasLicenceSuspended ? (
                            'Yes'
                          ) : (
                            'No'
                          )
                        ) : (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                      <dt className='text-xs font-semibold text-gray-600'>Suspension Authority</dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {history.suspensionAuthorityName || (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                      <dt className='text-xs font-semibold text-gray-600'>Suspension Reason</dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {history.suspensionReason || (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                    </dl>
                  </div>
                  <div className='border border-gray-200 rounded-lg p-4 bg-white'>
                    <h6 className='font-medium text-gray-700 border-b pb-1 mb-2'>
                      Family License Information
                    </h6>
                    <dl className='grid grid-cols-2 gap-x-4 gap-y-2 mb-2'>
                      <dt className='text-xs font-semibold text-gray-600'>
                        Family Member Has License
                      </dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {typeof history.hasFamilyLicence === 'boolean' ? (
                          history.hasFamilyLicence ? (
                            'Yes'
                          ) : (
                            'No'
                          )
                        ) : (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                      <dt className='text-xs font-semibold text-gray-600'>Family Member Name</dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {history.familyMemberName || (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                      <dt className='text-xs font-semibold text-gray-600'>Family License Number</dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {history.familyLicenceNumber || (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                      <dt className='text-xs font-semibold text-gray-600'>
                        Family Weapons Endorsed
                      </dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {history.familyWeaponsEndorsed &&
                        history.familyWeaponsEndorsed.length > 0 ? (
                          history.familyWeaponsEndorsed.join(', ')
                        ) : (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                    </dl>
                  </div>
                  <div className='border border-gray-200 rounded-lg p-4 bg-white'>
                    <h6 className='font-medium text-gray-700 border-b pb-1 mb-2'>
                      Storage & Training Information
                    </h6>
                    <dl className='grid grid-cols-2 gap-x-4 gap-y-2 mb-2'>
                      <dt className='text-xs font-semibold text-gray-600'>
                        Safe Place for Storage
                      </dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {typeof history.hasSafePlace === 'boolean' ? (
                          history.hasSafePlace ? (
                            'Yes'
                          ) : (
                            'No'
                          )
                        ) : (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                      <dt className='text-xs font-semibold text-gray-600'>Safe Place Details</dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {history.safePlaceDetails || (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                      <dt className='text-xs font-semibold text-gray-600'>Has Training</dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {typeof history.hasTraining === 'boolean' ? (
                          history.hasTraining ? (
                            'Yes'
                          ) : (
                            'No'
                          )
                        ) : (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                      <dt className='text-xs font-semibold text-gray-600'>Training Details</dt>
                      <dd className='text-sm text-gray-800 font-medium'>
                        {history.trainingDetails || (
                          <span className='text-gray-400 italic'>Not Provided</span>
                        )}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-center py-8 bg-blue-50 rounded-lg border border-blue-200'>
            <p className='text-blue-700 font-medium'>No license history records found</p>
            <p className='text-blue-600 text-sm mt-1'>This is the first license application</p>
          </div>
        )}
      </div>
    );
  };

  const renderLicenseDetails = () => {
    if (!applicationData) return null;

    const licenseDetails = applicationData.licenseDetails || [];

    return (
      <div className='mb-8 border rounded-lg p-6 bg-white shadow-sm'>
        <div className='flex justify-between items-center mb-6'>
          <h3 className='text-xl font-semibold text-gray-800 flex items-center gap-2'>
            <span className='w-2 h-2 bg-cyan-500 rounded-full'></span>
            License Details
          </h3>
          <button
            type='button'
            onClick={() => handleEdit(RENEWAL_ROUTES.LICENSE_DETAILS)}
            className='text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 py-1 rounded-md hover:bg-blue-50'
            title='Edit License Details'
          >
            <svg className='w-4 h-4' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
              />
            </svg>
            <span className='text-sm'>Edit</span>
          </button>
        </div>

        {licenseDetails.length > 0 ? (
          <div className='space-y-6'>
            {licenseDetails.map((detail: any, index: number) => {
              const requestedWeaponIds =
                detail.requestedWeaponIds ||
                (detail.requestedWeapons
                  ? detail.requestedWeapons.map((weapon: any) => weapon.id)
                  : []);
              return (
                <div key={index} className='border border-gray-200 rounded-lg p-5 bg-gray-50'>
                  <h5 className='font-semibold text-gray-800 mb-4'>
                    License Application Details {index + 1}
                  </h5>
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                    <div className='border border-gray-200 rounded-lg p-4 bg-white'>
                      <h6 className='font-medium text-gray-700 border-b pb-1 mb-2'>
                        License Requirements
                      </h6>
                      <dl className='grid grid-cols-2 gap-x-4 gap-y-2 mb-2'>
                        <dt className='text-xs font-semibold text-gray-600'>Need for License</dt>
                        <dd className='text-sm text-gray-800 font-medium'>
                          {detail.needForLicense || (
                            <span className='text-gray-400 italic'>Not Provided</span>
                          )}
                        </dd>
                        <dt className='text-xs font-semibold text-gray-600'>Arms Category</dt>
                        <dd className='text-sm text-gray-800 font-medium'>
                          {detail.armsCategory || (
                            <span className='text-gray-400 italic'>Not Provided</span>
                          )}
                        </dd>
                        <dt className='text-xs font-semibold text-gray-600'>Area of Validity</dt>
                        <dd className='text-sm text-gray-800 font-medium'>
                          {detail.areaOfValidity || (
                            <span className='text-gray-400 italic'>Not Provided</span>
                          )}
                        </dd>
                        <dt className='text-xs font-semibold text-gray-600'>License Place Area</dt>
                        <dd className='text-sm text-gray-800 font-medium'>
                          {detail.licencePlaceArea || (
                            <span className='text-gray-400 italic'>Not Provided</span>
                          )}
                        </dd>
                      </dl>
                    </div>
                    <div className='border border-gray-200 rounded-lg p-4 bg-white'>
                      <h6 className='font-medium text-gray-700 border-b pb-1 mb-2'>
                        Weapon & Ammunition
                      </h6>
                      <dl className='grid grid-cols-2 gap-x-4 gap-y-2 mb-2'>
                        <dt className='text-xs font-semibold text-gray-600'>Requested Weapons</dt>
                        <dd className='text-sm text-gray-800 font-medium'>
                          {requestedWeaponIds && requestedWeaponIds.length > 0 ? (
                            <div className='flex flex-wrap gap-1.5'>
                              {requestedWeaponIds.map((weaponId: number, idx: number) => {
                                let weapon = weapons.find(w => w.id === weaponId);
                                if (!weapon && detail.requestedWeapons) {
                                  weapon = detail.requestedWeapons.find(
                                    (w: any) => w.id === weaponId
                                  );
                                }
                                return (
                                  <span
                                    key={weaponId}
                                    className='inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-md border border-blue-200 font-medium'
                                  >
                                    {weapon ? weapon.name : `Unknown Weapon (ID: ${weaponId})`}
                                  </span>
                                );
                              })}
                            </div>
                          ) : (
                            <span className='text-gray-400 italic'>No weapons selected</span>
                          )}
                        </dd>
                        <dt className='text-xs font-semibold text-gray-600'>Ammunition Quantity</dt>
                        <dd className='text-sm text-gray-800 font-medium'>
                          {detail.ammoQuantity || (
                            <span className='text-gray-400 italic'>Not Provided</span>
                          )}
                        </dd>
                      </dl>
                    </div>
                    <div className='border border-gray-200 rounded-lg p-4 bg-white'>
                      <h6 className='font-medium text-gray-700 border-b pb-1 mb-2'>
                        Weapon Storage
                      </h6>
                      <dl className='grid grid-cols-2 gap-x-4 gap-y-2 mb-2'>
                        <dt className='text-xs font-semibold text-gray-600'>Safe Storage Available</dt>
                        <dd className='text-sm text-gray-800 font-medium'>
                          {detail.isSafeStorage === true || detail.isSafeStorage === 'true' ? (
                            'Yes'
                          ) : detail.isSafeStorage === false || detail.isSafeStorage === 'false' ? (
                            'No'
                          ) : (
                            <span className='text-gray-400 italic'>Not Provided</span>
                          )}
                        </dd>
                        <dt className='text-xs font-semibold text-gray-600'>Storage Address</dt>
                        <dd className='text-sm text-gray-800 font-medium'>
                          {detail.storageAddress || (
                            <span className='text-gray-400 italic'>Not Provided</span>
                          )}
                        </dd>
                      </dl>
                    </div>
                    <div className='border border-gray-200 rounded-lg p-4 bg-white'>
                      <h6 className='font-medium text-gray-700 border-b pb-1 mb-2'>
                        Security Measures
                      </h6>
                      <dl className='grid grid-cols-2 gap-x-4 gap-y-2 mb-2'>
                        <dt className='text-xs font-semibold text-gray-600'>Grills Installed</dt>
                        <dd className='text-sm text-gray-800 font-medium'>
                          {detail.hasGrills === true || detail.hasGrills === 'true' ? (
                            'Yes'
                          ) : detail.hasGrills === false || detail.hasGrills === 'false' ? (
                            'No'
                          ) : (
                            <span className='text-gray-400 italic'>Not Provided</span>
                          )}
                        </dd>
                        <dt className='text-xs font-semibold text-gray-600'>Locking System</dt>
                        <dd className='text-sm text-gray-800 font-medium'>
                          {detail.hasLockingSystem === true || detail.hasLockingSystem === 'true' ? (
                            'Yes'
                          ) : detail.hasLockingSystem === false || detail.hasLockingSystem === 'false' ? (
                            'No'
                          ) : (
                            <span className='text-gray-400 italic'>Not Provided</span>
                          )}
                        </dd>
                        <dt className='text-xs font-semibold text-gray-600'>Alarmed</dt>
                        <dd className='text-sm text-gray-800 font-medium'>
                          {detail.isAlarmed === true || detail.isAlarmed === 'true' ? (
                            'Yes'
                          ) : detail.isAlarmed === false || detail.isAlarmed === 'false' ? (
                            'No'
                          ) : (
                            <span className='text-gray-400 italic'>Not Provided</span>
                          )}
                        </dd>
                        <dt className='text-xs font-semibold text-gray-600'>CCTV Coverage</dt>
                        <dd className='text-sm text-gray-800 font-medium'>
                          {detail.hasCCTV === true || detail.hasCCTV === 'true' ? (
                            'Yes'
                          ) : detail.hasCCTV === false || detail.hasCCTV === 'false' ? (
                            'No'
                          ) : (
                            <span className='text-gray-400 italic'>Not Provided</span>
                          )}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className='text-center py-8 bg-gray-50 rounded-lg border border-gray-200'>
            <p className='text-gray-600 font-medium'>No license details found</p>
            <p className='text-gray-500 text-sm mt-1'>Please add license details to proceed</p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='p-6'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-6 text-center'>
          <h3 className='text-red-700 text-lg font-semibold mb-2'>Error Loading Preview</h3>
          <p className='text-red-600'>{error}</p>
        </div>
        <FormFooter
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      </div>
    );
  }

  return (
    <div className='p-4 bg-white'>
      <div className='max-w-6xl mx-auto'>
        <div className='text-center mb-6'>
          <h2 className='text-3xl font-bold mb-2 text-gray-800'>Preview - Renewal Application</h2>
          <div className='w-24 h-1 bg-blue-600 mx-auto rounded-full mb-4'></div>
        </div>

        <div className='space-y-6'>
          {renderApplicationOverview()}
          {renderPersonalInfo()}
          {renderAddressDetails()}
          {renderOccupationBusiness()}
          {renderCriminalHistory()}
          {renderLicenseHistory()}
          {renderLicenseDetails()}
        </div>

        <FormFooter
          onNext={handleNext}
          onPrevious={handlePrevious}
        />
      </div>
    </div>
  );
};

export default PreviewRenewal;