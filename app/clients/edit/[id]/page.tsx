import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import ClientEditClient from '@/components/client/ClientEditClient';
import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditClient({ params }: PageProps) {
  const resolvedParams = use(params);
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ClientEditClient id={resolvedParams.id} />
    </Suspense>
  );
}