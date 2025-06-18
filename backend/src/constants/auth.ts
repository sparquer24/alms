export const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';
export const JWT_EXPIRY = '1h';
export const ERROR_MESSAGES = {
  CREDENTIALS_REQUIRED: 'Username and password are required.',
  INVALID_USERNAME: 'Invalid username.',
  INVALID_PASSWORD: 'Invalid password.',
  INTERNAL_SERVER_ERROR: 'Internal server error.',
  NO_TOKEN_PROVIDED: 'No token provided.',
  INVALID_TOKEN: 'Invalid or expired token.',
  USER_NOT_FOUND: 'User not found.',
  LOGOUT_SUCCESS: 'Logged out.'
};
