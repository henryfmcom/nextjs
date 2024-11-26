'use client'

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { getEmployees } from '@/utils/supabase/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Settings } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_ITEMS_PER_PAGE } from '@/utils/constants';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
interface EmployeesPageProps {
  user: User;
}

interface Employee {
  id: string;
  given_name: string;
  surname: string;
  company_email: string;
  is_active: boolean;
  departments: Array<{
    department: {
      id: string;
      name: string;
    }
  }>;
  contracts: Array<{
    id: string;
    start_date: string;
    end_date: string | null;
    position: {
      title: string;
    }
  }>;
}

export default function EmployeesPage({ user }: EmployeesPageProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const router = useRouter();
  const { currentTenant } = useTenant();
  
  useEffect(() => {
    if (currentTenant) {
      loadEmployees();
    }
  }, [currentPage, itemsPerPage, currentTenant]);

  async function loadEmployees() {
    try {
      setLoading(true);
      const supabase = createClient();
      const { employees, count } = await getEmployees(supabase, currentTenant!.id, currentPage, itemsPerPage);
      if (employees) {
        setEmployees(employees);
        setTotalItems(count || 0);
      }
    } catch (error) {
      console.error('Error loading employees:', error);
      toast({
        title: "Error",
        description: "Failed to load employees. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const getActivePosition = (contracts: Employee['contracts']) => {
    if (!contracts?.length) return '-';

    // Sort contracts by start date (newest first)
    const sortedContracts = [...contracts].sort((a, b) => 
      new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );

    // Find the active contract
    const now = new Date();
    const activeContract = sortedContracts.find(contract => {
      const startDate = new Date(contract.start_date);
      const endDate = contract.end_date ? new Date(contract.end_date) : null;
      return startDate <= now && (!endDate || endDate >= now);
    });

    return activeContract?.position.title || '-';
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (items: number) => {
    setItemsPerPage(items);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="container mx-auto">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Employee List</CardTitle>
          <Link href="/employees/add">
            <Button variant="default">+ Add New</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="text-left bg-muted">
                <th className="p-2">Given Name</th>
                <th className="p-2">Surname</th>
                <th className="p-2">Email</th>
                <th className="p-2">Position</th>
                <th className="p-2">Departments</th>
                <th className="p-2">Status</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees?.map((employee) => (
                <tr 
                  key={employee.id} 
                  className="border-b hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/employees/edit/${employee.id}`)}
                >
                  <td className="p-2">{employee.given_name}</td>
                  <td className="p-2">{employee.surname}</td>
                  <td className="p-2">{employee.company_email}</td>
                  <td className="p-2">{getActivePosition(employee.contracts)}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {employee.departments?.map((ed) => (
                        <span 
                          key={ed.department.id}
                          className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800"
                        >
                          {ed.department.name}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="p-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                      employee.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {employee.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/employees/edit/${employee.id}`);
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
            onPageChange={handlePageChange}
            onItemsPerPageChange={handleItemsPerPageChange}
          />
        </CardContent>
      </Card>
    </div>
  );
}