import { prisma } from '../dbConfig/prisma';
import { applicationClient } from '../utils/prismaMock';

// Report Handlers
// GET /reports/statistics
export const getStatistics = async (event: any) => {
  // Using mock client for applications
  const totalApplications = await applicationClient.count();
  const totalUsers = await prisma.users.count();
  return {
    statusCode: 200,
    body: JSON.stringify({ totalApplications, totalUsers }),
  };
};

// GET /reports/applications-by-status
export const getApplicationsByStatus = async (event: any) => {
  // Using mock client for applications
  const grouped = await applicationClient.groupBy({
    by: ['flowStatusId'],
    _count: { flowStatusId: true }
  });
  
  return {
    statusCode: 200,
    body: JSON.stringify(grouped),
  };
};

// GET /applications/:id/pdf
export const generateApplicationPDF = async (event: any) => {
  // Parse applicationId from pathParameters
  const applicationId = event.pathParameters && event.pathParameters.id;
  if (!applicationId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Application ID is required.' }),
    };
  }
  // PDF generation logic would go here (stubbed)
  return {
    statusCode: 501,
    body: JSON.stringify({ message: 'Not implemented: generateApplicationPDF' }),
  };
};
