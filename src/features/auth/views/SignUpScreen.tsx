import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
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
    <KeyboardAvoidingView
      className="flex-1 bg-ink-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerClassName="flex-grow px-6 pt-14 pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Título */}
        <Text className="text-h1 text-ink-900 font-bold mb-6">Criar conta</Text>

        {/* Tabs */}
        <View className="flex-row bg-ink-100 rounded-md p-1 mb-6">
          {(['owner', 'member'] as SignUpTab[]).map((tab) => (
            <Pressable
              key={tab}
              onPress={() => setActiveTab(tab)}
              className={cn(
                'flex-1 py-2 rounded items-center',
                activeTab === tab ? 'bg-white shadow-sm' : '',
              )}
            >
              <Text
                className={cn(
                  'text-label font-medium',
                  activeTab === tab ? 'text-ink-900' : 'text-ink-500',
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
                <View>
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
                  />
                  <Pressable
                    className="absolute right-3 bottom-3"
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
                <View>
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
                  />
                  <Pressable
                    className="absolute right-3 bottom-3"
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
