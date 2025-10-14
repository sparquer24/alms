"use client";
import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from 'next/navigation';
import { ApplicationService } from '../../../api/applicationService';
import { locationAPI } from '../../../api/locationApi';
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
  const [locationNames, setLocationNames] = useState<Record<string, string>>({});

  // Get applicationId or acknowledgementNo from URL params or localStorage
  const applicationId = searchParams?.get('applicationId') || 
                        searchParams?.get('id') || 
                        localStorage.getItem('applicationId');
  const acknowledgementNo = searchParams?.get('acknowledgementNo') || 
                            localStorage.getItem('acknowledgementNo');

  // Navigation handlers
  const handleNext = () => {
    const idToUse = applicationId || acknowledgementNo;
    if (idToUse) {
      console.log('✅ Navigating to Declaration with ID:', idToUse);
      router.push(`${FORM_ROUTES.DECLARATION}?id=${idToUse}`);
    } else {
      console.log('❌ No application ID found, navigating to Declaration without ID');
      router.push(FORM_ROUTES.DECLARATION);
    }
  };

  const handlePrevious = () => {
    const idToUse = applicationId || acknowledgementNo;
    if (idToUse) {
      router.push(`${FORM_ROUTES.DOCUMENTS_UPLOAD}?id=${idToUse}`);
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
        const response = await ApplicationService.getApplication(idToFetch);
        
        console.log('🟢 Application data fetched:', response);
        
        // Check if response indicates failure
        if (response && response.success === false) {
          const errorMsg = response.details?.response?.error || 
                          response.details?.response?.message || 
                          response.error || 
                          'Failed to load application data.';
          setError(errorMsg);
          setLoading(false);
          return;
        }
        
        setApplicationData(response);

        // Fetch location names for IDs
        await fetchLocationNames(response);

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
  }, [applicationId, acknowledgementNo]);

  // Fetch location names for all IDs in the application
  const fetchLocationNames = async (data: any) => {
    const names: Record<string, string> = {};

    try {
      // Present Address
      if (data.presentAddress) {
        const { stateId, districtId, zoneId, divisionId, policeStationId } = data.presentAddress;
        
        if (stateId) {
          const state = await locationAPI.getStateById(stateId);
          names[`presentState_${stateId}`] = state.name;
        }
        if (districtId) {
          const district = await locationAPI.getDistrictById(districtId);
          names[`presentDistrict_${districtId}`] = district.name;
        }
        if (zoneId) {
          const zone = await locationAPI.getZoneById(zoneId);
          names[`presentZone_${zoneId}`] = zone.name;
        }
        if (divisionId) {
          const division = await locationAPI.getDivisionById(divisionId);
          names[`presentDivision_${divisionId}`] = division.name;
        }
        if (policeStationId) {
          const policeStation = await locationAPI.getPoliceStationById(policeStationId);
          names[`presentPoliceStation_${policeStationId}`] = policeStation.name;
        }
      }

      // Permanent Address
      if (data.permanentAddress) {
        const { stateId, districtId, zoneId, divisionId, policeStationId } = data.permanentAddress;
        
        if (stateId) {
          const state = await locationAPI.getStateById(stateId);
          names[`permanentState_${stateId}`] = state.name;
        }
        if (districtId) {
          const district = await locationAPI.getDistrictById(districtId);
          names[`permanentDistrict_${districtId}`] = district.name;
        }
        if (zoneId) {
          const zone = await locationAPI.getZoneById(zoneId);
          names[`permanentZone_${zoneId}`] = zone.name;
        }
        if (divisionId) {
          const division = await locationAPI.getDivisionById(divisionId);
          names[`permanentDivision_${divisionId}`] = division.name;
        }
        if (policeStationId) {
          const policeStation = await locationAPI.getPoliceStationById(policeStationId);
          names[`permanentPoliceStation_${policeStationId}`] = policeStation.name;
        }
      }

      // Occupation Address
      if (data.occupationAndBusiness) {
        const { stateId, districtId } = data.occupationAndBusiness;
        
        if (stateId) {
          const state = await locationAPI.getStateById(stateId);
          names[`officeState_${stateId}`] = state.name;
        }
        if (districtId) {
          const district = await locationAPI.getDistrictById(districtId);
          names[`officeDistrict_${districtId}`] = district.name;
        }
      }

      setLocationNames(names);
    } catch (err) {
      console.error('❌ Error fetching location names:', err);
    }
  };

  // Navigate to specific section for editing
  const handleEdit = (route: string) => {
    router.push(`${route}?applicationId=${applicationId || acknowledgementNo}`);
  };

  // Format date for display
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  // Render field with label and value
  const renderField = (label: string, value: any) => {
    if (value === null || value === undefined || value === '') return null;
    
    return (
      <div className="mb-3">
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value}</dd>
      </div>
    );
  };

  // Render Personal Information section
  const renderPersonalInfo = () => {
    if (!applicationData) return null;

    return (
      <div className="mb-8 border rounded-lg p-6 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Personal Information</h3>
          <button
            onClick={() => handleEdit(FORM_ROUTES.PERSONAL_INFO)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            title="Edit Personal Information"
          >
            <span>✏️</span>
            <span className="text-sm">Edit</span>
          </button>
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('Acknowledgement No', applicationData.acknowledgementNo)}
          {renderField('First Name', applicationData.firstName)}
          {renderField('Middle Name', applicationData.middleName)}
          {renderField('Last Name', applicationData.lastName)}
          {renderField('Filled By', applicationData.filledBy)}
          {renderField('Parent/Spouse Name', applicationData.parentOrSpouseName)}
          {renderField('Sex', applicationData.sex)}
          {renderField('Place of Birth', applicationData.placeOfBirth)}
          {renderField('Date of Birth', formatDate(applicationData.dateOfBirth))}
          {renderField('DOB in Words', applicationData.dobInWords)}
          {renderField('Aadhar Number', applicationData.aadharNumber)}
          {renderField('PAN Number', applicationData.panNumber)}
        </dl>
      </div>
    );
  };

  // Render Address Details section
  const renderAddressDetails = () => {
    if (!applicationData) return null;

    const { presentAddress, permanentAddress } = applicationData;

    return (
      <div className="mb-8 border rounded-lg p-6 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Address Details</h3>
          <button
            onClick={() => handleEdit(FORM_ROUTES.ADDRESS_DETAILS)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            title="Edit Address Details"
          >
            <span>✏️</span>
            <span className="text-sm">Edit</span>
          </button>
        </div>

        {/* Present Address */}
        {presentAddress && (
          <div className="mb-6">
            <h4 className="text-lg font-medium text-gray-700 mb-3">Present Address</h4>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Address', presentAddress.addressLine)}
              {renderField('State', locationNames[`presentState_${presentAddress.stateId}`] || presentAddress.stateId)}
              {renderField('District', locationNames[`presentDistrict_${presentAddress.districtId}`] || presentAddress.districtId)}
              {renderField('Zone', locationNames[`presentZone_${presentAddress.zoneId}`] || presentAddress.zoneId)}
              {renderField('Division', locationNames[`presentDivision_${presentAddress.divisionId}`] || presentAddress.divisionId)}
              {renderField('Police Station', locationNames[`presentPoliceStation_${presentAddress.policeStationId}`] || presentAddress.policeStationId)}
              {renderField('Residing Since', formatDate(presentAddress.sinceResiding))}
              {renderField('Office Phone', presentAddress.telephoneOffice)}
              {renderField('Office Mobile', presentAddress.officeMobileNumber)}
              {renderField('Alternative Mobile', presentAddress.alternativeMobile)}
            </dl>
          </div>
        )}

        {/* Permanent Address */}
        {permanentAddress && (
          <div>
            <h4 className="text-lg font-medium text-gray-700 mb-3">Permanent Address</h4>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Address', permanentAddress.addressLine)}
              {renderField('State', locationNames[`permanentState_${permanentAddress.stateId}`] || permanentAddress.stateId)}
              {renderField('District', locationNames[`permanentDistrict_${permanentAddress.districtId}`] || permanentAddress.districtId)}
              {renderField('Zone', locationNames[`permanentZone_${permanentAddress.zoneId}`] || permanentAddress.zoneId)}
              {renderField('Division', locationNames[`permanentDivision_${permanentAddress.divisionId}`] || permanentAddress.divisionId)}
              {renderField('Police Station', locationNames[`permanentPoliceStation_${permanentAddress.policeStationId}`] || permanentAddress.policeStationId)}
              {renderField('Office Phone', permanentAddress.telephoneOffice)}
              {renderField('Office Mobile', permanentAddress.officeMobileNumber)}
            </dl>
          </div>
        )}
      </div>
    );
  };

  // Render Occupation & Business section
  const renderOccupationBusiness = () => {
    if (!applicationData || !applicationData.occupationAndBusiness) return null;

    const occupation = applicationData.occupationAndBusiness;

    return (
      <div className="mb-8 border rounded-lg p-6 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Occupation & Business</h3>
          <button
            onClick={() => handleEdit(FORM_ROUTES.OCCUPATION_DETAILS)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            title="Edit Occupation & Business"
          >
            <span>✏️</span>
            <span className="text-sm">Edit</span>
          </button>
        </div>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderField('Occupation', occupation.occupation)}
          {renderField('Office Address', occupation.officeAddress)}
          {renderField('State', locationNames[`officeState_${occupation.stateId}`] || occupation.stateId)}
          {renderField('District', locationNames[`officeDistrict_${occupation.districtId}`] || occupation.districtId)}
          {renderField('Crop Location', occupation.cropLocation)}
          {renderField('Area Under Cultivation', occupation.areaUnderCultivation)}
        </dl>
      </div>
    );
  };

  // Render Criminal History section
  const renderCriminalHistory = () => {
    if (!applicationData || !applicationData.criminalHistories || applicationData.criminalHistories.length === 0) return null;

    return (
      <div className="mb-8 border rounded-lg p-6 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">Criminal History</h3>
          <button
            onClick={() => handleEdit(FORM_ROUTES.CRIMINAL_HISTORY)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            title="Edit Criminal History"
          >
            <span>✏️</span>
            <span className="text-sm">Edit</span>
          </button>
        </div>
        {applicationData.criminalHistories.map((history: any, index: number) => (
          <div key={index} className="mb-4">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Convicted', history.isConvicted ? 'Yes' : 'No')}
              {history.isConvicted && renderField('Conviction Details', history.convictionDetails)}
              {renderField('Bond Executed', history.isBondExecuted ? 'Yes' : 'No')}
              {history.isBondExecuted && renderField('Bond Details', history.bondDetails)}
              {renderField('Prohibited', history.isProhibited ? 'Yes' : 'No')}
              {history.isProhibited && renderField('Prohibition Details', history.prohibitionDetails)}
            </dl>
          </div>
        ))}
      </div>
    );
  };

  // Render License History section
  const renderLicenseHistory = () => {
    if (!applicationData || !applicationData.licenseHistories || applicationData.licenseHistories.length === 0) return null;

    return (
      <div className="mb-8 border rounded-lg p-6 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">License History</h3>
          <button
            onClick={() => handleEdit(FORM_ROUTES.LICENSE_HISTORY)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            title="Edit License History"
          >
            <span>✏️</span>
            <span className="text-sm">Edit</span>
          </button>
        </div>
        {applicationData.licenseHistories.map((history: any, index: number) => (
          <div key={index} className="mb-4">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Applied Before', history.hasAppliedBefore ? 'Yes' : 'No')}
              {history.hasAppliedBefore && renderField('Application Details', history.applicationDetails)}
              {renderField('License Suspended', history.hasLicenceSuspended ? 'Yes' : 'No')}
              {history.hasLicenceSuspended && renderField('Suspension Details', history.suspensionDetails)}
              {renderField('Family Member Has License', history.hasFamilyLicence ? 'Yes' : 'No')}
              {history.hasFamilyLicence && renderField('Family License Details', history.familyLicenceDetails)}
              {renderField('Safe Place for Storage', history.hasSafePlace ? 'Yes' : 'No')}
              {history.hasSafePlace && renderField('Safe Place Details', history.safePlaceDetails)}
              {renderField('Has Training', history.hasTraining ? 'Yes' : 'No')}
              {history.hasTraining && renderField('Training Details', history.trainingDetails)}
            </dl>
          </div>
        ))}
      </div>
    );
  };

  // Render License Details section
  const renderLicenseDetails = () => {
    if (!applicationData || !applicationData.licenseDetails || applicationData.licenseDetails.length === 0) return null;

    return (
      <div className="mb-8 border rounded-lg p-6 bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold text-gray-800">License Details</h3>
          <button
            onClick={() => handleEdit(FORM_ROUTES.LICENSE_DETAILS)}
            className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
            title="Edit License Details"
          >
            <span>✏️</span>
            <span className="text-sm">Edit</span>
          </button>
        </div>
        {applicationData.licenseDetails.map((detail: any, index: number) => (
          <div key={index} className="mb-4">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderField('Need for License', detail.needForLicense)}
              {renderField('Arms Category', detail.armsCategory)}
              {renderField('Requested Weapon IDs', detail.requestedWeaponIds?.join(', '))}
              {renderField('Area of Validity', detail.areaOfValidity)}
              {renderField('Ammunition Description', detail.ammunitionDescription)}
              {renderField('Special Consideration', detail.specialConsiderationReason)}
              {renderField('License Place Area', detail.licencePlaceArea)}
              {renderField('Wild Beasts Specification', detail.wildBeastsSpecification)}
            </dl>
          </div>
        ))}
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
    <div className="fixed top-24 left-0 right-0 bottom-24 z-30 flex justify-center items-start overflow-hidden">
      <div className="max-w-6xl w-full h-full bg-white rounded-xl shadow p-10 overflow-y-auto scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100">
        <h2 className="text-2xl font-bold mb-2">Application Preview</h2>
        
        {/* Display Application ID if available */}
        {(applicationId || acknowledgementNo) && (
          <div className="mb-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
            <strong>Application ID: {applicationId || acknowledgementNo}</strong>
          </div>
        )}
        
        <p className="mb-8 text-gray-600">
          Please review all your information before submitting the application.
        </p>
        
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
  );
};

export default Preview;
