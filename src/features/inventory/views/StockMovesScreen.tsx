import React from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, ArrowDownToLine, ArrowUpFromLine, Settings2, ShoppingCart } from 'lucide-react-native';
import { useStockMovesViewModel, type MoveTypeFilter } from '../viewmodels/useStockMovesViewModel';
import type { MovementWithVariant } from '../models/inventoryService';

const FILTERS: { key: MoveTypeFilter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'in', label: 'Entrada' },
  { key: 'out', label: 'Saída' },
  { key: 'adjust', label: 'Ajuste' },
  { key: 'sale', label: 'Venda' },
];

const TYPE_CONFIG = {
  in:     { label: 'Entrada', icon: ArrowDownToLine, color: '#2E7D32', bg: '#E4F2E4', sign: '+' },
  out:    { label: 'Saída',   icon: ArrowUpFromLine, color: '#B3261E', bg: '#F7DCDA', sign: '−' },
  adjust: { label: 'Ajuste',  icon: Settings2,       color: '#1565C0', bg: '#DCE9F7', sign: '±' },
  sale:   { label: 'Venda',   icon: ShoppingCart,    color: '#C47C0A', bg: '#FCEFC8', sign: '−' },
} as const;

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function MoveRow({ item }: { item: MovementWithVariant }) {
  const cfg = TYPE_CONFIG[item.type as keyof typeof TYPE_CONFIG] ?? TYPE_CONFIG.adjust;
  const Icon = cfg.icon;
  const productName = (item.variant as any)?.product?.name ?? '—';
  const sku = (item.variant as any)?.sku ?? '';

  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: cfg.bg }]}>
        <Icon size={18} color={cfg.color} />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowProduct} numberOfLines={1}>{productName}</Text>
        {sku ? <Text style={styles.rowSku} numberOfLines={1}>{sku}</Text> : null}
      </View>
      <View style={styles.rowRight}>
        <Text style={[styles.rowQty, { color: cfg.color }]}>
          {cfg.sign}{item.quantity}
        </Text>
        <Text style={styles.rowTime}>{formatTime(item.created_at)}</Text>
      </View>
    </View>
  );
}

export function StockMovesScreen() {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation();
  const vm = useStockMovesViewModel();

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.back}>
          <ArrowLeft size={22} color="#1F1B16" />
        </Pressable>
        <Text style={styles.title}>Movimentações</Text>
      </View>

      {/* Filtros */}
      <View style={styles.filters}>
        {FILTERS.map((f) => (
          <Pressable
            key={f.key}
            style={[styles.chip, vm.typeFilter === f.key && styles.chipActive]}
            onPress={() => vm.setTypeFilter(f.key)}
          >
            <Text style={[styles.chipText, vm.typeFilter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {vm.isLoading ? (
        <ActivityIndicator color="#E89B12" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={vm.movements}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <MoveRow item={item} />}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.refresh}
              colors={['#E89B12']}
              tintColor="#E89B12"
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhuma movimentação encontrada.</Text>
          }
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1EA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  back: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 20,
  },
  title: {
    fontSize: 20, lineHeight: 28, fontWeight: '700', color: '#1F1B16',
  },

  filters: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1, borderColor: '#E7E2D9',
  },
  chipActive: { backgroundColor: '#FCEFC8', borderColor: '#F9DE91' },
  chipText: { fontSize: 13, fontWeight: '500', color: '#6B6258' },
  chipTextActive: { color: '#9B5F0B', fontWeight: '600' },

  list: { paddingHorizontal: 16, paddingBottom: 32 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
  },
  rowIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  rowText: { flex: 1, minWidth: 0 },
  rowProduct: { fontSize: 15, fontWeight: '600', color: '#1F1B16', lineHeight: 22 },
  rowSku: { fontSize: 12, color: '#A89E91', lineHeight: 16, marginTop: 1 },
  rowRight: { alignItems: 'flex-end', marginLeft: 8 },
  rowQty: { fontSize: 15, fontWeight: '700', lineHeight: 22 },
  rowTime: { fontSize: 11, color: '#A89E91', lineHeight: 16, marginTop: 1 },

  sep: { height: 8 },
  empty: { textAlign: 'center', color: '#A89E91', marginTop: 48, fontSize: 14 },
});
