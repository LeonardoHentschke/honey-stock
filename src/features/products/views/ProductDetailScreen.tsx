import React, { useState } from 'react';
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
  Plus,
  AlertTriangle,
  Boxes,
  ArrowUpDown,
  ChevronRight,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useProductDetailViewModel } from '../viewmodels/useProductDetailViewModel';
import { ProductFormSheet } from './components/ProductFormSheet';
import { VariantFormSheet } from './components/VariantFormSheet';
import { StockMovementSheet } from '@/features/inventory/views/components/StockMovementSheet';
import type { ProductVariant } from '../models/productService';
import { formatCurrency } from '@/shared/lib/format';
import { useAuth } from '@/shared/hooks/useAuth';
import type { ProductsStackParamList } from '@/navigation/types';

type Route = RouteProp<ProductsStackParamList, 'ProductDetail'>;
type Nav = NativeStackNavigationProp<ProductsStackParamList>;

export function ProductDetailScreen() {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { productId } = route.params;
  const vm = useProductDetailViewModel(productId);
  const { profile } = useAuth();

  const [showMovementSheet, setShowMovementSheet] = useState(false);
  const [movingVariantId, setMovingVariantId] = useState<string | null>(null);

  const movingVariant = movingVariantId
    ? (vm.product?.variants.find((v) => v.id === movingVariantId) ?? null)
    : null;

  function confirmDeactivate() {
    Alert.alert(
      'Desativar produto',
      'O produto e todas as suas variantes serão desativados. Esta ação pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Desativar',
          style: 'destructive',
          onPress: vm.deactivateProduct,
        },
      ]
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

  const { product } = vm;
  const activeVariants = product.variants.filter((v) => v.is_active);

  return (
    <View style={styles.root}>
      {/* ── Header ───────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <ArrowLeft size={22} color="#1F1B16" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {product.name}
        </Text>
        <Pressable onPress={vm.openEditSheet} hitSlop={8} style={styles.editBtn}>
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
        {/* ── Info do produto ───────────────────────────────── */}
        <View style={styles.infoCard}>
          {product.honey_type && (
            <InfoRow label="Tipo de mel" value={product.honey_type} />
          )}
          {product.category && (
            <InfoRow label="Categoria" value={product.category.name} />
          )}
          {product.description && (
            <InfoRow label="Descrição" value={product.description} />
          )}
          {!product.honey_type && !product.category && !product.description && (
            <Text style={styles.noInfo}>Sem informações adicionais.</Text>
          )}
        </View>

        {/* ── Variantes ─────────────────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <Boxes size={18} color="#9B5F0B" />
              <Text style={styles.sectionTitle}>
                Variantes ({activeVariants.length})
              </Text>
            </View>
            <Pressable onPress={vm.openCreateVariantSheet} style={styles.addVariantBtn}>
              <Plus size={16} color="#9B5F0B" />
              <Text style={styles.addVariantText}>Adicionar</Text>
            </Pressable>
          </View>

          {activeVariants.length === 0 ? (
            <Text style={styles.emptyVariants}>
              Nenhuma variante ativa. Adicione embalagens e preços.
            </Text>
          ) : (
            <View style={styles.variantCards}>
              {activeVariants.map((v) => (
                <VariantCard
                  key={v.id}
                  variant={v}
                  onPress={() => navigation.navigate('VariantDetail', { variantId: v.id })}
                  onEdit={() => vm.openEditVariantSheet(v.id)}
                  onMove={() => {
                    setMovingVariantId(v.id);
                    setShowMovementSheet(true);
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* ── Zona perigosa ─────────────────────────────────── */}
        <Pressable style={styles.deactivateBtn} onPress={confirmDeactivate}>
          <Text style={styles.deactivateBtnText}>Desativar produto</Text>
        </Pressable>
      </ScrollView>

      {/* ── Modais ────────────────────────────────────────────── */}
      <ProductFormSheet
        visible={vm.showEditSheet}
        mode="edit"
        product={product}
        onSuccess={vm.onSheetSuccess}
        onClose={vm.closeEditSheet}
      />

      <VariantFormSheet
        visible={vm.showVariantSheet}
        mode={vm.editingVariantId ? 'edit' : 'create'}
        productId={product.id}
        productName={product.name}
        variant={
          vm.editingVariantId
            ? product.variants.find((v) => v.id === vm.editingVariantId)
            : undefined
        }
        onSuccess={vm.onSheetSuccess}
        onClose={vm.closeVariantSheet}
      />

      {movingVariant && (
        <StockMovementSheet
          visible={showMovementSheet}
          variantId={movingVariant.id}
          companyId={profile?.company_id ?? ''}
          variantLabel={`${product.name} — ${movingVariant.packaging ?? movingVariant.sku}`}
          currentStock={movingVariant.stock_quantity}
          unit={movingVariant.unit}
          onSuccess={vm.onSheetSuccess}
          onClose={() => {
            setShowMovementSheet(false);
            setMovingVariantId(null);
          }}
        />
      )}
    </View>
  );
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function VariantCard({
  variant,
  onPress,
  onEdit,
  onMove,
}: {
  variant: ProductVariant;
  onPress: () => void;
  onEdit: () => void;
  onMove: () => void;
}) {
  const isLowStock = variant.stock_quantity <= variant.min_stock;

  return (
    <Pressable
      style={({ pressed }) => [styles.variantCard, pressed && styles.variantCardPressed]}
      onPress={onPress}
    >
      <View style={styles.variantCardTop}>
        <View style={styles.variantCardLeft}>
          <Text style={styles.variantPackaging}>{variant.packaging ?? variant.sku}</Text>
          <Text style={styles.variantSku}>{variant.sku}</Text>
        </View>
        <View style={styles.variantCardActions}>
          <Pressable onPress={onMove} hitSlop={8} style={styles.movBtn}>
            <ArrowUpDown size={13} color="#9B5F0B" />
            <Text style={styles.movBtnText}>Mov.</Text>
          </Pressable>
          <Pressable onPress={onEdit} hitSlop={8} style={styles.editVariantBtn}>
            <Pencil size={14} color="#A89E91" />
          </Pressable>
          <ChevronRight size={16} color="#A89E91" />
        </View>
      </View>

      <View style={styles.variantCardBottom}>
        <View style={styles.priceGroup}>
          <Text style={styles.priceLabel}>Venda</Text>
          <Text style={styles.priceValue}>{formatCurrency(variant.sale_price)}</Text>
        </View>
        <View style={styles.priceGroup}>
          <Text style={styles.priceLabel}>Custo</Text>
          <Text style={styles.priceValue}>{formatCurrency(variant.cost_price)}</Text>
        </View>
        {variant.reseller_price && (
          <View style={styles.priceGroup}>
            <Text style={styles.priceLabel}>Revenda</Text>
            <Text style={styles.priceValue}>{formatCurrency(variant.reseller_price)}</Text>
          </View>
        )}
        <View style={[styles.priceGroup, styles.stockGroup]}>
          <Text style={styles.priceLabel}>Estoque</Text>
          <Text style={[styles.stockValue, isLowStock && styles.stockValueLow]}>
            {variant.stock_quantity} {variant.unit}
          </Text>
          {isLowStock && variant.min_stock > 0 && (
            <View style={styles.lowStockBadge}>
              <AlertTriangle size={10} color="#C77700" />
              <Text style={styles.lowStockText}>mín {variant.min_stock}</Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: '#1F1B16',
  },
  editBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FCEFC8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { padding: 24, gap: 20, paddingBottom: 40 },

  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  infoRow: { gap: 2 },
  infoLabel: { fontSize: 12, color: '#A89E91', fontWeight: '500' },
  infoValue: { fontSize: 15, color: '#1F1B16' },
  noInfo: { fontSize: 14, color: '#A89E91', textAlign: 'center', paddingVertical: 4 },

  section: { gap: 12 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#1F1B16' },
  addVariantBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FCEFC8',
  },
  addVariantText: { fontSize: 13, fontWeight: '600', color: '#9B5F0B' },
  emptyVariants: { fontSize: 14, color: '#A89E91', textAlign: 'center', paddingVertical: 12 },

  variantCards: { gap: 10 },
  variantCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
  },
  variantCardPressed: {
    backgroundColor: '#FEF9EC',
  },
  variantCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  variantCardLeft: { gap: 2 },
  variantPackaging: { fontSize: 15, fontWeight: '600', color: '#1F1B16' },
  variantSku: { fontSize: 12, color: '#A89E91' },
  variantCardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  movBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
    backgroundColor: '#FCEFC8',
  },
  movBtnText: { fontSize: 12, fontWeight: '600', color: '#9B5F0B' },
  editVariantBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F1EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  variantCardBottom: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  priceGroup: { gap: 2, minWidth: 60 },
  stockGroup: { marginLeft: 'auto' },
  priceLabel: { fontSize: 11, color: '#A89E91' },
  priceValue: { fontSize: 14, fontWeight: '500', color: '#3B342B' },
  stockValue: { fontSize: 14, fontWeight: '600', color: '#3B342B' },
  stockValueLow: { color: '#C77700' },
  lowStockBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 },
  lowStockText: { fontSize: 11, color: '#C77700' },

  deactivateBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7E2D9',
    backgroundColor: '#FFFFFF',
  },
  deactivateBtnText: { fontSize: 14, color: '#B3261E' },

  errorText: { fontSize: 15, color: '#6B6258' },
  backLink: { marginTop: 12 },
  backLinkText: { fontSize: 15, color: '#C47C0A', fontWeight: '600' },
});
