import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStack } from './AuthStack';
import { AppTabs } from './AppTabs';
import { useAuth } from '@/shared/hooks/useAuth';
import type { RootStackParamList } from './types';

const Root = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const { isAuthenticated, isLoading, profile } = useAuth();

  return (
    <Root.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {isAuthenticated && !isLoading && profile ? (
        // Sessão válida E perfil carregado → App.
        // Exigir `profile` evita montar o AppTabs com perfil nulo durante a
        // race do signup (onAuthStateChange dispara antes dos inserts/reloadProfile),
        // que causava o flip-flop App↔Auth e o erro "navigation context".
        <Root.Screen name="App" component={AppTabs} />
      ) : (
        // Ainda carregando OU não autenticado → Auth (começa no Splash)
        <Root.Screen name="Auth" component={AuthStack} />
      )}
    </Root.Navigator>
  );
}
