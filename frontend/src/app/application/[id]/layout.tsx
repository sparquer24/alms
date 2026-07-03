import React from 'react';

export async function generateStaticParams() {
  // Return a static list of params to avoid 401 unauthorized errors during build
  // since we don't have a user token available here.
  const params = Array.from({ length: 10 }, (_, i) => ({ id: String(i + 1) }));
  return params;
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
