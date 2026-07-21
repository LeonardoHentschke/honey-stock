import React from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, ShoppingCart, ChevronRight } from 'lucide-react-native';
import { useStockMovesViewModel } from '../viewmodels/useStockMovesViewModel';
import type { MovementWithProduct } from '../models/inventoryService';
import type { MoreStackParamList } from '@/navigation/types';

const SALE_CONFIG = { label: 'Venda', icon: ShoppingCart, color: '#C47C0A', bg: '#FCEFC8', sign: '−' } as const;

function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - d.getTime()) / 1000;
  if (diff < 3600) return `${Math.floor(diff / 60)}min atrás`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atrás`;
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function MoveRow({ item, onPress }: { item: MovementWithProduct; onPress?: () => void }) {
  const Icon = SALE_CONFIG.icon;
  const productName = item.product?.name ?? '—';

  return (
    <Pressable
      style={({ pressed }) => (pressed && onPress ? styles.rowPressed : undefined)}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.row}>
        <View style={[styles.rowIcon, { backgroundColor: SALE_CONFIG.bg }]}>
          <Icon size={18} color={SALE_CONFIG.color} />
        </View>
        <View style={styles.rowText}>
          <Text style={styles.rowProduct} numberOfLines={1}>{productName}</Text>
        </View>
        <View style={styles.rowRight}>
          <Text style={[styles.rowQty, { color: SALE_CONFIG.color }]}>
            {SALE_CONFIG.sign}{item.quantity}
          </Text>
          <Text style={styles.rowTime}>{formatTime(item.created_at)}</Text>
        </View>
        {onPress ? <ChevronRight size={18} color="#A89E91" style={styles.rowChevron} /> : null}
      </View>
    </Pressable>
  );
}

export function StockMovesScreen() {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const vm = useStockMovesViewModel();

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.back}>
          <ArrowLeft size={22} color="#1F1B16" />
        </Pressable>
        <Text style={styles.title}>Movimentações</Text>
      </View>

      {vm.isLoading ? (
        <ActivityIndicator color="#E89B12" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={vm.movements}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MoveRow
              item={item}
              onPress={
                item.type === 'sale' && item.reference_type === 'sale' && item.reference_id
                  ? () => navigation.navigate('SaleDetail', { saleId: item.reference_id as string })
                  : undefined
              }
            />
          )}
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
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 4,
  },
  back: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 20,
    marginLeft: -8,
  },
  title: {
    fontSize: 24, lineHeight: 32, fontWeight: '700', color: '#1F1B16',
  },

  list: { paddingHorizontal: 16, paddingBottom: 32 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
  },
  rowPressed: { opacity: 0.85 },
  rowChevron: { marginLeft: 6 },
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
