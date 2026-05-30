import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { customerService, type Customer, type CustomerType } from '../models/customerService';
import { supplierService, type Supplier } from '@/features/suppliers/models/supplierService';
import { humanizeError } from '@/shared/lib/errors';
import type { CustomerValues } from '../models/customerSchemas';
import type { SupplierValues } from '@/features/suppliers/models/supplierSchemas';

export type ContactsTab = 'final' | 'reseller' | 'suppliers';

export function useContactsViewModel() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? '';
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<ContactsTab>('final');
  const [search, setSearch] = useState('');
  const [showCustomerSheet, setShowCustomerSheet] = useState(false);
  const [showSupplierSheet, setShowSupplierSheet] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const customersQuery = useQuery({
    queryKey: ['customers', companyId],
    queryFn: () => customerService.list(companyId),
    enabled: !!companyId,
    staleTime: 60_000,
  });

  const suppliersQuery = useQuery({
    queryKey: ['suppliers', companyId],
    queryFn: () => supplierService.list(companyId),
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
        (c.business_name ?? '').toLowerCase().includes(q)
    );
  }, [customersQuery.data, activeTab, search]);

  const filteredSuppliers = useMemo(() => {
    if (!search.trim()) return suppliersQuery.data ?? [];
    const q = search.toLowerCase();
    return (suppliersQuery.data ?? []).filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone ?? '').toLowerCase().includes(q)
    );
  }, [suppliersQuery.data, search]);

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

  const supplierMutation = useMutation({
    mutationFn: (values: SupplierValues) => {
      if (editingSupplier) return supplierService.update(editingSupplier.id, values);
      return supplierService.create(companyId, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', companyId] });
      setShowSupplierSheet(false);
      setEditingSupplier(null);
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
    suppliers: filteredSuppliers,
    isLoadingCustomers: customersQuery.isLoading,
    isLoadingSuppliers: suppliersQuery.isLoading,
    isRefetching: customersQuery.isRefetching || suppliersQuery.isRefetching,
    refresh: () => {
      customersQuery.refetch();
      suppliersQuery.refetch();
    },

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

    showSupplierSheet,
    editingSupplier,
    openCreateSupplier: () => {
      setEditingSupplier(null);
      setShowSupplierSheet(true);
    },
    openEditSupplier: (supplier: Supplier) => {
      setEditingSupplier(supplier);
      setShowSupplierSheet(true);
    },
    closeSupplierSheet: () => {
      setShowSupplierSheet(false);
      setEditingSupplier(null);
      supplierMutation.reset();
    },
    saveSupplier: supplierMutation.mutate,
    isSavingSupplier: supplierMutation.isPending,
    supplierError: supplierMutation.error ? humanizeError(supplierMutation.error) : null,
  };
}
