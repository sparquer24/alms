import ApplicationDetailPage from './ApplicationDetailClient';

export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default ApplicationDetailPage;
