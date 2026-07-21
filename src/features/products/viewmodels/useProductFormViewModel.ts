import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { productService, type Product } from '../models/productService';
import { createProductSchema, type CreateProductValues } from '../models/productSchemas';
import { humanizeError } from '@/shared/lib/errors';

interface UseProductFormProps {
  mode: 'create' | 'edit';
  product?: Product;
  onSuccess: () => void;
}

export function useProductFormViewModel({ mode, product, onSuccess }: UseProductFormProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { control, handleSubmit, formState: { errors }, reset } = useForm<CreateProductValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      description: null,
      sale_price: 0,
      cost_price: 0,
    },
  });

  useEffect(() => {
    if (mode === 'edit' && product) {
      reset({
        name: product.name,
        description: product.description,
        sale_price: product.sale_price,
        cost_price: product.cost_price,
      });
    }
  }, [mode, product, reset]);

  const mutation = useMutation({
    mutationFn: (values: CreateProductValues) => {
      if (mode === 'edit' && product) {
        return productService.update(product.id, values);
      }
      return productService.create(profile!.company_id, values);
    },
    onSuccess: () => {
      // 'products-active' é a query própria do PDV (NewSaleScreen) — sem essa
      // invalidação, um produto recém-criado não aparece na busca da venda.
      queryClient.invalidateQueries({ queryKey: ['products-active', profile?.company_id] });
      onSuccess();
    },
  });

  return {
    control,
    errors,
    isSubmitting: mutation.isPending,
    submitError: mutation.error ? humanizeError(mutation.error) : null,
    submit: handleSubmit((values) => mutation.mutate(values)),
    clearError: () => mutation.reset(),
  };
}
