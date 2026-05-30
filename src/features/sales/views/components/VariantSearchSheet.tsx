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
import { X, Search, Package } from 'lucide-react-native';
import { formatCurrency } from '@/shared/lib/format';
import type { ActiveVariant } from '@/features/products/models/variantService';

interface Props {
  visible: boolean;
  variants: ActiveVariant[];
  isLoading: boolean;
  query: string;
  onQueryChange: (q: string) => void;
  onSelect: (variant: ActiveVariant) => void;
  onClose: () => void;
}

export function VariantSearchSheet({
  visible,
  variants,
  isLoading,
  query,
  onQueryChange,
  onSelect,
  onClose,
}: Props) {
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
        <View style={styles.header}>
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
              placeholder="Buscar por nome, SKU ou embalagem..."
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
            data={variants}
            keyExtractor={(item) => item.id}
            contentContainerStyle={variants.length === 0 ? styles.flex : styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <VariantRow
                variant={item}
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

function VariantRow({ variant, onPress }: { variant: ActiveVariant; onPress: () => void }) {
  const outOfStock = variant.stock_quantity <= 0;
  return (
    <Pressable
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed, outOfStock && styles.rowDim]}
      onPress={onPress}
      disabled={outOfStock}
    >
      <View style={styles.rowInfo}>
        <Text style={styles.rowName} numberOfLines={1}>
          {variant.product_name}
          {variant.honey_type ? ` · ${variant.honey_type}` : ''}
        </Text>
        {variant.packaging ? (
          <Text style={styles.rowSub}>{variant.packaging}</Text>
        ) : null}
        <Text style={styles.rowSku}>{variant.sku}</Text>
      </View>
      <View style={styles.rowRight}>
        <Text style={styles.rowPrice}>{formatCurrency(variant.sale_price)}</Text>
        <Text style={[styles.rowStock, outOfStock && styles.rowStockOut]}>
          {outOfStock ? 'Sem estoque' : `${variant.stock_quantity} ${variant.unit}`}
        </Text>
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
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  rowPressed: { opacity: 0.7 },
  rowDim: { opacity: 0.5 },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { fontSize: 15, fontWeight: '600', color: '#1F1B16' },
  rowSub: { fontSize: 13, color: '#6B6258' },
  rowSku: { fontSize: 12, color: '#A89E91' },
  rowRight: { alignItems: 'flex-end', gap: 2, marginLeft: 12 },
  rowPrice: { fontSize: 16, fontWeight: '700', color: '#C47C0A' },
  rowStock: { fontSize: 12, color: '#6B6258' },
  rowStockOut: { color: '#B3261E' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#1F1B16', textAlign: 'center' },
  emptyBody: { fontSize: 15, color: '#6B6258', textAlign: 'center' },
});
