import React from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, CheckCircle, Circle } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useReminderFormViewModel } from '../../viewmodels/useReminderFormViewModel';

interface Props {
  visible: boolean;
  onClose: () => void;
  prefilledSaleId?: string;
  prefilledRemindAt?: Date;
}

function applyDateMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function applyTimeMask(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
}

export function ReminderFormSheet({
  visible,
  onClose,
  prefilledSaleId,
  prefilledRemindAt,
}: Props) {
  const { bottom } = useSafeAreaInsets();
  const vm = useReminderFormViewModel({
    prefilledSaleId,
    prefilledRemindAt,
    onSuccess: onClose,
  });

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Novo lembrete</Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <X size={22} color="#1F1B16" />
          </Pressable>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottom + 24 }]}
          keyboardShouldPersistTaps="handled"
        >
          {/* Título */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Título *</Text>
            <TextInput
              style={styles.textInput}
              value={vm.title}
              onChangeText={vm.setTitle}
              placeholder="Ex: Entregar ao João"
              placeholderTextColor="#A89E91"
            />
          </View>

          {/* Corpo */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Descrição (opcional)</Text>
            <TextInput
              style={[styles.textInput, styles.textInputMultiline]}
              value={vm.body}
              onChangeText={vm.setBody}
              placeholder="Detalhes do lembrete..."
              placeholderTextColor="#A89E91"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Data + Hora */}
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>Data *</Text>
              <TextInput
                style={styles.textInput}
                value={vm.scheduledDateText}
                onChangeText={(t) => vm.setScheduledDateText(applyDateMask(t))}
                placeholder="DD/MM/AAAA"
                placeholderTextColor="#A89E91"
                keyboardType="numeric"
                maxLength={10}
              />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.fieldLabel}>Hora *</Text>
              <TextInput
                style={styles.textInput}
                value={vm.scheduledTimeText}
                onChangeText={(t) => vm.setScheduledTimeText(applyTimeMask(t))}
                placeholder="HH:MM"
                placeholderTextColor="#A89E91"
                keyboardType="numeric"
                maxLength={5}
              />
            </View>
          </View>

          {/* Destinatários */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>Destinatários *</Text>
            {vm.isLoadingMembers ? (
              <ActivityIndicator color="#C47C0A" style={{ marginTop: 8 }} />
            ) : (
              <View style={styles.membersList}>
                {vm.members.map((member) => {
                  const selected = vm.selectedRecipientIds.includes(member.id);
                  return (
                    <Pressable
                      key={member.id}
                      style={styles.memberRow}
                      onPress={() => vm.toggleRecipient(member.id)}
                    >
                      {selected ? (
                        <CheckCircle size={22} color="#C47C0A" />
                      ) : (
                        <Circle size={22} color="#A89E91" />
                      )}
                      <Text style={[styles.memberName, selected && styles.memberNameSelected]}>
                        {member.full_name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Erro */}
          {vm.formError ? (
            <Text style={styles.errorText}>{vm.formError}</Text>
          ) : null}

          {/* Botão */}
          <Pressable
            style={[styles.submitBtn, vm.isSubmitting && styles.submitBtnDisabled]}
            onPress={vm.submit}
            disabled={vm.isSubmitting}
          >
            {vm.isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>Salvar lembrete</Text>
            )}
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1EA' },

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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F1B16' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F1EA',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { padding: 24, gap: 16 },

  fieldBlock: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B6258',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E2D9',
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F1B16',
  },
  textInputMultiline: { minHeight: 80, textAlignVertical: 'top' },

  dateRow: { flexDirection: 'row', gap: 12 },
  dateField: { flex: 1, gap: 6 },

  membersList: { gap: 4 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E7E2D9',
  },
  memberName: { fontSize: 15, color: '#6B6258', flex: 1 },
  memberNameSelected: { color: '#1F1B16', fontWeight: '600' },

  errorText: {
    fontSize: 14,
    color: '#B3261E',
    textAlign: 'center',
  },

  submitBtn: {
    backgroundColor: '#E89B12',
    borderRadius: 14,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#E89B12',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
