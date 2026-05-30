import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { MoreStackParamList } from './types';

import { MoreScreen } from '@/features/more/views/MoreScreen';
import { BatchListScreen } from '@/features/batches/views/BatchListScreen';
import { CategoryListScreen } from '@/features/products/views/CategoryListScreen';
import { RemindersListScreen } from '@/features/reminders/views/RemindersListScreen';
import { ReminderDetailScreen } from '@/features/reminders/views/ReminderDetailScreen';
import { ReportsScreen } from '@/features/reports/views/ReportsScreen';
import { ProfileScreen } from '@/features/more/views/ProfileScreen';

const Stack = createNativeStackNavigator<MoreStackParamList>();

export function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreHome" component={MoreScreen} />
      <Stack.Screen name="Batches" component={BatchListScreen} />
      <Stack.Screen name="Categories" component={CategoryListScreen} />
      <Stack.Screen name="Reminders" component={RemindersListScreen} />
      <Stack.Screen name="ReminderDetail" component={ReminderDetailScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
    </Stack.Navigator>
  );
}
