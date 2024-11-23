import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import AllocationEditClient from '@/components/client/AllocationEditClient';
import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditAllocation({ params }: PageProps) {
  const resolvedParams = use(params);
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AllocationEditClient id={resolvedParams.id} />
    </Suspense>
  );
} 