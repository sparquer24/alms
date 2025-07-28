export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: string;
    username: string;
    email?: string;
  };
}

export interface UserProfileResponse {
  id: string;
  username: string;
  email?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ErrorResponse {
  success: false;
  message: string;
  error?: string;
}
