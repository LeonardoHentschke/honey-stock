import * as React from 'react';
import { Text } from 'react-native';
import { cn } from '@/shared/lib/utils';

const Label = React.forwardRef<
  React.ElementRef<typeof Text>,
  React.ComponentProps<typeof Text>
>(({ className, ...props }, ref) => (
  <Text
    ref={ref}
    className={cn('text-label text-ink-700 font-medium', className)}
    {...props}
  />
));

Label.displayName = 'Label';

export { Label };
