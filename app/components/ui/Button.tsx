import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";
import { useTheme } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "small" | "medium" | "large";
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  textStyle,
}) => {
  const theme = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = () => {
    scale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    opacity.value = withTiming(1, { duration: 100 });
  };

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    }),
    []
  );

  const getButtonStyles = () => {
    const baseStyle = [
      styles.button,
      styles[size],
      fullWidth && styles.fullWidth,
      disabled && styles.disabled,
    ];

    switch (variant) {
      case "primary":
        return [...baseStyle, { backgroundColor: theme.colors.primary }];
      case "secondary":
        return [...baseStyle, { backgroundColor: theme.colors.surfaceVariant }];
      case "outline":
        return [
          ...baseStyle,
          {
            backgroundColor: "transparent",
            borderWidth: 1.5,
            borderColor: theme.colors.primary,
          },
        ];
      case "ghost":
        return [...baseStyle, { backgroundColor: "transparent" }];
      case "danger":
        return [...baseStyle, { backgroundColor: theme.colors.error }];
      default:
        return [...baseStyle, { backgroundColor: theme.colors.primary }];
    }
  };

  const getTextStyles = () => {
    const baseTextStyle = [styles.text, styles[`${size}Text`]];

    switch (variant) {
      case "primary":
        return [...baseTextStyle, { color: theme.colors.onPrimary }];
      case "secondary":
        return [...baseTextStyle, { color: theme.colors.onSurfaceVariant }];
      case "outline":
        return [...baseTextStyle, { color: theme.colors.primary }];
      case "ghost":
        return [...baseTextStyle, { color: theme.colors.primary }];
      case "danger":
        return [...baseTextStyle, { color: theme.colors.onError }];
      default:
        return [...baseTextStyle, { color: theme.colors.onPrimary }];
    }
  };

  const renderButton = () => (
    <AnimatedTouchableOpacity
      style={[
        getButtonStyles(),
        animatedStyle,
        style,
        loading && { opacity: 0.7 },
      ]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      activeOpacity={0.9}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={
            variant === "outline"
              ? theme.colors.primary
              : variant === "ghost"
              ? theme.colors.primary
              : theme.colors.onPrimary
          }
        />
      ) : (
        <>
          {leftIcon && <>{leftIcon}</>}
          <Text style={[getTextStyles(), textStyle]}>{title}</Text>
          {rightIcon && <>{rightIcon}</>}
        </>
      )}
    </AnimatedTouchableOpacity>
  );

  if (variant === "primary" && !disabled) {
    return (
      <AnimatedTouchableOpacity
        style={[animatedStyle, style]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={["#6366f1", "#8b5cf6"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.button,
            styles[size],
            fullWidth && styles.fullWidth,
            loading && { opacity: 0.7 },
          ]}
        >
          {loading ? (
            <ActivityIndicator size="small" color={theme.colors.onPrimary} />
          ) : (
            <>
              {leftIcon && <>{leftIcon}</>}
              <Text style={[getTextStyles(), textStyle]}>{title}</Text>
              {rightIcon && <>{rightIcon}</>}
            </>
          )}
        </LinearGradient>
      </AnimatedTouchableOpacity>
    );
  }

  return renderButton();
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  small: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 36,
  },
  medium: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    minHeight: 48,
  },
  large: {
    paddingHorizontal: 32,
    paddingVertical: 16,
    minHeight: 56,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: "600",
    textAlign: "center",
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});

export default Button;
