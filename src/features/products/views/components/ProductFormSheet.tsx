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

import { useProductFormViewModel } from '../../viewmodels/useProductFormViewModel';
import type { Product } from '../../models/productService';
import { HONEY_TYPES } from '../../models/productSchemas';

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
                    placeholder="Ex: Mel silvestre"
                    placeholderTextColor="#A89E91"
                    autoCapitalize="words"
                  />
                  {vm.errors.name && (
                    <Text style={styles.errorText}>{vm.errors.name.message}</Text>
                  )}
                </View>
              )}
            />

            {/* Tipo de mel */}
            <Controller
              control={vm.control}
              name="honey_type"
              render={({ field: { onChange, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Tipo de mel</Text>
                  <View style={styles.chipRow}>
                    {HONEY_TYPES.map((t) => (
                      <Pressable
                        key={t}
                        style={[styles.chip, value === t && styles.chipActive]}
                        onPress={() => onChange(value === t ? null : t)}
                      >
                        <Text style={[styles.chipText, value === t && styles.chipTextActive]}>
                          {t}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            />

            {/* Categoria */}
            {vm.categories.length > 0 && (
              <Controller
                control={vm.control}
                name="category_id"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.field}>
                    <Text style={styles.label}>Categoria</Text>
                    <View style={styles.chipRow}>
                      {vm.categories.map((c) => (
                        <Pressable
                          key={c.id}
                          style={[styles.chip, value === c.id && styles.chipActive]}
                          onPress={() => onChange(value === c.id ? null : c.id)}
                        >
                          <Text
                            style={[styles.chipText, value === c.id && styles.chipTextActive]}
                          >
                            {c.name}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                )}
              />
            )}

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
  textarea: { height: 80, paddingTop: 12 },
  errorText: { fontSize: 12, color: '#B3261E' },
  submitError: {
    fontSize: 13,
    color: '#B3261E',
    backgroundColor: '#FDECEA',
    borderRadius: 8,
    padding: 12,
  },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E2D9',
    backgroundColor: '#FFFFFF',
  },
  chipActive: { borderColor: '#C47C0A', backgroundColor: '#FCEFC8' },
  chipText: { fontSize: 13, color: '#6B6258' },
  chipTextActive: { color: '#9B5F0B', fontWeight: '600' },

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
