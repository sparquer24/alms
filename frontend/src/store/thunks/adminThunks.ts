import { createAsyncThunk } from '@reduxjs/toolkit';
import { AdminUserService, CreateUserParams, UpdateUserParams, UserQueryParams } from '../../services/admin/users';
import { AdminRoleService, CreateRoleParams, UpdateRoleParams, RoleQueryParams } from '../../services/admin/roles';
import { AdminAuditService, AuditQueryParams } from '../../services/admin/audit';
import {
  setUsers,
  setLoading,
  setError,
  addUser,
  updateUser,
  removeUser,
  setPagination,
  setFilters
} from '../slices/adminUserSlice';
import {
  setRoles,
  setLoading as setRolesLoading,
  setError as setRolesError,
  addRole,
  updateRole,
  removeRole,
  updateRolePermissions,
  setPagination as setRolesPagination,
  setFilters as setRolesFilters
} from '../slices/adminRoleSlice';
import {
  setLogs,
  setLoading as setAuditLoading,
  setError as setAuditError,
  setPagination as setAuditPagination,
  setFilters as setAuditFilters
} from '../slices/adminAuditSlice';

// User Management Thunks
export const fetchUsers = createAsyncThunk(
  'adminUsers/fetchUsers',
  async (params: UserQueryParams, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response: any = await AdminUserService.getUsers(params);

      if (response.success) {
        dispatch(setUsers(response.body.users || []));
        dispatch(setPagination({
          currentPage: response.body.currentPage || 1,
          totalPages: response.body.totalPages || 1,
          pageSize: response.body.pageSize || 10,
          totalItems: response.body.totalItems || 0,
        }));
        return response.body;
      } else {
        throw new Error(response.message || 'Failed to fetch users');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch users';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const createUser = createAsyncThunk(
  'adminUsers/createUser',
  async (userData: CreateUserParams, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response: any = await AdminUserService.createUser(userData);

      if (response.success) {
        dispatch(addUser(response.body));
        return response.body;
      } else {
        throw new Error(response.message || 'Failed to create user');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const updateUserAction = createAsyncThunk(
  'adminUsers/updateUser',
  async ({ id, userData }: { id: string; userData: UpdateUserParams }, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response: any = await AdminUserService.updateUser(id, userData);

      if (response.success) {
        dispatch(updateUser(response.body));
        return response.body;
      } else {
        throw new Error(response.message || 'Failed to update user');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

export const deleteUser = createAsyncThunk(
  'adminUsers/deleteUser',
  async (id: string, { dispatch }) => {
    try {
      dispatch(setLoading(true));
      dispatch(setError(null));

      const response: any = await AdminUserService.deleteUser(id);

      if (response.success) {
        dispatch(removeUser(id));
        return response.body;
      } else {
        throw new Error(response.message || 'Failed to delete user');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      dispatch(setError(errorMessage));
      throw error;
    } finally {
      dispatch(setLoading(false));
    }
  }
);

// Role Management Thunks
export const fetchRoles = createAsyncThunk(
  'adminRoles/fetchRoles',
  async (params: RoleQueryParams, { dispatch }) => {
    try {
      dispatch(setRolesLoading(true));
      dispatch(setRolesError(null));

      const response: any = await AdminRoleService.getRoles(params);

      if (response.success) {
        dispatch(setRoles(response.body.roles || []));
        dispatch(setRolesPagination({
          currentPage: response.body.currentPage || 1,
          totalPages: response.body.totalPages || 1,
          pageSize: response.body.pageSize || 10,
          totalItems: response.body.totalItems || 0,
        }));
        return response.body;
      } else {
        throw new Error(response.message || 'Failed to fetch roles');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch roles';
      dispatch(setRolesError(errorMessage));
      throw error;
    } finally {
      dispatch(setRolesLoading(false));
    }
  }
);

export const createRole = createAsyncThunk(
  'adminRoles/createRole',
  async (roleData: CreateRoleParams, { dispatch }) => {
    try {
      dispatch(setRolesLoading(true));
      dispatch(setRolesError(null));

      const response: any = await AdminRoleService.createRole(roleData);

      if (response.success) {
        dispatch(addRole(response.body));
        return response.body;
      } else {
        throw new Error(response.message || 'Failed to create role');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create role';
      dispatch(setRolesError(errorMessage));
      throw error;
    } finally {
      dispatch(setRolesLoading(false));
    }
  }
);

export const updateRoleAction = createAsyncThunk(
  'adminRoles/updateRole',
  async ({ id, roleData }: { id: string; roleData: UpdateRoleParams }, { dispatch }) => {
    try {
      dispatch(setRolesLoading(true));
      dispatch(setRolesError(null));

      const response: any = await AdminRoleService.updateRole(id, roleData);

      if (response.success) {
        dispatch(updateRole(response.body));
        return response.body;
      } else {
        throw new Error(response.message || 'Failed to update role');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update role';
      dispatch(setRolesError(errorMessage));
      throw error;
    } finally {
      dispatch(setRolesLoading(false));
    }
  }
);

export const updateRolePermissionsAction = createAsyncThunk(
  'adminRoles/updatePermissions',
  async ({ id, permissions }: { id: string; permissions: Record<string, boolean> }, { dispatch }) => {
    try {
      dispatch(setRolesLoading(true));
      dispatch(setRolesError(null));

      const response: any = await AdminRoleService.updateRolePermissions(id, permissions);

      if (response.success) {
        dispatch(updateRolePermissions({ roleId: id, permissions }));
        return response.body;
      } else {
        throw new Error(response.message || 'Failed to update role permissions');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update role permissions';
      dispatch(setRolesError(errorMessage));
      throw error;
    } finally {
      dispatch(setRolesLoading(false));
    }
  }
);

export const deleteRole = createAsyncThunk(
  'adminRoles/deleteRole',
  async (id: string, { dispatch }) => {
    try {
      dispatch(setRolesLoading(true));
      dispatch(setRolesError(null));

      const response: any = await AdminRoleService.deleteRole(id);

      if (response.success) {
        dispatch(removeRole(id));
        return response.body;
      } else {
        throw new Error(response.message || 'Failed to delete role');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete role';
      dispatch(setRolesError(errorMessage));
      throw error;
    } finally {
      dispatch(setRolesLoading(false));
    }
  }
);

// Audit Management Thunks
export const fetchAuditLogs = createAsyncThunk(
  'adminAudit/fetchLogs',
  async (params: AuditQueryParams, { dispatch }) => {
    try {
      dispatch(setAuditLoading(true));
      dispatch(setAuditError(null));

      const response: any = await AdminAuditService.getAuditLogs(params);

      if (response.success) {
        dispatch(setLogs(response.body.logs || []));
        dispatch(setAuditPagination({
          currentPage: response.body.currentPage || 1,
          totalPages: response.body.totalPages || 1,
          pageSize: response.body.pageSize || 10,
          totalItems: response.body.totalItems || 0,
        }));
        return response.body;
      } else {
        throw new Error(response.message || 'Failed to fetch audit logs');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch audit logs';
      dispatch(setAuditError(errorMessage));
      throw error;
    } finally {
      dispatch(setAuditLoading(false));
    }
  }
);

export const exportAuditLogs = createAsyncThunk(
  'adminAudit/exportLogs',
  async (params: AuditQueryParams, { dispatch }) => {
    try {
      dispatch(setAuditLoading(true));
      dispatch(setAuditError(null));

      const response: any = await AdminAuditService.exportAuditLogs(params);

      if (response.success) {
        // Create download link for the blob
        const blob = new Blob([response.body], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        return response.body;
      } else {
        throw new Error(response.message || 'Failed to export audit logs');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to export audit logs';
      dispatch(setAuditError(errorMessage));
      throw error;
    } finally {
      dispatch(setAuditLoading(false));
    }
  }
); 