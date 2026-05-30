import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { formatCurrency } from '@/shared/lib/format';
import type { CartItem } from '../../models/salesSchemas';

interface Props {
  item: CartItem;
  onUpdateQty: (variantId: string, qty: number) => void;
}

export function CartItemRow({ item, onUpdateQty }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.info}>
          <Text style={styles.name} numberOfLines={1}>
            {item.productName}
          </Text>
          {item.packaging ? (
            <Text style={styles.sub}>{item.packaging}</Text>
          ) : null}
          <View style={styles.priceRow}>
            <Text style={styles.unitPrice}>{formatCurrency(item.unitPrice)}/un</Text>
            {item.priceIsAdjusted ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>revenda</Text>
              </View>
            ) : null}
          </View>
        </View>
        <Pressable
          onPress={() => onUpdateQty(item.variantId, 0)}
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
            onPress={() => onUpdateQty(item.variantId, item.quantity - 1)}
          >
            <Minus size={16} color="#C47C0A" />
          </Pressable>
          <Text style={styles.qty}>{item.quantity}</Text>
          <Pressable
            style={styles.stepBtn}
            onPress={() => onUpdateQty(item.variantId, item.quantity + 1)}
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
    padding: 14,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 10,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: '#1F1B16' },
  sub: { fontSize: 13, color: '#6B6258' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  unitPrice: { fontSize: 13, color: '#A89E91' },
  badge: {
    backgroundColor: '#E3D0AE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#7A5A2A' },
  trashBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F5F1EA',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
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
