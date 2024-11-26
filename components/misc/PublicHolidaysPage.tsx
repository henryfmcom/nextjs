'use client'

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { getPublicHolidays } from '@/utils/supabase/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { format, startOfYear, endOfYear, eachMonthOfInterval, eachDayOfInterval, startOfMonth, endOfMonth, isSameMonth, isWeekend, isSameDay } from 'date-fns';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";
import BulkImportHolidays from './BulkImportHolidays';

interface Holiday {
  id: string;
  date: string;
  name: string;
}

interface PublicHolidaysPageProps {
  user: User;
}

export default function PublicHolidaysPage({ user }: PublicHolidaysPageProps) {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const router = useRouter();
  const { currentTenant } = useTenant();

  useEffect(() => {
    if (currentTenant) {
      loadHolidays();
    }
  }, [selectedYear, currentTenant]);

  async function loadHolidays() {
    try {
      setLoading(true);
      const supabase = createClient();
      const { holidays: data } = await getPublicHolidays(
        supabase,
        currentTenant!.id,
        selectedYear
      );
      if (data) {
        setHolidays(data);
      }
    } catch (error) {
      console.error('Error loading holidays:', error);
      toast({
        title: "Error",
        description: "Failed to load holidays. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const months = eachMonthOfInterval({
    start: startOfYear(new Date(selectedYear, 0, 1)),
    end: endOfYear(new Date(selectedYear, 0, 1))
  });

  const getDayClass = (date: Date) => {
    const isHoliday = holidays.some(holiday => isSameDay(new Date(holiday.date), date));
    const classes = [
      "h-8 w-8 p-0 font-normal aria-selected:opacity-100",
      isWeekend(date) ? "text-red-500" : "",
      isHoliday ? "bg-blue-100 dark:bg-blue-900/50 rounded-full" : "",
    ];
    return classes.filter(Boolean).join(" ");
  };

  const getHolidayName = (date: Date) => {
    const holiday = holidays.find(h => isSameDay(new Date(h.date), date));
    return holiday?.name;
  };

  const getMonthStartDays = (date: Date) => {
    const start = startOfMonth(date);
    const day = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const emptyDays = Array(day).fill(null);
    return emptyDays;
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
    <div className="container mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center space-x-4">
            <CardTitle>Public Holidays {selectedYear}</CardTitle>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedYear(prev => prev - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSelectedYear(prev => prev + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">Bulk Import</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogTitle>Import Public Holidays</DialogTitle>
                <BulkImportHolidays onComplete={() => {
                  loadHolidays();
                }} />
              </DialogContent>
            </Dialog>
            <Link href="/master/holidays/add">
              <Button variant="default">+ Add New</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {months.map(month => (
              <Card key={month.toString()}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {format(month, 'MMMM')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-1 text-center text-sm">
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                      <div key={day} className="text-muted-foreground">
                        {day}
                      </div>
                    ))}
                    {getMonthStartDays(month).map((_, index) => (
                      <div key={`empty-${index}`} className="h-8" />
                    ))}
                    {eachDayOfInterval({
                      start: startOfMonth(month),
                      end: endOfMonth(month)
                    }).map(date => (
                      <div
                        key={date.toString()}
                        className={`relative ${getDayClass(date)}`}
                        title={getHolidayName(date)}
                      >
                        {format(date, 'd')}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 