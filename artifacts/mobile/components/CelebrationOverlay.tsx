import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

const CONFETTI_COLORS = [
  "#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1",
  "#96CEB4", "#FFEAA7", "#DDA0DD", "#98FB98",
  "#FF8C69", "#87CEEB",
];
const COUNT = 22;

interface Particle {
  animY: Animated.Value;
  animO: Animated.Value;
  x: number;
  color: string;
  size: number;
  delay: number;
  rotation: string;
}

export function CelebrationOverlay({ visible }: { visible: boolean }) {
  const particles = useRef<Particle[]>(
    Array.from({ length: COUNT }, (_, i) => ({
      animY: new Animated.Value(0),
      animO: new Animated.Value(0),
      x: 4 + (i / COUNT) * 92 + (Math.random() - 0.5) * 8,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size: 7 + Math.floor(Math.random() * 7),
      delay: Math.floor(Math.random() * 350),
      rotation: `${Math.random() > 0.5 ? "" : "-"}${Math.floor(120 + Math.random() * 360)}deg`,
    }))
  ).current;

  useEffect(() => {
    if (!visible) return;
    particles.forEach((p) => {
      p.animY.setValue(0);
      p.animO.setValue(0);
    });
    const animations = particles.map((p) =>
      Animated.sequence([
        Animated.delay(p.delay),
        Animated.parallel([
          Animated.timing(p.animY, {
            toValue: 1,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(p.animO, {
              toValue: 1,
              duration: 100,
              useNativeDriver: true,
            }),
            Animated.timing(p.animO, {
              toValue: 0,
              duration: 700,
              delay: 600,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ])
    );
    Animated.parallel(animations).start();
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p, i) => {
        const translateY = p.animY.interpolate({
          inputRange: [0, 1],
          outputRange: [-10, 680],
        });
        const rotate = p.animY.interpolate({
          inputRange: [0, 1],
          outputRange: ["0deg", p.rotation],
        });
        return (
          <Animated.View
            key={i}
            style={[
              styles.particle,
              {
                left: `${p.x}%` as any,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                borderRadius: i % 3 === 0 ? p.size / 2 : 2,
                transform: [{ translateY }, { rotate }],
                opacity: p.animO,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: { position: "absolute", top: 40 },
});
