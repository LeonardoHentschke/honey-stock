import React, { Fragment, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet,
  Switch, TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  ArrowLeft, User, Building2, Bell, BellRing, ShoppingCart,
  AlertTriangle, BarChart3, Warehouse, CheckCircle2,
} from 'lucide-react-native';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { useSettingsStore } from '@/shared/stores/settingsStore';
import { supabase } from '@/shared/lib/supabase';
import { useDashboardViewModel } from '@/features/dashboard/viewmodels/useDashboardViewModel';

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children.toUpperCase()}</Text>;
}

function Sep() {
  return <View style={styles.sep} />;
}

interface RowToggleProps {
  Icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}
function RowToggle({ Icon, label, sub, value, onChange }: RowToggleProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon size={18} color="#9B5F0B" />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub}>{sub}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#E7E2D9', true: '#E89B12' }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

interface RowNavProps {
  Icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  sub: string;
  trailing?: React.ReactNode;
}
function RowNav({ Icon, label, sub, trailing }: RowNavProps) {
  return (
    <View style={styles.row}>
      <View style={styles.rowIcon}>
        <Icon size={18} color="#9B5F0B" />
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text>
      </View>
      {trailing ?? null}
    </View>
  );
}

export function SettingsScreen() {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile, session } = useAuth();
  const { companyName } = useDashboardViewModel();
  const settings = useSettingsStore();

  const queryClient = useQueryClient();
  const [editingName, setEditingName] = useState(false);
  const [companyInput, setCompanyInput] = useState('');
  const [savingName, setSavingName] = useState(false);

  const handleEditName = () => {
    setCompanyInput(companyName || '');
    setEditingName(true);
  };

  const handleSaveName = async () => {
    if (!companyInput.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase
        .from('companies')
        .update({ name: companyInput.trim() })
        .eq('id', profile!.company_id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['dashboard', profile!.company_id] });
      setEditingName(false);
    } catch {
      Alert.alert('Erro', 'Não foi possível salvar o nome da empresa.');
    } finally {
      setSavingName(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.back}>
          <ArrowLeft size={22} color="#1F1B16" />
        </Pressable>
        <Text style={styles.title}>Configurações</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>

        {/* ── Conta ── */}
        <SectionLabel>Conta</SectionLabel>
        <View style={styles.card}>
          {/* Empresa */}
          {editingName ? (
            <View style={styles.editRow}>
              <TextInput
                style={styles.nameInput}
                value={companyInput}
                onChangeText={setCompanyInput}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSaveName}
              />
              <Pressable onPress={handleSaveName} style={styles.saveBtn} disabled={savingName}>
                {savingName
                  ? <ActivityIndicator size="small" color="#FFFFFF" />
                  : <Text style={styles.saveBtnText}>Salvar</Text>}
              </Pressable>
            </View>
          ) : (
            <Pressable onPress={handleEditName}>
              <RowNav
                Icon={Building2}
                label={companyName || '—'}
                sub="Nome do negócio · toque para editar"
              />
            </Pressable>
          )}
          <Sep />
          <RowNav
            Icon={User}
            label={profile?.full_name ?? '—'}
            sub={session?.user?.email ?? ''}
          />
        </View>

        {/* ── Vendas e estoque ── */}
        <SectionLabel>Vendas e estoque</SectionLabel>
        <View style={styles.card}>
          <RowToggle
            Icon={AlertTriangle}
            label="Alerta de estoque baixo"
            sub="Avisar quando atingir o mínimo"
            value={settings.lowStockAlert}
            onChange={settings.setLowStockAlert}
          />
        </View>

        {/* ── Notificações ── */}
        <SectionLabel>Notificações</SectionLabel>
        <View style={styles.card}>
          <RowToggle
            Icon={CheckCircle2}
            label="Venda registrada"
            sub="Confirmação a cada venda"
            value={settings.notifSale}
            onChange={settings.setNotifSale}
          />
          <Sep />
          <RowToggle
            Icon={AlertTriangle}
            label="Estoque baixo"
            sub="Push quando um item acabar"
            value={settings.notifLowStock}
            onChange={settings.setNotifLowStock}
          />
          <Sep />
          <RowToggle
            Icon={BellRing}
            label="Lembretes"
            sub="Cobranças e entregas agendadas"
            value={settings.notifReminders}
            onChange={settings.setNotifReminders}
          />
          <Sep />
          <RowToggle
            Icon={BarChart3}
            label="Resumo semanal"
            sub="Relatório toda segunda 08h"
            value={settings.notifWeeklySummary}
            onChange={settings.setNotifWeeklySummary}
          />
        </View>

        {/* ── Sobre ── */}
        <SectionLabel>Sobre</SectionLabel>
        <View style={styles.card}>
          <RowNav
            Icon={Warehouse}
            label="Mel Manager"
            sub="v1.0.0 · build 1"
          />
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1EA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  back: {
    width: 40, height: 40,
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 20,
  },
  title: { fontSize: 20, lineHeight: 28, fontWeight: '700', color: '#1F1B16' },

  content: { paddingBottom: 40 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#A89E91',
    letterSpacing: 0.8, paddingHorizontal: 24,
    marginTop: 20, marginBottom: 8,
  },

  card: {
    marginHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#FCEFC8',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 14,
  },
  rowText: { flex: 1, minWidth: 0 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: '#1F1B16', lineHeight: 22 },
  rowSub: { fontSize: 12, color: '#6B6258', lineHeight: 16, marginTop: 1 },

  sep: { height: 1, backgroundColor: '#F0ECE5', marginLeft: 66 },

  editRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 10,
  },
  nameInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#E89B12',
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#1F1B16',
    backgroundColor: '#FEF9EC',
  },
  saveBtn: {
    height: 44,
    paddingHorizontal: 16,
    backgroundColor: '#E89B12',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 14, fontWeight: '600', color: '#FFFFFF' },
});
