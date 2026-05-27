import React, { Fragment, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  BellRing,
  Bell,
  BarChart2,
  Users,
  Share2,
  Settings,
  LogOut,
  ChevronRight,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HoneyLogo } from '@/components/ui/honey-logo';
import { SectionHeader } from '@/components/ui/section-header';
import { useAuth } from '@/shared/hooks/useAuth';
import { signOut } from '@/features/auth/models/authService';

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

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await signOut();
      // RootNavigator troca automaticamente para AuthStack quando session = null
    } catch {
      setLoggingOut(false);
    }
  };

  const GROUPS: MenuGroup[] = [
    {
      title: 'Operação',
      items: [
        {
          Icon: BellRing,
          label: 'Lembretes',
          subtitle: '2 pendentes',
          onPress: null,
        },
        {
          Icon: Bell,
          label: 'Notificações',
          subtitle: '4 não lidas',
          onPress: null,
        },
        {
          Icon: BarChart2,
          label: 'Relatórios',
          subtitle: 'Vendas, estoque, ranking',
          onPress: null,
        },
      ],
    },
    {
      title: 'Cadastros',
      items: [
        {
          Icon: Users,
          label: 'Equipe',
          subtitle: '2 membros · você é admin',
          onPress: null,
        },
        {
          Icon: Share2,
          label: 'Convidar membro',
          subtitle: 'Gerar código de convite',
          onPress: null,
        },
      ],
    },
    {
      title: 'Conta',
      items: [
        {
          Icon: Settings,
          label: 'Configurações',
          subtitle: 'Conta, integrações, backup',
          onPress: null,
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
              <Text style={styles.companyName}>Apiário Taquari</Text>
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
        <Text style={styles.version}>Honey Control v0.1.0 · build 1</Text>
      </ScrollView>
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
    marginLeft: 56, // alinha com o texto após o ícone
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 16,
    color: '#A89E91',
    paddingBottom: 24,
    paddingTop: 4,
  },
});
