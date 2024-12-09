'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { createClient } from '@/utils/supabase/client';
import { inviteEmployee, createEmployeeAccount } from '@/utils/supabase/queries';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useTenant } from '@/utils/tenant-context';

interface InviteEmployeeDialogProps {
  employee: {
    id: string;
    given_name: string;
    surname: string;
    company_email: string;
    is_invited?: boolean;
  };
  onSuccess: () => void;
}

export function InviteEmployeeDialog({ employee, onSuccess }: InviteEmployeeDialogProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [password, setPassword] = useState('');
  const { currentTenant } = useTenant();

  const resetAndClose = () => {
    setDialogOpen(false);
    // Reset other states after dialog animation completes
    setTimeout(() => {
      setLoading(false);
      setSendEmail(true);
      setPassword('');
    }, 300); // Match dialog close animation duration
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent any bubbling
    if (!currentTenant) return;
    
    setLoading(true);

    try {
      const supabase = createClient();

      if (sendEmail) {
        await inviteEmployee(supabase, employee.id, currentTenant.id);
      } else {
        await createEmployeeAccount(
          supabase,
          employee.id,
          currentTenant.id,
          employee.company_email,
          password,
          {
            given_name: employee.given_name,
            surname: employee.surname,
          }
        );
      }

      toast({
        title: "Success",
        description: sendEmail ? "Invitation sent successfully" : "User account created successfully",
      });

      // First close the dialog
      resetAndClose();
      
      // Then update the parent after dialog is fully closed
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to invite employee",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  return (
    <>
      <DropdownMenuItem 
        onSelect={(e) => {
          e.preventDefault();
          setDialogOpen(true);
        }}
      >
        {employee.is_invited ? 'Resend Invitation' : 'Invite'}
      </DropdownMenuItem>

      <Dialog 
        open={dialogOpen} 
        onOpenChange={(open) => {
          if (!loading && !open) {
            resetAndClose();
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Invite {employee.given_name}</DialogTitle>
            <DialogDescription>
              Choose how to invite this employee
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
            <div className="py-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendEmail"
                  checked={sendEmail}
                  onCheckedChange={(checked) => setSendEmail(checked as boolean)}
                  disabled={loading}
                />
                <Label htmlFor="sendEmail">Send invitation email</Label>
              </div>

              {!sendEmail && (
                <div className="mt-4">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    placeholder="Enter password"
                    className="mt-1"
                  />
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={resetAndClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                onClick={handleSubmit}
                disabled={loading || (!sendEmail && !password)}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Confirm'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
} 