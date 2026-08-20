'use client';

import React, { Suspense } from 'react';
import ApplicationsOverviewPanel from '@/components/analytics/ApplicationsOverviewPanel';
import { AdminErrorBoundary, AdminSectionSkeleton } from '@/components/admin';

export default function SuperAdminAnalyticsApplicationsPage() {
  return (
    <AdminErrorBoundary>
      <Suspense fallback={<AdminSectionSkeleton lines={6} height='400px' />}>
        <ApplicationsOverviewPanel analyticsBasePath='/superAdmin/analytics' />
      </Suspense>
    </AdminErrorBoundary>
  );
}
