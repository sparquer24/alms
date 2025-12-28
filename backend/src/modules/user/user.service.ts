
import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import prisma from '../../db/prismaClient';
import { ROLE_CODES } from '../../constants/auth';

export interface CreateUserInput {
  username?: string;
  email?: string;
  password?: string;
  phoneNo?: string;
  roleId?: number;
  policeStationId?: number;
  stateId?: number;
  districtId?: number;
  zoneId?: number;
  divisionId?: number;
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

  async getUsers(role?: string, stateId?: number, roleCode?: string): Promise<any[]> {
    const where: any = {};
    if (role) {
      where.role = { code: role };
    }
    // SUPER_ADMIN has no stateId and should see all users
    // ADMIN should only see users in their state
    if (stateId && roleCode !== ROLE_CODES.SUPER_ADMIN) {
      where.stateId = stateId;
    }
    return await prisma.users.findMany({
      where,
      select: {
        id: true,
        username: true,
        email: true,
        phoneNo: true,
        state:{
          select: {
            id:true,
            name:true,
          }
        },
        district:{
          select: {
            id:true,
            name:true,
          }
        },
        zone:{
          select: {
            id:true,
            name:true,
          }
        },
        division:{
          select: {
            id:true,
            name:true,
          }
        },
        policeStation:{
          select: {
            id:true,
            name:true,
          }
        },
        roleId: true,
        createdAt: true,
        updatedAt: true,
        role: {
          select: {
            id: true,
            code: true,
            name: true,
            is_active: true,
            created_at: true,
            updated_at: true,
            dashboard_title: true,
            menu_items: true,
            permissions: true,
            can_access_settings: true,
            can_forward: true,
            can_re_enquiry: true,
            can_generate_ground_report: true,
            can_FLAF: true,
            can_create_freshLicence: true,
          }
        },
      },
    });
  }

  /**
   * get User by ID
   * @param userId - User ID
   * @returns User object
   */ 

  async getUserById(userId: string | number) {
    return await prisma.users.findUnique({
      where: { id: Number(userId) },
      select: {
        id: true,
        username: true,
        email: true,
        phoneNo: true,
        stateId: true,
        districtId: true,
        zoneId: true,
        divisionId: true,
        policeStationId: true,
        state: {
          select: {
            id: true,
            name: true,
          }
        },
        district: {
          select: {
            id: true,
            name: true,
          }
        },
        zone: {
          select: {
            id: true,
            name: true,
          }
        },
        division: {
          select: {
            id: true,
            name: true,
          }
        },
        policeStation: {
          select: {
            id: true,
            name: true,
          }
        },
        role: {
          select: {
            id: true,
            code: true,
            name: true,
          }
        },
        createdAt: true,
        updatedAt: true,
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
        policeStationId: data.policeStationId,
        stateId: data.stateId,
        districtId: data.districtId,
        zoneId: data.zoneId,
        divisionId: data.divisionId,
        
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
   * Update user fields including optional password change and locations
   */
  async updateUser(userId: string | number, data: Partial<CreateUserInput>) {
    const updateData: any = {};
    if (data.username !== undefined) updateData.username = data.username;
    if (data.email !== undefined) updateData.email = data.email;
    if (data.phoneNo !== undefined) updateData.phoneNo = data.phoneNo;
    if (data.roleId !== undefined) updateData.roleId = Number(data.roleId);
    
    // Update password only if provided
    if (data.password && data.password.trim() !== '') {
      updateData.password = await this.hashPassword(data.password);
    }
    
    // Update location fields
    if (data.stateId !== undefined) updateData.stateId = data.stateId ? Number(data.stateId) : null;
    if (data.districtId !== undefined) updateData.districtId = data.districtId ? Number(data.districtId) : null;
    if (data.zoneId !== undefined) updateData.zoneId = data.zoneId ? Number(data.zoneId) : null;
    if (data.divisionId !== undefined) updateData.divisionId = data.divisionId ? Number(data.divisionId) : null;
    if (data.policeStationId !== undefined) updateData.policeStationId = data.policeStationId ? Number(data.policeStationId) : null;
    
    if (Object.keys(updateData).length === 0) {
      throw new Error('No valid fields provided for update');
    }
    return await prisma.users.update({
      where: { id: Number(userId) },
      data: updateData,
      select: { id: true, username: true, email: true, phoneNo: true, role: {
        select: {
          id: true,
          code: true,
          name: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          dashboard_title: true,
          menu_items: true,
          permissions: true,
          can_access_settings: true,
          can_forward: true,
          can_re_enquiry: true,
          can_generate_ground_report: true,
          can_FLAF: true,
          can_create_freshLicence: true,
        }
      } }
    });
  }

  /**
   * Delete a user by id
   */
  async deleteUser(userId: string | number) {
    await prisma.users.delete({ where: { id: Number(userId) } });
    return { success: true };
  }
}
