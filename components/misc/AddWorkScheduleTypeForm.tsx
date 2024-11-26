'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import { useTenant } from '@/utils/tenant-context';
import { toast } from "@/components/ui/use-toast";
import { getWorkScheduleType, addWorkScheduleType, updateWorkScheduleType } from '@/utils/supabase/queries';

interface FormData {
  name: string;
  multiplier: string;
}

const initialFormData: FormData = {
  name: '',
  multiplier: '',
};

export default function AddWorkScheduleTypeForm({ scheduleTypeId }: { scheduleTypeId: string | null }) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
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
        if (scheduleTypeId) {
          const scheduleType = await getWorkScheduleType(supabase, scheduleTypeId);
          if (scheduleType) {
            setFormData({
              name: scheduleType.name,
              multiplier: scheduleType.multiplier.toString(),
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
  }, [scheduleTypeId, currentTenant]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
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

    if (!formData.name || !formData.multiplier) {
      setError('Please fill in all required fields.');
      return;
    }

    const multiplier = parseFloat(formData.multiplier);
    if (isNaN(multiplier) || multiplier <= 0) {
      setError('Multiplier must be a positive number.');
      return;
    }

    try {
      const scheduleTypeData = {
        ...formData,
        multiplier: parseFloat(formData.multiplier),
        tenant_id: currentTenant.id
      };

      if (scheduleTypeId) {
        await updateWorkScheduleType(supabase, { id: scheduleTypeId, ...scheduleTypeData });
      } else {
        await addWorkScheduleType(supabase, scheduleTypeData);
      }

      router.push('/master/schedules');
      toast({
        title: "Success",
        description: `Schedule type ${scheduleTypeId ? 'updated' : 'added'} successfully.`,
      });
    } catch (error: any) {
      setError(error.message || 'Failed to save schedule type.');
      console.error('Error saving schedule type:', error);
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
        <CardHeader>
          <CardTitle>{scheduleTypeId ? 'Edit Schedule Type' : 'Add New Schedule Type'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Regular, Weekend, Holiday"
                />
              </div>

              <div>
                <Label htmlFor="multiplier">Rate Multiplier *</Label>
                <Input
                  id="multiplier"
                  name="multiplier"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.multiplier}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., 1.0, 1.5, 2.0"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Regular rate = 1.0, Overtime = 1.5, etc.
                </p>
              </div>

              {error && <div className="text-red-500 bg-red-100 p-2 rounded">{error}</div>}

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/master/schedules')}
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