import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ProductsStackParamList } from './types';

import { ProductListScreen } from '@/features/products/views/ProductListScreen';
import { ProductDetailScreen } from '@/features/products/views/ProductDetailScreen';
import { VariantDetailScreen } from '@/features/products/views/VariantDetailScreen';

const Stack = createNativeStackNavigator<ProductsStackParamList>();

export function ProductsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProductList" component={ProductListScreen} />
      <Stack.Screen name="ProductDetail" component={ProductDetailScreen} />
      <Stack.Screen name="VariantDetail" component={VariantDetailScreen} />
    </Stack.Navigator>
  );
}
