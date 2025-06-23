import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

interface AnimatedBackgroundProps {
  isDarkMode?: boolean;
}

const AnimatedBackground: React.FC<AnimatedBackgroundProps> = ({
  isDarkMode = false,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: 8000,
        easing: Easing.bezier(0.4, 0, 0.6, 1),
      }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [0, 50]);
    const translateY = interpolate(progress.value, [0, 1], [0, 30]);
    const scale = interpolate(progress.value, [0, 0.5, 1], [1, 1.1, 1]);

    return {
      transform: [{ translateX }, { translateY }, { scale }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.gradientContainer, animatedStyle]}>
        <LinearGradient
          colors={
            isDarkMode
              ? ["#1F2937", "#111827", "#0F172A"]
              : ["#FFFFFF", "#F9FAFB", "#F3F4F6"]
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        />
      </Animated.View>

      {/* Subtle overlay pattern */}
      <View
        style={[
          styles.overlay,
          {
            backgroundColor: isDarkMode ? "#11182710" : "#F9FAFB10",
          },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  gradientContainer: {
    width: width * 1.5,
    height: height * 1.5,
    position: "absolute",
    top: -height * 0.25,
    left: -width * 0.25,
  },
  gradient: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
});

export default AnimatedBackground;
