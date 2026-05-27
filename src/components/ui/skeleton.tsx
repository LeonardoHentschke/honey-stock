import * as React from 'react';
import { View, Animated } from 'react-native';
import { cn } from '@/shared/lib/utils';

interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number;
}

function Skeleton({ className, width, height = 20 }: SkeletonProps) {
  const opacity = React.useRef(new Animated.Value(0.4)).current;

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[{ opacity, height, width: width as number }]}
      className={cn('bg-honey-50 rounded-md', className)}
    />
  );
}

export { Skeleton };
