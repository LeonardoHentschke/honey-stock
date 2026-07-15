import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { Controller } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react-native';

import { Input } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { cn } from '@/shared/lib/utils';
import { useSignUpViewModel, type SignUpTab } from '../viewmodels/useSignUpViewModel';
import type { AuthStackScreenProps } from '@/navigation/types';

export function SignUpScreen({ navigation, route }: AuthStackScreenProps<'SignUp'>) {
  const initialTab = (route.params?.tab ?? 'owner') as SignUpTab;
  const { activeTab, setActiveTab, ownerForm, memberForm, isLoading, onSubmitOwner, onSubmitMember } =
    useSignUpViewModel(initialTab);

  const [showPassword, setShowPassword] = useState(false);

  return (
    <View className="flex-1 bg-ink-50">
      {/* contentContainerStyle inline: css-interop não processa className em
          componentes de terceiros como o KeyboardAwareScrollView */}
      <KeyboardAwareScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={24}
      >
        {/* Título */}
        <Text className="text-h1 text-ink-900 font-bold mb-6">Criar conta</Text>

        {/* Tabs — mesmo padrão do toggle Histórico/Agendadas de Vendas */}
        <View className="flex-row bg-white rounded-md border border-ink-100 overflow-hidden mb-6">
          {(['owner', 'member'] as SignUpTab[]).map((tab) => (
            // key inclui o estado ativo para forçar remount ao alternar: evita que o
            // css-interop (NativeWind) tente "upgradar" a Pressable após o render
            // inicial, o que dispara um warning cujo stringify percorre a árvore e
            // quebra no contexto de navegação (Render Error).
            <Pressable
              key={`${tab}-${activeTab === tab}`}
              onPress={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2.5 items-center',
                activeTab === tab ? 'bg-honey-100' : '',
              )}
            >
              <Text
                className={cn(
                  'text-label',
                  activeTab === tab ? 'text-honey-700 font-bold' : 'text-ink-500 font-medium',
                )}
              >
                {tab === 'owner' ? 'Criar empresa' : 'Entrar com convite'}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ── Formulário: dono de empresa ── */}
        {activeTab === 'owner' && (
          <View className="gap-4">
            <Controller
              control={ownerForm.control}
              name="companyName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Nome da empresa *"
                  placeholder="Ex: Apiário das Flores"
                  autoCapitalize="words"
                  returnKeyType="next"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={ownerForm.formState.errors.companyName?.message}
                />
              )}
            />

            <Controller
              control={ownerForm.control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Seu nome *"
                  placeholder="Ex: João Silva"
                  autoCapitalize="words"
                  returnKeyType="next"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={ownerForm.formState.errors.fullName?.message}
                />
              )}
            />

            <Controller
              control={ownerForm.control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="E-mail *"
                  placeholder="voce@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={ownerForm.formState.errors.email?.message}
                />
              )}
            />

            <Controller
              control={ownerForm.control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Senha *"
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  hint="Mínimo 8 caracteres"
                  onSubmitEditing={onSubmitOwner}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={ownerForm.formState.errors.password?.message}
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

            {ownerForm.formState.errors.root?.message ? (
              <Text className="text-caption text-danger text-center">
                {ownerForm.formState.errors.root.message}
              </Text>
            ) : null}

            <Button
              size="lg"
              className="w-full mt-2"
              loading={isLoading}
              onPress={onSubmitOwner}
            >
              <ButtonText>Criar conta</ButtonText>
            </Button>
          </View>
        )}

        {/* ── Formulário: membro via convite ── */}
        {activeTab === 'member' && (
          <View className="gap-4">
            <Controller
              control={memberForm.control}
              name="inviteCode"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Código de convite *"
                  placeholder="Ex: AB12CD"
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={6}
                  returnKeyType="next"
                  hint="6 caracteres — peça ao dono da empresa"
                  value={value}
                  onChangeText={(text) => onChange(text.toUpperCase())}
                  onBlur={onBlur}
                  error={memberForm.formState.errors.inviteCode?.message}
                />
              )}
            />

            <Controller
              control={memberForm.control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Seu nome *"
                  placeholder="Ex: Ana Souza"
                  autoCapitalize="words"
                  returnKeyType="next"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={memberForm.formState.errors.fullName?.message}
                />
              )}
            />

            <Controller
              control={memberForm.control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="E-mail *"
                  placeholder="voce@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={memberForm.formState.errors.email?.message}
                />
              )}
            />

            <Controller
              control={memberForm.control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Senha *"
                  placeholder="••••••••"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  returnKeyType="done"
                  hint="Mínimo 8 caracteres"
                  onSubmitEditing={onSubmitMember}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={memberForm.formState.errors.password?.message}
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

            {memberForm.formState.errors.root?.message ? (
              <Text className="text-caption text-danger text-center">
                {memberForm.formState.errors.root.message}
              </Text>
            ) : null}

            <Button
              size="lg"
              className="w-full mt-2"
              loading={isLoading}
              onPress={onSubmitMember}
            >
              <ButtonText>Entrar na empresa</ButtonText>
            </Button>
          </View>
        )}

        {/* Rodapé: voltar para login */}
        <View className="flex-row items-center justify-center mt-8 gap-1">
          <Text className="text-body text-ink-500">Já tem conta?</Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text className="text-body text-honey-600 font-semibold">Entrar</Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
}
