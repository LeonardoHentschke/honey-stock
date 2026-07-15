import React from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Plus, Search, UserRound, Phone } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useContactsViewModel, type ContactsTab } from '../viewmodels/useContactsViewModel';
import { CustomerFormSheet } from './components/CustomerFormSheet';
import type { Customer } from '../models/customerService';
import type { ContactsStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<ContactsStackParamList>;

/** Item do grid: cliente real ou espaçador invisível (mantém card ímpar com metade da largura). */

const TABS: { key: ContactsTab; label: string }[] = [
  { key: 'final', label: 'Final' },
  { key: 'reseller', label: 'Revenda' },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function ContactsScreen() {
  const { top } = useSafeAreaInsets();
  const vm = useContactsViewModel();
  const navigation = useNavigation<Nav>();

  return (
    <View style={styles.root}>
      {/* ── Header ──────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: top + 12 }]}>
        <Text style={styles.title}>Clientes</Text>
        <Pressable
          onPress={vm.openCreateCustomer}
          style={styles.addBtn}
          accessibilityLabel="Novo cliente"
        >
          <Plus size={20} color="#9B5F0B" />
        </Pressable>
      </View>

      {/* ── Tabs (underline) ────────────────────────────────── */}
      <View style={styles.tabsRow}>
        {TABS.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.tab, vm.activeTab === key && styles.tabActive]}
            onPress={() => vm.setActiveTab(key)}
          >
            <Text style={[styles.tabText, vm.activeTab === key && styles.tabTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* ── Busca ───────────────────────────────────────────── */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBar}>
          <Search size={18} color="#A89E91" />
          <TextInput
            style={styles.searchInput}
            value={vm.search}
            onChangeText={vm.setSearch}
            placeholder={`Buscar cliente ${vm.activeTab === 'reseller' ? 'revenda' : 'final'}...`}
            placeholderTextColor="#A89E91"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {vm.isLoadingCustomers ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#C47C0A" size="large" />
        </View>
      ) : vm.customers.length === 0 ? (
        <View style={styles.flex}>
          <EmptyState
            title={
              vm.search
                ? 'Nenhum cliente encontrado'
                : `Nenhum cliente ${vm.activeTab === 'final' ? 'final' : 'revendedor'}`
            }
            body={vm.search ? 'Tente outro nome.' : 'Adicione clientes pelo botão +.'}
          />
        </View>
      ) : (
        <FlatList<Customer>
          data={vm.customers}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.columnWrapper}
          contentContainerStyle={styles.gridContent}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.refresh}
              tintColor="#C47C0A"
              colors={['#C47C0A']}
            />
          }
          renderItem={({ item }) => (
            <CustomerCard
              customer={item}
              onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
            />
          )}
        />
      )}

      <CustomerFormSheet
        visible={vm.showCustomerSheet}
        editingCustomer={vm.editingCustomer}
        isSaving={vm.isSavingCustomer}
        error={vm.customerError}
        onSave={vm.saveCustomer}
        onClose={vm.closeCustomerSheet}
      />
    </View>
  );
}

// ─── CustomerCard (grid tile) ─────────────────────────────────────────────────

function CustomerCard({
  customer,
  onPress,
}: {
  customer: Customer;
  onPress: () => void;
}) {
  const isReseller = customer.type === 'reseller';

  return (
    <Pressable
      style={styles.card}
      android_ripple={{ color: '#FDFAF4' }}
      onPress={onPress}
    >
      <View style={[styles.avatar, isReseller ? styles.avatarReseller : styles.avatarFinal]}>
        <Text style={[styles.avatarText, isReseller ? styles.avatarTextReseller : styles.avatarTextFinal]}>
          {getInitials(customer.name)}
        </Text>
      </View>

      <Text style={styles.cardName} numberOfLines={2}>{customer.name}</Text>

      <Text style={styles.cardSubtitle} numberOfLines={1}>
        {isReseller ? (customer.business_name ?? 'Revenda') : 'Cliente final'}
      </Text>

      <View style={styles.divider} />

      {isReseller ? (
        <View style={styles.discountRow}>
          <Text style={styles.discountLabel}>Desconto</Text>
          <Text style={styles.discountValue}>
            {customer.reseller_discount_percent != null
              ? `${customer.reseller_discount_percent}%`
              : '—'}
          </Text>
        </View>
      ) : (
        <View style={styles.phoneRow}>
          <Phone size={12} color="#A89E91" />
          <Text style={styles.phoneText} numberOfLines={1}>
            {customer.phone ?? '—'}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <UserRound size={36} color="#F5C859" />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
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
  title: { fontSize: 24, lineHeight: 32, fontWeight: '700', color: '#1F1B16' },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FCEFC8', alignItems: 'center', justifyContent: 'center',
  },

  // Underline tabs
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E2D9',
  },
  tab: {
    paddingVertical: 14,
    paddingHorizontal: 4,
    marginRight: 24,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  tabActive: { borderBottomColor: '#C47C0A' },
  tabText: { fontSize: 15, fontWeight: '500', color: '#6B6258' },
  tabTextActive: { color: '#C47C0A', fontWeight: '600' },

  // Search
  searchWrap: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 4 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 10, height: 44,
    paddingHorizontal: 12, gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1F1B16' },

  // Grid
  gridContent: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 32 },
  columnWrapper: { justifyContent: 'space-between', marginBottom: 12 },

  // Card tile
  card: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  cardPressed: { backgroundColor: '#FDFAF4' },

  // Avatar
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  avatarFinal: { backgroundColor: '#FCEFC8' },
  avatarReseller: { backgroundColor: '#E3D0AE' },
  avatarText: { fontSize: 20, fontWeight: '600' },
  avatarTextFinal: { color: '#9B5F0B' },
  avatarTextReseller: { color: '#7A5A2A' },

  cardName: { fontSize: 15, lineHeight: 21, fontWeight: '600', color: '#1F1B16', marginBottom: 2 },
  cardSubtitle: { fontSize: 12, lineHeight: 16, color: '#6B6258', marginBottom: 4 },

  divider: { height: 1, backgroundColor: '#E7E2D9', opacity: 0.55, marginTop: 4, marginBottom: 8 },

  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  phoneText: { fontSize: 12, lineHeight: 16, color: '#6B6258', flex: 1 },

  discountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  discountLabel: { fontSize: 12, lineHeight: 16, color: '#6B6258' },
  discountValue: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: '#9B5F0B' },

  // Empty state
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FCEFC8', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#1F1B16', textAlign: 'center' },
  emptyBody: { fontSize: 15, color: '#6B6258', textAlign: 'center', marginTop: 8, maxWidth: 260 },
});
