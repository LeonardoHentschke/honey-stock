import * as React from 'react';
import { Pressable, Text } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/shared/lib/utils';

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-md active:opacity-80',
  {
    variants: {
      variant: {
        default:     'bg-honey-500',
        secondary:   'bg-honey-100',
        ghost:       'bg-transparent',
        destructive: 'bg-danger',
        outline:     'bg-transparent border border-ink-100',
      },
      size: {
        sm: 'h-9 px-3',
        md: 'h-11 px-4',
        lg: 'h-13 px-6',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

const buttonTextVariants = cva('font-semibold text-body-strong', {
  variants: {
    variant: {
      default:     'text-white',
      secondary:   'text-honey-700',
      ghost:       'text-honey-600',
      destructive: 'text-white',
      outline:     'text-ink-900',
    },
  },
  defaultVariants: { variant: 'default' },
});

interface ButtonProps
  extends React.ComponentProps<typeof Pressable>,
    VariantProps<typeof buttonVariants> {
  label: string;
  /** Ícone exibido à esquerda do texto */
  leftIcon?: React.ReactNode;
  /** Ícone exibido à direita do texto */
  rightIcon?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const Button = React.forwardRef<React.ElementRef<typeof Pressable>, ButtonProps>(
  ({ label, variant, size, loading, fullWidth, leftIcon, rightIcon, className, disabled, ...props }, ref) => {
    return (
      <Pressable
        ref={ref}
        className={cn(
          buttonVariants({ variant, size }),
          fullWidth && 'w-full',
          (disabled || loading) && 'opacity-50',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {leftIcon && !loading ? <>{leftIcon}<Text> </Text></> : null}
        <Text className={cn(buttonTextVariants({ variant }))}>
          {loading ? 'Aguarde...' : label}
        </Text>
        {rightIcon && !loading ? <><Text> </Text>{rightIcon}</> : null}
      </Pressable>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
export type { ButtonProps };
