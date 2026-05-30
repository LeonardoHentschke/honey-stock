import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { X, Search, UserRound } from 'lucide-react-native';
import type { Customer } from '@/features/customers/models/customerService';

interface Props {
  visible: boolean;
  customers: Customer[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (customer: Customer | null) => void;
  onClose: () => void;
}

export function CustomerSelectorSheet({
  visible,
  customers,
  isLoading,
  selectedId,
  onSelect,
  onClose,
}: Props) {
  const [search, setSearch] = useState('');

  const filtered = search.trim()
    ? customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          (c.business_name ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : customers;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.root}>
        <View style={styles.header}>
          <Text style={styles.title}>Selecionar cliente</Text>
          <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
            <X size={20} color="#6B6258" />
          </Pressable>
        </View>

        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Search size={18} color="#A89E91" />
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar cliente..."
              placeholderTextColor="#A89E91"
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#C47C0A" />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            keyboardShouldPersistTaps="handled"
            ListHeaderComponent={
              <Pressable
                style={[styles.row, !selectedId && styles.rowSelected]}
                onPress={() => { onSelect(null); onClose(); }}
              >
                <UserRound size={18} color="#A89E91" />
                <Text style={styles.rowNone}>Sem cliente (avulso)</Text>
              </Pressable>
            }
            renderItem={({ item }) => (
              <Pressable
                style={[styles.row, selectedId === item.id && styles.rowSelected]}
                onPress={() => { onSelect(item); onClose(); }}
              >
                <View style={styles.rowInfo}>
                  <Text style={styles.rowName}>{item.name}</Text>
                  {item.business_name ? (
                    <Text style={styles.rowSub}>{item.business_name}</Text>
                  ) : null}
                </View>
                <View style={[styles.badge, item.type === 'reseller' ? styles.badgeReseller : styles.badgeFinal]}>
                  <Text style={[styles.badgeText, item.type === 'reseller' ? styles.badgeTextReseller : styles.badgeTextFinal]}>
                    {item.type === 'reseller' ? 'Revenda' : 'Final'}
                  </Text>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>Nenhum cliente encontrado</Text>
              </View>
            }
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1EA' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#1F1B16' },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E7E2D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchWrap: { paddingHorizontal: 24, paddingBottom: 12 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E7E2D9',
  },
  searchInput: { flex: 1, fontSize: 15, color: '#1F1B16' },
  list: { paddingHorizontal: 24, paddingBottom: 32, gap: 8 },
  row: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  rowSelected: { borderColor: '#E89B12' },
  rowNone: { fontSize: 15, color: '#6B6258', flex: 1 },
  rowInfo: { flex: 1, gap: 2 },
  rowName: { fontSize: 15, fontWeight: '600', color: '#1F1B16' },
  rowSub: { fontSize: 13, color: '#6B6258' },
  badge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6 },
  badgeFinal: { backgroundColor: '#EFF6FF' },
  badgeReseller: { backgroundColor: '#FCEFC8' },
  badgeText: { fontSize: 11, fontWeight: '600' },
  badgeTextFinal: { color: '#1D4ED8' },
  badgeTextReseller: { color: '#9B5F0B' },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { fontSize: 15, color: '#6B6258' },
});
