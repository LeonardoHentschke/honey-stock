import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { productService, type Product } from '@/features/products/models/productService';
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

  // ─── Busca de produtos ─────────────────────────────────────────────────────
  const [productQuery, setProductQuery] = useState('');

  const productsQuery = useQuery({
    queryKey: ['products-active', companyId],
    queryFn: () => productService.listActive(companyId),
    enabled: !!companyId,
    staleTime: 60_000,
  });

  const filteredProducts = useMemo<Product[]>(() => {
    if (!productQuery.trim()) return productsQuery.data ?? [];
    const q = productQuery.toLowerCase();
    return (productsQuery.data ?? []).filter((p) =>
      p.name.toLowerCase().includes(q)
    );
  }, [productsQuery.data, productQuery]);

  // ─── Clientes ──────────────────────────────────────────────────────────────
  const customersQuery = useQuery({
    queryKey: ['customers', companyId],
    queryFn: () => customerService.list(companyId),
    enabled: !!companyId,
    staleTime: 60_000,
  });

  // ─── Calcular preço unitário ────────────────────────────────────────────────
  const resolvePrice = useCallback(
    async (product: Product, customer: Customer | null): Promise<number> => {
      if (!customer) return product.sale_price;
      try {
        return await customerService.priceForCustomer(product.id, customer.id);
      } catch {
        return product.sale_price;
      }
    },
    []
  );

  // ─── Ações do carrinho ─────────────────────────────────────────────────────
  const addToCart = useCallback(
    async (product: Product) => {
      const unitPrice = await resolvePrice(product, selectedCustomer);
      const priceIsAdjusted =
        selectedCustomer?.type === 'reseller' && unitPrice !== product.sale_price;

      setCartItems((prev) => {
        const existing = prev.find((i) => i.productId === product.id);
        if (existing) {
          return prev.map((i) =>
            i.productId === product.id
              ? { ...i, quantity: i.quantity + 1, subtotal: (i.quantity + 1) * i.unitPrice }
              : i
          );
        }
        return [
          ...prev,
          {
            productId: product.id,
            productName: product.name,
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

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setCartItems((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setCartItems((prev) =>
        prev.map((i) =>
          i.productId === productId
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
      const productsData = productsQuery.data ?? [];
      const updated = await Promise.all(
        cartItems.map(async (item) => {
          const product = productsData.find((p) => p.id === item.productId);
          if (!product) return item;
          const unitPrice = await resolvePrice(product, customer);
          const priceIsAdjusted =
            customer?.type === 'reseller' && unitPrice !== product.sale_price;
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
    [cartItems, productsQuery.data, resolvePrice]
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
      queryClient.invalidateQueries({ queryKey: ['products-active', companyId] });
      queryClient.invalidateQueries({ queryKey: ['products', companyId] });
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

    // Produtos
    productQuery,
    setProductQuery,
    filteredProducts,
    isLoadingProducts: productsQuery.isLoading,

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
