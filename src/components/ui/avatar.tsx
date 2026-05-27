import React from 'react';
import { View, Text } from 'react-native';
import { cn } from '@/shared/lib/utils';

interface AvatarProps {
  /** Iniciais a exibir (ex: "AT", "M") */
  initial: string;
  /** Tipo do cliente: reseller → wood palette; padrão → honey palette */
  type?: 'reseller' | 'final';
  /** Tamanho: sm=32, md=40, lg=48 */
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar({ initial, type, size = 'md' }: AvatarProps) {
  const isReseller = type === 'reseller';

  const containerSize =
    size === 'lg' ? 'w-12 h-12' : size === 'sm' ? 'w-8 h-8' : 'w-10 h-10';

  const bgColor = isReseller ? 'bg-wood-100' : 'bg-honey-100';
  const textColor = isReseller ? 'text-wood-500' : 'text-honey-700';
  const textSize =
    size === 'lg' ? 'text-label' : size === 'sm' ? 'text-caption' : 'text-label';

  return (
    <View
      className={cn(
        'items-center justify-center rounded-full',
        containerSize,
        bgColor
      )}
    >
      <Text className={cn('font-semibold', textColor, textSize)}>
        {initial}
      </Text>
    </View>
  );
}
