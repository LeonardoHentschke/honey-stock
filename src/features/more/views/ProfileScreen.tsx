import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft, User } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/shared/hooks/useAuth';
import { dashboardService } from '@/features/dashboard/models/dashboardService';

export function ProfileScreen() {
  const { top } = useSafeAreaInsets();
  const navigation = useNavigation();
  const { profile, session } = useAuth();

  const { data: companyName = '' } = useQuery({
    queryKey: ['companyName', profile?.company_id],
    queryFn: () => dashboardService.getCompanyName(profile!.company_id),
    enabled: !!profile,
    staleTime: 5 * 60_000,
  });

  const initials = (profile?.full_name ?? '')
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <View style={[styles.root, { paddingTop: top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={12}>
          <ChevronLeft size={24} color="#1F1B16" />
        </Pressable>
        <Text style={styles.title}>Perfil</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            {initials ? (
              <Text style={styles.avatarText}>{initials}</Text>
            ) : (
              <User size={32} color="#9B5F0B" />
            )}
          </View>
          <Text style={styles.name}>{profile?.full_name ?? '—'}</Text>
          <Text style={styles.email}>{session?.user?.email ?? '—'}</Text>
        </View>

        {/* Info card */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Nome</Text>
            <Text style={styles.rowValue}>{profile?.full_name ?? '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>E-mail</Text>
            <Text style={styles.rowValue} numberOfLines={1}>{session?.user?.email ?? '—'}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Empresa</Text>
            <Text style={styles.rowValue}>{companyName || '—'}</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#F5F1EA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  title: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '600',
    color: '#1F1B16',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FCEFC8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#9B5F0B',
  },
  name: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600',
    color: '#1F1B16',
  },
  email: {
    fontSize: 14,
    lineHeight: 20,
    color: '#6B6258',
    marginTop: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowLabel: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
    color: '#6B6258',
    width: 80,
  },
  rowValue: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '400',
    color: '#1F1B16',
    textAlign: 'right',
  },
  divider: {
    height: 1,
    backgroundColor: '#E7E2D9',
    marginLeft: 16,
  },
});
