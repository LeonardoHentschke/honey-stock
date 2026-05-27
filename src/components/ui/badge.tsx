import * as React from 'react';
import { View, Text } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const badgeVariants = cva(
  'flex-row items-center px-2.5 py-1 rounded-full self-start',
  {
    variants: {
      variant: {
        // Tipo de cliente
        final:     'bg-honey-100',
        reseller:  'bg-wood-100',
        // Status de venda
        scheduled: 'bg-info-tint',
        delivered: 'bg-success-tint',
        completed: 'bg-success-tint',
        canceled:  'bg-ink-100',
        // Estoque
        low:       'bg-warning-tint',
        'low-stock': 'bg-warning-tint',
        // Genérico
        neutral:   'bg-ink-100',
        default:   'bg-ink-100',
        success:   'bg-success-tint',
        warning:   'bg-warning-tint',
        danger:    'bg-danger-tint',
        info:      'bg-info-tint',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

const badgeTextVariants = cva('text-caption font-medium', {
  variants: {
    variant: {
      final:     'text-honey-700',
      reseller:  'text-wood-500',
      scheduled: 'text-info',
      delivered: 'text-success',
      completed: 'text-success',
      canceled:  'text-ink-500',
      low:       'text-warning',
      'low-stock': 'text-warning',
      neutral:   'text-ink-700',
      default:   'text-ink-700',
      success:   'text-success',
      warning:   'text-warning',
      danger:    'text-danger',
      info:      'text-info',
    },
  },
  defaultVariants: { variant: 'default' },
});

interface BadgeProps extends VariantProps<typeof badgeVariants> {
  label: string;
  className?: string;
}

function Badge({ label, variant, className }: BadgeProps) {
  return (
    <View className={cn(badgeVariants({ variant }), className)}>
      <Text className={cn(badgeTextVariants({ variant }))}>{label}</Text>
    </View>
  );
}

export { Badge, badgeVariants };
export type { BadgeProps };
