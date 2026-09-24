"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageSubHeader } from '@/components/common/PageSubHeader';
import { AdminFormSkeleton, AdminErrorAlert } from '@/components/admin';
import { AdminPermissionService, Permission } from '@/services/admin/permissions';

const CATEGORY_OPTIONS = ['Capabilities', 'View Permissions', 'Action Permissions'];

export default function EditPermissionPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: permission, isLoading, error, refetch } = useQuery<Permission>({
    queryKey: ['admin-permission', params.id],
    queryFn: () => AdminPermissionService.getPermissionById(params.id),
    enabled: !!params.id,
  });

  const [key, setKey] = useState('');
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState(CATEGORY_OPTIONS[0]);
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (permission) {
      setKey(permission.key);
      setLabel(permission.label);
      setCategory(permission.category);
      setDescription(permission.description || '');
    }
  }, [permission]);

  const updateMutation = useMutation({
    mutationFn: () =>
      AdminPermissionService.updatePermission(params.id, {
        key: key.trim(),
        label: label.trim(),
        category,
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-permission', params.id] });
      router.push(`/admin/permissions/${params.id}`);
    },
    onError: (err: any) => {
      setFormError(err?.message || 'Failed to update permission');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!key.trim() || !label.trim() || !category.trim()) {
      setFormError('Key, label, and category are required.');
      return;
    }
    updateMutation.mutate();
  };

  if (isLoading) {
    return <AdminFormSkeleton />;
  }

  return (
    <div className="flex flex-col flex-grow min-h-0">
      <PageSubHeader title="Edit Permission" />

      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl w-full mx-auto flex flex-col gap-6 flex-grow">
        {error && (
          <AdminErrorAlert
            title="Failed to Load Permission"
            message={(error as any).message || 'An error occurred'}
            onRetry={() => refetch()}
          />
        )}

        {permission && (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 flex flex-col gap-5">
            {formError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700">{formError}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
              <input
                type="text"
                value={key}
                onChange={e => setKey(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Changing this stops it matching the flag already set on any roles that have it enabled.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORY_OPTIONS.map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => router.push(`/admin/permissions/${params.id}`)}
                className="px-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateMutation.isPending}
                className="px-4 py-2 rounded-lg bg-blue-600 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
