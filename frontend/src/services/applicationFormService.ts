import { ApplicationApi } from '../config/APIClient';
import { Application } from '../types/application';
import { ApiResponse } from '../types/api';
import { CreateApplicationParams } from '../config/APIsEndpoints';

export const getApplicationsByStatus = async (status: string | number): Promise<Application[]> => {
  try {
    // Make the API call with explicit params object (statusIds expected)
    const params = { statusIds: String(status) };
    const response = await ApplicationApi.getAll(params);
    // Extract and validate data
    const applications = (response as unknown as ApiResponse<Application[]>).data;
    return applications;
  } catch (error) {
    throw error;
  }
};

export const getApplicationById = async (id: string): Promise<Application> => {
  try {
    const response = await ApplicationApi.getById(Number(id));
    // Check if response.data is of type Application, otherwise throw an error
    if (typeof (response as any).data === 'boolean') {
      throw new Error('Invalid response: data is boolean, expected Application object');
    }
    return (response as unknown as ApiResponse<Application>).data;
  } catch (error) {
    throw error;
  }
};

export const createApplication = async (applicationData: CreateApplicationParams): Promise<Application> => {
  try {
    const response = await ApplicationApi.create(applicationData);
    return (response as unknown as ApiResponse<Application>).data;
  } catch (error) {
    throw error;
  }
};
