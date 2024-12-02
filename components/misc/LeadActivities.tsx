'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getLeadActivities, LeadActivity } from '@/utils/supabase/queries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Phone, Calendar, FileText, CheckSquare } from 'lucide-react';
import { AddActivityForm } from './AddActivityForm';
import { DataFilter } from '@/components/ui/data-filter';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LeadActivitiesProps {
  leadId: string;
}

type SortOption = 'date-desc' | 'date-asc' | 'type';

type ActivityType = LeadActivity['type'];

const ACTIVITY_TYPE_OPTIONS: Array<{ value: ActivityType; label: string }> = [
  { value: 'email', label: 'Email' },
  { value: 'call', label: 'Call' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'note', label: 'Note' },
  { value: 'task', label: 'Task' },
];

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc', label: 'Oldest First' },
  { value: 'type', label: 'By Type' },
];

export function LeadActivities({ leadId }: LeadActivitiesProps) {
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState<LeadActivity['type'][]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');

  const loadActivities = async () => {
    setLoading(true);
    try {
      const supabase = createClient();
      const data = await getLeadActivities(supabase, leadId);
      setActivities(data);
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [leadId]);

  const getActivityIcon = (type: LeadActivity['type']) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'call': return <Phone className="h-4 w-4" />;
      case 'meeting': return <Calendar className="h-4 w-4" />;
      case 'note': return <FileText className="h-4 w-4" />;
      case 'task': return <CheckSquare className="h-4 w-4" />;
    }
  };

  const filteredAndSortedActivities = activities
    .filter(activity => 
      selectedTypes.length === 0 || selectedTypes.includes(activity.type)
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime();
        case 'date-asc':
          return new Date(a.activity_date).getTime() - new Date(b.activity_date).getTime();
        case 'type':
          return a.type.localeCompare(b.type);
        default:
          return 0;
      }
    });

  if (loading) return <div>Loading activities...</div>;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Activities</CardTitle>
        <AddActivityForm leadId={leadId} onSuccess={loadActivities} />
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <DataFilter
            options={ACTIVITY_TYPE_OPTIONS}
            selected={selectedTypes}
            onChange={setSelectedTypes}
            label="Filter by Type"
          />
          <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredAndSortedActivities.length === 0 ? (
          <p>No activities found.</p>
        ) : (
          <ul className="space-y-4">
            {filteredAndSortedActivities.map((activity) => (
              <li key={activity.id} className="flex items-start space-x-4">
                <div className="bg-muted p-2 rounded-full">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{activity.subject}</h4>
                  <p className="text-sm text-muted-foreground">{activity.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <Badge variant="outline">{activity.type}</Badge>
                    {activity.duration_minutes && (
                      <Badge variant="secondary">
                        {activity.duration_minutes} mins
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(activity.activity_date).toLocaleString()}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
} 