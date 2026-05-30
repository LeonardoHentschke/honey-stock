import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { categoryService, type Category } from '../models/categoryService';
import { humanizeError } from '@/shared/lib/errors';

export function useCategoryListViewModel() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [showFormSheet, setShowFormSheet] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [mutationError, setMutationError] = useState<string | null>(null);

  const query = useQuery<Category[], Error>({
    queryKey: ['categories', profile?.company_id],
    queryFn: () => categoryService.list(profile!.company_id),
    enabled: !!profile,
    staleTime: 60_000,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['categories', profile?.company_id] });
    queryClient.invalidateQueries({ queryKey: ['products', profile?.company_id] });
  };

  const createMutation = useMutation({
    mutationFn: (name: string) => categoryService.create(profile!.company_id, name),
    onSuccess: () => { invalidate(); setShowFormSheet(false); },
    onError: (err) => setMutationError(humanizeError(err)),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      categoryService.update(id, name),
    onSuccess: () => { invalidate(); setShowFormSheet(false); setEditingCategory(null); },
    onError: (err) => setMutationError(humanizeError(err)),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => categoryService.remove(id),
    onSuccess: invalidate,
    onError: (err) => setMutationError(humanizeError(err)),
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    isRefetching: query.isRefetching,
    error: query.error,
    mutationError,
    showFormSheet,
    editingCategory,
    isSaving: createMutation.isPending || updateMutation.isPending,
    isRemoving: removeMutation.isPending,
    refresh: query.refetch,
    openCreate: () => { setEditingCategory(null); setShowFormSheet(true); },
    openEdit: (cat: Category) => { setEditingCategory(cat); setShowFormSheet(true); },
    closeSheet: () => { setShowFormSheet(false); setEditingCategory(null); },
    saveCategory: (name: string) => {
      if (editingCategory) {
        updateMutation.mutate({ id: editingCategory.id, name });
      } else {
        createMutation.mutate(name);
      }
    },
    removeCategory: (id: string) => removeMutation.mutate(id),
    clearError: () => setMutationError(null),
  };
}
