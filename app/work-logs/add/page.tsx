import AddWorkLogForm from '@/components/misc/AddWorkLogForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getUser } from '@/utils/supabase/queries';

export default async function AddWorkLog() {
  const supabase = await createClient();
  const user = await getUser(supabase);
  
  if (!user) {
    redirect('/auth/signin');
  }

  return (
    <DashboardLayout user={user}>
      <AddWorkLogForm workLogId={null} user={user} />
    </DashboardLayout>
  );
} 