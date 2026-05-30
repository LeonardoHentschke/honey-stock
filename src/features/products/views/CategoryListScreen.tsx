import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  RefreshControl,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ArrowLeft, Plus, Tag, Pencil, Trash2, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useCategoryListViewModel } from '../viewmodels/useCategoryListViewModel';
import type { Category } from '../models/categoryService';

export function CategoryListScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const navigation = useNavigation();
  const vm = useCategoryListViewModel();

  function confirmRemove(cat: Category) {
    Alert.alert(
      'Remover categoria',
      `Remover "${cat.name}"? Os produtos vinculados ficarão sem categoria.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Remover', style: 'destructive', onPress: () => vm.removeCategory(cat.id) },
      ]
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <ArrowLeft size={22} color="#1F1B16" />
        </Pressable>
        <Text style={styles.title}>Categorias</Text>
        <Pressable onPress={vm.openCreate} style={styles.addBtn} accessibilityLabel="Nova categoria">
          <Plus size={20} color="#9B5F0B" />
        </Pressable>
      </View>

      {vm.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#C47C0A" size="large" />
        </View>
      ) : (
        <FlatList
          data={vm.categories}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            vm.categories.length === 0 ? styles.flex : styles.listContent
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
            <View style={styles.card}>
              <View style={styles.cardIconWrap}>
                <Tag size={18} color="#9B5F0B" />
              </View>
              <Text style={styles.cardName}>{item.name}</Text>
              <Pressable onPress={() => vm.openEdit(item)} hitSlop={8} style={styles.iconBtn}>
                <Pencil size={16} color="#A89E91" />
              </Pressable>
              <Pressable onPress={() => confirmRemove(item)} hitSlop={8} style={styles.iconBtn}>
                <Trash2 size={16} color="#B3261E" />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconWrap}>
                <Tag size={36} color="#F5C859" />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma categoria</Text>
              <Text style={styles.emptyBody}>
                Crie categorias para organizar seus produtos.
              </Text>
              <Pressable style={styles.emptyBtn} onPress={vm.openCreate}>
                <Plus size={18} color="#9B5F0B" />
                <Text style={styles.emptyBtnText}>Criar categoria</Text>
              </Pressable>
            </View>
          }
        />
      )}

      {/* Form sheet */}
      <CategoryFormSheet
        visible={vm.showFormSheet}
        initialName={vm.editingCategory?.name ?? ''}
        isEditing={!!vm.editingCategory}
        isSaving={vm.isSaving}
        error={vm.mutationError}
        onSave={vm.saveCategory}
        onClose={vm.closeSheet}
      />
    </View>
  );
}

// ─── Form sheet ─────────────────────────────────────────────────────────────

interface FormSheetProps {
  visible: boolean;
  initialName: string;
  isEditing: boolean;
  isSaving: boolean;
  error: string | null;
  onSave: (name: string) => void;
  onClose: () => void;
}

function CategoryFormSheet({
  visible, initialName, isEditing, isSaving, error, onSave, onClose,
}: FormSheetProps) {
  const { bottom } = useSafeAreaInsets();
  const [name, setName] = useState('');

  React.useEffect(() => {
    if (visible) setName(initialName);
  }, [visible, initialName]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {isEditing ? 'Editar categoria' : 'Nova categoria'}
            </Text>
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <X size={20} color="#6B6258" />
            </Pressable>
          </View>

          <View style={styles.sheetContent}>
            <Text style={styles.label}>Nome *</Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              value={name}
              onChangeText={setName}
              placeholder="Ex: Mel premium"
              placeholderTextColor="#A89E91"
              autoFocus
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={() => name.trim() && onSave(name.trim())}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
          </View>

          <View style={[styles.sheetFooter, { paddingBottom: bottom + 16 }]}>
            <Pressable
              style={[styles.saveBtn, (!name.trim() || isSaving) && styles.saveBtnDisabled]}
              onPress={() => name.trim() && onSave(name.trim())}
              disabled={!name.trim() || isSaving}
            >
              {isSaving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Salvar</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────
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
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: '#1F1B16' },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#FCEFC8',
    alignItems: 'center', justifyContent: 'center',
  },

  listContent: { paddingHorizontal: 24, paddingBottom: 32, gap: 10 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    gap: 12,
  },
  cardIconWrap: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FCEFC8',
    alignItems: 'center', justifyContent: 'center',
  },
  cardName: { flex: 1, fontSize: 15, fontWeight: '500', color: '#1F1B16' },
  iconBtn: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#FCEFC8',
    alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#1F1B16', textAlign: 'center' },
  emptyBody: {
    fontSize: 15, color: '#6B6258', textAlign: 'center',
    marginTop: 8, maxWidth: 260,
  },
  emptyBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 20, paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12, backgroundColor: '#FCEFC8',
  },
  emptyBtnText: { fontSize: 15, fontWeight: '600', color: '#9B5F0B' },

  // Sheet
  sheetContainer: { flex: 1, backgroundColor: '#F5F1EA' },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: '#E7E2D9',
    backgroundColor: '#FFFFFF',
  },
  sheetTitle: { fontSize: 17, fontWeight: '600', color: '#1F1B16' },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: '#F5F1EA',
    alignItems: 'center', justifyContent: 'center',
  },
  sheetContent: { padding: 24, gap: 6 },
  label: { fontSize: 13, fontWeight: '500', color: '#3B342B' },
  input: {
    height: 48, borderRadius: 10, borderWidth: 1,
    borderColor: '#E7E2D9', backgroundColor: '#FFFFFF',
    paddingHorizontal: 14, fontSize: 15, color: '#1F1B16',
  },
  inputError: { borderColor: '#B3261E' },
  errorText: { fontSize: 12, color: '#B3261E' },
  sheetFooter: {
    paddingHorizontal: 24, paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#E7E2D9',
  },
  saveBtn: {
    height: 52, borderRadius: 14, backgroundColor: '#E89B12',
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
});
