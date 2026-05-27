import React from 'react';
import { View, Text } from 'react-native';

interface SectionHeaderProps {
  children: React.ReactNode;
  /** Elemento opcional à direita (ex: link "Ver todos") */
  action?: React.ReactNode;
  style?: object;
}

/**
 * Cabeçalho de seção com título h3 e ação opcional.
 * Padding horizontal padrão de 24px.
 */
export function SectionHeader({ children, action, style }: SectionHeaderProps) {
  return (
    <View
      className="flex-row items-center justify-between px-6"
      style={style}
    >
      <Text className="text-h3 text-ink-900">{children}</Text>
      {action ? <View>{action}</View> : null}
    </View>
  );
}
