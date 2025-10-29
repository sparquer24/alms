export interface ApplicationQueryParams {
  statusIds?: string[];
  page?: number;
  limit?: number;
  search?: string;
  isSent?: boolean;
}

export interface Application {
  id: string;
  applicationNumber: string;
  status: string;
  workflowStatus?: {
    id: number;
    code: string;
    name: string;
  };
  personalInfo: {
    name: string;
    fatherName: string;
    dateOfBirth: string;
  };
  address: {
    houseNumber: string;
    street: string;
    city: string;
  };
  createdAt: string;
}
