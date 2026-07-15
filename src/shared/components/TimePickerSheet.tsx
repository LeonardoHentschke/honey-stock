import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';

interface Props {
  visible: boolean;
  value: Date | null;
  /** Base para ano/mês/dia e posição inicial quando `value` é null. */
  initialValue: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const WHEEL_PADDING = ITEM_HEIGHT * 2; // centraliza primeiro/último item

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

const pad2 = (n: number) => String(n).padStart(2, '0');

interface WheelProps {
  values: number[];
  selected: number;
  onSelect: (v: number) => void;
}

function Wheel({ values, selected, onSelect }: WheelProps) {
  const scrollRef = useRef<ScrollView>(null);

  function handleScrollEnd(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const clamped = Math.max(0, Math.min(values.length - 1, index));
    onSelect(values[clamped]);
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.wheel}
      contentContainerStyle={{ paddingVertical: WHEEL_PADDING }}
      contentOffset={{ x: 0, y: selected * ITEM_HEIGHT }}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      showsVerticalScrollIndicator={false}
      onMomentumScrollEnd={handleScrollEnd}
    >
      {values.map((v) => (
        <Pressable
          key={v}
          style={styles.wheelItem}
          onPress={() => {
            onSelect(v);
            scrollRef.current?.scrollTo({ y: v * ITEM_HEIGHT, animated: true });
          }}
        >
          <Text style={[styles.wheelText, v === selected && styles.wheelTextSelected]}>
            {pad2(v)}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

/**
 * Seletor de hora próprio (bottom sheet com colunas roláveis) — substitui o
 * time picker nativo.
 */
export function TimePickerSheet({ visible, value, initialValue, onConfirm, onClose }: Props) {
  const base = value ?? initialValue;
  const [hour, setHour] = useState(base.getHours());
  const [minute, setMinute] = useState(base.getMinutes());

  // Reposiciona ao reabrir (o valor pode ter mudado desde a última abertura)
  useEffect(() => {
    if (visible) {
      const b = value ?? initialValue;
      setHour(b.getHours());
      setMinute(b.getMinutes());
    }
  }, [visible]);

  function confirm() {
    const withDate = new Date(
      base.getFullYear(),
      base.getMonth(),
      base.getDate(),
      hour,
      minute,
      0,
      0
    );
    onConfirm(withDate);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.dragHandle} />
          <Text style={styles.title}>Escolher hora</Text>

          <View style={styles.wheelsArea}>
            {/* Faixa central destacada, atrás das colunas */}
            <View pointerEvents="none" style={styles.centerBand} />
            <View style={styles.wheelsRow}>
              <Wheel values={HOURS} selected={hour} onSelect={setHour} />
              <Text style={styles.colon}>:</Text>
              <Wheel values={MINUTES} selected={minute} onSelect={setMinute} />
            </View>
          </View>

          <Pressable style={styles.confirmBtn} onPress={confirm}>
            <Text style={styles.confirmBtnText}>Confirmar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(31, 27, 22, 0.4)',
    justifyContent: 'flex-end',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 32,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E7E2D9',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1F1B16',
    textAlign: 'center',
    marginBottom: 12,
  },

  wheelsArea: { height: WHEEL_HEIGHT, justifyContent: 'center' },
  centerBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: WHEEL_PADDING,
    height: ITEM_HEIGHT,
    backgroundColor: '#FEF9EC',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E7E2D9',
    borderRadius: 10,
  },
  wheelsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: WHEEL_HEIGHT,
  },
  wheel: { width: 88, height: WHEEL_HEIGHT },
  wheelItem: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wheelText: { fontSize: 16, color: '#A89E91', fontVariant: ['tabular-nums'] },
  wheelTextSelected: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F1B16',
  },
  colon: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F1B16',
    marginHorizontal: 8,
  },

  confirmBtn: {
    backgroundColor: '#E89B12',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
