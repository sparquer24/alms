import { APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda';
// import { validateUserInput } from '../validators/validateUserInput';
import { login, logout } from '../services/users';
import { standardResponse } from '../response/standardResponse';
import {LoginRequest} from '../requestBody/login';
import { findUserByCognitoId } from '../repository/users';
interface ValidationError {
    message: string;
}
import { CustomError } from '../utils/CustomError';

export const loginHandler: APIGatewayProxyHandler = async (event): Promise<APIGatewayProxyResult> => {
    try {
        if (!event.body) {
            return standardResponse.badRequest("Request body is missing.");
        }

         // Parse and validate the request payload
        const body: LoginRequest = JSON.parse(event.body);

        if (!body.username || typeof body.username !== "string" || !body.password || typeof body.password !== "string") {
        return standardResponse.error("Invalid username or password format", 400);
        }

        // Call service layer for authentication
        const [errLogin, responseLogin] = await login(body.username, body.password);
        
        if (errLogin) {
        return standardResponse.error(errLogin.message, 401);
        }
        // Extract Cognito ID (sub) from responseLogin.User.UserAttributes
        const userAttributes = responseLogin.user.UserAttributes;
        const userCognitoIdObj = userAttributes.find((attr: { Name: string; Value: string }) => attr.Name === "sub");

        if (!userCognitoIdObj || !userCognitoIdObj.Value) {
            return standardResponse.error("Cognito user ID (sub) not found.", 500);
        }

        const userCognitoId = userCognitoIdObj.Value;
        const user = await findUserByCognitoId(userCognitoId);

        if (!user) {
            return standardResponse.error("User not found in the database", 404);
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