import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import DynamicSignInWrapper from '@/components/client/DynamicSignInWrapper';

export default function SignIn() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <DynamicSignInWrapper />
    </Suspense>
  );
} 