import { apiClient } from '../../config/authenticatedApiClient';

export interface CreateActionParams {
  name: string;
  code: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateActionParams {
  name?: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface ActionQueryParams {
  search?: string;
  status?: 'active' | 'inactive' | 'all';
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface Action {
  id: number;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActionFormData {
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

export interface RoleActionMapping {
  id: number;
  roleId: number;
  actionId: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  action: Action;
}

export interface BulkAssignResult {
  created: number;
  skipped: number;
  errors: string[];
}

export interface RoleWithActionCount {
  id: number;
  name: string;
  code: string;
  is_active: boolean;
  _count: {
    rolesActionsMapping: number;
    users: number;
  };
}

export interface MasterEntity {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  isActive: boolean;
  positiveAction?: string | null;
  negativeAction?: string | null;
  thirdAction?: string | null;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '');

export const AdminActionService = {
  // ===================== ACTION CRUD =====================
  getAllActions: async (params: ActionQueryParams = {}): Promise<PaginatedResponse<Action>> => {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== 'all') {
        queryString.append(key, String(value));
      }
    });
    const response = await apiClient.get('/actiones/admin/all?' + queryString.toString());
    return response as PaginatedResponse<Action>;
  },

  getActionById: async (id: number): Promise<Action> => {
    const response = await apiClient.get('/actiones/' + id);
    return response as Action;
  },

  createAction: async (data: CreateActionParams): Promise<Action> => {
    const response = await apiClient.post('/actiones/entity', data);
    return response as Action;
  },

  updateAction: async (id: number, data: UpdateActionParams): Promise<Action> => {
    const response = await apiClient.put('/actiones/' + id, data);
    return response as Action;
  },

  toggleActionStatus: async (id: number): Promise<Action> => {
    const response = await apiClient.put('/actiones/' + id + '/toggle-status', {});
    return response as Action;
  },

  deleteAction: async (id: number): Promise<Action> => {
    const response = await apiClient.delete('/actiones/' + id);
    return response as Action;
  },

  // ===================== ROLE-ACTION MAPPING =====================
  getRoleActionMappings: async (
    roleId: number,
    applicationTypeId?: number,
    categoryId?: number,
  ): Promise<{ role: any; mappings: RoleActionMapping[] }> => {
    const queryString = new URLSearchParams();
    if (applicationTypeId) queryString.append('applicationTypeId', String(applicationTypeId));
    if (categoryId) queryString.append('categoryId', String(categoryId));
    const qs = queryString.toString();
    const url = '/actiones/roles/' + roleId + '/mappings' + (qs ? '?' + qs : '');
    const response = await apiClient.get(url);
    return response as { role: any; mappings: RoleActionMapping[] };
  },

  getAvailableActionsForRole: async (
    roleId: number,
    applicationTypeId?: number,
    categoryId?: number,
  ): Promise<Action[]> => {
    const queryString = new URLSearchParams();
    if (applicationTypeId) queryString.append('applicationTypeId', String(applicationTypeId));
    if (categoryId) queryString.append('categoryId', String(categoryId));
    const qs = queryString.toString();
    const url = '/actiones/roles/' + roleId + '/available' + (qs ? '?' + qs : '');
    const response = await apiClient.get(url);
    return response as Action[];
  },

  bulkAssignActions: async (
    roleId: number,
    actionIds: number[],
    applicationTypeId?: number,
    categoryId?: number,
  ): Promise<BulkAssignResult> => {
    const response = await apiClient.post('/actiones/roles/' + roleId + '/mappings/bulk', {
      actionIds,
      applicationTypeId,
      categoryId,
    });
    return response as BulkAssignResult;
  },

  removeActionFromRole: async (
    roleId: number,
    actionId: number,
    applicationTypeId?: number,
    categoryId?: number,
  ): Promise<void> => {
    const queryString = new URLSearchParams();
    if (applicationTypeId) queryString.append('applicationTypeId', String(applicationTypeId));
    if (categoryId) queryString.append('categoryId', String(categoryId));
    const qs = queryString.toString();
    const url = '/actiones/roles/' + roleId + '/mappings/' + actionId + (qs ? '?' + qs : '');
    await apiClient.delete(url);
  },

  getRolesWithActionCounts: async (
    params: { search?: string; page?: number; limit?: number } = {},
  ): Promise<PaginatedResponse<RoleWithActionCount>> => {
    const queryString = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) queryString.append(key, String(value));
    });
    const response = await apiClient.get('/actiones/roles/overview?' + queryString.toString());
    return response as PaginatedResponse<RoleWithActionCount>;
  },

  // ===================== MASTER DATA APIs =====================
  getApplicationTypes: async (activeOnly = false): Promise<MasterEntity[]> => {
    const response = await fetch(`${API_BASE}/application-types${activeOnly ? '?activeOnly=true' : ''}`);
    const json = await response.json();
    return json.data || [];
  },

  createApplicationType: async (data: Partial<MasterEntity>): Promise<MasterEntity> => {
    const response = await fetch(`${API_BASE}/application-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return (await response.json()).data;
  },

  updateApplicationType: async (id: number, data: Partial<MasterEntity>): Promise<MasterEntity> => {
    const response = await fetch(`${API_BASE}/application-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return (await response.json()).data;
  },

  deleteApplicationType: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/application-types/${id}`, { method: 'DELETE' });
  },

  getCategories: async (activeOnly = false): Promise<MasterEntity[]> => {
    const response = await fetch(`${API_BASE}/categories${activeOnly ? '?activeOnly=true' : ''}`);
    const json = await response.json();
    return json.data || [];
  },

  createCategory: async (data: Partial<MasterEntity>): Promise<MasterEntity> => {
    const response = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return (await response.json()).data;
  },

  updateCategory: async (id: number, data: Partial<MasterEntity>): Promise<MasterEntity> => {
    const response = await fetch(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return (await response.json()).data;
  },

  deleteCategory: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/categories/${id}`, { method: 'DELETE' });
  },

  getWorkflows: async (activeOnly = false): Promise<MasterEntity[]> => {
    const response = await fetch(`${API_BASE}/workflows-master${activeOnly ? '?activeOnly=true' : ''}`);
    const json = await response.json();
    return json.data || [];
  },

  createWorkflow: async (data: Partial<MasterEntity>): Promise<MasterEntity> => {
    const response = await fetch(`${API_BASE}/workflows-master`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return (await response.json()).data;
  },

  updateWorkflow: async (id: number, data: Partial<MasterEntity>): Promise<MasterEntity> => {
    const response = await fetch(`${API_BASE}/workflows-master/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return (await response.json()).data;
  },

  deleteWorkflow: async (id: number): Promise<void> => {
    await fetch(`${API_BASE}/workflows-master/${id}`, { method: 'DELETE' });
  },
};
