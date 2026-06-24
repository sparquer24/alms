// ─── interfaces/snapshot.interface.ts ───────────────────────────────────────
// TypeScript shape for the JSON blob stored in ApplicationVersionSnapshot.snapshotData

export interface SnapshotPersonalDetails {
  id: number;
  acknowledgementNo?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  parentOrSpouseName: string;
  sex: string;
  placeOfBirth?: string;
  dateOfBirth?: string;
  dobInWords?: string;
  panNumber?: string;
  aadharNumber?: string;
  filledBy?: string;
  almsLicenseId?: string;
  licenseNumber?: string; // Renewal only
  renewalLicenseId?: string; // Renewal only
  // Workflow state flags
  isSubmit?: boolean;
  isApproved?: boolean;
  isFLAFGenerated?: boolean;
  isGroundReportGenerated?: boolean;
  isPending?: boolean;
  isReEnquiry?: boolean;
  isReEnquiryDone?: boolean;
  isRejected?: boolean;
  isRecommended?: boolean;
  isNotRecommended?: boolean;
  isAwareOfLegalConsequences?: boolean;
  isDeclarationAccepted?: boolean;
  isTermsAccepted?: boolean;
  // Ownership
  workflowStatusId?: number;
  currentUserId?: number;
  previousUserId?: number;
  occupationAndBusinessId?: number;
  permanentAddressId?: number;
  presentAddressId?: number;
}

export interface SnapshotAddress {
  id: number;
  addressLine: string;
  stateId: number;
  districtId: number;
  zoneId: number;
  divisionId: number;
  policeStationId: number;
  sinceResiding: string;
  telephoneOffice?: string;
  telephoneResidence?: string;
  officeMobileNumber?: string;
  alternativeMobile?: string;
}

export interface SnapshotOccupation {
  id: number;
  occupation: string;
  officeAddress: string;
  stateId: number;
  districtId: number;
  cropLocation?: string;
  areaUnderCultivation?: number;
}

export interface SnapshotCriminalHistory {
  id: number;
  isConvicted: boolean;
  isBondExecuted: boolean;
  bondDate?: string;
  bondPeriod?: string;
  isProhibited: boolean;
  prohibitionDate?: string;
  prohibitionPeriod?: string;
  firDetails?: unknown;
}

export interface SnapshotLicenseHistory {
  id: number;
  hasAppliedBefore: boolean;
  dateAppliedFor?: string;
  previousAuthorityName?: string;
  previousResult?: string;
  hasLicenceSuspended: boolean;
  suspensionAuthorityName?: string;
  suspensionReason?: string;
  hasFamilyLicence: boolean;
  familyMemberName?: string;
  familyLicenceNumber?: string;
  familyWeaponsEndorsed: string[];
  hasSafePlace: boolean;
  safePlaceDetails?: string;
  hasTraining: boolean;
  trainingDetails?: string;
}

export interface SnapshotLicenseDetail {
  id: number;
  needForLicense?: string;
  armsCategory?: string;
  areaOfValidity?: string;
  ammunitionDescription?: string;
  specialConsiderationReason?: string;
  licencePlaceArea?: string;
  wildBeastsSpecification?: string;
  requestedWeaponIds: number[];
}

export interface SnapshotFileUpload {
  id: number;
  fileType: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  uploadedAt: string;
}

/** Full snapshot stored in ApplicationVersionSnapshot.snapshotData */
export interface ApplicationSnapshotData {
  personalDetails: SnapshotPersonalDetails;
  presentAddress?: SnapshotAddress;
  permanentAddress?: SnapshotAddress;
  occupation?: SnapshotOccupation;
  criminalHistories: SnapshotCriminalHistory[];
  licenseHistories: SnapshotLicenseHistory[];
  licenseDetails: SnapshotLicenseDetail[];
  fileUploads: SnapshotFileUpload[];
}
