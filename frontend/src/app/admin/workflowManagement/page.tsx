'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  AdminCard,
  AdminErrorBoundary,
  AdminSectionSkeleton,
} from '@/components/admin';
import { useAdminTheme } from '@/context/AdminThemeContext';
import { AdminSpacing, AdminLayout, AdminBorderRadius } from '@/styles/admin-design-system';
import { AdminActionService } from '@/services/admin/actions';
import type { MasterEntity } from '@/services/admin/actions';

export default function WorkflowManagementPage() {
  const queryClient = useQueryClient();
  const { colors } = useAdminTheme();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<MasterEntity | null>(null);
  const [form, setForm] = useState({ name: '', code: '', description: '', isActive: true });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: () => AdminActionService.getWorkflows(),
  });

  const createMut = useMutation({
    mutationFn: (data: any) => AdminActionService.createWorkflow(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); toast.success('Created'); setShowForm(false); resetForm(); },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => AdminActionService.updateWorkflow(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); toast.success('Updated'); setShowForm(false); setEditing(null); resetForm(); },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => AdminActionService.deleteWorkflow(id),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['workflows'] }); toast.success('Deleted'); },
    onError: (e: any) => toast.error(e.message || 'Failed'),
  });

  const resetForm = () => setForm({ name: '', code: '', description: '', isActive: true });

  const openEdit = (item: MasterEntity) => {
    setEditing(item);
    setForm({ name: item.name, code: item.code, description: item.description || '', isActive: item.isActive });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!form.name || !form.code) { toast.error('Name and Code are required'); return; }
    if (editing) updateMut.mutate({ id: editing.id, data: form });
    else createMut.mutate(form);
  };

  const tdStyle = { padding: '10px 12px', fontSize: '13px', borderBottom: `1px solid ${colors.border}` };

  return (
    <AdminErrorBoundary>
      <div style={{ padding: AdminLayout.content.padding, display: 'flex', flexDirection: 'column', gap: AdminSpacing.xl }}>
        <div className='bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden'>
          <div className='bg-[#001F54] text-white px-6 py-8'>
            <h1 className='text-3xl font-bold mb-2'>Workflow Management</h1>
            <p className='text-blue-100 text-lg'>Manage workflow definitions</p>
          </div>
        </div>

        <AdminCard title='Workflows'>
          <div style={{ marginBottom: AdminSpacing.md }}>
            <button onClick={() => { resetForm(); setEditing(null); setShowForm(true); }}
              style={{ padding: '8px 16px', backgroundColor: colors.status.info, color: '#fff', border: 'none', borderRadius: AdminBorderRadius.md, cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
              + New Workflow
            </button>
          </div>

          {showForm && (
            <div style={{ marginBottom: AdminSpacing.lg, padding: AdminSpacing.md, border: `1px solid ${colors.border}`, borderRadius: AdminBorderRadius.md, backgroundColor: colors.background }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: AdminSpacing.md }}>
                <input placeholder='Name *' value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  style={{ padding: '8px 12px', border: `1px solid ${colors.border}`, borderRadius: AdminBorderRadius.md, fontSize: '13px' }} />
                <input placeholder='Code *' value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
                  style={{ padding: '8px 12px', border: `1px solid ${colors.border}`, borderRadius: AdminBorderRadius.md, fontSize: '13px' }} />
                <input placeholder='Description' value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  style={{ padding: '8px 12px', border: `1px solid ${colors.border}`, borderRadius: AdminBorderRadius.md, fontSize: '13px', gridColumn: '1/-1' }} />
              </div>
              <div style={{ display: 'flex', gap: AdminSpacing.md, marginTop: AdminSpacing.md }}>
                <button onClick={handleSubmit} disabled={createMut.isPending || updateMut.isPending}
                  style={{ padding: '8px 20px', backgroundColor: colors.status.success, color: '#fff', border: 'none', borderRadius: AdminBorderRadius.md, cursor: 'pointer', fontWeight: 600 }}>
                  {editing ? 'Update' : 'Create'}
                </button>
                <button onClick={() => { setShowForm(false); setEditing(null); resetForm(); }}
                  style={{ padding: '8px 20px', backgroundColor: 'transparent', color: colors.text.secondary, border: `1px solid ${colors.border}`, borderRadius: AdminBorderRadius.md, cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </div>
          )}

          {isLoading ? <AdminSectionSkeleton /> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: colors.background }}>
                  <th style={tdStyle}><strong>Code</strong></th>
                  <th style={tdStyle}><strong>Name</strong></th>
                  <th style={tdStyle}><strong>Description</strong></th>
                  <th style={tdStyle}><strong>Status</strong></th>
                  <th style={tdStyle}><strong>Actions</strong></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item: MasterEntity) => (
                  <tr key={item.id}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = colors.hover}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                    <td style={tdStyle}><code style={{ backgroundColor: '#eef2ff', padding: '2px 6px', borderRadius: '4px', color: '#6366f1', fontWeight: 600, fontSize: '12px' }}>{item.code}</code></td>
                    <td style={{ ...tdStyle, fontWeight: 600, color: colors.text.primary }}>{item.name}</td>
                    <td style={tdStyle}>{item.description || '—'}</td>
                    <td style={tdStyle}>
                      <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 600, backgroundColor: item.isActive ? '#dcfce7' : '#fef2f2', color: item.isActive ? '#166534' : '#dc2626' }}>
                        {item.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <button onClick={() => openEdit(item)} style={{ padding: '4px 10px', borderRadius: '6px', border: `1px solid ${colors.border}`, backgroundColor: 'transparent', color: colors.status.info, cursor: 'pointer', fontSize: '12px', marginRight: '6px' }}>Edit</button>
                      <button onClick={() => { if (confirm('Delete this workflow?')) deleteMut.mutate(item.id); }}
                        style={{ padding: '4px 10px', borderRadius: '6px', border: '1px solid #fecaca', backgroundColor: 'transparent', color: '#dc2626', cursor: 'pointer', fontSize: '12px' }}>Delete</button>
                    </td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td colSpan={5} style={{ ...tdStyle, textAlign: 'center', color: colors.text.secondary }}>No workflows configured yet.</td></tr>
                )}
              </tbody>
            </table>
          )}
        </AdminCard>
      </div>
    </AdminErrorBoundary>
  );
}
