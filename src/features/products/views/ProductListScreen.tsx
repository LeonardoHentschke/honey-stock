import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Plus, Search, Package } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, ButtonText } from '@/components/ui/button';

/**
 * Tela de lista de produtos.
 * Sprint 2 implementará listagem real + CRUD.
 * Por ora: empty state com design Honey Control (remix).
 */
export function ProductListScreen() {
  const { top } = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      {/* ── Header ───────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: top + 12 }]}>
        <Text style={styles.headerTitle}>Produtos</Text>
        <Pressable
          style={styles.addBtn}
          accessibilityLabel="Novo produto"
        >
          <Plus size={20} color="#9B5F0B" />
        </Pressable>
      </View>

      {/* ── Search bar (estática) ─────────────────────────── */}
      <View style={styles.searchPadding}>
        <View style={styles.searchBar}>
          <Search size={18} color="#A89E91" />
          <Text style={styles.searchPlaceholder}>Buscar produto ou SKU...</Text>
        </View>
      </View>

      {/* ── Empty state ───────────────────────────────────── */}
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconWrap}>
          <Package size={36} color="#F5C859" />
        </View>
        <Text style={styles.emptyTitle}>Nenhum produto cadastrado</Text>
        <Text style={styles.emptyBody}>
          Adicione seus primeiros produtos para começar a registrar vendas.
        </Text>
        <Button variant="secondary" className="mt-6">
          <Plus size={18} color="#9B5F0B" />
          <ButtonText>Adicionar produto</ButtonText>
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F1EA',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#1F1B16',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FCEFC8',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Search
  searchPadding: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E7E2D9',
  },
  searchPlaceholder: {
    fontSize: 15,
    lineHeight: 22,
    color: '#A89E91',
  },

  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FCEFC8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    color: '#1F1B16',
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B6258',
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 260,
  },
});
