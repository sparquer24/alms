"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { ApplicationService } from '../../../api/applicationService';
import { locationAPI } from '../../../api/locationApi';
import { WeaponsService, Weapon } from '../../../services/weapons';
import { FORM_ROUTES } from '../../../config/formRoutes';
import FormFooter from "../elements/footer";

interface SectionConfig {
  title: string;
  route: string;
  dataKey?: string;
}

const sections: SectionConfig[] = [
  { title: "Personal Information", route: FORM_ROUTES.PERSONAL_INFO, dataKey: "personalDetails" },
  { title: "Address Details", route: FORM_ROUTES.ADDRESS_DETAILS, dataKey: "addresses" },
  { title: "Occupation & Business", route: FORM_ROUTES.OCCUPATION_DETAILS, dataKey: "occupationAndBusiness" },
  { title: "Criminal History", route: FORM_ROUTES.CRIMINAL_HISTORY, dataKey: "criminalHistories" },
  { title: "License History", route: FORM_ROUTES.LICENSE_HISTORY, dataKey: "licenseHistories" },
  { title: "License Details", route: FORM_ROUTES.LICENSE_DETAILS, dataKey: "licenseDetails" },
];

const Preview = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [applicationData, setApplicationData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [weapons, setWeapons] = useState<Weapon[]>([]);

  // Get applicationId or acknowledgementNo from URL params or localStorage
  const applicationId = searchParams?.get('applicationId') || 
                        searchParams?.get('id') || 
                        localStorage.getItem('applicationId');
  const acknowledgementNo = searchParams?.get('acknowledgementNo') || 
                            localStorage.getItem('acknowledgementNo');
  const isOwned = searchParams?.get('isOwned');

  // Navigation handlers
  const handleNext = () => {
    const idToUse = applicationId || acknowledgementNo;
    if (idToUse) {
      console.log('✅ Navigating to Declaration with ID:', idToUse);
      const url = new URL(FORM_ROUTES.DECLARATION, window.location.origin);
      url.searchParams.set('id', idToUse);
      if (isOwned !== null) {
        url.searchParams.set('isOwned', isOwned || 'false');
      }
      router.push(url.pathname + url.search);
    } else {
      console.log('❌ No application ID found, navigating to Declaration without ID');
      router.push(FORM_ROUTES.DECLARATION);
    }
  };

  const handlePrevious = () => {
    const idToUse = applicationId || acknowledgementNo;
    if (idToUse) {
      const url = new URL(FORM_ROUTES.DOCUMENTS_UPLOAD, window.location.origin);
      url.searchParams.set('id', idToUse);
      if (isOwned !== null) {
        url.searchParams.set('isOwned', isOwned || 'false');
      }
      router.push(url.pathname + url.search);
    } else {
      router.push(FORM_ROUTES.DOCUMENTS_UPLOAD);
    }
  };

  // Fetch application data on mount and page refresh
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

        console.log('🔵 Fetching application data for ID:', idToFetch);
        console.log('🔵 isOwned parameter:', isOwned);
        
        // Convert isOwned string to boolean if present
        const isOwnedBool = isOwned === 'true' ? true : isOwned === 'false' ? false : undefined;
        
        const response = await ApplicationService.getApplication(idToFetch, isOwnedBool);
        
        console.log('🟢 Application data fetched:', response);
        console.log('🔍 Debug - Raw response structure:', JSON.stringify(response, null, 2));
        console.log('🔍 Debug - response.success:', response?.success);
        console.log('🔍 Debug - response.data:', response?.data);
        console.log('🔍 Debug - response.data.licenseDetails:', response?.data?.licenseDetails);
        console.log('🔍 Debug - typeof response:', typeof response);
        
        // Check if response indicates failure
        if (response && response.success === false) {
          const errorMsg = response.details?.response?.error ||
                          response.details?.response?.message ||
                          response.details?.message ||
                          'Failed to fetch application data';
          console.log('❌ Response indicates failure:', errorMsg);
          setError(errorMsg);
          setLoading(false);
          return;
        }

        // Extract the actual data
        let data = response;
        if (response && response.data) {
          data = response.data;
          console.log('🔄 Using response.data as application data');
        }

        if (!data) {
          console.log('❌ No data found in response');
          setError('No application data found');
          setLoading(false);
          return;
        }

        setApplicationData(data);
        setLoading(false);
      } catch (err: any) {
        console.error('❌ Error fetching application data:', err);
        
        // Extract detailed error message
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

  // Fetch weapons data for displaying weapon names instead of IDs
  useEffect(() => {
    const loadWeapons = async () => {
      try {
        const weaponsList = await WeaponsService.getAll();
        setWeapons(weaponsList || []);
        console.log('🔫 Weapons loaded:', weaponsList);
      } catch (error) {
        console.error('❌ Error loading weapons:', error);
        // Fallback weapons if API fails
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

  // Navigate to specific section for editing
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

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Helper function to get weapon names from IDs
  const getWeaponNames = (weaponIds: number[]) => {
    if (!weaponIds || weaponIds.length === 0) return 'Not Provided';
    
    const weaponNames = weaponIds.map(id => {
      const weapon = weapons.find(w => w.id === id);
      return weapon ? weapon.name : `Unknown Weapon (ID: ${id})`;
    });
    
    return weaponNames.join(', ');
  };

  // Render field with label and value - Enhanced design with compact width
  const renderField = (label: string, value: any) => {
    // Handle various empty states - always show field, never return null
    let displayValue = value;
    
    if (value === null || value === undefined || value === '' || value === 'N/A') {
      displayValue = 'Not Provided';
    } else if (Array.isArray(value)) {
      displayValue = value.length > 0 ? value.join(', ') : 'Not Provided';
    } else if (typeof value === 'boolean') {
      displayValue = value ? 'Yes' : 'No';
    }
    
    return (
      <div className="mb-3 p-2.5 bg-white rounded-md border border-gray-200 hover:border-blue-300 transition-colors duration-200 shadow-sm">
        <dt className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
          {label}
        </dt>
        <dd className={`text-sm leading-relaxed max-w-xs ${
          displayValue === 'Not Provided' 
            ? 'text-gray-400 italic' 
            : 'text-gray-800 font-medium'
        }`}>
          {displayValue}
        </dd>
      </div>
    );
  };

  // Render Application Overview section
  const renderApplicationOverview = () => {
    if (!applicationData) return null;

    return (
      <div className="mb-6 border-2 border-blue-200 rounded-lg p-5 bg-gradient-to-r from-blue-50 to-blue-100 shadow-sm">
        <h3 className="text-xl font-semibold text-blue-800 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
          Application Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Application ID</span>
            <div className="text-lg font-semibold text-gray-800 mt-1">{applicationData.id || 'N/A'}</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Acknowledgement No</span>
            <div className="text-lg font-semibold text-gray-800 mt-1">{applicationData.acknowledgementNo || 'Not Generated'}</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Workflow Status</span>
            <div className="text-lg font-semibold text-green-600 mt-1">
              {applicationData.workflowStatus?.status || 'In Progress'}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Application Status</span>
            <div className="text-lg font-semibold text-blue-600 mt-1">
              {applicationData.isSubmit ? 'Submitted' : 'Draft'}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Created Date</span>
            <div className="text-sm text-gray-800 mt-1 font-medium">{formatDate(applicationData.createdAt)}</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow duration-200">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Last Updated</span>
            <div className="text-sm text-gray-800 mt-1 font-medium">{formatDate(applicationData.updatedAt)}</div>
          </div>
        </div>
      </div>
    );
  };

  // Render Personal Information section
  const renderPersonalInfo = () => {
    if (!applicationData) return null;

    return (
      <div className="mb-6 border rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Personal Information
          </h3>
          <button
            onClick={() => handleEdit(FORM_ROUTES.PERSONAL_INFO)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors duration-200 text-sm font-medium"
            title="Edit Personal Information"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-700 border-b pb-2 mb-4">Basic Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {renderField('First Name', applicationData.firstName)}
              {renderField('Middle Name', applicationData.middleName)}
              {renderField('Last Name', applicationData.lastName)}
              {renderField('Parent/Spouse Name', applicationData.parentOrSpouseName)}
              {renderField('Gender', applicationData.sex)}
              {renderField('Filled By', applicationData.filledBy)}
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-700 border-b pb-2 mb-4">Birth & Identity Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

  // Render Address Details section
  const renderAddressDetails = () => {
    if (!applicationData) return null;

    const { presentAddress, permanentAddress, addresses } = applicationData;

    // If no presentAddress/permanentAddress, check addresses array
    let presentAddr = presentAddress;
    let permanentAddr = permanentAddress;

    if (addresses && addresses.length > 0) {
      presentAddr = presentAddr || addresses.find((addr: any) => addr.type === 'present') || addresses[0];
      permanentAddr = permanentAddr || addresses.find((addr: any) => addr.type === 'permanent') || addresses[1];
    }

    return (
      <div className="mb-6 border rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Address Details
          </h3>
          <button
            onClick={() => handleEdit(FORM_ROUTES.ADDRESS_DETAILS)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors duration-200 text-sm font-medium"
            title="Edit Address Details"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Present Address */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-700 border-b pb-2 mb-4">
              Present Address
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {renderField('Address Line', presentAddr?.addressLine)}
              {renderField('State', presentAddr?.state?.name || presentAddr?.state)}
              {renderField('District', presentAddr?.district?.name || presentAddr?.district)}
              {renderField('Zone', presentAddr?.zone?.name || presentAddr?.zone)}
              {renderField('Division', presentAddr?.division?.name || presentAddr?.division)}
              {renderField('Police Station', presentAddr?.policeStation?.name || presentAddr?.policeStation)}
              {renderField('Residing Since', formatDate(presentAddr?.sinceResiding))}
              {renderField('Office Phone', presentAddr?.telephoneOffice)}
              {renderField('Office Mobile', presentAddr?.officeMobileNumber)}
              {renderField('Alternative Mobile', presentAddr?.alternativeMobile)}
            </div>
          </div>

          {/* Permanent Address */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-700 border-b pb-2 mb-4">
              Permanent Address
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {renderField('Address Line', permanentAddr?.addressLine)}
              {renderField('State', permanentAddr?.state?.name || permanentAddr?.state)}
              {renderField('District', permanentAddr?.district?.name || permanentAddr?.district)}
              {renderField('Zone', permanentAddr?.zone?.name || permanentAddr?.zone)}
              {renderField('Division', permanentAddr?.division?.name || permanentAddr?.division)}
              {renderField('Police Station', permanentAddr?.policeStation?.name || permanentAddr?.policeStation)}
              {renderField('Office Phone', permanentAddr?.telephoneOffice)}
              {renderField('Office Mobile', permanentAddr?.officeMobileNumber)}
              {renderField('Alternative Mobile', permanentAddr?.alternativeMobile)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Occupation & Business section
  const renderOccupationBusiness = () => {
    if (!applicationData) return null;

    const occupation = applicationData.occupationAndBusiness;

    return (
      <div className="mb-6 border rounded-lg p-5 bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            Occupation & Business
          </h3>
          <button
            onClick={() => handleEdit(FORM_ROUTES.OCCUPATION_DETAILS)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-blue-50 transition-colors duration-200 text-sm font-medium"
            title="Edit Occupation & Business"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-700 border-b pb-2 mb-4">Professional Details</h4>
            <div className="grid grid-cols-1 gap-3">
              {renderField('Occupation', occupation?.occupation)}
              {renderField('Office Address', occupation?.officeAddress)}
              {renderField('State', occupation?.state?.name || occupation?.state)}
              {renderField('District', occupation?.district?.name || occupation?.district)}
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-700 border-b pb-2 mb-4">Agricultural Details</h4>
            <div className="grid grid-cols-1 gap-3">
              {renderField('Crop Location', occupation?.cropLocation)}
              {renderField('Area Under Cultivation', occupation?.areaUnderCultivation)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Criminal History section
  const renderCriminalHistory = () => {
    if (!applicationData) return null;

    const criminalHistories = applicationData.criminalHistories || [];

    return (
      <div className="mb-8 border rounded-lg p-6 bg-white shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Criminal History
          </h3>
          <button
            onClick={() => handleEdit(FORM_ROUTES.CRIMINAL_HISTORY)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 py-1 rounded-md hover:bg-blue-50"
            title="Edit Criminal History"
          >
            <span className="text-sm">Edit</span>
          </button>
        </div>
        
        {criminalHistories.length > 0 ? (
          <div className="space-y-6">
            {criminalHistories.map((history: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                <h5 className="font-semibold text-gray-800 mb-4">
                  Criminal History Entry {index + 1}
                </h5>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h6 className="font-medium text-gray-700 border-b pb-1">Legal Status</h6>
                    {renderField('Convicted', history.isConvicted)}
                    {renderField('Bond Executed', history.isBondExecuted)}
                    {renderField('Bond Date', formatDate(history.bondDate))}
                    {renderField('Bond Period', history.bondPeriod)}
                  </div>
                  
                  <div className="space-y-3">
                    <h6 className="font-medium text-gray-700 border-b pb-1">Prohibition Details</h6>
                    {renderField('Prohibited', history.isProhibited)}
                    {renderField('Prohibition Date', formatDate(history.prohibitionDate))}
                    {renderField('Prohibition Period', history.prohibitionPeriod)}
                  </div>
                </div>
                
                {/* FIR Details */}
                {history.firDetails && history.firDetails.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-gray-300">
                    <h6 className="font-medium text-gray-700 mb-3">
                      FIR Details
                    </h6>
                    <div className="grid gap-4">
                      {history.firDetails.map((fir: any, firIndex: number) => (
                        <div key={firIndex} className="bg-white rounded-lg p-4 border border-gray-200">
                          <span className="font-medium text-gray-600 mb-2 block">FIR {firIndex + 1}</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {renderField('FIR Number', fir.firNumber)}
                            {renderField('Under Section', fir.underSection)}
                            {renderField('Police Station', fir.policeStation)}
                            {renderField('Unit', fir.unit)}
                            {renderField('District', fir.District)}
                            {renderField('State', fir.state)}
                            {renderField('Offence', fir.offence)}
                            {renderField('Sentence', fir.sentence)}
                            {renderField('Date of Sentence', formatDate(fir.DateOfSentence))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-green-50 rounded-lg border border-green-200">
            <p className="text-green-700 font-medium">No criminal history records found</p>
            <p className="text-green-600 text-sm mt-1">This indicates a clean criminal record</p>
          </div>
        )}
      </div>
    );
  };

  // Render License History section
  const renderLicenseHistory = () => {
    if (!applicationData) return null;

    const licenseHistories = applicationData.licenseHistories || [];

    return (
      <div className="mb-8 border rounded-lg p-6 bg-white shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            License History
          </h3>
          <button
            onClick={() => handleEdit(FORM_ROUTES.LICENSE_HISTORY)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 py-1 rounded-md hover:bg-blue-50"
            title="Edit License History"
          >
            <span className="text-sm">Edit</span>
          </button>
        </div>
        
        {licenseHistories.length > 0 ? (
          <div className="space-y-6">
            {licenseHistories.map((history: any, index: number) => (
              <div key={index} className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                <h5 className="font-semibold text-gray-800 mb-4">
                  License History Entry {index + 1}
                </h5>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Previous Applications */}
                  <div className="space-y-3">
                    <h6 className="font-medium text-gray-700 border-b pb-1">Previous Applications</h6>
                    {renderField('Applied Before', history.hasAppliedBefore)}
                    {renderField('Date Applied For', formatDate(history.dateAppliedFor))}
                    {renderField('Previous Authority Name', history.previousAuthorityName)}
                    {renderField('Previous Result', history.previousResult)}
                  </div>
                  
                  {/* Suspension Details */}
                  <div className="space-y-3">
                    <h6 className="font-medium text-gray-700 border-b pb-1">Suspension Information</h6>
                    {renderField('License Suspended', history.hasLicenceSuspended)}
                    {renderField('Suspension Authority', history.suspensionAuthorityName)}
                    {renderField('Suspension Reason', history.suspensionReason)}
                  </div>
                </div>
                
                {/* Family License Information */}
                <div className="mt-6 pt-4 border-t border-gray-300">
                  <h6 className="font-medium text-gray-700 mb-3">
                    Family License Information
                  </h6>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      {renderField('Family Member Has License', history.hasFamilyLicence)}
                      {renderField('Family Member Name', history.familyMemberName)}
                      {renderField('Family License Number', history.familyLicenceNumber)}
                    </div>
                    <div className="space-y-3">
                      {renderField('Family Weapons Endorsed', history.familyWeaponsEndorsed?.join(', '))}
                    </div>
                  </div>
                </div>
                
                {/* Storage and Training */}
                <div className="mt-6 pt-4 border-t border-gray-300">
                  <h6 className="font-medium text-gray-700 mb-3">
                    Storage & Training Information
                  </h6>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      {renderField('Safe Place for Storage', history.hasSafePlace)}
                      {renderField('Safe Place Details', history.safePlaceDetails)}
                    </div>
                    <div className="space-y-3">
                      {renderField('Has Training', history.hasTraining)}
                      {renderField('Training Details', history.trainingDetails)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-blue-700 font-medium">No license history records found</p>
            <p className="text-blue-600 text-sm mt-1">This is the first license application</p>
          </div>
        )}
      </div>
    );
  };

  // Render License Details section
  const renderLicenseDetails = () => {
    if (!applicationData) return null;

    const licenseDetails = applicationData.licenseDetails || [];
    
    // Debug logging
    console.log('🔍 Debug License Details:', {
      applicationData,
      licenseDetails,
      licenseDetailsLength: licenseDetails.length,
      firstDetail: licenseDetails[0],
      firstDetailWeapons: licenseDetails[0]?.requestedWeapons,
      firstDetailWeaponIds: licenseDetails[0]?.requestedWeaponIds,
      weapons: weapons,
      weaponsLength: weapons.length
    });
    
    // Additional debugging for the license details structure
    console.log('🔍 RAW LICENSE DETAILS:', JSON.stringify(licenseDetails, null, 2));

    return (
      <div className="mb-8 border rounded-lg p-6 bg-white shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            License Details
          </h3>
          <button
            onClick={() => handleEdit(FORM_ROUTES.LICENSE_DETAILS)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 py-1 rounded-md hover:bg-blue-50"
            title="Edit License Details"
          >
            <span className="text-sm">Edit</span>
          </button>
        </div>
        
        {licenseDetails.length > 0 ? (
          <div className="space-y-6">
            {licenseDetails.map((detail: any, index: number) => {
              // Debug each license detail
              // Transform requestedWeapons to requestedWeaponIds if needed
              const requestedWeaponIds = detail.requestedWeaponIds || 
                (detail.requestedWeapons ? detail.requestedWeapons.map((weapon: any) => weapon.id) : []);
              
              console.log(`🔍 License Detail ${index}:`, {
                detail,
                originalRequestedWeaponIds: detail.requestedWeaponIds,
                requestedWeapons: detail.requestedWeapons,
                transformedWeaponIds: requestedWeaponIds,
                hasRequestedWeaponIds: !!requestedWeaponIds,
                requestedWeaponIdsLength: requestedWeaponIds?.length,
                typeOfRequestedWeaponIds: typeof requestedWeaponIds
              });
              
              return (
                <div key={index} className="border border-gray-200 rounded-lg p-5 bg-gray-50">
                  <h5 className="font-semibold text-gray-800 mb-4">
                    License Application Details {index + 1}
                  </h5>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Basic License Information */}
                  <div className="space-y-3">
                    <h6 className="font-medium text-gray-700 border-b pb-1">License Requirements</h6>
                    {renderField('Need for License', detail.needForLicense)}
                    {renderField('Arms Category', detail.armsCategory)}
                    {renderField('Area of Validity', detail.areaOfValidity)}
                    {renderField('License Place Area', detail.licencePlaceArea)}
                  </div>
                  
                  {/* Weapon and Ammunition Details */}
                  <div className="space-y-3">
                    <h6 className="font-medium text-gray-700 border-b pb-1">Weapon & Ammunition</h6>
                    
                    {/* Display weapon names with enhanced formatting */}
                    <div className="mb-3 p-2.5 bg-white rounded-md border border-gray-200 hover:border-blue-300 transition-colors duration-200 shadow-sm">
                      <dt className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                        Requested Weapons
                      </dt>
                      
                      <dd className="text-sm leading-relaxed max-w-xs">
                        {(() => {
                          console.log('🎯 WEAPON DEBUGGING:', {
                            requestedWeaponIds,
                            hasRequestedWeaponIds: !!requestedWeaponIds,
                            requestedWeaponIdsLength: requestedWeaponIds?.length,
                            requestedWeapons: detail.requestedWeapons,
                            weapons,
                            weaponsLength: weapons.length
                          });
                          
                          return requestedWeaponIds && requestedWeaponIds.length > 0 ? (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-1.5">
                                {requestedWeaponIds.map((weaponId: number, idx: number) => {
                                  // First try to find weapon in the weapons list from API
                                  let weapon = weapons.find(w => w.id === weaponId);
                                  
                                  // If not found in weapons list, try to get it from requestedWeapons directly
                                  if (!weapon && detail.requestedWeapons) {
                                    weapon = detail.requestedWeapons.find((w: any) => w.id === weaponId);
                                  }
                                  
                                  console.log(`🔍 Weapon ${weaponId}:`, {
                                    weaponId,
                                    foundInWeaponsList: weapons.find(w => w.id === weaponId),
                                    foundInRequestedWeapons: detail.requestedWeapons?.find((w: any) => w.id === weaponId),
                                    finalWeapon: weapon
                                  });
                                  
                                  return (
                                    <span 
                                      key={weaponId}
                                      className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-md border border-blue-200 font-medium"
                                    >
                                      {weapon ? weapon.name : `Unknown Weapon (ID: ${weaponId})`}
                                    </span>
                                  );
                                })}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Total: {requestedWeaponIds.length} weapon{requestedWeaponIds.length !== 1 ? 's' : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No weapons selected</span>
                          );
                        })()}
                      </dd>
                    </div>
                    
                    {renderField('Ammunition Description', detail.ammunitionDescription)}
                    {renderField('Wild Beasts Specification', detail.wildBeastsSpecification)}
                  </div>
                </div>
                
                {/* Special Considerations */}
                {detail.specialConsiderationReason && (
                  <div className="mt-6 pt-4 border-t border-gray-300">
                    <h6 className="font-medium text-gray-700 mb-3">
                      Special Considerations
                    </h6>
                    {renderField('Special Consideration Reason', detail.specialConsiderationReason)}
                  </div>
                )}
              </div>
            );
            })}
          </div>
        ) : (
          <div className="text-center py-8 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-amber-700 font-medium">No license details found</p>
            <p className="text-amber-600 text-sm mt-1">License details are required for application completion</p>
          </div>
        )}
      </div>
    );
  };

  // Render Biometric Information section
  const renderBiometricInfo = () => {
    return (
      <div className="mb-8 border rounded-lg p-6 bg-white shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Biometric Information
          </h3>
          <button
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 py-1 rounded-md hover:bg-blue-50"
            title="Biometric Information"
          >
            <span className="text-sm">Edit</span>
          </button>
        </div>
        <div className="text-center py-8 bg-purple-50 rounded-lg border border-purple-200">
          <p className="text-purple-700 font-medium">Biometric Information Collection</p>
          <p className="text-purple-600 text-sm mt-1">
            Fingerprints and photographs will be collected during your appointment
          </p>
        </div>
      </div>
    );
  };

  // Render Upload Documents section
  const renderUploadDocuments = () => {
    if (!applicationData) return null;

    const fileUploads = applicationData.fileUploads || [];

    // Helper function to get file size in readable format
    const formatFileSize = (bytes: number) => {
      if (!bytes) return 'Unknown';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Helper function to get file extension icon - returns text instead of emoji
    const getFileIcon = (fileName: string) => {
      if (!fileName) return 'File';
      const extension = fileName.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'pdf': return 'PDF';
        case 'doc':
        case 'docx': return 'Document';
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif': return 'Image';
        case 'xls':
        case 'xlsx': return 'Spreadsheet';
        case 'txt': return 'Text';
        default: return 'File';
      }
    };

    return (
      <div className="mb-8 border rounded-lg p-6 bg-white shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">
            Document Upload
          </h3>
          <button
            onClick={() => handleEdit(FORM_ROUTES.DOCUMENTS_UPLOAD)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2 px-3 py-1 rounded-md hover:bg-blue-50"
            title="Upload Documents"
          >
            <span className="text-sm">Edit</span>
          </button>
        </div>

        {fileUploads.length > 0 ? (
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-700 border-b pb-2">
              Uploaded Documents ({fileUploads.length})
            </h4>
            
            <div className="grid gap-4">
              {fileUploads.map((file: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      <span className="text-sm font-medium text-gray-600 bg-white px-2 py-1 rounded">
                        {getFileIcon(file.fileType)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium text-gray-900 truncate">
                          {file.fileType || 'Unknown Document Type'}
                        </h5>
                        
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          {renderField('File Type', file.fileType)}
                          <div className="mb-3 p-2.5 bg-white rounded-md border border-gray-200 hover:border-blue-300 transition-colors duration-200 shadow-sm">
                            <dt className="text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
                              File Name
                            </dt>
                            <dd className="text-sm leading-relaxed max-w-xs text-gray-800 font-medium">
                              {file.fileName ? (
                                <a 
                                  href={file.fileUrl && (file.fileUrl.startsWith('http') || file.fileUrl.startsWith('data:')) ? file.fileUrl : `https://${file.fileUrl || '#'}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline hover:no-underline transition-colors duration-200 break-words cursor-pointer"
                                  title="Click to open file - if file doesn't open, the URL may be invalid or require authentication"
                                  onClick={(e) => {
                                    // Handle different URL types properly
                                    if (file.fileUrl) {
                                      try {
                                        if (file.fileUrl.startsWith('data:')) {
                                          // For data URLs, open directly
                                          window.open(file.fileUrl, '_blank');
                                        } else if (file.fileUrl.startsWith('http')) {
                                          // For HTTP URLs, open directly
                                          window.open(file.fileUrl, '_blank');
                                        } else {
                                          // For other URLs, prepend https://
                                          window.open(`https://${file.fileUrl}`, '_blank');
                                        }
                                      } catch (error) {
                                        console.error('Error opening file:', error);
                                        alert('Unable to open file. The URL may be invalid or the file may require special access.');
                                      }
                                    }
                                  }}
                                >
                                  {file.fileName.length > 30 ? file.fileName.substring(0, 30) + '...' : file.fileName}
                                </a>
                              ) : (
                                <span className="text-gray-400 italic">Not Available</span>
                              )}
                            </dd>
                          </div>
                        </div>
                      </div>
                    </div>


                  </div>
                </div>
              ))}
            </div>
            
            {/* Summary */}
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <span className="text-green-700 font-medium">
                  {fileUploads.length} document{fileUploads.length !== 1 ? 's' : ''} uploaded successfully
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 bg-amber-50 rounded-lg border border-amber-200">
            <p className="text-amber-700 font-medium">No Documents Uploaded</p>
            <p className="text-amber-600 text-sm mt-1">
              Upload required documents to support your application
            </p>
            <button
              onClick={() => handleEdit(FORM_ROUTES.DOCUMENTS_UPLOAD)}
              className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Upload Documents
            </button>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="fixed top-24 left-0 right-0 bottom-24 z-30 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed top-24 left-0 right-0 bottom-24 z-30 flex justify-center items-center">
        <div className="max-w-md mx-auto p-8 bg-white rounded-xl shadow text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Error</h2>
          <p className="mb-4 text-gray-700">{error}</p>
          <button
            onClick={() => router.push(FORM_ROUTES.PERSONAL_INFO)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go to Personal Information
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 min-h-screen">
      <div className="w-full h-full overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold mb-2 text-gray-800">Application Preview</h2>
            <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full mb-4"></div>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Please review all your information before submitting the application. You can edit any section by clicking the Edit button.
            </p>
          </div>
          
          {renderApplicationOverview()}
          {renderPersonalInfo()}
          {renderAddressDetails()}
          {renderOccupationBusiness()}
          {renderCriminalHistory()}
          {renderLicenseHistory()}
          {renderLicenseDetails()}
          {renderBiometricInfo()}
          {renderUploadDocuments()}
        </div>
      
      <FormFooter 
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    </div>
    </div>
  );
};

export default Preview;