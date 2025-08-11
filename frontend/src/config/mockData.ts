// Status mapping for numeric status_id
export const STATUS_MAP = {
  pending: 1,        // Pending (fresh, not forwarded)
  sent: 2,           // Sent/Forwarded
  returned: 3,       // Returned
  flagged: 4,        // Red-flagged
  disposed: 5,       // Disposed/Closed/Rejected
  approved: 6        // Approved/Final Disposal
};

// Mock data for arms license applications
export interface ApplicationData {
  id: string;
  applicantName: string;
  applicantMobile: string;
  applicantEmail?: string;
  fatherName?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  address?: string;
  applicationType: string;
  applicationDate: string;
  applicationTime?: string;
  status: 'pending' | 'approved' | 'rejected' | 'returned' | 'red-flagged' | 'disposed' | 'initiated';
  status_id: number; // Now required and numeric
  assignedTo: string;
  forwardedFrom?: string;
  forwardedTo?: string;
  forwardComments?: string; // Comments when forwarding an application
  isViewed?: boolean;  // Track if the application has been viewed by the forwarded user
  returnReason?: string;
  flagReason?: string;
  disposalReason?: string;
  lastUpdated: string;
  documents?: Array<{
    name: string;
    type: string;
    url: string;
  }>;
  history?: Array<{
    date: string;
    time: string;
    action: string;
    by: string;
    comments?: string;
  }>;
  actions?: {
    canForward: boolean;
    canReport: boolean;
    canApprove: boolean;
    canReject: boolean;
    canRaiseRedflag: boolean;
    canReturn: boolean;
    canDispose: boolean;
  };
}

