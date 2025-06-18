/**
 * This file contains a temporary implementation to handle models that are not yet defined in Prisma schema.
 * It serves as a placeholder until the proper schema is defined and generated.
 */

// Define a class that mocks the PrismaClient interface for a missing model
export class PrismaMockClient<T> {
  modelName: string;
  
  constructor(modelName: string) {
    this.modelName = modelName;
  }
  
  async findMany(args?: any): Promise<T[]> {
    console.warn(`${this.modelName} model is not defined in the Prisma schema`);
    return [];
  }
  
  async findUnique(args?: any): Promise<T | null> {
    console.warn(`${this.modelName} model is not defined in the Prisma schema`);
    return null;
  }
  
  async create(args?: any): Promise<T> {
    console.warn(`${this.modelName} model is not defined in the Prisma schema`);
    throw new Error(`${this.modelName} model not defined in schema`);
  }
  
  async update(args?: any): Promise<T> {
    console.warn(`${this.modelName} model is not defined in the Prisma schema`);
    throw new Error(`${this.modelName} model not defined in schema`);
  }
  
  async delete(args?: any): Promise<T> {
    console.warn(`${this.modelName} model is not defined in the Prisma schema`);
    throw new Error(`${this.modelName} model not defined in schema`);
  }
  
  async count(args?: any): Promise<number> {
    console.warn(`${this.modelName} model is not defined in the Prisma schema`);
    return 0;
  }
  
  async groupBy(args?: any): Promise<any[]> {
    console.warn(`${this.modelName} model is not defined in the Prisma schema`);
    return [];
  }
}

// Define interfaces for models that are not yet in the schema
export interface Application {
  id: string;
  title: string;
  description: string;
  userId: number;
  flowStatusId: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApplicationHistory {
  id: string;
  applicationId: string;
  statusId: number;
  userId: number;
  comments: string;
  createdAt: Date;
}

// Create mock clients
export const applicationClient = new PrismaMockClient<Application>('Application');
export const applicationHistoryClient = new PrismaMockClient<ApplicationHistory>('ApplicationHistory');
