'use client'

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/utils/supabase/client';
import { getContractTypes } from '@/utils/supabase/queries';
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

interface ContractType {
  id: string;
  name: string;
  description: string;
  payment_type: string;
}

interface ContractTypesPageProps {
  user: User;
}

export default function ContractTypesPage({ user }: ContractTypesPageProps) {
  const [contractTypes, setContractTypes] = useState<ContractType[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE);
  const [totalItems, setTotalItems] = useState(0);
  const router = useRouter();
  const { currentTenant } = useTenant();

  useEffect(() => {
    if (currentTenant) {
      loadContractTypes();
    }
  }, [currentPage, itemsPerPage, currentTenant]);

  async function loadContractTypes() {
    try {
      setLoading(true);
      const supabase = createClient();
      const { contractTypes: data, count } = await getContractTypes(
        supabase,
        currentTenant!.id,
        currentPage,
        itemsPerPage
      );
      if (data) {
        setContractTypes(data);
        setTotalItems(count || 0);
      }
    } catch (error) {
      console.error('Error loading contract types:', error);
      toast({
        title: "Error",
        description: "Failed to load contract types. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const getPaymentTypeBadge = (type: string) => {
    const variants: Record<string, any> = {
      monthly: { variant: "default", label: "Monthly" },
      hourly: { variant: "secondary", label: "Hourly" },
      one_time: { variant: "outline", label: "One Time" },
    };
    const { variant, label } = variants[type] || { variant: "default", label: type };
    return <Badge variant={variant}>{label}</Badge>;
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
          <CardTitle>Contract Types</CardTitle>
          <Link href="/master/contract-types/add">
            <Button variant="default">+ Add New</Button>
          </Link>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="text-left bg-muted">
                <th className="p-2">Name</th>
                <th className="p-2">Description</th>
                <th className="p-2">Payment Type</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {contractTypes?.map((contractType) => (
                <tr 
                  key={contractType.id} 
                  className="border-b hover:bg-muted/50 cursor-pointer"
                  onClick={() => router.push(`/master/contract-types/edit/${contractType.id}`)}
                >
                  <td className="p-2">{contractType.name}</td>
                  <td className="p-2">{contractType.description}</td>
                  <td className="p-2">{getPaymentTypeBadge(contractType.payment_type)}</td>
                  <td className="p-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/master/contract-types/edit/${contractType.id}`);
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