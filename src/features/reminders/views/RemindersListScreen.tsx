import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Plus, BellRing } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { formatRelativeTime, formatDateTime } from '@/shared/lib/format';
import { useRemindersListViewModel } from '../viewmodels/useRemindersListViewModel';
import { ReminderFormSheet } from './components/ReminderFormSheet';
import type { MoreStackParamList } from '@/navigation/types';
import type { Reminder } from '../models/remindersService';
import type { ReminderStatus } from '@/shared/types/database.types';

const STATUS_COLORS: Record<Extract<ReminderStatus, 'pending' | 'failed'>, { bg: string; text: string; label: string }> = {
  pending: { bg: '#DBEAFE', text: '#1E40AF', label: 'Aguardando' },
  failed: { bg: '#FEE2E2', text: '#991B1B', label: 'Falhou' },
};

export function RemindersListScreen() {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const vm = useRemindersListViewModel();

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <ArrowLeft size={22} color="#1F1B16" />
        </Pressable>
        <Text style={styles.title}>Lembretes</Text>
        <Pressable onPress={vm.openCreate} style={styles.addBtn} accessibilityLabel="Novo lembrete">
          <Plus size={20} color="#9B5F0B" />
        </Pressable>
      </View>

      {vm.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#C47C0A" size="large" />
        </View>
      ) : (
        <FlatList
          data={vm.reminders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={vm.reminders.length === 0 ? styles.flex : styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.refresh}
              tintColor="#C47C0A"
              colors={['#C47C0A']}
            />
          }
          renderItem={({ item }) => (
            <ReminderCard
              reminder={item}
              onPress={() => navigation.navigate('ReminderDetail', { reminderId: item.id })}
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
                <BellRing size={36} color="#F5C859" />
              </View>
              <Text style={styles.emptyTitle}>Nenhum lembrete pendente</Text>
              <Text style={styles.emptyBody}>
                Toque em + para criar um lembrete avulso ou a partir de uma venda agendada.
              </Text>
              <Pressable style={styles.emptyBtn} onPress={vm.openCreate}>
                <Plus size={18} color="#9B5F0B" />
                <Text style={styles.emptyBtnText}>Criar lembrete</Text>
              </Pressable>
            </View>
          }
        />
      )}

      <ReminderFormSheet
        visible={vm.showFormSheet}
        onClose={vm.closeSheet}
      />
    </View>
  );
}

function ReminderCard({ reminder, onPress }: { reminder: Reminder; onPress: () => void }) {
  const status = reminder.status as Extract<ReminderStatus, 'pending' | 'failed'>;
  const colors = STATUS_COLORS[status];
  const remindDate = new Date(reminder.remind_at);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardLeft}>
          <Text style={styles.cardTitle} numberOfLines={1}>{reminder.title}</Text>
          {reminder.body ? (
            <Text style={styles.cardBody} numberOfLines={2}>{reminder.body}</Text>
          ) : null}
          <Text style={styles.cardDate}>
            {formatRelativeTime(remindDate)} · {formatDateTime(remindDate)}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: colors.bg }]}>
          <Text style={[styles.statusText, { color: colors.text }]}>{colors.label}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1EA' },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: '#1F1B16' },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FCEFC8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  listContent: { paddingHorizontal: 24, paddingBottom: 32, gap: 10 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressed: { opacity: 0.85 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  cardLeft: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1F1B16' },
  cardBody: { fontSize: 13, color: '#6B6258' },
  cardDate: { fontSize: 12, color: '#A89E91' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '600' },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FCEFC8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#1F1B16', textAlign: 'center' },
  emptyBody: {
    fontSize: 15,
    color: '#6B6258',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FCEFC8',
  },
  emptyBtnText: { fontSize: 15, fontWeight: '600', color: '#9B5F0B' },
});
