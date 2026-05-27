import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { AuthStackParamList } from './types';

// Telas (placeholder Sprint 0 — implementadas no Sprint 1)
import { SplashScreen } from '@/features/auth/views/SplashScreen';
import { LoginScreen } from '@/features/auth/views/LoginScreen';
import { SignUpScreen } from '@/features/auth/views/SignUpScreen';
import { ForgotPasswordScreen } from '@/features/auth/views/ForgotPasswordScreen';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
