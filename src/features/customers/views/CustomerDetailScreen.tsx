import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  FileText,
  MapPin,
  Tags,
  MessageCircle,
  ShoppingCart,
  CalendarClock,
  CheckCircle2,
  XCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

import { useCustomerDetailViewModel } from '../viewmodels/useCustomerDetailViewModel';
import { CustomerFormSheet } from './components/CustomerFormSheet';
import { humanizeError } from '@/shared/lib/errors';
import { formatCurrency, formatDate } from '@/shared/lib/format';
import {
  STATUS_LABELS,
  PAYMENT_LABELS,
  balance,
  type SaleStatus,
  type PaymentMethod,
  type SaleWithItems,
} from '@/features/sales/models/salesService';
import type { ContactsStackParamList, AppTabsParamList } from '@/navigation/types';

type Route = RouteProp<ContactsStackParamList, 'CustomerDetail'>;
type Nav = NativeStackNavigationProp<ContactsStackParamList, 'CustomerDetail'>;

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function digitsOnly(phone: string): string {
  return phone.replace(/\D/g, '');
}

export function CustomerDetailScreen() {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { customerId } = route.params;
  const vm = useCustomerDetailViewModel(customerId);

  const isReseller = vm.customer?.type === 'reseller';

  function goToNewSale() {
    navigation
      .getParent<BottomTabNavigationProp<AppTabsParamList>>()
      ?.navigate('Sales');
  }

  function confirmDeactivate() {
    Alert.alert(
      'Desativar cliente',
      'Este cliente será desativado e não aparecerá mais nas listas. Esta ação pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desativar', style: 'destructive', onPress: () => vm.deactivate() },
      ],
    );
  }

  if (vm.isLoading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color="#C47C0A" size="large" />
      </View>
    );
  }

  if (!vm.customer) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Text style={styles.errorText}>Cliente não encontrado.</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const { customer, summary } = vm;
  const phone = customer.phone ?? null;
  const firstName = customer.name.split(' ')[0];

  return (
    <View style={styles.root}>
      {/* ── Header ───────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={[styles.iconBtn, styles.backBtn]}>
          <ArrowLeft size={22} color="#1F1B16" />
        </Pressable>
        <Text style={styles.headerTitle}>Contato</Text>
        <Pressable onPress={vm.openEditSheet} hitSlop={8} style={[styles.iconBtn, styles.editBtn]}>
          <Pencil size={18} color="#9B5F0B" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={vm.isRefetching}
            onRefresh={vm.refresh}
            tintColor="#C47C0A"
            colors={['#C47C0A']}
          />
        }
      >
        {/* ── Hero ─────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={[styles.avatar, isReseller ? styles.avatarReseller : styles.avatarFinal]}>
            <Text style={[styles.avatarText, isReseller ? styles.avatarTextReseller : styles.avatarTextFinal]}>
              {getInitials(customer.name)}
            </Text>
          </View>
          <Text style={styles.heroName}>{customer.name}</Text>
          {isReseller && customer.business_name ? (
            <Text style={styles.heroBusiness}>{customer.business_name}</Text>
          ) : null}
          <View style={[styles.badge, isReseller ? styles.badgeReseller : styles.badgeFinal]}>
            <Text style={[styles.badgeText, isReseller ? styles.badgeTextReseller : styles.badgeTextFinal]}>
              {isReseller
                ? `Revenda${customer.reseller_discount_percent != null ? ` · ${customer.reseller_discount_percent}% desc.` : ''}`
                : 'Cliente final'}
            </Text>
          </View>
        </View>

        {/* ── Atalhos rápidos ──────────────────────────────── */}
        <View style={styles.actionsRow}>
          <QuickAction
            Icon={MessageCircle}
            label="WhatsApp"
            tint="#2E7D32"
            disabled={!phone}
            onPress={() => phone && Linking.openURL(`https://wa.me/55${digitsOnly(phone)}`)}
          />
          <QuickAction
            Icon={Phone}
            label="Ligar"
            tint="#3B342B"
            disabled={!phone}
            onPress={() => phone && Linking.openURL(`tel:${digitsOnly(phone)}`)}
          />
          <QuickAction Icon={ShoppingCart} label="Vender" tint="#9B5F0B" onPress={goToNewSale} />
        </View>

        {/* ── Resumo ───────────────────────────────────────── */}
        <Text style={styles.sectionHeader}>Resumo</Text>
        <View style={styles.statGrid}>
          <DStat label="Total comprado" value={formatCurrency(summary.totalSpent)} />
          <DStat label="Nº de compras" value={String(summary.count)} />
          <DStat label="Ticket médio" value={formatCurrency(summary.avgTicket)} />
          <DStat
            label="Última compra"
            value={summary.lastPurchaseDate ? formatDate(summary.lastPurchaseDate) : '—'}
          />
        </View>

        {summary.totalReceivable > 0 ? (
          <View style={styles.receivableCard}>
            <Text style={styles.receivableLabel}>A receber</Text>
            <Text style={styles.receivableValue}>{formatCurrency(summary.totalReceivable)}</Text>
          </View>
        ) : null}

        {/* ── Detalhes ─────────────────────────────────────── */}
        <Text style={styles.sectionHeader}>Detalhes</Text>
        <View style={styles.infoCard}>
          {customer.phone && <InfoRow Icon={Phone} label="Telefone" value={customer.phone} />}
          {customer.email && <InfoRow Icon={Mail} label="E-mail" value={customer.email} divider />}
          {customer.document && (
            <InfoRow Icon={FileText} label="Documento" value={customer.document} mono divider />
          )}
          {customer.address && <InfoRow Icon={MapPin} label="Endereço" value={customer.address} divider />}
          {isReseller && customer.reseller_discount_percent != null && (
            <InfoRow
              Icon={Tags}
              label="Desconto padrão"
              value={`${customer.reseller_discount_percent}%`}
              divider
            />
          )}
          {!customer.phone &&
            !customer.email &&
            !customer.document &&
            !customer.address &&
            !(isReseller && customer.reseller_discount_percent != null) && (
              <Text style={styles.empty}>Nenhum dado cadastrado.</Text>
            )}
        </View>

        {/* ── Histórico de compras ─────────────────────────── */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeader}>Histórico de compras</Text>
          {summary.count > 0 && <Text style={styles.sectionCount}>{summary.count}</Text>}
        </View>
        {vm.salesLoading ? (
          <View style={styles.historyLoading}>
            <ActivityIndicator color="#C47C0A" />
          </View>
        ) : vm.sales.length === 0 ? (
          <View style={styles.historyEmpty}>
            <Text style={styles.empty}>Nenhuma compra registrada ainda.</Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {vm.sales.map((sale) => (
              <SaleHistoryCard key={sale.id} sale={sale} />
            ))}
          </View>
        )}

        {/* ── Desativar (baixa ênfase) ─────────────────────── */}
        {customer.is_active ? (
          <Pressable style={styles.deactivateBtn} onPress={confirmDeactivate}>
            <Text style={styles.deactivateBtnText}>
              {vm.isDeactivating ? 'Desativando...' : 'Desativar cliente'}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.inactiveCard}>
            <Text style={styles.inactiveText}>Este cliente está desativado.</Text>
          </View>
        )}
      </ScrollView>

      {/* ── Rodapé sticky ──────────────────────────────────── */}
      <View style={styles.stickyBottom}>
        <Pressable style={styles.primaryBtn} onPress={goToNewSale}>
          <ShoppingCart size={20} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>Nova venda para {firstName}</Text>
        </Pressable>
      </View>

      <CustomerFormSheet
        visible={vm.showEditSheet}
        editingCustomer={customer}
        isSaving={vm.isSaving}
        error={vm.saveError ? humanizeError(vm.saveError) : null}
        onSave={vm.updateCustomer}
        onClose={vm.closeEditSheet}
      />
    </View>
  );
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

