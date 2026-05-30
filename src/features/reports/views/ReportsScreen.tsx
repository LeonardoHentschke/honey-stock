import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ArrowLeft, TrendingUp, Package, BarChart2 } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { CartesianChart, Line, Bar } from 'victory-native';
import { formatCurrency } from '@/shared/lib/format';
import { SectionHeader } from '@/components/ui/section-header';
import { useReportsViewModel, type PeriodOption } from '../viewmodels/useReportsViewModel';
import type { BreakdownRow, SalesByDayPoint, TopVariantPoint } from '../viewmodels/useReportsViewModel';
import type { LowStockVariant } from '../models/reportsService';

const PERIODS: { key: PeriodOption; label: string }[] = [
  { key: '7d', label: '7 dias' },
  { key: '30d', label: '30 dias' },
  { key: 'month', label: 'Este mês' },
];

export function ReportsScreen() {
  const { top, bottom } = useSafeAreaInsets();
  const navigation = useNavigation();
  const vm = useReportsViewModel();

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.backBtn}>
          <ArrowLeft size={22} color="#1F1B16" />
        </Pressable>
        <Text style={styles.title}>Relatórios</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Período */}
      <View style={styles.periodRow}>
        {PERIODS.map(({ key, label }) => (
          <Pressable
            key={key}
            style={[styles.periodChip, vm.period === key && styles.periodChipActive]}
            onPress={() => vm.setPeriod(key)}
          >
            <Text style={[styles.periodChipText, vm.period === key && styles.periodChipTextActive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>

      {vm.isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#C47C0A" size="large" />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: bottom + 32 }]}
          refreshControl={
            <RefreshControl
              refreshing={vm.isRefetching}
              onRefresh={vm.refresh}
              tintColor="#C47C0A"
              colors={['#C47C0A']}
            />
          }
        >
          {/* Resumo */}
          <View style={styles.summaryRow}>
            <SummaryCard label="Total" value={formatCurrency(vm.salesSummary.total)} />
            <SummaryCard label="Vendas" value={String(vm.salesSummary.count)} />
            <SummaryCard label="Ticket médio" value={formatCurrency(vm.salesSummary.avg)} />
          </View>

          {/* Vendas por dia */}
          <SectionHeader style={styles.sectionHeader}>
            <TrendingUp size={14} color="#6B6258" />
            {'  '}Vendas por dia
          </SectionHeader>
          <View style={styles.card}>
            {vm.salesByDay.length > 1 ? (
              <>
                <CartesianChart
                  data={vm.salesByDay}
                  xKey="day"
                  yKeys={['total']}
                  domainPadding={{ top: 20, bottom: 0 }}
                >
                  {({ points }) => (
                    <Line
                      points={points.total}
                      color="#E89B12"
                      strokeWidth={2.5}
                      animate={{ type: 'timing', duration: 300 }}
                    />
                  )}
                </CartesianChart>
                <ChartXLabels points={vm.salesByDay} />
              </>
            ) : (
              <EmptyChart message="Poucos dados para o período selecionado." />
            )}
          </View>

          {/* Top 5 produtos */}
          <SectionHeader style={styles.sectionHeader}>
            <BarChart2 size={14} color="#6B6258" />
            {'  '}Top 5 produtos
          </SectionHeader>
          <View style={styles.card}>
            {vm.topVariants.length > 0 ? (
              <>
                <CartesianChart
                  data={vm.topVariants}
                  xKey="index"
                  yKeys={['qty']}
                  domainPadding={{ left: 20, right: 20, top: 20 }}
                >
                  {({ points, chartBounds }) => (
                    <Bar
                      points={points.qty}
                      chartBounds={chartBounds}
                      color="#C47C0A"
                      animate={{ type: 'timing', duration: 300 }}
                    />
                  )}
                </CartesianChart>
                <BarLegend items={vm.topVariants} />
              </>
            ) : (
              <EmptyChart message="Nenhuma venda com produtos no período." />
            )}
          </View>

          {/* Por canal */}
          <SectionHeader style={styles.sectionHeader}>Por canal de venda</SectionHeader>
          <View style={styles.card}>
            {vm.byChannel.length > 0 ? (
              vm.byChannel.map((row) => <PercentRow key={row.key} row={row} />)
            ) : (
              <Text style={styles.emptyText}>Nenhuma venda no período.</Text>
            )}
          </View>

          {/* Por pagamento */}
          <SectionHeader style={styles.sectionHeader}>Por forma de pagamento</SectionHeader>
          <View style={styles.card}>
            {vm.byPayment.length > 0 ? (
              vm.byPayment.map((row) => <PercentRow key={row.key} row={row} />)
            ) : (
              <Text style={styles.emptyText}>Nenhuma venda no período.</Text>
            )}
          </View>

          {/* Estoque crítico */}
          <SectionHeader style={styles.sectionHeader}>
            <Package size={14} color="#6B6258" />
            {'  '}Estoque crítico
          </SectionHeader>
          <View style={styles.card}>
            {vm.lowStockVariants.length > 0 ? (
              vm.lowStockVariants.map((v) => <StockRow key={v.sku} variant={v} />)
            ) : (
              <Text style={styles.emptyTextGreen}>Nenhuma variante em nível crítico.</Text>
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

// ─── Componentes internos ────────────────────────────────────────────────────

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function PercentRow({ row }: { row: BreakdownRow }) {
  return (
    <View style={styles.percentRow}>
      <View style={styles.percentLabelRow}>
        <Text style={styles.percentLabel}>{row.label}</Text>
        <View style={styles.percentRight}>
          <Text style={styles.percentValue}>{formatCurrency(row.total)}</Text>
          <Text style={styles.percentPct}>{row.pct}%</Text>
        </View>
      </View>
      <View style={styles.percentTrack}>
        <View style={[styles.percentFill, { width: `${row.pct}%` }]} />
      </View>
    </View>
  );
}

function StockRow({ variant }: { variant: LowStockVariant }) {
  return (
    <View style={styles.stockRow}>
      <View style={styles.stockInfo}>
        <Text style={styles.stockName} numberOfLines={1}>{variant.product_name}</Text>
        <Text style={styles.stockSku}>{variant.sku}</Text>
      </View>
      <View style={styles.stockBadge}>
        <Text style={styles.stockBadgeText}>
          {variant.stock_quantity} / {variant.min_stock}
        </Text>
      </View>
    </View>
  );
}

function ChartXLabels({ points }: { points: SalesByDayPoint[] }) {
  if (points.length === 0) return null;
  const step = Math.max(1, Math.floor(points.length / 5));
  const visible = points.filter((_, i) => i % step === 0);
  return (
    <View style={styles.chartLabels}>
      {visible.map((p) => (
        <Text key={p.day} style={styles.chartLabel}>{p.label}</Text>
      ))}
    </View>
  );
}

function BarLegend({ items }: { items: TopVariantPoint[] }) {
  return (
    <View style={styles.barLegend}>
      {items.map((item, i) => (
        <Text key={i} style={styles.barLegendItem} numberOfLines={1}>
          {i + 1}. {item.label}
        </Text>
      ))}
    </View>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <View style={styles.emptyChart}>
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );
}

// ─── Estilos ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1EA' },
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
  headerSpacer: { width: 40 },

  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 8,
  },
  periodChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E7E2D9',
  },
  periodChipActive: { backgroundColor: '#FCEFC8', borderColor: '#C47C0A' },
  periodChipText: { fontSize: 13, fontWeight: '500', color: '#6B6258' },
  periodChipTextActive: { color: '#9B5F0B', fontWeight: '700' },

  scrollContent: { paddingHorizontal: 24, gap: 8 },
  sectionHeader: { marginTop: 8 },

  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 4,
  },
  summaryValue: { fontSize: 15, fontWeight: '700', color: '#C47C0A' },
  summaryLabel: { fontSize: 11, color: '#6B6258', textAlign: 'center' },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    gap: 8,
  },

  percentRow: { gap: 6 },
  percentLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  percentLabel: { fontSize: 14, color: '#3B342B', fontWeight: '500' },
  percentRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  percentValue: { fontSize: 13, color: '#6B6258' },
  percentPct: { fontSize: 13, fontWeight: '700', color: '#C47C0A', minWidth: 36, textAlign: 'right' },
  percentTrack: {
    height: 6,
    backgroundColor: '#F5F1EA',
    borderRadius: 3,
    overflow: 'hidden',
  },
  percentFill: { height: 6, backgroundColor: '#E89B12', borderRadius: 3 },

  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F1EA',
  },
  stockInfo: { flex: 1, gap: 2 },
  stockName: { fontSize: 14, fontWeight: '600', color: '#1F1B16' },
  stockSku: { fontSize: 12, color: '#A89E91' },
  stockBadge: {
    backgroundColor: '#FDECEA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  stockBadgeText: { fontSize: 12, fontWeight: '700', color: '#B3261E' },

  chartLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  chartLabel: { fontSize: 10, color: '#A89E91' },

  barLegend: { gap: 2 },
  barLegendItem: { fontSize: 12, color: '#6B6258' },

  emptyChart: { height: 80, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 13, color: '#A89E91', textAlign: 'center' },
  emptyTextGreen: { fontSize: 13, color: '#065F46', textAlign: 'center' },
});
