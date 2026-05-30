import React, { useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { supplierService } from '../models/supplierService';
import { SupplierFormSheet } from './components/SupplierFormSheet';
import { useAuth } from '@/shared/hooks/useAuth';
import { humanizeError } from '@/shared/lib/errors';
import type { ContactsStackParamList } from '@/navigation/types';
import type { SupplierValues } from '../models/supplierSchemas';

type Route = RouteProp<ContactsStackParamList, 'SupplierDetail'>;

export function SupplierDetailScreen() {
  const route = useRoute<Route>();
  const navigation = useNavigation();
  const { supplierId } = route.params;
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const [sheetVisible, setSheetVisible] = useState(true);

  const query = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: () => supplierService.list(profile?.company_id ?? '').then((list) =>
      list.find((s) => s.id === supplierId) ?? Promise.reject(new Error('Fornecedor não encontrado.'))
    ),
    staleTime: 30_000,
  });

  const mutation = useMutation({
    mutationFn: (values: SupplierValues) => supplierService.update(supplierId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers', profile?.company_id] });
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
      <SupplierFormSheet
        visible={sheetVisible}
        editingSupplier={query.data ?? null}
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
