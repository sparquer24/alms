'use client';

import React from 'react';
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { AdminErrorBoundary } from '@/components/admin';

export default function AnalyticsPage() {
  return (
    <AdminErrorBoundary>
      <AnalyticsDashboard />
    </AdminErrorBoundary>
  );
}
