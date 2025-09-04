import { ApplicationApi } from '../config/APIClient';
import { Application } from '../types/application';
import { ApiResponse } from '../types/api';
import { CreateApplicationParams } from '../config/APIsEndpoints';

export const getApplicationsByStatus = async (status: string | number): Promise<Application[]> => {
  try {
    console.log('getApplicationsByStatus - Status before API call:', {
      rawStatus: status,
      stringStatus: String(status),
      type: typeof status
    });
    
    // Make the API call with explicit params object
    const params = { status: String(status) };
    console.log('getApplicationsByStatus - API params:', params);
    
    const response = await ApplicationApi.getAll(params);
    console.log('getApplicationsByStatus - API Response:', {
      success: response?.success,
      data: response?.data,
      dataLength: Array.isArray(response?.data) ? response.data.length : 'not an array'
    });
    
    // Extract and validate data
    const applications = (response as unknown as ApiResponse<Application[]>).data;
    console.log('getApplicationsByStatus - Extracted applications:', {
      count: Array.isArray(applications) ? applications.length : 'not an array',
      firstItem: applications?.[0]
    });
    
    return applications;
  } catch (error) {
    console.error('getApplicationsByStatus - Error:', {
      error,
      message: typeof error === 'object' && error !== null && 'message' in error ? (error as any).message : undefined,
      response: typeof error === 'object' && error !== null && 'response' in error ? (error as any).response : undefined
    });
    throw error;
  }
};

export const getApplicationById = async (id: string): Promise<Application> => {
  try {
    const response = await ApplicationApi.getById(id);
    // Check if response.data is of type Application, otherwise throw an error
    if (typeof (response as any).data === 'boolean') {
      throw new Error('Invalid response: data is boolean, expected Application object');
    }
    return (response as unknown as ApiResponse<Application>).data;
  } catch (error) {
    console.error('Error fetching application:', error);
    throw error;
  }
};

export const createApplication = async (applicationData: CreateApplicationParams): Promise<Application> => {
  try {
    const response = await ApplicationApi.create(applicationData);
    return (response as unknown as ApiResponse<Application>).data;
  } catch (error) {
    console.error('Error creating application:', error);
    throw error;
  }
};
