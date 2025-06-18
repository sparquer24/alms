import { prisma } from './dbConfig/prisma';

async function testPrismaClient() {
  try {
    // Removed test code querying 'document' as per request.
  } catch (error) {
    console.error('Error fetching documents:', error);
  }
}

testPrismaClient();
