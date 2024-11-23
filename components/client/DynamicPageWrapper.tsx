'use client'

import dynamic from 'next/dynamic';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { ComponentType } from 'react';

export function DynamicPageWrapper({ Component }: { Component: ComponentType<any> }) {
  const DynamicComponent = dynamic(() => Promise.resolve(Component), {
    loading: () => <LoadingSpinner />,
    ssr: false
  });

  return <DynamicComponent />;
} 