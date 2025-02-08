import { APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda';
// import { validateUserInput } from '../validators/validateUserInput';
import { login, logout } from '../services/users';
import { standardResponse } from '../response/standardResponse';
interface ValidationError {
    message: string;
}
import { CustomError } from '../utils/CustomError';

export const loginHandler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
    try {
        if (!event.body) {
            return standardResponse.badRequest("Request body is missing.");
        }

        const { username, password } = JSON.parse(event.body);

        if (!username || typeof username !== "string" || !password || typeof password !== "string") {
            return standardResponse.error("Invalid username or password format", 400);
        }

        // Call service layer for authentication
        const [errLogin, responseLogin] = await login(username, password);
        if (errLogin) {
            return standardResponse.error(errLogin.message, 401);
        }

        return standardResponse.success(responseLogin);
    } catch (error: any) {
        return standardResponse.error(error.message || "Internal Server Error", error.statusCode || 500);
    }
};



export const logoutHandler: APIGatewayProxyHandler = async (event: any): Promise<APIGatewayProxyResult> => {
    try {
        const accessToken  = event.headers.Authorization || event.headers.authorization;

        // Validate input
        if (!accessToken || typeof accessToken !== 'string') {
            return standardResponse.error('Access token is required and must be a string');
        }

        // Call service layer for logout
        const [errLogout, responseLogout] = await logout(accessToken);
        if (errLogout) {
            return standardResponse.error(errLogout.message);
        }

        return standardResponse.success(responseLogout);
    } catch (err) {
        console.error('Error in logoutHandler:', err);
        return standardResponse.error('Internal server error');
    }
};