import * as React from 'react';
import { ActivityIndicator, Pressable, Text } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import * as Slot from '@rn-primitives/slot';
import type { SlottablePressableProps, PressableRef } from '@rn-primitives/types';
import { cn } from '@/shared/lib/utils';

// Contexto que propaga a classe de texto para filhos <ButtonText>
const TextClassContext = React.createContext<string | undefined>(undefined);

const buttonVariants = cva(
  'flex-row items-center justify-center rounded-md active:opacity-80',
  {
    variants: {
      variant: {
        default:     'bg-honey-500',
        secondary:   'bg-honey-100',
        ghost:       'bg-transparent',
        destructive: 'bg-danger',
        outline:     'border border-ink-100 bg-transparent',
      },
      size: {
        sm: 'h-9 px-3 gap-1',
        md: 'h-12 px-4 gap-2',
        lg: 'h-[52px] px-6 gap-2',
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

// Cor do spinner mapeada por variant (ActivityIndicator não aceita NativeWind)
const spinnerColor: Record<string, string> = {
  default:     '#FFFFFF',
  secondary:   '#B8740C',
  ghost:       '#C47C0A',
  destructive: '#FFFFFF',
  outline:     '#1F1B16',
};

type ButtonProps = SlottablePressableProps &
  VariantProps<typeof buttonVariants> & {
    /** Exibe spinner e desabilita o botão enquanto verdadeiro */
    loading?: boolean;
  };

const Button = React.forwardRef<PressableRef, ButtonProps>(
  ({ className, variant, size, asChild = false, disabled, loading, children, ...props }, ref) => {
    const Component = asChild ? Slot.Pressable : Pressable;
    const isDisabled = disabled || loading;
    return (
      <TextClassContext.Provider value={buttonTextVariants({ variant })}>
        <Component
          ref={ref}
          className={cn(
            buttonVariants({ variant, size }),
            isDisabled && 'opacity-50',
            className,
          )}
          disabled={isDisabled}
          {...props}
        >
          {loading ? (
            <ActivityIndicator size="small" color={spinnerColor[variant ?? 'default']} />
          ) : (
            children
          )}
        </Component>
      </TextClassContext.Provider>
    );
  }
);
Button.displayName = 'Button';

/**
 * Texto do botão — herda automaticamente a cor do variant do <Button> pai.
 * Use sempre dentro de um <Button>.
 */
const ButtonText = React.forwardRef<
  React.ElementRef<typeof Text>,
  React.ComponentPropsWithoutRef<typeof Text>
>(({ className, ...props }, ref) => {
  const textClass = React.useContext(TextClassContext);
  return <Text ref={ref} className={cn(textClass, className)} {...props} />;
});
ButtonText.displayName = 'ButtonText';

export { Button, ButtonText, buttonVariants, buttonTextVariants, TextClassContext };
export type { ButtonProps };
