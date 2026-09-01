import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AdminRole {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  permissions: Record<string, boolean>;
  userCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AdminRoleState {
  roles: AdminRole[];
  loading: boolean;
  error: string | null;
  filters: {
    searchQuery: string;
    statusFilter: string;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
  };
  selectedRoles: string[];
}

const initialState: AdminRoleState = {
  roles: [],
  loading: false,
  error: null,
  filters: {
    searchQuery: '',
    statusFilter: '',
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalItems: 0,
  },
  selectedRoles: [],
};

const adminRoleSlice = createSlice({
  name: 'adminRoles',
  initialState,
  reducers: {
    setRoles: (state, action: PayloadAction<AdminRole[]>) => {
      state.roles = action.payload;
    },
    addRole: (state, action: PayloadAction<AdminRole>) => {
      state.roles.push(action.payload);
    },
    updateRole: (state, action: PayloadAction<AdminRole>) => {
      const index = state.roles.findIndex(role => role.id === action.payload.id);
      if (index !== -1) {
        state.roles[index] = action.payload;
      }
    },
    removeRole: (state, action: PayloadAction<string>) => {
      state.roles = state.roles.filter(role => role.id !== action.payload);
    },
    updateRolePermissions: (state, action: PayloadAction<{ roleId: string; permissions: Record<string, boolean> }>) => {
      const { roleId, permissions } = action.payload;
      const role = state.roles.find(r => r.id === roleId);
      if (role) {
        role.permissions = permissions;
        role.updatedAt = new Date().toISOString();
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<AdminRoleState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Partial<AdminRoleState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setSelectedRoles: (state, action: PayloadAction<string[]>) => {
      state.selectedRoles = action.payload;
    },
    toggleRoleSelection: (state, action: PayloadAction<string>) => {
      const roleId = action.payload;
      const index = state.selectedRoles.indexOf(roleId);
      if (index > -1) {
        state.selectedRoles.splice(index, 1);
      } else {
        state.selectedRoles.push(roleId);
      }
    },
    clearSelectedRoles: (state) => {
      state.selectedRoles = [];
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.currentPage = 1;
    },
  },
});

export const {
  setRoles,
  addRole,
  updateRole,
  removeRole,
  updateRolePermissions,
  setLoading,
  setError,
  setFilters,
  setPagination,
  setSelectedRoles,
  toggleRoleSelection,
  clearSelectedRoles,
  resetFilters,
} = adminRoleSlice.actions;

export default adminRoleSlice.reducer;

// Selectors
export const selectAdminRoles = (state: { adminRoles: AdminRoleState }) => state.adminRoles.roles;
export const selectAdminRolesLoading = (state: { adminRoles: AdminRoleState }) => state.adminRoles.loading;
export const selectAdminRolesError = (state: { adminRoles: AdminRoleState }) => state.adminRoles.error;
export const selectAdminRolesFilters = (state: { adminRoles: AdminRoleState }) => state.adminRoles.filters;
export const selectAdminRolesPagination = (state: { adminRoles: AdminRoleState }) => state.adminRoles.pagination;
export const selectSelectedRoles = (state: { adminRoles: AdminRoleState }) => state.adminRoles.selectedRoles; 