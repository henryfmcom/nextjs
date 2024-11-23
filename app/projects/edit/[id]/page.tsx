import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import ProjectEditClient from '@/components/client/ProjectEditClient';
import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditProject({ params }: PageProps) {
  const resolvedParams = use(params);
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ProjectEditClient id={resolvedParams.id} />
    </Suspense>
  );
}