// Auth Response Types
export interface LoginResponse {
  token: string;
}

export interface PermissionResponse {
  id: number;
  code: string;
  name: string;
  category: string;
}

export interface RoleResponse {
  id: number;
  code: string;
  name: string;
}

export interface UserProfileResponse {
  id: number;
  username: string;
  email: string;
  role: RoleResponse;
  permissions: PermissionResponse[];
}

export interface ErrorResponse {
  message: string;
}
