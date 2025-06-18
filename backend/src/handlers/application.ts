// This handler file has been temporarily modified to use mock clients
// until the Application and ApplicationHistory models are added to the Prisma schema

import { prisma } from '../dbConfig/prisma';
import { authenticate } from '../middleware/authMiddleware';
import { authorize } from '../middleware/roleMiddleware';
import { applicationClient, applicationHistoryClient } from '../utils/prismaMock';

// Replace all prisma.application calls with applicationClient
// Replace all prisma.application_history calls with applicationHistoryClient

// Note: This is a temporary solution. The correct approach is to:
// 1. Define Application and ApplicationHistory models in schema.prisma
// 2. Run prisma generate
// 3. Use the actual prisma client with the new models

// Application Management Handlers
// GET /applications
export const getApplications = async (event: any) => {
  try {
    // Filters: searchQuery, startDate, endDate, status, pagination
    const { searchQuery, startDate, endDate, status, page = 1, pageSize = 10 } = event.queryStringParameters || {};
    const where: any = {};
    if (searchQuery) {
      where.OR = [
        { applicantName: { contains: searchQuery, mode: 'insensitive' } },
        { applicantEmail: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }
    const skip = (Number(page) - 1) * Number(pageSize);
    const applications = await applicationClient.findMany({
      where,
      skip,
      take: Number(pageSize),
      orderBy: { created_at: 'desc' },
    });
    return {
      statusCode: 200,
      body: JSON.stringify(applications),
    };
  } catch (error) {
    console.error('Get Applications Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error.' }),
    };
  }
};

// GET /applications/:id
export const getApplicationById = async (event: any) => {
  const id = event.pathParameters && event.pathParameters.id;
  if (!id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Application ID is required.' }),
    };  }
  const application = await applicationClient.findUnique({ where: { id } });
  if (!application) {
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Application not found.' }),
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify(application),
  };
};

// POST /applications
export const createApplication = async (event: any) => {
  try {
    let body;
    if (typeof event.body === 'string') {
      body = JSON.parse(event.body);
    } else {
      body = event.body;
    }

    // Validate status name
    if (!body.status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing status in request body.' }),
      };
    }

    // Generate a unique ID for the application
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const randomPart = Math.floor(10000 + Math.random() * 90000); // 5-digit random number
    const appId = `ALM-${dateStr}-${randomPart}`;

    // Map camelCase to snake_case for Prisma
    const application = await applicationClient.create({
      data: {
        id: appId,
        applicant_name: body.applicantName,
        applicant_mobile: body.applicantMobile,
        applicant_email: body.applicantEmail,
        father_name: body.fatherName,
        gender: body.gender,
        dob: body.dob ? new Date(body.dob) : undefined,
        address: body.address,
        application_type: body.applicationType,
        weapon_type: body.weaponType,
        weapon_reason: body.weaponReason,
        license_type: body.licenseType,
        license_validity: body.licenseValidity ? new Date(body.licenseValidity) : undefined,
        is_previously_held_license: body.isPreviouslyHeldLicense,
        previous_license_number: body.previousLicenseNumber,
        has_criminal_record: body.hasCriminalRecord,
        criminal_record_details: body.criminalRecordDetails,
        forward_comments: body.comments,
        // Add other fields as needed
      },
    });
    return {
      statusCode: 201,
      body: JSON.stringify(application),
    };
  } catch (error) {
    console.error('Create Application Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error.' }),
    };
  }
};

