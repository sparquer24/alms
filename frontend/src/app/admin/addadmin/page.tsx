'use client';

import React, { useState, useEffect } from 'react';
import { AdminFormSkeleton } from '@/components/admin';

const AddAdminPage = () => {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate initial page load
    setTimeout(() => setIsLoading(false), 800);
  }, []);

  return (
    <div className="p-4">
      {isLoading ? (
        <>
          <div className="h-8 w-48 bg-gray-200 rounded mb-4 animate-pulse"></div>
          <AdminFormSkeleton fields={3} showButton={true} />
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold">Add Admin</h1>
          <p>Mock data and functionality for adding new admins will go here.</p>
        </>
      )}
    </div>
  );
};

export default AddAdminPage;
