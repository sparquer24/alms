'use client';

import { Suspense } from 'react';
import LocationsManagementContent from '../../../components/UserManagement/LocationsManagementContent';

export default function LocationsManagementPage() {
  return (
    <Suspense fallback={null}>
      <LocationsManagementContent />
    </Suspense>
  );
}
