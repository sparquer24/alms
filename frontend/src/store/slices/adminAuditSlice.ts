import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  details: string;
  applicationId?: string;
  timestamp: string;
  ipAddress: string;
  userAgent: string;
}

interface AdminAuditState {
  logs: AuditLog[];
  loading: boolean;
  error: string | null;
  filters: {
    searchQuery: string;
    userFilter: string;
    actionFilter: string;
    startDate: string;
    endDate: string;
  };
  pagination: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
  };
}

const initialState: AdminAuditState = {
  logs: [],
  loading: false,
  error: null,
  filters: {
    searchQuery: '',
    userFilter: '',
    actionFilter: '',
    startDate: '',
    endDate: '',
  },
  pagination: {
    currentPage: 1,
    totalPages: 1,
    pageSize: 10,
    totalItems: 0,
  },
};

const adminAuditSlice = createSlice({
  name: 'adminAudit',
  initialState,
  reducers: {
    setLogs: (state, action: PayloadAction<AuditLog[]>) => {
      state.logs = action.payload;
    },
    addLog: (state, action: PayloadAction<AuditLog>) => {
      state.logs.unshift(action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<AdminAuditState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    setPagination: (state, action: PayloadAction<Partial<AdminAuditState['pagination']>>) => {
      state.pagination = { ...state.pagination, ...action.payload };
    },
    resetFilters: (state) => {
      state.filters = initialState.filters;
      state.pagination.currentPage = 1;
    },
  },
});

export const {
  setLogs,
  addLog,
  setLoading,
  setError,
  setFilters,
  setPagination,
  resetFilters,
} = adminAuditSlice.actions;

export default adminAuditSlice.reducer;

// Selectors
export const selectAdminAuditLogs = (state: { adminAudit: AdminAuditState }) => state.adminAudit.logs;
export const selectAdminAuditLoading = (state: { adminAudit: AdminAuditState }) => state.adminAudit.loading;
export const selectAdminAuditError = (state: { adminAudit: AdminAuditState }) => state.adminAudit.error;
export const selectAdminAuditFilters = (state: { adminAudit: AdminAuditState }) => state.adminAudit.filters;
export const selectAdminAuditPagination = (state: { adminAudit: AdminAuditState }) => state.adminAudit.pagination; 