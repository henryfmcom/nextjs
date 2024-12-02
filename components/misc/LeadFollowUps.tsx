'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/utils/supabase/client';
import { getLeadFollowUps, LeadFollowUp, completeFollowUp } from '@/utils/supabase/queries';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { AddFollowUpForm } from './AddFollowUpForm';
import { toast } from '@/components/ui/use-toast';

interface LeadFollowUpsProps {
  leadId: string;
}

export function LeadFollowUps({ leadId }: LeadFollowUpsProps) {
  const [followUps, setFollowUps] = useState<LeadFollowUp[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFollowUps = async () => {
    try {
      const supabase = createClient();
      const data = await getLeadFollowUps(supabase, leadId);
      setFollowUps(data);
    } catch (error) {
      console.error('Error loading follow-ups:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFollowUps();
  }, [leadId]);

  const getPriorityBadge = (priority: string) => {
    const variants = {
      high: 'destructive',
      medium: 'default',
      low: 'secondary'
    } as const;
    
    return <Badge variant={variants[priority as keyof typeof variants]}>{priority}</Badge>;
  };

  const handleComplete = async (followUpId: string) => {
    try {
      const supabase = createClient();
      await completeFollowUp(supabase, followUpId);
      
      toast({
        title: "Success",
        description: "Follow-up marked as completed",
      });
      
      loadFollowUps(); // Reload the list
    } catch (error) {
      console.error('Error completing follow-up:', error);
      toast({
        title: "Error",
        description: "Failed to complete follow-up",
        variant: "destructive",
      });
    }
  };

  if (loading) return <div>Loading follow-ups...</div>;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Follow-ups</CardTitle>
        <AddFollowUpForm leadId={leadId} onSuccess={loadFollowUps} />
      </CardHeader>
      <CardContent>
        {followUps.length === 0 ? (
          <p>No follow-ups scheduled.</p>
        ) : (
          <ul className="space-y-4">
            {followUps.map((followUp) => (
              <li key={followUp.id} className="flex items-start space-x-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-semibold">{followUp.description}</h4>
                    {getPriorityBadge(followUp.priority)}
                  </div>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      {new Date(followUp.due_date).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1" />
                      {new Date(followUp.due_date).toLocaleTimeString()}
                    </div>
                    {followUp.status === 'overdue' && (
                      <div className="flex items-center text-destructive">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        Overdue
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleComplete(followUp.id)}
                  disabled={followUp.status === 'completed'}
                >
                  {followUp.status === 'completed' ? 'Completed' : 'Mark Complete'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
} 