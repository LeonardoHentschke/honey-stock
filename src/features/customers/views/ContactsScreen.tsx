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
import { Plus, Search, UserRound, Truck, Pencil, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useContactsViewModel, type ContactsTab } from '../viewmodels/useContactsViewModel';
import { CustomerFormSheet } from './components/CustomerFormSheet';
import { SupplierFormSheet } from '@/features/suppliers/views/components/SupplierFormSheet';
import type { Customer } from '../models/customerService';
import type { Supplier } from '@/features/suppliers/models/supplierService';
import type { ContactsStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<ContactsStackParamList>;

const TABS: { key: ContactsTab; label: string }[] = [
  { key: 'final', label: 'Finais' },
  { key: 'reseller', label: 'Revendas' },
  { key: 'suppliers', label: 'Fornecedores' },
];

export function ContactsScreen() {
  const { top } = useSafeAreaInsets();
  const vm = useContactsViewModel();
  const navigation = useNavigation<Nav>();

  const isCustomerTab = vm.activeTab !== 'suppliers';
  const isLoading = isCustomerTab ? vm.isLoadingCustomers : vm.isLoadingSuppliers;

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Text style={styles.title}>Contatos</Text>
        <Pressable
          onPress={isCustomerTab ? vm.openCreateCustomer : vm.openCreateSupplier}
          style={styles.addBtn}
          accessibilityLabel="Novo contato"
        >
          <Plus size={20} color="#9B5F0B" />
        </Pressable>
      </View>

      {/* Abas */}
      <View style={styles.tabs}>
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

      {/* Busca */}
      <View style={styles.searchPadding}>
        <View style={styles.searchBar}>
          <Search size={18} color="#A89E91" />
          <TextInput
            style={styles.searchInput}
            value={vm.search}
            onChangeText={vm.setSearch}
            placeholder="Buscar por nome ou telefone..."
            placeholderTextColor="#A89E91"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#C47C0A" size="large" />
        </View>
      ) : isCustomerTab ? (
        <FlatList
          data={vm.customers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={vm.customers.length === 0 ? styles.flex : styles.listContent}
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
              onEdit={() => vm.openEditCustomer(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<UserRound size={36} color="#F5C859" />}
              title={vm.search ? 'Nenhum cliente encontrado' : `Nenhum cliente ${vm.activeTab === 'final' ? 'final' : 'revendedor'}`}
              body={vm.search ? 'Tente outro nome.' : 'Adicione clientes pelo botão +.'}
            />
          }
        />
      ) : (
        <FlatList
          data={vm.suppliers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={vm.suppliers.length === 0 ? styles.flex : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.refresh}
              tintColor="#C47C0A"
              colors={['#C47C0A']}
            />
          }
          renderItem={({ item }) => (
            <SupplierCard
              supplier={item}
              onPress={() => navigation.navigate('SupplierDetail', { supplierId: item.id })}
              onEdit={() => vm.openEditSupplier(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<Truck size={36} color="#F5C859" />}
              title={vm.search ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
              body={vm.search ? 'Tente outro nome.' : 'Adicione fornecedores pelo botão +.'}
            />
          }
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

      <SupplierFormSheet
        visible={vm.showSupplierSheet}
        editingSupplier={vm.editingSupplier}
        isSaving={vm.isSavingSupplier}
        error={vm.supplierError}
        onSave={vm.saveSupplier}
        onClose={vm.closeSupplierSheet}
      />
    </View>
  );
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function CustomerCard({ customer, onPress, onEdit }: { customer: Customer; onPress: () => void; onEdit: () => void }) {
  const isReseller = customer.type === 'reseller';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardName}>{customer.name}</Text>
            <View style={[styles.badge, isReseller ? styles.badgeReseller : styles.badgeFinal]}>
              <Text style={[styles.badgeText, isReseller ? styles.badgeTextReseller : styles.badgeTextFinal]}>
                {isReseller ? 'Revenda' : 'Final'}
              </Text>
            </View>
          </View>
          {isReseller && customer.business_name ? (
            <Text style={styles.cardSub}>{customer.business_name}</Text>
          ) : null}
          {customer.phone ? (
            <Text style={styles.cardDetail}>{customer.phone}</Text>
          ) : null}
          {isReseller && customer.reseller_discount_percent != null ? (
            <Text style={styles.cardDiscount}>{customer.reseller_discount_percent}% desc. padrão</Text>
          ) : null}
        </View>
        <View style={styles.cardActions}>
          <Pressable onPress={onEdit} hitSlop={8} style={styles.editBtn}>
            <Pencil size={15} color="#A89E91" />
          </Pressable>
          <ChevronRight size={16} color="#A89E91" />
        </View>
      </View>
    </Pressable>
  );
}

function SupplierCard({ supplier, onPress, onEdit }: { supplier: Supplier; onPress: () => void; onEdit: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{supplier.name}</Text>
          {supplier.document ? (
            <Text style={styles.cardDetail}>{supplier.document}</Text>
          ) : null}
          {supplier.phone ? (
            <Text style={styles.cardDetail}>{supplier.phone}</Text>
          ) : null}
        </View>
        <View style={styles.cardActions}>
          <Pressable onPress={onEdit} hitSlop={8} style={styles.editBtn}>
            <Pencil size={15} color="#A89E91" />
          </Pressable>
          <ChevronRight size={16} color="#A89E91" />
        </View>
      </View>
    </Pressable>
  );
}

function EmptyState({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>{icon}</View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────
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
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FCEFC8', alignItems: 'center', justifyContent: 'center',
  },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 8,
  },
  tab: {
    flex: 1, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#FFFFFF', alignItems: 'center',
    borderWidth: 1, borderColor: '#E7E2D9',
  },
  tabActive: { backgroundColor: '#FCEFC8', borderColor: '#C47C0A' },
  tabText: { fontSize: 13, fontWeight: '500', color: '#6B6258' },
  tabTextActive: { color: '#9B5F0B', fontWeight: '600' },

  searchPadding: { paddingHorizontal: 24, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 10, height: 44,
    paddingHorizontal: 12, gap: 8,
    borderWidth: 1, borderColor: '#E7E2D9',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1F1B16' },

  listContent: { paddingHorizontal: 24, paddingBottom: 32, gap: 10 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 16,
    shadowColor: '#1F1B16', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardPressed: { backgroundColor: '#FEF9EC' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  cardInfo: { flex: 1, gap: 3 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardName: { fontSize: 16, fontWeight: '700', color: '#1F1B16' },
  cardSub: { fontSize: 13, color: '#6B6258' },
  cardDetail: { fontSize: 13, color: '#A89E91' },
  cardDiscount: { fontSize: 12, color: '#9B5F0B', fontWeight: '600' },
  editBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#F5F1EA', alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },

  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  badgeFinal: { backgroundColor: '#EFF6FF' },
  badgeReseller: { backgroundColor: '#FCEFC8' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextFinal: { color: '#1D4ED8' },
  badgeTextReseller: { color: '#9B5F0B' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FCEFC8', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#1F1B16', textAlign: 'center' },
  emptyBody: { fontSize: 15, color: '#6B6258', textAlign: 'center', marginTop: 8, maxWidth: 260 },
});
