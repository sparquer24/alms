import { prisma } from '../dbConfig/prisma';

// Updated to use the correct model name "Roles" instead of "role"
export const getAllRoles = async () => prisma.roles.findMany();
export const getRoleById = async (id: number) => prisma.roles.findUnique({ where: { id } });
export const createRole = async (data: { name: string; code: string; is_active?: boolean }) => prisma.roles.create({ data });
export const updateRole = async (id: number, data: { name?: string; is_active?: boolean }) => prisma.roles.update({ where: { id }, data });
export const deleteRole = async (id: number) => prisma.roles.delete({ where: { id } });