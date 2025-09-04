export interface ApplicationQueryParams {
  statusIds?: string[];
  page?: number;
  limit?: number;
  search?: string;
}

export interface Application {
  id: string;
  applicationNumber: string;
  status: string;
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
