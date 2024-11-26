import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import AuthForm, { AuthState } from '@/components/misc/AuthForm';
import { Navbar } from '@/components/layout/Navbar';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function Auth({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    return redirect('/');
  }

  const currState = id as AuthState;
  if (!['signin', 'signup', 'forgot_password'].includes(currState)) {
    return redirect('/auth/signin');
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar user={user} onMenuClick={() => {}} />
      <div className="flex grow justify-center items-center">
        <AuthForm state={currState} />
      </div>
    </div>
  );
}
