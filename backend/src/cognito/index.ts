import * as AmazonCognitoIdentity from 'amazon-cognito-identity-js';
import * as AWS from 'aws-sdk';


AWS.config.update({ region: 'ap-south-1' });

// Example credentials for debugging (replace these with actual environment variables or config)
const USER_POOL_ID = process.env.USER_POOL_ID ;
const CLIENT_ID = process.env.CLIENT_ID;


export const authenticateUser = async (username: string, password: string): Promise<any> => {
    try {
        if (!USER_POOL_ID || !CLIENT_ID) {
            return [{ message: 'Both UserPoolId, ClientId, and ClientSecret are required'}, null];

        }

        // Create a custom authentication details object
        const authDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: username,
            Password: password
        });

        // Manually add SECRET_HASH to authParameters
        (authDetails as any).authParameters = {
            USERNAME: username,
            PASSWORD: password,
        };

        const poolData = {
            UserPoolId: USER_POOL_ID,
            ClientId: CLIENT_ID,
        };

        const userPool = new AmazonCognitoIdentity.CognitoUserPool(poolData);
        
        const cognitoUser = new AmazonCognitoIdentity.CognitoUser({
            Username: username,
            Pool: userPool,
        });
        
        const data = await new Promise((resolve, reject) => {
            cognitoUser.authenticateUser(authDetails, {
                onSuccess: (result) => {
                    const accessToken = result.getAccessToken().getJwtToken();
                    const cognito = new AWS.CognitoIdentityServiceProvider();
                    
                    cognito.getUser({ AccessToken: accessToken }, (err, user) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({ user, accessToken });
                        }
                    });
                },
                onFailure: (err) => {
                    console.error('Authentication failure details:', {
                        code: err.code,
                        name: err.name,
                        message: err.message
                    });
                    reject(err);
                },
            });
        });
        return [null, data];
    } catch (error: any) {
        console.error('Error in authenticateUser:', error);
        return [{ message: error.message }, null];
    }
};