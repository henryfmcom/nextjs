'use client'

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <h1 className="text-4xl font-bold">500</h1>
        <p className="mt-2">Something went wrong!</p>
        <Button
          onClick={reset}
          className="mt-4"
        >
          Try again
        </Button>
      </div>
    </div>
  );
} 