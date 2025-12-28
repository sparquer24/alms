export const ERROR_MESSAGES = {
  CREDENTIALS_REQUIRED: 'Username and password are required',
  INVALID_CREDENTIALS: 'Invalid username or password',
  ROLE_INACTIVE: 'Login failed - role inactive ',
  USER_NOT_FOUND: 'User not found',
  INTERNAL_SERVER_ERROR: 'Internal server error',
  UNAUTHORIZED: 'Unauthorized access',
  TOKEN_EXPIRED: 'Token has expired',
  INVALID_TOKEN: 'Invalid token provided'
} as const;

export const ROLE_CODES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN'
} as const;
