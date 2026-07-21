import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, User, CreditCard, CalendarClock, BellPlus, Wallet } from 'lucide-react-native';
import { ReminderFormSheet } from '@/features/reminders/views/components/ReminderFormSheet';
import { PaymentSheet } from './components/PaymentSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCurrency, formatDate, formatDateTime } from '@/shared/lib/format';
import { useSaleDetailViewModel } from '../viewmodels/useSaleDetailViewModel';
import {
  PAYMENT_LABELS,
  STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  type SaleStatus,
  type PaymentStatus,
  type PaymentMethod,
  type SaleItemWithProduct,
} from '../models/salesService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<MoreStackParamList, 'SaleDetail'>;

const STATUS_COLORS: Record<SaleStatus, { bg: string; text: string }> = {
  completed: { bg: '#D1FAE5', text: '#065F46' },
  delivered: { bg: '#D1FAE5', text: '#065F46' },
  scheduled: { bg: '#DBEAFE', text: '#1E40AF' },
  canceled: { bg: '#FEE2E2', text: '#991B1B' },
};

const PAYMENT_STATUS_COLORS: Record<PaymentStatus, { bg: string; text: string }> = {
  paid: { bg: '#D1FAE5', text: '#065F46' },
  partial: { bg: '#FEF3C7', text: '#92400E' },
  pending: { bg: '#FEE2E2', text: '#991B1B' },
};

