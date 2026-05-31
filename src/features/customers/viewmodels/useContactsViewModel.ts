import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { customerService, type Customer, type CustomerType } from '../models/customerService';
import { humanizeError } from '@/shared/lib/errors';
import type { CustomerValues } from '../models/customerSchemas';

export type ContactsTab = 'final' | 'reseller';

export function useContactsViewModel() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? '';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ContactsTab>('final');
  const [search, setSearch] = useState('');
  const [showCustomerSheet, setShowCustomerSheet] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const customersQuery = useQuery({
    queryKey: ['customers', companyId],
    queryFn: () => customerService.list(companyId),
    enabled: !!companyId,
    staleTime: 60_000,
  });

  const filteredCustomers = useMemo(() => {
    const type: CustomerType = activeTab === 'final' ? 'final' : 'reseller';
    const all = (customersQuery.data ?? []).filter((c) => c.type === type);
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q) ||
        (c.business_name ?? '').toLowerCase().includes(q),
    );
  }, [customersQuery.data, activeTab, search]);

  const customerMutation = useMutation({
    mutationFn: (values: CustomerValues) => {
      if (editingCustomer) return customerService.update(editingCustomer.id, values);
      return customerService.create(companyId, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', companyId] });
      setShowCustomerSheet(false);
      setEditingCustomer(null);
    },
  });

  return {
    activeTab,
    setActiveTab: (tab: ContactsTab) => {
      setActiveTab(tab);
      setSearch('');
    },
    search,
    setSearch,

    customers: filteredCustomers,
    isLoadingCustomers: customersQuery.isLoading,
    isRefetching: customersQuery.isRefetching,
    refresh: customersQuery.refetch,

    showCustomerSheet,
    editingCustomer,
    openCreateCustomer: () => {
      setEditingCustomer(null);
      setShowCustomerSheet(true);
    },
    openEditCustomer: (customer: Customer) => {
      setEditingCustomer(customer);
      setShowCustomerSheet(true);
    },
    closeCustomerSheet: () => {
      setShowCustomerSheet(false);
      setEditingCustomer(null);
      customerMutation.reset();
    },
    saveCustomer: customerMutation.mutate,
    isSavingCustomer: customerMutation.isPending,
    customerError: customerMutation.error ? humanizeError(customerMutation.error) : null,
  };
}
