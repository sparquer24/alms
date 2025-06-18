import { prisma } from '../dbConfig/prisma';

// GET /roles/actions
export const getRoleActions = async (event: any) => {
  // Optionally, get roleId from queryStringParameters or pathParameters
  const roleId = event.queryStringParameters?.roleId || event.pathParameters?.roleId;
  if (!roleId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'roleId is required.' }),
    };
  }
  // Get actions for the role
  // const actions = await prisma.action.findMany({ where: { roleId } });
  return {
    statusCode: 200,
    body: JSON.stringify([]),
  };
};

// GET /roles/hierarchy
export const getRoleHierarchy = async (event: any) => {
  // Example: return all roles ordered by hierarchy (assuming you have a hierarchy field)
  // If not, just return all roles
  const roles = await prisma.roles.findMany({ orderBy: { name: 'asc' } });
  return {
    statusCode: 200,
    body: JSON.stringify(roles),
  };
};
