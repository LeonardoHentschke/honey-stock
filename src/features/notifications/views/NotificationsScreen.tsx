import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import * as ExpoNotifications from 'expo-notifications';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, BellRing, AlertTriangle, CheckCircle2, CalendarClock, Bell } from 'lucide-react-native';

interface NotifItem {
  id: string;
  title: string;
  body: string;
  when: Date;
}

function formatWhen(date: Date): string {
  const diff = (Date.now() - date.getTime()) / 1000;
  if (diff < 60) return 'agora';
  if (diff < 3600) return `${Math.floor(diff / 60)}min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function iconFor(title: string) {
  const t = title.toLowerCase();
  if (t.includes('venda') || t.includes('conclu')) return { Icon: CheckCircle2, color: '#2E7D32', bg: '#E4F2E4' };
  if (t.includes('estoque') || t.includes('baixo')) return { Icon: AlertTriangle, color: '#C77700', bg: '#FBEAD0' };
  if (t.includes('entreg') || t.includes('agenda')) return { Icon: CalendarClock, color: '#1565C0', bg: '#DCE9F7' };
  return { Icon: BellRing, color: '#9B5F0B', bg: '#FCEFC8' };
}

export function NotificationsScreen() {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation();
  const [items, setItems] = useState<NotifItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ExpoNotifications.getPresentedNotificationsAsync()
      .then((notifs) => {
        setItems(
          notifs.map((n) => ({
            id: n.request.identifier,
            title: n.request.content.title ?? 'Notificação',
            body: n.request.content.body ?? '',
            when: new Date(n.date),
          }))
        );
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: top + 8 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.back}>
          <ArrowLeft size={22} color="#1F1B16" />
        </Pressable>
        <Text style={styles.title}>Notificações</Text>
      </View>

      {loading ? (
        <ActivityIndicator color="#E89B12" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            const { Icon, color, bg } = iconFor(item.title);
            return (
              <View style={styles.card}>
                <View style={[styles.cardIcon, { backgroundColor: bg }]}>
                  <Icon size={20} color={color} />
                </View>
                <View style={styles.cardText}>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text style={styles.cardWhen}>{formatWhen(item.when)}</Text>
                  </View>
                  {item.body ? (
                    <Text style={styles.cardBody} numberOfLines={2}>{item.body}</Text>
                  ) : null}
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Bell size={48} color="#E7E2D9" />
              <Text style={styles.emptyTitle}>Nenhuma notificação</Text>
              <Text style={styles.emptySub}>As notificações recebidas aparecerão aqui.</Text>
            </View>
          }
        />
      )}
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

  list: { paddingHorizontal: 16, paddingBottom: 32 },

  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
  },
  cardIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  cardText: { flex: 1, minWidth: 0 },
  cardRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1F1B16', lineHeight: 22 },
  cardWhen: { fontSize: 11, color: '#A89E91', flexShrink: 0 },
  cardBody: { fontSize: 13, color: '#6B6258', lineHeight: 18, marginTop: 2 },

  empty: { alignItems: 'center', paddingTop: 80, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#1F1B16' },
  emptySub: { fontSize: 13, color: '#A89E91', textAlign: 'center', paddingHorizontal: 40 },
});
