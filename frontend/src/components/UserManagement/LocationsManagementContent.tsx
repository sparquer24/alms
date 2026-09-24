'use client';

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Download, Plus, Eye } from 'lucide-react';
import {
  PageSubHeader,
  SubHeaderButton,
  SubHeaderSearch,
  SubHeaderSelect,
} from '@/components/common/PageSubHeader';
import {
  AdminCard,
  AdminTable,
  AdminToolbar,
  AdminTableSkeleton,
  AdminErrorAlert,
  AdminSectionSkeleton,
} from '@/components/admin';
import { AdminDataTable } from '@/components/tables/AdminDataTable';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminSpacing, AdminBorderRadius } from '@/styles/admin-design-system';
import { ROLE_CODES } from '@/constants';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || '/api').replace(/\/$/, '')

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
interface RangeOffice extends Location {
  districtId: number;
}
interface Zone extends Location {
  rangeOfficeId: number;
}
interface Division extends Location {
  zoneId: number;
}
interface PoliceStation extends Location {
  divisionId: number;
}

type LocationLevel = 'state' | 'district' | 'range' | 'zone' | 'division' | 'station';
type LocationEntity = State | District | RangeOffice | Zone | Division | PoliceStation;

const HIERARCHY_ORDER: LocationLevel[] = ['state', 'district', 'range', 'zone', 'division', 'station'];

// Query param that carries a given level's own id, i.e. the id a *child*
// level uses to filter by this level as its parent (mirrors PARENT_PARAM_NAME
// below, shifted by one position in the hierarchy).
const LEVEL_OWN_ID_PARAM: Partial<Record<LocationLevel, string>> = {
  state: 'stateId',
  district: 'districtId',
  range: 'rangeOfficeId',
  zone: 'zoneId',
  division: 'divisionId',
};

// Query param a given level uses to filter by its parent's id when fetching.
const PARENT_PARAM_NAME: Record<LocationLevel, string> = {
  state: '',
  district: 'stateId',
  range: 'districtId',
  zone: 'rangeOfficeId',
  division: 'zoneId',
  station: 'divisionId',
};

const LOCATION_HIERARCHY: Record<
  LocationLevel,
  { label: string; singular: string; endpoint: string }
> = {
  state: { label: 'States', singular: 'State', endpoint: 'locations/states' },
  district: { label: 'Districts', singular: 'District', endpoint: 'locations/districts' },
  range: { label: 'Range Offices', singular: 'Range Office', endpoint: 'locations/range-offices' },
  zone: { label: 'Zones', singular: 'Zone', endpoint: 'locations/zones' },
  division: { label: 'Divisions', singular: 'Division', endpoint: 'locations/divisions' },
  station: {
    label: 'Police Stations',
    singular: 'Police Station',
    endpoint: 'locations/police-stations',
  },
};

/**
 * Resolve a single location entity by id, for hydrating breadcrumb names
 * from URL-encoded ids (refresh / direct link / browser back-forward).
 * Tries a direct GET /:id first, falling back to fetching the parent-scoped
 * list and finding the matching id in case the API has no singular route.
 */
async function fetchLocationByIdSafe(
  level: LocationLevel,
  id: number,
  parentId?: number
): Promise<Location | null> {
  const cfg = LOCATION_HIERARCHY[level];
  try {
    const res = await fetch(`${API_BASE_URL}/${cfg.endpoint}/${id}`);
    if (res.ok) {
      const json = await res.json();
      const item = json?.data ?? json;
      if (item?.id) return item;
    }
  } catch {}

  try {
    let url = `${API_BASE_URL}/${cfg.endpoint}`;
    if (parentId != null) {
      const paramName = PARENT_PARAM_NAME[level];
      if (paramName) url += `?${paramName}=${parentId}`;
    }
    const res = await fetch(url);
    if (res.ok) {
      const json = await res.json();
      const list = Array.isArray(json) ? json : json?.data || [];
      return list.find((it: any) => it.id === id) || null;
    }
  } catch {}

  return null;
}

