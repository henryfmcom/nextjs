'use client'

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { getEmployeeContracts } from '@/utils/supabase/queries';
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
import { format } from 'date-fns';

interface EmployeeContract {
  id: string;
  employee_name: string;
  position_title: string;
  contract_type_name: string;
  start_date: string;
  end_date: string | null;
  base_salary: number;
  currency: string;
}

interface EmployeeContractsPageProps {
  user: User;
}

export default function EmployeeContractsPage({ user }: EmployeeContractsPageProps) {
  const [contracts, setContracts] = useState<EmployeeContract[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const router = useRouter();
  const { currentTenant } = useTenant();

  useEffect(() => {
    if (currentTenant) {
      loadContracts();
    }
  }, [currentPage, itemsPerPage, currentTenant]);

  async function loadContracts() {
    try {
      setLoading(true);
      const supabase = createClient();
      const { contracts: data, count } = await getEmployeeContracts(
        supabase,
        currentTenant!.id,
        currentPage,
        itemsPerPage
      );
      if (data) {
        setContracts(data);
        setTotalItems(count || 0);
      }
    } catch (error) {
      console.error('Error loading contracts:', error);
      toast({
        title: "Error",
        description: "Failed to load contracts. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const getContractStatus = (startDate: string, endDate: string | null) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (now < start) {
      return <Badge variant="secondary">Pending</Badge>;
    }
    if (end && now > end) {
      return <Badge variant="outline">Expired</Badge>;
    }
    return <Badge variant="default">Active</Badge>;
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
          <CardTitle>Employee Contracts</CardTitle>
          <Link href="/contracts/add">
            <Button variant="default">+ Add New</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="text-left bg-muted">
                <th className="p-2">Employee</th>
                <th className="p-2">Position</th>
                <th className="p-2">Contract Type</th>
                <th className="p-2">Start Date</th>
                <th className="p-2">End Date</th>
                <th className="p-2">Status</th>
                <th className="p-2">Salary</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contracts?.map((contract) => (
                <tr 
                  key={contract.id} 
                  className="border-b hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/contracts/edit/${contract.id}`)}
                >
                  <td className="p-2">{contract.employee_name}</td>
                  <td className="p-2">{contract.position_title}</td>
                  <td className="p-2">{contract.contract_type_name}</td>
                  <td className="p-2">{format(new Date(contract.start_date), 'dd/MM/yyyy')}</td>
                  <td className="p-2">{contract.end_date ? format(new Date(contract.end_date), 'dd/MM/yyyy') : '-'}</td>
                  <td className="p-2">{getContractStatus(contract.start_date, contract.end_date)}</td>
                  <td className="p-2">{contract.base_salary} {contract.currency}</td>
                  <td className="p-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/contracts/edit/${contract.id}`);
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