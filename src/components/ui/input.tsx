import * as React from 'react';
import { TextInput, View, Text } from 'react-native';
import { cn } from '@/shared/lib/utils';

interface InputProps extends React.ComponentProps<typeof TextInput> {
  label?: string;
  error?: string;
  hint?: string;
  trailing?: React.ReactNode;
}

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  ({ label, error, hint, trailing, className, style, ...props }, ref) => {
    return (
      <View className="gap-1">
        {label ? (
          <Text className="text-label text-ink-700 font-medium">{label}</Text>
        ) : null}
        <View>
          <TextInput
            ref={ref}
            className={cn(
              'h-12 px-4 rounded-md border border-ink-100 bg-white',
              'text-body text-ink-900',
              'placeholder:text-ink-300',
              error && 'border-danger',
              trailing && 'pr-12',
              className
            )}
            placeholderTextColor="#A89E91"
            style={style}
            {...props}
          />
          {trailing ? (
            <View
              style={{
                position: 'absolute',
                right: 4,
                top: 0,
                bottom: 0,
                justifyContent: 'center',
                alignItems: 'center',
                width: 40,
              }}
            >
              {trailing}
            </View>
          ) : null}
        </View>
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
