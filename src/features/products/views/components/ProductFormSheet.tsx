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
import { Controller, type Control } from 'react-hook-form';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProductFormViewModel } from '../../viewmodels/useProductFormViewModel';
import type { Product } from '../../models/productService';
import type { CreateProductValues } from '../../models/productSchemas';

interface Props {
  visible: boolean;
  mode: 'create' | 'edit';
  product?: Product;
  onSuccess: () => void;
  onClose: () => void;
}

export function ProductFormSheet({ visible, mode, product, onSuccess, onClose }: Props) {
  const { bottom } = useSafeAreaInsets();
  const vm = useProductFormViewModel({
    mode,
    product,
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
              {mode === 'create' ? 'Novo produto' : 'Editar produto'}
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
            {/* Nome */}
            <Controller
              control={vm.control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Nome *</Text>
                  <TextInput
                    style={[styles.input, vm.errors.name && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Ex: Mel 500g"
                    placeholderTextColor="#A89E91"
                    autoCapitalize="words"
                  />
                  {vm.errors.name && (
                    <Text style={styles.errorText}>{vm.errors.name.message}</Text>
                  )}
                </View>
              )}
            />

            {/* Preço de venda + custo */}
            <View style={styles.row}>
              <NumberField
                control={vm.control}
                name="sale_price"
                label="Preço de venda *"
                placeholder="0,00"
                prefix="R$"
                error={vm.errors.sale_price?.message}
              />
              <NumberField
                control={vm.control}
                name="cost_price"
                label="Custo"
                placeholder="0,00"
                prefix="R$"
                error={vm.errors.cost_price?.message}
              />
            </View>

            {/* Estoque (só no cadastro) + mínimo */}
            <View style={styles.row}>
              {mode === 'create' && (
                <NumberField
                  control={vm.control}
                  name="stock_quantity"
                  label="Estoque inicial"
                  placeholder="0"
                  error={vm.errors.stock_quantity?.message}
                />
              )}
              <NumberField
                control={vm.control}
                name="min_stock"
                label="Estoque mínimo"
                placeholder="0"
                error={vm.errors.min_stock?.message}
              />
            </View>

            {/* Descrição */}
            <Controller
              control={vm.control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Descrição (opcional)</Text>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    value={value ?? ''}
                    onChangeText={(t) => onChange(t || null)}
                    onBlur={onBlur}
                    placeholder="Observações sobre o produto..."
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
                <Text style={styles.saveBtnText}>Salvar produto</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Campo numérico ────────────────────────────────────────────────────────

function NumberField({
  control,
  name,
  label,
  placeholder,
  prefix,
  error,
}: {
  control: Control<CreateProductValues>;
  name: 'sale_price' | 'cost_price' | 'stock_quantity' | 'min_stock';
  label: string;
  placeholder: string;
  prefix?: string;
  error?: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <View style={[styles.field, styles.flex]}>
          <Text style={styles.label}>{label}</Text>
          <View style={[styles.inputWrap, error && styles.inputError]}>
            {prefix && <Text style={styles.prefix}>{prefix}</Text>}
            <TextInput
              style={styles.inputInner}
              value={value ? String(value).replace('.', ',') : ''}
              onChangeText={(t) => {
                const normalized = t.replace(/[^0-9,.]/g, '').replace(',', '.');
                const num = parseFloat(normalized);
                onChange(isNaN(num) ? 0 : num);
              }}
              onBlur={onBlur}
              placeholder={placeholder}
              placeholderTextColor="#A89E91"
              keyboardType="decimal-pad"
            />
          </View>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      )}
    />
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
  row: { flexDirection: 'row', gap: 12 },
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
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7E2D9',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    gap: 6,
  },
  prefix: { fontSize: 15, color: '#A89E91' },
  inputInner: { flex: 1, fontSize: 15, color: '#1F1B16' },
  inputError: { borderColor: '#B3261E' },
  textarea: { height: 80, paddingTop: 12 },
  errorText: { fontSize: 12, color: '#B3261E' },
  submitError: {
    fontSize: 13,
    color: '#B3261E',
    backgroundColor: '#FDECEA',
    borderRadius: 8,
    padding: 12,
  },

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
