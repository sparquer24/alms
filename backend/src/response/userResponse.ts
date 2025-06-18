// User Response Types
import { User } from '../models/user';

/**
 * Response format for user data - excludes sensitive information
 */
export interface UserResponse {
  id: number;
  username: string;
  email: string;
  roleId: number;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
}

/**
 * Converts a User entity to a safe UserResponse object
 */
export const toUserResponse = (user: User): UserResponse => ({
  id: user.id,
  username: user.username,
  email: user.email,
  roleId: user.roleId,
  isActive: user.isActive,
  lastLogin: user.lastLogin || undefined,
  createdAt: user.createdAt
});
