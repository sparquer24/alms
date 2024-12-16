import { authenticateUser, logoutUser } from '../cognito/index';

export const login = async (username: string, password: string) => {
    try {
        const [errAuthenticateUser, seccessAuthenticateUser] = await authenticateUser(username, password);

        if (errAuthenticateUser) {
            return [errAuthenticateUser];
        }
        return [null, seccessAuthenticateUser];
    } catch (err:any) {
        console.error('Error in validateUserService:', err);
        return [{message: err.message}];
    }
};

export const logout = async (accessToken: string) => {
    try {
        const [errLogoutUser, successLogoutUser] = await logoutUser(accessToken);

        if (errLogoutUser) {
            return [errLogoutUser];
        }
        return [null, successLogoutUser];
    } catch (err:any) {
        console.error('Error in logoutUserService:', err);
        return [{message: err.message}];
    }
}
