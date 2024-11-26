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
import { 
  getEmployees,
  getPositions,
  getContractTypes,
  getEmployeeContract,
  addEmployeeContract,
  updateEmployeeContract
} from '@/utils/supabase/queries';

interface FormData {
  employee_id: string;
  contract_type_id: string;
  position_id: string;
  start_date: string;
  end_date?: string;
  base_salary: string;
  currency: string;
  working_hours: string;
  overtime_rate: string;
  weekend_rate: string;
  holiday_rate: string;
  probation_period: string;
  notice_period: string;
}

const initialFormData: FormData = {
  employee_id: '',
  contract_type_id: '',
  position_id: '',
  start_date: '',
  end_date: '',
  base_salary: '',
  currency: '',
  working_hours: '',
  overtime_rate: '',
  weekend_rate: '',
  holiday_rate: '',
  probation_period: '',
  notice_period: '',
};

const CURRENCIES = [
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
  { value: 'GBP', label: 'GBP' },
  // Add more currencies as needed
];

export default function AddEmployeeContractForm({ contractId }: { contractId: string | null }) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [employees, setEmployees] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [contractTypes, setContractTypes] = useState<any[]>([]);
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

        // Fetch positions
        const { positions: positionsData } = await getPositions(supabase, currentTenant.id);
        if (positionsData) {
          setPositions(positionsData);
        }

        // Fetch contract types
        const { contractTypes: contractTypesData } = await getContractTypes(supabase, currentTenant.id);
        if (contractTypesData) {
          setContractTypes(contractTypesData);
        }

        // Fetch contract if editing
        if (contractId) {
          const contract = await getEmployeeContract(supabase, contractId);
          if (contract) {
            setFormData({
              employee_id: contract.employee_id,
              contract_type_id: contract.contract_type_id,
              position_id: contract.position_id,
              start_date: contract.start_date.split('T')[0],
              end_date: contract.end_date ? contract.end_date.split('T')[0] : '',
              base_salary: contract.base_salary.toString(),
              currency: contract.currency,
              working_hours: contract.working_hours?.toString() || '',
              overtime_rate: contract.overtime_rate?.toString() || '',
              weekend_rate: contract.weekend_rate?.toString() || '',
              holiday_rate: contract.holiday_rate?.toString() || '',
              probation_period: contract.probation_period?.toString() || '',
              notice_period: contract.notice_period?.toString() || '',
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
  }, [contractId, currentTenant]);

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

    if (!formData.employee_id || !formData.contract_type_id || !formData.position_id || 
        !formData.start_date || !formData.base_salary || !formData.currency) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      const contractData = {
        ...formData,
        end_date: formData.end_date || undefined,
        base_salary: parseFloat(formData.base_salary),
        working_hours: formData.working_hours ? parseInt(formData.working_hours) : null,
        overtime_rate: formData.overtime_rate ? parseFloat(formData.overtime_rate) : null,
        weekend_rate: formData.weekend_rate ? parseFloat(formData.weekend_rate) : null,
        holiday_rate: formData.holiday_rate ? parseFloat(formData.holiday_rate) : null,
        probation_period: formData.probation_period ? parseInt(formData.probation_period) : null,
        notice_period: formData.notice_period ? parseInt(formData.notice_period) : null,
        tenant_id: currentTenant.id
      };

      if (!contractData.end_date) {
        delete contractData.end_date;
      }

      if (contractId) {
        await updateEmployeeContract(supabase, { id: contractId, ...contractData });
      } else {
        await addEmployeeContract(supabase, contractData);
      }

      router.push('/contracts');
      toast({
        title: "Success",
        description: `Contract ${contractId ? 'updated' : 'added'} successfully.`,
      });
    } catch (error: any) {
      setError(error.message || 'Failed to save contract.');
      console.error('Error saving contract:', error);
    }
  };

  // ... rest of the component (no tenant, loading states) ...

  return (
    <div className="container mx-auto max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>{contractId ? 'Edit Employee Contract' : 'Add New Employee Contract'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="position_id">Position *</Label>
                <Select
                  value={formData.position_id}
                  onValueChange={(value) => handleSelectChange('position_id', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select position" />
                  </SelectTrigger>
                  <SelectContent>
                    {positions.map((position) => (
                      <SelectItem key={position.id} value={position.id}>
                        {position.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Contract Type and Dates */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="contract_type_id">Contract Type *</Label>
                <Select
                  value={formData.contract_type_id}
                  onValueChange={(value) => handleSelectChange('contract_type_id', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {contractTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="start_date">Start Date *</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Salary Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base_salary">Base Salary *</Label>
                <Input
                  id="base_salary"
                  name="base_salary"
                  type="number"
                  step="0.01"
                  value={formData.base_salary}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div>
                <Label htmlFor="currency">Currency *</Label>
                <Select
                  value={formData.currency}
                  onValueChange={(value) => handleSelectChange('currency', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Work Schedule */}
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="working_hours">Working Hours/Week</Label>
                <Input
                  id="working_hours"
                  name="working_hours"
                  type="number"
                  value={formData.working_hours}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="overtime_rate">Overtime Rate</Label>
                <Input
                  id="overtime_rate"
                  name="overtime_rate"
                  type="number"
                  step="0.01"
                  value={formData.overtime_rate}
                  onChange={handleInputChange}
                  placeholder="e.g., 1.5"
                />
              </div>

              <div>
                <Label htmlFor="weekend_rate">Weekend Rate</Label>
                <Input
                  id="weekend_rate"
                  name="weekend_rate"
                  type="number"
                  step="0.01"
                  value={formData.weekend_rate}
                  onChange={handleInputChange}
                  placeholder="e.g., 2.0"
                />
              </div>

              <div>
                <Label htmlFor="holiday_rate">Holiday Rate</Label>
                <Input
                  id="holiday_rate"
                  name="holiday_rate"
                  type="number"
                  step="0.01"
                  value={formData.holiday_rate}
                  onChange={handleInputChange}
                  placeholder="e.g., 2.0"
                />
              </div>
            </div>

            {/* Terms */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="probation_period">Probation Period (months)</Label>
                <Input
                  id="probation_period"
                  name="probation_period"
                  type="number"
                  value={formData.probation_period}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <Label htmlFor="notice_period">Notice Period (months)</Label>
                <Input
                  id="notice_period"
                  name="notice_period"
                  type="number"
                  value={formData.notice_period}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {error && <div className="text-red-500 bg-red-100 p-2 rounded">{error}</div>}

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/contracts')}
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