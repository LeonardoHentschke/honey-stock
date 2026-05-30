import React, { useEffect, useState } from 'react';
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
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Batch, BatchInput } from '../../models/batchService';

interface Props {
  visible: boolean;
  editingBatch: Batch | null;
  isSaving: boolean;
  error: string | null;
  onSave: (input: BatchInput) => void;
  onClose: () => void;
}

function toDisplayDate(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function toIsoDate(display: string): string | null {
  const parts = display.replace(/\D/g, '');
  if (parts.length !== 8) return null;
  const d = parts.slice(0, 2);
  const m = parts.slice(2, 4);
  const y = parts.slice(4, 8);
  return `${y}-${m}-${d}`;
}

function maskDate(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

export function BatchFormSheet({ visible, editingBatch, isSaving, error, onSave, onClose }: Props) {
  const { bottom } = useSafeAreaInsets();
  const [code, setCode] = useState('');
  const [harvestedAt, setHarvestedAt] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    if (visible) {
      setCode(editingBatch?.code ?? '');
      setHarvestedAt(toDisplayDate(editingBatch?.harvested_at));
      setExpiresAt(toDisplayDate(editingBatch?.expires_at));
      setNotes(editingBatch?.notes ?? '');
      setLocalError('');
    }
  }, [visible, editingBatch]);

  function handleSave() {
    if (!code.trim()) { setLocalError('Código é obrigatório.'); return; }
    const harvested = harvestedAt ? toIsoDate(harvestedAt) : null;
    const expires = expiresAt ? toIsoDate(expiresAt) : null;
    if (harvestedAt && !harvested) { setLocalError('Data de colheita inválida.'); return; }
    if (expiresAt && !expires) { setLocalError('Data de validade inválida.'); return; }
    setLocalError('');
    onSave({
      code: code.trim(),
      harvested_at: harvested,
      expires_at: expires,
      notes: notes.trim() || null,
    });
  }

  const displayError = localError || error;

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
          <View style={styles.header}>
            <Text style={styles.title}>
              {editingBatch ? 'Editar lote' : 'Novo lote'}
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
            <View style={styles.field}>
              <Text style={styles.label}>Código *</Text>
              <TextInput
                style={[styles.input, displayError && !harvestedAt && !expiresAt && styles.inputError]}
                value={code}
                onChangeText={setCode}
                placeholder="Ex: LOTE-2026-001"
                placeholderTextColor="#A89E91"
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.field, styles.flex]}>
                <Text style={styles.label}>Colheita</Text>
                <TextInput
                  style={styles.input}
                  value={harvestedAt}
                  onChangeText={(t) => setHarvestedAt(maskDate(t))}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#A89E91"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
              <View style={[styles.field, styles.flex]}>
                <Text style={styles.label}>Validade</Text>
                <TextInput
                  style={styles.input}
                  value={expiresAt}
                  onChangeText={(t) => setExpiresAt(maskDate(t))}
                  placeholder="DD/MM/AAAA"
                  placeholderTextColor="#A89E91"
                  keyboardType="numeric"
                  maxLength={10}
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Observações (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Notas sobre este lote..."
                placeholderTextColor="#A89E91"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {displayError ? (
              <Text style={styles.errorText}>{displayError}</Text>
            ) : null}
          </ScrollView>

          <View style={[styles.footer, { paddingBottom: bottom + 16 }]}>
            <Pressable
              style={[styles.saveBtn, isSaving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Salvar lote</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#E7E2D9',
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
  row: { flexDirection: 'row', gap: 12 },
  errorText: {
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
