import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Controller } from 'react-hook-form';
import { X, ArrowDownToLine, ArrowUpFromLine, Settings2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useStockMovementViewModel } from '../../viewmodels/useStockMovementViewModel';
import { formatQuantity } from '@/shared/lib/format';

type MovementMode = 'entry' | 'exit' | 'adjust';

interface Props {
  visible: boolean;
  variantId: string;
  companyId: string;
  variantLabel: string;
  currentStock: number;
  unit: string;
  onSuccess: () => void;
  onClose: () => void;
}

const TABS: { mode: MovementMode; label: string; Icon: React.ComponentType<{ size: number; color: string }> }[] = [
  { mode: 'entry', label: 'Entrada', Icon: ArrowDownToLine },
  { mode: 'exit', label: 'Saída', Icon: ArrowUpFromLine },
  { mode: 'adjust', label: 'Ajuste', Icon: Settings2 },
];

export function StockMovementSheet({
  visible, variantId, companyId, variantLabel, currentStock, unit, onSuccess, onClose,
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const [mode, setMode] = useState<MovementMode>('entry');

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={styles.title}>Movimentar estoque</Text>
            <Text style={styles.subtitle}>{variantLabel}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <X size={20} color="#6B6258" />
          </Pressable>
        </View>

        {/* Estoque atual */}
        <View style={styles.stockBanner}>
          <Text style={styles.stockLabel}>Estoque atual</Text>
          <Text style={styles.stockValue}>
            {formatQuantity(currentStock, unit)}
          </Text>
        </View>

        {/* Tabs de modo */}
        <View style={styles.tabs}>
          {TABS.map(({ mode: m, label, Icon }) => (
            <Pressable
              key={m}
              style={[styles.tab, mode === m && styles.tabActive]}
              onPress={() => setMode(m)}
            >
              <Icon size={16} color={mode === m ? '#9B5F0B' : '#A89E91'} />
              <Text style={[styles.tabText, mode === m && styles.tabTextActive]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Form por modo */}
        <MovementForm
          key={mode}
          mode={mode}
          variantId={variantId}
          companyId={companyId}
          currentStock={currentStock}
          unit={unit}
          bottom={bottom}
          onSuccess={() => { onSuccess(); onClose(); }}
        />
      </View>
    </Modal>
  );
}

// ─── Form ────────────────────────────────────────────────────────────────────

function MovementForm({
  mode, variantId, companyId, currentStock, unit, bottom, onSuccess,
}: {
  mode: MovementMode;
  variantId: string;
  companyId: string;
  currentStock: number;
  unit: string;
  bottom: number;
  onSuccess: () => void;
}) {
  const vm = useStockMovementViewModel({ variantId, companyId, mode, onSuccess });

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {mode === 'adjust' && (
          <View style={styles.adjustWarning}>
            <Text style={styles.adjustWarningText}>
              O ajuste substitui o estoque atual ({formatQuantity(currentStock, unit)}) pelo novo valor.
            </Text>
          </View>
        )}

        {/* Quantidade / Novo estoque */}
        {mode !== 'adjust' ? (
          <Controller
            control={vm.control}
            name="quantity"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <Text style={styles.label}>
                  {mode === 'entry' ? 'Quantidade de entrada' : 'Quantidade de saída'} *
                </Text>
                <TextInput
                  style={[styles.input, vm.errors.quantity && styles.inputError]}
                  value={value === 0 ? '' : String(value)}
                  onChangeText={(t) => onChange(parseFloat(t.replace(',', '.')) || 0)}
                  onBlur={onBlur}
                  placeholder={`Ex: 10 ${unit}`}
                  placeholderTextColor="#A89E91"
                  keyboardType="decimal-pad"
                />
                {vm.errors.quantity && (
                  <Text style={styles.errorText}>{String(vm.errors.quantity.message)}</Text>
                )}
              </View>
            )}
          />
        ) : (
          <Controller
            control={vm.control}
            name="new_quantity"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <Text style={styles.label}>Novo estoque *</Text>
                <TextInput
                  style={[styles.input, vm.errors.new_quantity && styles.inputError]}
                  value={value === 0 ? '' : String(value)}
                  onChangeText={(t) => onChange(parseFloat(t.replace(',', '.')) || 0)}
                  onBlur={onBlur}
                  placeholder={`Ex: 15 ${unit}`}
                  placeholderTextColor="#A89E91"
                  keyboardType="decimal-pad"
                />
                {vm.errors.new_quantity && (
                  <Text style={styles.errorText}>{String(vm.errors.new_quantity.message)}</Text>
                )}
              </View>
            )}
          />
        )}

        {/* Custo unitário (só entrada) */}
        {mode === 'entry' && (
          <Controller
            control={vm.control}
            name="unit_cost"
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={styles.field}>
                <Text style={styles.label}>Custo unitário (R$) — opcional</Text>
                <TextInput
                  style={styles.input}
                  value={value ? String(value) : ''}
                  onChangeText={(t) => onChange(t ? parseFloat(t.replace(',', '.')) || null : null)}
                  onBlur={onBlur}
                  placeholder="0,00"
                  placeholderTextColor="#A89E91"
                  keyboardType="decimal-pad"
                />
              </View>
            )}
          />
        )}

        {/* Lote (só entrada) */}
        {mode === 'entry' && vm.batches.length > 0 && (
          <Controller
            control={vm.control}
            name="batch_id"
            render={({ field: { onChange, value } }) => (
              <View style={styles.field}>
                <Text style={styles.label}>Lote (opcional)</Text>
                <View style={styles.chipRow}>
                  {vm.batches.map((b) => (
                    <Pressable
                      key={b.id}
                      style={[styles.chip, value === b.id && styles.chipActive]}
                      onPress={() => onChange(value === b.id ? null : b.id)}
                    >
                      <Text style={[styles.chipText, value === b.id && styles.chipTextActive]}>
                        {b.code}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}
          />
        )}

        {/* Notas */}
        <Controller
          control={vm.control}
          name="notes"
          render={({ field: { onChange, onBlur, value } }) => (
            <View style={styles.field}>
              <Text style={styles.label}>Observações (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={value ?? ''}
                onChangeText={(t) => onChange(t || null)}
                onBlur={onBlur}
                placeholder="Motivo da movimentação..."
                placeholderTextColor="#A89E91"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          )}
        />

        {vm.submitError && (
          <Text style={styles.submitError}>{vm.submitError}</Text>
        )}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottom + 16 }]}>
        <Pressable
          style={[styles.saveBtn, vm.isSubmitting && styles.saveBtnDisabled]}
          onPress={vm.submit}
          disabled={vm.isSubmitting}
        >
          {vm.isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <Text style={styles.saveBtnText}>
              {mode === 'entry' ? 'Registrar entrada' :
               mode === 'exit' ? 'Registrar saída' : 'Ajustar estoque'}
            </Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F5F1EA' },

  header: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 24, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#E7E2D9',
    backgroundColor: '#FFFFFF',
  },
  title: { fontSize: 17, fontWeight: '600', color: '#1F1B16' },
  subtitle: { fontSize: 13, color: '#6B6258', marginTop: 2 },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F5F1EA', alignItems: 'center', justifyContent: 'center',
  },

  stockBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 12,
    backgroundColor: '#FCEFC8',
    borderBottomWidth: 1, borderBottomColor: '#F2E8D9',
  },
  stockLabel: { fontSize: 13, color: '#9B5F0B', fontWeight: '500' },
  stockValue: { fontSize: 17, fontWeight: '700', color: '#7A4A0F' },

  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 24, paddingVertical: 12, gap: 8,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E7E2D9',
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderRadius: 10,
    backgroundColor: '#F5F1EA',
  },
  tabActive: { backgroundColor: '#FCEFC8' },
  tabText: { fontSize: 13, color: '#A89E91', fontWeight: '500' },
  tabTextActive: { color: '#9B5F0B', fontWeight: '600' },

  content: { padding: 24, gap: 20, paddingBottom: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500', color: '#3B342B' },
  input: {
    height: 48, borderRadius: 10, borderWidth: 1,
    borderColor: '#E7E2D9', backgroundColor: '#FFFFFF',
    paddingHorizontal: 14, fontSize: 15, color: '#1F1B16',
  },
  inputError: { borderColor: '#B3261E' },
  textarea: { height: 80, paddingTop: 12 },
  errorText: { fontSize: 12, color: '#B3261E' },
  submitError: {
    fontSize: 13, color: '#B3261E',
    backgroundColor: '#FDECEA', borderRadius: 8, padding: 12,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1, borderColor: '#E7E2D9', backgroundColor: '#FFFFFF',
  },
  chipActive: { borderColor: '#C47C0A', backgroundColor: '#FCEFC8' },
  chipText: { fontSize: 13, color: '#6B6258' },
  chipTextActive: { color: '#9B5F0B', fontWeight: '600' },

  adjustWarning: {
    backgroundColor: '#FFF8E1', borderRadius: 8, padding: 12,
    borderLeftWidth: 3, borderLeftColor: '#C77700',
  },
  adjustWarningText: { fontSize: 13, color: '#7A5A00' },

  footer: {
    paddingHorizontal: 24, paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#E7E2D9',
  },
  saveBtn: {
    height: 52, borderRadius: 14, backgroundColor: '#E89B12',
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
