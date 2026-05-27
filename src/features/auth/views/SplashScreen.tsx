import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '@/shared/hooks/useAuth';
import type { AuthStackScreenProps } from '@/navigation/types';

export function SplashScreen({ navigation }: AuthStackScreenProps<'Splash'>) {
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isLoading) return; // ainda verificando sessão
    if (!isAuthenticated) {
      navigation.replace('Login');
    }
    // Se autenticado, RootNavigator trocará para AppTabs automaticamente
  }, [isLoading, isAuthenticated, navigation]);

  return (
    <View className="flex-1 items-center justify-center bg-ink-50">
      <Text className="text-h1 text-ink-900 font-bold mb-2">🍯 Mel Manager</Text>
      <ActivityIndicator color="#E89B12" />
    </View>
  );
}
