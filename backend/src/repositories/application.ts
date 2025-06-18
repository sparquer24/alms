import { prisma } from '../dbConfig/prisma';
import { applicationClient, Application } from '../utils/prismaMock';

// Using the mock client until the Application model is defined in schema.prisma
export const getAllApplications = async (): Promise<Application[]> => applicationClient.findMany();
export const getApplicationById = async (id: string): Promise<Application | null> => applicationClient.findUnique({ where: { id } });
export const createApplication = async (data: any): Promise<Application> => applicationClient.create({ data });
export const updateApplication = async (id: string, data: any): Promise<Application> => applicationClient.update({ where: { id }, data });
export const deleteApplication = async (id: string): Promise<Application> => applicationClient.delete({ where: { id } });

// NOTE: To properly implement this repository:
// 1. Define the Application model in schema.prisma
// 2. Run prisma generate
// 3. Replace applicationClient with prisma.application