import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface NotificationBadgeProps {
  count: number;
  size?: "small" | "medium" | "large";
  color?: string;
  textColor?: string;
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  count,
  size = "medium",
  color = "#FF5722",
  textColor = "#FFFFFF",
}) => {
  if (count === 0) return null;

  const displayCount = count > 99 ? "99+" : count.toString();

  const sizeStyles = {
    small: { minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4 },
    medium: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 6,
    },
    large: { minWidth: 24, height: 24, borderRadius: 12, paddingHorizontal: 8 },
  };

  const textSizes = {
    small: 10,
    medium: 12,
    large: 14,
  };

  return (
    <View style={[styles.badge, sizeStyles[size], { backgroundColor: color }]}>
      <Text
        style={[
          styles.badgeText,
          { color: textColor, fontSize: textSizes[size] },
        ]}
      >
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  badgeText: {
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 12,
  },
});

// Default export for Expo Router compatibility
const NotificationBadgeDefault = NotificationBadge;
export { NotificationBadgeDefault as default };
