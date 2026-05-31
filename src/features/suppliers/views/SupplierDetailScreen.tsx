import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ArrowLeft, Pencil, Phone, Mail, FileText, MapPin, StickyNote } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';

import { useSupplierDetailViewModel } from '../viewmodels/useSupplierDetailViewModel';
import { SupplierFormSheet } from './components/SupplierFormSheet';
import { humanizeError } from '@/shared/lib/errors';
import type { ContactsStackParamList } from '@/navigation/types';

type Route = RouteProp<ContactsStackParamList, 'SupplierDetail'>;

export function SupplierDetailScreen() {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<Route>();
  const { supplierId } = route.params;
  const vm = useSupplierDetailViewModel(supplierId);

  function confirmDeactivate() {
    Alert.alert(
      'Desativar fornecedor',
      'Este fornecedor será desativado e não aparecerá mais nas listas. Esta ação pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desativar', style: 'destructive', onPress: () => vm.deactivate() },
      ],
    );
  }

  if (vm.isLoading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color="#C47C0A" size="large" />
      </View>
    );
  }

  if (!vm.supplier) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Text style={styles.errorText}>Fornecedor não encontrado.</Text>
        <Pressable onPress={() => navigation.goBack()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Voltar</Text>
        </Pressable>
      </View>
    );
  }

  const { supplier } = vm;

  return (
    <View style={styles.root}>
      {/* ── Header ───────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.iconBtn}>
          <ArrowLeft size={22} color="#1F1B16" />
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{supplier.name}</Text>
        <Pressable onPress={vm.openEditSheet} hitSlop={8} style={[styles.iconBtn, styles.editBtn]}>
          <Pencil size={18} color="#9B5F0B" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={vm.isRefetching}
            onRefresh={vm.refresh}
            tintColor="#C47C0A"
            colors={['#C47C0A']}
          />
        }
      >
        {/* ── Contato ──────────────────────────────────────── */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Contato</Text>
          {supplier.phone && <InfoRow Icon={Phone} label="Telefone" value={supplier.phone} />}
          {supplier.email && <InfoRow Icon={Mail} label="E-mail" value={supplier.email} />}
          {supplier.document && <InfoRow Icon={FileText} label="Documento" value={supplier.document} />}
          {supplier.address && <InfoRow Icon={MapPin} label="Endereço" value={supplier.address} />}
          {supplier.notes && <InfoRow Icon={StickyNote} label="Notas" value={supplier.notes} />}
          {!supplier.phone && !supplier.email && !supplier.document && !supplier.address && !supplier.notes && (
            <Text style={styles.empty}>Nenhum dado de contato cadastrado.</Text>
          )}
        </View>

        {/* ── Desativar ─────────────────────────────────── */}
        {supplier.is_active && (
          <Pressable style={styles.deactivateBtn} onPress={confirmDeactivate}>
            <Text style={styles.deactivateBtnText}>
              {vm.isDeactivating ? 'Desativando...' : 'Desativar fornecedor'}
            </Text>
          </Pressable>
        )}
        {!supplier.is_active && (
          <View style={styles.inactiveCard}>
            <Text style={styles.inactiveText}>Este fornecedor está desativado.</Text>
          </View>
        )}
      </ScrollView>

      <SupplierFormSheet
        visible={vm.showEditSheet}
        editingSupplier={supplier}
        isSaving={vm.isSaving}
        error={vm.saveError ? humanizeError(vm.saveError) : null}
        onSave={vm.updateSupplier}
        onClose={vm.closeEditSheet}
      />
    </View>
  );
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

function InfoRow({
  Icon,
  label,
  value,
}: {
  Icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Icon size={15} color="#A89E91" />
      <View style={styles.infoTextBlock}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1EA' },
  centered: { alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  editBtn: { backgroundColor: '#FCEFC8' },
  headerTitle: { flex: 1, fontSize: 18, lineHeight: 26, fontWeight: '600', color: '#1F1B16' },

  content: { padding: 24, gap: 16, paddingBottom: 40 },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    gap: 14,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: { fontSize: 13, fontWeight: '600', color: '#A89E91', textTransform: 'uppercase', letterSpacing: 0.5 },

  infoRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  infoTextBlock: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#A89E91', marginBottom: 1 },
  infoValue: { fontSize: 14, color: '#1F1B16' },

  empty: { fontSize: 14, color: '#A89E91', textAlign: 'center', paddingVertical: 4 },

  deactivateBtn: {
    alignItems: 'center', paddingVertical: 14, borderRadius: 10,
    borderWidth: 1, borderColor: '#E7E2D9', backgroundColor: '#FFFFFF',
  },
  deactivateBtnText: { fontSize: 14, color: '#B3261E' },

  inactiveCard: {
    backgroundColor: '#FFF8E1', borderRadius: 10, padding: 14, alignItems: 'center',
  },
  inactiveText: { fontSize: 14, color: '#C77700' },

  errorText: { fontSize: 15, color: '#6B6258' },
  backLink: { marginTop: 12 },
  backLinkText: { fontSize: 15, color: '#C47C0A', fontWeight: '600' },
});
