import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import KnowledgeEditClient from '@/components/client/KnowledgeEditClient';
import { use } from 'react';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function EditKnowledge({ params }: PageProps) {
  const resolvedParams = use(params);
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <KnowledgeEditClient id={resolvedParams.id} />
    </Suspense>
  );
} 