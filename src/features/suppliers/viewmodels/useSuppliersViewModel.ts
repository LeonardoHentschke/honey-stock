import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { supplierService, type Supplier } from '../models/supplierService';
import { humanizeError } from '@/shared/lib/errors';
import type { SupplierValues } from '../models/supplierSchemas';

export function useSuppliersViewModel() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? '';
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [showSheet, setShowSheet] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  const query = useQuery({
    queryKey: ['suppliers', companyId],
    queryFn: () => supplierService.list(companyId),
    enabled: !!companyId,
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return query.data ?? [];
    const q = search.toLowerCase();
    return (query.data ?? []).filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        (s.phone ?? '').toLowerCase().includes(q),
    );
  }, [query.data, search]);

  const mutation = useMutation({
    mutationFn: (values: SupplierValues) => {
      if (editingSupplier) return supplierService.update(editingSupplier.id, values);
      return supplierService.create(companyId, values);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', companyId] });
      setShowSheet(false);
      setEditingSupplier(null);
    },
  });

  return {
    suppliers: filtered,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    refresh: query.refetch,

    search,
    setSearch,

    showSheet,
    editingSupplier,
    openCreate: () => {
      setEditingSupplier(null);
      setShowSheet(true);
    },
    openEdit: (supplier: Supplier) => {
      setEditingSupplier(supplier);
      setShowSheet(true);
    },
    closeSheet: () => {
      setShowSheet(false);
      setEditingSupplier(null);
      mutation.reset();
    },
    save: mutation.mutate,
    isSaving: mutation.isPending,
    error: mutation.error ? humanizeError(mutation.error) : null,
  };
}
