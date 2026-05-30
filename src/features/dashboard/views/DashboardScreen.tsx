import React from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import {
  Bell,
  AlertTriangle,
  BellRing,
  ChevronRight,
  ArrowRight,
} from 'lucide-react-native';

import { HoneyLogo } from '@/components/ui/honey-logo';
import { Avatar } from '@/components/ui/avatar';
import { SectionHeader } from '@/components/ui/section-header';
import { useDashboardViewModel, type NextDelivery } from '../viewmodels/useDashboardViewModel';
import type { AppTabsParamList } from '@/navigation/types';

export function DashboardScreen() {
  const { top } = useSafeAreaInsets();
  const vm = useDashboardViewModel();
  const navigation = useNavigation<BottomTabNavigationProp<AppTabsParamList>>();

  return (
    <View style={styles.root}>
      {/* ── App header ────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Avatar initial={vm.companyInitials || '?'} size="md" />
        <View style={styles.headerText}>
          <Text style={styles.headerCompany}>{vm.companyName || '—'}</Text>
          <Text style={styles.headerGreeting}>Olá, {vm.firstName || '—'}</Text>
        </View>
        <Pressable
          style={styles.bellBtn}
          hitSlop={8}
          accessibilityLabel="Lembretes"
          onPress={() => navigation.navigate('More', { screen: 'Reminders' })}
        >
          <Bell size={22} color="#1F1B16" />
          {vm.pendingRemindersCount > 0 && <View style={styles.bellDot} />}
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={vm.isRefetching}
            onRefresh={vm.refresh}
            tintColor="#C47C0A"
            colors={['#C47C0A']}
          />
        }
      >
        {/* ── Hero card ─────────────────────────────────────── */}
        <LinearGradient
          colors={['#9B5F0B', '#C47C0A', '#E89B12']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroWatermark} pointerEvents="none">
            <HoneyLogo size={160} />
          </View>

          {vm.isLoading ? (
            <ActivityIndicator color="rgba(255,255,255,0.7)" style={styles.heroLoader} />
          ) : (
            <>
              <Text style={styles.heroDate}>{vm.heroDate}</Text>
              <Text style={styles.heroRevenue}>{vm.todayRevenue}</Text>
              <View style={styles.heroStats}>
                <StatCol label="Vendas" value={String(vm.todaySalesCount)} />
                <View style={styles.heroStatDivider} />
                <StatCol label="Mês" value={vm.monthRevenue} />
                <View style={styles.heroStatDivider} />
                <StatCol label="Mais vendido" value={vm.bestSeller} />
              </View>
            </>
          )}
        </LinearGradient>

        {/* ── Próximas entregas ─────────────────────────────── */}
        <SectionHeader style={styles.sectionMT}>Próximas entregas</SectionHeader>
        {vm.nextDeliveries.length === 0 && !vm.isLoading ? (
          <Text style={styles.emptyText}>Nenhuma entrega agendada.</Text>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.deliveriesScroll}
          >
            {vm.nextDeliveries.map((d) => (
              <DeliveryCard key={d.id} delivery={d} />
            ))}
          </ScrollView>
        )}

        {/* ── Resumo: estoque + lembretes ───────────────────── */}
        <View style={styles.summary}>
          <CardRow
            iconBg="#FFF3E0"
            iconColor="#C77700"
            Icon={AlertTriangle}
            title="Estoque baixo"
            subtitle={
              vm.lowStockCount > 0
                ? `${vm.lowStockCount} variante${vm.lowStockCount > 1 ? 's' : ''} precisam reposição`
                : 'Nenhuma variante em baixo estoque'
            }
          />
          <CardRow
            iconBg="#FCEFC8"
            iconColor="#9B5F0B"
            Icon={BellRing}
            title={
              vm.pendingRemindersCount > 0
                ? `${vm.pendingRemindersCount} lembrete${vm.pendingRemindersCount > 1 ? 's' : ''} pendente${vm.pendingRemindersCount > 1 ? 's' : ''}`
                : 'Sem lembretes pendentes'
            }
            subtitle="Toque para ver todos os lembretes"
            onPress={() => navigation.navigate('More', { screen: 'Reminders' })}
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

function DeliveryCard({ delivery }: { delivery: NextDelivery }) {
  return (
    <View style={styles.deliveryCard}>
      <Text style={styles.deliveryWhen}>{delivery.when}</Text>
      <Text style={styles.deliveryCustomer}>{delivery.customerName}</Text>
      <Text style={styles.deliveryItems}>{delivery.itemsSummary}</Text>
      <View style={styles.deliveryFooter}>
        <Text style={styles.deliveryTotal}>{delivery.total}</Text>
        <ArrowRight size={18} color="#C47C0A" />
      </View>
    </View>
  );
}

function StatCol({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

interface CardRowProps {
  iconBg: string;
  iconColor: string;
  Icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  subtitle: string;
  onPress?: () => void;
}
function CardRow({ iconBg, iconColor, Icon, title, subtitle, onPress }: CardRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.cardRow, pressed && onPress ? { opacity: 0.85 } : null]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.cardRowIcon, { backgroundColor: iconBg }]}>
        <Icon size={22} color={iconColor} />
      </View>
      <View style={styles.cardRowText}>
        <Text style={styles.cardRowTitle}>{title}</Text>
        <Text style={styles.cardRowSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={20} color="#A89E91" />
    </Pressable>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F1EA',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    gap: 12,
  },
  headerText: {
    flex: 1,
  },
  headerCompany: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B6258',
  },
  headerGreeting: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    color: '#1F1B16',
  },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#B3261E',
    borderWidth: 2,
    borderColor: '#F5F1EA',
  },

  scrollContent: {
    paddingBottom: 32,
  },

  heroCard: {
    marginHorizontal: 24,
    marginTop: 12,
    borderRadius: 20,
    padding: 22,
    overflow: 'hidden',
    minHeight: 140,
  },
  heroWatermark: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.15,
  },
  heroLoader: {
    marginTop: 24,
  },
  heroDate: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  heroRevenue: {
    fontSize: 36,
    lineHeight: 44,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  heroStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 12,
  },
  heroStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  statLabel: {
    fontSize: 12,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  statValue: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  sectionMT: {
    marginTop: 24,
  },
  emptyText: {
    marginHorizontal: 24,
    marginTop: 12,
    fontSize: 14,
    color: '#A89E91',
  },

  deliveriesScroll: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 12,
  },
  deliveryCard: {
    width: 240,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 14,
    gap: 8,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  deliveryWhen: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    color: '#9B5F0B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  deliveryCustomer: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#1F1B16',
  },
  deliveryItems: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B6258',
    flex: 1,
  },
  deliveryFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  deliveryTotal: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#1F1B16',
  },

  summary: {
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRowIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardRowText: {
    flex: 1,
    minWidth: 0,
  },
  cardRowTitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
    color: '#1F1B16',
  },
  cardRowSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    color: '#6B6258',
    marginTop: 2,
  },
});