function QuickAction({
  Icon,
  label,
  tint,
  onPress,
  disabled,
}: {
  Icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  tint: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={styles.quickAction}
      android_ripple={{ color: 'rgba(31,27,22,0.05)' }}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={styles.quickTile}>
        <Icon size={22} color={disabled ? '#A89E91' : tint} />
      </View>
      <Text style={[styles.quickLabel, disabled && styles.quickLabelDisabled]}>{label}</Text>
    </Pressable>
  );
}

function DStat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function InfoRow({
  Icon,
  label,
  value,
  mono,
  divider,
}: {
  Icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: string;
  mono?: boolean;
  divider?: boolean;
}) {
  return (
    <>
      {divider && <View style={styles.infoDivider} />}
      <View style={styles.infoRow}>
        <View style={styles.infoTile}>
          <Icon size={18} color="#9B5F0B" />
        </View>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, mono && styles.infoValueMono]} numberOfLines={1}>
          {value}
        </Text>
      </View>
    </>
  );
}

function SaleHistoryCard({ sale }: { sale: SaleWithItems }) {
  const itemsLabel = (sale.items ?? [])
    .map((it) => `${it.quantity}× ${it.product?.name ?? 'Item'}`)
    .join(' · ');

  return (
    <View style={styles.saleCard}>
      <View style={styles.saleTopRow}>
        <View style={styles.saleIdRow}>
          <Text style={styles.saleId}>#{sale.id.slice(-4).toUpperCase()}</Text>
          <Text style={styles.saleDot}>·</Text>
          <Text style={styles.saleDate}>{formatDate(new Date(sale.created_at))}</Text>
        </View>
        <StatusBadge status={sale.status as SaleStatus} />
      </View>
      {itemsLabel ? (
        <Text style={styles.saleItems} numberOfLines={2}>
          {itemsLabel}
        </Text>
      ) : null}
      <View style={styles.saleDivider} />
      <View style={styles.saleBottomRow}>
        <Text style={styles.saleMeta}>
          {PAYMENT_LABELS[sale.payment_method as PaymentMethod]}
          {sale.status !== 'canceled' && balance(sale) > 0 ? (
            <Text style={styles.saleDue}>{`  ·  Falta ${formatCurrency(balance(sale))}`}</Text>
          ) : null}
        </Text>
        <Text style={styles.saleTotal}>{formatCurrency(sale.total ?? 0)}</Text>
      </View>
    </View>
  );
}

