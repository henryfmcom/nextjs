'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from '@/components/ui/dialog';
import { createClient } from '@/utils/supabase/client';
import { convertLeadToClient } from '@/utils/supabase/queries';
import { toast } from '@/components/ui/use-toast';
import { ArrowRight } from 'lucide-react';
import { useTenant } from '@/utils/tenant-context';
import { useRouter } from 'next/navigation';

interface LeadConversionDialogProps {
  leadId: string;
  companyName: string;
}

interface FormData {
  deal_value?: number;
  conversion_notes?: string;
}

export function LeadConversionDialog({ leadId, companyName }: LeadConversionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { currentTenant } = useTenant();
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    deal_value: undefined,
    conversion_notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentTenant) return;

    setLoading(true);
    try {
      const supabase = createClient();
      const user = await supabase.auth.getUser();
      
      if (!user.data.user) throw new Error('Not authenticated');

      const client = await convertLeadToClient(supabase, leadId, {
        converted_by: user.data.user.id,
        deal_value: formData.deal_value,
        conversion_notes: formData.conversion_notes,
        tenant_id: currentTenant.id
      });

      toast({
        title: 'Success',
        description: 'Lead converted to client successfully',
      });
      
      setOpen(false);
      router.push(`/clients/edit/${client.id}`);
    } catch (error) {
      console.error('Error converting lead:', error);
      toast({
        title: 'Error',
        description: 'Failed to convert lead',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ArrowRight className="h-4 w-4 mr-2" />
          Convert to Client
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Convert Lead to Client</DialogTitle>
          <DialogDescription>
            Convert {companyName} from a lead to a client. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="deal_value">Deal Value</Label>
            <Input
              id="deal_value"
              type="number"
              step="0.01"
              value={formData.deal_value || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                deal_value: e.target.value ? parseFloat(e.target.value) : undefined 
              }))}
            />
          </div>

          <div>
            <Label htmlFor="conversion_notes">Notes</Label>
            <Textarea
              id="conversion_notes"
              value={formData.conversion_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, conversion_notes: e.target.value }))}
              placeholder="Add any relevant notes about the conversion..."
            />
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
              {loading ? 'Converting...' : 'Convert to Client'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 