// PATCH /api/applications/{id}/status
export const updateApplicationStatus = async (event: any) => {
  // Authenticate user
  const user = authenticate(event);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
  }
  // Only certain roles can update status
  const allowedRoles = ['SHO', 'ACP', 'DCP', 'CP'];
  if (!authorize(user, allowedRoles)) {
    return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden: insufficient role' }) };
  }
  const id = event.pathParameters && event.pathParameters.id;
  const { status } = JSON.parse(event.body || '{}');
  if (!id || !status) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Application ID and status are required.' }),
    };
  }
  // Validate status transition (simple example, expand as needed)
  const application = await applicationClient.findUnique({ where: { id } });
  if (!application) {
    return { statusCode: 404, body: JSON.stringify({ message: 'Application not found.' }) };
  }
  // Example: Only allow FRESH -> FORWARDED, FORWARDED -> APPROVED/REJECTED/RETURNED, etc.
  const validTransitions: Record<string, string[]> = {
    FRESH: ['FORWARDED'],
    FORWARDED: ['APPROVED', 'REJECTED', 'RETURNED', 'RED_FLAGGED'],
    RETURNED: ['FORWARDED'],
    RED_FLAGGED: ['DISPOSED'],
    APPROVED: ['FINAL'],
    REJECTED: [],
    DISPOSED: [],
    SENT: ['FINAL'],
    FINAL: []
  };
  // Use the correct property name from your Prisma schema, likely 'status'
  const currentStatus = (application as any).status || (application as any).application_status;
  if (!validTransitions[currentStatus as keyof typeof validTransitions]?.includes(status)) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid status transition.' }) };
  }
  // Log status change in application_history
  // Extract userId and username safely from user object
  const userId = typeof user === 'object' && 'userId' in user ? (user as any).userId : undefined;
  const username = typeof user === 'object' && 'username' in user ? (user as any).username : 'unknown';

  await applicationHistoryClient.create({
    data: {
      application_id: id,
      action: `STATUS_CHANGE:${(application as any).application_status || (application as any).status}->${status}`,
      performed_by: userId,
      comments: `Status changed by ${username}`,
    },
  });
  // Update status
  const updated = await applicationClient.update({
    where: { id },
    data: {
      flow_status: status, // Correct field name from schema
    },
  });
  return {
    statusCode: 200,
    body: JSON.stringify(updated),
  };
};

// POST /api/applications/{id}/forward
export const forwardApplication = async (event: any) => {
  // Authenticate user
  const user = authenticate(event);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ message: 'Unauthorized' }) };
  }
  // Only certain roles can forward
  const allowedRoles = ['SHO', 'ACP', 'DCP', 'CP', 'ZS'];
  if (!authorize(user, allowedRoles)) {
    return { statusCode: 403, body: JSON.stringify({ message: 'Forbidden: insufficient role' }) };
  }
  const id = event.pathParameters && event.pathParameters.id;
  const { forwardToRole, comments } = JSON.parse(event.body || '{}');
  if (!id || !forwardToRole) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Application ID and forwardToRole are required.' }),
    };
  }
  // Validate role hierarchy (simple example, expand as needed)
  const roleHierarchy: Record<string, string[]> = {
    ZS: ['SHO', 'ACP'],
    SHO: ['ACP'],
    ACP: ['DCP', 'SHO'],
    DCP: ['CP', 'ACP'],
    CP: [],
  };
  const userRole = typeof user === 'object' && 'role' in user ? (user as any).role : undefined;
  if (!userRole || !roleHierarchy[userRole]?.includes(forwardToRole)) {
    return { statusCode: 400, body: JSON.stringify({ message: 'Invalid forwarding target for your role.' }) };
  }
  // Log forwarding in application_history
  await applicationHistoryClient.create({
    data: {
      application_id: id,
      action: `FORWARDED_TO:${forwardToRole}`,
      performed_by: typeof user === 'object' && 'userId' in user ? (user as any).userId : undefined,
      comments: comments || '',
    },
  });
  // Update application (assign to new role, update status if needed)
  const updated = await applicationClient.update({
    where: { id },
    data: {
      // Example: assign to new role (you may need to adjust your schema for this)
      // assigned_to: newUserId,
      // status: 'FORWARDED',
      forward_comments: comments || '',
    },
  });
  return {
    statusCode: 200,
    body: JSON.stringify(updated),
  };
};

// POST /applications/batch
export const batchProcessApplications = async (event: any) => {
  // Batch process logic (e.g., update status for multiple applications)
  return {
    statusCode: 501,
    body: JSON.stringify({ message: 'Not implemented: batchProcessApplications' }),
  };
};
