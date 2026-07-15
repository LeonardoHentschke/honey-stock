import React, { Fragment, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  BarChart3,
  LogOut,
  ChevronRight,
  User,
  Building2,
  ArrowLeftRight,
  ShoppingBag,
  Users,
  Settings,
  UserPlus,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useAuth } from '@/shared/hooks/useAuth';
import { InviteCodeModal } from '@/shared/components/InviteCodeModal';
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

  const GROUPS: MenuGroup[] = [
    {
      title: 'Operação',
      items: [
        {
          Icon: ShoppingBag,
          label: 'Vendas',
          subtitle: 'Histórico e agendadas',
          onPress: () => navigation.navigate('SalesHistory'),
        },
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
          Icon: Users,
          label: 'Equipe',
          subtitle: 'Membros da empresa',
          onPress: () => navigation.navigate('Team'),
        },
        {
          Icon: UserPlus,
          label: 'Convidar membro',
          subtitle: 'Compartilhar código de convite',
          onPress: () => setInviteVisible(true),
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
      <View style={[styles.titleArea, { paddingTop: top + 12 }]}>
        <Text style={styles.title}>Mais</Text>
        {/* espaçador de 40dp: mantém o título na mesma posição vertical das
            telas cujo header tem botão de 40dp */}
        <View style={styles.titleSpacer} />
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

      {/* ── Modal código de convite — compartilhado com a tela Equipe ── */}
      <InviteCodeModal
        visible={inviteVisible}
        code={inviteCode}
        isLoading={inviteLoading}
        onClose={() => setInviteVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1EA' },

  titleArea: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  titleSpacer: { width: 40, height: 40 },
  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
    color: '#1F1B16',
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
});
