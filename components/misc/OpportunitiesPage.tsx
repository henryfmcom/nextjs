'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/utils/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'
import { useTenant } from '@/utils/tenant-context'
import { toast } from '@/components/ui/use-toast'
import { TableWrapper } from '@/components/ui/table-wrapper'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { MoreVertical, Plus } from 'lucide-react'
import { format } from 'date-fns'
import { getOpportunities } from '@/utils/supabase/queries'
import { Pagination } from '@/components/ui/pagination'
import { DEFAULT_ITEMS_PER_PAGE } from '@/utils/constants'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import useDebounce from '@/utils/debounce'
import { MultiSelect } from '@/components/ui/multi-select'
import { useTranslations } from '@/utils/i18n/TranslationsContext'
import Link from 'next/link'

interface Opportunity {
  id: string
  title: string
  description: string
  expected_revenue: number
  probability: number
  expected_close_date: string
  created_at: string
  projects: Array<{
    project: {
      id: string
      name: string
    }
  }>
}

interface OpportunitiesPageProps {
  user: any
}

export function OpportunitiesPage({ user }: OpportunitiesPageProps) {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE)
  const [totalItems, setTotalItems] = useState(0)
  const router = useRouter()
  const { currentTenant } = useTenant()
  const [searchTerm, setSearchTerm] = useState('')
  const debouncedSearchTerm = useDebounce(searchTerm, 500)
  const [minRevenue, setMinRevenue] = useState<number>()
  const [maxRevenue, setMaxRevenue] = useState<number>()
  const [minProbability, setMinProbability] = useState<number>()
  const [maxProbability, setMaxProbability] = useState<number>()
  const [startDate, setStartDate] = useState<string>('')
  const [endDate, setEndDate] = useState<string>('')
  const { t } = useTranslations()

  useEffect(() => {
    if (currentTenant) {
      fetchOpportunities()
    }
  }, [
    currentPage,
    itemsPerPage,
    currentTenant,
    debouncedSearchTerm,
    minRevenue,
    maxRevenue,
    minProbability,
    maxProbability,
    startDate,
    endDate,
  ])

  const fetchOpportunities = async () => {
    if (!currentTenant) return

    try {
      setLoading(true)
      const supabase: SupabaseClient = createClient()
      const { data, count } = await getOpportunities(
        supabase,
        currentTenant.id,
        currentPage,
        itemsPerPage,
        {
          searchTerm: debouncedSearchTerm,
          minRevenue,
          maxRevenue,
          minProbability,
          maxProbability,
          startDate,
          endDate,
        }
      )

      setOpportunities(data || [])
      setTotalItems(count || 0)
    } catch (error) {
      console.error('Error fetching opportunities:', error)
      toast({
        title: 'Error',
        description: 'Failed to load opportunities',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!currentTenant) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('Opportunities')
        .delete()
        .eq('id', id)
        .eq('tenant_id', currentTenant.id)

      if (error) throw error

      toast({
        title: 'Success',
        description: 'Opportunity deleted successfully',
      })
      fetchOpportunities()
    } catch (error) {
      console.error('Error deleting opportunity:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete opportunity',
        variant: 'destructive',
      })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

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
    )
  }

  if (loading) {
    return <div>Loading...</div>
  }

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{t('opportunities.title')}</h1>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t('opportunities.list')}</CardTitle>
          <Button onClick={() => router.push('/opportunities/add')}>
            <Plus className="mr-2 h-4 w-4" />
            {t('opportunities.add')}
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label>{t('opportunities.filters.search')}</Label>
                <Input
                  placeholder={t('opportunities.filters.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div>
                <Label>{t('opportunities.filters.revenue')}</Label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder={t('opportunities.filters.min')}
                    value={minRevenue || ''}
                    onChange={(e) => setMinRevenue(e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <Input
                    type="number"
                    placeholder={t('opportunities.filters.max')}
                    value={maxRevenue || ''}
                    onChange={(e) => setMaxRevenue(e.target.value ? Number(e.target.value) : undefined)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Probability Range (%)</Label>
                <div className="flex space-x-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    min={0}
                    max={100}
                    value={minProbability || ''}
                    onChange={(e) =>
                      setMinProbability(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    min={0}
                    max={100}
                    value={maxProbability || ''}
                    onChange={(e) =>
                      setMaxProbability(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Expected Close Date Range</Label>
                <div className="flex space-x-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <TableWrapper>
              <table className="w-full">
                <thead>
                  <tr className="text-left bg-muted">
                    <th className="p-2">{t('opportunities.table.title')}</th>
                    <th className="p-2">{t('opportunities.table.revenue')}</th>
                    <th className="p-2">{t('opportunities.table.probability')}</th>
                    <th className="p-2">{t('opportunities.table.close_date')}</th>
                    <th className="p-2">{t('opportunities.table.projects')}</th>
                    <th className="p-2">{t('opportunities.table.created')}</th>
                    <th className="p-2">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {opportunities.map((opportunity) => (
                    <tr key={opportunity.id}>
                      <td className="p-2">{opportunity.title}</td>
                      <td className="p-2">{formatCurrency(opportunity.expected_revenue)}</td>
                      <td className="p-2">{opportunity.probability}%</td>
                      <td className="p-2">
                        {format(new Date(opportunity.expected_close_date), 'PP')}
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {opportunity.projects?.map((p) => (
                            <span
                              key={p.project.id}
                              className="inline-flex px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800"
                            >
                              {p.project.name}
                            </span>
                          )) || 'None'}
                        </div>
                      </td>
                      <td className="p-2">
                        {format(new Date(opportunity.created_at), 'PP')}
                      </td>
                      <td className="p-2">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() =>
                                router.push(`/opportunities/${opportunity.id}/edit`)
                              }
                            >
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDelete(opportunity.id)}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                  {opportunities.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center p-4">
                        No opportunities found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </TableWrapper>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
