export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

export interface ApplicationQueryParams {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
  isSent?: boolean;
}

export interface APIApplication {
  id: number;
  acknowledgementNo: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  status: string;
  createdAt: string;
  applicationType?: string;
  weaponType?: string;
  licenseType?: string;
}

export interface CreateApplicationParams {
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  licenseType: string;
  weaponType: string;
  purpose: string;
}
