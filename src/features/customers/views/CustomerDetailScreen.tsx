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
} from 'react-native';
import { ArrowLeft, Pencil, Phone, Mail, FileText, MapPin, StickyNote, Tag, Percent } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { useCustomerDetailViewModel } from '../viewmodels/useCustomerDetailViewModel';
import { CustomerFormSheet } from './components/CustomerFormSheet';
import { humanizeError } from '@/shared/lib/errors';
import type { ContactsStackParamList } from '@/navigation/types';

type Route = RouteProp<ContactsStackParamList, 'CustomerDetail'>;

export function CustomerDetailScreen() {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { customerId } = route.params;
  const vm = useCustomerDetailViewModel(customerId);

  const isReseller = vm.customer?.type === 'reseller';

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

  const { customer } = vm;

  return (
    <View style={styles.root}>
      {/* ── Header ───────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.iconBtn}>
          <ArrowLeft size={22} color="#1F1B16" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>{customer.name}</Text>
          <View style={[styles.badge, isReseller ? styles.badgeReseller : styles.badgeFinal]}>
            <Text style={[styles.badgeText, isReseller ? styles.badgeTextReseller : styles.badgeTextFinal]}>
              {isReseller ? 'Revenda' : 'Final'}
            </Text>
          </View>
        </View>
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
        {/* ── Contato ──────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contato</Text>
          {customer.phone && <InfoRow Icon={Phone} label="Telefone" value={customer.phone} />}
          {customer.email && <InfoRow Icon={Mail} label="E-mail" value={customer.email} />}
          {customer.document && <InfoRow Icon={FileText} label="Documento" value={customer.document} />}
          {customer.address && <InfoRow Icon={MapPin} label="Endereço" value={customer.address} />}
          {customer.notes && <InfoRow Icon={StickyNote} label="Notas" value={customer.notes} />}
          {!customer.phone && !customer.email && !customer.document && !customer.address && !customer.notes && (
            <Text style={styles.empty}>Nenhum dado de contato cadastrado.</Text>
          )}
        </View>

        {/* ── Revenda (se aplicável) ─────────────────────── */}
        {isReseller && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Revenda</Text>
            {customer.business_name && (
              <InfoRow Icon={Tag} label="Razão social" value={customer.business_name} />
            )}
            {customer.reseller_discount_percent != null && (
              <InfoRow
                Icon={Percent}
                label="Desconto padrão"
                value={`${customer.reseller_discount_percent}%`}
                accent
              />
            )}
            {!customer.business_name && customer.reseller_discount_percent == null && (
              <Text style={styles.empty}>Nenhum dado de revenda cadastrado.</Text>
            )}
          </View>
        )}

        {/* ── Desativar ─────────────────────────────────── */}
        {customer.is_active && (
          <Pressable style={styles.deactivateBtn} onPress={confirmDeactivate}>
            <Text style={styles.deactivateBtnText}>
              {vm.isDeactivating ? 'Desativando...' : 'Desativar cliente'}
            </Text>
          </Pressable>
        )}
        {!customer.is_active && (
          <View style={styles.inactiveCard}>
            <Text style={styles.inactiveText}>Este cliente está desativado.</Text>
          </View>
        )}
      </ScrollView>

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

function InfoRow({
  Icon,
  label,
  value,
  accent,
}: {
  Icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Icon size={15} color="#A89E91" />
      <View style={styles.infoTextBlock}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, accent && styles.infoValueAccent]}>{value}</Text>
      </View>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  editBtn: { backgroundColor: '#FCEFC8' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  headerTitle: { fontSize: 18, lineHeight: 26, fontWeight: '600', color: '#1F1B16', flexShrink: 1 },

  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeFinal: { backgroundColor: '#EFF6FF' },
  badgeReseller: { backgroundColor: '#FCEFC8' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextFinal: { color: '#1D4ED8' },
  badgeTextReseller: { color: '#9B5F0B' },

  content: { padding: 24, gap: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#A89E91', textTransform: 'uppercase', letterSpacing: 0.5 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoTextBlock: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#A89E91', marginBottom: 1 },
  infoValue: { fontSize: 14, color: '#1F1B16' },
  infoValueAccent: { color: '#9B5F0B', fontWeight: '600' },

  empty: { fontSize: 14, color: '#A89E91', textAlign: 'center', paddingVertical: 4 },

  deactivateBtn: {
    alignItems: 'center', paddingVertical: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#E7E2D9', backgroundColor: '#FFFFFF',
  },
  deactivateBtnText: { fontSize: 14, color: '#B3261E' },

  inactiveCard: {
    backgroundColor: '#FFF8E1', borderRadius: 10, padding: 14, alignItems: 'center',
  },
  inactiveText: { fontSize: 14, color: '#C77700' },

  errorText: { fontSize: 15, color: '#6B6258' },
  backLink: { marginTop: 12 },
  backLinkText: { fontSize: 15, color: '#C47C0A', fontWeight: '600' },
});
