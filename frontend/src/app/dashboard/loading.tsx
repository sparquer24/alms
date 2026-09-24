import { PageLayoutSkeleton, DashboardStatsSkeleton, TableSkeleton } from '../../components/Skeleton';

export default function Loading() {
  return (
    <PageLayoutSkeleton>
      <div className="space-y-6">
        <DashboardStatsSkeleton />
        <div className="bg-white rounded-lg shadow p-6">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-6" />
          <TableSkeleton rows={8} columns={5} />
        </div>
      </div>
    </PageLayoutSkeleton>
  );
}
