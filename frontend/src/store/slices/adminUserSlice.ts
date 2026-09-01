import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  username: string;
  role: string;
  roleName: string;
  location?: string;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
}

interface AdminUserState {
  users: AdminUser[];
  loading: boolean;
  error: string | null;
  filters: {
    searchQuery: string;
    roleFilter: string;
    statusFilter: string;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
  };
  selectedUsers: string[];
}

const initialState: AdminUserState = {
  users: [],
  loading: false,
  error: null,
  filters: {
    searchQuery: '',
    roleFilter: '',
    statusFilter: '',
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalItems: 0,
  },
  selectedUsers: [],
};

const adminUserSlice = createSlice({
  name: 'adminUsers',
  initialState,
  reducers: {
    setUsers: (state, action: PayloadAction<AdminUser[]>) => {
      state.users = action.payload;
    },
    addUser: (state, action: PayloadAction<AdminUser>) => {
      state.users.push(action.payload);
    },
    updateUser: (state, action: PayloadAction<AdminUser>) => {
      const index = state.users.findIndex(user => user.id === action.payload.id);
      if (index !== -1) {
        state.users[index] = action.payload;
      }
    },
    removeUser: (state, action: PayloadAction<string>) => {
      state.users = state.users.filter(user => user.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<AdminUserState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Partial<AdminUserState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    setSelectedUsers: (state, action: PayloadAction<string[]>) => {
      state.selectedUsers = action.payload;
    },
    toggleUserSelection: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      const index = state.selectedUsers.indexOf(userId);
      if (index > -1) {
        state.selectedUsers.splice(index, 1);
      } else {
        state.selectedUsers.push(userId);
      }
    },
    clearSelectedUsers: (state) => {
      state.selectedUsers = [];
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.currentPage = 1;
    },
  },
});

export const {
  setUsers,
  addUser,
  updateUser,
  removeUser,
  setLoading,
  setError,
  setFilters,
  setPagination,
  setSelectedUsers,
  toggleUserSelection,
  clearSelectedUsers,
  resetFilters,
} = adminUserSlice.actions;

export default adminUserSlice.reducer;

// Selectors
export const selectAdminUsers = (state: { adminUsers: AdminUserState }) => state.adminUsers.users;
export const selectAdminUsersLoading = (state: { adminUsers: AdminUserState }) => state.adminUsers.loading;
export const selectAdminUsersError = (state: { adminUsers: AdminUserState }) => state.adminUsers.error;
export const selectAdminUsersFilters = (state: { adminUsers: AdminUserState }) => state.adminUsers.filters;
export const selectAdminUsersPagination = (state: { adminUsers: AdminUserState }) => state.adminUsers.pagination;
export const selectSelectedUsers = (state: { adminUsers: AdminUserState }) => state.adminUsers.selectedUsers; 