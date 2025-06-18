import { prisma } from '../dbConfig/prisma';

// Commenting out references to `action` as the model is not defined in the schema
// export const getAllActions = async () => prisma.action.findMany();
// export const getActionById = async (id: string) => prisma.action.findUnique({ where: { id } });
// export const createAction = async (data: { roleId: string; action: string }) => prisma.action.create({ data });
// export const updateAction = async (id: string, data: { action?: string }) => prisma.action.update({ where: { id }, data });
// export const deleteAction = async (id: string) => prisma.action.delete({ where: { id } });