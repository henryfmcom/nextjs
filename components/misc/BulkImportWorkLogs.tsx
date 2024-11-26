'use client'

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from '@/utils/supabase/client';
import { useTenant } from '@/utils/tenant-context';
import { toast } from "@/components/ui/use-toast";
import { bulkAddWorkLogs, getEmployees, getWorkScheduleTypes } from '@/utils/supabase/queries';
import { parse } from 'papaparse';

interface WorkLog {
  employee_id: string;
  schedule_type_id: string;
  date: string;
  start_time: string;
  end_time: string;
  break_duration: number;
  description?: string;
  tenant_id: string;
}

export default function BulkImportWorkLogs({ onComplete }: { onComplete: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { currentTenant } = useTenant();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv') {
        setError('Please upload a CSV file');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const validateTime = (timeStr: string): boolean => {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(timeStr);
  };

  const validateDate = (dateStr: string): boolean => {
    const date = new Date(dateStr);
    return date instanceof Date && !isNaN(date.getTime());
  };

  const handleUpload = async () => {
    if (!file || !currentTenant) return;

    setLoading(true);
    setError(null);

    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csvData = event.target?.result as string;
          const supabase = createClient();

          // First, get all employees to map emails to IDs
          const { employees } = await getEmployees(supabase, currentTenant.id);
          const emailToId = new Map(
            employees?.map(emp => [emp.company_email.toLowerCase(), emp.id]) || []
          );

          // Get all schedule types to map names to IDs
          const { scheduleTypes } = await getWorkScheduleTypes(supabase, currentTenant.id);
          const nameToId = new Map(
            scheduleTypes?.map(type => [type.name.toLowerCase(), type.id]) || []
          );

          parse(csvData, {
            header: true,
            complete: async (results) => {
              const workLogs: WorkLog[] = [];
              const errors: string[] = [];

              results.data.forEach((row: any, index: number) => {
                if (!row.company_email || !row.schedule_type || !row.date || 
                    !row.start_time || !row.end_time) {
                  errors.push(`Row ${index + 1}: Missing required fields`);
                  return;
                }

                const employeeId = emailToId.get(row.company_email.toLowerCase());
                if (!employeeId) {
                  errors.push(`Row ${index + 1}: Employee with email ${row.company_email} not found`);
                  return;
                }

                const scheduleTypeId = nameToId.get(row.schedule_type.toLowerCase());
                if (!scheduleTypeId) {
                  errors.push(`Row ${index + 1}: Schedule type ${row.schedule_type} not found`);
                  return;
                }

                if (!validateDate(row.date)) {
                  errors.push(`Row ${index + 1}: Invalid date format. Use YYYY-MM-DD`);
                  return;
                }

                if (!validateTime(row.start_time) || !validateTime(row.end_time)) {
                  errors.push(`Row ${index + 1}: Invalid time format. Use HH:MM`);
                  return;
                }

                workLogs.push({
                  employee_id: employeeId,
                  schedule_type_id: scheduleTypeId,
                  date: row.date,
                  start_time: row.start_time,
                  end_time: row.end_time,
                  break_duration: parseInt(row.break_duration) || 0,
                  description: row.description,
                  tenant_id: currentTenant.id
                });
              });

              if (errors.length > 0) {
                setError(`Validation errors:\n${errors.join('\n')}`);
                return;
              }

              await bulkAddWorkLogs(supabase, workLogs);

              toast({
                title: "Success",
                description: `${workLogs.length} work logs imported successfully.`,
              });

              onComplete();
            },
            error: (error: Error) => {
              setError(`Failed to parse CSV: ${error.message}`);
            }
          });
        } catch (error) {
          setError('Failed to process file');
          console.error('Error processing file:', error);
        }
      };

      reader.readAsText(file);
    } catch (error) {
      setError('Failed to upload file');
      console.error('Error uploading file:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    const template = 'company_email,schedule_type,date,start_time,end_time,break_duration,description\n' +
                    'employee@company.com,Regular,2024-01-01,09:00,17:00,60,Daily work';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'work_logs_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Import Work Logs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Upload CSV File</Label>
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="mt-1"
            />
            <p className="text-sm text-muted-foreground mt-1">
              CSV should contain columns: company_email, schedule_type, date (YYYY-MM-DD), 
              start_time (HH:MM), end_time (HH:MM), break_duration (minutes), description
            </p>
          </div>

          <div className="flex space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadTemplate}
            >
              Download Template
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || loading}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>

          {error && (
            <div className="text-red-500 bg-red-100 p-2 rounded whitespace-pre-line">
              {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 