import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import DynamicAccountWrapper from '@/components/client/DynamicAccountWrapper';

export default function Account() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DynamicAccountWrapper />
    </Suspense>
  );
}
