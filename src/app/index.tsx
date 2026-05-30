import React, { useCallback } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { View, ActivityIndicator } from 'react-native';
import * as Notifications from 'expo-notifications';

import { RootNavigator } from '@/navigation/RootNavigator';
import { useAuthListener } from '@/shared/hooks/useAuth';
import { useNotifications } from '@/shared/hooks/useNotifications';
import type { RootStackParamList } from '@/navigation/types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// QueryClient com configurações otimizadas para mobile
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,      // 2 min cache
      gcTime: 1000 * 60 * 10,        // 10 min GC
      retry: 2,
      refetchOnWindowFocus: false,    // não faz sentido em mobile
    },
    mutations: {
      retry: 0,
    },
  },
});

function AppContent() {
  useAuthListener();

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as {
        sale_id?: string;
        reminder_id?: string;
      };
      if (!navigationRef.isReady()) return;
      if (data.sale_id) {
        navigationRef.navigate('App', {
          screen: 'Sales',
          params: { screen: 'SaleDetail', params: { saleId: data.sale_id } },
        });
      } else if (data.reminder_id) {
        navigationRef.navigate('App', {
          screen: 'More',
          params: { screen: 'ReminderDetail', params: { reminderId: data.reminder_id } },
        });
      }
    },
    []
  );

  useNotifications(undefined, handleNotificationResponse);

  return <RootNavigator />;
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F1EA' }}>
        <ActivityIndicator color="#E89B12" size="large" />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <NavigationContainer ref={navigationRef}>
          <StatusBar style="dark" backgroundColor="#F5F1EA" />
          <AppContent />
        </NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
