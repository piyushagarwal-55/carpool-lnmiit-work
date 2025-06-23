import React, { useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { Text, useTheme } from "react-native-paper";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  interpolate,
  Easing,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

interface LoadingScreenProps {
  isDarkMode?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  isDarkMode = false,
}) => {
  const theme = useTheme();

  // Animation values
  const logoScale = useSharedValue(0.8);
  const logoOpacity = useSharedValue(0);
  const wave1 = useSharedValue(0);
  const wave2 = useSharedValue(0);
  const wave3 = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const dotsProgress = useSharedValue(0);

  useEffect(() => {
    // Logo entrance animation
    logoOpacity.value = withTiming(1, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
    logoScale.value = withSequence(
      withTiming(1.1, { duration: 600, easing: Easing.out(Easing.back(1.5)) }),
      withTiming(1, { duration: 200 })
    );

    // Wave animations with delays
    wave1.value = withDelay(
      400,
      withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );

    wave2.value = withDelay(
      600,
      withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );

    wave3.value = withDelay(
      800,
      withRepeat(
        withTiming(1, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );

    // Text fade in
    textOpacity.value = withDelay(
      1000,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) })
    );

    // Loading dots animation
    dotsProgress.value = withDelay(
      1200,
      withRepeat(
        withTiming(3, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        -1,
        false
      )
    );
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const wave1Style = useAnimatedStyle(() => {
    const scale = interpolate(wave1.value, [0, 1], [1, 1.3]);
    const opacity = interpolate(wave1.value, [0, 0.5, 1], [0.8, 0.3, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const wave2Style = useAnimatedStyle(() => {
    const scale = interpolate(wave2.value, [0, 1], [1, 1.5]);
    const opacity = interpolate(wave2.value, [0, 0.5, 1], [0.6, 0.2, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const wave3Style = useAnimatedStyle(() => {
    const scale = interpolate(wave3.value, [0, 1], [1, 1.7]);
    const opacity = interpolate(wave3.value, [0, 0.5, 1], [0.4, 0.1, 0]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  const dot1Style = useAnimatedStyle(() => {
    const opacity = interpolate(
      dotsProgress.value,
      [0, 0.5, 1, 1.5, 2, 2.5, 3],
      [0.3, 1, 0.3, 0.3, 0.3, 0.3, 0.3]
    );
    const scale = interpolate(dotsProgress.value, [0, 0.5, 1], [0.8, 1.2, 0.8]);
    return { opacity, transform: [{ scale }] };
  });

  const dot2Style = useAnimatedStyle(() => {
    const opacity = interpolate(
      dotsProgress.value,
      [0, 0.5, 1, 1.5, 2, 2.5, 3],
      [0.3, 0.3, 1, 0.3, 0.3, 0.3, 0.3]
    );
    const scale = interpolate(dotsProgress.value, [1, 1.5, 2], [0.8, 1.2, 0.8]);
    return { opacity, transform: [{ scale }] };
  });

  const dot3Style = useAnimatedStyle(() => {
    const opacity = interpolate(
      dotsProgress.value,
      [0, 0.5, 1, 1.5, 2, 2.5, 3],
      [0.3, 0.3, 0.3, 1, 0.3, 0.3, 0.3]
    );
    const scale = interpolate(dotsProgress.value, [2, 2.5, 3], [0.8, 1.2, 0.8]);
    return { opacity, transform: [{ scale }] };
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={
          isDarkMode
            ? ["#0f172a", "#1e293b", "#334155"]
            : ["#ffffff", "#f8fafc", "#e2e8f0"]
        }
        style={styles.gradient}
      />

      {/* Animated waves */}
      <View style={styles.wavesContainer}>
        <Animated.View style={[styles.wave, wave3Style]}>
          <View
            style={[
              styles.waveCircle,
              {
                backgroundColor: isDarkMode ? "#6366f150" : "#6366f130",
              },
            ]}
          />
        </Animated.View>
        <Animated.View style={[styles.wave, wave2Style]}>
          <View
            style={[
              styles.waveCircle,
              {
                backgroundColor: isDarkMode ? "#8b5cf660" : "#8b5cf640",
              },
            ]}
          />
        </Animated.View>
        <Animated.View style={[styles.wave, wave1Style]}>
          <View
            style={[
              styles.waveCircle,
              {
                backgroundColor: isDarkMode ? "#06b6d470" : "#06b6d450",
              },
            ]}
          />
        </Animated.View>
      </View>

      {/* Logo */}
      <View style={styles.logoContainer}>
        <Animated.View style={[styles.logoWrapper, logoAnimatedStyle]}>
          <LinearGradient
            colors={["#6366f1", "#8b5cf6"]}
            style={styles.logoCircle}
          >
            <Text style={styles.logoText}>L</Text>
          </LinearGradient>
        </Animated.View>

        <Animated.View style={[styles.titleContainer, textAnimatedStyle]}>
          <Text
            style={[
              styles.appTitle,
              { color: isDarkMode ? "#f8fafc" : "#1e293b" },
            ]}
          >
            LNMIIT Carpool
          </Text>
          <Text
            style={[
              styles.appSubtitle,
              { color: isDarkMode ? "#94a3b8" : "#64748b" },
            ]}
          >
            Smart campus transportation
          </Text>
        </Animated.View>
      </View>

      {/* Loading indicator */}
      <View style={styles.loadingContainer}>
        <View style={styles.dotsContainer}>
          <Animated.View style={[styles.dot, dot1Style]} />
          <Animated.View style={[styles.dot, dot2Style]} />
          <Animated.View style={[styles.dot, dot3Style]} />
        </View>
        <Animated.Text
          style={[
            styles.loadingText,
            textAnimatedStyle,
            { color: isDarkMode ? "#94a3b8" : "#64748b" },
          ]}
        >
          Initializing your ride experience
        </Animated.Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  wavesContainer: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  wave: {
    position: "absolute",
    justifyContent: "center",
    alignItems: "center",
  },
  waveCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  logoContainer: {
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  logoWrapper: {
    marginBottom: 32,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  logoText: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#ffffff",
  },
  titleContainer: {
    alignItems: "center",
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  appSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 48,
  },
  loadingContainer: {
    position: "absolute",
    bottom: 120,
    alignItems: "center",
  },
  dotsContainer: {
    flexDirection: "row",
    marginBottom: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#6366f1",
    marginHorizontal: 4,
  },
  loadingText: {
    fontSize: 14,
    textAlign: "center",
  },
});

export default LoadingScreen;
