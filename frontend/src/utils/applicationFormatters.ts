import { ApplicationData } from '../types';
import { formatGender } from './formatters';

export const normalizeRenewalApplication = (application: any, submittedOnly: boolean = false): ApplicationData => {
  const applicantName =
    application?.applicantName ||
    [application?.firstName, application?.middleName, application?.lastName].filter(Boolean).join(' ') ||
    'Unknown Applicant';

  return {
    id: String(application?.id || ''),
    acknowledgementNo: application?.acknowledgementNo,
    firstName: application?.firstName,
    middleName: application?.middleName,
    lastName: application?.lastName,
    applicantName,
    applicantMobile: application?.applicantMobile || application?.mobileNumber || application?.contactInfo?.mobileNumber || '',
    applicantEmail: application?.applicantEmail || application?.email || application?.contactInfo?.email || undefined,
    mobileNumber: application?.applicantMobile || application?.mobileNumber || application?.contactInfo?.mobileNumber || '',
    email: application?.applicantEmail || application?.email || application?.contactInfo?.email || undefined,
    parentOrSpouseName: application?.parentOrSpouseName,
    sex: application?.sex,
    gender: application?.sex ? (formatGender(application.sex) as any) : undefined,
    dob: application?.dateOfBirth ? new Date(application.dateOfBirth).toISOString() : undefined,
    dateOfBirth: application?.dateOfBirth || undefined,
    dobInWords: application?.dobInWords,
    panNumber: application?.panNumber,
    aadharNumber: application?.aadharNumber,
    placeOfBirth: application?.placeOfBirth || undefined,
    applicationType: 'Renewal Application',
    applicationDate: application?.createdAt || new Date().toISOString(),
    applicationTime: application?.createdAt ? new Date(application.createdAt).toTimeString() : undefined,
    status: application?.workflowStatus?.name || application?.status || (submittedOnly ? 'Submitted' : 'Draft'),
    status_id: application?.workflowStatusId ?? (application?.isSubmit ? 1 : (submittedOnly ? 9 : 0)),
    workflowStatus: application?.workflowStatus
      ? {
          id: application.workflowStatus.id || 0,
          code: application.workflowStatus.code || '',
          name: application.workflowStatus.name || '',
        }
      : undefined,
    currentUser:
      application?.currentUser ||
      (application?.currentUserId
        ? {
            id: application.currentUserId,
            username: application.currentUserName || application.currentUserUsername || undefined,
          }
        : undefined),
    previousUser: application?.previousUser || undefined,
    assignedTo: String(application?.currentUserId || ''),
    lastUpdated: application?.updatedAt || application?.createdAt || new Date().toISOString(),
    createdAt: application?.createdAt,
    updatedAt: application?.updatedAt,
    documents: Array.isArray(application?.documents)
      ? application.documents
      : Array.isArray(application?.fileUploads)
      ? application.fileUploads.map((upload: any) => ({
          ...upload,
          name: upload?.fileName || upload?.name || '',
          url:
            upload?.fileUrl || upload?.url || upload?.path || upload?.downloadUrl || '',
          type: upload?.fileType || upload?.type || '',
        }))
      : [],
    history: Array.isArray(application?.history) ? application.history : [],
    workflowHistories: Array.isArray(application?.workflowHistories) ? application.workflowHistories : [],
    presentAddress: application?.presentAddress || undefined,
    permanentAddress: application?.permanentAddress || undefined,
    occupationAndBusiness: application?.occupationAndBusiness || undefined,
    licenseDetails: Array.isArray(application?.licenseDetails) ? application.licenseDetails : (application?.licenseDetails ? [application.licenseDetails] : []),
    biometricData: application?.biometricData || undefined,
    actions: application?.actions || {
      canForward: false,
      canReport: true,
      canApprove: false,
      canReject: false,
      canRaiseRedflag: false,
      canReturn: false,
      canDispose: false,
    },
    usersInHierarchy: Array.isArray(application?.usersInHierarchy) ? application.usersInHierarchy : [],
    // Keep linkage IDs for renewal edit-routing in draft mode.
    ...( {
      renewalId: application?.id,
      renewalApplicationId: application?.id,
      applicationId:
        application?.applicationId ||
        application?.freshApplicationId ||
        application?.sourceApplicationId ||
        application?.renewalLicenseId ||
        '',
      freshApplicationId: application?.freshApplicationId || application?.applicationId || '',
      sourceApplicationId: application?.sourceApplicationId || application?.applicationId || '',
      renewalLicenseId: application?.renewalLicenseId || '',
    } as any),
  };
};
