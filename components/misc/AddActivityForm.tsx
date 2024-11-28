'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createClient } from '@/utils/supabase/client';
import { addLeadActivity, LeadActivity, getActiveEmployees } from '@/utils/supabase/queries';
import { toast } from '@/components/ui/use-toast';
import { Plus } from 'lucide-react';
import { useTenant } from '@/utils/tenant-context';

interface AddActivityFormProps {
  leadId: string;
  onSuccess: () => void;
}

type ActivityType = LeadActivity['type'];

const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'email', label: 'Email' },
  { value: 'call', label: 'Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Note' },
  { value: 'task', label: 'Task' },
];

interface FormData {
  type: ActivityType | '';
  subject: string;
  description: string;
  activity_date: string;
  duration_minutes: string;
  status: 'planned' | 'completed' | 'cancelled';
  performed_by: string;
}

interface Employee {
  id: string;
  given_name: string;
  surname: string;
}

export function AddActivityForm({ leadId, onSuccess }: AddActivityFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [formData, setFormData] = useState<FormData>({
    type: '',
    subject: '',
    description: '',
    activity_date: new Date().toISOString().split('T')[0],
    duration_minutes: '',
    status: 'completed',
    performed_by: ''
  });
  const { currentTenant } = useTenant();

  useEffect(() => {
    const loadEmployees = async () => {
      if (!currentTenant) return;
      const supabase = createClient();
      const data = await getActiveEmployees(supabase, currentTenant.id);
      if (data) setEmployees(data);
    };

    loadEmployees();
  }, [currentTenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.type || !formData.performed_by) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      
      await addLeadActivity(supabase, {
        lead_id: leadId,
        type: formData.type,
        subject: formData.subject,
        description: formData.description,
        activity_date: formData.activity_date,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : undefined,
        status: formData.status,
        performed_by: formData.performed_by,
        tenant_id: currentTenant!.id
      });

      toast({
        title: 'Success',
        description: 'Activity added successfully',
      });
      
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error adding activity:', error);
      toast({
        title: 'Error',
        description: 'Failed to add activity',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Activity
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Activity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value: ActivityType) => 
                setFormData(prev => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select activity type" />
              </SelectTrigger>
              <SelectContent>
                {ACTIVITY_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="activity_date">Date</Label>
              <Input
                id="activity_date"
                type="date"
                value={formData.activity_date}
                onChange={(e) => setFormData(prev => ({ ...prev, activity_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="performed_by">Assigned To</Label>
            <Select
              value={formData.performed_by}
              onValueChange={(value) => setFormData(prev => ({ ...prev, performed_by: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map(employee => (
                  <SelectItem key={employee.id} value={employee.id}>
                    {employee.given_name} {employee.surname}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Adding...' : 'Add Activity'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 