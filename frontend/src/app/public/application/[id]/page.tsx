import PublicApplicationPage from './PublicApplicationClient';

export async function generateStaticParams() {
  return [{ id: '1' }];
}

export default PublicApplicationPage;
