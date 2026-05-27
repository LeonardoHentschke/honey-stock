import React from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { Controller } from 'react-hook-form';
import { CheckCircle2, ArrowLeft } from 'lucide-react-native';

import { Input } from '@/components/ui/input';
import { Button, ButtonText } from '@/components/ui/button';
import { useForgotPasswordViewModel } from '../viewmodels/useForgotPasswordViewModel';
import type { AuthStackScreenProps } from '@/navigation/types';

export function ForgotPasswordScreen({ navigation }: AuthStackScreenProps<'ForgotPassword'>) {
  const { control, errors, isLoading, success, onSubmit } = useForgotPasswordViewModel();

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-ink-50"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header manual */}
      <View className="px-4 pt-14 pb-2">
        <Pressable
          onPress={() => navigation.goBack()}
          className="flex-row items-center gap-1 self-start"
          hitSlop={8}
        >
          <ArrowLeft size={20} color="#E89B12" />
          <Text className="text-body text-honey-600 font-medium">Voltar</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerClassName="flex-grow px-6 pt-4 pb-10"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {success ? (
          /* ── Estado de sucesso ── */
          <View className="flex-1 items-center justify-center gap-4">
            <CheckCircle2 size={64} color="#E89B12" />
            <Text className="text-h2 text-ink-900 font-semibold text-center">
              Link enviado!
            </Text>
            <Text className="text-body text-ink-500 text-center">
              Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
            </Text>
            <Button
              variant="secondary"
              size="lg"
              className="w-full mt-4"
              onPress={() => navigation.navigate('Login')}
            >
              <ButtonText>Voltar ao login</ButtonText>
            </Button>
          </View>
        ) : (
          /* ── Formulário ── */
          <View className="gap-4">
            <Text className="text-h1 text-ink-900 font-bold mb-1">Esqueci minha senha</Text>
            <Text className="text-body text-ink-500 mb-4">
              Informe seu e-mail e enviaremos um link para você criar uma nova senha.
            </Text>

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="E-mail"
                  placeholder="voce@email.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="send"
                  onSubmitEditing={onSubmit}
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  error={errors.email?.message}
                />
              )}
            />

            {errors.root?.message ? (
              <Text className="text-caption text-danger text-center">
                {errors.root.message}
              </Text>
            ) : null}

            <Button
              size="lg"
              className="w-full mt-2"
              loading={isLoading}
              onPress={onSubmit}
            >
              <ButtonText>Enviar link</ButtonText>
            </Button>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
