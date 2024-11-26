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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/components/ui/use-toast";
import { getDepartments, addPosition, getPosition, updatePosition } from '@/utils/supabase/queries';
import { DepartmentSelect } from "@/components/ui/department-select";

interface FormData {
  title: string;
  department_id: string;
  level: string;
  is_active: boolean;
}

interface Department {
  id: string;
  name: string;
  parent_department_id: string | null;
}

interface FormattedDepartment extends Department {
  level: number;
  displayName: string;
}

const initialFormData: FormData = {
  title: '',
  department_id: '',
  level: '',
  is_active: true,
};

export default function AddPositionForm({ positionId }: { positionId: string | null }) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [departments, setDepartments] = useState<FormattedDepartment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const supabase: SupabaseClient = createClient();
  const { currentTenant } = useTenant();

  const formatDepartmentsHierarchy = (
    allDepartments: Department[],
    parentId: string | null = null,
    level: number = 0
  ): FormattedDepartment[] => {
    const result: FormattedDepartment[] = [];
    
    const depts = allDepartments.filter(d => d.parent_department_id === parentId);
    
    depts.forEach(dept => {
      const prefix = '—'.repeat(level);
      result.push({
        ...dept,
        level,
        displayName: level > 0 ? `${prefix} ${dept.name}` : dept.name
      });
      
      const children = formatDepartmentsHierarchy(allDepartments, dept.id, level + 1);
      result.push(...children);
    });
    
    return result;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!currentTenant) return;

      try {
        setLoading(true);
        // Fetch departments
        const { departments: departmentsData } = await getDepartments(supabase, currentTenant.id);
        if (departmentsData) {
          const formattedDepts = formatDepartmentsHierarchy(departmentsData);
          setDepartments(formattedDepts);
        }

        // Fetch position if editing
        if (positionId) {
          const position = await getPosition(supabase, positionId);
          if (position) {
            setFormData({
              title: position.title,
              department_id: position.department_id || '',
              level: position.level || '',
              is_active: position.is_active,
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
  }, [positionId, currentTenant]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    if (!formData.title || !formData.department_id) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const positionData = {
        ...formData,
        tenant_id: currentTenant.id
      };

      if (positionId) {
        await updatePosition(supabase, { id: positionId, ...positionData });
      } else {
        await addPosition(supabase, positionData);
      }

      router.push('/master/positions');
      toast({
        title: "Success",
        description: `Position ${positionId ? 'updated' : 'added'} successfully.`,
      });
    } catch (error: any) {
      setError(error.message || 'Failed to save position.');
      console.error('Error saving position:', error);
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
          <CardTitle>{positionId ? 'Edit Position' : 'Add New Position'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="title">Position Title *</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="department_id">Department *</Label>
                <DepartmentSelect
                  value={formData.department_id}
                  onValueChange={(value) => handleSelectChange('department_id', value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="level">Level</Label>
                <Input
                  id="level"
                  name="level"
                  value={formData.level}
                  onChange={handleInputChange}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, is_active: checked }))
                  }
                />
                <Label htmlFor="is_active">Active</Label>
              </div>

              {error && <div className="text-red-500 bg-red-100 p-2 rounded">{error}</div>}

              <div className="flex justify-end space-x-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push('/master/positions')}
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