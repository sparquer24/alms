// Request interfaces for renewal form
export interface CreateRenewalFormRequest {
  licenseNumber: string;
  userId: number;
  firstName: string;
  middleName?: string;
  lastName: string;
  parentOrSpouseName: string;
  sex: 'MALE' | 'FEMALE' | 'OTHER';
  dateOfBirth?: Date;
  dobInWords?: string;
  panNumber?: string;
  aadharNumber?: string;
  filledBy?: string;
}

export interface PatchRenewalFormRequest {
  applicationId: number;
  isSubmit?: boolean;
  data: Record<string, any>;
}

export interface RenewalFormResponse {
  id: number;
  acknowledgementNo?: string;
  licenseNumber: string;
  applicantName: string;
  parentOrSpouseName: string;
  sex: string;
  dateOfBirth?: Date;
  dobInWords?: string;
  panNumber?: string;
  aadharNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  isSubmit?: boolean;
  renewalLicenseId?: string;
  isApproved?: boolean;
  isPending?: boolean;
  isRejected?: boolean;
  workflowStatusId?: number;
  currentUserId?: number;
}

export interface RenewalFiltersDto {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  currentUserId?: number;
  ordering?: 'ASC' | 'DESC';
  orderBy?: string;
}