export const mockApplications: ApplicationData[] = [
  {
    id: 'AL-2025-001',
    applicantName: 'Rahul Sharma',
    applicantMobile: '9876543210',
    applicantEmail: 'rahul.sharma@gmail.com',
    fatherName: 'Keshav Prasad Sharma',
    gender: 'Male',
    dob: '15/08/1985',
    address: '123, Sector 7, Dwarka, New Delhi - 110075',
    applicationType: 'New License',
    applicationDate: '2025-05-01',
    applicationTime: '10:15 AM',
    status: 'pending',
    status_id: STATUS_MAP.pending,
    assignedTo: 'DCP',
    forwardedFrom: 'SHO',
    lastUpdated: '2025-06-01',
    actions: {
      canForward: true,
      canReport: true,
      canApprove: true,
      canReject: true,
      canRaiseRedflag: true,
      canReturn: true,
      canDispose: false
    },
    documents: [
      {
        name: 'Aadhaar Card',
        type: 'pdf',
        url: '/documents/aadhaar.pdf'
      },
      {
        name: 'Passport Photo',
        type: 'image',
        url: '/documents/photo.jpg'
      },
      {
        name: 'Proof of Address',
        type: 'pdf',
        url: '/documents/address_proof.pdf'
      },
      {
        name: 'Character Certificate',
        type: 'pdf',
        url: '/documents/character_certificate.pdf'
      }
    ],
    history: [
      {
        date: '2025-05-01',
        time: '10:15 AM',
        action: 'Application Submitted',
        by: 'Applicant'
      },
      {
        date: '2025-05-15',
        time: '11:30 AM',
        action: 'Forwarded to DCP',
        by: 'SHO',
        comments: 'All documents verified'
      }
    ]
  },
  {
    id: 'AL-2025-002',
    applicantName: 'Priya Singh',
    applicantMobile: '8765432109',
    applicationType: 'Renewal',
    applicationDate: '2025-05-03',
    status: 'approved',
    status_id: STATUS_MAP.sent,
    assignedTo: 'CP',
    forwardedFrom: 'DCP',
    lastUpdated: '2025-06-05',
    actions: {
      canForward: false,
      canReport: true,
      canApprove: false,
      canReject: false,
      canRaiseRedflag: false,
      canReturn: false,
      canDispose: false
    }
  },
  {
    id: 'AL-2025-003',
    applicantName: 'Amit Kumar',
    applicantMobile: '7654321098',
    applicationType: 'New License',
    applicationDate: '2025-05-05',
    status: 'returned',
    status_id: STATUS_MAP.returned,
    assignedTo: 'SHO',
    actions: {
      canForward: false,
      canReport: true,
      canApprove: false,
      canReject: false,
      canRaiseRedflag: true,
      canReturn: false,
      canDispose: true
    },
    forwardedFrom: 'ACP',
    returnReason: 'Incomplete documentation',
    lastUpdated: '2025-06-02'
  },
  {
    id: 'AL-2025-004',
    applicantName: 'Neha Gupta',
    applicantMobile: '6543210987',
    applicationType: 'Transfer',
    applicationDate: '2025-05-07',
    status: 'red-flagged',
    status_id: STATUS_MAP.flagged,
    assignedTo: 'ACP',
    forwardedFrom: 'SHO',
    flagReason: 'Criminal record found',
    lastUpdated: '2025-06-03',
    actions: {
      canForward: false,
      canReport: true,
      canApprove: false,
      canReject: true,
      canRaiseRedflag: false,
      canReturn: false,
      canDispose: true
    }
  },
  {
    id: 'AL-2025-005',
    applicantName: 'Rajesh Verma',
    actions: {
      canForward: true,
      canReport: true,
      canApprove: true,
      canReject: true,
      canRaiseRedflag: true,
      canReturn: true,
      canDispose: false
    },
    applicantMobile: '5432109876',
    applicationType: 'New License',
    applicationDate: '2025-05-10',
    status: 'disposed',
    status_id: STATUS_MAP.disposed,
    assignedTo: 'DCP',
    disposalReason: 'Application withdrawn by applicant',
    lastUpdated: '2025-06-08'
  },
  {
    id: 'AL-2025-006',
    applicantName: 'Sunita Patel',
    applicantMobile: '4321098765',
    applicationType: 'Renewal',
    applicationDate: '2025-05-12',
    status: 'rejected',
    status_id: STATUS_MAP.disposed,
    assignedTo: 'CP',
    forwardedFrom: 'DCP',
    lastUpdated: '2025-06-09',
    actions: {
      canForward: false,
      canReport: true,
      canApprove: false,
      canReject: false,
      canRaiseRedflag: false,
      canReturn: false,
      canDispose: false
    }
  },
  {
    id: 'AL-2025-007',
    applicantName: 'Vikram Malhotra',
    applicantMobile: '3210987654',
    applicationType: 'New License',
    applicationDate: '2025-05-15',
    status: 'pending',
    status_id: STATUS_MAP.pending,
    assignedTo: 'SHO',
    lastUpdated: '2025-06-10',
    actions: {
      canForward: true,
      canReport: true,
      canApprove: true,
      canReject: true,
      canRaiseRedflag: true,
      canReturn: true,
      canDispose: false
    }
  },
  {
    id: 'AL-2025-008',
    applicantName: 'Meena Reddy',
    applicantMobile: '2109876543',
    applicationType: 'Transfer',
    applicationDate: '2025-05-18',
    status: 'approved',
    status_id: STATUS_MAP.sent,
    assignedTo: 'DCP',
    forwardedFrom: 'ACP',
    lastUpdated: '2025-06-07',
    actions: {
      canForward: true,
      canReport: true,
      canApprove: true,
      canReject: true,
      canRaiseRedflag: true,
      canReturn: true,
      canDispose: false
    },
  },
  {
    id: 'AL-2025-009',
    applicantName: 'Suresh Joshi',
    applicantMobile: '1098765432',
    applicationType: 'New License',
    applicationDate: '2025-05-20',
    status: 'returned',
    status_id: STATUS_MAP.returned,
    assignedTo: 'ACP',
    forwardedFrom: 'SHO',
    returnReason: 'Address verification pending',
    lastUpdated: '2025-06-04',
    actions: {
      canForward: true,
      canReport: true,
      canApprove: true,
      canReject: true,
      canRaiseRedflag: true,
      canReturn: true,
      canDispose: false
    },
  },
  {
    id: 'AL-2025-010',
    applicantName: 'Anjali Mishra',
    applicantMobile: '9876543211',
    applicationType: 'Renewal',
    applicationDate: '2025-05-22',
    status: 'pending',
    status_id: STATUS_MAP.pending,
    assignedTo: 'SHO',
    lastUpdated: '2025-06-11',
    actions: {
      canForward: true,
      canReport: true,
      canApprove: true,
      canReject: true,
      canRaiseRedflag: true,
      canReturn: true,
      canDispose: false
    },
  },
  {
    id: 'AL-2025-011',
    applicantName: 'Dinesh Kapoor',
    applicantMobile: '8765432100',
    applicationType: 'New License',
    applicationDate: '2025-05-25',
    status: 'red-flagged',
    status_id: STATUS_MAP.flagged,
    assignedTo: 'DCP',
    forwardedFrom: 'SHO',
    flagReason: 'Suspicious documentation',
    lastUpdated: '2025-06-08',
    actions: {
      canForward: true,
      canReport: true,
      canApprove: true,
      canReject: true,
      canRaiseRedflag: true,
      canReturn: true,
      canDispose: false
    },
  },
  {
    id: 'AL-2025-012',
    applicantName: 'Pooja Sharma',
    applicantMobile: '7654321099',
    applicationType: 'Transfer',
    applicationDate: '2025-05-28',
    status: 'approved',
    status_id: STATUS_MAP.sent,
    assignedTo: 'CP',
    forwardedFrom: 'DCP',
    lastUpdated: '2025-06-10',
    actions: {
      canForward: true,
      canReport: true,
      canApprove: true,
      canReject: true,
      canRaiseRedflag: true,
      canReturn: true,
      canDispose: false
    },
  },
  {
    id: 'AL-2025-013',
    applicantName: 'Sandeep Kumar',
    applicantMobile: '6543210988',
    applicationType: 'New License',
    applicationDate: '2025-05-30',
    status: 'pending',
    status_id: STATUS_MAP.pending,
    assignedTo: 'ACP',
    forwardedFrom: 'SHO',
    lastUpdated: '2025-06-09',
    actions: {
      canForward: true,
      canReport: true,
      canApprove: true,
      canReject: true,
      canRaiseRedflag: true,
      canReturn: true,
      canDispose: false
    },
  },
  {
    id: 'AL-2025-014',
    applicantName: 'Kavita Singh',
    applicantMobile: '5432109877',
    applicationType: 'Renewal',
    applicationDate: '2025-06-01',
    status: 'disposed',
    status_id: STATUS_MAP.disposed,
    assignedTo: 'SHO',
    disposalReason: 'Duplicate application',
    lastUpdated: '2025-06-10',
    actions: {
      canForward: true,
      canReport: true,
      canApprove: true,
      canReject: true,
      canRaiseRedflag: true,
      canReturn: true,
      canDispose: false
    },
  },
  {
    id: 'AL-2025-015',
    applicantName: 'Rakesh Gupta',
    applicantMobile: '4321098766',
    applicationType: 'New License',
    applicationDate: '2025-06-03',
    status: 'rejected',
    status_id: STATUS_MAP.disposed,
    assignedTo: 'DCP',
    forwardedFrom: 'ACP',
    lastUpdated: '2025-06-11',
    actions: {
      canForward: true,
      canReport: true,
      canApprove: true,
      canReject: true,
      canRaiseRedflag: true,
      canReturn: true,
      canDispose: false
    },
  }
];

