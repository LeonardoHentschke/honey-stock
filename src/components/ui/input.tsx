import * as React from 'react';
import { TextInput, View, Text } from 'react-native';
import { cn } from '@/shared/lib/utils';

interface InputProps extends React.ComponentProps<typeof TextInput> {
  label?: string;
  error?: string;
  hint?: string;
}

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <View className="gap-1">
        {label ? (
          <Text className="text-label text-ink-700 font-medium">{label}</Text>
        ) : null}
        <TextInput
          ref={ref}
          className={cn(
            'h-12 px-4 rounded-md border border-ink-100 bg-white',
            'text-body text-ink-900',
            'placeholder:text-ink-300',
            error && 'border-danger',
            className
          )}
          placeholderTextColor="#A89E91"
          {...props}
        />
        {error ? (
          <Text className="text-caption text-danger">{error}</Text>
        ) : hint ? (
          <Text className="text-caption text-ink-500">{hint}</Text>
        ) : null}
      </View>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
