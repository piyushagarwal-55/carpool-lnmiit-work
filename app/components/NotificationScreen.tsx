import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StyleSheet,
  RefreshControl,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  Bell,
  Check,
  X,
  MessageCircle,
  Car,
  Users,
  Calendar,
  Trash2,
} from "lucide-react-native";
import NotificationService from "../services/NotificationService";

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
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await NotificationService.getUserNotifications(
        currentUser.id,
        50
      );
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
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
    const success = await NotificationService.markAsRead(notificationId);
    if (success) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );
    }
  };

  const markAllAsRead = async () => {
    const success = await NotificationService.markAllAsRead(currentUser.id);
    if (success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
        return <Car size={20} color="#FF9800" />;
      case "ride_cancelled":
        return <X size={20} color="#F44336" />;
      case "chat_message":
        return <MessageCircle size={20} color="#9C27B0" />;
      default:
        return <Bell size={20} color="#666" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case "join_request":
        return "#E3F2FD";
      case "request_accepted":
        return "#E8F5E8";
      case "request_rejected":
        return "#FFEBEE";
      case "ride_updated":
        return "#FFF3E0";
      case "ride_cancelled":
        return "#FFEBEE";
      case "chat_message":
        return "#F3E5F5";
      default:
        return "#F5F5F5";
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

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#000" : "#FFF" },
      ]}
    >
      {/* Header */}
      <LinearGradient colors={["#4CAF50", "#45A049"]} style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <ArrowLeft size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {unreadCount > 0 ? `${unreadCount} unread` : "All caught up!"}
          </Text>
        </View>

        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Check size={20} color="#FFF" />
          </TouchableOpacity>
        )}
      </LinearGradient>

      {/* Notifications List */}
      <ScrollView
        style={styles.content}
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
          <View style={styles.loadingContainer}>
            <Text
              style={[
                styles.loadingText,
                { color: isDarkMode ? "#FFF" : "#000" },
              ]}
            >
              Loading notifications...
            </Text>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bell size={64} color={isDarkMode ? "#666" : "#CCC"} />
            <Text
              style={[
                styles.emptyTitle,
                { color: isDarkMode ? "#FFF" : "#000" },
              ]}
            >
              No notifications yet
            </Text>
            <Text
              style={[
                styles.emptySubtitle,
                { color: isDarkMode ? "#AAA" : "#666" },
              ]}
            >
              You'll see ride updates and messages here
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  {
                    backgroundColor: notification.read
                      ? isDarkMode
                        ? "#1A1A1A"
                        : "#F8F9FA"
                      : getNotificationColor(notification.type),
                    borderLeftColor: notification.read ? "#E0E0E0" : "#4CAF50",
                  },
                ]}
                onPress={() =>
                  !notification.read && markAsRead(notification.id)
                }
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationIcon}>
                    {getNotificationIcon(notification.type)}
                  </View>

                  <View style={styles.notificationContent}>
                    <Text
                      style={[
                        styles.notificationTitle,
                        {
                          color: isDarkMode ? "#FFF" : "#000",
                          fontWeight: notification.read ? "500" : "600",
                        },
                      ]}
                    >
                      {notification.title}
                    </Text>
                    <Text
                      style={[
                        styles.notificationMessage,
                        { color: isDarkMode ? "#CCC" : "#666" },
                      ]}
                    >
                      {notification.message}
                    </Text>
                  </View>

                  <View style={styles.notificationMeta}>
                    <Text
                      style={[
                        styles.notificationTime,
                        { color: isDarkMode ? "#AAA" : "#999" },
                      ]}
                    >
                      {formatTime(notification.created_at)}
                    </Text>
                    {!notification.read && <View style={styles.unreadDot} />}
                  </View>
                </View>

                {/* Action buttons for specific notification types */}
                {notification.type === "join_request" && !notification.read && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity style={styles.rejectButton}>
                      <X size={16} color="#F44336" />
                      <Text style={styles.rejectButtonText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.acceptButton}>
                      <Check size={16} color="#FFF" />
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  markAllButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 22,
  },
  notificationsList: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  notificationCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  notificationHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
    marginRight: 12,
  },
  notificationTitle: {
    fontSize: 16,
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  notificationMeta: {
    alignItems: "flex-end",
  },
  notificationTime: {
    fontSize: 12,
    marginBottom: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  actionButtons: {
    flexDirection: "row",
    marginTop: 12,
    gap: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#FFEBEE",
    gap: 4,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F44336",
  },
  acceptButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
    gap: 4,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFF",
  },
  bottomPadding: {
    height: 20,
  },
});
