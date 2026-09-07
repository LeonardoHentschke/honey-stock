import { useState, useMemo, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { productService, type Product } from '@/features/products/models/productService';
import { customerService, type Customer } from '@/features/customers/models/customerService';
import { salesService, type PaymentMethod } from '../models/salesService';
import { remindersService } from '@/features/reminders/models/remindersService';
import { humanizeError } from '@/shared/lib/errors';
import { currencyToNumber } from '@/shared/lib/mask';
import { formatCurrency } from '@/shared/lib/format';
import type { CartItem } from '../models/salesSchemas';

/** full = pago integralmente · partial = pago em parte · later = a prazo (0) */
export type PaymentMode = 'full' | 'partial' | 'later';

interface UseNewSaleViewModelOptions {
  /** Chamado após a venda ser criada com sucesso (ex.: navegar pro detalhe). */
  onSaleCreated?: (saleId: string) => void;
}

export function useNewSaleViewModel({ onSaleCreated }: UseNewSaleViewModelOptions = {}) {
  const { profile } = useAuth();
  const companyId = profile?.company_id ?? '';
  const userId = profile?.id ?? '';
  const queryClient = useQueryClient();

  // ─── Carrinho ──────────────────────────────────────────────────────────────
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // ─── Seleções ──────────────────────────────────────────────────────────────
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [discount, setDiscount] = useState(0);

  // ─── Pagamento (quanto foi pago no ato) ──────────────────────────────────────
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('full');
  const [paidAmountText, setPaidAmountText] = useState(''); // valor parcial (mascarado)

  // ─── Agendamento ───────────────────────────────────────────────────────────
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<Date | null>(null);
  const [schedulingError, setSchedulingError] = useState<string | null>(null);

  // ─── Lembrete vinculado à venda agendada ───────────────────────────────────
  const [withReminder, setWithReminder] = useState(true);
  const [reminderRemindAt, setReminderRemindAt] = useState<Date | null>(null);
  const [reminderTouched, setReminderTouched] = useState(false);
  const [reminderRecipientIds, setReminderRecipientIds] = useState<string[]>([]);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [reminderWarning, setReminderWarning] = useState<string | null>(null);

  const membersQuery = useQuery({
    queryKey: ['company-members', companyId],
    queryFn: () => remindersService.getCompanyMembers(companyId),
    enabled: !!companyId && isScheduled,
    staleTime: 60_000,
  });

  // Eu mesmo entro como destinatário padrão assim que o perfil carrega.
  useEffect(() => {
    if (userId && !reminderRecipientIds.includes(userId)) {
      setReminderRecipientIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    }
  }, [userId]);

  // Sugere a data do lembrete igual à da entrega, até o usuário editar manualmente.
  useEffect(() => {
    if (isScheduled && withReminder && scheduledFor && !reminderTouched) {
      setReminderRemindAt(scheduledFor);
    }
  }, [isScheduled, withReminder, scheduledFor, reminderTouched]);

  // Ao desligar o agendamento, reseta o estado do lembrete pra próxima venda.
  useEffect(() => {
    if (!isScheduled) {
      setReminderRemindAt(null);
      setReminderTouched(false);
      setReminderError(null);
    }
  }, [isScheduled]);

  const handleReminderRemindAtChange = useCallback((date: Date) => {
    setReminderRemindAt(date);
    setReminderTouched(true);
  }, []);

  const toggleReminderRecipient = useCallback((uid: string) => {
    setReminderRecipientIds((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  }, []);

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

  // Vendas agendadas normalmente são pagas na entrega → default "a prazo".
  useEffect(() => {
    setPaymentMode(isScheduled ? 'later' : 'full');
  }, [isScheduled]);

  // Valor efetivamente pago no ato, conforme o modo escolhido.
  const paidAmount = useMemo(() => {
    if (paymentMode === 'full') return total;
    if (paymentMode === 'later') return 0;
    return Math.min(total, currencyToNumber(paidAmountText));
  }, [paymentMode, paidAmountText, total]);

  const remaining = useMemo(() => Math.max(0, total - paidAmount), [total, paidAmount]);

  // ─── Submit ────────────────────────────────────────────────────────────────
  const saleInput = useMemo(
    () => ({
      items: cartItems,
      customerId: selectedCustomer?.id ?? null,
      paymentMethod,
      discount,
      paidAmount,
    }),
    [cartItems, selectedCustomer, paymentMethod, discount, paidAmount]
  );

  const reminderTitle = selectedCustomer
    ? `Entregar para ${selectedCustomer.name}`
    : 'Entregar pedido';
  const reminderBody = `${cartItems.length} ${cartItems.length === 1 ? 'item' : 'itens'} · ${formatCurrency(total)}`;

  const mutation = useMutation({
    mutationFn: async () => {
      const sale = isScheduled
        ? await salesService.createScheduledSale(companyId, userId, saleInput, scheduledFor!)
        : await salesService.create(companyId, userId, saleInput);

      let reminderCreationWarning: string | null = null;
      if (isScheduled && withReminder && reminderRemindAt) {
        try {
          await remindersService.create(companyId, userId, {
            title: reminderTitle,
            body: reminderBody,
            remindAt: reminderRemindAt,
            recipientIds: reminderRecipientIds,
            saleId: sale.id,
          });
        } catch {
          reminderCreationWarning = 'Venda agendada, mas não foi possível criar o lembrete.';
        }
      }

      return { sale, reminderCreationWarning };
    },
    onSuccess: ({ sale, reminderCreationWarning }) => {
      queryClient.invalidateQueries({ queryKey: ['sales', companyId] });
      queryClient.invalidateQueries({ queryKey: ['products-active', companyId] });
      queryClient.invalidateQueries({ queryKey: ['products', companyId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', companyId] });
      queryClient.invalidateQueries({ queryKey: ['reminders', companyId] });
      // Reset
      setCartItems([]);
      setSelectedCustomer(null);
      setPaymentMethod('cash');
      setDiscount(0);
      setPaymentMode('full');
      setPaidAmountText('');
      setIsScheduled(false);
      setScheduledFor(null);
      setSchedulingError(null);
      setWithReminder(true);
      setReminderRemindAt(null);
      setReminderTouched(false);
      setReminderRecipientIds(userId ? [userId] : []);
      setReminderError(null);
      setReminderWarning(reminderCreationWarning);
      onSaleCreated?.(sale.id);
    },
  });

  const submitSale = useCallback(() => {
    setSchedulingError(null);
    setReminderError(null);
    if (isScheduled) {
      if (!scheduledFor || scheduledFor <= new Date()) {
        setSchedulingError('A data/hora deve ser no futuro.');
        return;
      }
      if (withReminder) {
        if (!reminderRemindAt) {
          setReminderError('Escolha a data/hora do lembrete.');
          return;
        }
        if (reminderRecipientIds.length === 0) {
          setReminderError('Escolha ao menos um destinatário.');
          return;
        }
      }
    }
    mutation.mutate();
  }, [isScheduled, scheduledFor, withReminder, reminderRemindAt, reminderRecipientIds, mutation]);

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
    paymentMethod,
    setPaymentMethod,
    discount,
    setDiscount,

    // Pagamento
    paymentMode,
    setPaymentMode,
    paidAmountText,
    setPaidAmountText,
    paidAmount,
    remaining,

    // Agendamento
    isScheduled,
    setIsScheduled,
    scheduledFor,
    setScheduledFor,
    schedulingError,

    // Lembrete
    withReminder,
    setWithReminder,
    reminderRemindAt,
    setReminderRemindAt: handleReminderRemindAtChange,
    reminderRecipientIds,
    toggleReminderRecipient,
    reminderMembers: membersQuery.data ?? [],
    isLoadingReminderMembers: membersQuery.isLoading,
    reminderError,
    reminderWarning,

    // Submit
    submitSale,
    isSubmitting: mutation.isPending,
    submitError: mutation.error ? humanizeError(mutation.error) : null,
    isSuccess: mutation.isSuccess,
    reset: mutation.reset,
  };
}
