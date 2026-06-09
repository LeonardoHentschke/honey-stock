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
import { Plus, Search, Package, AlertTriangle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProductListViewModel } from '../viewmodels/useProductListViewModel';
import { ProductFormSheet } from './components/ProductFormSheet';
import { StockMovementSheet } from '@/features/inventory/views/components/StockMovementSheet';
import { ProductTile } from '@/shared/components/ProductTile';
import { formatCurrency, formatQuantity } from '@/shared/lib/format';
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
        <View style={styles.filterRow}>
          <FilterChip
            label="Todas"
            active={!vm.filterLowStock}
            onPress={() => vm.setFilterLowStock(false)}
          />
          <FilterChip
            label="Estoque baixo"
            active={vm.filterLowStock}
            onPress={() => vm.setFilterLowStock(true)}
            icon={<AlertTriangle size={13} color={vm.filterLowStock ? '#9B5F0B' : '#A89E91'} />}
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
              onAddStock={() => vm.openStockEntry(item)}
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
              hasFilter={!!vm.search || vm.filterLowStock}
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

      {/* ── Entrada de estoque (botão + da linha) ──────────── */}
      {vm.stockProduct && (
        <StockMovementSheet
          visible
          productId={vm.stockProduct.id}
          companyId={vm.companyId}
          productLabel={vm.stockProduct.name}
          currentStock={vm.stockProduct.stock_quantity}
          onSuccess={vm.refresh}
          onClose={vm.closeStockEntry}
        />
      )}
    </View>
  );
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

function FilterChip({
  label,
  active,
  onPress,
  icon,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
}) {
  return (
    <Pressable
      style={[styles.filterChip, active && styles.filterChipActive]}
      onPress={onPress}
    >
      {icon}
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function ProductRow({
  product,
  onPress,
  onAddStock,
}: {
  product: Product;
  onPress: () => void;
  onAddStock: () => void;
}) {
  const isLow = product.stock_quantity <= product.min_stock && product.min_stock > 0;

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
          {isLow && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>baixo</Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.variantPrice}>{formatCurrency(product.sale_price)}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={[styles.variantStock, isLow && styles.variantStockLow]}>
            {formatQuantity(product.stock_quantity, 'un')}
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.addStockBtn}
        onPress={onAddStock}
        accessibilityLabel={`Adicionar estoque de ${product.name}`}
        hitSlop={6}
      >
        <Plus size={20} color="#FFFFFF" />
      </Pressable>
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
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E2D9',
    backgroundColor: '#FFFFFF',
  },
  filterChipActive: { borderColor: '#C47C0A', backgroundColor: '#FCEFC8' },
  filterChipText: { fontSize: 13, color: '#6B6258' },
  filterChipTextActive: { color: '#9B5F0B', fontWeight: '600' },

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

  addStockBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E89B12',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E89B12',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },

  cardBody: { flex: 1, minWidth: 0, gap: 2 },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  productName: {
    flexShrink: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#1F1B16',
  },
  lowStockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FBEAD0',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 9999,
  },
  lowStockText: { fontSize: 11, color: '#C77700', fontWeight: '600' },

  variantName: { fontSize: 12, lineHeight: 16, color: '#6B6258' },
  noVariantText: { fontSize: 12, lineHeight: 16, color: '#A89E91', fontStyle: 'italic', marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  metaDot: { fontSize: 12, color: '#A89E91' },
  variantPrice: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: '#1F1B16' },
  variantStock: { fontSize: 12, color: '#6B6258' },
  variantStockLow: { color: '#C77700', fontWeight: '600' },

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
