
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import prisma from '../../db/prismaClient';

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
        role: { select: { name: true, code: true } },
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
      where: { id: userId },
      data: { password: hashedPassword },
      select: {
        id: true,
        username: true,
        email: true,
        updatedAt: true,
      },
    });
  }
}
