'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from '@/utils/supabase/client';
import { SupabaseClient } from '@supabase/supabase-js';
import { useTenant } from '@/utils/tenant-context';
import { toast } from "@/components/ui/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { addContractType, getContractType, updateContractType } from '@/utils/supabase/queries';

interface FormData {
  name: string;
  description: string;
  payment_type: string;
}

const initialFormData: FormData = {
  name: '',
  description: '',
  payment_type: '',
};

const PAYMENT_TYPES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'one_time', label: 'One Time' },
];

export default function AddContractTypeForm({ contractTypeId }: { contractTypeId: string | null }) {
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
        if (contractTypeId) {
          const contractType = await getContractType(supabase, contractTypeId);
          if (contractType) {
            setFormData({
              name: contractType.name,
              description: contractType.description || '',
              payment_type: contractType.payment_type,
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
  }, [contractTypeId, currentTenant]);

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

    if (!formData.name || !formData.payment_type) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const contractTypeData = {
        ...formData,
        tenant_id: currentTenant.id
      };

      if (contractTypeId) {
        await updateContractType(supabase, { id: contractTypeId, ...contractTypeData });
      } else {
        await addContractType(supabase, contractTypeData);
      }

      router.push('/master/contract-types');
      toast({
        title: "Success",
        description: `Contract type ${contractTypeId ? 'updated' : 'added'} successfully.`,
      });
    } catch (error: any) {
      setError(error.message || 'Failed to save contract type.');
      console.error('Error saving contract type:', error);
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
          <CardTitle>{contractTypeId ? 'Edit Contract Type' : 'Add New Contract Type'}</CardTitle>
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

              <div>
                <Label htmlFor="payment_type">Payment Type *</Label>
                <Select
                  value={formData.payment_type}
                  onValueChange={(value) => handleSelectChange('payment_type', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYMENT_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {error && <div className="text-red-500 bg-red-100 p-2 rounded">{error}</div>}

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/employees/contract-types')}
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