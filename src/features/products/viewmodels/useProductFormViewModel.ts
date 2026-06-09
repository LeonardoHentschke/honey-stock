import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
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

  const { control, handleSubmit, formState: { errors }, reset } = useForm<CreateProductValues>({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      name: '',
      description: null,
      sale_price: 0,
      cost_price: 0,
      stock_quantity: 0,
      min_stock: 0,
    },
  });

  useEffect(() => {
    if (mode === 'edit' && product) {
      reset({
        name: product.name,
        description: product.description,
        sale_price: product.sale_price,
        cost_price: product.cost_price,
        stock_quantity: product.stock_quantity,
        min_stock: product.min_stock,
      });
    }
  }, [mode, product, reset]);

  const mutation = useMutation({
    mutationFn: (values: CreateProductValues) => {
      if (mode === 'edit' && product) {
        // estoque não é editado pelo form (usa movimentações); só os demais campos.
        const { stock_quantity: _stock, ...rest } = values;
        return productService.update(product.id, rest);
      }
      return productService.create(profile!.company_id, values);
    },
    onSuccess,
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
