'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { createClient } from '@/utils/supabase/client';
import { addLeadDocument, getActiveEmployees } from '@/utils/supabase/queries';
import { toast } from '@/components/ui/use-toast';
import { Plus, Upload } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useTenant } from '@/utils/tenant-context';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface AddDocumentFormProps {
  leadId: string;
  onSuccess: () => void;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
];

interface UploadProgressEvent {
  loaded: number;
  total: number;
}

interface Employee {
  id: string;
  given_name: string;
  surname: string;
}

export function AddDocumentForm({ leadId, onSuccess }: AddDocumentFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast({
        title: "Error",
        description: "File size must be less than 5MB",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(selectedFile.type)) {
      toast({
        title: "Error",
        description: "Invalid file type. Please upload PDF, Word, or image files.",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !currentTenant || !selectedEmployee) {
      toast({
        title: "Error",
        description: "Please select a file and assignee",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const supabase = createClient();
      
      await addLeadDocument(
        supabase, 
        file, 
        {
          lead_id: leadId,
          uploaded_by: selectedEmployee,
          tenant_id: currentTenant.id
        },
        (progress) => setUploadProgress(progress)
      );

      toast({
        title: 'Success',
        description: 'Document uploaded successfully',
      });
      
      setOpen(false);
      onSuccess();
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Document
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Document</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">File</Label>
            <div className="flex items-center gap-2">
              <Input
                id="file"
                type="file"
                onChange={handleFileChange}
                disabled={loading}
                accept={ALLOWED_FILE_TYPES.join(',')}
              />
              {file && (
                <Button 
                  type="button" 
                  variant="ghost"
                  size="sm"
                  onClick={() => setFile(null)}
                >
                  Clear
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Max size: 5MB. Allowed types: PDF, Word, JPEG, PNG
            </p>
          </div>

          <div>
            <Label htmlFor="uploaded_by">Assigned To</Label>
            <Select
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
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

          {uploadProgress > 0 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-sm text-muted-foreground text-center">
                Uploading: {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !file}>
              {loading ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 