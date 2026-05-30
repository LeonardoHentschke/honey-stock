import React from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, Plus, Search, Tags, Pencil } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useBatchListViewModel } from '../viewmodels/useBatchListViewModel';
import { BatchFormSheet } from './components/BatchFormSheet';
import type { Batch } from '../models/batchService';

export function BatchListScreen() {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation();
  const vm = useBatchListViewModel();

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <ArrowLeft size={22} color="#1F1B16" />
        </Pressable>
        <Text style={styles.title}>Lotes</Text>
        <Pressable onPress={vm.openCreate} style={styles.addBtn} accessibilityLabel="Novo lote">
          <Plus size={20} color="#9B5F0B" />
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchPadding}>
        <View style={styles.searchBar}>
          <Search size={18} color="#A89E91" />
          <TextInput
            style={styles.searchInput}
            value={vm.search}
            onChangeText={vm.setSearch}
            placeholder="Buscar por código..."
            placeholderTextColor="#A89E91"
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {vm.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#C47C0A" size="large" />
        </View>
      ) : (
        <FlatList
          data={vm.batches}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            vm.batches.length === 0 ? styles.flex : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.refresh}
              tintColor="#C47C0A"
              colors={['#C47C0A']}
            />
          }
          renderItem={({ item }) => (
            <BatchCard batch={item} onEdit={() => vm.openEdit(item)} />
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Tags size={36} color="#F5C859" />
              </View>
              <Text style={styles.emptyTitle}>
                {vm.search ? 'Nenhum lote encontrado' : 'Nenhum lote cadastrado'}
              </Text>
              <Text style={styles.emptyBody}>
                {vm.search
                  ? 'Tente outro código.'
                  : 'Crie lotes para rastrear envases por data e validade.'}
              </Text>
              {!vm.search && (
                <Pressable style={styles.emptyBtn} onPress={vm.openCreate}>
                  <Plus size={18} color="#9B5F0B" />
                  <Text style={styles.emptyBtnText}>Criar primeiro lote</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}

      <BatchFormSheet
        visible={vm.showFormSheet}
        editingBatch={vm.editingBatch}
        isSaving={vm.isSaving}
        error={vm.mutationError}
        onSave={vm.saveBatch}
        onClose={vm.closeSheet}
      />
    </View>
  );
}

// ─── BatchCard ───────────────────────────────────────────────────────────────

function BatchCard({ batch, onEdit }: { batch: Batch; onEdit: () => void }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let expiryBadge: { label: string; color: string; bg: string } | null = null;
  if (batch.expires_at) {
    const exp = new Date(batch.expires_at + 'T00:00:00');
    const daysLeft = Math.floor((exp.getTime() - today.getTime()) / 86_400_000);
    if (daysLeft < 0) {
      expiryBadge = { label: 'Vencido', color: '#B3261E', bg: '#FDECEA' };
    } else if (daysLeft <= 30) {
      expiryBadge = { label: `Vence em ${daysLeft}d`, color: '#C77700', bg: '#FFF8E1' };
    }
  }

  function formatIso(iso: string | null): string {
    if (!iso) return '—';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardCode}>{batch.code}</Text>
        <View style={styles.cardActions}>
          {expiryBadge && (
            <View style={[styles.badge, { backgroundColor: expiryBadge.bg }]}>
              <Text style={[styles.badgeText, { color: expiryBadge.color }]}>
                {expiryBadge.label}
              </Text>
            </View>
          )}
          <Pressable onPress={onEdit} hitSlop={8} style={styles.editBtn}>
            <Pencil size={15} color="#A89E91" />
          </Pressable>
        </View>
      </View>

      <View style={styles.cardDates}>
        <DateItem label="Colheita" value={formatIso(batch.harvested_at)} />
        <DateItem label="Validade" value={formatIso(batch.expires_at)} />
      </View>

      {batch.notes ? (
        <Text style={styles.cardNotes} numberOfLines={2}>
          {batch.notes}
        </Text>
      ) : null}
    </View>
  );
}

function DateItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.dateItem}>
      <Text style={styles.dateLabel}>{label}</Text>
      <Text style={styles.dateValue}>{value}</Text>
    </View>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1EA' },
  flex: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 12, gap: 8,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: '#1F1B16' },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FCEFC8', alignItems: 'center', justifyContent: 'center',
  },

  searchPadding: { paddingHorizontal: 24, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 10, height: 44,
    paddingHorizontal: 12, gap: 8,
    borderWidth: 1, borderColor: '#E7E2D9',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1F1B16' },

  listContent: { paddingHorizontal: 24, paddingBottom: 32, gap: 12 },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 14,
    padding: 16, gap: 10,
    shadowColor: '#1F1B16', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardCode: { fontSize: 16, fontWeight: '700', color: '#1F1B16' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  editBtn: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: '#F5F1EA', alignItems: 'center', justifyContent: 'center',
  },
  cardDates: { flexDirection: 'row', gap: 24 },
  dateItem: { gap: 1 },
  dateLabel: { fontSize: 11, color: '#A89E91' },
  dateValue: { fontSize: 13, fontWeight: '500', color: '#3B342B' },
  cardNotes: { fontSize: 13, color: '#6B6258' },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FCEFC8', alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#1F1B16', textAlign: 'center' },
  emptyBody: { fontSize: 15, color: '#6B6258', textAlign: 'center', marginTop: 8, maxWidth: 260 },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 20, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, backgroundColor: '#FCEFC8',
  },
  emptyBtnText: { fontSize: 15, fontWeight: '600', color: '#9B5F0B' },
});
