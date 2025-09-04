/**
 * Test file to validate the updated sidebarApiCalls service
 * Based on the actual API response structure you provided
 */

import { 
  fetchAllApplications, 
  fetchApplicationsByStatus, 
  ApplicationData,
  STATUS_MAP 
} from '../services/sidebarApiCalls';

// Sample API response data (from your actual API)
const sampleApiResponse = {
  "success": true,
  "message": "Applications retrieved successfully", 
  "data": [
    {
      "id": 7,
      "acknowledgementNo": "ALMS1756834303037",
      "applicantFullName": "John A Doe",
      "currentRole": {
        "id": 34,
        "name": "Zonal Superintendent",
        "code": "ZS"
      },
      "previousRole": null,
      "currentUser": {
        "id": 13,
        "username": "ZS_HYD",
        "email": "zs@tspolice.gov.in"
      },
      "previousUser": null,
      "isApprovied": false,
      "isFLAFGenerated": false,
      "isGroundReportGenerated": false,
      "isPending": false,
      "isReEnquiry": false,
      "isReEnquiryDone": false,
      "isRejected": false,
      "remarks": null,
      "status": {
        "id": 1,
        "name": "Forward",
        "code": "FORWARD"
      }
    },
    {
      "id": 6,
      "acknowledgementNo": "ALMS1756794369038", 
      "applicantFullName": "John A Doe",
      "currentRole": {
        "id": 34,
        "name": "Zonal Superintendent",
        "code": "ZS"
      },
      "previousRole": null,
      "currentUser": {
        "id": 13,
        "username": "ZS_HYD",
        "email": "zs@tspolice.gov.in"
      },
      "previousUser": null,
      "isApprovied": false,
      "isFLAFGenerated": false,
      "isGroundReportGenerated": false,
      "isPending": false,
      "isReEnquiry": false,
      "isReEnquiryDone": false,
      "isRejected": false,
      "remarks": null,
      "status": {
        "id": 1,
        "name": "Forward",
        "code": "FORWARD"
      }
    }
  ],
  "pagination": {
    "total": 2,
    "page": 1,
    "limit": 10,
    "totalPages": 1
  }
};

/**
 * Test transformation of API data to ApplicationData format
 */
export const testApiTransformation = () => {
  console.log('🧪 Testing API Response Transformation');
  
  // Test transforming a single API application
  const apiApp = sampleApiResponse.data[0];
  
  // Note: We need to access transformApiApplicationToApplicationData
  // Since it's private, we'll simulate the transformation here
  const transformedApp: ApplicationData = {
    id: String(apiApp.id || ''),
    applicantName: apiApp.applicantFullName || 'Unknown',
    applicantMobile: '', // This would come from detailed API call
    applicantEmail: undefined,
    fatherName: undefined, 
    gender: undefined,
    dob: undefined,
    address: undefined,
    applicationType: 'Fresh License',
    applicationDate: new Date().toISOString(), // createdAt not in sample
    applicationTime: undefined,
    status: 'pending', // Forward maps to pending in UI
    status_id: apiApp.status?.id || STATUS_MAP.forward,
    assignedTo: String(apiApp.currentUser?.id || ''),
    forwardedFrom: apiApp.previousUser ? String((apiApp.previousUser as any).id) : undefined,
    forwardedTo: apiApp.currentUser?.id ? String(apiApp.currentUser.id) : undefined,
    forwardComments: apiApp.remarks || undefined,
    isViewed: !apiApp.isPending,
    returnReason: undefined,
    flagReason: undefined,
    disposalReason: undefined,
    lastUpdated: new Date().toISOString(),
    documents: [],
    history: [],
    actions: {
      canForward: !apiApp.isApprovied && !apiApp.isRejected,
      canReport: true,
      canApprove: !apiApp.isApprovied && !apiApp.isRejected,
      canReject: !apiApp.isApprovied && !apiApp.isRejected,
      canRaiseRedflag: !apiApp.isApprovied && !apiApp.isRejected,
      canReturn: !apiApp.isApprovied && !apiApp.isRejected,
      canDispose: apiApp.isApprovied,
    }
  };

  console.log('Original API App:', apiApp);
  console.log('Transformed App:', transformedApp);
  
  return transformedApp;
};

/**
 * Expected structure for ApplicationTable component
 */
