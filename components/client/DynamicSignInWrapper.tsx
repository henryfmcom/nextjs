'use client'

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const SignInPageClient = dynamic(
  () => import('@/components/client/SignInPageClient'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export default function DynamicSignInWrapper() {
  return <SignInPageClient />;
} 