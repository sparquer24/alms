const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET, JWT_EXPIRY, ERROR_MESSAGES } = require('../constants/auth');
import { LoginRequest } from '../request/authRequest';
import { LoginResponse, UserProfileResponse } from '../response/authResponse';
import { User, UserWithRoleAndPermissions } from '../models/user';
import * as userRepository from '../repositories/user';

/**
 * Interface for service responses
 */
interface ServiceResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
}

/**
 * Authenticate a user with username and password
 * @param {LoginRequest} loginData - The login request data containing username and password
 * @returns {Promise<ServiceResponse<LoginResponse>>} Authentication result with token or error message
 */

const authenticateUser = async (
    loginData: LoginRequest
): Promise<ServiceResponse<LoginResponse>> => {
    try {
        const { username, password } = loginData;
        
        // Validate input
        if (!username || !password) {
            return { success: false, message: ERROR_MESSAGES.CREDENTIALS_REQUIRED };
        }
        
        // Find user by username using repository function
        const user = await userRepository.findUserByUsername(username);
        
        if (!user) {
            return { success: false, message: ERROR_MESSAGES.INVALID_USERNAME };
        }        
        // Verify password with bcrypt
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return { success: false, message: ERROR_MESSAGES.INVALID_PASSWORD };
        }
          // Generate JWT token
        const token: string = jwt.sign(
            { userId: user.id, username: user.username, role: user.roleId }, 
            JWT_SECRET, 
            { expiresIn: JWT_EXPIRY }
        );

        // Return login response using the interface
        return { 
            success: true, 
            data: { token } 
        };
    } catch (error) {
        console.error('Authentication error:', error);
        return { success: false, message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR };
    }
};

/**
 * Create a new user
 * @param {Object} data - User data
 * @param {string} data.username - Username
 * @param {string} data.email - Email
 * @param {string} data.password - Password
 * @param {number} data.roleId - Role ID
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */

/**
 * Get user profile from token
 * @param {string} token - JWT token
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */
interface Permission {
    id: number;
    code: string;
    name: string;
    category: string;
}

interface Role {
    id: number;
    code: string;
    name: string;
}

interface UserProfile {
    id: number;
    username: string;
    email: string;
    isActive: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    updatedAt: Date;
    roleId: number;
    stateId: number | null;
    districtId: number | null;
    zoneId: number | null;
    divisionId: number | null;
    policeStationId: number | null;
    role: Role;
    permissions: Permission[];
}

interface GetUserProfileResponse {
    success: boolean;
    data?: UserProfile;
    message?: string;
}

interface JwtPayload {
    userId: number;
    username: string;
    role: number;
    iat?: number;
    exp?: number;
}

const getUserProfile = async (token: string): Promise<GetUserProfileResponse> => {
    try {
        // Verify token
        const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
        
        // Get user data with role information using the repository
        const user = await userRepository.getUserWithRoleAndPermissions(decoded.userId);
        
        if (!user) {
            return { success: false, message: ERROR_MESSAGES.USER_NOT_FOUND };
        }

        // Extract permissions from role
        const permissions = user.role?.rolePermissions.map((rp) => ({
            id: rp.permission.id,
            code: rp.permission.code,
            name: rp.permission.name,
            category: rp.permission.category
        })) || [];

        // Return user profile with all user fields and role/permissions data
        return { 
            success: true, 
            data: { 
                id: user.id, 
                username: user.username, 
                email: user.email,
                isActive: user.isActive,
                lastLogin: user.lastLogin,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                roleId: user.roleId,
                stateId: user.stateId,
                districtId: user.districtId,
                zoneId: user.zoneId,
                divisionId: user.divisionId,
                policeStationId: user.policeStationId,
                role: {
                    id: user.role?.id,
                    code: user.role?.code,
                    name: user.role?.name
                },
                permissions: permissions
            } 
        };
    } catch (error) {
        console.error('Get user profile error:', error);
        return { success: false, message: ERROR_MESSAGES.INVALID_TOKEN };
    }
};

/**
 * Extract token from authorization header
 * @param {string|undefined} authHeader - Authorization header
 * @returns {string|null} - JWT token or null
 */
interface ExtractTokenFromHeader {
    (authHeader: string | undefined): string | null;
}

const extractTokenFromHeader: ExtractTokenFromHeader = (authHeader) => {
    if (!authHeader) {
        return null;
    }
    return authHeader.replace('Bearer ', '');
};

module.exports = {
  authenticateUser,
  getUserProfile,
  extractTokenFromHeader
};