export default function LocationsManagementContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { colors } = useAdminTheme();
  const { userRole, user } = useAuth();

  // Get user's stateId - prioritize user object, fallback to cookies
  const getUserStateId = (): number | undefined => {
    // First check user object from auth hook
    if ((user as any)?.location?.state?.id) return (user as any).location.state.id;
    if ((user as any)?.stateId) return (user as any).stateId;
    
    // Fallback: parse cookies directly
    if (typeof document === 'undefined') return undefined;
    
    const getCookieValue = (name: string): string | undefined => {
      return document.cookie
        .split('; ')
        .find(row => row.startsWith(`${name}=`))
        ?.split('=')[1];
    };
    
    // Try user cookie (contains full user object with location data)
    const userCookie = getCookieValue('user');
    if (userCookie) {
      try {
        const userData = JSON.parse(decodeURIComponent(userCookie));
        return userData?.location?.state?.id;
      } catch {}
    }
    
    // Try auth cookie (may be JSON or JWT)
    const authCookie = getCookieValue('auth');
    if (authCookie) {
      try {
        const cookieValue = decodeURIComponent(authCookie);
        
        // Try JSON parse
        try {
          const authData = JSON.parse(cookieValue);
          return authData?.location?.state?.id || authData?.user?.location?.state?.id;
        } catch {
          // Try JWT decode
          if (cookieValue.startsWith('eyJ') && cookieValue.split('.').length >= 2) {
            const payload = JSON.parse(atob(cookieValue.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
            return payload?.state_id || payload?.stateId;
          }
        }
      } catch {}
    }
    
    return undefined;
  };

  const userStateId = getUserStateId();
  const isSuperAdmin = userRole?.toUpperCase() === ROLE_CODES.SUPER_ADMIN;
  const isAdmin = userRole?.toUpperCase() === ROLE_CODES.ADMIN;

  // Navigation state - start with state by default, update based on role
  const [currentLevel, setCurrentLevel] = useState<LocationLevel>('state');
  const [selectedPath, setSelectedPath] = useState<Record<LocationLevel, Location | null>>({
    state: null,
    district: null,
    range: null,
    zone: null,
    division: null,
    station: null,
  });

  // Update current level when role and user are loaded — but only when the
  // URL doesn't already encode a deep-linked/restored level (refresh, direct
  // link, or browser back/forward should win over the role default).
  useEffect(() => {
    if (searchParams?.get('level')) return;
    if (isAdmin && userStateId) {
      setCurrentLevel('district');
    } else if (isSuperAdmin) {
      setCurrentLevel('state');
    }
  }, [isAdmin, isSuperAdmin, userStateId, searchParams]);

  // Tracks whether the *next* searchParams change was caused by our own
  // state->URL push below, so the URL->state hydration effect can ignore it.
  const isInternalNavRef = useRef(false);
  // Tracks whether we've resolved the initial level (from URL or role
  // default) so the state->URL effect doesn't clobber a deep link before
  // hydration has had a chance to run.
  const hasHydratedRef = useRef(false);

  const buildLocationsUrl = useCallback(
    (level: LocationLevel, path: Record<LocationLevel, Location | null>) => {
      const params = new URLSearchParams();
      params.set('level', level);
      const idx = HIERARCHY_ORDER.indexOf(level);
      for (let i = 0; i < idx; i++) {
        const ancestor = HIERARCHY_ORDER[i];
        const paramName = LEVEL_OWN_ID_PARAM[ancestor];
        const id = path[ancestor]?.id;
        if (paramName && id != null) params.set(paramName, String(id));
      }
      return params.toString();
    },
    []
  );

  // URL -> state: hydrate currentLevel/selectedPath from the URL on mount,
  // and whenever the URL changes from outside our own navigation (browser
  // Back/Forward, a direct/refreshed link).
  useEffect(() => {
    if (isInternalNavRef.current) {
      isInternalNavRef.current = false;
      return;
    }

    const levelParam = searchParams?.get('level') as LocationLevel | null;
    if (!levelParam || !HIERARCHY_ORDER.includes(levelParam)) {
      hasHydratedRef.current = true;
      return;
    }

    let cancelled = false;
    (async () => {
      const idx = HIERARCHY_ORDER.indexOf(levelParam);
      const newPath: Record<LocationLevel, Location | null> = {
        state: null,
        district: null,
        range: null,
        zone: null,
        division: null,
        station: null,
      };
      // ADMIN users don't pick a state explicitly — they're scoped to their
      // own userStateId and their hierarchy starts at district. Seed the
      // walk with that implicit parent instead of expecting a `stateId`
      // query param that will never be there.
      let parentId: number | undefined = isAdmin && userStateId ? userStateId : undefined;
      for (let i = 0; i < idx; i++) {
        const ancestor = HIERARCHY_ORDER[i];
        if (ancestor === 'state' && isAdmin) continue;
        const paramName = LEVEL_OWN_ID_PARAM[ancestor];
        const idStr = paramName ? searchParams?.get(paramName) : null;
        if (!idStr) break;
        const item = await fetchLocationByIdSafe(ancestor, Number(idStr), parentId);
        if (!item) break;
        newPath[ancestor] = item;
        parentId = item.id;
      }
      if (cancelled) return;
      setSelectedPath(newPath);
      setCurrentLevel(levelParam);
      hasHydratedRef.current = true;
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams?.toString()]);

  // state -> URL: keep the address bar in sync so refresh/back/forward and
  // shared links restore the exact same hierarchy level and selection.
  useEffect(() => {
    if (!hasHydratedRef.current) return;
    const nextQuery = buildLocationsUrl(currentLevel, selectedPath);
    const currentQuery = searchParams?.toString() ?? '';
    if (nextQuery === currentQuery) return;
    isInternalNavRef.current = true;
    router.push(`${pathname}?${nextQuery}`, { scroll: false });
  }, [currentLevel, selectedPath, buildLocationsUrl, pathname, router, searchParams]);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingItem, setEditingItem] = useState<LocationEntity | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);
  const [assignedUserId, setAssignedUserId] = useState<number | null>(null);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  useEffect(() => {
    if (showModal && modalMode === 'edit' && editingItem) {
      const fetchUsers = async () => {
        setIsLoadingUsers(true);
        try {
          const response = await fetch(
            `${API_BASE_URL}/locations/eligible-users?type=${currentLevel}&id=${editingItem.id}`
          );
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setEligibleUsers(data.eligibleUsers || []);
              setAssignedUserId(data.assignedUser?.id || null);
            }
          }
        } catch (error) {
          console.error('Failed to fetch eligible users', error);
        } finally {
          setIsLoadingUsers(false);
        }
      };
      fetchUsers();
    } else {
      setEligibleUsers([]);
      setAssignedUserId(null);
    }
  }, [showModal, modalMode, editingItem, currentLevel]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Sort & date range filter state
  const [sortBy, setSortBy] = useState<'name_asc' | 'name_desc' | 'newest' | 'oldest'>('name_asc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Reset form
  const resetForm = () => {
    setFormData({ name: '' });
    setEditingItem(null);
    setModalMode('create');
    setEligibleUsers([]);
    setAssignedUserId(null);
  };

  // Get parent ID based on current level
  const getParentId = (): number | undefined => {
    const parentMap = {
      district: selectedPath.state?.id,
      range: selectedPath.district?.id,
      zone: selectedPath.range?.id,
      division: selectedPath.zone?.id,
      station: selectedPath.division?.id,
      state: undefined,
    };
    return parentMap[currentLevel];
  };

  const parentId = getParentId();

  // Fetch current level data
  const levelConfig = LOCATION_HIERARCHY[currentLevel];

  // Build fetch URL with correct query parameter names based on level
  let fetchUrl = `${API_BASE_URL}/${levelConfig.endpoint}`;
  
  // Special handling for ADMIN users - they start at district level with their stateId
  if (isAdmin && currentLevel === 'district' && userStateId) {
    fetchUrl += `?stateId=${userStateId}`;
  } else if (parentId) {
    const paramName = PARENT_PARAM_NAME[currentLevel];
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
    queryKey: [`locations-${currentLevel}`, parentId, userStateId],
    queryFn: async () => {
      const response = await fetch(fetchUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${levelConfig.label}`);
      }
      const data = await response.json();
      return Array.isArray(data) ? data : data.data || [];
    },
    enabled: 
      (currentLevel === 'state' && isSuperAdmin) || 
      (isAdmin && currentLevel === 'district' && !!userStateId) ||
      (parentId !== undefined && parentId !== null),
  });

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Filtered + sorted items based on search query, date range and sort order
  const items = useMemo(() => {
    let result = allItems;

    if (searchQuery.trim()) {
      result = result.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (dateFrom) {
      const fromTime = new Date(dateFrom).getTime();
      result = result.filter(item => new Date(item.createdAt).getTime() >= fromTime);
    }

    if (dateTo) {
      const toTime = new Date(dateTo).getTime() + 24 * 60 * 60 * 1000 - 1;
      result = result.filter(item => new Date(item.createdAt).getTime() <= toTime);
    }

    result = [...result].sort((a, b) => {
      switch (sortBy) {
        case 'name_desc':
          return b.name.localeCompare(a.name);
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name_asc':
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [allItems, searchQuery, dateFrom, dateTo, sortBy]);

  // Pagination
  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, dateFrom, dateTo, sortBy, currentLevel]);

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
      ...(modalMode === 'edit' && { assignedUserId }),
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
    const currentIndex = HIERARCHY_ORDER.indexOf(currentLevel);
    const nextLevel = HIERARCHY_ORDER[currentIndex + 1];

    if (nextLevel) {
      setSelectedPath(prev => ({ ...prev, [currentLevel]: item }));
      setCurrentLevel(nextLevel);
    }
  };

  // Handle navigate back
  const handleNavigateBack = () => {
    const currentIndex = HIERARCHY_ORDER.indexOf(currentLevel);
    if (currentIndex > 0) {
      setCurrentLevel(HIERARCHY_ORDER[currentIndex - 1]);
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (items.length === 0) {
      toast.error('No data to export');
      return;
    }

    const exportData = items.map((item, idx) => ({
      'S.No': idx + 1,
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

  // Breadcrumb path - build hierarchy dynamically
  const breadcrumbPath = useMemo(() => {
    const currentIndex = HIERARCHY_ORDER.indexOf(currentLevel);
    return HIERARCHY_ORDER.slice(0, currentIndex + 1).map(level => ({
      level,
      item: selectedPath[level]
    }));
  }, [currentLevel, selectedPath]);

  const isSaving = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const canNavigateToChild = currentLevel !== 'station' && items.length > 0;

  return (
    <div className="flex flex-col flex-grow min-h-0">
      <PageSubHeader
        title="Locations Management"
        metaBadge={`${levelConfig.label}: ${items.length} Record${items.length !== 1 ? 's' : ''}`}
        actions={
          <>
            {/* Search */}
            <SubHeaderSearch
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={`Search ${levelConfig.label.toLowerCase()} by name...`}
            />

            {/* Sort */}
            <SubHeaderSelect
              value={sortBy}
              onChange={setSortBy}
              ariaLabel="Sort"
              options={[
                { value: 'name_asc', label: 'Name (A-Z)' },
                { value: 'name_desc', label: 'Name (Z-A)' },
                { value: 'newest', label: 'Newest First' },
                { value: 'oldest', label: 'Oldest First' },
              ]}
            />

            {/* Date Range Filter */}
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              title="From date"
              className="h-7 px-2 py-1 rounded-lg bg-[#0F2D52] border border-white/20 text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all cursor-pointer shadow-xs"
            />
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              title="To date"
              className="h-7 px-2 py-1 rounded-lg bg-[#0F2D52] border border-white/20 text-xs text-white font-medium focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37] transition-all cursor-pointer shadow-xs"
            />

            {/* Excel Download */}
            <SubHeaderButton
              onClick={handleExportExcel}
              disabled={allItems.length === 0}
              title="Download Excel"
              icon={<Download className="w-3.5 h-3.5" />}
            >
              <span className="hidden sm:inline">Excel</span>
            </SubHeaderButton>

            {/* Back Button if in sub-level */}
            {breadcrumbPath.length > 1 && (
              <SubHeaderButton
                onClick={handleNavigateBack}
                title="Go back to parent location level"
                icon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Back
              </SubHeaderButton>
            )}

            {/* Create Button (Gold Primary) */}
            <SubHeaderButton
              variant="primary"
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              disabled={isSaving || (currentLevel !== 'state' && !parentId)}
              icon={<Plus className="w-3.5 h-3.5" />}
            >
              Create {levelConfig.label}
            </SubHeaderButton>
          </>
        }
      />

      <div className="flex-grow min-h-0 flex flex-col w-full px-4 sm:px-6 lg:px-8 py-4 space-y-3">
        {/* Breadcrumb Hierarchy Trail */}
        {breadcrumbPath.length > 1 && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: colors.surface,
            padding: `${AdminSpacing.md} ${AdminSpacing.lg}`,
            borderRadius: AdminBorderRadius.lg,
            border: `1px solid ${colors.border}`,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: colors.text.secondary, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Path:</span>
            {breadcrumbPath.map((item, idx) => (
              <span key={item.level} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {idx > 0 && <span style={{ color: colors.text.muted, fontSize: '14px' }}>›</span>}
                <button
                  type="button"
                  onClick={() => handleBreadcrumbClick(item.level)}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: '4px 8px',
                    borderRadius: AdminBorderRadius.md,
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: idx === breadcrumbPath.length - 1 ? colors.status.info : colors.text.primary,
                    backgroundColor: idx === breadcrumbPath.length - 1 ? `${colors.status.info}15` : 'transparent',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (idx < breadcrumbPath.length - 1) {
                      (e.target as HTMLElement).style.backgroundColor = `${colors.hover}`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (idx < breadcrumbPath.length - 1) {
                      (e.target as HTMLElement).style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {item.item?.name || LOCATION_HIERARCHY[item.level].singular}
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Error Alert */}
        {error && <AdminErrorAlert message={(error as Error).message} title={''} />}

        {/* Main Content Card */}
        <AdminCard title={levelConfig.label} fill={!isLoading && items.length > 0}>
        
        {/* Search Results Info and Pagination Info */}
        {(searchQuery || items.length > 0) && (
          <div style={{ marginBottom: AdminSpacing.sm, fontSize: '12px', color: colors.text.secondary, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              {searchQuery && items.length > 0 && <span>Found {items.length} result{items.length !== 1 ? 's' : ''} for "{searchQuery}" • </span>}
              {items.length > 0 && <span>Showing {Math.min((currentPage - 1) * itemsPerPage + 1, items.length)} - {Math.min(currentPage * itemsPerPage, items.length)} of {items.length}</span>}
              {searchQuery && items.length === 0 && <span>No results found for "{searchQuery}"</span>}
            </span>
          </div>
        )}

        {/* Loading State */}
        {isLoading && <AdminTableSkeleton />}

        {/* Empty State */}
        {!isLoading && items.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              padding: `${AdminSpacing.xl} ${AdminSpacing.lg}`,
              backgroundColor: `${colors.status.info}08`,
              borderRadius: AdminBorderRadius.lg,
              border: `1px dashed ${colors.status.info}40`,
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto', color: colors.status.info, opacity: 0.6 }}>
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
              </svg>
            </div>
            <p style={{ fontSize: '16px', margin: '0 0 8px 0', fontWeight: 600, color: colors.text.primary }}>
              No {levelConfig.label.toLowerCase()} yet
            </p>
            <p style={{ fontSize: '13px', margin: 0, color: colors.text.secondary }}>
              Create your first {levelConfig.singular.toLowerCase()} to get started
            </p>
          </div>
        )}

        {/* Data Table */}
        {!isLoading && items.length > 0 && (
          <div className="flex-1 min-h-0">
            <AdminDataTable
              data={paginatedItems}
              columns={[
                {
                  key: 'sno',
                  header: 'S.No',
                  render: (_, row) => {
                    const idx = paginatedItems.findIndex(item => item.id === row.id);
                    return (currentPage - 1) * itemsPerPage + Math.max(0, idx) + 1;
                  },
                  width: '80px'
                },
                {
                  key: 'name',
                  header: levelConfig.singular,
                  sortable: true
                },
                {
                  key: 'createdAt',
                  header: 'Created',
                  render: (val) => new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                },
                {
                  key: 'updatedAt',
                  header: 'Updated',
                  render: (val) => new Date(val).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                }
              ]}
              pagination={{
                currentPage,
                totalPages,
                totalItems: items.length,
                pageSize: itemsPerPage,
                onPageChange: setCurrentPage
              }}
              rowActions={[
                ...(canNavigateToChild ? [{
                  label: (
                    <span className="flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> View
                    </span>
                  ),
                  onClick: (item: any) => handleNavigateToChild(item),
                  variant: 'primary' as const
                }] : []),
                {
                  label: 'Edit',
                  onClick: (item: any) => handleEdit(item),
                  variant: 'secondary' as const
                }
              ]}
              className="border-none shadow-none h-full"
            />
          </div>
        )}
        </AdminCard>
      </div>

      {/* Modal */}
      {showModal && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={() => !isSaving && setShowModal(false)}
        >
          <div
            style={{
              maxWidth: '520px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              backgroundColor: colors.surface,
              borderRadius: AdminBorderRadius.lg,
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.15)',
              animation: 'slideUp 0.3s ease-out',
            }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <style>{`
              @keyframes slideUp {
                from {
                  transform: translateY(20px);
                  opacity: 0;
                }
                to {
                  transform: translateY(0);
                  opacity: 1;
                }
              }
            `}</style>

            {/* Modal Header */}
            <div
              style={{
                padding: `${AdminSpacing.lg} ${AdminSpacing.xl}`,
                borderBottom: `1px solid ${colors.border}`,
                backgroundColor: `${colors.status.info}08`,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: 700,
                  color: colors.text.primary,
                }}
              >
                {modalMode === 'create'
                  ? `Create New ${levelConfig.singular}`
                  : `Edit ${levelConfig.singular}`}
              </h2>
              <p
                style={{
                  margin: '4px 0 0 0',
                  fontSize: '12px',
                  color: colors.text.secondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  fontWeight: 500,
                }}
              >
                {modalMode === 'create' ? 'Add a new location to the system' : 'Update location information'}
              </p>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} style={{ padding: `${AdminSpacing.xl}` }}>
              <div style={{ marginBottom: AdminSpacing.xl }}>
                <label
                  style={{
                    display: 'block',
                    marginBottom: AdminSpacing.sm,
                    fontWeight: 700,
                    fontSize: '13px',
                    color: colors.text.primary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {levelConfig.singular} Name *
                </label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder={`Enter ${levelConfig.singular.toLowerCase()} name`}
                  autoFocus
                  style={{
                    width: '100%',
                    padding: AdminSpacing.md,
                    border: `1px solid ${colors.border}`,
                    borderRadius: AdminBorderRadius.md,
                    fontSize: '14px',
                    backgroundColor: colors.background,
                    color: colors.text.primary,
                    boxSizing: 'border-box',
                    transition: 'all 0.2s ease',
                  }}
                  onFocus={(e) => {
                    (e.target as HTMLElement).style.borderColor = colors.status.info;
                    (e.target as HTMLElement).style.boxShadow = `0 0 0 3px ${colors.status.info}15`;
                  }}
                  onBlur={(e) => {
                    (e.target as HTMLElement).style.borderColor = colors.border;
                    (e.target as HTMLElement).style.boxShadow = 'none';
                  }}
                  disabled={isSaving}
                />
              </div>

              {modalMode === 'edit' && (
                <div style={{ marginBottom: AdminSpacing.xl }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: AdminSpacing.sm,
                      fontWeight: 700,
                      fontSize: '13px',
                      color: colors.text.primary,
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Assigned Officer
                  </label>
                  {isLoadingUsers ? (
                    <div style={{ fontSize: '14px', color: colors.text.secondary, padding: AdminSpacing.md }}>Loading eligible officers...</div>
                  ) : (
                    <select
                      value={assignedUserId || ''}
                      onChange={e => setAssignedUserId(e.target.value ? Number(e.target.value) : null)}
                      style={{
                        width: '100%',
                        padding: AdminSpacing.md,
                        border: `1px solid ${colors.border}`,
                        borderRadius: AdminBorderRadius.md,
                        fontSize: '14px',
                        backgroundColor: colors.background,
                        color: colors.text.primary,
                        boxSizing: 'border-box',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                      }}
                      disabled={isSaving}
                    >
                      <option value="">— Unassigned —</option>
                      {eligibleUsers.map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.username} ({u.role?.name || u.role?.code}){u.email ? ` - ${u.email}` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Modal Footer */}
              <div
                style={{
                  display: 'flex',
                  gap: AdminSpacing.md,
                  justifyContent: 'flex-end',
                  paddingTop: AdminSpacing.lg,
                  borderTop: `1px solid ${colors.border}`,
                  marginTop: AdminSpacing.xl,
                }}
              >
                <button
                  type='button'
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  disabled={isSaving}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: 'transparent',
                    color: colors.text.secondary,
                    border: `1px solid ${colors.border}`,
                    borderRadius: AdminBorderRadius.md,
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving) {
                      (e.currentTarget as HTMLElement).style.backgroundColor = `${colors.hover}`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                  }}
                >
                  Cancel
                </button>
                <button
                  type='submit'
                  disabled={isSaving}
                  style={{
                    padding: '10px 24px',
                    backgroundColor: colors.status.success,
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: AdminBorderRadius.md,
                    cursor: isSaving ? 'not-allowed' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 600,
                    opacity: isSaving ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                    boxShadow: `0 4px 12px ${colors.status.success}30`,
                  }}
                  onMouseEnter={(e) => {
                    if (!isSaving) {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                      (e.currentTarget as HTMLElement).style.boxShadow = `0 6px 16px ${colors.status.success}40`;
                    }
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 12px ${colors.status.success}30`;
                  }}
                >
                  {isSaving ? 'Saving...' : modalMode === 'create' ? 'Create' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
