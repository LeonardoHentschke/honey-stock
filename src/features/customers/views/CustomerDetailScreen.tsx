import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { customerService } from '../models/customerService';
import { CustomerFormSheet } from './components/CustomerFormSheet';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/shared/hooks/useAuth';
import { humanizeError } from '@/shared/lib/errors';
import { useMutation } from '@tanstack/react-query';
import type { ContactsStackParamList } from '@/navigation/types';
import type { CustomerValues } from '../models/customerSchemas';

type Route = RouteProp<ContactsStackParamList, 'CustomerDetail'>;

export function CustomerDetailScreen() {
  const { top } = useSafeAreaInsets();
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { customerId } = route.params;
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [sheetVisible, setSheetVisible] = useState(true);

  const query = useQuery({
    queryKey: ['customer', customerId],
    queryFn: () => customerService.get(customerId),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: (values: CustomerValues) => customerService.update(customerId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers', profile?.company_id] });
      navigation.goBack();
    },
  });

  if (query.isLoading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color="#C47C0A" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <CustomerFormSheet
        visible={sheetVisible}
        editingCustomer={query.data ?? null}
        isSaving={mutation.isPending}
        error={mutation.error ? humanizeError(mutation.error) : null}
        onSave={mutation.mutate}
        onClose={() => {
          setSheetVisible(false);
          navigation.goBack();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#F5F1EA' },
  centered: { alignItems: 'center', justifyContent: 'center' },
});
