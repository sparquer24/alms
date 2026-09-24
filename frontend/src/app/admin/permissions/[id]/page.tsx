"use client";

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { PageSubHeader, SubHeaderButton } from '@/components/common/PageSubHeader';
import { AdminSectionSkeleton, AdminErrorAlert } from '@/components/admin';
import { AdminPermissionService, Permission } from '@/services/admin/permissions';

export default function PermissionDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const {
    data: permission,
    isLoading,
    error,
    refetch,
  } = useQuery<Permission>({
    queryKey: ['admin-permission', params.id],
    queryFn: () => AdminPermissionService.getPermissionById(params.id),
    enabled: !!params.id,
  });

  if (isLoading) {
    return <AdminSectionSkeleton />;
  }

  return (
    <div className="flex flex-col flex-grow min-h-0">
      <PageSubHeader
        title={permission?.label || 'Permission'}
        actions={
          <SubHeaderButton variant="primary" onClick={() => router.push(`/admin/permissions/${params.id}/edit`)}>
            Edit
          </SubHeaderButton>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8 max-w-2xl w-full mx-auto flex flex-col gap-6 flex-grow">
        {error && (
          <AdminErrorAlert
            title="Failed to Load Permission"
            message={(error as any).message || 'An error occurred'}
            onRetry={() => refetch()}
          />
        )}

        {permission && (
          <div className="bg-white rounded-2xl shadow-xs border border-gray-200/80 p-6 flex flex-col gap-5">
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Key</div>
              <div className="text-sm text-gray-900 font-mono">{permission.key}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Category</div>
              <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                {permission.category}
              </span>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Description</div>
              <div className="text-sm text-gray-900">{permission.description || '—'}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Assigned Roles</div>
              <div className="flex flex-wrap gap-1">
                {permission.assignedRoles.length === 0 && <span className="text-sm text-gray-400">No roles have this permission enabled</span>}
                {permission.assignedRoles.map(role => (
                  <span key={role} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    {role}
                  </span>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                To change which roles have this permission, use Role Management's permission matrix for that role.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
