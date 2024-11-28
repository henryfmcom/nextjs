'use client'

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';
import { Settings, KanbanSquare, Clock, TrendingUp, Users as UsersIcon, Target } from 'lucide-react';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_ITEMS_PER_PAGE } from '@/utils/constants';
import { getLeadsList, getLeadMetrics } from '@/utils/supabase/queries';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Progress } from "@/components/ui/progress";

interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  status: string;
  source: {
    name: string;
  };
  assigned_to: {
    given_name: string;
    surname: string;
  } | null;
  current_stage: {
    name: string;
  };
  created_at: string;
}

interface LeadMetrics {
  stage_name: string;
  stage_count: number;
  avg_time_in_stage: string;
  conversion_rate: number;
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const [metrics, setMetrics] = useState<LeadMetrics[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const router = useRouter();
  const { currentTenant } = useTenant();

  useEffect(() => {
    if (currentTenant) {
      loadLeads();
      loadMetrics();
    }
  }, [currentPage, itemsPerPage, currentTenant]);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { leads, count } = await getLeadsList(
        supabase, 
        currentTenant!.id, 
        currentPage, 
        itemsPerPage
      );
      
      if (leads) {
        setLeads(leads);
        setTotalItems(count || 0);
      }
    } catch (error) {
      console.error('Error loading leads:', error);
      toast({
        title: "Error",
        description: "Failed to load leads. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
      setLoadingMetrics(true);
      const supabase = createClient();
      const { metrics: metricsData } = await getLeadMetrics(
        supabase,
        currentTenant!.id
      );

      if (metricsData) {
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load metrics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoadingMetrics(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive", label: string }> = {
      new: { variant: "secondary", label: "New" },
      contacted: { variant: "default", label: "Contacted" },
      qualified: { variant: "default", label: "Qualified" },
      unqualified: { variant: "destructive", label: "Unqualified" },
    };
    const { variant, label } = variants[status.toLowerCase()] || { variant: "secondary", label: status };
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getTotalLeads = () => metrics.reduce((sum, m) => sum + m.stage_count, 0);
  const getQualifiedLeads = () => {
    const qualifiedStage = metrics.find(m => m.stage_name.toLowerCase().includes('qualified'));
    return qualifiedStage?.stage_count || 0;
  };
  const getOverallConversion = () => {
    const total = getTotalLeads();
    return total > 0 ? Math.round((getQualifiedLeads() / total) * 100) : 0;
  };
  const getAverageTime = () => {
    const qualifiedStage = metrics.find(m => m.stage_name.toLowerCase().includes('qualified'));
    return qualifiedStage?.avg_time_in_stage || '0 days';
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="container mx-auto space-y-4">
      <Breadcrumb 
        items={[
          { label: 'CRM', href: '/leads' },
          { label: 'Leads' }
        ]} 
      />

      {/* Metrics Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <UsersIcon className="h-4 w-4 mr-2 text-muted-foreground" />
              Total Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getTotalLeads()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2 text-muted-foreground" />
              Qualified Leads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getQualifiedLeads()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2 text-muted-foreground" />
              Conversion Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getOverallConversion()}%</div>
            <Progress value={getOverallConversion()} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
              Avg. Time to Qualify
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getAverageTime()}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-2">
            <CardTitle>Leads</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/leads/pipeline')}
              className="ml-2"
            >
              <KanbanSquare className="h-4 w-4 mr-2" />
              Pipeline View
            </Button>
          </div>
          <div className="flex items-center space-x-2">
            <Link href="/leads/add">
              <Button variant="default">+ Add New</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="text-left bg-muted">
                <th className="p-2">Company</th>
                <th className="p-2">Contact</th>
                <th className="p-2">Source</th>
                <th className="p-2">Stage</th>
                <th className="p-2">Status</th>
                <th className="p-2">Assigned To</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr 
                  key={lead.id} 
                  className="border-b hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/leads/${lead.id}`)}
                >
                  <td className="p-2">{lead.company_name}</td>
                  <td className="p-2">{lead.contact_name}</td>
                  <td className="p-2">{lead.source.name}</td>
                  <td className="p-2">{lead.current_stage.name}</td>
                  <td className="p-2">{getStatusBadge(lead.status)}</td>
                  <td className="p-2">
                    {lead.assigned_to 
                      ? `${lead.assigned_to.given_name} ${lead.assigned_to.surname}`
                      : '-'
                    }
                  </td>
                  <td className="p-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/leads/edit/${lead.id}`);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </CardContent>
      </Card>
    </div>
  );
} 