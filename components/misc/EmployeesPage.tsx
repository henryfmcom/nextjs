'use client'

import { useEffect, useState, useCallback, useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { getEmployees, inviteEmployee, getDepartmentsForDropdown } from '@/utils/supabase/queries';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import {  MoreVertical } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Pagination } from '@/components/ui/pagination';
import { DEFAULT_ITEMS_PER_PAGE } from '@/utils/constants';
import { useTenant } from '@/utils/tenant-context';
import { toast } from '@/components/ui/use-toast';
import { TableWrapper } from '@/components/ui/table-wrapper';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteEmployeeDialog } from './InviteEmployeeDialog';
import { Label } from '@radix-ui/react-label';
import { MultiSelect } from '@/components/ui/multi-select';
import { Input } from '@/components/ui/input';
import useDebounce from '@/utils/debounce';

interface EmployeesPageProps {
  user: User;
}

interface Department {
  id: string;
  name: string;
}

interface EmployeeDepartment {
  department: Department;
}

interface Employee {
  id: string;
  given_name: string;
  surname: string;
  company_email: string;
  is_active: boolean;
  is_invited: boolean;
  departments: EmployeeDepartment[];
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
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedInviteStatus, setSelectedInviteStatus] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [departments, setDepartments] = useState<Array<{ 
    id: string; 
    name: string;
  }>>([]);

  const statusOptions = useMemo(() => [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ], []);

  const inviteStatusOptions = useMemo(() => [
    { value: 'invited', label: 'Invited' },
    { value: 'not_invited', label: 'Not Invited' }
  ], []);

  const handleInviteSuccess = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (currentTenant) {
      loadEmployees();
    }
  }, [
    currentPage, 
    itemsPerPage, 
    currentTenant, 
    refreshKey, 
    selectedDepartments,
    selectedStatuses,
    selectedInviteStatus,
    debouncedSearchTerm
  ]);

  useEffect(() => {
    async function loadDepartments() {
      if (!currentTenant) return;
      try {
        const supabase = createClient();
        const deps = await getDepartmentsForDropdown(supabase, currentTenant.id);
        
        // Sort departments by their display names
        const sortedDeps = deps.sort((a, b) => a.name.localeCompare(b.name));
        setDepartments(sortedDeps || []);
      } catch (error) {
        console.error('Error loading departments:', error);
        toast({
          title: "Error",
          description: "Failed to load departments",
          variant: "destructive",
        });
      }
    }

    loadDepartments();
  }, [currentTenant]);

  async function loadEmployees() {
    try {
      setLoading(true);
      const supabase = createClient();
      const { employees, count } = await getEmployees(
        supabase, 
        currentTenant!.id, 
        currentPage, 
        itemsPerPage,
        {
          departments: selectedDepartments,
          statuses: selectedStatuses as ('active' | 'inactive')[],
          invitedStatus: selectedInviteStatus as ('invited' | 'not_invited')[],
          searchTerm: debouncedSearchTerm
        }
      );
      if (employees) {
        setEmployees(employees as unknown as Employee[]);
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

  const handleInvite = async (employeeId: string) => {
    try {
      setLoading(true);
      const supabase = createClient();
      await inviteEmployee(supabase, employeeId, currentTenant!.id);
      
      toast({
        title: "Success",
        description: "Invitation sent successfully",
      });
      
      loadEmployees(); // Reload to update invited status
    } catch (error) {
      console.error('Error inviting employee:', error);
      toast({
        title: "Error",
        description: "Failed to send invitation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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

  function isValidDepartment(ed: EmployeeDepartment): boolean {
    return ed && ed.department && typeof ed.department.name === 'string';
  }

  return (
    <div className="w-full">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Employee List</CardTitle>
          <Link href="/employees/add">
            <Button variant="default">+ Add New</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <div className="mb-4 grid gap-4 grid-cols-1 md:grid-cols-2">
            <div className="order-1">
              <div className="flex gap-4">
                <MultiSelect
                  label="Department"
                  options={departments.map(d => ({ 
                    value: d.id, 
                    label: d.name  // This will now include the parent department name
                  })) ?? []}
                  selected={selectedDepartments}
                  onChange={setSelectedDepartments}
                />

                <MultiSelect
                  label="Status"
                  options={statusOptions}
                  selected={selectedStatuses}
                  onChange={setSelectedStatuses}
                />

                <MultiSelect
                  label="Invite Status"
                  options={inviteStatusOptions}
                  selected={selectedInviteStatus}
                  onChange={setSelectedInviteStatus}
                />
              </div>
            </div>

            <div className="order-2">
              <Label htmlFor="search">Search</Label>
              <Input
                id="search"
                placeholder="Search employee name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          <TableWrapper>
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
                  // className="border-b hover:bg-muted/50 cursor-pointer"
                  // onClick={() => router.push(`/employees/edit/${employee.id}`)}
                >
                  <td className="p-2">{employee.given_name}</td>
                  <td className="p-2">{employee.surname}</td>
                  <td className="p-2">{employee.company_email}</td>
                  <td className="p-2">{getActivePosition(employee.contracts)}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      {employee.departments
                        ?.filter(isValidDepartment)
                        .map((ed) => (
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
                    {employee.is_invited && (
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                        Invited
                      </span>
                    )}
                  </td>
                  <td className="p-2">
                    <DropdownMenu 
                      open={openDropdownId === employee.id}
                      onOpenChange={(open) => {
                        setOpenDropdownId(open ? employee.id : null);
                      }}
                    >
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            router.push(`/employees/edit/${employee.id}`);
                            setOpenDropdownId(null);
                          }}
                        >
                          Edit
                        </DropdownMenuItem>
                        <InviteEmployeeDialog 
                          employee={employee}
                          onSuccess={handleInviteSuccess}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </TableWrapper>

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