import React, { Fragment, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Share,
} from 'react-native';
import {
  BellRing,
  BarChart2,
  Share2,
  LogOut,
  ChevronRight,
  Tags,
  Tag,
  User,
  Copy,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { HoneyLogo } from '@/components/ui/honey-logo';
import { SectionHeader } from '@/components/ui/section-header';
import { useAuth } from '@/shared/hooks/useAuth';
import { signOut, getInviteCode } from '@/features/auth/models/authService';
import { useDashboardViewModel } from '@/features/dashboard/viewmodels/useDashboardViewModel';
import type { MoreStackParamList } from '@/navigation/types';

// ─── Tipos ──────────────────────────────────────────────────────────────────
interface MenuItem {
  Icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  subtitle: string;
  onPress?: (() => void) | null;
  danger?: boolean;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

// ─── MoreScreen ─────────────────────────────────────────────────────────────
export function MoreScreen() {
  const { profile, session } = useAuth();
  const { top } = useSafeAreaInsets();
  const [loggingOut, setLoggingOut] = useState(false);
  const [inviteVisible, setInviteVisible] = useState(false);
  const navigation = useNavigation<NativeStackNavigationProp<MoreStackParamList>>();
  const { pendingRemindersCount, companyName } = useDashboardViewModel();

  const { data: inviteCode, isLoading: inviteLoading } = useQuery({
    queryKey: ['inviteCode'],
    queryFn: getInviteCode,
    enabled: inviteVisible,
    staleTime: 10 * 60_000,
  });

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
    } catch {
      setLoggingOut(false);
    }
  };

  const handleShareInvite = async () => {
    if (!inviteCode) return;
    await Share.share({
      message: `Entre no Mel Manager com o código de convite: ${inviteCode}`,
    });
  };

  const GROUPS: MenuGroup[] = [
    {
      title: 'Operação',
      items: [
        {
          Icon: BellRing,
          label: 'Lembretes',
          subtitle: pendingRemindersCount > 0
            ? `${pendingRemindersCount} pendente${pendingRemindersCount !== 1 ? 's' : ''}`
            : 'Nenhum pendente',
          onPress: () => navigation.navigate('Reminders'),
        },
        {
          Icon: BarChart2,
          label: 'Relatórios',
          subtitle: 'Vendas, estoque, ranking',
          onPress: () => navigation.navigate('Reports'),
        },
      ],
    },
    {
      title: 'Cadastros',
      items: [
        {
          Icon: Tags,
          label: 'Lotes',
          subtitle: 'Rastreabilidade por envase',
          onPress: () => navigation.navigate('Batches'),
        },
        {
          Icon: Tag,
          label: 'Categorias',
          subtitle: 'Organizar produtos',
          onPress: () => navigation.navigate('Categories'),
        },
        {
          Icon: Share2,
          label: 'Código de convite',
          subtitle: 'Convidar novo membro',
          onPress: () => setInviteVisible(true),
        },
      ],
    },
    {
      title: 'Conta',
      items: [
        {
          Icon: User,
          label: 'Perfil',
          subtitle: profile?.full_name ?? 'Meu perfil',
          onPress: () => navigation.navigate('Profile'),
        },
        {
          Icon: LogOut,
          label: 'Sair',
          subtitle: session?.user?.email ?? '',
          onPress: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  return (
    <View style={styles.root}>
      {/* ── Título ────────────────────────────────────────────── */}
      <View style={[styles.titleArea, { paddingTop: top + 12 }]}>
        <Text style={styles.title}>Mais</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Company card ──────────────────────────────────── */}
        <View style={styles.companyPadding}>
          <View style={styles.companyCard}>
            <HoneyLogo size={48} />
            <View style={styles.companyText}>
              <Text style={styles.companyName}>{companyName || 'Carregando...'}</Text>
              <Text style={styles.companyMeta}>
                {profile?.full_name ?? 'Usuário'} · admin · plano grátis
              </Text>
            </View>
          </View>
        </View>

        {/* ── Grupos de menu ─────────────────────────────────── */}
        {GROUPS.map((group) => (
          <View key={group.title} style={styles.group}>
            <SectionHeader>{group.title}</SectionHeader>
            <View style={styles.groupCard}>
              {group.items.map((item, i) => (
                <Fragment key={item.label}>
                  <Pressable
                    onPress={item.onPress ?? undefined}
                    style={({ pressed }) => [
                      styles.menuItem,
                      pressed && item.onPress ? styles.menuItemPressed : null,
                    ]}
                    disabled={!item.onPress}
                  >
                    {/* Ícone */}
                    <View
                      style={[
                        styles.menuIcon,
                        {
                          backgroundColor: item.danger
                            ? '#FFEBEE'
                            : '#FCEFC8',
                        },
                      ]}
                    >
                      {loggingOut && item.danger ? (
                        <ActivityIndicator size="small" color="#B3261E" />
                      ) : (
                        <item.Icon
                          size={18}
                          color={item.danger ? '#B3261E' : '#9B5F0B'}
                        />
                      )}
                    </View>

                    {/* Texto */}
                    <View style={styles.menuTextBlock}>
                      <Text
                        style={[
                          styles.menuLabel,
                          item.danger && styles.menuLabelDanger,
                        ]}
                      >
                        {loggingOut && item.danger ? 'Saindo...' : item.label}
                      </Text>
                      {item.subtitle ? (
                        <Text style={styles.menuSub}>{item.subtitle}</Text>
                      ) : null}
                    </View>

                    {/* Chevron */}
                    {!loggingOut || !item.danger ? (
                      <ChevronRight size={18} color="#A89E91" />
                    ) : null}
                  </Pressable>

                  {/* Separador */}
                  {i < group.items.length - 1 && (
                    <View style={styles.separator} />
                  )}
                </Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* ── Versão ─────────────────────────────────────────── */}
        <Text style={styles.version}>Mel Manager v1.0.0 · build 1</Text>
      </ScrollView>

      {/* ── Modal código de convite ────────────────────────── */}
      <Modal
        visible={inviteVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInviteVisible(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setInviteVisible(false)}>
          <Pressable style={styles.inviteCard} onPress={() => {}}>
            <Text style={styles.inviteTitle}>Código de convite</Text>
            <Text style={styles.inviteSubtitle}>
              Compartilhe este código com quem vai entrar na empresa
            </Text>

            {inviteLoading ? (
              <ActivityIndicator size="large" color="#E89B12" style={{ marginVertical: 24 }} />
            ) : (
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{inviteCode ?? '——'}</Text>
              </View>
            )}

            <View style={styles.inviteActions}>
              <Pressable
                style={styles.shareBtn}
                onPress={handleShareInvite}
                disabled={!inviteCode}
              >
                <Copy size={16} color="#9B5F0B" />
                <Text style={styles.shareBtnText}>Compartilhar</Text>
              </Pressable>
              <Pressable style={styles.closeBtn} onPress={() => setInviteVisible(false)}>
                <Text style={styles.closeBtnText}>Fechar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F1EA',
  },
  titleArea: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#1F1B16',
  },

  // Company card
  companyPadding: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FCEFC8',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F2E8D9',
  },
  companyText: {
    flex: 1,
  },
  companyName: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    color: '#1F1B16',
  },
  companyMeta: {
    fontSize: 12,
    lineHeight: 16,
    color: '#3B342B',
    marginTop: 2,
  },

  // Groups
  group: {
    marginBottom: 24,
  },
  groupCard: {
    marginHorizontal: 24,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  menuItemPressed: {
    backgroundColor: '#F5F1EA',
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuTextBlock: {
    flex: 1,
    minWidth: 0,
  },
  menuLabel: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#1F1B16',
  },
  menuLabelDanger: {
    color: '#B3261E',
  },
  menuSub: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B6258',
    marginTop: 1,
  },
  separator: {
    height: 1,
    backgroundColor: '#E7E2D9',
    marginLeft: 56,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    color: '#A89E91',
    paddingBottom: 24,
    paddingTop: 4,
  },

  // Invite modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(31, 27, 22, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  inviteCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  inviteTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '700',
    color: '#1F1B16',
    marginBottom: 6,
  },
  inviteSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B6258',
    textAlign: 'center',
    marginBottom: 20,
  },
  codeBox: {
    backgroundColor: '#FCEFC8',
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 32,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#F9DE91',
  },
  codeText: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    color: '#9B5F0B',
    letterSpacing: 6,
  },
  inviteActions: {
    width: '100%',
    gap: 10,
  },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FCEFC8',
    borderRadius: 12,
    paddingVertical: 14,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#9B5F0B',
  },
  closeBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B6258',
  },
});
