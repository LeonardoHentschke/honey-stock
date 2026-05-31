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
import { ArrowLeft, Plus, Search, Truck, Pencil, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useSuppliersViewModel } from '../viewmodels/useSuppliersViewModel';
import { SupplierFormSheet } from './components/SupplierFormSheet';
import type { Supplier } from '../models/supplierService';
import type { MoreStackParamList } from '@/navigation/types';

type Nav = NativeStackNavigationProp<MoreStackParamList>;

export function SuppliersScreen() {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const vm = useSuppliersViewModel();

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <ArrowLeft size={22} color="#1F1B16" />
        </Pressable>
        <Text style={styles.title}>Fornecedores</Text>
        <Pressable
          onPress={vm.openCreate}
          style={styles.addBtn}
          accessibilityLabel="Novo fornecedor"
        >
          <Plus size={20} color="#9B5F0B" />
        </Pressable>
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

      {vm.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#C47C0A" size="large" />
        </View>
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
              onEdit={() => vm.openEdit(item)}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title={vm.search ? 'Nenhum fornecedor encontrado' : 'Nenhum fornecedor cadastrado'}
              body={vm.search ? 'Tente outro nome.' : 'Adicione fornecedores pelo botão +.'}
            />
          }
        />
      )}

      <SupplierFormSheet
        visible={vm.showSheet}
        editingSupplier={vm.editingSupplier}
        isSaving={vm.isSaving}
        error={vm.error}
        onSave={vm.save}
        onClose={vm.closeSheet}
      />
    </View>
  );
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

function SupplierCard({
  supplier,
  onPress,
  onEdit,
}: {
  supplier: Supplier;
  onPress: () => void;
  onEdit: () => void;
}) {
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

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Truck size={36} color="#F5C859" />
      </View>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: '#1F1B16' },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FCEFC8', alignItems: 'center', justifyContent: 'center',
  },

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
  cardInfo: { flex: 1, gap: 3 },
  cardName: { fontSize: 16, fontWeight: '700', color: '#1F1B16' },
  cardDetail: { fontSize: 13, color: '#A89E91' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  editBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#F5F1EA', alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FCEFC8', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#1F1B16', textAlign: 'center' },
  emptyBody: { fontSize: 15, color: '#6B6258', textAlign: 'center', marginTop: 8, maxWidth: 260 },
});
