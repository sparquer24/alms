'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import Select from 'react-select';
import { AlertTriangle, Loader2, Save, Eraser, X } from 'lucide-react';
import { AdminCard, AdminErrorBoundary, AdminSectionSkeleton } from '@/components/admin';
import { PageSubHeader } from '@/components/common/PageSubHeader';
import { useAuth } from '@/hooks/useAuth';
import { LocationService } from '@/services/locations';
import { getUserFromCookie } from '@/utils/authCookies';
import { apiClient } from '@/config/authenticatedApiClient';

const ReactSelectFixed = Select as any;

type ViewApplicationType = 'ALL' | 'FRESH' | 'RENEWAL';
type Purpose = 'ALL' | 'SELF_PROTECTION' | 'SPORTS' | 'HEIRLOOM_POLICY' | 'CROP_PROTECTION';
type Area = 'DISTRICT' | 'STATE' | 'INDIA';
type Decision = 'APPROVE' | 'RECOMMEND';
type Source = 'THIS_SCOPE' | 'DISTRICT' | 'STATE' | 'DEFAULT' | 'BUILT_IN';

interface RoleOption {
  id: number;
  code: string;
  name: string;
}

interface RuleCell {
  purpose: Purpose;
  area: Area;
  ruleId: number | null;
  source: Source;
  inheritedFrom: { purpose: Purpose; applicationType: string; stateId: number | null; districtId: number | null } | null;
  approverRole: RoleOption | null;
  decision: Decision;
  reachable: boolean | null;
}

interface RuleGrid {
  scope: { applicationType: ViewApplicationType; stateId: number | null; districtId: number | null };
  roles: RoleOption[];
  cells: RuleCell[];
}

const APPLICATION_TYPE_OPTIONS: { value: ViewApplicationType; label: string }[] = [
  { value: 'ALL', label: 'All applications (Fresh and Renewal)' },
  { value: 'FRESH', label: 'Fresh applications only' },
  { value: 'RENEWAL', label: 'Renewal applications only' },
];

const PURPOSES: { value: Purpose; label: string }[] = [
  { value: 'ALL', label: 'Any need for license' },
  { value: 'SELF_PROTECTION', label: 'Self protection' },
  { value: 'SPORTS', label: 'Sports / target shooting' },
  { value: 'HEIRLOOM_POLICY', label: 'Heirloom policy' },
  { value: 'CROP_PROTECTION', label: 'Crop protection' },
];

const AREAS: { value: Area; label: string }[] = [
  { value: 'DISTRICT', label: 'District' },
  { value: 'STATE', label: 'State' },
  { value: 'INDIA', label: 'Throughout India' },
];

const DECISION_LABELS: Record<Decision, string> = {
  APPROVE: 'Approve / Reject',
  RECOMMEND: 'Recommend / Not Recommend',
};

const toNumberOrNull = (value: any): number | null =>
  value === null || value === undefined || value === '' ? null : Number(value);

function sourceLabel(cell: RuleCell, view: ViewApplicationType): string {
  if (cell.source === 'THIS_SCOPE') return 'Set here';
  if (cell.source === 'BUILT_IN' || !cell.inheritedFrom) return 'System default';
  const from = cell.inheritedFrom;
  const level = from.districtId !== null ? 'this district' : from.stateId !== null ? 'the state' : 'all states';
  const extras = [
    from.purpose === 'ALL' && cell.purpose !== 'ALL' ? 'any need' : null,
    from.applicationType === 'ALL' && view !== 'ALL' ? 'all application types' : null,
  ].filter(Boolean);
  return `From ${level}${extras.length ? ` (${extras.join(', ')})` : ''}`;
}

