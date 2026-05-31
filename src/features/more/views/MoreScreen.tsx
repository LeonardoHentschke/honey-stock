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
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  BarChart3,
  LogOut,
  ChevronRight,
  Tags,
  Tag,
  User,
  Copy,
  Building2,
  ArrowLeftRight,
  Truck,
  Users,
  Settings,
  UserPlus,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '@/shared/hooks/useAuth';
import { signOut, getInviteCode } from '@/features/auth/models/authService';
import { useDashboardViewModel } from '@/features/dashboard/viewmodels/useDashboardViewModel';
import type { MoreStackParamList } from '@/navigation/types';

interface MenuItem {
  Icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  subtitle?: string;
  onPress?: (() => void) | null;
  danger?: boolean;
  badge?: string;
}

interface MenuGroup {
  title: string;
  items: MenuItem[];
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

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
    try { await signOut(); } catch { setLoggingOut(false); }
  };

  const handleShareInvite = async () => {
    if (!inviteCode) return;
    await Share.share({ message: `Entre no Mel Manager com o código de convite: ${inviteCode}` });
  };

  const GROUPS: MenuGroup[] = [
    {
      title: 'Operação',
      items: [
        {
          Icon: Bell,
          label: 'Lembretes',
          subtitle: pendingRemindersCount > 0
            ? `${pendingRemindersCount} pendente${pendingRemindersCount !== 1 ? 's' : ''}`
            : 'Nenhum pendente',
          badge: pendingRemindersCount > 0 ? String(pendingRemindersCount) : undefined,
          onPress: () => navigation.navigate('Reminders'),
        },
        {
          Icon: Bell,
          label: 'Notificações',
          subtitle: 'Histórico de notificações',
          onPress: () => navigation.navigate('Notifications'),
        },
        {
          Icon: BarChart3,
          label: 'Relatórios',
          subtitle: 'Vendas, estoque, ranking',
          onPress: () => navigation.navigate('Reports'),
        },
        {
          Icon: ArrowLeftRight,
          label: 'Movimentações de estoque',
          subtitle: 'Entradas, saídas e ajustes',
          onPress: () => navigation.navigate('StockMoves'),
        },
      ],
    },
    {
      title: 'Cadastros',
      items: [
        {
          Icon: Tags,
          label: 'Lotes de produção',
          subtitle: 'Rastreabilidade por envase',
          onPress: () => navigation.navigate('Batches'),
        },
        {
          Icon: Tag,
          label: 'Categoria',
          subtitle: 'Organizar produtos',
          onPress: () => navigation.navigate('Categories'),
        },
        {
          Icon: Truck,
          label: 'Fornecedores',
          subtitle: 'Gestão de fornecedores',
          onPress: () => navigation.navigate('Suppliers'),
        },
        {
          Icon: Users,
          label: 'Equipe',
          subtitle: 'Membros da empresa',
          onPress: () => navigation.navigate('Team'),
        },
      ],
    },
    {
      title: 'Conta',
      items: [
        {
          Icon: Settings,
          label: 'Configurações',
          subtitle: 'Preferências do app',
          onPress: () => navigation.navigate('Settings'),
        },
        {
          Icon: UserPlus,
          label: 'Convidar membro',
          subtitle: 'Adicionar membro à empresa',
          onPress: () => setInviteVisible(true),
        },
        {
          Icon: User,
          label: 'Perfil',
          subtitle: profile?.full_name ?? 'Meu perfil',
          onPress: () => navigation.navigate('Profile'),
        },
        {
          Icon: LogOut,
          label: loggingOut ? 'Saindo...' : 'Sair',
          subtitle: session?.user?.email ?? '',
          onPress: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  const initials = profile?.full_name ? getInitials(profile.full_name) : '?';

  return (
    <View style={styles.root}>
      {/* ── Título ────────────────────────────────────────────── */}
      <View style={[styles.titleArea, { paddingTop: top + 8 }]}>
        <Text style={styles.title}>Mais</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* ── Company hero card ─────────────────────────────── */}
        <View style={styles.heroPad}>
          <LinearGradient
            colors={['#9B5F0B', '#C47C0A', '#E89B12']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.heroCard}
          >
            {/* Avatar com iniciais */}
            <View style={styles.heroAvatar}>
              <Text style={styles.heroAvatarText}>{initials}</Text>
            </View>

            <View style={styles.heroText}>
              <Text style={styles.heroCompany} numberOfLines={1}>
                {companyName || '—'}
              </Text>
              <View style={styles.heroMeta}>
                <Text style={styles.heroMetaText}>{profile?.full_name ?? '—'}</Text>
                <View style={styles.heroDot} />
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>admin</Text>
                </View>
              </View>
            </View>

            {/* Ícone de empresa decorativo */}
            <View style={styles.heroIconWrap}>
              <Building2 size={20} color="rgba(255,255,255,0.35)" />
            </View>
          </LinearGradient>
        </View>

        {/* ── Grupos de menu ─────────────────────────────────── */}
        {GROUPS.map((group) => (
          <View key={group.title} style={styles.group}>
            <Text style={styles.groupLabel}>{group.title.toUpperCase()}</Text>

            <View style={styles.groupCard}>
              {group.items.map((item, i) => (
                <Fragment key={item.label}>
                  <Pressable
                    onPress={item.onPress ?? undefined}
                    disabled={!item.onPress}
                    style={({ pressed }) => pressed && item.onPress ? styles.itemPressed : undefined}
                  >
                    <View style={styles.item}>
                      {/* Ícone */}
                      <View style={[styles.iconWrap, item.danger && styles.iconWrapDanger]}>
                        {loggingOut && item.danger ? (
                          <ActivityIndicator size="small" color="#B3261E" />
                        ) : (
                          <item.Icon size={22} color={item.danger ? '#B3261E' : '#9B5F0B'} />
                        )}
                      </View>

                      {/* Texto */}
                      <View style={styles.itemText}>
                        <Text style={[styles.itemLabel, item.danger && styles.itemLabelDanger]}>
                          {item.label}
                        </Text>
                        {item.subtitle ? (
                          <Text style={styles.itemSub}>{item.subtitle}</Text>
                        ) : null}
                      </View>

                      {/* Chevron */}
                      {(!loggingOut || !item.danger) && (
                        <View style={styles.chevron}>
                          <ChevronRight size={20} color="#A89E91" />
                        </View>
                      )}
                    </View>
                  </Pressable>

                  {i < group.items.length - 1 && <View style={styles.sep} />}
                </Fragment>
              ))}
            </View>
          </View>
        ))}

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
            <Text style={styles.inviteSub}>
              Compartilhe com quem vai entrar na empresa
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
                style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.85 }]}
                onPress={handleShareInvite}
                disabled={!inviteCode}
              >
                <View style={styles.shareBtnInner}>
                  <Copy size={16} color="#9B5F0B" />
                  <Text style={styles.shareBtnText}>Compartilhar</Text>
                </View>
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1EA' },

  titleArea: {
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: '#1F1B16',
    letterSpacing: -0.3,
  },

  scrollContent: { paddingBottom: 32 },

  // ── Hero card ──────────────────────────────────────────────
  heroPad: { paddingHorizontal: 24, paddingBottom: 24 },
  heroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 16,
    padding: 18,
    overflow: 'hidden',
  },
  heroAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroText: { flex: 1, minWidth: 0 },
  heroCompany: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  heroMetaText: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  heroDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  heroBadge: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  heroBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
    letterSpacing: 0.3,
  },
  heroIconWrap: { marginLeft: 4 },

  // ── Groups ────────────────────────────────────────────────
  group: { marginBottom: 20 },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A89E91',
    letterSpacing: 0.8,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  groupCard: {
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

  // ── Item (layout horizontal, igual ao dashboard) ─────────
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  itemPressed: { backgroundColor: '#FAF6F1' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FCEFC8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  iconWrapDanger: { backgroundColor: '#FFEBEE' },
  itemText: {
    flex: 1,
    minWidth: 0,
  },
  itemLabel: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#1F1B16',
  },
  itemLabelDanger: { color: '#B3261E' },
  itemSub: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B6258',
    marginTop: 2,
  },
  chevron: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sep: {
    height: 1,
    backgroundColor: '#F0ECE5',
    marginLeft: 74,
  },

  version: {
    textAlign: 'center',
    fontSize: 12,
    color: '#A89E91',
    paddingTop: 8,
    paddingBottom: 24,
  },

  // ── Invite modal ─────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(31,27,22,0.5)',
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
  inviteSub: {
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
  inviteActions: { width: '100%', gap: 10 },
  shareBtn: {
    backgroundColor: '#FCEFC8',
    borderRadius: 12,
    paddingVertical: 14,
  },
  shareBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  shareBtnText: { fontSize: 15, fontWeight: '600', color: '#9B5F0B' },
  closeBtn: { alignItems: 'center', paddingVertical: 12 },
  closeBtnText: { fontSize: 15, fontWeight: '500', color: '#6B6258' },
});
