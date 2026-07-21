import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  cancelAnimation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { BeeSvg } from '@/components/ui/bee-svg';

interface FlyingBeesProps {
  minIntervalMs?: number;
  maxIntervalMs?: number;
}

interface BeeFlight {
  id: number;
  direction: 'ltr' | 'rtl';
  baseY: number;
  amplitude: number;
  waves: number;
  durationMs: number;
  delayMs: number;
  size: number;
}

const BEE_OPACITY = 0.6;
const MAX_TILT_DEG = 12;

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/**
 * Overlay decorativo global: de tempos em tempos uma abelhinha atravessa a
 * tela num voo ondulado. Não intercepta toques (pointerEvents="none") e fica
 * abaixo do AppToast (zIndex 100). Pausa quando o app vai para background.
 */
export function FlyingBees({
  minIntervalMs = 20_000,
  maxIntervalMs = 90_000,
}: FlyingBeesProps) {
  const reducedMotion = useReducedMotion();
  const { height } = useWindowDimensions();
  const [flights, setFlights] = useState<BeeFlight[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextIdRef = useRef(0);
  const heightRef = useRef(height);
  heightRef.current = height;

  useEffect(() => {
    if (reducedMotion) return;

    const makeFlight = (delayMs: number): BeeFlight => ({
      id: nextIdRef.current++,
      direction: Math.random() < 0.5 ? 'ltr' : 'rtl',
      baseY: heightRef.current * rand(0.15, 0.75),
      amplitude: rand(12, 28),
      waves: Math.random() < 0.5 ? 2 : 3,
      durationMs: rand(4000, 8000),
      delayMs,
      size: Math.round(rand(24, 32)),
    });

    const schedule = () => {
      timerRef.current = setTimeout(() => {
        setFlights((prev) => {
          const next = [...prev, makeFlight(0)];
          if (Math.random() < 0.15) next.push(makeFlight(rand(600, 1200)));
          return next;
        });
        schedule();
      }, rand(minIntervalMs, maxIntervalMs));
    };

    schedule();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        if (timerRef.current === null) schedule();
      } else {
        if (timerRef.current !== null) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setFlights([]);
      }
    });

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      subscription.remove();
    };
  }, [reducedMotion, minIntervalMs, maxIntervalMs]);

  const handleDone = useCallback((id: number) => {
    setFlights((prev) => prev.filter((flight) => flight.id !== id));
  }, []);

  if (flights.length === 0) return null;

  return (
    <View pointerEvents="none" style={styles.overlay}>
      {flights.map((flight) => (
        <FlightBee key={flight.id} flight={flight} onDone={handleDone} />
      ))}
    </View>
  );
}

interface FlightBeeProps {
  flight: BeeFlight;
  onDone: (id: number) => void;
}

function FlightBee({ flight, onDone }: FlightBeeProps) {
  const { width } = useWindowDimensions();
  const progress = useSharedValue(0);
  const { id, direction, baseY, amplitude, waves, durationMs, delayMs, size } =
    flight;

  const offscreen = size * 1.5;
  const startX = direction === 'ltr' ? -offscreen : width + offscreen;
  const endX = direction === 'ltr' ? width + offscreen : -offscreen;

  useEffect(() => {
    progress.value = withDelay(
      delayMs,
      withTiming(
        1,
        { duration: durationMs, easing: Easing.linear },
        (finished) => {
          if (finished) runOnJS(onDone)(id);
        }
      )
    );
    return () => cancelAnimation(progress);
  }, [delayMs, durationMs, id, onDone, progress]);

  const animatedStyle = useAnimatedStyle(() => {
    const p = progress.value;
    const phase = p * waves * 2 * Math.PI;
    const tiltSign = direction === 'rtl' ? -1 : 1;
    return {
      opacity: interpolate(
        p,
        [0, 0.06, 0.94, 1],
        [0, BEE_OPACITY, BEE_OPACITY, 0]
      ),
      transform: [
        { translateX: interpolate(p, [0, 1], [startX, endX]) },
        { translateY: baseY + amplitude * Math.sin(phase) },
        { rotate: `${MAX_TILT_DEG * Math.cos(phase) * tiltSign}deg` },
        { scaleX: direction === 'rtl' ? -1 : 1 },
      ],
    };
  });

  return (
    <Animated.View style={[styles.bee, animatedStyle]}>
      <BeeSvg size={size} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
  },
  bee: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
