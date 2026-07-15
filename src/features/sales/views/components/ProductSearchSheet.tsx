import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Search, Package } from 'lucide-react-native';
import { ProductTile } from '@/shared/components/ProductTile';
import { formatCurrency, formatQuantity } from '@/shared/lib/format';
import type { Product } from '@/features/products/models/productService';

interface Props {
  visible: boolean;
  products: Product[];
  isLoading: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (product: Product) => void;
  onClose: () => void;
}

export function ProductSearchSheet({
  visible,
  products,
  isLoading,
  query,
  onQueryChange,
  onSelect,
  onClose,
}: Props) {
  const { top } = useSafeAreaInsets();
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: top + 16 }]}>
          <Text style={styles.title}>Adicionar produto</Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <X size={20} color="#6B6258" />
          </Pressable>
        </View>

        {/* Busca */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Search size={18} color="#A89E91" />
            <TextInput
              style={styles.searchInput}
              value={query}
              onChangeText={onQueryChange}
              placeholder="Buscar por nome..."
              placeholderTextColor="#A89E91"
              autoFocus
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#C47C0A" size="large" />
          </View>
        ) : (
          <FlatList
            data={products}
            keyExtractor={(item) => item.id}
            contentContainerStyle={products.length === 0 ? styles.flex : styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <ProductRow
                product={item}
                onPress={() => {
                  onSelect(item);
                  onClose();
                }}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Package size={36} color="#F5C859" />
                <Text style={styles.emptyTitle}>
                  {query ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                </Text>
                <Text style={styles.emptyBody}>
                  {query ? 'Tente outro termo.' : 'Cadastre produtos primeiro.'}
                </Text>
              </View>
            }
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ProductRow({ product, onPress }: { product: Product; onPress: () => void }) {
  const outOfStock = product.stock_quantity <= 0;
  const isLow = product.stock_quantity <= product.min_stock && product.min_stock > 0;
  return (
    <Pressable
      style={[styles.row, outOfStock ? styles.rowDim : null]}
      android_ripple={{ color: '#FDFAF4' }}
      onPress={onPress}
      disabled={outOfStock}
    >
      <ProductTile name={product.name} size={56} />

      <View style={styles.rowBody}>
        <View style={styles.rowTitleRow}>
          <Text style={styles.rowName} numberOfLines={1}>
            {product.name}
          </Text>
          {isLow && !outOfStock && (
            <View style={styles.lowStockBadge}>
              <Text style={styles.lowStockText}>baixo</Text>
            </View>
          )}
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.rowPrice}>{formatCurrency(product.sale_price)}</Text>
          <Text style={styles.metaDot}>·</Text>
          <Text style={[styles.rowStock, (isLow || outOfStock) && styles.rowStockLow]}>
            {outOfStock ? 'Sem estoque' : formatQuantity(product.stock_quantity, 'un')}
          </Text>
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
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1F1B16' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E7E2D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: { paddingHorizontal: 24, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E7E2D9',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1F1B16' },
  list: { paddingHorizontal: 24, paddingBottom: 32, gap: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E7E2D9',
  },
  rowDim: { opacity: 0.5 },
  rowBody: { flex: 1, minWidth: 0, gap: 2 },
  rowTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowName: {
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
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 },
  rowPrice: { fontSize: 15, lineHeight: 20, fontWeight: '600', color: '#1F1B16' },
  metaDot: { fontSize: 12, color: '#A89E91' },
  rowStock: { fontSize: 12, color: '#6B6258' },
  rowStockLow: { color: '#C77700', fontWeight: '600' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#1F1B16', textAlign: 'center' },
  emptyBody: { fontSize: 15, color: '#6B6258', textAlign: 'center' },
});
