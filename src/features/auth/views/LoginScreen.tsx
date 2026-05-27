import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Controller } from 'react-hook-form';
import * as WebBrowser from 'expo-web-browser';
import { Eye, EyeOff } from 'lucide-react-native';

import { Input } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { HoneyLogo } from '@/components/ui/honey-logo';
import { HexPattern } from '@/components/ui/hex-pattern';
import { useLoginViewModel } from '../viewmodels/useLoginViewModel';
import type { AuthStackScreenProps } from '@/navigation/types';

// Fecha o browser in-app do OAuth no iOS
WebBrowser.maybeCompleteAuthSession();

export function LoginScreen({ navigation }: AuthStackScreenProps<'Login'>) {
  const { control, errors, isLoading, googleLoading, onSubmit, onGoogleSignIn } =
    useLoginViewModel();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.root}>
      {/* Fundo degradê honey-100 → ink-50 */}
      <LinearGradient
        colors={['#FCEFC8', '#F5F1EA']}
        locations={[0, 0.55]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Hero ──────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <HexPattern />
          <HoneyLogo size={56} />
          <Text style={styles.headline}>Bom dia, apicultor.</Text>
          <Text style={styles.subtitle}>
            Controle simples para quem cuida do mel da colheita ao cliente.
          </Text>
        </View>

        {/* ── Card branco ───────────────────────────────────────────── */}
        <View style={styles.card}>
          <ScrollView
            contentContainerStyle={styles.cardContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Email */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="voce@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            {/* Senha */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <View>
                  <Input
                    label="Senha"
                    placeholder="••••••••"
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    returnKeyType="done"
                    onSubmitEditing={onSubmit}
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.password?.message}
                  />
                  <Pressable
                    style={styles.eyeToggle}
                    onPress={() => setShowPassword((s) => !s)}
                    hitSlop={8}
                  >
                    {showPassword ? (
                      <EyeOff size={20} color="#6B6258" />
                    ) : (
                      <Eye size={20} color="#6B6258" />
                    )}
                  </Pressable>
                </View>
              )}
            />

            {/* Erro geral */}
            {errors.root?.message ? (
              <Text className="text-caption text-danger text-center">
                {errors.root.message}
              </Text>
            ) : null}

            {/* Entrar */}
            <Button size="lg" className="w-full" loading={isLoading} onPress={onSubmit}>
              <ButtonText>Entrar</ButtonText>
            </Button>

            {/* Google */}
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              loading={googleLoading}
              onPress={onGoogleSignIn}
            >
              <ButtonText>Continuar com Google</ButtonText>
            </Button>

            {/* Esqueci senha */}
            <Pressable
              style={styles.linkCenter}
              onPress={() => navigation.navigate('ForgotPassword')}
            >
              <Text style={styles.linkText}>Esqueci minha senha</Text>
            </Pressable>

            {/* Divisor */}
            <View style={styles.divider} />

            {/* Cadastro */}
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Não tem conta? </Text>
              <Pressable onPress={() => navigation.navigate('SignUp', {})}>
                <Text style={styles.signupLink}>Cadastre-se</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  kav: {
    flex: 1,
  },
  hero: {
    height: 280,
    paddingHorizontal: 24,
    paddingTop: 32,
    overflow: 'hidden',
  },
  headline: {
    fontSize: 34,
    lineHeight: 42,
    fontWeight: '700',
    color: '#1F1B16',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B6258',
    marginTop: 8,
    maxWidth: 280,
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    // Sombra
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  cardContent: {
    padding: 28,
    gap: 14,
  },
  eyeToggle: {
    position: 'absolute',
    right: 12,
    bottom: 14,
  },
  linkCenter: {
    alignItems: 'center',
    marginTop: 2,
  },
  linkText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#C47C0A',
  },
  divider: {
    height: 1,
    backgroundColor: '#E7E2D9',
    marginVertical: 4,
  },
  signupRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupText: {
    fontSize: 15,
    color: '#6B6258',
  },
  signupLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#C47C0A',
  },
});
