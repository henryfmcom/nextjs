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
import { getOpportunityFormData, createOpportunity, updateOpportunity } from '@/utils/supabase/queries';
import { useTranslations } from '@/utils/i18n/TranslationsContext';

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
    currency: 'USD',
    status: 'open',
    stage_id: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projectSearchOpen, setProjectSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();
  const { currentTenant } = useTenant();
  const { t } = useTranslations();

  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

        if (projectsData) {
          setProjects(projectsData);
        }

        // Fetch opportunity if editing
        if (opportunityId) {
          const formData = await getOpportunityFormData(supabase, opportunityId, currentTenant.id);
          
          if (formData) {
            setFormData(formData);
            setSelectedProjects(formData.projects);
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
        await updateOpportunity(supabase, opportunityId, opportunityData, selectedProjects);
      } else {
        await createOpportunity(supabase, opportunityData, selectedProjects);
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
        <CardTitle>
          {opportunityId ? t('opportunities.edit') : t('opportunities.add')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="title">{t('opportunities.form.title')}</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="description">{t('opportunities.form.description')}</Label>
              <Input
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
              />
            </div>

            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="expected_revenue">{t('opportunities.form.expected_revenue')}</Label>
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
              <Label htmlFor="probability">{t('opportunities.form.probability')}</Label>
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
              <Label htmlFor="expected_close_date">{t('opportunities.form.expected_close_date')}</Label>
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
              <Label>{t('opportunities.form.projects')}</Label>
              <Popover open={projectSearchOpen} onOpenChange={setProjectSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={projectSearchOpen}
                    className="justify-between"
                  >
                    {selectedProjects.length > 0
                      ? `${selectedProjects.length} project${selectedProjects.length === 1 ? '' : 's'} selected`
                      : t('opportunities.form.select_projects')}
                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0">
                  <Command>
                    <CommandInput 
                      placeholder={t('common.search')} 
                      value={searchQuery}
                      onValueChange={setSearchQuery}
                    />
                    <CommandEmpty>
                      {t('opportunities.form.no_projects')}
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredProjects.map((project) => (
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
              {t('common.cancel')}
            </Button>
            <Button type="submit">
              {t('common.save')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}