// Helper function to filter applications based on search query and date range
export const filterApplications = (
  applications: ApplicationData[],
  searchQuery?: string,
  startDate?: string,
  endDate?: string
): ApplicationData[] => {
  let filtered = [...applications];

  // Filter by search query
  if (searchQuery && searchQuery.trim() !== '') {
    const query = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(
      app =>
        app.id.toLowerCase().includes(query) ||
        app.applicantName.toLowerCase().includes(query) ||
        app.applicantMobile.includes(query)
    );
  }

  // Filter by date range
  if (startDate && startDate.trim() !== '') {
    filtered = filtered.filter(
      app => new Date(app.applicationDate) >= new Date(startDate)
    );
  }

  if (endDate && endDate.trim() !== '') {
    filtered = filtered.filter(
      app => new Date(app.applicationDate) <= new Date(endDate)
    );
  }

  return filtered;
};

// Helper function to filter applications by status
export const getApplicationsByStatus = (
  applications: ApplicationData[],
  status: string | number,
  userId?: string
): ApplicationData[] => {
  let filtered = [];
  switch (status) {
    case 'forwarded':
    case STATUS_MAP.sent:
      filtered = applications.filter(app => app.forwardedFrom && app.status_id === STATUS_MAP.sent);
      break;
    case 'returned':
    case STATUS_MAP.returned:
      filtered = applications.filter(app => app.status_id === STATUS_MAP.returned);
      break;
    case 'flagged':
    case STATUS_MAP.flagged:
      filtered = applications.filter(app => app.status_id === STATUS_MAP.flagged);
      break;
    case 'disposed':
    case STATUS_MAP.disposed:
      filtered = applications.filter(app => app.status_id === STATUS_MAP.disposed);
      break;
    case 'freshform':
    case STATUS_MAP.pending:
      filtered = applications.filter(app => !app.forwardedFrom && app.status_id === STATUS_MAP.pending);
      break;
    case 'final':
    case STATUS_MAP.approved:
      filtered = applications.filter(app => app.status_id === STATUS_MAP.approved);
      break;
    default:
      filtered = applications;
  }
  // Filter by userId if provided
  if (userId) {
    filtered = filtered.filter(app => app.assignedTo === userId || app.forwardedTo === userId);
  }
  return filtered;
};
