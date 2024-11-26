'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from '@/utils/supabase/client';
import { format, parse, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { useTenant } from '@/utils/tenant-context';
import { toast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type PayslipStatus = 'draft' | 'approved' | 'paid';

interface FormData {
  contract_id: string;
  period_start: string;
  period_end: string;
  base_salary: string;
  total_allowances: string;
  total_overtime: string;
  total_deductions: string;
  net_salary: string;
  status: PayslipStatus;
  payment_date: string;
}

interface WorkLog {
  id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_duration: number;
  schedule_type_name: string;
  schedule_type_multiplier: number;
  status: string;
}

const STATUS_TRANSITIONS: Record<PayslipStatus, PayslipStatus[]> = {
  draft: ['approved'],
  approved: ['paid'],
  paid: [],
};

const PAYSLIP_STATUSES: { value: PayslipStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
];

export default function AddPayslipForm({ 
  payslipId, 
  periodMonth, 
  contractId 
}: { 
  payslipId: string | null;
  periodMonth: string;
  contractId: string;
}) {
  const [formData, setFormData] = useState<FormData>({
    contract_id: contractId,
    period_start: '',
    period_end: '',
    base_salary: '',
    total_allowances: '0',
    total_overtime: '0',
    total_deductions: '0',
    net_salary: '0',
    status: 'draft',
    payment_date: '',
  });
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { currentTenant } = useTenant();

  useEffect(() => {
    if (currentTenant) {
      loadData();
    }
  }, [currentTenant, contractId, periodMonth]);

  const loadData = async () => {
    try {
      const supabase = createClient();

      // If editing, get existing payslip first
      if (payslipId) {
        const { data: payslip, error: payslipError } = await supabase
          .from('Payslips')
          .select(`
            *,
            contract:EmployeeContracts(
              *,
              employee:Employees(given_name, surname),
              position:Positions(title),
              contract_type:ContractTypes(name)
            )
          `)
          .eq('id', payslipId)
          .single();

        if (payslipError) throw payslipError;

        if (payslip) {
          setFormData({
            contract_id: payslip.contract_id,
            period_start: payslip.period_start,
            period_end: payslip.period_end,
            base_salary: payslip.base_salary.toString(),
            total_allowances: payslip.total_allowances.toString(),
            total_overtime: payslip.total_overtime.toString(),
            total_deductions: payslip.total_deductions.toString(),
            net_salary: payslip.net_salary.toString(),
            status: payslip.status as PayslipStatus,
            payment_date: payslip.payment_date || '',
          });

          // Get work logs for the period
          const { data: logs } = await supabase
            .from('WorkLogs')
            .select('*, schedule_type:WorkScheduleTypes(name, multiplier)')
            .eq('employee_id', payslip.contract.employee.id)
            .gte('date', payslip.period_start)
            .lte('date', payslip.period_end)
            .order('date', { ascending: true });

          if (logs) {
            setWorkLogs(logs.map(log => ({
              ...log,
              schedule_type_name: log.schedule_type.name,
              schedule_type_multiplier: log.schedule_type.multiplier,
            })));
          }
          
          return; // Exit early as we already have all the data
        }
      }

      // If not editing or payslip not found, get contract details for new payslip
      const { data: contract } = await supabase
        .from('EmployeeContracts')
        .select('*, position:Positions(title), contract_type:ContractTypes(name), employee:Employees(id)')
        .eq('id', contractId)
        .single();

      if (contract) {
        const monthStart = startOfMonth(parse(periodMonth, 'yyyyMM', new Date()));
        const monthEnd = endOfMonth(monthStart);
        const nextMonth = addMonths(monthStart, 1);

        setFormData(prev => ({
          ...prev,
          period_start: format(monthStart, 'yyyy-MM-dd'),
          period_end: format(monthEnd, 'yyyy-MM-dd'),
          base_salary: contract.base_salary.toString(),
          payment_date: format(nextMonth, 'yyyy-MM-dd'),
        }));

        // Get work logs for the period
        const { data: logs } = await supabase
          .from('WorkLogs')
          .select('*, schedule_type:WorkScheduleTypes(name, multiplier)')
          .eq('employee_id', contract.employee.id)
          .gte('date', format(monthStart, 'yyyy-MM-dd'))
          .lte('date', format(monthEnd, 'yyyy-MM-dd'))
          .order('date', { ascending: true });

        if (logs) {
          setWorkLogs(logs.map(log => ({
            ...log,
            schedule_type_name: log.schedule_type.name,
            schedule_type_multiplier: log.schedule_type.multiplier,
          })));
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateNetSalary = () => {
    const base = parseFloat(formData.base_salary) || 0;
    const allowances = parseFloat(formData.total_allowances) || 0;
    const overtime = parseFloat(formData.total_overtime) || 0;
    const deductions = parseFloat(formData.total_deductions) || 0;
    return base + allowances + overtime - deductions;
  };

  const calculateOvertimeFromWorkLogs = () => {
    let totalOvertime = 0;
    workLogs.forEach(log => {
      if (log.status === 'approved') {
        const startTime = new Date(`2000-01-01T${log.start_time}`);
        const endTime = new Date(`2000-01-01T${log.end_time}`);
        const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // in minutes
        const workingDuration = duration - log.break_duration;
        const standardWorkingMinutes = 8 * 60; // 8 hours in minutes

        if (workingDuration > standardWorkingMinutes) {
          const overtimeMinutes = workingDuration - standardWorkingMinutes;
          const overtimeHours = overtimeMinutes / 60;
          const hourlyRate = parseFloat(formData.base_salary) / (22 * 8); // assuming 22 working days
          const overtimeRate = log.schedule_type_multiplier;
          totalOvertime += overtimeHours * hourlyRate * overtimeRate;
        }
      }
    });
    return totalOvertime;
  };

  useEffect(() => {
    if (workLogs.length > 0) {
      const overtime = calculateOvertimeFromWorkLogs();
      setFormData(prev => ({
        ...prev,
        total_overtime: overtime.toFixed(2),
        net_salary: (calculateNetSalary() + overtime).toFixed(2)
      }));
    }
  }, [workLogs]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (['base_salary', 'total_allowances', 'total_overtime', 'total_deductions'].includes(name)) {
        updated.net_salary = calculateNetSalary().toString();
      }
      return updated;
    });
  };

  const canTransitionTo = (newStatus: PayslipStatus) => {
    const allowedTransitions = STATUS_TRANSITIONS[formData.status] || [];
    return formData.status === newStatus || allowedTransitions.includes(newStatus);
  };

  const handleStatusChange = (newStatus: PayslipStatus) => {
    if (!canTransitionTo(newStatus)) {
      toast({
        title: "Invalid Status Change",
        description: `Cannot change status from ${formData.status} to ${newStatus}`,
        variant: "destructive",
      });
      return;
    }
    setFormData(prev => ({ ...prev, status: newStatus }));
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
      const payslipData = {
        ...formData,
        tenant_id: currentTenant.id,
        net_salary: calculateNetSalary(),
      };

      if (payslipId) {
        await supabase
          .from('Payslips')
          .update(payslipData)
          .eq('id', payslipId);
      } else {
        await supabase
          .from('Payslips')
          .insert([payslipData]);
      }

      toast({
        title: "Success",
        description: `Payslip ${payslipId ? 'updated' : 'created'} successfully.`,
      });
      router.push('/payslips');
    } catch (error) {
      console.error('Error saving payslip:', error);
      setError('Failed to save payslip');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            {payslipId ? 'Edit Payslip' : 'New Payslip'}
            <span className="ml-2 text-sm font-normal">
              ({PAYSLIP_STATUSES.find(s => s.value === formData.status)?.label})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="period_start">Period Start</Label>
                <Input
                  id="period_start"
                  name="period_start"
                  type="date"
                  value={formData.period_start}
                  onChange={handleInputChange}
                  required
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="period_end">Period End</Label>
                <Input
                  id="period_end"
                  name="period_end"
                  type="date"
                  value={formData.period_end}
                  onChange={handleInputChange}
                  required
                  readOnly
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="base_salary">Base Salary</Label>
                <Input
                  id="base_salary"
                  name="base_salary"
                  type="number"
                  step="0.01"
                  value={formData.base_salary}
                  onChange={handleInputChange}
                  required
                  readOnly
                />
              </div>
              <div>
                <Label htmlFor="payment_date">Payment Date</Label>
                <Input
                  id="payment_date"
                  name="payment_date"
                  type="date"
                  value={formData.payment_date}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="total_allowances">Total Allowances</Label>
                <Input
                  id="total_allowances"
                  name="total_allowances"
                  type="number"
                  step="0.01"
                  value={formData.total_allowances}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="total_overtime">Total Overtime</Label>
                <Input
                  id="total_overtime"
                  name="total_overtime"
                  type="number"
                  step="0.01"
                  value={formData.total_overtime}
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <Label htmlFor="total_deductions">Total Deductions</Label>
                <Input
                  id="total_deductions"
                  name="total_deductions"
                  type="number"
                  step="0.01"
                  value={formData.total_deductions}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="net_salary">Net Salary</Label>
              <Input
                id="net_salary"
                name="net_salary"
                type="number"
                step="0.01"
                value={formData.net_salary}
                readOnly
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={handleStatusChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {PAYSLIP_STATUSES.map(status => (
                      <SelectItem 
                        key={status.value} 
                        value={status.value}
                        disabled={!canTransitionTo(status.value)}
                      >
                        {status.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && <div className="text-red-500 bg-red-100 p-2 rounded">{error}</div>}

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/payslips')}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={formData.status === 'paid'}
              >
                Save
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Work Logs Section */}
      <Card>
        <CardHeader>
          <CardTitle>Work Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="text-left bg-muted">
                <th className="p-2">Date</th>
                <th className="p-2">Schedule Type</th>
                <th className="p-2">Time</th>
                <th className="p-2">Break</th>
                <th className="p-2">Status</th>
                <th className="p-2">Overtime</th>
              </tr>
            </thead>
            <tbody>
              {workLogs.map(log => {
                const startTime = new Date(`2000-01-01T${log.start_time}`);
                const endTime = new Date(`2000-01-01T${log.end_time}`);
                const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                const workingDuration = duration - log.break_duration;
                const overtimeMinutes = Math.max(0, workingDuration - (8 * 60));
                const overtimeHours = overtimeMinutes / 60;

                return (
                  <tr key={log.id} className="border-b">
                    <td className="p-2">{format(new Date(log.date), 'dd/MM/yyyy')}</td>
                    <td className="p-2">{log.schedule_type_name} ({log.schedule_type_multiplier}x)</td>
                    <td className="p-2">{log.start_time} - {log.end_time}</td>
                    <td className="p-2">{log.break_duration} min</td>
                    <td className="p-2">{log.status}</td>
                    <td className="p-2">
                      {overtimeHours > 0 ? `${overtimeHours.toFixed(1)} hrs` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
} 