function StatusBadge({ status }: { status: SaleStatus }) {
  const cfg: Record<SaleStatus, { bg: string; fg: string; Icon: React.ComponentType<{ size: number; color: string }> }> = {
    scheduled: { bg: '#DCE9F7', fg: '#1565C0', Icon: CalendarClock },
    delivered: { bg: '#E4F2E4', fg: '#2E7D32', Icon: CheckCircle2 },
    completed: { bg: '#E4F2E4', fg: '#2E7D32', Icon: CheckCircle2 },
    canceled: { bg: '#E7E2D9', fg: '#6B6258', Icon: XCircle },
  };
  const { bg, fg, Icon } = cfg[status];
  return (
    <View style={[styles.statusBadge, { backgroundColor: bg }]}>
      <Icon size={11} color={fg} />
      <Text style={[styles.statusText, { color: fg }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1EA' },
  centered: { alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 4,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  editBtn: { backgroundColor: '#FCEFC8' },
  backBtn: { marginLeft: -8 },
  headerTitle: { flex: 1, fontSize: 24, lineHeight: 32, fontWeight: '700', color: '#1F1B16' },

  content: { paddingHorizontal: 24, paddingTop: 4, paddingBottom: 120 },

  // Hero
  hero: { alignItems: 'center', gap: 10, paddingBottom: 4 },
  avatar: { width: 88, height: 88, borderRadius: 44, alignItems: 'center', justifyContent: 'center' },
  avatarFinal: { backgroundColor: '#FCEFC8' },
  avatarReseller: { backgroundColor: '#E3D0AE' },
  avatarText: { fontSize: 32, fontWeight: '600' },
  avatarTextFinal: { color: '#9B5F0B' },
  avatarTextReseller: { color: '#7A5A2A' },
  heroName: { fontSize: 24, lineHeight: 32, fontWeight: '700', color: '#1F1B16', textAlign: 'center' },
  heroBusiness: { fontSize: 15, lineHeight: 22, color: '#6B6258', textAlign: 'center', marginTop: -6 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  badgeFinal: { backgroundColor: '#FCEFC8' },
  badgeReseller: { backgroundColor: '#E3D0AE' },
  badgeText: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  badgeTextFinal: { color: '#9B5F0B' },
  badgeTextReseller: { color: '#7A5A2A' },

  // Quick actions
  actionsRow: { flexDirection: 'row', gap: 12, justifyContent: 'center', paddingTop: 18, paddingBottom: 4 },
  quickAction: { flex: 1, alignItems: 'center', gap: 6 },
  quickTile: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  quickLabel: { fontSize: 12, lineHeight: 16, fontWeight: '500', color: '#3B342B', textAlign: 'center' },
  quickLabelDisabled: { color: '#A89E91' },

  // Section header
  sectionHeader: { fontSize: 17, lineHeight: 24, fontWeight: '600', color: '#1F1B16', marginTop: 20 },
  sectionHeaderRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  sectionCount: { fontSize: 13, lineHeight: 18, fontWeight: '500', color: '#6B6258', marginTop: 20 },

  // A receber (destaque)
  receivableCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 12,
  },
  receivableLabel: { fontSize: 14, fontWeight: '600', color: '#92400E' },
  receivableValue: { fontSize: 18, fontWeight: '700', color: '#92400E' },
  saleDue: { color: '#B3261E', fontWeight: '600' },

  // Stat grid
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 },
  statCard: {
    flexGrow: 1,
    flexBasis: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 2,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  statLabel: { fontSize: 12, lineHeight: 16, color: '#6B6258' },
  statValue: { fontSize: 20, lineHeight: 28, fontWeight: '600', color: '#1F1B16' },

  // Info card
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 },
  infoTile: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FEF9EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: { flex: 1, fontSize: 15, lineHeight: 22, color: '#6B6258' },
  infoValue: { fontSize: 15, lineHeight: 22, fontWeight: '600', color: '#1F1B16', textAlign: 'right', maxWidth: '55%' },
  infoValueMono: { fontWeight: '500', letterSpacing: 0.3 },
  infoDivider: { height: 1, backgroundColor: '#E7E2D9', opacity: 0.55, marginLeft: 52 },

  empty: { fontSize: 15, color: '#A89E91', textAlign: 'center', paddingVertical: 16 },

  // History
  historyLoading: { paddingVertical: 24, alignItems: 'center' },
  historyEmpty: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    marginTop: 12,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  historyList: { gap: 12, marginTop: 12 },
  saleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  saleTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  saleIdRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  saleId: { fontSize: 13, lineHeight: 18, fontWeight: '500', color: '#6B6258', letterSpacing: 0.3 },
  saleDot: { fontSize: 12, color: '#A89E91' },
  saleDate: { fontSize: 12, lineHeight: 16, color: '#6B6258' },
  saleItems: { fontSize: 15, lineHeight: 22, fontWeight: '600', color: '#1F1B16' },
  saleDivider: { height: 1, backgroundColor: '#E7E2D9', opacity: 0.55 },
  saleBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  saleMeta: { fontSize: 12, lineHeight: 16, color: '#6B6258' },
  saleTotal: { fontSize: 15, lineHeight: 22, fontWeight: '600', color: '#1F1B16' },

  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusText: { fontSize: 12, lineHeight: 16, fontWeight: '500' },

  // Deactivate
  deactivateBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 24 },
  deactivateBtnText: { fontSize: 14, color: '#B3261E', fontWeight: '500' },
  inactiveCard: { backgroundColor: '#FFF8E1', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 24 },
  inactiveText: { fontSize: 14, color: '#C77700' },

  // Sticky bottom
  stickyBottom: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E7E2D9',
    paddingHorizontal: 24,
    paddingTop: 14,
    paddingBottom: 18,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#E89B12',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },

  errorText: { fontSize: 15, color: '#6B6258' },
  backLink: { marginTop: 12 },
  backLinkText: { fontSize: 15, color: '#C47C0A', fontWeight: '600' },
});
