'use client'

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { 
  getLeadStages, 
  getLeadsByStage, 
  updateLeadStage,
  getLeadMetrics 
} from '@/utils/supabase/queries';
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DroppableProvided, 
  DraggableProvided,
  DropResult 
} from '@hello-pangea/dnd';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, Users, TrendingUp, Search, RefreshCw, Filter, List } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';

type LeadStatus = 'new' | 'contacted' | 'qualified' | 'unqualified';

const STATUSES: LeadStatus[] = [
  'new',
  'contacted',
  'qualified',
  'unqualified'
];

interface LeadPipelinePageProps {
  user: User;
}

interface StageMetrics {
  stage_name: string;
  stage_count: number;
  avg_time_in_stage: string;
  conversion_rate: number;
}

interface Stage {
  id: string;
  name: string;
  leads: Lead[];
  metrics?: StageMetrics;
}

interface Lead {
  id: string;
  company_name: string;
  contact_name: string;
  status: LeadStatus;
  assigned_to: {
    given_name: string;
    surname: string;
  } | null;
}

interface SummaryMetrics {
  total_leads: number;
  total_qualified: number;
  conversion_rate: number;
  avg_time_to_qualify: string;
}

export default function LeadPipelinePage({ user }: LeadPipelinePageProps) {
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentTenant } = useTenant();
  const router = useRouter();
  const [metrics, setMetrics] = useState<StageMetrics[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<LeadStatus[]>([]);
  const [summaryMetrics, setSummaryMetrics] = useState<SummaryMetrics | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (currentTenant) {
      loadPipeline();
      loadMetrics();
    }
  }, [currentTenant]);

  const loadPipeline = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Load stages
      const { stages: stageData } = await getLeadStages(supabase, currentTenant!.id);
      if (!stageData) return;

      // Load leads for each stage
      const stagesWithLeads = await Promise.all(
        stageData.map(async (stage) => {
          const { leads } = await getLeadsByStage(supabase, currentTenant!.id, stage.id);
          return {
            ...stage,
            leads: leads || []
          };
        })
      );

      setStages(stagesWithLeads);
    } catch (error) {
      console.error('Error loading pipeline:', error);
      toast({
        title: "Error",
        description: "Failed to load pipeline. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadMetrics = async () => {
    try {
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
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;

    const sourceStageId = result.source.droppableId;
    const destStageId = result.destination.droppableId;
    
    if (sourceStageId === destStageId) return;

    try {
      const supabase = createClient();
      const leadId = result.draggableId;

      // Optimistically update the UI first
      const newStages = [...stages];
      const sourceStage = newStages.find(s => s.id === sourceStageId);
      const destStage = newStages.find(s => s.id === destStageId);
      
      if (sourceStage && destStage) {
        const [lead] = sourceStage.leads.splice(result.source.index, 1);
        destStage.leads.splice(result.destination.index, 0, lead);
        setStages(newStages);
      }

      // Then update the backend
      await updateLeadStage(
        supabase,
        leadId,
        destStageId,
        user.id
      );

      toast({
        title: "Success",
        description: "Lead stage updated successfully.",
      });
    } catch (error) {
      console.error('Error updating lead stage:', error);
      toast({
        title: "Error",
        description: "Failed to update lead stage. Please try again.",
        variant: "destructive",
      });
      // Reload pipeline to ensure consistency
      loadPipeline();
    }
  };

  const handleCardClick = (leadId: string, e: React.MouseEvent) => {
    // Prevent click when dragging
    if (e.defaultPrevented) return;
    router.push(`/leads/${leadId}`);
  };

  const getStageMetrics = (stageName: string) => {
    return metrics.find(m => m.stage_name === stageName);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadPipeline(), loadMetrics()]);
    setRefreshing(false);
  };

  const filterLeads = (leads: Lead[]) => {
    return leads.filter(lead => {
      const matchesSearch = searchTerm === '' || 
        lead.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.contact_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = filterStatus.length === 0 || 
        filterStatus.includes(lead.status);

      return matchesSearch && matchesStatus;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <div className="text-lg font-semibold">Loading Pipeline...</div>
          <div className="text-sm text-muted-foreground">Please wait while we fetch the data.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-4">
      <Breadcrumb 
        items={[
          { label: 'CRM', href: '/leads' },
          { label: 'Leads', href: '/leads' },
          { label: 'Pipeline' }
        ]} 
      />
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <h2 className="text-2xl font-bold">Lead Pipeline</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => router.push('/leads')}
              className="ml-2"
            >
              <List className="h-4 w-4 mr-2" />
              List View
            </Button>
          </div>
          <Link href="/leads/add">
            <Button variant="default">+ Add New</Button>
          </Link>
        </div>

        {/* Summary Metrics */}
        {summaryMetrics && (
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryMetrics.total_leads}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Qualified Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryMetrics.total_qualified}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryMetrics.conversion_rate}%</div>
                <Progress value={summaryMetrics.conversion_rate} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Avg. Time to Qualify</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summaryMetrics.avg_time_to_qualify}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {STATUSES.map((status: LeadStatus) => (
                <DropdownMenuCheckboxItem
                  key={status}
                  checked={filterStatus.includes(status)}
                  onCheckedChange={(checked) => {
                    setFilterStatus(prev => 
                      checked 
                        ? [...prev, status]
                        : prev.filter(s => s !== status)
                    );
                  }}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {/* Pipeline View */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="flex gap-4 overflow-x-auto p-4">
            {stages.map((stage) => {
              const stageMetrics = getStageMetrics(stage.name);
              const filteredLeads = filterLeads(stage.leads);
              return (
                <div key={stage.id} className="flex-none w-80">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex justify-between items-center">
                        <span>{stage.name}</span>
                        <Badge variant="secondary">
                          {filteredLeads.length}
                        </Badge>
                      </CardTitle>
                      {stageMetrics && (
                        <div className="space-y-2 mt-2">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            Avg. Time: {stageMetrics.avg_time_in_stage}
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground">
                            <TrendingUp className="h-4 w-4 mr-1" />
                            Conversion: {stageMetrics.conversion_rate}%
                          </div>
                          <Progress 
                            value={stageMetrics.conversion_rate} 
                            className="h-1"
                          />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <Droppable droppableId={stage.id}>
                        {(provided: DroppableProvided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="space-y-2 min-h-[200px]"
                          >
                            {filteredLeads.map((lead, index) => (
                              <Draggable
                                key={lead.id}
                                draggableId={lead.id}
                                index={index}
                              >
                                {(provided: DraggableProvided) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className="p-3 bg-card border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={(e) => handleCardClick(lead.id, e)}
                                  >
                                    <div className="font-medium">{lead.company_name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      {lead.contact_name}
                                    </div>
                                    {lead.assigned_to && (
                                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                                        <Users className="h-3 w-3 mr-1" />
                                        {lead.assigned_to.given_name} {lead.assigned_to.surname}
                                      </div>
                                    )}
                                    <Badge 
                                      variant={lead.status === 'qualified' ? 'default' : 'secondary'}
                                      className="mt-2"
                                    >
                                      {lead.status}
                                    </Badge>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
    </div>
  );
} 