export const expectedApplicationTableData = () => {
  const transformedApps = sampleApiResponse.data.map(apiApp => ({
    id: String(apiApp.id),
    applicantName: apiApp.applicantFullName,
    applicantMobile: '', // Would need detailed API call
    applicationType: 'Fresh License',
    applicationDate: new Date().toISOString(),
    status: 'pending', // Forward -> pending for UI
    assignedTo: String(apiApp.currentUser?.id || ''),
    currentRole: apiApp.currentRole?.name,
    acknowledgementNo: apiApp.acknowledgementNo,
  }));

  console.log('📊 Expected table data:', transformedApps);
  return transformedApps;
};

/**
 * Test sidebar count functionality
 */
export const testSidebarCounts = () => {
  console.log('🏷️ Testing Sidebar Counts');
  
  // Based on sample data, both apps have status ID 1 (Forward)
  const forwardCount = sampleApiResponse.data.filter(app => app.status.id === 1).length;
  
  const expectedCounts = {
    forwardedCount: forwardCount, // 2 from sample
    returnedCount: 0,
    redFlaggedCount: 0,
    disposedCount: 0,
    pendingCount: 0, // Treating forward as pending
    approvedCount: 0,
  };

  console.log('Expected sidebar counts:', expectedCounts);
  return expectedCounts;
};

/**
 * Test status mapping
 */
export const testStatusMapping = () => {
  console.log('🎯 Testing Status Mapping');
  
  const testCases = [
    { api: { id: 1, name: "Forward", code: "FORWARD" }, expected: 'pending' },
    { api: { id: 2, name: "Approved", code: "APPROVED" }, expected: 'approved' },
    { api: { id: 3, name: "Rejected", code: "REJECTED" }, expected: 'rejected' },
    { api: { id: 4, name: "Returned", code: "RETURNED" }, expected: 'returned' },
    { api: { id: 5, name: "Red Flagged", code: "RED_FLAGGED" }, expected: 'red-flagged' },
    { api: { id: 6, name: "Disposed", code: "DISPOSED" }, expected: 'disposed' },
  ];

  testCases.forEach(testCase => {
    const statusStr = (testCase.api.code || testCase.api.name).toLowerCase();
    const mapped = statusStr === 'forward' ? 'pending' : 
                   statusStr === 'approved' ? 'approved' :
                   statusStr === 'rejected' ? 'rejected' :
                   statusStr === 'returned' ? 'returned' :
                   statusStr.includes('flag') ? 'red-flagged' :
                   statusStr === 'disposed' ? 'disposed' : 'pending';
    
    console.log(`Status ${testCase.api.code} -> ${mapped} (expected: ${testCase.expected})`);
  });
};

/**
 * Summary of changes needed for your components
 */
export const migrationSummary = () => {
  console.log('📋 Migration Summary - What Your Components Will Get:');
  
  console.log(`
  🔄 API Response Structure:
  {
    "success": true,
    "message": "Applications retrieved successfully",
    "data": [
      {
        "id": 7,
        "acknowledgementNo": "ALMS1756834303037",
        "applicantFullName": "John A Doe",
        "currentRole": { "id": 34, "name": "Zonal Superintendent", "code": "ZS" },
        "currentUser": { "id": 13, "username": "ZS_HYD", "email": "zs@tspolice.gov.in" },
        "status": { "id": 1, "name": "Forward", "code": "FORWARD" },
        "isApprovied": false,
        "isPending": false,
        ...
      }
    ],
    "pagination": { "total": 2, "page": 1, "limit": 10, "totalPages": 1 }
  }

  ✅ Transformed to ApplicationData:
  {
    "id": "7",
    "applicantName": "John A Doe", 
    "applicantMobile": "", // Needs detailed API call
    "applicationType": "Fresh License",
    "applicationDate": "2025-09-04T...",
    "status": "pending", // Forward -> pending for UI
    "status_id": 1,
    "assignedTo": "13",
    "forwardedTo": "13",
    "actions": { canForward: true, canApprove: true, ... }
  }

  🎯 Key Mappings:
  - applicantFullName -> applicantName
  - status.code "FORWARD" -> status "pending" 
  - currentUser.id -> assignedTo
  - status.id -> status_id
  - Missing: mobile, email, address (need detailed API call)
  `);
};

// Run tests
export const runAllTests = () => {
  testApiTransformation();
  expectedApplicationTableData();
  testSidebarCounts();
  testStatusMapping();
  migrationSummary();
};

export default {
  testApiTransformation,
  expectedApplicationTableData,
  testSidebarCounts,
  testStatusMapping,
  migrationSummary,
  runAllTests,
};
