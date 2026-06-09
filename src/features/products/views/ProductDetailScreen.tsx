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
import {
  ArrowLeft,
  Pencil,
  ArrowUpDown,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  SlidersHorizontal,
  ShoppingCart,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { useProductDetailViewModel } from '../viewmodels/useProductDetailViewModel';
import { ProductFormSheet } from './components/ProductFormSheet';
import { StockMovementSheet } from '@/features/inventory/views/components/StockMovementSheet';
import { formatCurrency, formatDateTime, formatQuantity } from '@/shared/lib/format';
import type { ProductsStackParamList } from '@/navigation/types';
import type { MovementWithDetails } from '@/features/inventory/models/inventoryService';

type Route = RouteProp<ProductsStackParamList, 'ProductDetail'>;

const MOVEMENT_CONFIG = {
  in:     { label: 'Entrada', color: '#2E7D32', bg: '#E8F5E9', Icon: TrendingUp },
  out:    { label: 'Saída',   color: '#B3261E', bg: '#FFEBEE', Icon: TrendingDown },
  adjust: { label: 'Ajuste',  color: '#1565C0', bg: '#E3F2FD', Icon: SlidersHorizontal },
  sale:   { label: 'Venda',   color: '#9B5F0B', bg: '#FCEFC8', Icon: ShoppingCart },
} as const;

export function ProductDetailScreen() {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { productId } = route.params;
  const vm = useProductDetailViewModel(productId);

  function confirmDeactivate() {
    Alert.alert(
      'Desativar produto',
      'Este produto será desativado e não aparecerá mais nas vendas. Esta ação pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desativar', style: 'destructive', onPress: vm.deactivateProduct },
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

  if (!vm.product) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Text style={styles.errorText}>Produto não encontrado.</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const { product, movements } = vm;
  const isLowStock = product.stock_quantity <= product.min_stock && product.min_stock > 0;

  return (
    <View style={styles.root}>
      {/* ── Header ───────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.iconBtn}>
          <ArrowLeft size={22} color="#1F1B16" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{product.name}</Text>
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
        {/* ── Preços ───────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Preços</Text>
          <View style={styles.priceRow}>
            <PriceBlock label="Venda" value={formatCurrency(product.sale_price)} />
            <PriceBlock label="Custo" value={formatCurrency(product.cost_price)} />
          </View>
        </View>

        {/* ── Descrição ────────────────────────────────────── */}
        {product.description ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Descrição</Text>
            <Text style={styles.descText}>{product.description}</Text>
          </View>
        ) : null}

        {/* ── Estoque ──────────────────────────────────────── */}
        <View style={[styles.card, isLowStock && styles.cardWarning]}>
          <View style={styles.stockHeader}>
            <Text style={styles.cardTitle}>Estoque atual</Text>
            {isLowStock && (
              <View style={styles.lowBadge}>
                <AlertTriangle size={11} color="#C77700" />
                <Text style={styles.lowBadgeText}>Baixo</Text>
              </View>
            )}
          </View>
          <Text style={[styles.stockQty, isLowStock && styles.stockQtyLow]}>
            {formatQuantity(product.stock_quantity, 'un')}
          </Text>
          {product.min_stock > 0 && (
            <Text style={styles.stockMin}>
              Mínimo: {formatQuantity(product.min_stock, 'un')}
            </Text>
          )}
          <Pressable style={styles.movBtn} onPress={vm.openMovementSheet}>
            <ArrowUpDown size={16} color="#9B5F0B" />
            <Text style={styles.movBtnText}>Movimentar estoque</Text>
          </Pressable>
        </View>

        {/* ── Histórico de movimentações ───────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Movimentações recentes</Text>
          {movements.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>Nenhuma movimentação registrada.</Text>
            </View>
          ) : (
            <View style={styles.movList}>
              {movements.map((m) => (
                <MovementRow key={m.id} movement={m} />
              ))}
            </View>
          )}
        </View>

        {/* ── Zona perigosa ─────────────────────────────────── */}
        {product.is_active && (
          <Pressable style={styles.deactivateBtn} onPress={confirmDeactivate}>
            <Text style={styles.deactivateBtnText}>
              {vm.isDeactivating ? 'Desativando...' : 'Desativar produto'}
            </Text>
          </Pressable>
        )}
      </ScrollView>

      {/* ── Modais ────────────────────────────────────────────── */}
      <ProductFormSheet
        visible={vm.showEditSheet}
        mode="edit"
        product={product}
        onSuccess={vm.onSheetSuccess}
        onClose={vm.closeEditSheet}
      />

      <StockMovementSheet
        visible={vm.showMovementSheet}
        productId={product.id}
        companyId={vm.companyId}
        productLabel={product.name}
        currentStock={product.stock_quantity}
        onSuccess={vm.onSheetSuccess}
        onClose={vm.closeMovementSheet}
      />
    </View>
  );
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

function PriceBlock({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.priceBlock}>
      <Text style={styles.priceLabel}>{label}</Text>
      <Text style={styles.priceValue}>{value}</Text>
    </View>
  );
}

function MovementRow({ movement }: { movement: MovementWithDetails }) {
  const type = movement.type as keyof typeof MOVEMENT_CONFIG;
  const cfg = MOVEMENT_CONFIG[type] ?? MOVEMENT_CONFIG.adjust;
  const { Icon } = cfg;
  const sign = type === 'in' ? '+' : type === 'adjust' ? '=' : '-';

  return (
    <View style={styles.movRow}>
      <View style={[styles.movIcon, { backgroundColor: cfg.bg }]}>
        <Icon size={14} color={cfg.color} />
      </View>
      <View style={styles.movInfo}>
        <Text style={styles.movLabel}>{cfg.label}</Text>
        {movement.notes ? (
          <Text style={styles.movNotes} numberOfLines={1}>{movement.notes}</Text>
        ) : movement.batch ? (
          <Text style={styles.movNotes}>Lote {movement.batch.code}</Text>
        ) : null}
      </View>
      <View style={styles.movRight}>
        <Text style={[styles.movQty, { color: cfg.color }]}>
          {sign}{formatQuantity(movement.quantity, 'un')}
        </Text>
        <Text style={styles.movDate}>{formatDateTime(new Date(movement.created_at))}</Text>
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBtn: { backgroundColor: '#FCEFC8' },
  headerTitle: { flex: 1, fontSize: 18, lineHeight: 26, fontWeight: '600', color: '#1F1B16' },

  content: { padding: 24, gap: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardWarning: { borderWidth: 1, borderColor: '#F5C859' },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#A89E91', textTransform: 'uppercase', letterSpacing: 0.5 },

  descText: { fontSize: 14, color: '#3B342B', lineHeight: 20 },

  priceRow: { flexDirection: 'row', gap: 20 },
  priceBlock: { gap: 3 },
  priceLabel: { fontSize: 11, color: '#A89E91' },
  priceValue: { fontSize: 17, fontWeight: '600', color: '#1F1B16' },

  stockHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stockQty: { fontSize: 32, lineHeight: 40, fontWeight: '700', color: '#1F1B16' },
  stockQtyLow: { color: '#C77700' },
  stockMin: { fontSize: 13, color: '#A89E91' },
  lowBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFF8E1', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20 },
  lowBadgeText: { fontSize: 12, fontWeight: '600', color: '#C77700' },

  movBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FCEFC8',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
  },
  movBtnText: { fontSize: 14, fontWeight: '600', color: '#9B5F0B' },

  section: { gap: 10 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#3B342B' },

  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#A89E91' },

  movList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  movRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E2D9',
  },
  movIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  movInfo: { flex: 1, gap: 2 },
  movLabel: { fontSize: 14, fontWeight: '600', color: '#1F1B16' },
  movNotes: { fontSize: 12, color: '#6B6258' },
  movRight: { alignItems: 'flex-end', gap: 2 },
  movQty: { fontSize: 14, fontWeight: '700' },
  movDate: { fontSize: 11, color: '#A89E91' },

  deactivateBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7E2D9',
    backgroundColor: '#FFFFFF',
    marginTop: 4,
  },
  deactivateBtnText: { fontSize: 14, color: '#B3261E' },

  errorText: { fontSize: 15, color: '#6B6258' },
  backLink: { marginTop: 12 },
  backLinkText: { fontSize: 15, color: '#C47C0A', fontWeight: '600' },
});
