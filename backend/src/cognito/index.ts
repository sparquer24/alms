import * as AmazonCognitoIdentity from 'amazon-cognito-identity-js';
import * as AWS from 'aws-sdk';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';
dotenv.config();

AWS.config.update({ region: 'ap-south-1' });

// Example credentials for debugging (replace these with actual environment variables or config)
const USER_POOL_ID = process.env.USER_POOL_ID ;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

export const authenticateUser = async (username: string, password: string): Promise<any> => {
    try {
        if (!USER_POOL_ID || !CLIENT_ID || !CLIENT_SECRET) {
            throw new Error('Both UserPoolId, ClientId, and ClientSecret are required');
        }

        const secretHash = crypto.createHmac('sha256', CLIENT_SECRET)
            .update(username + CLIENT_ID)
            .digest('base64');

        // Set authentication details including SECRET_HASH
        const authDetails = new AmazonCognitoIdentity.AuthenticationDetails({
            Username: username,
            Password: password,
            ValidationData: [],
            ClientMetadata: {
                SECRET_HASH: secretHash, // Add SECRET_HASH here
            },
        });

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
                    console.log({authDetails, result});
                    const accessToken = result.getAccessToken().getJwtToken();
                    const cognito = new AWS.CognitoIdentityServiceProvider();
                    console.log({accessToken})
                    cognito.getUser({ AccessToken: accessToken }, (err, user) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve({ user, accessToken });
                        }
                    });
                },
                onFailure: (err) => {
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