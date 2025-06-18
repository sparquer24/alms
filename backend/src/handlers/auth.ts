import { LoginRequest } from '../request/authRequest';
import { LoginResponse, UserProfileResponse, ErrorResponse } from '../response/authResponse';
const authService = require('../services/authService');
const { ERROR_MESSAGES } = require('../constants/auth');

interface APIGatewayEvent {
    body?: string | null;
    headers: { [key: string]: string | undefined };
}

interface APIResponse {
    statusCode: number;
    body: string;
    headers?: {
        [header: string]: string | number | boolean;
    };
}

/**
 * Helper function to create a standardized API response
 * @param statusCode - HTTP status code
 * @param responseBody - Response body object to be stringified
 * @returns Formatted API response
 */
const createApiResponse = (statusCode: number, responseBody: any): APIResponse => {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Credentials': true,
        },
        body: responseBody,
    };
};

/**
 * Helper function to create error response
 * @param statusCode - HTTP status code
 * @param message - Error message
 * @returns Formatted error response
 */
const createErrorResponse = (statusCode: number, message: string): APIResponse => {
    return createApiResponse(statusCode, { message });
};

/**
 * Login handler
 * @param event - API Gateway event
 * @returns API response
 */
exports.login = async (event: APIGatewayEvent): Promise<APIResponse> => {
    try {
        // Parse request body
        const body: LoginRequest = typeof event.body === 'string' ? JSON.parse(event.body) : event.body || {};
        const { username, password } = body;
        
        // Validate input
        if (!username || !password) {
            return createErrorResponse(400, ERROR_MESSAGES.CREDENTIALS_REQUIRED);
        }        // Process authentication in service
        const result = await authService.authenticateUser({ username, password });
        
        if (!result.success) {
            return createErrorResponse(401, result.message);
        }

        const response: LoginResponse = result.data;
        
        return createApiResponse(200, response);
    } catch (error) {
        console.error('Login Error:', error);
        return createErrorResponse(500, ERROR_MESSAGES.INTERNAL_SERVER_ERROR);
    }
};
/**
 * Logout handler
 * For JWT, logout is handled on the client by deleting the token
 */
exports.logout = async (event: APIGatewayEvent): Promise<APIResponse> => {
    // For JWT, logout is usually handled on the client by deleting the token
    return createApiResponse(200, { message: ERROR_MESSAGES.LOGOUT_SUCCESS });
};

/**
 * Get current user profile
 */
exports.getMe = async (event: APIGatewayEvent): Promise<APIResponse> => {
    // Extract JWT from Authorization header
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader) {
        return createErrorResponse(401, ERROR_MESSAGES.NO_TOKEN_PROVIDED);
    }

    // Extract token
    const token = authService.extractTokenFromHeader(authHeader);
    if (!token) {
        return createErrorResponse(401, ERROR_MESSAGES.NO_TOKEN_PROVIDED);
    }    // Get user profile from service
    const result = await authService.getUserProfile(token);

    if (!result.success) {
        return createErrorResponse(result.message === ERROR_MESSAGES.USER_NOT_FOUND ? 404 : 401, result.message);
    }

    // Return the user data object directly - the API Gateway will handle serialization
    return createApiResponse(200, result.data);
};
