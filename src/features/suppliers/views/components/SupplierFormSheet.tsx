import React, { useEffect } from 'react';
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
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { supplierSchema, type SupplierValues } from '../../models/supplierSchemas';
import type { Supplier } from '../../models/supplierService';

interface Props {
  visible: boolean;
  editingSupplier: Supplier | null;
  isSaving: boolean;
  error: string | null;
  onSave: (values: SupplierValues) => void;
  onClose: () => void;
}

export function SupplierFormSheet({ visible, editingSupplier, isSaving, error, onSave, onClose }: Props) {
  const { bottom } = useSafeAreaInsets();

  const { control, handleSubmit, reset, formState: { errors } } = useForm<SupplierValues>({
    resolver: zodResolver(supplierSchema),
    defaultValues: {
      name: '',
      document: null,
      phone: null,
      email: null,
      address: null,
      notes: null,
    },
  });

  useEffect(() => {
    if (visible) {
      reset(
        editingSupplier
          ? {
              name: editingSupplier.name,
              document: editingSupplier.document,
              phone: editingSupplier.phone,
              email: editingSupplier.email,
              address: editingSupplier.address,
              notes: editingSupplier.notes,
            }
          : { name: '', document: null, phone: null, email: null, address: null, notes: null }
      );
    }
  }, [visible, editingSupplier, reset]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {editingSupplier ? 'Editar fornecedor' : 'Novo fornecedor'}
          </Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <X size={20} color="#6B6258" />
          </Pressable>
        </View>

        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Nome *</Text>
                  <TextInput
                    style={[styles.input, errors.name && styles.inputError]}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    placeholder="Nome do fornecedor"
                    placeholderTextColor="#A89E91"
                  />
                  {errors.name && <Text style={styles.errorText}>{errors.name.message}</Text>}
                </View>
              )}
            />

            <Controller
              control={control}
              name="document"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>CNPJ / CPF</Text>
                  <TextInput
                    style={styles.input}
                    value={value ?? ''}
                    onChangeText={(t) => onChange(t || null)}
                    onBlur={onBlur}
                    placeholder="00.000.000/0000-00"
                    placeholderTextColor="#A89E91"
                    keyboardType="numeric"
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Telefone</Text>
                  <TextInput
                    style={styles.input}
                    value={value ?? ''}
                    onChangeText={(t) => onChange(t || null)}
                    onBlur={onBlur}
                    placeholder="(51) 99999-9999"
                    placeholderTextColor="#A89E91"
                    keyboardType="phone-pad"
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>E-mail</Text>
                  <TextInput
                    style={[styles.input, errors.email && styles.inputError]}
                    value={value ?? ''}
                    onChangeText={(t) => onChange(t || null)}
                    onBlur={onBlur}
                    placeholder="contato@fornecedor.com"
                    placeholderTextColor="#A89E91"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  {errors.email && <Text style={styles.errorText}>{errors.email.message}</Text>}
                </View>
              )}
            />

            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Endereço</Text>
                  <TextInput
                    style={styles.input}
                    value={value ?? ''}
                    onChangeText={(t) => onChange(t || null)}
                    onBlur={onBlur}
                    placeholder="Rua, número, cidade"
                    placeholderTextColor="#A89E91"
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <View style={styles.field}>
                  <Text style={styles.label}>Observações</Text>
                  <TextInput
                    style={[styles.input, styles.textarea]}
                    value={value ?? ''}
                    onChangeText={(t) => onChange(t || null)}
                    onBlur={onBlur}
                    placeholder="Anotações sobre o fornecedor..."
                    placeholderTextColor="#A89E91"
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>
              )}
            />

            {error && <Text style={styles.submitError}>{error}</Text>}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: bottom + 16 }]}>
            <Pressable
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={handleSubmit(onSave)}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {editingSupplier ? 'Salvar alterações' : 'Criar fornecedor'}
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
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
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F5F1EA', alignItems: 'center', justifyContent: 'center',
  },

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
