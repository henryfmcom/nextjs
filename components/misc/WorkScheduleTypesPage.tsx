'use client'

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { getWorkScheduleTypes } from '@/utils/supabase/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_ITEMS_PER_PAGE } from '@/utils/constants';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';

interface WorkScheduleType {
  id: string;
  name: string;
  multiplier: number;
}

interface WorkScheduleTypesPageProps {
  user: User;
}

export default function WorkScheduleTypesPage({ user }: WorkScheduleTypesPageProps) {
  const [scheduleTypes, setScheduleTypes] = useState<WorkScheduleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const router = useRouter();
  const { currentTenant } = useTenant();

  useEffect(() => {
    if (currentTenant) {
      loadScheduleTypes();
    }
  }, [currentPage, itemsPerPage, currentTenant]);

  async function loadScheduleTypes() {
    try {
      setLoading(true);
      const supabase = createClient();
      const { scheduleTypes: data, count } = await getWorkScheduleTypes(
        supabase,
        currentTenant!.id,
        currentPage,
        itemsPerPage
      );
      if (data) {
        setScheduleTypes(data);
        setTotalItems(count || 0);
      }
    } catch (error) {
      console.error('Error loading schedule types:', error);
      toast({
        title: "Error",
        description: "Failed to load schedule types. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const getMultiplierBadge = (multiplier: number) => {
    if (multiplier === 1) return <Badge variant="outline">{multiplier}x</Badge>;
    if (multiplier <= 1.5) return <Badge variant="secondary">{multiplier}x</Badge>;
    return <Badge>{multiplier}x</Badge>;
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

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Work Schedule Types</CardTitle>
          <Link href="/master/schedules/add">
            <Button variant="default">+ Add New</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="text-left bg-muted">
                <th className="p-2">Name</th>
                <th className="p-2">Multiplier</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {scheduleTypes?.map((scheduleType) => (
                <tr 
                  key={scheduleType.id} 
                  className="border-b hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/master/schedules/edit/${scheduleType.id}`)}
                >
                  <td className="p-2">{scheduleType.name}</td>
                  <td className="p-2">{getMultiplierBadge(scheduleType.multiplier)}</td>
                  <td className="p-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/master/schedules/edit/${scheduleType.id}`);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            itemsPerPage={itemsPerPage}
            totalItems={totalItems}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={setItemsPerPage}
          />
        </CardContent>
      </Card>
    </div>
  );
} 