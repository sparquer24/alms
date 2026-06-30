import React from 'react';
import EditUserPage from './EditUserClient';

export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default async function Page() {
  return <EditUserPage />;
}
