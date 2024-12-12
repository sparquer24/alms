import { authenticateUser } from '../cognito/index';

export const login = async (username: string, password: string) => {
    try {
        const [errAuthenticateUser, seccessAuthenticateUser] = await authenticateUser(username, password);

        if (errAuthenticateUser) {
            return [errAuthenticateUser];
        }
        l = 5
        return [null, seccessAuthenticateUser];
    } catch (err:any) {
        console.error('Error in validateUserService:', err);
        return [{message: err.message}];
    }
};