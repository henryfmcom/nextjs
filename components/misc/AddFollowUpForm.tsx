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
import { addLeadFollowUp, getActiveEmployees } from '@/utils/supabase/queries';
import { toast } from '@/components/ui/use-toast';
import { Plus } from 'lucide-react';
import { useTenant } from '@/utils/tenant-context';

interface AddFollowUpFormProps {
  leadId: string;
  onSuccess: () => void;
}

interface Employee {
  id: string;
  given_name: string;
  surname: string;
}

interface FormData {
  description: string;
  due_date: string;
  due_time: string;
  priority: 'low' | 'medium' | 'high';
  assigned_to: string;
}

export function AddFollowUpForm({ leadId, onSuccess }: AddFollowUpFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const { currentTenant } = useTenant();
  const [formData, setFormData] = useState<FormData>({
    description: '',
    due_date: new Date().toISOString().split('T')[0],
    due_time: new Date().toTimeString().slice(0, 5),
    priority: 'medium',
    assigned_to: ''
  });

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
    if (!currentTenant || !formData.assigned_to) {
      toast({
        title: "Error",
        description: "Please select an assignee",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      
      // Combine date and time
      const dueDate = new Date(`${formData.due_date}T${formData.due_time}`);

      await addLeadFollowUp(supabase, {
        lead_id: leadId,
        description: formData.description,
        due_date: dueDate.toISOString(),
        priority: formData.priority,
        assigned_to: formData.assigned_to,
        tenant_id: currentTenant.id
      });

      toast({
        title: 'Success',
        description: 'Follow-up added successfully',
      });
      
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error adding follow-up:', error);
      toast({
        title: 'Error',
        description: 'Failed to add follow-up',
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
          Add Follow-up
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Schedule Follow-up</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="due_date">Due Date</Label>
              <Input
                id="due_date"
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData(prev => ({ ...prev, due_date: e.target.value }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="due_time">Time</Label>
              <Input
                id="due_time"
                type="time"
                value={formData.due_time}
                onChange={(e) => setFormData(prev => ({ ...prev, due_time: e.target.value }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="priority">Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: 'low' | 'medium' | 'high') => 
                setFormData(prev => ({ ...prev, priority: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="assigned_to">Assign To</Label>
            <Select
              value={formData.assigned_to}
              onValueChange={(value) => setFormData(prev => ({ ...prev, assigned_to: value }))}
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
              {loading ? 'Adding...' : 'Add Follow-up'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 