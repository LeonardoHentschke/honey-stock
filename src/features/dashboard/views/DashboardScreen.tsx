import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useAuth } from '@/shared/hooks/useAuth';

// ─── Mock data (substituído por queries reais no Sprint 3) ──────────────────
const MOCK = {
  companyInitials: 'AT',
  companyName: 'Apiário Taquari',
  todayRevenue: 'R$ 324,00',
  todaySales: 8,
  monthRevenue: 'R$ 4.180',
  bestSeller: 'Silvestre',
  lowStockCount: 3,
  pendingReminders: 2,
  nextDeliveries: [
    {
      id: '1',
      when: 'Amanhã · 09:00',
      customer: 'João Alves',
      items: '2 mel silvestre 1kg',
      total: 'R$ 97,90',
    },
    {
      id: '2',
      when: 'Sex · 25/05',
      customer: 'Mercado Central',
      items: '24 mel silv. 500g',
      total: 'R$ 576,00',
    },
  ],
} as const;

// ─── DashboardScreen ────────────────────────────────────────────────────────
export function DashboardScreen() {
  const { profile } = useAuth();
  const { top } = useSafeAreaInsets();
  const firstName = profile?.full_name?.split(' ')[0] ?? 'André';

  return (
    <View style={styles.root}>
      {/* ── App header ────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Avatar initial={MOCK.companyInitials} size="md" />
        <View style={styles.headerText}>
          <Text style={styles.headerCompany}>{MOCK.companyName}</Text>
          <Text style={styles.headerGreeting}>Olá, {firstName}</Text>
        </View>
        <Pressable style={styles.bellBtn} hitSlop={8} accessibilityLabel="Notificações">
          <Bell size={22} color="#1F1B16" />
          <View style={styles.bellDot} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Hero card ─────────────────────────────────────── */}
        <LinearGradient
          colors={['#9B5F0B', '#C47C0A', '#E89B12']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          {/* Watermark logo */}
          <View style={styles.heroWatermark} pointerEvents="none">
            <HoneyLogo size={160} />
          </View>

          {/* Conteúdo */}
          <Text style={styles.heroDate}>Hoje · sex 23/05</Text>
          <Text style={styles.heroRevenue}>{MOCK.todayRevenue}</Text>

          <View style={styles.heroStats}>
            <StatCol label="Vendas" value={String(MOCK.todaySales)} />
            <View style={styles.heroStatDivider} />
            <StatCol label="Mês" value={MOCK.monthRevenue} />
            <View style={styles.heroStatDivider} />
            <StatCol label="Mais vendido" value={MOCK.bestSeller} />
          </View>
        </LinearGradient>

        {/* ── Próximas entregas ─────────────────────────────── */}
        <SectionHeader style={styles.sectionMT}>Próximas entregas</SectionHeader>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.deliveriesScroll}
        >
          {MOCK.nextDeliveries.map((d) => (
            <View key={d.id} style={styles.deliveryCard}>
              <Text style={styles.deliveryWhen}>{d.when}</Text>
              <Text style={styles.deliveryCustomer}>{d.customer}</Text>
              <Text style={styles.deliveryItems}>{d.items}</Text>
              <View style={styles.deliveryFooter}>
                <Text style={styles.deliveryTotal}>{d.total}</Text>
                <ArrowRight size={18} color="#C47C0A" />
              </View>
            </View>
          ))}
        </ScrollView>

        {/* ── Resumo: estoque + lembretes ───────────────────── */}
        <View style={styles.summary}>
          <CardRow
            iconBg="#FFF3E0"
            iconColor="#C77700"
            Icon={AlertTriangle}
            title="Estoque baixo"
            subtitle={`${MOCK.lowStockCount} variantes precisam reposição`}
          />
          <CardRow
            iconBg="#FCEFC8"
            iconColor="#9B5F0B"
            Icon={BellRing}
            title={`${MOCK.pendingReminders} lembretes pendentes`}
            subtitle="Próximo: cobrar Maria Padaria · 16h"
          />
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Sub-componentes ────────────────────────────────────────────────────────

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
}
function CardRow({ iconBg, iconColor, Icon, title, subtitle }: CardRowProps) {
  return (
    <View style={styles.cardRow}>
      <View style={[styles.cardRowIcon, { backgroundColor: iconBg }]}>
        <Icon size={22} color={iconColor} />
      </View>
      <View style={styles.cardRowText}>
        <Text style={styles.cardRowTitle}>{title}</Text>
        <Text style={styles.cardRowSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={20} color="#A89E91" />
    </View>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F1EA',
  },

  // Header
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

  // Scroll
  scrollContent: {
    paddingBottom: 32,
  },

  // Hero card
  heroCard: {
    marginHorizontal: 24,
    marginTop: 12,
    borderRadius: 20,
    padding: 22,
    overflow: 'hidden',
  },
  heroWatermark: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    opacity: 0.15,
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

  // Section
  sectionMT: {
    marginTop: 24,
  },

  // Deliveries
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
    // sombra
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

  // Summary
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
    // sombra
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
