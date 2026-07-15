import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Animated, StyleSheet } from 'react-native';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastStore, type ToastType, type ToastData } from '@/shared/stores/toastStore';

const AUTO_DISMISS_MS = 2500;

const TYPE_STYLES: Record<ToastType, { color: string; Icon: typeof CheckCircle2 }> = {
  success: { color: '#2E7D32', Icon: CheckCircle2 },
  error: { color: '#B3261E', Icon: AlertCircle },
  info: { color: '#1565C0', Icon: Info },
};

/**
 * Host global de toast (DESIGN.md §5.7): aparece no topo, some sozinho.
 * Montado uma vez em src/app/index.tsx; disparado via useToastStore.show().
 */
export function AppToast() {
  const { top } = useSafeAreaInsets();
  const toast = useToastStore((s) => s.toast);
  const hide = useToastStore((s) => s.hide);

  // Mantém o último toast renderizado durante a animação de saída
  const [rendered, setRendered] = useState<ToastData | null>(null);
  const progress = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    if (toast) {
      setRendered(toast);
      Animated.spring(progress, {
        toValue: 1,
        useNativeDriver: true,
        speed: 18,
        bounciness: 6,
      }).start();
      timerRef.current = setTimeout(hide, AUTO_DISMISS_MS);
    } else {
      Animated.timing(progress, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setRendered(null);
      });
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [toast]);

  if (!rendered) return null;

  const { color, Icon } = TYPE_STYLES[rendered.type];

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { top: top + 12 }]}>
      <Animated.View
        style={{
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [-24, 0],
              }),
            },
          ],
        }}
      >
        <Pressable style={styles.card} onPress={hide}>
          <View style={[styles.accent, { backgroundColor: color }]} />
          <Icon size={20} color={color} />
          <View style={styles.texts}>
            <Text style={styles.title}>{rendered.title}</Text>
            {rendered.message ? <Text style={styles.message}>{rendered.message}</Text> : null}
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    overflow: 'hidden',
    shadowColor: '#1F1B16',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 8,
  },
  accent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  texts: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: '600', color: '#1F1B16' },
  message: { fontSize: 13, color: '#6B6258' },
});
