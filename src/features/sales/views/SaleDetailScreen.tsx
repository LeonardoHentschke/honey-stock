import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, User, Truck, CreditCard, CalendarClock, BellPlus } from 'lucide-react-native';
import { ReminderFormSheet } from '@/features/reminders/views/components/ReminderFormSheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCurrency, formatDateTime } from '@/shared/lib/format';
import { useSaleDetailViewModel } from '../viewmodels/useSaleDetailViewModel';
import {
  CHANNEL_LABELS,
  PAYMENT_LABELS,
  STATUS_LABELS,
  type SaleStatus,
  type SaleChannel,
  type PaymentMethod,
  type SaleItemWithVariant,
} from '../models/salesService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SalesStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<SalesStackParamList, 'SaleDetail'>;

const STATUS_COLORS: Record<SaleStatus, { bg: string; text: string }> = {
  completed: { bg: '#D1FAE5', text: '#065F46' },
  delivered: { bg: '#D1FAE5', text: '#065F46' },
  scheduled: { bg: '#DBEAFE', text: '#1E40AF' },
  canceled: { bg: '#FEE2E2', text: '#991B1B' },
};

export function SaleDetailScreen({ route, navigation }: Props) {
  const { saleId } = route.params;
  const { top, bottom } = useSafeAreaInsets();
  const vm = useSaleDetailViewModel(saleId);

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
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const [showReminderSheet, setShowReminderSheet] = useState(false);

  const { sale } = vm;
  const status = sale.status as SaleStatus;
  const statusColors = STATUS_COLORS[status];
  const customer = sale.customer as { name: string; type: string; phone: string | null } | null;
  const items = (sale.items ?? []) as SaleItemWithVariant[];
  const isCancelable = status === 'scheduled' || status === 'completed';
  const isDeliverable = status === 'scheduled';

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
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
            <Truck size={15} color="#A89E91" />
            <Text style={styles.metaText}>{CHANNEL_LABELS[sale.channel as SaleChannel]}</Text>
          </View>
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
                    {item.variant?.product?.name ?? 'Produto'}
                  </Text>
                  {item.variant?.packaging ? (
                    <Text style={styles.itemSub}>{item.variant.packaging}</Text>
                  ) : null}
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

        {/* Data de entrega agendada */}
        {isDeliverable && sale.scheduled_for ? (
          <>
            <View style={styles.scheduledCard}>
              <CalendarClock size={16} color="#1E40AF" />
              <Text style={styles.scheduledText}>
                Entrega agendada: {formatDateTime(new Date(sale.scheduled_for))}
              </Text>
            </View>
            <Pressable
              style={styles.reminderBtn}
              onPress={() => setShowReminderSheet(true)}
            >
              <BellPlus size={16} color="#C47C0A" />
              <Text style={styles.reminderBtnText}>Criar lembrete para esta entrega</Text>
            </Pressable>
          </>
        ) : null}

        {/* Marcar como Entregue */}
        {isDeliverable ? (
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
        ) : null}

        {vm.deliverError ? (
          <Text style={styles.errorText}>{vm.deliverError}</Text>
        ) : null}

        {/* Cancelar */}
        {isCancelable ? (
          <Pressable
            style={[styles.cancelBtn, vm.isCanceling && styles.cancelBtnDisabled]}
            onPress={handleCancel}
            disabled={vm.isCanceling}
          >
            {vm.isCanceling ? (
              <ActivityIndicator color="#B3261E" />
            ) : (
              <Text style={styles.cancelBtnText}>Cancelar venda</Text>
            )}
          </Pressable>
        ) : null}

        {vm.cancelError ? (
          <Text style={styles.errorText}>{vm.cancelError}</Text>
        ) : null}
      </ScrollView>

      {isDeliverable && sale.scheduled_for ? (
        <ReminderFormSheet
          visible={showReminderSheet}
          onClose={() => setShowReminderSheet(false)}
          prefilledSaleId={sale.id}
          prefilledRemindAt={new Date(sale.scheduled_for)}
        />
      ) : null}
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
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1F1B16', flex: 1 },
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

  reminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#C47C0A',
    borderRadius: 14,
    height: 44,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  reminderBtnText: { fontSize: 14, fontWeight: '600', color: '#C47C0A' },

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
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C47C0A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  deliverBtnDisabled: { opacity: 0.6 },
  deliverBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#B3261E',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnDisabled: { opacity: 0.5 },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#B3261E' },

  errorText: { fontSize: 14, color: '#B3261E', textAlign: 'center' },
  backLink: { marginTop: 12 },
  backLinkText: { fontSize: 15, color: '#C47C0A', fontWeight: '600' },
});
