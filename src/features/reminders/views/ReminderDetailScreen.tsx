import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, CalendarClock, User } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { formatDateTime, formatRelativeTime } from '@/shared/lib/format';
import { useReminderDetailViewModel } from '../viewmodels/useReminderDetailViewModel';
import type { MoreStackParamList } from '@/navigation/types';
import type { ReminderStatus } from '@/shared/types/database.types';

type Props = NativeStackScreenProps<MoreStackParamList, 'ReminderDetail'>;

const STATUS_COLORS: Partial<Record<ReminderStatus, { bg: string; text: string; label: string }>> = {
  pending: { bg: '#DBEAFE', text: '#1E40AF', label: 'Aguardando' },
  failed: { bg: '#FEE2E2', text: '#991B1B', label: 'Falhou' },
  sent: { bg: '#D1FAE5', text: '#065F46', label: 'Enviado' },
  canceled: { bg: '#F3F4F6', text: '#6B7280', label: 'Cancelado' },
};

export function ReminderDetailScreen({ route }: Props) {
  const { reminderId } = route.params;
  const { top, bottom } = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const vm = useReminderDetailViewModel(reminderId);

  function handleCancel() {
    Alert.alert(
      'Cancelar lembrete',
      'Tem certeza? O lembrete não será enviado.',
      [
        { text: 'Não', style: 'cancel' },
        { text: 'Cancelar lembrete', style: 'destructive', onPress: () => vm.cancelReminder() },
      ]
    );
  }

  if (vm.isLoading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color="#C47C0A" size="large" />
      </View>
    );
  }

  if (!vm.reminder) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Text style={styles.errorText}>{vm.error ?? 'Lembrete não encontrado.'}</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const { reminder } = vm;
  const status = reminder.status as ReminderStatus;
  const statusMeta = STATUS_COLORS[status] ?? { bg: '#F3F4F6', text: '#6B7280', label: status };
  const isCancelable = status === 'pending';
  const remindDate = new Date(reminder.remind_at);

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <ArrowLeft size={22} color="#1F1B16" />
        </Pressable>
        <Text style={styles.title}>Lembrete</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusMeta.bg }]}>
          <Text style={[styles.statusText, { color: statusMeta.text }]}>{statusMeta.label}</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottom + 32 }]}
      >
        {/* Card principal */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{reminder.title}</Text>
          {reminder.body ? (
            <Text style={styles.cardBody}>{reminder.body}</Text>
          ) : null}
          <View style={styles.metaDivider} />
          <View style={styles.metaRow}>
            <CalendarClock size={15} color="#A89E91" />
            <Text style={styles.metaText}>
              {formatDateTime(remindDate)} · {formatRelativeTime(remindDate)}
            </Text>
          </View>
          {reminder.sent_at ? (
            <View style={styles.metaRow}>
              <User size={15} color="#A89E91" />
              <Text style={styles.metaText}>
                Enviado em {formatDateTime(new Date(reminder.sent_at))}
              </Text>
            </View>
          ) : null}
          {reminder.error ? (
            <Text style={styles.errorInCard}>{reminder.error}</Text>
          ) : null}
        </View>

        {/* Venda vinculada */}
        {reminder.sale ? (
          <>
            <Text style={styles.sectionLabel}>Venda vinculada</Text>
            <View style={styles.card}>
              <View style={styles.metaRow}>
                <User size={15} color="#A89E91" />
                <Text style={styles.metaText}>
                  {(reminder.sale as { customer: { name: string } | null }).customer?.name ?? 'Avulso'}
                </Text>
              </View>
              {reminder.sale.scheduled_for ? (
                <View style={styles.metaRow}>
                  <CalendarClock size={15} color="#A89E91" />
                  <Text style={styles.metaText}>
                    Entrega: {formatDateTime(new Date(reminder.sale.scheduled_for))}
                  </Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}

        {/* Cancelar */}
        {isCancelable ? (
          <Pressable
            style={[styles.cancelBtn, vm.isCanceling && styles.cancelBtnDisabled]}
            onPress={handleCancel}
            disabled={vm.isCanceling}
          >
            {vm.isCanceling ? (
              <ActivityIndicator color="#B3261E" />
            ) : (
              <Text style={styles.cancelBtnText}>Cancelar lembrete</Text>
            )}
          </Pressable>
        ) : null}

        {vm.cancelError ? (
          <Text style={styles.errorText}>{vm.cancelError}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1EA' },
  centered: { alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, gap: 12 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1F1B16', flex: 1 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700' },

  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B6258',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 8,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1F1B16' },
  cardBody: { fontSize: 15, color: '#6B6258' },
  metaDivider: { height: 1, backgroundColor: '#E7E2D9' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaText: { fontSize: 14, color: '#3B342B', flex: 1 },
  errorInCard: { fontSize: 13, color: '#B3261E' },

  cancelBtn: {
    borderWidth: 1.5,
    borderColor: '#B3261E',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnDisabled: { opacity: 0.5 },
  cancelBtnText: { fontSize: 15, fontWeight: '700', color: '#B3261E' },

  errorText: { fontSize: 14, color: '#B3261E', textAlign: 'center' },
  backLink: { marginTop: 12 },
  backLinkText: { fontSize: 15, color: '#C47C0A', fontWeight: '600' },
});
