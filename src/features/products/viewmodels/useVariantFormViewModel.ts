import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { variantService, type CreateVariantInput } from '../models/variantService';
import type { ProductVariant } from '../models/productService';
import { createVariantSchema, type CreateVariantValues } from '../models/productSchemas';
import { humanizeError } from '@/shared/lib/errors';

interface UseVariantFormProps {
  productId: string;
  productName: string;
  mode: 'create' | 'edit';
  variant?: ProductVariant;
  onSuccess: () => void;
}

function suggestSku(productName: string, packaging: string): string {
  const clean = (s: string) =>
    s
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  return `${clean(productName)}-${clean(packaging)}`;
}

export function useVariantFormViewModel({
  productId,
  productName,
  mode,
  variant,
  onSuccess,
}: UseVariantFormProps) {
  const { profile } = useAuth();

  const { control, handleSubmit, formState: { errors }, reset, watch, setValue } =
    useForm<CreateVariantValues>({
      resolver: zodResolver(createVariantSchema),
      defaultValues: {
        sku: '',
        packaging: '',
        unit: 'un',
        weight_grams: null,
        cost_price: 0,
        sale_price: 0,
        reseller_price: null,
        min_stock: 0,
      },
    });

  useEffect(() => {
    if (mode === 'edit' && variant) {
      reset({
        sku: variant.sku,
        packaging: variant.packaging ?? '',
        unit: variant.unit as 'un' | 'kg',
        weight_grams: variant.weight_grams,
        cost_price: variant.cost_price,
        sale_price: variant.sale_price,
        reseller_price: variant.reseller_price,
        min_stock: variant.min_stock,
      });
    }
  }, [mode, variant, reset]);

  // Auto-suggest SKU when packaging changes (create mode only)
  const packagingValue = watch('packaging');
  useEffect(() => {
    if (mode === 'create' && packagingValue) {
      setValue('sku', suggestSku(productName, packagingValue), { shouldValidate: false });
    }
  }, [packagingValue, mode, productName, setValue]);

  const mutation = useMutation({
    mutationFn: (values: CreateVariantValues) => {
      const input: CreateVariantInput = {
        sku: values.sku,
        packaging: values.packaging,
        unit: values.unit,
        weight_grams: values.weight_grams ?? null,
        cost_price: values.cost_price,
        sale_price: values.sale_price,
        reseller_price: values.reseller_price ?? null,
        min_stock: values.min_stock,
      };

      if (mode === 'edit' && variant) {
        return variantService.update(variant.id, input);
      }
      return variantService.create(profile!.company_id, productId, input);
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
