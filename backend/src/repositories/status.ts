import { prisma } from '../dbConfig/prisma';
import { PrismaMockClient } from '../utils/prismaMock';

// Define a simple Status interface
interface Status {
  id: number;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create a mock client for Status
const statusClient = new PrismaMockClient<Status>('Status');

// Using the mock client until the Status model is defined in schema.prisma
export const getAllStatuses = async (): Promise<Status[]> => statusClient.findMany();
export const getStatusById = async (id: number): Promise<Status | null> => statusClient.findUnique({ where: { id } });
export const createStatus = async (data: { name: string }): Promise<Status> => statusClient.create({ data });
export const updateStatus = async (id: number, data: { name?: string }): Promise<Status> => statusClient.update({ where: { id }, data });
export const deleteStatus = async (id: number): Promise<Status> => statusClient.delete({ where: { id } });

// NOTE: To properly implement this repository:
// 1. Define the Status model in schema.prisma
// 2. Run prisma generate
// 3. Replace statusClient with prisma.status