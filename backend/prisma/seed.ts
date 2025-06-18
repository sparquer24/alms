import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Insert roles
  const roles = [
    { id: 1, code: 'APPLICANT', name: 'Applicant', description: 'Citizen Applicant', level: 1 },
    { id: 2, code: 'DCP', name: 'Deputy Commissioner', description: 'Deputy Commissioner of Police', level: 2 },
    { id: 3, code: 'ACP', name: 'Assistant Commissioner', description: 'Assistant Commissioner of Police', level: 3 },
    { id: 4, code: 'SHO', name: 'Station House Officer', description: 'Station House Officer', level: 4 },
    { id: 5, code: 'ZS', name: 'Zonal Superintendent', description: 'Zonal Superintendent', level: 5 },
    { id: 6, code: 'AS', name: 'Arms Superintendent', description: 'Arms Superintendent', level: 6 },
    { id: 7, code: 'ARMS_SUPDT', name: 'ARMS Superintendent', description: 'ARMS Superintendent', level: 7 },
    { id: 8, code: 'ARMS_SEAT', name: 'ARMS Seat Officer', description: 'ARMS Seat Officer', level: 8 },
    { id: 9, code: 'ADO', name: 'Administrative Officer', description: 'Administrative Officer', level: 9 },
    { id: 10, code: 'CADO', name: 'Chief Administrative Officer', description: 'Chief Administrative Officer', level: 10 },
    { id: 11, code: 'JTCP', name: 'Joint Commissioner', description: 'Joint Commissioner of Police', level: 11 },
    { id: 12, code: 'CP', name: 'Commissioner of Police', description: 'Commissioner of Police', level: 12 },
    { id: 13, code: 'ADMIN', name: 'System Administrator', description: 'System Administrator', level: 13 },
  ];

  for (const role of roles) {
    try {
      await prisma.role.upsert({
        where: { id: role.id },
        update: {},
        create: {
          id: role.id,
          code: role.code,
          name: role.name,
          description: role.description,
          level: role.level,
        },
      });
    } catch (error) {
      console.error(`Error inserting role: ${role.name}`, error);
    }
  }

  // Insert dummy users
  const defaultPassword = 'Password123';
  const hashedPassword = bcrypt.hashSync(defaultPassword, 10);

  const dummyUsers = [
    { username: 'dummy1', email: 'dummy1@example.com', name: 'Dummy User 1', role_id: 1 },
    { username: 'dummy2', email: 'dummy2@example.com', name: 'Dummy User 2', role_id: 2 },
    { username: 'dummy3', email: 'dummy3@example.com', name: 'Dummy User 3', role_id: 3 },
  ];

  for (const user of dummyUsers) {
    try {
      await prisma.user.create({
        data: {
          username: user.username,
          email: user.email,
          password_hash: hashedPassword,
          role_id: user.role_id,
          name: user.name,
        },
      });
    } catch (error) {
      console.error(`Error inserting dummy user: ${user.email}`, error);
    }
  }
}

main().finally(() => prisma.$disconnect());
