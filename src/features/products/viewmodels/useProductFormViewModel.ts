import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { productService, type Product } from '../models/productService';
import { categoryService, type Category } from '../models/categoryService';
import { createProductSchema, type CreateProductValues } from '../models/productSchemas';
import { humanizeError } from '@/shared/lib/errors';

interface UseProductFormProps {
  mode: 'create' | 'edit';
  product?: Product;
  onSuccess: () => void;
}

export function useProductFormViewModel({ mode, product, onSuccess }: UseProductFormProps) {
  const { profile } = useAuth();

  const { control, handleSubmit, formState: { errors }, reset } = useForm<CreateProductValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      honey_type: null,
      category_id: null,
      description: null,
    },
  });

  useEffect(() => {
    if (mode === 'edit' && product) {
      reset({
        name: product.name,
        honey_type: product.honey_type,
        category_id: product.category_id,
        description: product.description,
      });
    }
  }, [mode, product, reset]);

  const categoriesQuery = useQuery<Category[], Error>({
    queryKey: ['categories', profile?.company_id],
    queryFn: () => categoryService.list(profile!.company_id),
    enabled: !!profile,
    staleTime: 60_000,
  });

  const mutation = useMutation({
    mutationFn: (values: CreateProductValues) => {
      if (mode === 'edit' && product) {
        return productService.update(product.id, values);
      }
      return productService.create(profile!.company_id, values);
    },
    onSuccess,
  });

  return {
    control,
    errors,
    categories: categoriesQuery.data ?? [],
    isSubmitting: mutation.isPending,
    submitError: mutation.error ? humanizeError(mutation.error) : null,
    submit: handleSubmit((values) => mutation.mutate(values)),
    clearError: () => mutation.reset(),
  };
}
