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
import { getPublicHoliday, addPublicHoliday, updatePublicHoliday } from '@/utils/supabase/queries';

interface FormData {
  date: string;
  name: string;
}

const initialFormData: FormData = {
  date: '',
  name: '',
};

export default function AddPublicHolidayForm({ holidayId }: { holidayId: string | null }) {
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
        if (holidayId) {
          const holiday = await getPublicHoliday(supabase, holidayId);
          if (holiday) {
            setFormData({
              date: holiday.date.split('T')[0],
              name: holiday.name,
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
  }, [holidayId, currentTenant]);

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

    if (!formData.date || !formData.name) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const holidayData = {
        ...formData,
        tenant_id: currentTenant.id
      };

      if (holidayId) {
        await updatePublicHoliday(supabase, { id: holidayId, ...holidayData });
      } else {
        await addPublicHoliday(supabase, holidayData);
      }

      router.push('/master/holidays');
      toast({
        title: "Success",
        description: `Holiday ${holidayId ? 'updated' : 'added'} successfully.`,
      });
    } catch (error: any) {
      setError(error.message || 'Failed to save holiday.');
      console.error('Error saving holiday:', error);
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
          <CardTitle>{holidayId ? 'Edit Holiday' : 'Add New Holiday'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
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

              <div>
                <Label htmlFor="name">Holiday Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {error && <div className="text-red-500 bg-red-100 p-2 rounded">{error}</div>}

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/master/holidays')}
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