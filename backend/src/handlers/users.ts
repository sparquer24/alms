import { APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda';
// import { validateUserInput } from '../validators/validateUserInput';
import { login, logout } from '../services/users';
import { standardResponse } from '../response/standardResponse';
interface ValidationError {
    message: string;
}
import { CustomError } from '../utils/CustomError';


export const loginHandler: APIGatewayProxyHandler = async (event: any): Promise<APIGatewayProxyResult> => {
    try {
        const { username, password } = event.body;

        // Validate input
        if (!username || typeof username !== 'string') {
            return standardResponse.error('Username is required and must be a string');
        }

        if (!password || typeof password !== 'string') {
            return standardResponse.error('Password is required and must be a string');
        }

        // Call service layer for authentication
        const [errLogin, responseLogin] = await login(username, password);
        if (errLogin) {
            return standardResponse.error(errLogin.message);
        }

        return standardResponse.success(responseLogin);
    } catch (err) {
        console.error('Error in loginHandler:', err);
        return standardResponse.error('Internal server error');
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