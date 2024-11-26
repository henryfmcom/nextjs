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
  rejectWorkLog,
  bulkAddWorkLogs
} from '@/utils/supabase/queries';
import { Badge } from "@/components/ui/badge";
import { Check, X, Plus, Trash2 } from "lucide-react";
import { format } from 'date-fns';

interface WorkLogDate {
  id: string; // For React key
  date: string;
  required: boolean;
}

interface FormData {
  employee_id: string;
  schedule_type_id: string;
  start_time: string;
  end_time: string;
  break_duration: string;
  description: string;
  dates: WorkLogDate[];
  status?: string;
  approved_by?: string | null;
  approved_at?: string | null;
}

const initialFormData: FormData = {
  employee_id: '',
  schedule_type_id: '',
  start_time: '09:00',
  end_time: '18:00',
  break_duration: '60',
  description: '',
  dates: [{
    id: crypto.randomUUID(),
    date: format(new Date(), 'yyyy-MM-dd'),
    required: true
  }],
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
              start_time: workLog.start_time,
              end_time: workLog.end_time,
              break_duration: workLog.break_duration.toString(),
              description: workLog.description || '',
              status: workLog.status,
              approved_by: workLog.approved_by,
              approved_at: workLog.approved_at,
              dates: workLog.dates.map((date: any) => ({
                id: date.id,
                date: date.date.split('T')[0],
                required: date.required
              }))
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

  const addDate = () => {
    setFormData(prev => ({
      ...prev,
      dates: [
        ...prev.dates,
        {
          id: crypto.randomUUID(),
          date: '',
          required: false
        }
      ]
    }));
  };

  const removeDate = (id: string) => {
    setFormData(prev => ({
      ...prev,
      dates: prev.dates.filter(d => d.id !== id)
    }));
  };

  const handleDateChange = (id: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      dates: prev.dates.map(d => 
        d.id === id ? { ...d, date: value } : d
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentTenant) {
      setError('No tenant selected');
      return;
    }

    // Validate required fields
    if (!formData.employee_id || !formData.schedule_type_id || 
        !formData.start_time || !formData.end_time || 
        !formData.dates.some(d => d.required && d.date)) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const supabase = createClient();
      
      // Filter out empty dates
      const validDates = formData.dates.filter(d => d.date);
      
      // Create work log entries for each date
      const workLogs = validDates.map(dateEntry => ({
        employee_id: formData.employee_id,
        schedule_type_id: formData.schedule_type_id,
        date: dateEntry.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        break_duration: parseInt(formData.break_duration) || 0,
        description: formData.description,
        status: 'pending',
        tenant_id: currentTenant.id
      }));

      if (workLogId) {
        await updateWorkLog(supabase, {
          id: workLogId,
          ...workLogs[0] // In edit mode, only update the single record
        });
      } else {
        await bulkAddWorkLogs(supabase, workLogs);
      }

      toast({
        title: "Success",
        description: `Work log${workLogs.length > 1 ? 's' : ''} ${workLogId ? 'updated' : 'added'} successfully.`,
      });
      router.push('/work-logs');
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{workLogId ? 'Edit Work Log' : 'New Work Log'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-2">
              <Label>Date{formData.dates.length > 1 ? 's' : ''}</Label>
              {formData.dates.map((dateEntry, index) => (
                <div key={dateEntry.id} className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={dateEntry.date}
                    onChange={(e) => handleDateChange(dateEntry.id, e.target.value)}
                    required={dateEntry.required}
                  />
                  {!dateEntry.required && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeDate(dateEntry.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
              {!workLogId && ( // Only show add button in create mode
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addDate}
                  className="mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Date
                </Button>
              )}
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
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 