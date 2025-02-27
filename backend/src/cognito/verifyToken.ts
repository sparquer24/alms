import * as jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const COGNITO_USERPOOL_ID = process.env.USER_POOL_ID;
const REGION = process.env.AWS_REGION;

const client = jwksClient({
    jwksUri: `https://cognito-idp.${REGION}.amazonaws.com/${COGNITO_USERPOOL_ID}/.well-known/jwks.json`,
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 10,
});

//  * Fetches the public key based on the token's `kid` (Key ID) from the JWKS endpoin
const getSigningKey = async (header: jwt.JwtHeader): Promise<string> => {
    return new Promise((resolve, reject) => {
        client.getSigningKey(header.kid, (err, key) => {
            if (err || !key) {
                reject(new Error("Unable to retrieve signing key"));
            } else {
                resolve(key.getPublicKey());
            }
        });
    });
};

/**
 * Verifies a JWT token from Cognito
 * @param token - JWT token to verify
 * @returns - Decoded token payload if valid
 */
export const verifyToken = async (token: string): Promise<jwt.JwtPayload> => {
    if (!token) {
        throw new Error("Token is required for verification.");
    }

    const decoded = jwt.decode(token, { complete: true });
    if (!decoded || !decoded.header) {
        throw new Error("Invalid token format.");
    }

    try {
        const publicKey = await getSigningKey(decoded.header);
        return jwt.verify(token, publicKey, {
            algorithms: ["RS256"],
            issuer: `https://cognito-idp.${REGION}.amazonaws.com/${COGNITO_USERPOOL_ID}`,
        }) as jwt.JwtPayload;
    } catch (err:any) {
        if (err.name === "TokenExpiredError") {
            throw new Error("Token has expired. Please log in again.");
        }
        throw new Error("Token verification failed: " + err.message);
    }
};
