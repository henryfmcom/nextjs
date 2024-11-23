import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import HomePage from '@/components/home/HomePage';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default async function Home() {
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('landing');
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <HomePage user={user} />
    </Suspense>
  );
}