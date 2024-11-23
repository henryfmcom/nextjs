import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import EmployeeEditClient from '@/components/client/EmployeeEditClient';
import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditEmployee({ params }: PageProps) {
  const resolvedParams = use(params);
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <EmployeeEditClient id={resolvedParams.id} />
    </Suspense>
  );
}