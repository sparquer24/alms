import { PageLayoutSkeleton, FormSkeleton } from '../../../components/Skeleton';

export default function Loading() {
  return (
    <PageLayoutSkeleton>
      <FormSkeleton fields={4} />
    </PageLayoutSkeleton>
  );
}
