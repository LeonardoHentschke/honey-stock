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
import { Plus, Search, Package } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProductListViewModel } from '../viewmodels/useProductListViewModel';
import { ProductFormSheet } from './components/ProductFormSheet';
import { ProductTile } from '@/shared/components/ProductTile';
import { formatCurrency } from '@/shared/lib/format';
import type { Product } from '../models/productService';

export function ProductListScreen() {
  const { top } = useSafeAreaInsets();
  const vm = useProductListViewModel();

  return (
    <View style={styles.root}>
      {/* ── Header ───────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: top + 12 }]}>
        <Text style={styles.headerTitle}>Produtos</Text>
        <Pressable
          style={styles.addBtn}
          onPress={() => vm.setShowCreateSheet(true)}
          accessibilityLabel="Novo produto"
        >
          <Plus size={20} color="#9B5F0B" />
        </Pressable>
      </View>

      {/* ── Search + filtros ──────────────────────────────── */}
      <View style={styles.searchArea}>
        <View style={styles.searchBar}>
          <Search size={18} color="#A89E91" />
          <TextInput
            style={styles.searchInput}
            value={vm.search}
            onChangeText={vm.setSearch}
            placeholder="Buscar produto..."
            placeholderTextColor="#A89E91"
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* ── Lista ─────────────────────────────────────────── */}
      {vm.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#C47C0A" size="large" />
        </View>
      ) : (
        <FlatList
          data={vm.products}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ProductRow
              product={item}
              onPress={() => vm.navigateToDetail(item.id)}
            />
          )}
          contentContainerStyle={vm.isEmpty ? styles.flex : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.refresh}
              tintColor="#C47C0A"
              colors={['#C47C0A']}
            />
          }
          ListEmptyComponent={
            <EmptyState
              hasFilter={!!vm.search}
              onAdd={() => vm.setShowCreateSheet(true)}
            />
          }
        />
      )}

      {/* ── Form sheet ────────────────────────────────────── */}
      <ProductFormSheet
        visible={vm.showCreateSheet}
        mode="create"
        onSuccess={() => vm.refresh()}
        onClose={() => vm.setShowCreateSheet(false)}
      />

    </View>
  );
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

function ProductRow({
  product,
  onPress,
}: {
  product: Product;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={styles.card}
      android_ripple={{ color: '#FDFAF4' }}
      onPress={onPress}
    >
      <ProductTile name={product.name} size={56} />

      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.variantPrice}>{formatCurrency(product.sale_price)}</Text>
        </View>
      </View>

    </Pressable>
  );
}

function EmptyState({
  hasFilter,
  onAdd,
}: {
  hasFilter: boolean;
  onAdd: () => void;
}) {
  return (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Package size={36} color="#F5C859" />
      </View>
      <Text style={styles.emptyTitle}>
        {hasFilter ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
      </Text>
      <Text style={styles.emptyBody}>
        {hasFilter
          ? 'Tente ajustar os filtros ou a busca.'
          : 'Adicione seus primeiros produtos para começar a registrar vendas.'}
      </Text>
      {!hasFilter && (
        <Pressable style={styles.emptyBtn} onPress={onAdd}>
          <Plus size={18} color="#9B5F0B" />
          <Text style={styles.emptyBtnText}>Adicionar produto</Text>
        </Pressable>
      )}
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
  headerTitle: { fontSize: 24, lineHeight: 32, fontWeight: '700', color: '#1F1B16' },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FCEFC8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  searchArea: { paddingHorizontal: 24, paddingBottom: 12, gap: 10 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E7E2D9',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1F1B16' },

  listContent: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E7E2D9',
  },
  cardPressed: { backgroundColor: '#FDFAF4' },

  cardBody: { flex: 1, minWidth: 0, gap: 2 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  productName: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#1F1B16',
  },
  variantName: { fontSize: 12, lineHeight: 16, color: '#6B6258' },
  noVariantText: { fontSize: 12, lineHeight: 16, color: '#A89E91', fontStyle: 'italic', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  variantPrice: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: '#1F1B16' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FCEFC8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    color: '#1F1B16',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B6258',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 260,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FCEFC8',
  },
  emptyBtnText: { fontSize: 15, fontWeight: '600', color: '#9B5F0B' },
});
