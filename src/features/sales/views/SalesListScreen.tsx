import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Plus, ShoppingBag, CalendarClock } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCurrency, formatDateTime } from '@/shared/lib/format';
import {
  useSalesListViewModel,
  type PeriodFilter,
  type ViewMode,
} from '../viewmodels/useSalesListViewModel';
import {
  CHANNEL_LABELS,
  PAYMENT_LABELS,
  STATUS_LABELS,
  type Sale,
  type SaleStatus,
} from '../models/salesService';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { SalesStackParamList } from '@/navigation/types';

type Props = NativeStackScreenProps<SalesStackParamList, 'SalesList'>;

const PERIODS: { key: PeriodFilter; label: string }[] = [
  { key: 'today', label: 'Hoje' },
  { key: 'week', label: '7 dias' },
  { key: 'month', label: 'Mês' },
  { key: 'all', label: 'Todos' },
];

const VIEW_MODES: { key: ViewMode; label: string }[] = [
  { key: 'history', label: 'Histórico' },
  { key: 'scheduled', label: 'Agendadas' },
];

const STATUS_COLORS: Record<SaleStatus, { bg: string; text: string }> = {
  completed: { bg: '#D1FAE5', text: '#065F46' },
  delivered: { bg: '#D1FAE5', text: '#065F46' },
  scheduled: { bg: '#DBEAFE', text: '#1E40AF' },
  canceled: { bg: '#FEE2E2', text: '#991B1B' },
};

export function SalesListScreen({ navigation }: Props) {
  const { top } = useSafeAreaInsets();
  const vm = useSalesListViewModel();

  const isHistory = vm.viewMode === 'history';
  const listData = isHistory ? vm.sales : vm.scheduledSales;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <View>
          <Text style={styles.title}>Vendas</Text>
          {isHistory && vm.sales.length > 0 ? (
            <Text style={styles.subtitle}>
              {vm.sales.filter((s) => s.status !== 'canceled').length} venda(s) · {formatCurrency(vm.totalAmount)}
            </Text>
          ) : null}
          {!isHistory && vm.scheduledSales.length > 0 ? (
            <Text style={styles.subtitle}>
              {vm.scheduledSales.length} agendada(s)
            </Text>
          ) : null}
        </View>
        <Pressable
          onPress={() => navigation.navigate('NewSale')}
          style={styles.addBtn}
          accessibilityLabel="Nova venda"
        >
          <Plus size={20} color="#9B5F0B" />
        </Pressable>
      </View>

      {/* Toggle Histórico / Agendadas */}
      <View style={styles.viewModeTabs}>
        {VIEW_MODES.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.viewModeTab, vm.viewMode === key && styles.viewModeTabActive]}
            onPress={() => vm.setViewMode(key)}
          >
            <Text style={[styles.viewModeTabText, vm.viewMode === key && styles.viewModeTabTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Filtro de período (apenas no histórico) */}
      {isHistory ? (
        <View style={styles.tabs}>
          {PERIODS.map(({ key, label }) => (
            <Pressable
              key={key}
              style={[styles.tab, vm.period === key && styles.tabActive]}
              onPress={() => vm.setPeriod(key)}
            >
              <Text style={[styles.tabText, vm.period === key && styles.tabTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      {vm.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#C47C0A" size="large" />
        </View>
      ) : (
        <FlatList
          data={listData}
          keyExtractor={(item) => item.id}
          contentContainerStyle={listData.length === 0 ? styles.flex : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.refresh}
              tintColor="#C47C0A"
              colors={['#C47C0A']}
            />
          }
          renderItem={({ item }) => (
            <SaleCard
              sale={item}
              showScheduledDate={!isHistory}
              onPress={() => navigation.navigate('SaleDetail', { saleId: item.id })}
            />
          )}
          ListEmptyComponent={
            isHistory ? (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <ShoppingBag size={36} color="#F5C859" />
                </View>
                <Text style={styles.emptyTitle}>Nenhuma venda</Text>
                <Text style={styles.emptyBody}>
                  Toque em + para registrar a primeira venda do período.
                </Text>
              </View>
            ) : (
              <View style={styles.empty}>
                <View style={styles.emptyIconWrap}>
                  <CalendarClock size={36} color="#F5C859" />
                </View>
                <Text style={styles.emptyTitle}>Nenhuma entrega agendada</Text>
                <Text style={styles.emptyBody}>
                  Ao registrar uma venda com data futura, ela aparecerá aqui.
                </Text>
              </View>
            )
          }
        />
      )}
    </View>
  );
}

function SaleCard({
  sale,
  showScheduledDate,
  onPress,
}: {
  sale: Sale;
  showScheduledDate?: boolean;
  onPress: () => void;
}) {
  const status = sale.status as SaleStatus;
  const colors = STATUS_COLORS[status];
  const customer = sale.customer as { name: string; type: string } | null;
  const displayDate =
    showScheduledDate && sale.scheduled_for
      ? formatDateTime(new Date(sale.scheduled_for))
      : formatDateTime(new Date(sale.created_at));

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardDate}>{displayDate}</Text>
          <Text style={styles.cardCustomer}>
            {customer?.name ?? 'Avulso'}
          </Text>
          <Text style={styles.cardMeta}>
            {CHANNEL_LABELS[sale.channel as keyof typeof CHANNEL_LABELS]} · {PAYMENT_LABELS[sale.payment_method as keyof typeof PAYMENT_LABELS]}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.cardTotal}>{formatCurrency(sale.total)}</Text>
          <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
            <Text style={[styles.statusText, { color: colors.text }]}>
              {STATUS_LABELS[status]}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1EA' },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '700', color: '#1F1B16' },
  subtitle: { fontSize: 13, color: '#6B6258', marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FCEFC8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  viewModeTabs: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E2D9',
    overflow: 'hidden',
  },
  viewModeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewModeTabActive: { backgroundColor: '#FCEFC8' },
  viewModeTabText: { fontSize: 14, fontWeight: '500', color: '#6B6258' },
  viewModeTabTextActive: { color: '#9B5F0B', fontWeight: '700' },

  tabs: { flexDirection: 'row', paddingHorizontal: 24, paddingBottom: 12, gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E2D9',
  },
  tabActive: { backgroundColor: '#FCEFC8', borderColor: '#C47C0A' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#6B6258' },
  tabTextActive: { color: '#9B5F0B', fontWeight: '600' },

  listContent: { paddingHorizontal: 24, paddingBottom: 32, gap: 10 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: { opacity: 0.85 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardLeft: { flex: 1, gap: 3 },
  cardDate: { fontSize: 12, color: '#A89E91' },
  cardCustomer: { fontSize: 16, fontWeight: '700', color: '#1F1B16' },
  cardMeta: { fontSize: 13, color: '#6B6258' },
  cardRight: { alignItems: 'flex-end', gap: 6, marginLeft: 12 },
  cardTotal: { fontSize: 18, fontWeight: '700', color: '#C47C0A' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FCEFC8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#1F1B16', textAlign: 'center' },
  emptyBody: {
    fontSize: 15,
    color: '#6B6258',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 260,
  },
});