export function SaleDetailScreen({ route, navigation }: Props) {
  const { saleId } = route.params;
  const { top, bottom } = useSafeAreaInsets();
  const vm = useSaleDetailViewModel(saleId);
  const [showReminderSheet, setShowReminderSheet] = useState(false);
  const [showPaymentSheet, setShowPaymentSheet] = useState(false);

  // Fecha o sheet de pagamento após registrar com sucesso.
  useEffect(() => {
    if (vm.isPaymentRegistered) {
      setShowPaymentSheet(false);
      vm.resetPaymentMutation();
    }
  }, [vm.isPaymentRegistered, vm.resetPaymentMutation]);

  // Tela pode ser aberta via navegação aninhada de outra aba (Dashboard,
  // notificação push) ou já no topo da pilha de "Mais" sem histórico atrás —
  // nesses casos goBack() não teria para onde ir, então caímos na Home da aba.
  function handleBack() {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('MoreHome');
    }
  }

  function handleCancel() {
    Alert.alert(
      'Cancelar venda',
      'Tem certeza? O estoque não será restaurado automaticamente.',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Cancelar venda',
          style: 'destructive',
          onPress: () => vm.cancelSale(),
        },
      ]
    );
  }

  function handleDeliver() {
    Alert.alert(
      'Confirmar entrega',
      'Marcar esta venda como entregue? O estoque será deduzido automaticamente.',
      [
        { text: 'Não', style: 'cancel' },
        {
          text: 'Confirmar entrega',
          onPress: () => vm.markDelivered(),
        },
      ]
    );
  }

  if (vm.isLoading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color="#C47C0A" size="large" />
      </View>
    );
  }

  if (!vm.sale) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Text style={styles.errorText}>{vm.error ?? 'Venda não encontrada.'}</Text>
        <Pressable onPress={handleBack} style={styles.backLink}>
          <Text style={styles.backLinkText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const { sale } = vm;
  const status = sale.status as SaleStatus;
  const statusColors = STATUS_COLORS[status];
  const customer = sale.customer as { name: string; type: string; phone: string | null } | null;
  const items = (sale.items ?? []) as SaleItemWithProduct[];
  const isCancelable = status === 'scheduled' || status === 'completed';
  const isDeliverable = status === 'scheduled';

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 12 }]}>
        <Pressable onPress={handleBack} hitSlop={8} style={styles.backBtn}>
          <ArrowLeft size={22} color="#1F1B16" />
        </Pressable>
        <Text style={styles.title}>Detalhe da venda</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusColors.bg }]}>
          <Text style={[styles.statusText, { color: statusColors.text }]}>
            {STATUS_LABELS[status]}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottom + 32 }]}
      >
        {/* Meta da venda */}
        <View style={styles.card}>
          <Text style={styles.cardDate}>{formatDateTime(new Date(sale.created_at))}</Text>

          <View style={styles.metaRow}>
            <User size={15} color="#A89E91" />
            <Text style={styles.metaText}>
              {customer?.name ?? 'Avulso'}
              {customer?.type === 'reseller' ? ' · Revenda' : ''}
            </Text>
          </View>
          {customer?.phone ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Tel.</Text>
              <Text style={styles.metaText}>{customer.phone}</Text>
            </View>
          ) : null}

          <View style={styles.metaDivider} />

          <View style={styles.metaRow}>
            <CreditCard size={15} color="#A89E91" />
            <Text style={styles.metaText}>{PAYMENT_LABELS[sale.payment_method as PaymentMethod]}</Text>
          </View>

          {sale.notes ? (
            <>
              <View style={styles.metaDivider} />
              <Text style={styles.notes}>{sale.notes}</Text>
            </>
          ) : null}
        </View>

        {/* Itens */}
        <Text style={styles.sectionLabel}>Itens</Text>
        <View style={styles.card}>
          {items.map((item, idx) => (
            <View key={item.id}>
              {idx > 0 ? <View style={styles.itemDivider} /> : null}
              <View style={styles.itemRow}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>
                    {item.product?.name ?? 'Produto'}
                  </Text>
                  <Text style={styles.itemMeta}>
                    {item.quantity} × {formatCurrency(item.unit_price)}
                  </Text>
                </View>
                <Text style={styles.itemSubtotal}>{formatCurrency(item.subtotal)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Totais */}
        <View style={styles.card}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>
              {formatCurrency(sale.total + sale.discount)}
            </Text>
          </View>
          {sale.discount > 0 ? (
            <View style={styles.totalRow}>
              <Text style={styles.discountLabel}>Desconto</Text>
              <Text style={styles.discountValue}>−{formatCurrency(sale.discount)}</Text>
            </View>
          ) : null}
          <View style={styles.totalDivider} />
          <View style={styles.totalRow}>
            <Text style={styles.grandTotalLabel}>Total</Text>
            <Text style={styles.grandTotalValue}>{formatCurrency(sale.total)}</Text>
          </View>
        </View>

        {/* Pagamento */}
        {status !== 'canceled' ? (
          <>
            <Text style={styles.sectionLabel}>Pagamento</Text>
            <View style={styles.card}>
              <View style={styles.payHeaderRow}>
                <View style={styles.payMethodRow}>
                  <Wallet size={15} color="#A89E91" />
                  <Text style={styles.payMethodText}>
                    {PAYMENT_LABELS[sale.payment_method as PaymentMethod]}
                  </Text>
                </View>
                <View
                  style={[
                    styles.payBadge,
                    { backgroundColor: PAYMENT_STATUS_COLORS[vm.paymentStatus].bg },
                  ]}
                >
                  <Text
                    style={[
                      styles.payBadgeText,
                      { color: PAYMENT_STATUS_COLORS[vm.paymentStatus].text },
                    ]}
                  >
                    {PAYMENT_STATUS_LABELS[vm.paymentStatus]}
                  </Text>
                </View>
              </View>

              <View style={styles.totalDivider} />
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Pago</Text>
                <Text style={styles.totalValue}>{formatCurrency(vm.paid)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.grandTotalLabel}>Falta</Text>
                <Text
                  style={[styles.grandTotalValue, vm.balance > 0 ? styles.balanceDue : null]}
                >
                  {formatCurrency(vm.balance)}
                </Text>
              </View>

              {vm.payments.length > 0 ? (
                <>
                  <View style={styles.totalDivider} />
                  {vm.payments.map((p) => (
                    <View key={p.id} style={styles.paymentRow}>
                      <Text style={styles.paymentDate}>
                        {formatDate(new Date(p.paid_at))} · {PAYMENT_LABELS[p.method as PaymentMethod]}
                      </Text>
                      <Text style={styles.paymentAmount}>{formatCurrency(p.amount)}</Text>
                    </View>
                  ))}
                </>
              ) : null}

              {/* Ação contextual: registrar pagamento fica junto do saldo */}
              {vm.balance > 0 ? (
                <Pressable style={styles.payInlineBtn} onPress={() => setShowPaymentSheet(true)}>
                  <Wallet size={15} color="#9B5F0B" />
                  <Text style={styles.payInlineBtnText}>Registrar pagamento</Text>
                </Pressable>
              ) : null}
            </View>

            {vm.registerPaymentError ? (
              <Text style={styles.errorText}>{vm.registerPaymentError}</Text>
            ) : null}
          </>
        ) : null}

        {/* Data de entrega agendada — sino cria lembrete */}
        {isDeliverable && sale.scheduled_for ? (
          <View style={styles.scheduledCard}>
            <CalendarClock size={16} color="#1E40AF" />
            <Text style={styles.scheduledText}>
              Entrega agendada: {formatDateTime(new Date(sale.scheduled_for))}
            </Text>
            <Pressable
              style={styles.bellBtn}
              hitSlop={6}
              onPress={() => setShowReminderSheet(true)}
            >
              <BellPlus size={16} color="#C47C0A" />
            </Pressable>
          </View>
        ) : null}

        {/* Cancelar — ação destrutiva discreta */}
        {isCancelable ? (
          <Pressable
            style={styles.cancelLink}
            onPress={handleCancel}
            disabled={vm.isCanceling}
          >
            {vm.isCanceling ? (
              <ActivityIndicator color="#B3261E" size="small" />
            ) : (
              <Text style={styles.cancelLinkText}>Cancelar venda</Text>
            )}
          </Pressable>
        ) : null}

        {vm.cancelError ? (
          <Text style={styles.errorText}>{vm.cancelError}</Text>
        ) : null}
      </ScrollView>

      {/* Ação primária fixa: marcar como entregue */}
      {isDeliverable ? (
        <View style={[styles.footer, { paddingBottom: bottom + 6 }]}>
          {vm.deliverError ? (
            <Text style={styles.errorText}>{vm.deliverError}</Text>
          ) : null}
          <Pressable
            style={[styles.deliverBtn, vm.isDelivering && styles.deliverBtnDisabled]}
            onPress={handleDeliver}
            disabled={vm.isDelivering}
          >
            {vm.isDelivering ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.deliverBtnText}>Marcar como Entregue</Text>
            )}
          </Pressable>
        </View>
      ) : null}

      {isDeliverable && sale.scheduled_for ? (
        <ReminderFormSheet
          visible={showReminderSheet}
          onClose={() => setShowReminderSheet(false)}
          prefilledSaleId={sale.id}
          prefilledRemindAt={new Date(sale.scheduled_for)}
          prefilledCustomerName={customer?.name ?? 'Cliente avulso'}
        />
      ) : null}

      <PaymentSheet
        visible={showPaymentSheet}
        balance={vm.balance}
        isSubmitting={vm.isRegisteringPayment}
        error={vm.registerPaymentError}
        onSubmit={vm.registerPayment}
        onClose={() => setShowPaymentSheet(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1EA' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, gap: 12 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: -8,
  },
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700', color: '#1F1B16', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },

  sectionLabel: { fontSize: 13, fontWeight: '600', color: '#6B6258', textTransform: 'uppercase', letterSpacing: 0.5 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDate: { fontSize: 13, color: '#A89E91' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaLabel: { fontSize: 13, color: '#A89E91', width: 28 },
  metaText: { fontSize: 15, color: '#3B342B', flex: 1 },
  metaDivider: { height: 1, backgroundColor: '#E7E2D9', marginVertical: 4 },
  notes: { fontSize: 14, color: '#6B6258', fontStyle: 'italic' },

  itemRow: { flexDirection: 'row', alignItems: 'flex-start' },
  itemInfo: { flex: 1, gap: 2 },
  itemName: { fontSize: 15, fontWeight: '600', color: '#1F1B16' },
  itemSub: { fontSize: 13, color: '#6B6258' },
  itemMeta: { fontSize: 13, color: '#A89E91' },
  itemSubtotal: { fontSize: 15, fontWeight: '700', color: '#C47C0A', marginLeft: 12 },
  itemDivider: { height: 1, backgroundColor: '#F5F1EA', marginVertical: 8 },

  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  totalLabel: { fontSize: 14, color: '#6B6258' },
  totalValue: { fontSize: 14, color: '#3B342B' },
  discountLabel: { fontSize: 14, color: '#B3261E' },
  discountValue: { fontSize: 14, color: '#B3261E' },
  totalDivider: { height: 1, backgroundColor: '#E7E2D9' },
  grandTotalLabel: { fontSize: 17, fontWeight: '700', color: '#1F1B16' },
  grandTotalValue: { fontSize: 22, fontWeight: '700', color: '#C47C0A' },

  bellBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FCEFC8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  payHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  payMethodRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  payMethodText: { fontSize: 15, color: '#3B342B' },
  payBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  payBadgeText: { fontSize: 12, fontWeight: '700' },
  balanceDue: { color: '#B3261E' },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  paymentDate: { fontSize: 13, color: '#6B6258' },
  paymentAmount: { fontSize: 14, color: '#1F1B16', fontWeight: '600' },
  payInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
    backgroundColor: '#FCEFC8',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  payInlineBtnText: { fontSize: 14, fontWeight: '600', color: '#9B5F0B' },

  scheduledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#DBEAFE',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  scheduledText: { fontSize: 14, fontWeight: '600', color: '#1E40AF', flex: 1 },

  deliverBtn: {
    backgroundColor: '#C47C0A',
    borderRadius: 12,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliverBtnDisabled: { opacity: 0.6 },
  deliverBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },

  cancelLink: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  cancelLinkText: { fontSize: 14, fontWeight: '600', color: '#B3261E' },

  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E7E2D9',
    gap: 6,
  },

  errorText: { fontSize: 14, color: '#B3261E', textAlign: 'center' },
  backLink: { marginTop: 12 },
  backLinkText: { fontSize: 15, color: '#C47C0A', fontWeight: '600' },
});
