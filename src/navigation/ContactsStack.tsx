import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ContactsStackParamList } from './types';

import { ContactsScreen } from '@/features/customers/views/ContactsScreen';
import { CustomerDetailScreen } from '@/features/customers/views/CustomerDetailScreen';

const Stack = createNativeStackNavigator<ContactsStackParamList>();

export function ContactsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ContactsList" component={ContactsScreen} />
      <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
    </Stack.Navigator>
  );
}
