import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { variantService, type ActiveVariant } from '@/features/products/models/variantService';
import { customerService, type Customer } from '@/features/customers/models/customerService';
import { salesService, type SaleChannel, type PaymentMethod } from '../models/salesService';
import { humanizeError } from '@/shared/lib/errors';
import type { CartItem } from '../models/salesSchemas';

function parseBRDateTime(dateStr: string, timeStr: string): Date | null {
  const parts = dateStr.split('/').map(Number);
  const timeParts = (timeStr || '00:00').split(':').map(Number);
  const [d, m, y] = parts;
  const [h, min] = timeParts;
  if (!d || !m || !y || isNaN(h) || isNaN(min)) return null;
  const date = new Date(y, m - 1, d, h, min, 0, 0);
  return isNaN(date.getTime()) ? null : date;
}

export function useNewSaleViewModel() {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? '';
  const userId = profile?.id ?? '';
  const queryClient = useQueryClient();

  // ─── Carrinho ──────────────────────────────────────────────────────────────
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // ─── Seleções ──────────────────────────────────────────────────────────────
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [channel, setChannel] = useState<SaleChannel>('store');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discount, setDiscount] = useState(0);

  // ─── Agendamento ───────────────────────────────────────────────────────────
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDateText, setScheduledDateText] = useState('');
  const [scheduledTimeText, setScheduledTimeText] = useState('');
  const [schedulingError, setSchedulingError] = useState<string | null>(null);

  // ─── Busca de variantes ────────────────────────────────────────────────────
  const [variantQuery, setVariantQuery] = useState('');

  const variantsQuery = useQuery({
    queryKey: ['variants-active', companyId],
    queryFn: () => variantService.listActive(companyId),
    enabled: !!companyId,
    staleTime: 60_000,
  });

  const filteredVariants = useMemo<ActiveVariant[]>(() => {
    if (!variantQuery.trim()) return variantsQuery.data ?? [];
    const q = variantQuery.toLowerCase();
    return (variantsQuery.data ?? []).filter(
      (v) =>
        v.product_name.toLowerCase().includes(q) ||
        v.sku.toLowerCase().includes(q) ||
        (v.packaging ?? '').toLowerCase().includes(q) ||
        (v.honey_type ?? '').toLowerCase().includes(q)
    );
  }, [variantsQuery.data, variantQuery]);

  // ─── Clientes ──────────────────────────────────────────────────────────────
  const customersQuery = useQuery({
    queryKey: ['customers', companyId],
    queryFn: () => customerService.list(companyId),
    enabled: !!companyId,
    staleTime: 60_000,
  });

  // ─── Calcular preço unitário ────────────────────────────────────────────────
  const resolvePrice = useCallback(
    async (variant: ActiveVariant, customer: Customer | null): Promise<number> => {
      if (!customer) return variant.sale_price;
      try {
        return await customerService.priceForCustomer(variant.id, customer.id);
      } catch {
        return variant.sale_price;
      }
    },
    []
  );

  // ─── Ações do carrinho ─────────────────────────────────────────────────────
  const addToCart = useCallback(
    async (variant: ActiveVariant) => {
      const unitPrice = await resolvePrice(variant, selectedCustomer);
      const priceIsAdjusted =
        selectedCustomer?.type === 'reseller' && unitPrice !== variant.sale_price;

      setCartItems((prev) => {
        const existing = prev.find((i) => i.variantId === variant.id);
        if (existing) {
          return prev.map((i) =>
            i.variantId === variant.id
              ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice }
              : i
          );
        }
        return [
          ...prev,
          {
            variantId: variant.id,
            productName: variant.product_name,
            sku: variant.sku,
            packaging: variant.packaging,
            unit: variant.unit,
            quantity: 1,
            unitPrice,
            subtotal: unitPrice,
            priceIsAdjusted,
          },
        ];
      });
    },
    [selectedCustomer, resolvePrice]
  );

  const updateQty = useCallback((variantId: string, qty: number) => {
    if (qty <= 0) {
      setCartItems((prev) => prev.filter((i) => i.variantId !== variantId));
    } else {
      setCartItems((prev) =>
        prev.map((i) =>
          i.variantId === variantId
            ? { ...i, quantity: qty, subtotal: qty * i.unitPrice }
            : i
        )
      );
    }
  }, []);

  const selectCustomer = useCallback(
    async (customer: Customer | null) => {
      setSelectedCustomer(customer);
      if (cartItems.length === 0) return;

      // Recalcula preços de todos os itens do carrinho
      const variantsData = variantsQuery.data ?? [];
      const updated = await Promise.all(
        cartItems.map(async (item) => {
          const variant = variantsData.find((v) => v.id === item.variantId);
          if (!variant) return item;
          const unitPrice = await resolvePrice(variant, customer);
          const priceIsAdjusted =
            customer?.type === 'reseller' && unitPrice !== variant.sale_price;
          return {
            ...item,
            unitPrice,
            subtotal: item.quantity * unitPrice,
            priceIsAdjusted,
          };
        })
      );
      setCartItems(updated);
    },
    [cartItems, variantsQuery.data, resolvePrice]
  );

  // ─── Totais ────────────────────────────────────────────────────────────────
  const subtotal = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.subtotal, 0),
    [cartItems]
  );
  const total = useMemo(() => Math.max(0, subtotal - discount), [subtotal, discount]);

  // ─── Submit ────────────────────────────────────────────────────────────────
  const saleInput = useMemo(
    () => ({
      items: cartItems,
      customerId: selectedCustomer?.id ?? null,
      channel,
      paymentMethod,
      discount,
    }),
    [cartItems, selectedCustomer, channel, paymentMethod, discount]
  );

  const mutation = useMutation({
    mutationFn: () => {
      if (isScheduled) {
        const scheduledFor = parseBRDateTime(scheduledDateText, scheduledTimeText);
        return salesService.createScheduledSale(companyId, userId, saleInput, scheduledFor!);
      }
      return salesService.create(companyId, userId, saleInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['variants-active', companyId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', companyId] });
      // Reset
      setCartItems([]);
      setSelectedCustomer(null);
      setChannel('store');
      setPaymentMethod('cash');
      setDiscount(0);
      setIsScheduled(false);
      setScheduledDateText('');
      setScheduledTimeText('');
      setSchedulingError(null);
    },
  });

  const submitSale = useCallback(() => {
    setSchedulingError(null);
    if (isScheduled) {
      const scheduledFor = parseBRDateTime(scheduledDateText, scheduledTimeText);
      if (!scheduledFor || scheduledFor <= new Date()) {
        setSchedulingError('A data/hora deve ser no futuro.');
        return;
      }
    }
    mutation.mutate();
  }, [isScheduled, scheduledDateText, scheduledTimeText, mutation]);

  return {
    // Carrinho
    cartItems,
    addToCart,
    updateQty,
    subtotal,
    total,

    // Cliente
    selectedCustomer,
    selectCustomer,
    customers: customersQuery.data ?? [],
    isLoadingCustomers: customersQuery.isLoading,

    // Variantes
    variantQuery,
    setVariantQuery,
    filteredVariants,
    isLoadingVariants: variantsQuery.isLoading,

    // Form
    channel,
    setChannel,
    paymentMethod,
    setPaymentMethod,
    discount,
    setDiscount,

    // Agendamento
    isScheduled,
    setIsScheduled,
    scheduledDateText,
    setScheduledDateText,
    scheduledTimeText,
    setScheduledTimeText,
    schedulingError,

    // Submit
    submitSale,
    isSubmitting: mutation.isPending,
    submitError: mutation.error ? humanizeError(mutation.error) : null,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}
