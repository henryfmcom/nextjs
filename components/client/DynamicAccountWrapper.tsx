'use client'

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const AccountPageClient = dynamic(
  () => import('@/components/client/AccountPageClient'),
  {
    loading: () => <LoadingSpinner />,
    ssr: false
  }
);

export default function DynamicAccountWrapper() {
  return <AccountPageClient />;
} 