'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  AdminCard,
  AdminTable,
  AdminToolbar,
  AdminTableSkeleton,
  AdminErrorAlert,
  AdminSectionSkeleton,
} from '@/components/admin';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminSpacing, AdminBorderRadius } from '@/styles/admin-design-system';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

interface Location {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface State extends Location {}
interface District extends Location {
  stateId: number;
}
interface Zone extends Location {
  districtId: number;
}
interface Division extends Location {
  zoneId: number;
}
interface PoliceStation extends Location {
  divisionId: number;
}

type LocationLevel = 'state' | 'district' | 'zone' | 'division' | 'station';
type LocationEntity = State | District | Zone | Division | PoliceStation;

const LOCATION_HIERARCHY: Record<
  LocationLevel,
  { label: string; singular: string; endpoint: string }
> = {
  state: { label: 'States', singular: 'State', endpoint: 'locations/states' },
  district: { label: 'Districts', singular: 'District', endpoint: 'locations/districts' },
  zone: { label: 'Zones', singular: 'Zone', endpoint: 'locations/zones' },
  division: { label: 'Divisions', singular: 'Division', endpoint: 'locations/divisions' },
  station: {
    label: 'Police Stations',
    singular: 'Police Station',
    endpoint: 'locations/police-stations',
  },
};

export default function LocationsManagementPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { colors } = useAdminTheme();

  // Navigation state
  const [currentLevel, setCurrentLevel] = useState<LocationLevel>('state');
  const [selectedPath, setSelectedPath] = useState<Record<LocationLevel, Location | null>>({
    state: null,
    district: null,
    zone: null,
    division: null,
    station: null,
  });

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<LocationEntity | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Reset form
  const resetForm = () => {
    setFormData({ name: '' });
    setEditingItem(null);
    setModalMode('create');
  };

  // Get parent ID based on current level
  const getParentId = (): number | undefined => {
    switch (currentLevel) {
      case 'district':
        return selectedPath.state?.id;
      case 'zone':
        return selectedPath.district?.id;
      case 'division':
        return selectedPath.zone?.id;
      case 'station':
        return selectedPath.division?.id;
      default:
        return undefined;
    }
  };

  const parentId = getParentId();

  // Fetch current level data
  const levelConfig = LOCATION_HIERARCHY[currentLevel];

  // Build fetch URL with correct query parameter names based on level
  let fetchUrl = `${API_BASE_URL}/${levelConfig.endpoint}`;
  if (parentId) {
    const paramMap: Record<LocationLevel, string> = {
      state: '',
      district: 'stateId',
      zone: 'districtId',
      division: 'zoneId',
      station: 'divisionId',
    };
    const paramName = paramMap[currentLevel];
    if (paramName) {
      fetchUrl += `?${paramName}=${parentId}`;
    }
  }

  const {
    data: allItems = [],
    isLoading,
    error,
    refetch,
  } = useQuery<LocationEntity[]>({
    queryKey: [`locations-${currentLevel}`, parentId],
    queryFn: async () => {
      const response = await fetch(fetchUrl);
      if (!response.ok) throw new Error(`Failed to fetch ${levelConfig.label}`);
      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    },
    enabled: currentLevel === 'state' || (parentId !== undefined && parentId !== null),
  });

