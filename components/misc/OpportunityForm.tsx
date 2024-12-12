'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { ProjectSelector } from '@/components/misc/ProjectSelector';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";

interface Project {
  id: string;
  name: string;
  code: string;
}

interface OpportunityFormProps {
  opportunityId: string | null;
}

export default function OpportunityForm({ opportunityId }: OpportunityFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    expected_revenue: 0,
    probability: 0,
    expected_close_date: '',
    projects: [] as string[],
  });
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projectSearchOpen, setProjectSearchOpen] = useState(false);
  const router = useRouter();
  const { currentTenant } = useTenant();

  useEffect(() => {
    const fetchData = async () => {
      if (!currentTenant) return;

      try {
        const supabase = createClient();

        // Fetch projects
        const { data: projectsData } = await supabase
          .from('Projects')
          .select('id, name, code')
          .eq('tenant_id', currentTenant.id)
          .eq('is_deleted', false);

        if (projectsData) {
          setProjects(projectsData);
        }

        // Fetch opportunity if editing
        if (opportunityId) {
          const { data: opportunity } = await supabase
            .from('Opportunities')
            .select('*, projects:OpportunityProjects(project_id)')
            .eq('id', opportunityId)
            .single();

          if (opportunity && opportunity.tenant_id === currentTenant.id) {
            setFormData({
              title: opportunity.title,
              description: opportunity.description,
              expected_revenue: opportunity.expected_revenue,
              probability: opportunity.probability,
              expected_close_date: opportunity.expected_close_date,
              projects: opportunity.projects.map((p: any) => p.project_id),
            });
            setSelectedProjects(opportunity.projects.map((p: any) => p.project_id));
          } else {
            toast({
              title: "Error",
              description: "Opportunity not found or belongs to different tenant.",
              variant: "destructive",
            });
            router.push('/opportunities');
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      }
    };

    fetchData();
  }, [opportunityId, currentTenant]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentTenant) {
      setError('No tenant selected');
      return;
    }

    try {
      const supabase = createClient();

      const opportunityData = {
        ...formData,
        tenant_id: currentTenant.id,
      };

      if (opportunityId) {
        // Update opportunity
        const { error: updateError } = await supabase
          .from('Opportunities')
          .update(opportunityData)
          .eq('id', opportunityId);

        if (updateError) throw updateError;

        // Update projects
        // First, remove all existing project associations
        await supabase
          .from('OpportunityProjects')
          .delete()
          .eq('opportunity_id', opportunityId);

        // Then add new project associations
        const projectAssociations = selectedProjects.map(projectId => ({
          opportunity_id: opportunityId,
          project_id: projectId,
        }));

        if (projectAssociations.length > 0) {
          const { error: projectError } = await supabase
            .from('OpportunityProjects')
            .insert(projectAssociations);

          if (projectError) throw projectError;
        }
      } else {
        // Create new opportunity
        const { data: newOpportunity, error: insertError } = await supabase
          .from('Opportunities')
          .insert(opportunityData)
          .select()
          .single();

        if (insertError) throw insertError;

        // Add project associations
        const projectAssociations = selectedProjects.map(projectId => ({
          opportunity_id: newOpportunity.id,
          project_id: projectId,
        }));

        if (projectAssociations.length > 0) {
          const { error: projectError } = await supabase
            .from('OpportunityProjects')
            .insert(projectAssociations);

          if (projectError) throw projectError;
        }
      }

      toast({
        title: "Success",
        description: `Opportunity ${opportunityId ? 'updated' : 'created'} successfully.`,
      });
      router.push('/opportunities');
      router.refresh();
    } catch (error: any) {
      console.error('Error saving opportunity:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to save opportunity",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{opportunityId ? 'Edit' : 'Add'} Opportunity</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="expected_revenue">Expected Revenue</Label>
              <Input
                id="expected_revenue"
                name="expected_revenue"
                type="number"
                value={formData.expected_revenue}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="probability">Probability (%)</Label>
              <Input
                id="probability"
                name="probability"
                type="number"
                min="0"
                max="100"
                value={formData.probability}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="expected_close_date">Expected Close Date</Label>
              <Input
                id="expected_close_date"
                name="expected_close_date"
                type="date"
                value={formData.expected_close_date}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label>Related Projects</Label>
              <Popover open={projectSearchOpen} onOpenChange={setProjectSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={projectSearchOpen}
                    className="justify-between"
                  >
                    Select projects...
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command>
                    <CommandInput placeholder="Search projects..." />
                    <CommandEmpty>No projects found.</CommandEmpty>
                    <CommandGroup>
                      {projects.map((project) => (
                        <CommandItem
                          key={project.id}
                          onSelect={() => {
                            const newSelectedProjects = selectedProjects.includes(project.id)
                              ? selectedProjects.filter(id => id !== project.id)
                              : [...selectedProjects, project.id];
                            setSelectedProjects(newSelectedProjects);
                            setFormData(prev => ({ ...prev, projects: newSelectedProjects }));
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedProjects.includes(project.id) ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {project.name} ({project.code})
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>

              <div className="flex gap-1 flex-wrap mt-2">
                {selectedProjects.map(projectId => {
                  const project = projects.find(p => p.id === projectId);
                  return project ? (
                    <Badge
                      key={project.id}
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      {project.name}
                      <button
                        type="button"
                        className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        onClick={() => {
                          const newSelectedProjects = selectedProjects.filter(id => id !== project.id);
                          setSelectedProjects(newSelectedProjects);
                          setFormData(prev => ({ ...prev, projects: newSelectedProjects }));
                        }}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ) : null;
                })}
              </div>
            </div>
          </div>

          {error && <div className="text-red-500">{error}</div>}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/opportunities')}
            >
              Cancel
            </Button>
            <Button type="submit">
              {opportunityId ? 'Update' : 'Create'} Opportunity
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}