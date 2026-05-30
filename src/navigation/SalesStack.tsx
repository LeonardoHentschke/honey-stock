import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { SalesStackParamList } from './types';

import { SalesListScreen } from '@/features/sales/views/SalesListScreen';
import { NewSaleScreen } from '@/features/sales/views/NewSaleScreen';
import { SaleDetailScreen } from '@/features/sales/views/SaleDetailScreen';

const Stack = createNativeStackNavigator<SalesStackParamList>();

export function SalesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SalesList" component={SalesListScreen} />
      <Stack.Screen name="NewSale" component={NewSaleScreen} />
      <Stack.Screen name="SaleDetail" component={SaleDetailScreen} />
    </Stack.Navigator>
  );
}
