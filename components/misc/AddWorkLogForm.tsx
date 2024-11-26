'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from '@/utils/supabase/client';
import { SupabaseClient, User } from '@supabase/supabase-js';
import { useTenant } from '@/utils/tenant-context';
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { 
  getEmployees,
  getWorkScheduleTypes,
  getWorkLog,
  addWorkLog,
  updateWorkLog,
  approveWorkLog,
  rejectWorkLog
} from '@/utils/supabase/queries';
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

interface FormData {
  employee_id: string;
  schedule_type_id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_duration: string;
  description: string;
  status?: string;
  approved_by?: string | null;
  approved_at?: string | null;
}

const initialFormData: FormData = {
  employee_id: '',
  schedule_type_id: '',
  date: '',
  start_time: '09:00',
  end_time: '18:00',
  break_duration: '60',
  description: '',
  status: 'pending',
  approved_by: null,
  approved_at: null,
};

interface AddWorkLogFormProps {
  workLogId: string | null;
  user: User;
}

export default function AddWorkLogForm({ workLogId, user }: AddWorkLogFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [employees, setEmployees] = useState<any[]>([]);
  const [scheduleTypes, setScheduleTypes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase: SupabaseClient = createClient();
  const { currentTenant } = useTenant();

  useEffect(() => {
    const fetchData = async () => {
      if (!currentTenant) return;

      try {
        setLoading(true);
        // Fetch employees
        const { employees: employeesData } = await getEmployees(supabase, currentTenant.id);
        if (employeesData) {
          setEmployees(employeesData.map(emp => ({
            id: emp.id,
            name: `${emp.given_name} ${emp.surname}`
          })));
        }

        // Fetch schedule types
        const { scheduleTypes: scheduleTypesData } = await getWorkScheduleTypes(supabase, currentTenant.id);
        if (scheduleTypesData) {
          setScheduleTypes(scheduleTypesData);
        }

        // Fetch work log if editing
        if (workLogId) {
          const workLog = await getWorkLog(supabase, workLogId);
          if (workLog) {
            setFormData({
              employee_id: workLog.employee_id,
              schedule_type_id: workLog.schedule_type_id,
              date: workLog.date.split('T')[0],
              start_time: workLog.start_time,
              end_time: workLog.end_time,
              break_duration: workLog.break_duration.toString(),
              description: workLog.description || '',
              status: workLog.status,
              approved_by: workLog.approved_by,
              approved_at: workLog.approved_at,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [workLogId, currentTenant]);

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
      setError('No tenant selected. Please select a tenant from account settings.');
      return;
    }

    if (!formData.employee_id || !formData.schedule_type_id || !formData.date || 
        !formData.start_time || !formData.end_time) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const workLogData = {
        ...formData,
        break_duration: parseInt(formData.break_duration) || 0,
        status: 'pending',
        tenant_id: currentTenant.id
      };

      if (workLogId) {
        await updateWorkLog(supabase, { id: workLogId, ...workLogData });
      } else {
        await addWorkLog(supabase, workLogData);
      }

      router.push('/work-logs');
      toast({
        title: "Success",
        description: `Work log ${workLogId ? 'updated' : 'added'} successfully.`,
      });
    } catch (error: any) {
      setError(error.message || 'Failed to save work log.');
      console.error('Error saving work log:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'approved':
        return <Badge variant="default">{status}</Badge>;
      case 'rejected':
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleApprove = async () => {
    try {
      await approveWorkLog(supabase, workLogId!, user.id);
      toast({
        title: "Success",
        description: "Work log approved successfully.",
      });
      router.push('/work-logs');
    } catch (error) {
      console.error('Error approving work log:', error);
      toast({
        title: "Error",
        description: "Failed to approve work log. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async () => {
    try {
      await rejectWorkLog(supabase, workLogId!, user.id);
      toast({
        title: "Success",
        description: "Work log rejected successfully.",
      });
      router.push('/work-logs');
    } catch (error) {
      console.error('Error rejecting work log:', error);
      toast({
        title: "Error",
        description: "Failed to reject work log. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto max-w-2xl">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle>{workLogId ? 'Edit Work Log' : 'Add New Work Log'}</CardTitle>
            {workLogId && formData.status && (
              <div>{getStatusBadge(formData.status)}</div>
            )}
          </div>
          {workLogId && formData.status === 'pending' && (
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleApprove}
                className="text-green-600 hover:text-green-700"
                title="Approve"
              >
                <Check className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleReject}
                className="text-red-600 hover:text-red-700"
                title="Reject"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="employee_id">Employee *</Label>
                <Select
                  value={formData.employee_id}
                  onValueChange={(value) => handleSelectChange('employee_id', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="schedule_type_id">Schedule Type *</Label>
                <Select
                  value={formData.schedule_type_id}
                  onValueChange={(value) => handleSelectChange('schedule_type_id', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select schedule type" />
                  </SelectTrigger>
                  <SelectContent>
                    {scheduleTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} ({type.multiplier}x)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    name="start_time"
                    type="time"
                    value={formData.start_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="end_time">End Time *</Label>
                  <Input
                    id="end_time"
                    name="end_time"
                    type="time"
                    value={formData.end_time}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="break_duration">Break Duration (minutes)</Label>
                <Input
                  id="break_duration"
                  name="break_duration"
                  type="number"
                  min="0"
                  value={formData.break_duration}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>

              {formData.status && formData.status !== 'pending' && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <div className="text-sm text-muted-foreground">
                    {formData.status === 'approved' ? 'Approved' : 'Rejected'} by{' '}
                    {formData.approved_by} on{' '}
                    {formData.approved_at && new Date(formData.approved_at).toLocaleString()}
                  </div>
                </div>
              )}

              {error && <div className="text-red-500 bg-red-100 p-2 rounded">{error}</div>}

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/work-logs')}
                >
                  Cancel
                </Button>
                <Button type="submit">Submit</Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 