  // Filtered items based on search query
  const items = useMemo(() => {
    if (!searchQuery.trim()) return allItems;
    return allItems.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allItems, searchQuery]);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch(`${API_BASE_URL}/${levelConfig.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to create location');
      return response.json();
    },
    onSuccess: () => {
      toast.success(`${levelConfig.singular} created successfully`);
      queryClient.invalidateQueries({ queryKey: [`locations-${currentLevel}`] });
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || `Failed to create ${levelConfig.singular.toLowerCase()}`);
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      const response = await fetch(`${API_BASE_URL}/${levelConfig.endpoint}/${editingItem?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to update location');
      return response.json();
    },
    onSuccess: () => {
      toast.success(`${levelConfig.singular} updated successfully`);
      queryClient.invalidateQueries({ queryKey: [`locations-${currentLevel}`] });
      setShowModal(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || `Failed to update ${levelConfig.singular.toLowerCase()}`);
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${API_BASE_URL}/${levelConfig.endpoint}/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete location');
      return response.json();
    },
    onSuccess: () => {
      toast.success(`${levelConfig.singular} deleted successfully`);
      queryClient.invalidateQueries({ queryKey: [`locations-${currentLevel}`] });
    },
    onError: (error: any) => {
      toast.error(error.message || `Failed to delete ${levelConfig.singular.toLowerCase()}`);
    },
  });

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      ...(parentId && { parentId }),
    };

    if (modalMode === 'edit' && editingItem) {
      await updateMutation.mutateAsync(payload);
    } else {
      await createMutation.mutateAsync(payload);
    }
  };

  // Handle edit
  const handleEdit = (item: LocationEntity) => {
    setEditingItem(item);
    setFormData({ name: item.name });
    setModalMode('edit');
    setShowModal(true);
  };

  // Handle delete
  const handleDelete = (id: number) => {
    if (
      window.confirm(`Are you sure you want to delete this ${levelConfig.singular.toLowerCase()}?`)
    ) {
      deleteMutation.mutate(id);
    }
  };

  // Handle navigation to child level
  const handleNavigateToChild = (item: LocationEntity) => {
    const nextLevels: Record<LocationLevel, LocationLevel> = {
      state: 'district',
      district: 'zone',
      zone: 'division',
      division: 'station',
      station: 'station',
    };

    setSelectedPath(prev => ({
      ...prev,
      [currentLevel]: item,
    }));
    setCurrentLevel(nextLevels[currentLevel]);
  };

  // Handle navigate back
  const handleNavigateBack = () => {
    const prevLevels: Record<LocationLevel, LocationLevel | null> = {
      state: null,
      district: 'state',
      zone: 'district',
      division: 'zone',
      station: 'division',
    };

    const prevLevel = prevLevels[currentLevel];
    if (prevLevel) {
      setCurrentLevel(prevLevel);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (allItems.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = allItems.map(item => ({
      ID: item.id,
      Name: item.name,
      'Created At': new Date(item.createdAt).toLocaleDateString(),
      'Updated At': new Date(item.updatedAt).toLocaleDateString(),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, levelConfig.label);
    XLSX.writeFile(workbook, `${levelConfig.label}-${new Date().getTime()}.xlsx`);
    toast.success('Exported successfully');
  };

  // Navigate to a specific level in the hierarchy
  const handleBreadcrumbClick = (level: LocationLevel) => {
    setCurrentLevel(level);
  };

  // Breadcrumb path
  const breadcrumbPath = useMemo(() => {
    const path = [{ level: 'state' as LocationLevel, item: selectedPath.state }];
    if (currentLevel !== 'state' && selectedPath.state) {
      path.push({ level: 'district' as LocationLevel, item: selectedPath.district });
    }
    if (
      (currentLevel === 'zone' || currentLevel === 'division' || currentLevel === 'station') &&
      selectedPath.district
    ) {
      path.push({ level: 'zone' as LocationLevel, item: selectedPath.zone });
    }
    if ((currentLevel === 'division' || currentLevel === 'station') && selectedPath.zone) {
      path.push({ level: 'division' as LocationLevel, item: selectedPath.division });
    }
    if (currentLevel === 'station' && selectedPath.division) {
      path.push({ level: 'station' as LocationLevel, item: selectedPath.station });
    }
    return path;
  }, [currentLevel, selectedPath]);

  const isSaving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const canNavigateToChild = currentLevel !== 'station' && items.length > 0;

  return (
    <div style={{ padding: AdminSpacing.lg }}>
      {/* Header Section with Gradient Background */}
      <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6'>
        <div className='bg-[#001F54] text-white px-6 py-8'>
          <div className='text-white'>
            <h1 className='text-3xl font-bold mb-2'>Locations Management</h1>
            <p className='text-blue-100 text-lg'>
              Manage the hierarchical location structure
            </p>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {breadcrumbPath.length > 1 && (
        <div
          style={{
            marginBottom: AdminSpacing.lg,
            display: 'flex',
            alignItems: 'center',
            gap: AdminSpacing.md,
          }}
        >
          <button
            onClick={handleNavigateBack}
            style={{
              padding: '8px 16px',
              backgroundColor: colors.border,
              color: colors.text.primary,
              border: 'none',
              borderRadius: AdminBorderRadius.md,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            ← Back
          </button>
          <div
            style={{
              fontSize: '14px',
              color: colors.text.secondary,
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '4px',
            }}
          >
            <strong>Manage the hierarchical location structure</strong>
            <br />
            {breadcrumbPath.map((item, idx) => (
              <span key={item.level} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                {idx > 0 && <span>/</span>}
                <button
                  onClick={() => handleBreadcrumbClick(item.level)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: colors.text.primary,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '14px',
                    fontWeight: 500,
                    padding: '0',
                  }}
                >
                  {item.item?.name}
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && <AdminErrorAlert message={(error as Error).message} title={''} />}

      {/* Main Content Card */}
      <AdminCard title={levelConfig.label}>
        {/* Toolbar with buttons and search */}
        <div style={{ marginBottom: AdminSpacing.lg, display: 'flex', gap: AdminSpacing.md, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            disabled={isSaving || (currentLevel !== 'state' && !parentId)}
            style={{
              padding: '10px 20px',
              backgroundColor: colors.status.success,
              color: '#ffffff',
              border: 'none',
              borderRadius: AdminBorderRadius.md,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              opacity: isSaving || (currentLevel !== 'state' && !parentId) ? 0.6 : 1,
            }}
          >
            + Create
          </button>
          <button
            onClick={handleExportExcel}
            disabled={allItems.length === 0}
            style={{
              padding: '10px 20px',
              backgroundColor: colors.status.info,
              color: '#ffffff',
              border: 'none',
              borderRadius: AdminBorderRadius.md,
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
              opacity: allItems.length === 0 ? 0.6 : 1,
            }}
          >
            ⬇ Excel Download
          </button>
          
          {/* Search Bar */}
          <div style={{ marginLeft: 'auto', position: 'relative', minWidth: '300px' }}>
            <input
              type="text"
              placeholder={`Search ${levelConfig.label.toLowerCase()}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 40px 10px 16px',
                border: `1px solid ${colors.border}`,
                borderRadius: AdminBorderRadius.md,
                fontSize: '14px',
                outline: 'none',
                backgroundColor: colors.background,
                color: colors.text.primary,
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: colors.text.secondary,
                  fontSize: '18px',
                  padding: '0',
                  lineHeight: '1',
                }}
                title="Clear search"
              >
                ✕
              </button>
            )}
            {!searchQuery && (
              <span
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: colors.text.secondary,
                  fontSize: '18px',
                  pointerEvents: 'none',
                }}
              >
                🔍
              </span>
            )}
          </div>
        </div>
        
        {/* Search Results Info */}
        {searchQuery && (
          <div style={{ marginBottom: AdminSpacing.md, fontSize: '14px', color: colors.text.secondary }}>
            {items.length > 0 ? (
              <span>Found {items.length} result{items.length !== 1 ? 's' : ''} for "{searchQuery}"</span>
            ) : (
              <span>No results found for "{searchQuery}"</span>
            )}
          </div>
        )}

        {/* Loading State */}
        {isLoading && <AdminTableSkeleton />}

        {/* Empty State */}
        {!isLoading && items.length === 0 && (
          <div
            style={{ textAlign: 'center', padding: AdminSpacing.xl, color: colors.text.secondary }}
          >
            <p style={{ fontSize: '16px', margin: '0 0 8px 0' }}>
              No {levelConfig.label.toLowerCase()} found
            </p>
            <p style={{ fontSize: '14px', margin: 0 }}>Create one to get started</p>
          </div>
        )}

        {/* Data Table */}
        {!isLoading && items.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr
                  style={{
                    backgroundColor: colors.surface,
                    borderBottom: `1px solid ${colors.border}`,
                  }}
                >
                  <th style={{ padding: AdminSpacing.md, textAlign: 'left', fontWeight: 600 }}>
                    ID
                  </th>
                  <th style={{ padding: AdminSpacing.md, textAlign: 'left', fontWeight: 600 }}>
                    Name
                  </th>
                  <th style={{ padding: AdminSpacing.md, textAlign: 'left', fontWeight: 600 }}>
                    Created At
                  </th>
                  <th style={{ padding: AdminSpacing.md, textAlign: 'left', fontWeight: 600 }}>
                    Updated At
                  </th>
                  <th style={{ padding: AdminSpacing.md, textAlign: 'center', fontWeight: 600 }}>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: `1px solid ${colors.border}`,
                      backgroundColor: idx % 2 === 0 ? colors.background : colors.surface,
                      cursor: canNavigateToChild ? 'pointer' : 'default',
                    }}
                    onClick={() => canNavigateToChild && handleNavigateToChild(item)}
                  >
                    <td style={{ padding: AdminSpacing.md }}>{item.id}</td>
                    <td style={{ padding: AdminSpacing.md, fontWeight: 500 }}>{item.name}</td>
                    <td style={{ padding: AdminSpacing.md, color: colors.text.secondary }}>
                      {new Date(item.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: AdminSpacing.md, color: colors.text.secondary }}>
                      {new Date(item.updatedAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: AdminSpacing.md, textAlign: 'center' }}>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleEdit(item);
                        }}
                        style={{
                          padding: '6px 12px',
                          marginRight: '8px',
                          backgroundColor: colors.status.info,
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: AdminBorderRadius.sm,
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                        }}
                      >
                        Edit
                      </button>
                      {/* <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDeactivate(item.id);
                        }}
                        disabled={softDeleteMutation.isPending}
                        style={{
                          padding: '6px 12px',
                          backgroundColor: colors.status.error,
                          color: '#ffffff',
                          border: 'none',
                          borderRadius: AdminBorderRadius.sm,
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: 600,
                          opacity: softDeleteMutation.isPending ? 0.6 : 1,
                        }}
                      >
                        Deactivate
                      </button> */}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminCard>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => !isSaving && setShowModal(false)}
        >
          <div
            style={{ maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <AdminCard
              title={
                modalMode === 'create'
                  ? `Create ${levelConfig.singular}`
                  : `Edit ${levelConfig.singular}`
              }
              onClick={() => undefined}
            >
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: AdminSpacing.lg }}>
                  <label
                    style={{ display: 'block', marginBottom: AdminSpacing.sm, fontWeight: 600 }}
                  >
                    Name *
                  </label>
                  <input
                    type='text'
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={`Enter ${levelConfig.singular.toLowerCase()} name`}
                    style={{
                      width: '100%',
                      padding: AdminSpacing.md,
                      border: `1px solid ${colors.border}`,
                      borderRadius: AdminBorderRadius.md,
                      fontSize: '14px',
                    }}
                    disabled={isSaving}
                  />
                </div>

                <div style={{ display: 'flex', gap: AdminSpacing.md, justifyContent: 'flex-end' }}>
                  <button
                    type='button'
                    onClick={() => {
                      setShowModal(false);
                      resetForm();
                    }}
                    disabled={isSaving}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: 'transparent',
                      color: colors.text.secondary,
                      border: `1px solid ${colors.border}`,
                      borderRadius: AdminBorderRadius.md,
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type='submit'
                    disabled={isSaving}
                    style={{
                      padding: '10px 16px',
                      backgroundColor: colors.status.success,
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: AdminBorderRadius.md,
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      opacity: isSaving ? 0.6 : 1,
                    }}
                  >
                    {isSaving ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Update'}
                  </button>
                </div>
              </form>
            </AdminCard>
          </div>
        </div>
      )}
    </div>
  );
}
