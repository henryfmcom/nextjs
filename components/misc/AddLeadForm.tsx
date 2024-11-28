'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { addLead, updateLead, getLead } from '@/utils/supabase/queries';

interface FormData {
  company_name: string;
  industry: string;
  website: string;
  employee_count_range: string;
  annual_revenue_range: string;
  contact_name: string;
  contact_title: string;
  contact_email: string;
  contact_phone: string;
  source_id: string;
  current_stage_id: string;
  status: string;
  assigned_to: string;
  notes: string;
}

interface Source {
  id: string;
  name: string;
}

interface Stage {
  id: string;
  name: string;
  order_index: number;
}

interface Employee {
  id: string;
  given_name: string;
  surname: string;
}

const EMPLOYEE_RANGES = [
  '1-10',
  '11-50',
  '51-200',
  '201-500',
  '501-1000',
  '1000+'
];

const REVENUE_RANGES = [
  'Under $1M',
  '$1M-$10M',
  '$10M-$50M',
  '$50M-$100M',
  '$100M+'
];

const STATUSES = [
  'new',
  'contacted',
  'qualified',
  'unqualified'
];

export default function AddLeadForm({ leadId }: { leadId: string | null }) {
  const [formData, setFormData] = useState<FormData>({
    company_name: '',
    industry: '',
    website: '',
    employee_count_range: '',
    annual_revenue_range: '',
    contact_name: '',
    contact_title: '',
    contact_email: '',
    contact_phone: '',
    source_id: '',
    current_stage_id: '',
    status: 'new',
    assigned_to: '',
    notes: ''
  });
  const [sources, setSources] = useState<Source[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { currentTenant } = useTenant();

  useEffect(() => {
    if (currentTenant) {
      loadData();
    }
  }, [currentTenant, leadId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const supabase = createClient();

      // Load reference data
      const [
        { data: sourcesData },
        { data: stagesData },
        { data: employeesData }
      ] = await Promise.all([
        supabase
          .from('LeadSources')
          .select('*')
          .eq('tenant_id', currentTenant!.id)
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('LeadStages')
          .select('*')
          .eq('tenant_id', currentTenant!.id)
          .eq('is_active', true)
          .order('order_index'),
        supabase
          .from('Employees')
          .select('id, given_name, surname')
          .eq('tenant_id', currentTenant!.id)
          .eq('is_active', true)
          .order('surname')
      ]);

      setSources(sourcesData || []);
      setStages(stagesData || []);
      setEmployees(employeesData || []);

      // Load lead data if editing
      if (leadId) {
        const { data: lead } = await supabase
          .from('Leads')
          .select('*')
          .eq('id', leadId)
          .single();

        if (lead) {
          setFormData(lead);
        }
      } else if (stagesData?.length) {
        // Set initial stage for new leads
        setFormData(prev => ({
          ...prev,
          current_stage_id: stagesData[0].id
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      const leadData = {
        ...formData,
        tenant_id: currentTenant.id
      };

      if (leadId) {
        await updateLead(supabase, leadData);
      } else {
        await addLead(supabase, leadData);
      }

      toast({
        title: "Success",
        description: `Lead ${leadId ? 'updated' : 'created'} successfully.`,
      });
      router.push('/leads');
    } catch (error: any) {
      setError(error.message || 'Failed to save lead');
      console.error('Error saving lead:', error);
    }
  };

  useEffect(() => {
    const loadLead = async () => {
      if (!leadId || !currentTenant) return;

      try {
        const supabase = createClient();
        const lead = await getLead(supabase, leadId);
        if (lead) {
          setFormData(lead);
        }
      } catch (error) {
        console.error('Error loading lead:', error);
        setError('Failed to load lead data');
      }
    };

    loadLead();
  }, [leadId, currentTenant]);

  if (!currentTenant) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold">No Tenant Selected</h2>
          <p className="text-muted-foreground">Please select a tenant from your account settings.</p>
          <Button 
            className="mt-4"
            onClick={() => router.push('/account')}
          >
            Go to Account Settings
          </Button>
        </div>
      </div>
    );
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{leadId ? 'Edit Lead' : 'Add New Lead'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Company Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Company Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="company_name">Company Name *</Label>
                  <Input
                    id="company_name"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    type="url"
                    value={formData.website}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="employee_count_range">Employee Count Range</Label>
                  <Select
                    value={formData.employee_count_range}
                    onValueChange={(value) => handleSelectChange('employee_count_range', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYEE_RANGES.map(range => (
                        <SelectItem key={range} value={range}>
                          {range}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_name">Contact Name *</Label>
                  <Input
                    id="contact_name"
                    name="contact_name"
                    value={formData.contact_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="contact_title">Title</Label>
                  <Input
                    id="contact_title"
                    name="contact_title"
                    value={formData.contact_title}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="contact_email">Email</Label>
                  <Input
                    id="contact_email"
                    name="contact_email"
                    type="email"
                    value={formData.contact_email}
                    onChange={handleInputChange}
                  />
                </div>
                <div>
                  <Label htmlFor="contact_phone">Phone</Label>
                  <Input
                    id="contact_phone"
                    name="contact_phone"
                    value={formData.contact_phone}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Lead Details */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Lead Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="source_id">Source *</Label>
                  <Select
                    value={formData.source_id}
                    onValueChange={(value) => handleSelectChange('source_id', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {sources.map(source => (
                        <SelectItem key={source.id} value={source.id}>
                          {source.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="current_stage_id">Stage *</Label>
                  <Select
                    value={formData.current_stage_id}
                    onValueChange={(value) => handleSelectChange('current_stage_id', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {stages.map(stage => (
                        <SelectItem key={stage.id} value={stage.id}>
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status *</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => handleSelectChange('status', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map(status => (
                        <SelectItem key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assigned_to">Assigned To</Label>
                  <Select
                    value={formData.assigned_to}
                    onValueChange={(value) => handleSelectChange('assigned_to', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map(employee => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {`${employee.given_name} ${employee.surname}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={4}
                />
              </div>
            </div>

            {error && <div className="text-red-500 bg-red-100 p-2 rounded">{error}</div>}

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/leads')}
              >
                Cancel
              </Button>
              <Button type="submit">Submit</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 