export default function ApprovalRulesContent() {
  const queryClient = useQueryClient();
  const { user: authUser } = useAuth();
  const cookieUser = useMemo(() => getUserFromCookie(), []);
  const loggedInUser: any = authUser ?? cookieUser;

  const userLocation = loggedInUser?.location ?? loggedInUser?.state ?? {};
  const userState = userLocation?.state ?? loggedInUser?.state ?? null;
  const userDistrict = userLocation?.district ?? loggedInUser?.district ?? null;
  const userStateId = toNumberOrNull(userState?.id ?? loggedInUser?.stateId ?? null);
  const userDistrictId = toNumberOrNull(userDistrict?.id ?? loggedInUser?.districtId ?? null);
  const isSuperAdmin = [loggedInUser?.role, loggedInUser?.roleCode, loggedInUser?.role_code].some(
    (value: any) => String(value || '').toUpperCase() === 'SUPER_ADMIN'
  );

  const [applicationType, setApplicationType] = useState<ViewApplicationType>('ALL');
  const [stateId, setStateId] = useState<number | null>(userStateId);
  const [districtId, setDistrictId] = useState<number | null>(userDistrictId);
  const [editing, setEditing] = useState<RuleCell | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  const effectiveStateId = isSuperAdmin ? stateId : userStateId;

  const { data: states = [], isLoading: statesLoading } = useQuery({
    queryKey: ['approval-rules-states'],
    queryFn: () => LocationService.getStates(),
    enabled: isSuperAdmin,
  });
  const { data: districts = [], isLoading: districtsLoading } = useQuery({
    queryKey: ['approval-rules-districts', effectiveStateId],
    queryFn: () => LocationService.getDistricts(effectiveStateId as number),
    enabled: !!effectiveStateId,
  });

  const gridQueryKey = ['approval-rules', applicationType, effectiveStateId, districtId];
  const { data: grid, isLoading: gridLoading, error: gridError } = useQuery({
    queryKey: gridQueryKey,
    queryFn: async () => {
      const params = new URLSearchParams({ applicationType });
      if (effectiveStateId) params.set('stateId', String(effectiveStateId));
      if (districtId) params.set('districtId', String(districtId));
      const res: any = await apiClient.get(`/approval-rules?${params.toString()}`);
      return (res?.data ?? res) as RuleGrid;
    },
  });

  const saveRule = useMutation({
    mutationFn: (payload: { cell: RuleCell; approverRoleId: number; decision: Decision }) =>
      apiClient.put('/approval-rules', {
        applicationType,
        stateId: effectiveStateId,
        districtId,
        purpose: payload.cell.purpose,
        area: payload.cell.area,
        approverRoleId: payload.approverRoleId,
        decision: payload.decision,
      }),
    onSuccess: () => {
      toast.success('Approval rule saved');
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['approval-rules'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to save approval rule'),
  });

  const clearRule = useMutation({
    mutationFn: (ruleId: number) => apiClient.delete(`/approval-rules/${ruleId}`),
    onSuccess: () => {
      toast.success('Rule cleared — this cell now inherits');
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ['approval-rules'] });
    },
    onError: (err: any) => toast.error(err?.message || 'Failed to clear approval rule'),
  });

  const stateOptions = states.map((s: any) => ({ value: s.id, label: s.name }));
  const districtOptions = districts.map((d: any) => ({ value: d.id, label: d.name }));
  const cellFor = (purpose: Purpose, area: Area) =>
    grid?.cells.find(c => c.purpose === purpose && c.area === area) ?? null;
  const unreachableCount = grid?.cells.filter(c => c.reachable === false).length ?? 0;

  const scopeLabel = districtId
    ? districtOptions.find((o: any) => o.value === districtId)?.label ?? 'Selected district'
    : effectiveStateId
      ? `${isSuperAdmin ? stateOptions.find((o: any) => o.value === effectiveStateId)?.label ?? 'State' : userState?.name ?? 'State'} (state-wide)`
      : 'All states (default)';

  const portal = isMounted && typeof document !== 'undefined' ? document.body : null;

  return (
    <AdminErrorBoundary>
      <div className='flex flex-col flex-grow min-h-0'>
        <PageSubHeader title='Approval Rules' metaBadge={scopeLabel} />

        <div className='flex-grow min-h-0 overflow-auto w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6'>
          <AdminCard
            title='Where do these rules apply?'
            description='Rules set for a district override the state, which overrides the all-states default. A specific need for license overrides "Any".'
          >
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              <label className='flex flex-col gap-1.5 text-sm font-semibold text-gray-700'>
                Applications
                <ReactSelectFixed
                  options={APPLICATION_TYPE_OPTIONS}
                  value={APPLICATION_TYPE_OPTIONS.find(o => o.value === applicationType)}
                  onChange={(o: any) => setApplicationType(o?.value ?? 'ALL')}
                  menuPortalTarget={portal}
                />
              </label>
              <label className='flex flex-col gap-1.5 text-sm font-semibold text-gray-700'>
                State
                {isSuperAdmin ? (
                  <ReactSelectFixed
                    options={stateOptions}
                    value={stateOptions.find((o: any) => o.value === stateId) ?? null}
                    onChange={(o: any) => {
                      setStateId(o?.value ?? null);
                      setDistrictId(null);
                    }}
                    placeholder='All states (default)'
                    isClearable
                    isLoading={statesLoading}
                    menuPortalTarget={portal}
                  />
                ) : (
                  <div className='rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800'>
                    {userState?.name ?? '—'}
                  </div>
                )}
              </label>
              <label className='flex flex-col gap-1.5 text-sm font-semibold text-gray-700'>
                District
                <ReactSelectFixed
                  options={districtOptions}
                  value={districtOptions.find((o: any) => o.value === districtId) ?? null}
                  onChange={(o: any) => setDistrictId(o?.value ?? null)}
                  placeholder={effectiveStateId ? 'Whole state' : 'Select a state first'}
                  isClearable
                  isDisabled={!effectiveStateId}
                  isLoading={districtsLoading}
                  menuPortalTarget={portal}
                />
              </label>
            </div>
          </AdminCard>

          <AdminCard
            title={`Final decision — ${scopeLabel}`}
            description='Click a cell to choose which role makes the final decision, and whether it can approve locally or only recommend.'
          >
            {gridLoading ? (
              <AdminSectionSkeleton />
            ) : gridError ? (
              <p className='text-sm text-red-600'>{(gridError as any)?.message || 'Failed to load approval rules.'}</p>
            ) : grid ? (
              <>
                {unreachableCount > 0 && (
                  <div className='mb-4 flex items-start gap-2 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800'>
                    <AlertTriangle className='mt-0.5 h-4 w-4 flex-shrink-0' />
                    <span>
                      {unreachableCount} rule{unreachableCount === 1 ? ' names a role' : 's name roles'} that
                      Flow Mapping never forwards to here. Applications would not reach that officer — update Flow
                      Mapping or choose another role.
                    </span>
                  </div>
                )}
                <div className='overflow-x-auto'>
                  <table className='w-full min-w-[640px] border-separate border-spacing-0 text-sm'>
                    <thead>
                      <tr>
                        <th className='border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-600'>
                          Need for license
                        </th>
                        {AREAS.map(area => (
                          <th key={area.value} className='border-b border-gray-200 px-3 py-2 text-left font-semibold text-gray-600'>
                            {area.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {PURPOSES.map(purpose => (
                        <tr key={purpose.value}>
                          <th scope='row' className='border-b border-gray-100 px-3 py-2 text-left font-medium text-gray-800'>
                            {purpose.label}
                          </th>
                          {AREAS.map(area => {
                            const cell = cellFor(purpose.value, area.value);
                            if (!cell) return <td key={area.value} className='border-b border-gray-100 px-3 py-2'>—</td>;
                            const isApprove = cell.decision === 'APPROVE';
                            return (
                              <td key={area.value} className='border-b border-gray-100 p-1.5'>
                                <button
                                  type='button'
                                  onClick={() => setEditing(cell)}
                                  className={`w-full rounded-lg border px-3 py-2 text-left transition hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 ${
                                    cell.source === 'THIS_SCOPE' ? 'border-blue-300 bg-blue-50/60' : 'border-gray-200 bg-white'
                                  }`}
                                >
                                  <div className='flex items-center justify-between gap-2'>
                                    <span className='font-semibold text-gray-900'>{cell.approverRole?.code ?? '—'}</span>
                                    {cell.reachable === false && (
                                      <AlertTriangle className='h-4 w-4 text-yellow-600' aria-label='Not reachable through Flow Mapping' />
                                    )}
                                  </div>
                                  <span
                                    className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                      isApprove ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {DECISION_LABELS[cell.decision]}
                                  </span>
                                  <div className='mt-1 text-xs text-gray-500'>{sourceLabel(cell, applicationType)}</div>
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </AdminCard>
        </div>

        {editing && grid && (
          <RuleEditor
            cell={editing}
            roles={grid.roles}
            scopeLabel={scopeLabel}
            isSaving={saveRule.isPending || clearRule.isPending}
            onClose={() => setEditing(null)}
            onSave={(approverRoleId, decision) => saveRule.mutate({ cell: editing, approverRoleId, decision })}
            onClear={editing.ruleId ? () => clearRule.mutate(editing.ruleId as number) : undefined}
          />
        )}
      </div>
    </AdminErrorBoundary>
  );
}

function RuleEditor({
  cell,
  roles,
  scopeLabel,
  isSaving,
  onClose,
  onSave,
  onClear,
}: {
  cell: RuleCell;
  roles: RoleOption[];
  scopeLabel: string;
  isSaving: boolean;
  onClose: () => void;
  onSave: (approverRoleId: number, decision: Decision) => void;
  onClear?: () => void;
}) {
  const [roleId, setRoleId] = useState<number | null>(cell.approverRole?.id ?? null);
  const [decision, setDecision] = useState<Decision>(cell.decision);
  const roleOptions = roles.map(r => ({ value: r.id, label: `${r.name} (${r.code})` }));
  const purposeLabel = PURPOSES.find(p => p.value === cell.purpose)?.label;
  const areaLabel = AREAS.find(a => a.value === cell.area)?.label;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4' role='dialog' aria-modal='true'>
      <div className='w-full max-w-md rounded-xl bg-white p-5 shadow-xl'>
        <div className='mb-4 flex items-start justify-between gap-4'>
          <div>
            <h2 className='text-base font-semibold text-gray-900'>
              {purposeLabel} · {areaLabel}
            </h2>
            <p className='text-xs text-gray-500'>{scopeLabel}</p>
          </div>
          <button type='button' onClick={onClose} className='text-gray-400 hover:text-gray-600' aria-label='Close'>
            <X className='h-5 w-5' />
          </button>
        </div>

        <label className='mb-4 flex flex-col gap-1.5 text-sm font-semibold text-gray-700'>
          Final decision by
          <ReactSelectFixed
            options={roleOptions}
            value={roleOptions.find(o => o.value === roleId) ?? null}
            onChange={(o: any) => setRoleId(o?.value ?? null)}
            placeholder='Select a role'
          />
        </label>

        <fieldset className='mb-5'>
          <legend className='mb-1.5 text-sm font-semibold text-gray-700'>That role can</legend>
          {(['APPROVE', 'RECOMMEND'] as Decision[]).map(value => (
            <label key={value} className='mb-1 flex items-center gap-2 text-sm text-gray-800'>
              <input type='radio' name='decision' checked={decision === value} onChange={() => setDecision(value)} />
              {DECISION_LABELS[value]}
            </label>
          ))}
        </fieldset>

        {cell.reachable === false && (
          <p className='mb-4 rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-800'>
            Flow Mapping does not forward applications to {cell.approverRole?.code} here.
          </p>
        )}

        <div className='flex items-center justify-between gap-2'>
          {onClear ? (
            <button
              type='button'
              onClick={onClear}
              disabled={isSaving}
              className='inline-flex items-center gap-1.5 rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50'
              title='Remove this rule so the cell inherits from the wider scope'
            >
              <Eraser className='h-4 w-4' /> Clear (inherit)
            </button>
          ) : (
            <span className='text-xs text-gray-500'>Inherited — saving sets a rule here.</span>
          )}
          <button
            type='button'
            onClick={() => roleId && onSave(roleId, decision)}
            disabled={!roleId || isSaving}
            className='inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50'
          >
            {isSaving ? <Loader2 className='h-4 w-4 animate-spin' /> : <Save className='h-4 w-4' />} Save
          </button>
        </div>
      </div>
    </div>
  );
}
