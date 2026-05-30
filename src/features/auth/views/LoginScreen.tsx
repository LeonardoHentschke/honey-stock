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
import Svg, { Path } from 'react-native-svg';

import { Input } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { HoneyLogo } from '@/components/ui/honey-logo';
import { HexPattern } from '@/components/ui/hex-pattern';
import { useLoginViewModel } from '../viewmodels/useLoginViewModel';
import type { AuthStackScreenProps } from '@/navigation/types';

WebBrowser.maybeCompleteAuthSession();

function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 18 18">
      <Path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <Path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <Path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
      <Path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </Svg>
  );
}

export function LoginScreen({ navigation }: AuthStackScreenProps<'Login'>) {
  const { control, errors, isLoading, googleLoading, onSubmit, onGoogleSignIn } =
    useLoginViewModel();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.root}>
      {/* Gradiente: honey-100 → ink-50 aos 55% */}
      <LinearGradient
        colors={['#FCEFC8', '#F5F1EA']}
        locations={[0, 0.55]}
        style={StyleSheet.absoluteFill}
      />

      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* ── Hero ─────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <HexPattern />
          <View style={styles.heroContent}>
            <HoneyLogo size={56} />
            <Text style={styles.headline}>Bom dia, apicultor.</Text>
            <Text style={styles.subtitle}>
              Controle simples para quem cuida do mel{'\n'}da colheita ao cliente.
            </Text>
          </View>
        </View>

        {/* ── Card branco ──────────────────────────────────────── */}
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
                  trailing={
                    <Pressable onPress={() => setShowPassword((s) => !s)} hitSlop={8}>
                      {showPassword
                        ? <EyeOff size={20} color="#6B6258" />
                        : <Eye size={20} color="#6B6258" />}
                    </Pressable>
                  }
                />
              )}
            />

            {/* Erro geral */}
            {errors.root?.message ? (
              <Text style={styles.errorText}>{errors.root.message}</Text>
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
              <GoogleIcon size={18} />
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
  heroContent: {
    position: 'relative',
    zIndex: 1,
    gap: 8,
  },
  headline: {
    fontSize: 36,
    lineHeight: 42,
    fontWeight: '700',
    color: '#1F1B16',
    marginTop: 16,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#6B6258',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 12,
  },
  cardContent: {
    padding: 28,
    paddingHorizontal: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#B3261E',
    textAlign: 'center',
  },
  linkCenter: {
    alignItems: 'center',
    marginTop: 4,
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
