
import { Injectable, NotFoundException, OnModuleInit  } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import prisma from '../../db/prismaClient';
// import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

export interface CreateUserInput {
  username?: string;
  email?: string;
  password?: string;
  phoneNo?: string;
  roleId?: number;
}

function validateCreateUserInput(data: any): asserts data is Required<CreateUserInput> {
  const requiredFields = ['username', 'password', 'roleId'];
  for (const field of requiredFields) {
    if (!data[field]) {
      throw new Error(`${field} is required.`);
    }
  }
  if (typeof data.username !== 'string') throw new Error('username must be a string.');
  if (typeof data.password !== 'string') throw new Error('password must be a string.');
  if (typeof data.roleId !== 'number' && typeof data.roleId !== 'string') throw new Error('roleId must be a number.');
  if (data.email && typeof data.email !== 'string') throw new Error('email must be a string.');
  if (data.phoneNo && typeof data.phoneNo !== 'string') throw new Error('phoneNo must be a string.');
}

@Injectable()
export class UserService {
  private readonly saltRounds = 12;

  /**
   * Hash a password using bcrypt
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  async getUsers(role?: string): Promise<any[]> {
    const where: any = {};
    if (role) {
      where.role = { code: role };
    }
    return await prisma.users.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      },
    });
  }
  

  async createUser(data: CreateUserInput) {
    validateCreateUserInput(data);
    
    // Hash the password before storing
    const hashedPassword = await this.hashPassword(data.password);
    
    return await prisma.users.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        phoneNo: data.phoneNo,
        roleId: Number(data.roleId),
      },
    });
  }

  /**
   * Update user password with proper hashing
   * @param userId - User ID
   * @param newPassword - New plain text password
   * @returns Updated user
   */
  async updatePassword(userId: string, newPassword: string) {
    if (!newPassword || typeof newPassword !== 'string') {
      throw new Error('Password is required and must be a string.');
    }

    const hashedPassword = await this.hashPassword(newPassword);
    
    return await prisma.users.update({
      where: { id: Number(userId) },
      data: { password: hashedPassword },
      select: {
        id: true,
        username: true,
        email: true,
        updatedAt: true,
      },
    });
  } 
  /**
   * Update a user by ID with provided fields
   * @param id user ID
   * @param updateUserDto fields to update
   * @returns updated user object
   */
async updateUser(id: number, updateUserDto: UpdateUserDto) {
  try {
  const existingUser = await prisma.users.findUnique({
    where: { id },
  });

  if (!existingUser) {
    throw new NotFoundException(`User with ID ${id} not found`);
  }

  const data: any = {};

  // ✅ Handle scalar fields
  if (updateUserDto.username) data.username = updateUserDto.username;
  if (updateUserDto.email) data.email = updateUserDto.email;
  if (updateUserDto.phoneNo) data.phoneNo = updateUserDto.phoneNo;

  // ✅ Handle relation fields with connect
  if (updateUserDto.policeStationId) {
    data.policeStation = { connect: { id: updateUserDto.policeStationId } };
  }
  
  if (updateUserDto.districtId) {
    data.district = { connect: { id: updateUserDto.districtId } };
  }
  if (updateUserDto.zoneId) {
    data.zone = { connect: { id: updateUserDto.zoneId } };
  }
  if (updateUserDto.divisionId) {
    data.division = { connect: { id: updateUserDto.divisionId } };
  }
  const updatedUser = await prisma.users.update({
    where: { id },
    data,
  });

  return updatedUser;

} catch (error:any) {
  console.error('Error while updating user:', error);

  throw error;
}
}

async deleteUser(id: number) {
  try {
  const existingUser = await prisma.users.findUnique({
    where: { id },
  });
  if (!existingUser) {
    throw new NotFoundException(`User with ID ${id} not found`);
  } 
  await prisma.users.delete({
    where: { id },
  });
  return { message: `User with ID ${id} deleted successfully` }; 

 } catch (error) {
    // log the error for debugging
    console.error('Error while deleting user:', error);

    // rethrow so NestJS global exception filter can handle it
    throw error;
  }
}
}
