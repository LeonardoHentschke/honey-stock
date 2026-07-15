import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, Pressable, Modal, StyleSheet } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface Props {
  visible: boolean;
  value: Date | null;
  /** Base para hora/minuto e posição inicial quando `value` é null. */
  initialValue: Date;
  minimumDate?: Date;
  onConfirm: (date: Date) => void;
  onClose: () => void;
}

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

const MONTH_FORMATTER = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
});

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Calendário mensal próprio (bottom sheet) — substitui o date picker nativo.
 */
export function DatePickerSheet({
  visible,
  value,
  initialValue,
  minimumDate,
  onConfirm,
  onClose,
}: Props) {
  const base = value ?? initialValue;
  const [monthCursor, setMonthCursor] = useState<Date>(
    new Date(base.getFullYear(), base.getMonth(), 1)
  );
  const [selected, setSelected] = useState<Date>(startOfDay(base));

  // Reposiciona ao reabrir (o valor pode ter mudado desde a última abertura)
  useEffect(() => {
    if (visible) {
      const b = value ?? initialValue;
      setMonthCursor(new Date(b.getFullYear(), b.getMonth(), 1));
      setSelected(startOfDay(b));
    }
  }, [visible]);

  const minDay = minimumDate ? startOfDay(minimumDate) : null;
  const today = startOfDay(new Date());

  const canGoPrev =
    !minDay ||
    monthCursor.getTime() > new Date(minDay.getFullYear(), minDay.getMonth(), 1).getTime();

  const weeks = useMemo(() => {
    const year = monthCursor.getFullYear();
    const month = monthCursor.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = Array(firstWeekday).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [monthCursor]);

  const monthTitle = useMemo(() => {
    const raw = MONTH_FORMATTER.format(monthCursor);
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  }, [monthCursor]);

  function shiftMonth(delta: number) {
    setMonthCursor((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  }

  function confirm() {
    const withTime = new Date(
      selected.getFullYear(),
      selected.getMonth(),
      selected.getDate(),
      base.getHours(),
      base.getMinutes(),
      0,
      0
    );
    onConfirm(withTime);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.dragHandle} />

          {/* Navegação de mês */}
          <View style={styles.monthRow}>
            <Pressable
              onPress={() => canGoPrev && shiftMonth(-1)}
              hitSlop={8}
              style={[styles.monthBtn, !canGoPrev && styles.monthBtnDisabled]}
              disabled={!canGoPrev}
            >
              <ChevronLeft size={22} color={canGoPrev ? '#9B5F0B' : '#A89E91'} />
            </Pressable>
            <Text style={styles.monthTitle}>{monthTitle}</Text>
            <Pressable onPress={() => shiftMonth(1)} hitSlop={8} style={styles.monthBtn}>
              <ChevronRight size={22} color="#9B5F0B" />
            </Pressable>
          </View>

          {/* Dias da semana */}
          <View style={styles.weekRow}>
            {WEEKDAY_LABELS.map((label, i) => (
              <Text key={i} style={styles.weekLabel}>
                {label}
              </Text>
            ))}
          </View>

          {/* Grade de dias (uma linha por semana garante 7 colunas) */}
          {weeks.map((week, w) => (
            <View key={w} style={styles.weekDaysRow}>
              {week.map((day, i) => {
                if (!day) return <View key={i} style={styles.dayCell} />;
                const disabled = !!minDay && day.getTime() < minDay.getTime();
                const isSelected = isSameDay(day, selected);
                const isToday = isSameDay(day, today);
                return (
                  <View key={i} style={styles.dayCell}>
                    <Pressable
                      style={[
                        styles.dayCircle,
                        isToday && !isSelected && styles.dayCircleToday,
                        isSelected && styles.dayCircleSelected,
                      ]}
                      onPress={() => !disabled && setSelected(day)}
                      disabled={disabled}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          disabled && styles.dayTextDisabled,
                          isSelected && styles.dayTextSelected,
                        ]}
                      >
                        {day.getDate()}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>
          ))}

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

  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  monthBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FCEFC8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthBtnDisabled: { backgroundColor: '#F5F1EA' },
  monthTitle: { fontSize: 17, fontWeight: '600', color: '#1F1B16' },

  weekRow: { flexDirection: 'row', marginBottom: 4 },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
    color: '#6B6258',
  },

  weekDaysRow: { flexDirection: 'row' },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 2,
  },
  dayCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircleToday: { borderWidth: 1.5, borderColor: '#F0B12C' },
  dayCircleSelected: { backgroundColor: '#E89B12' },
  dayText: { fontSize: 15, color: '#1F1B16' },
  dayTextDisabled: { color: '#A89E91' },
  dayTextSelected: { color: '#FFFFFF', fontWeight: '700' },

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
