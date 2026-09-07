import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { ProductTile } from '@/shared/components/ProductTile';
import { formatCurrency } from '@/shared/lib/format';
import type { CartItem } from '../../models/salesSchemas';

interface Props {
  item: CartItem;
  onUpdateQty: (productId: string, qty: number) => void;
  /** Desconto de revenda do cliente selecionado — só usado quando `item.priceIsAdjusted`. */
  resellerDiscountPercent?: number | null;
}

export function CartItemRow({ item, onUpdateQty, resellerDiscountPercent }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <ProductTile name={item.productName} size={44} />
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.productName}
          </Text>
          {item.priceIsAdjusted ? (
            <View style={styles.priceRow}>
              <Text style={styles.unitPrice}>{formatCurrency(item.unitPrice)} cada</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  revenda{resellerDiscountPercent ? ` −${resellerDiscountPercent}%` : ''}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.unitPrice}>{formatCurrency(item.unitPrice)} cada</Text>
          )}
        </View>
        <Pressable
          onPress={() => onUpdateQty(item.productId, 0)}
          hitSlop={8}
          style={styles.trashBtn}
        >
          <Trash2 size={16} color="#A89E91" />
        </Pressable>
      </View>

      <View style={styles.bottom}>
        <View style={styles.stepper}>
          <Pressable
            style={styles.stepBtn}
            onPress={() => onUpdateQty(item.productId, item.quantity - 1)}
          >
            <Minus size={16} color="#C47C0A" />
          </Pressable>
          <Text style={styles.qty}>{item.quantity}</Text>
          <Pressable
            style={styles.stepBtn}
            onPress={() => onUpdateQty(item.productId, item.quantity + 1)}
          >
            <Plus size={16} color="#C47C0A" />
          </Pressable>
        </View>
        <Text style={styles.subtotal}>{formatCurrency(item.subtotal)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  info: { flex: 1, gap: 2, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '600', color: '#1F1B16' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  unitPrice: { fontSize: 13, color: '#A89E91' },
  badge: {
    backgroundColor: '#F2E8D9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  badgeText: { fontSize: 12, fontWeight: '500', color: '#7A5A2A' },
  trashBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F5F1EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#FCEFC8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { fontSize: 18, fontWeight: '700', color: '#1F1B16', minWidth: 32, textAlign: 'center' },
  subtotal: { fontSize: 18, fontWeight: '700', color: '#C47C0A' },
});
