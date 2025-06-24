import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  isDarkMode?: boolean;
}

const { width, height } = Dimensions.get("window");

export default function LoadingOverlay({
  visible,
  message = "Loading...",
  isDarkMode = false,
}: LoadingOverlayProps) {
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.8);

  React.useEffect(() => {
    if (visible) {
      rotation.value = withRepeat(
        withTiming(360, { duration: 2000 }),
        -1,
        false
      );
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
    } else {
      scale.value = withSpring(0.8);
    }
  }, [visible]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${rotation.value}deg`,
        },
        {
          scale: scale.value,
        },
      ],
    };
  });

  // Fix: Declare dot styles outside of render loop
  const dotAnimatedStyles = [0, 1, 2].map((index) =>
    useAnimatedStyle(() => {
      const opacity = interpolate(
        rotation.value,
        [
          (index * 120) % 360,
          (index * 120 + 60) % 360,
          (index * 120 + 120) % 360,
        ],
        [0.3, 1, 0.3],
        "clamp"
      );
      return { opacity };
    })
  );

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      statusBarTranslucent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={
            isDarkMode
              ? ["rgba(0,0,0,0.7)", "rgba(0,0,0,0.9)"]
              : ["rgba(255,255,255,0.8)", "rgba(255,255,255,0.95)"]
          }
          style={styles.gradient}
        >
          <View
            style={[
              styles.container,
              {
                backgroundColor: isDarkMode
                  ? "rgba(31, 41, 55, 0.95)"
                  : "rgba(249, 250, 251, 0.95)",
                borderColor: isDarkMode ? "#374151" : "#E5E7EB",
              },
            ]}
          >
            <Animated.View style={[styles.spinnerContainer, animatedStyle]}>
              <LinearGradient
                colors={
                  isDarkMode
                    ? ["#3B82F6", "#8B5CF6", "#06B6D4"]
                    : ["#2563EB", "#7C3AED", "#0891B2"]
                }
                style={styles.spinner}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.spinnerInner} />
              </LinearGradient>
            </Animated.View>

            <Text
              style={[
                styles.message,
                { color: isDarkMode ? "#F9FAFB" : "#111827" },
              ]}
            >
              {message}
            </Text>

            <View style={styles.dots}>
              {[0, 1, 2].map((index) => (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    { backgroundColor: isDarkMode ? "#3B82F6" : "#2563EB" },
                    dotAnimatedStyles[index],
                  ]}
                />
              ))}
            </View>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  gradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    padding: 32,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    minWidth: 200,
  },
  spinnerContainer: {
    marginBottom: 24,
  },
  spinner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  spinnerInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderTopColor: "rgba(255, 255, 255, 0.8)",
  },
  message: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 16,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
