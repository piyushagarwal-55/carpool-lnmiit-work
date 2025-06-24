import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import {
  ArrowLeft,
  Bell,
  Check,
  X,
  MapPin,
  Calendar,
  Users,
  MessageSquare,
  AlertCircle,
  Clock,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "../lib/supabase";
import { createClient } from "@supabase/supabase-js";
import { NotificationService } from "../services/NotificationService";

const { width } = Dimensions.get("window");

interface NotificationScreenProps {
  onBack: () => void;
  isDarkMode?: boolean;
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
}

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data: any;
  read: boolean;
  created_at: string;
}

export default function NotificationScreen({
  onBack,
  isDarkMode = false,
  currentUser,
}: NotificationScreenProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      if (!currentUser?.id) {
        console.warn("No user ID available for fetching notifications");
        setNotifications([]);
        return;
      }
      const notifications = await NotificationService.fetchNotifications(
        currentUser.id
      );
      setNotifications(notifications || []);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await NotificationService.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      for (const notification of notifications.filter((n) => !n.read)) {
        await NotificationService.markAsRead(notification.id);
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "join_request":
        return <Users size={20} color="#2196F3" />;
      case "request_accepted":
        return <Check size={20} color="#4CAF50" />;
      case "request_rejected":
        return <X size={20} color="#F44336" />;
      case "ride_updated":
        return <AlertCircle size={20} color="#FF9800" />;
      case "ride_cancelled":
        return <X size={20} color="#F44336" />;
      case "chat_message":
        return <MessageSquare size={20} color="#9C27B0" />;
      default:
        return <Bell size={20} color="#6B7280" />;
    }
  };

  const getNotificationCardColor = (
    notification: Notification,
    index: number
  ) => {
    if (isDarkMode) return "#1F2937";
    const colors = ["#E3F2FD", "#F3E5F5", "#E8F5E8", "#FFF3E0", "#FFEBEE"];
    return colors[index % colors.length];
  };

  const getStatusColor = (type: string) => {
    switch (type) {
      case "join_request":
        return "#2196F3";
      case "request_accepted":
        return "#4CAF50";
      case "request_rejected":
        return "#F44336";
      case "ride_updated":
        return "#FF9800";
      case "ride_cancelled":
        return "#F44336";
      case "chat_message":
        return "#9C27B0";
      default:
        return "#6B7280";
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMinutes = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60)
    );

    if (diffMinutes < 1) return "Just now";
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    if (diffMinutes < 10080) return `${Math.floor(diffMinutes / 1440)}d ago`;

    return date.toLocaleDateString();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const readNotifications = notifications.filter((n) => n.read);
  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#000000" : "#F8FAFC" },
      ]}
    >
      {/* Modern Header */}
      <View
        style={[
          styles.modernHeader,
          {
            backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.modernBackButton,
            {
              backgroundColor: isDarkMode ? "#374151" : "#F3F4F6",
            },
          ]}
          onPress={onBack}
        >
          <ArrowLeft size={20} color={isDarkMode ? "#FFFFFF" : "#000000"} />
        </TouchableOpacity>

        <View style={styles.modernHeaderContent}>
          <Text
            style={[
              styles.modernTitle,
              { color: isDarkMode ? "#FFFFFF" : "#000000" },
            ]}
          >
            Notifications
          </Text>
          <Text
            style={[
              styles.modernSubtitle,
              { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={[styles.statBadge, { backgroundColor: "#4CAF50" }]}
            onPress={markAllAsRead}
          >
            <Text style={styles.statBadgeText}>{unreadCount}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Notifications List */}
      <ScrollView
        style={styles.modernNotificationsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#4CAF50"]}
            tintColor={isDarkMode ? "#FFF" : "#000"}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <View style={styles.modernEmptyState}>
            <View style={styles.emptyStateIconContainer}>
              <Clock size={32} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
            </View>
            <Text
              style={[
                styles.modernEmptyStateTitle,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
            >
              Loading notifications...
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.modernEmptyState}>
            <View style={styles.emptyStateIconContainer}>
              <Bell size={48} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
            </View>
            <Text
              style={[
                styles.modernEmptyStateTitle,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
            >
              No notifications yet
            </Text>
            <Text
              style={[
                styles.modernEmptyStateSubtext,
                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              You'll see ride updates and messages here when they arrive
            </Text>
          </View>
        ) : (
          <>
            {/* Unread Notifications Section */}
            {unreadNotifications.length > 0 && (
              <View style={styles.notificationSection}>
                <View style={styles.sectionHeader}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                  >
                    🔔 New Notifications
                  </Text>
                  <Text
                    style={[
                      styles.sectionCount,
                      { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    {unreadNotifications.length} unread
                  </Text>
                </View>

                {unreadNotifications.map((notification, index) => (
                  <TouchableOpacity
                    key={notification.id}
                    style={[
                      styles.modernNotificationCard,
                      {
                        backgroundColor: getNotificationCardColor(
                          notification,
                          index
                        ),
                        borderLeftColor: getStatusColor(notification.type),
                        borderLeftWidth: 4,
                      },
                    ]}
                    onPress={() => markAsRead(notification.id)}
                  >
                    <View style={styles.modernNotificationHeader}>
                      <View style={styles.modernNotificationIconSection}>
                        <View
                          style={[
                            styles.modernNotificationIcon,
                            {
                              backgroundColor: getStatusColor(
                                notification.type
                              ),
                            },
                          ]}
                        >
                          {getNotificationIcon(notification.type)}
                        </View>
                        <View style={styles.modernNotificationTitleSection}>
                          <Text
                            style={[
                              styles.modernNotificationTitle,
                              {
                                color: isDarkMode ? "#FFFFFF" : "#000000",
                                fontWeight: "600",
                              },
                            ]}
                          >
                            {notification.title}
                          </Text>
                          <Text
                            style={[
                              styles.modernNotificationMessage,
                              { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                            ]}
                          >
                            {notification.message}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.modernNotificationMeta}>
                        <Text
                          style={[
                            styles.modernNotificationTime,
                            { color: isDarkMode ? "#6B7280" : "#9CA3AF" },
                          ]}
                        >
                          {formatTime(notification.created_at)}
                        </Text>
                        <View
                          style={[
                            styles.unreadIndicator,
                            {
                              backgroundColor: getStatusColor(
                                notification.type
                              ),
                            },
                          ]}
                        />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Read Notifications Section */}
            {readNotifications.length > 0 && (
              <View style={styles.notificationSection}>
                <View style={styles.sectionHeader}>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                  >
                    📖 Read Notifications
                  </Text>
                  <Text
                    style={[
                      styles.sectionCount,
                      { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    {readNotifications.length} read
                  </Text>
                </View>

                {readNotifications.map((notification, index) => (
                  <View
                    key={notification.id}
                    style={[
                      styles.modernNotificationCard,
                      {
                        backgroundColor: isDarkMode ? "#111827" : "#F9FAFB",
                        opacity: 0.8,
                        borderLeftColor: "#E5E7EB",
                        borderLeftWidth: 2,
                      },
                    ]}
                  >
                    <View style={styles.modernNotificationHeader}>
                      <View style={styles.modernNotificationIconSection}>
                        <View
                          style={[
                            styles.modernNotificationIcon,
                            {
                              backgroundColor: "#E5E7EB",
                            },
                          ]}
                        >
                          {getNotificationIcon(notification.type)}
                        </View>
                        <View style={styles.modernNotificationTitleSection}>
                          <Text
                            style={[
                              styles.modernNotificationTitle,
                              {
                                color: isDarkMode ? "#9CA3AF" : "#6B7280",
                                fontWeight: "500",
                              },
                            ]}
                          >
                            {notification.title}
                          </Text>
                          <Text
                            style={[
                              styles.modernNotificationMessage,
                              { color: isDarkMode ? "#6B7280" : "#9CA3AF" },
                            ]}
                          >
                            {notification.message}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.modernNotificationMeta}>
                        <Text
                          style={[
                            styles.modernNotificationTime,
                            { color: isDarkMode ? "#6B7280" : "#9CA3AF" },
                          ]}
                        >
                          {formatTime(notification.created_at)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modernHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modernBackButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  modernHeaderContent: {
    flex: 1,
  },
  modernTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  modernSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  statBadge: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  statBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modernNotificationsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  notificationSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  modernNotificationCard: {
    borderRadius: 16,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  modernNotificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  modernNotificationIconSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  modernNotificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modernNotificationTitleSection: {
    flex: 1,
    paddingRight: 8,
  },
  modernNotificationTitle: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  modernNotificationMessage: {
    fontSize: 14,
    lineHeight: 18,
  },
  modernNotificationMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  modernNotificationTime: {
    fontSize: 12,
    fontWeight: "500",
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modernEmptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  modernEmptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 8,
  },
  modernEmptyStateSubtext: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  bottomPadding: {
    height: 20,
  },
});
