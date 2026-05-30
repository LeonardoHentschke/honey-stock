import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { batchService, type Batch, type BatchInput } from '../models/batchService';
import { humanizeError } from '@/shared/lib/errors';

export function useBatchListViewModel() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [showFormSheet, setShowFormSheet] = useState(false);
  const [editingBatch, setEditingBatch] = useState<Batch | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const query = useQuery<Batch[], Error>({
    queryKey: ['batches', profile?.company_id],
    queryFn: () => batchService.list(profile!.company_id),
    enabled: !!profile,
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return query.data ?? [];
    const lower = search.toLowerCase();
    return (query.data ?? []).filter((b) => b.code.toLowerCase().includes(lower));
  }, [query.data, search]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['batches', profile?.company_id] });

  const createMutation = useMutation({
    mutationFn: (input: BatchInput) => batchService.create(profile!.company_id, input),
    onSuccess: () => { invalidate(); setShowFormSheet(false); },
    onError: (err) => setMutationError(humanizeError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<BatchInput> }) =>
      batchService.update(id, input),
    onSuccess: () => { invalidate(); setShowFormSheet(false); setEditingBatch(null); },
    onError: (err) => setMutationError(humanizeError(err)),
  });

  return {
    batches: filtered,
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    search,
    setSearch,
    showFormSheet,
    editingBatch,
    isSaving: createMutation.isPending || updateMutation.isPending,
    mutationError,
    refresh: query.refetch,
    openCreate: () => { setEditingBatch(null); setShowFormSheet(true); },
    openEdit: (batch: Batch) => { setEditingBatch(batch); setShowFormSheet(true); },
    closeSheet: () => { setShowFormSheet(false); setEditingBatch(null); },
    saveBatch: (input: BatchInput) => {
      if (editingBatch) {
        updateMutation.mutate({ id: editingBatch.id, input });
      } else {
        createMutation.mutate(input);
      }
    },
    clearError: () => setMutationError(null),
  };
}
