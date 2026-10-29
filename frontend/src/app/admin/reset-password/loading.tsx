import { FormSkeleton } from '../../../components/Skeleton';

// Rendered inside the admin layout, which already draws the sidebar/header.
export default function Loading() {
  return <FormSkeleton fields={4} />;
}
