import { prisma } from '../dbConfig/prisma';
import { User, UserWithRoleAndPermissions } from '../models/user';

export const getAllUsers = async (): Promise<User[]> => prisma.users.findMany();
export const getUserById = async (id: number): Promise<User | null> => prisma.users.findUnique({ where: { id } });
export const updateUser = async (id: number, data: any): Promise<User> => prisma.users.update({ where: { id }, data });
export const deleteUser = async (id: number): Promise<User> => prisma.users.delete({ where: { id } });
export const findUserByUsername = async (username: string): Promise<User | null> => {
  // Ensure username is properly passed
  if (!username) {
    throw new Error('Username is required for findUserByUsername');
  }
  return prisma.users.findUnique({ 
    where: { 
      username: username  // Explicitly use the property name
    } 
  });
};

/**
 * Get user with role and permissions by ID
 * @param {number} id - User ID
 * @returns {Promise<UserWithRoleAndPermissions|null>} User with role and permissions
 */
export const getUserWithRoleAndPermissions = async (id: number): Promise<UserWithRoleAndPermissions|null> => {
  if (!id) {
    throw new Error('User ID is required for getUserWithRoleAndPermissions');
  }
  return prisma.users.findUnique({
    where: { id },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: {
              permission: true
            }
          }
        }
      }
    }
  }) as Promise<UserWithRoleAndPermissions|null>;
};