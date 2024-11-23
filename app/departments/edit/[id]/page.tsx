import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import DepartmentEditClient from '@/components/client/DepartmentEditClient';
import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditDepartment({ params }: PageProps) {
  const resolvedParams = use(params);
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DepartmentEditClient id={resolvedParams.id} />
    </Suspense>
  );
} 