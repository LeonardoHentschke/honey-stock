import React, { useState } from 'react';
import {
  View, Text, FlatList, Pressable, StyleSheet,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, UserPlus } from 'lucide-react-native';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/shared/hooks/useAuth';
import { getInviteCode } from '@/features/auth/models/authService';
import { InviteCodeModal } from '@/shared/components/InviteCodeModal';

interface Member {
  id: string;
  full_name: string;
  company_id: string;
  created_at: string;
}

function getInitials(name: string): string {
  return name.split(' ').slice(0, 2).map((w) => w[0]?.toUpperCase() ?? '').join('');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

export function TeamScreen() {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile } = useAuth();
  const [inviteVisible, setInviteVisible] = useState(false);

  const membersQuery = useQuery<Member[], Error>({
    queryKey: ['team', profile?.company_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, company_id, created_at')
        .order('created_at');
      if (error) throw error;
      return (data ?? []) as Member[];
    },
    enabled: !!profile,
    staleTime: 60_000,
  });

  const inviteQuery = useQuery({
    queryKey: ['inviteCode'],
    queryFn: getInviteCode,
    enabled: inviteVisible,
    staleTime: 10 * 60_000,
  });

  return (
    <View style={styles.root}>
      <View style={[styles.header, { paddingTop: top + 12 }]}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.back}>
          <ArrowLeft size={22} color="#1F1B16" />
        </Pressable>
        <Text style={styles.title}>Equipe</Text>
        <Pressable onPress={() => setInviteVisible(true)} style={styles.addBtn} hitSlop={8}>
          <UserPlus size={20} color="#9B5F0B" />
        </Pressable>
      </View>

      <FlatList
        data={membersQuery.data ?? []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={membersQuery.isRefetching}
            onRefresh={membersQuery.refetch}
            colors={['#E89B12']}
            tintColor="#E89B12"
          />
        }
        renderItem={({ item }) => {
          const isYou = item.id === profile?.id;
          return (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(item.full_name)}</Text>
              </View>
              <View style={styles.memberText}>
                <View style={styles.memberRow}>
                  <Text style={styles.memberName}>{item.full_name}</Text>
                  {isYou && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>você</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.memberSub}>Membro desde {formatDate(item.created_at)}</Text>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          membersQuery.isLoading
            ? <ActivityIndicator color="#E89B12" style={{ marginTop: 40 }} />
            : <Text style={styles.empty}>Nenhum membro encontrado.</Text>
        }
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
      />

      {/* Modal convite — compartilhado com a tela Mais */}
      <InviteCodeModal
        visible={inviteVisible}
        code={inviteQuery.data}
        isLoading={inviteQuery.isLoading}
        onClose={() => setInviteVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1EA' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 4,
  },
  back: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, marginLeft: -8 },
  title: { flex: 1, fontSize: 24, lineHeight: 32, fontWeight: '700', color: '#1F1B16' },
  addBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20, backgroundColor: '#FCEFC8' },

  list: { paddingHorizontal: 16, paddingBottom: 32 },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#FCEFC8',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#9B5F0B' },
  memberText: { flex: 1, minWidth: 0 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  memberName: { fontSize: 15, fontWeight: '600', color: '#1F1B16', lineHeight: 22 },
  youBadge: {
    backgroundColor: '#FCEFC8', borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  youBadgeText: { fontSize: 11, fontWeight: '600', color: '#9B5F0B' },
  memberSub: { fontSize: 12, color: '#6B6258', lineHeight: 16, marginTop: 2 },

  empty: { textAlign: 'center', color: '#A89E91', marginTop: 48, fontSize: 14 },

});
