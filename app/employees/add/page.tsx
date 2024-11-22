'use client'

import { useEffect, useState } from 'react';
import AddEmployeeForm from '@/components/misc/AddEmployeeForm';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { toast } from '@/components/ui/use-toast';

export default function AddEmployee() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    async function loadUser() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/signin');
          return;
        }
        
        setUser(user);
      } catch (error) {
        console.error("Error fetching user:", error);
        toast({
          title: "Error",
          description: "Failed to fetch user data. Please try again.",
          variant: "destructive",
        });
        router.push('/employees');
      } finally {
        setLoading(false);
      }
    }
    
    loadUser();
  }, [router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout user={user}>
      <AddEmployeeForm employeeId={null} />
    </DashboardLayout>
  );
}