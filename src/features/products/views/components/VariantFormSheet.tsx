import React from 'react';
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
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVariantFormViewModel } from '../../viewmodels/useVariantFormViewModel';
import type { ProductVariant } from '../../models/productService';

interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  productId: string;
  productName: string;
  variant?: ProductVariant;
  onSuccess: () => void;
  onClose: () => void;
}

export function VariantFormSheet({
  visible,
  mode,
  productId,
  productName,
  variant,
  onSuccess,
  onClose,
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const vm = useVariantFormViewModel({
    productId,
    productName,
    mode,
    variant,
    onSuccess: () => {
      onSuccess();
      onClose();
    },
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {mode === 'create' ? 'Nova variante' : 'Editar variante'}
            </Text>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <X size={20} color="#6B6258" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            {/* Embalagem */}
            <Controller
              control={vm.control}
              name="packaging"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Embalagem *</Text>
                  <TextInput
                    style={[styles.input, vm.errors.packaging && styles.inputError]}
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Ex: 500g pote de vidro"
                    placeholderTextColor="#A89E91"
                    autoCapitalize="none"
                  />
                  {vm.errors.packaging && (
                    <Text style={styles.errorText}>{vm.errors.packaging.message}</Text>
                  )}
                </View>
              )}
            />

            {/* SKU */}
            <Controller
              control={vm.control}
              name="sku"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>SKU *</Text>
                  <TextInput
                    style={[styles.input, vm.errors.sku && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="gerado automaticamente"
                    placeholderTextColor="#A89E91"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  {vm.errors.sku && (
                    <Text style={styles.errorText}>{vm.errors.sku.message}</Text>
                  )}
                </View>
              )}
            />

            {/* Unidade */}
            <Controller
              control={vm.control}
              name="unit"
              render={({ field: { onChange, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Unidade *</Text>
                  <View style={styles.segmented}>
                    {(['un', 'kg'] as const).map((u) => (
                      <Pressable
                        key={u}
                        style={[styles.segment, value === u && styles.segmentActive]}
                        onPress={() => onChange(u)}
                      >
                        <Text
                          style={[styles.segmentText, value === u && styles.segmentTextActive]}
                        >
                          {u === 'un' ? 'Unidade (un)' : 'Granel (kg)'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            />

            {/* Preços — row */}
            <View style={styles.row}>
              <Controller
                control={vm.control}
                name="cost_price"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.field, styles.flex]}>
                    <Text style={styles.label}>Custo (R$) *</Text>
                    <TextInput
                      style={[styles.input, vm.errors.cost_price && styles.inputError]}
                      value={value === 0 ? '' : String(value)}
                      onChangeText={(t) => onChange(parseFloat(t.replace(',', '.')) || 0)}
                      onBlur={onBlur}
                      placeholder="0,00"
                      placeholderTextColor="#A89E91"
                      keyboardType="decimal-pad"
                    />
                    {vm.errors.cost_price && (
                      <Text style={styles.errorText}>{vm.errors.cost_price.message}</Text>
                    )}
                  </View>
                )}
              />
              <Controller
                control={vm.control}
                name="sale_price"
                render={({ field: { onChange, onBlur, value } }) => (
                  <View style={[styles.field, styles.flex]}>
                    <Text style={styles.label}>Preço venda (R$) *</Text>
                    <TextInput
                      style={[styles.input, vm.errors.sale_price && styles.inputError]}
                      value={value === 0 ? '' : String(value)}
                      onChangeText={(t) => onChange(parseFloat(t.replace(',', '.')) || 0)}
                      onBlur={onBlur}
                      placeholder="0,00"
                      placeholderTextColor="#A89E91"
                      keyboardType="decimal-pad"
                    />
                    {vm.errors.sale_price && (
                      <Text style={styles.errorText}>{vm.errors.sale_price.message}</Text>
                    )}
                  </View>
                )}
              />
            </View>

            {/* Preço revenda */}
            <Controller
              control={vm.control}
              name="reseller_price"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Preço revenda (R$) — opcional</Text>
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

            {/* Estoque mínimo */}
            <Controller
              control={vm.control}
              name="min_stock"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Estoque mínimo *</Text>
                  <TextInput
                    style={[styles.input, vm.errors.min_stock && styles.inputError]}
                    value={value === 0 ? '' : String(value)}
                    onChangeText={(t) => onChange(parseFloat(t.replace(',', '.')) || 0)}
                    onBlur={onBlur}
                    placeholder="0"
                    placeholderTextColor="#A89E91"
                    keyboardType="decimal-pad"
                  />
                  {vm.errors.min_stock && (
                    <Text style={styles.errorText}>{vm.errors.min_stock.message}</Text>
                  )}
                </View>
              )}
            />

            {vm.submitError && (
              <Text style={styles.submitError}>{vm.submitError}</Text>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { paddingBottom: bottom + 16 }]}>
            <Pressable
              style={[styles.saveBtn, vm.isSubmitting && styles.saveBtnDisabled]}
              onPress={vm.submit}
              disabled={vm.isSubmitting}
            >
              {vm.isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Salvar variante</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F5F1EA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E2D9',
    backgroundColor: '#FFFFFF',
  },
  title: { fontSize: 17, fontWeight: '600', color: '#1F1B16' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F1EA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { padding: 24, gap: 20, paddingBottom: 16 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500', color: '#3B342B' },
  input: {
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7E2D9',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#1F1B16',
  },
  inputError: { borderColor: '#B3261E' },
  errorText: { fontSize: 12, color: '#B3261E' },
  submitError: {
    fontSize: 13,
    color: '#B3261E',
    backgroundColor: '#FDECEA',
    borderRadius: 8,
    padding: 12,
  },

  row: { flexDirection: 'row', gap: 12 },

  segmented: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7E2D9',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  segment: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentActive: { backgroundColor: '#FCEFC8' },
  segmentText: { fontSize: 14, color: '#6B6258' },
  segmentTextActive: { color: '#9B5F0B', fontWeight: '600' },

  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E7E2D9',
  },
  saveBtn: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#E89B12',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
