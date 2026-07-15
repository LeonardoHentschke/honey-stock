import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatCurrency } from '@/shared/lib/format';
import { maskCurrency, currencyToNumber, numberToCurrencyMask } from '@/shared/lib/mask';
import { PAYMENT_LABELS, type PaymentMethod } from '../../models/salesService';

const METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: PAYMENT_LABELS.cash },
  { value: 'pix', label: PAYMENT_LABELS.pix },
];

interface Props {
  visible: boolean;
  balance: number;
  isSubmitting: boolean;
  error: string | null;
  onSubmit: (values: { amount: number; method: PaymentMethod; notes?: string }) => void;
  onClose: () => void;
}

export function PaymentSheet({ visible, balance, isSubmitting, error, onSubmit, onClose }: Props) {
  const { top, bottom } = useSafeAreaInsets();
  const [amountText, setAmountText] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);

  // Ao abrir, sugere o saldo em aberto como valor do pagamento.
  useEffect(() => {
    if (visible) {
      setAmountText(numberToCurrencyMask(balance));
      setMethod('cash');
      setNotes('');
      setLocalError(null);
    }
  }, [visible, balance]);

  function handleSubmit() {
    const amount = currencyToNumber(amountText);
    if (amount <= 0) {
      setLocalError('Informe um valor maior que zero.');
      return;
    }
    setLocalError(null);
    onSubmit({
      amount: Math.min(amount, balance),
      method,
      notes: notes.trim() || undefined,
    });
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
          <View style={[styles.header, { paddingTop: top + 16 }]}>
            <View style={styles.flex}>
              <Text style={styles.title}>Registrar pagamento</Text>
              <Text style={styles.subtitle}>Falta receber {formatCurrency(balance)}</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <X size={20} color="#6B6258" />
            </Pressable>
          </View>

          <KeyboardAwareScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            bottomOffset={24}
          >
            {/* Valor */}
            <View style={styles.field}>
              <Text style={styles.label}>Valor recebido *</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.prefix}>R$</Text>
                <TextInput
                  style={styles.inputInner}
                  value={amountText}
                  onChangeText={(t) => setAmountText(maskCurrency(t))}
                  placeholder="0,00"
                  placeholderTextColor="#A89E91"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Forma */}
            <View style={styles.field}>
              <Text style={styles.label}>Forma de pagamento</Text>
              <View style={styles.methodRow}>
                {METHOD_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    style={[styles.methodChip, method === opt.value && styles.methodChipActive]}
                    onPress={() => setMethod(opt.value)}
                  >
                    <Text
                      style={[
                        styles.methodChipText,
                        method === opt.value && styles.methodChipTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Observações */}
            <View style={styles.field}>
              <Text style={styles.label}>Observações (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ex: recebido via transferência..."
                placeholderTextColor="#A89E91"
                multiline
                numberOfLines={2}
                textAlignVertical="top"
              />
            </View>

            {localError ? <Text style={styles.errorText}>{localError}</Text> : null}
            {error ? <Text style={styles.submitError}>{error}</Text> : null}
          </KeyboardAwareScrollView>

          <View style={[styles.footer, { paddingBottom: bottom + 16 }]}>
            <Pressable
              style={[styles.saveBtn, isSubmitting && styles.saveBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Registrar pagamento</Text>
              )}
            </Pressable>
          </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: '#F5F1EA' },

  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E2D9',
    backgroundColor: '#FFFFFF',
  },
  title: { fontSize: 17, fontWeight: '600', color: '#1F1B16' },
  subtitle: { fontSize: 13, color: '#9B5F0B', marginTop: 2, fontWeight: '600' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F5F1EA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: { padding: 24, gap: 20 },
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
  textarea: { height: 72, paddingTop: 12 },

  methodRow: { flexDirection: 'row', gap: 8 },
  methodChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E2D9',
    alignItems: 'center',
  },
  methodChipActive: { backgroundColor: '#FCEFC8', borderColor: '#F0D48A' },
  methodChipText: { fontSize: 14, color: '#A89E91', fontWeight: '500' },
  methodChipTextActive: { color: '#9B5F0B', fontWeight: '600' },

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
