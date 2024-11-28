import { createClient } from '@/utils/supabase/server';
import { getUser, getLead } from '@/utils/supabase/queries';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { redirect } from 'next/navigation';
import { LeadActivities } from '@/components/misc/LeadActivities';
import { LeadDocuments } from '@/components/misc/LeadDocuments';
import { LeadDetails } from '@/components/misc/LeadDetails';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from "@/components/ui/button";
import { PencilIcon } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: PageProps) {
  const supabase = await createClient();
  const user = await getUser(supabase);
  const { id } = await params;
  
  if (!user) {
    redirect('/auth/signin');
  }

  const lead = await getLead(supabase, id);

  if (!lead) {
    return <div>Lead not found</div>;
  }

  return (
    <DashboardLayout user={user}>
      <div className="space-y-6">
        <Breadcrumb 
          items={[
            { label: 'CRM', href: '/leads' },
            { label: 'Leads', href: '/leads' },
            { label: lead.company_name }
          ]} 
        />

        <div className="container mx-auto py-4 space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">Lead Details</h1>
            <Link href={`/leads/edit/${id}`}>
              <Button>
                <PencilIcon className="h-4 w-4 mr-2" />
                Edit Lead
              </Button>
            </Link>
          </div>

          <LeadDetails lead={lead} />

          <div className="grid grid-cols-2 gap-6">
            <LeadActivities leadId={id} />
            <LeadDocuments leadId={id} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
} 