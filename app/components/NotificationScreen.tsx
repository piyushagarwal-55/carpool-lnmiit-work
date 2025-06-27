import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  Alert,
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
import { NotificationService } from "../services/NotificationService";
import PushNotificationService from "../services/PushNotificationService";

const { width } = Dimensions.get("window");

interface NotificationScreenProps {
  onBack: () => void;
  isDarkMode?: boolean;
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
  onNotificationUpdate?: () => void;
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
  onNotificationUpdate,
}: NotificationScreenProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequests, setProcessingRequests] = useState<Set<string>>(
    new Set()
  );
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!currentUser?.id) return;

    fetchNotifications();
    setupRealtimeSubscription();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [currentUser?.id]);

  const setupRealtimeSubscription = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
    }

    // Subscribe to real-time notifications
    subscriptionRef.current = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log("New notification received:", payload);
          const newNotification = payload.new as Notification;
          setNotifications((prev) => [newNotification, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log("Notification updated:", payload);
          const updatedNotification = payload.new as Notification;
          setNotifications((prev) =>
            prev.map((n) =>
              n.id === updatedNotification.id ? updatedNotification : n
            )
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "join_requests",
        },
        (payload) => {
          console.log("Join request updated:", payload);
          // Refresh notifications when join requests are updated
          fetchNotifications();
        }
      )
      .subscribe();
  };

  const fetchNotifications = async () => {
    try {
      if (!currentUser?.id) {
        console.warn("No user ID available for fetching notifications");
        setNotifications([]);
        return;
      }

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching notifications:", error);
        setNotifications([]);
        return;
      }

      setNotifications(data || []);
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
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
        return;
      }

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
      );

      // Call the parent callback to update notification counter
      if (onNotificationUpdate) {
        onNotificationUpdate();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);

      if (unreadIds.length === 0) return;

      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", unreadIds);

      if (error) {
        console.error("Error marking all notifications as read:", error);
        return;
      }

      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

      // Call the parent callback to update notification counter
      if (onNotificationUpdate) {
        onNotificationUpdate();
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleApproveRequest = async (notification: Notification) => {
    const requestId = notification.data?.requestId;
    if (!requestId || processingRequests.has(requestId)) return;

    setProcessingRequests((prev) => new Set(prev).add(requestId));

    try {
      // Get request details
      const { data: requestData, error: requestError } = await supabase
        .from("join_requests")
        .select(
          `
          *,
          carpool_rides!inner(
            id,
            ride_creator_id,
            ride_creator_name,
            from_location,
            to_location,
            available_seats
          )
        `
        )
        .eq("id", requestId)
        .single();

      if (requestError || !requestData) {
        Alert.alert("Error", "Request not found");
        return;
      }

      // Check if ride has available seats
      if (requestData.carpool_rides.available_seats < 1) {
        Alert.alert("Error", "No available seats remaining");
        return;
      }

      // Update request status to accepted
      const { error: updateError } = await supabase
        .from("join_requests")
        .update({
          status: "accepted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("Error accepting request:", updateError);
        Alert.alert("Error", "Failed to accept request");
        return;
      }

      // Check if passenger already exists for this ride
      const { data: existingPassenger } = await supabase
        .from("ride_passengers")
        .select("id")
        .eq("ride_id", requestData.ride_id)
        .eq("passenger_id", requestData.passenger_id)
        .single();

      if (!existingPassenger) {
        // Add passenger to ride
        const { error: passengerError } = await supabase
          .from("ride_passengers")
          .insert({
            ride_id: requestData.ride_id,
            passenger_id: requestData.passenger_id,
            passenger_name: requestData.passenger_name,
            passenger_email: requestData.passenger_email,
            seats_booked: requestData.seats_requested || 1,
            status: "confirmed",
            joined_at: new Date().toISOString(),
          });

        if (passengerError) {
          console.error("Error adding passenger:", passengerError);
          Alert.alert("Error", "Failed to add passenger to ride");
          return;
        }
      }

      // Update available seats
      const { error: seatsError } = await supabase
        .from("carpool_rides")
        .update({
          available_seats:
            requestData.carpool_rides.available_seats -
            (requestData.seats_requested || 1),
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestData.ride_id);

      if (seatsError) {
        console.error("Error updating seats:", seatsError);
      }

      // Send notification to passenger
      await NotificationService.createNotification({
        userId: requestData.passenger_id,
        type: "request_accepted",
        title: "✅ Ride Request Accepted!",
        message: `${requestData.carpool_rides.ride_creator_name} accepted your request for ${requestData.carpool_rides.from_location} to ${requestData.carpool_rides.to_location}`,
        data: {
          rideId: requestData.ride_id,
          requestId: requestId,
          rideCreatorName: requestData.carpool_rides.ride_creator_name,
          from: requestData.carpool_rides.from_location,
          to: requestData.carpool_rides.to_location,
        },
      });

      // Send push notification
      await PushNotificationService.sendRideRequestAcceptedNotification(
        requestData.passenger_id,
        requestData.carpool_rides.ride_creator_name,
        requestData.carpool_rides.from_location,
        requestData.carpool_rides.to_location,
        requestData.ride_id
      );

      // Mark current notification as read`
      await markAsRead(notification.id);

      // Refresh notifications to update the list
      await fetchNotifications();

      // Call parent callback to update counter immediately
      if (onNotificationUpdate) {
        onNotificationUpdate();
      }

      Alert.alert(
        "Success",
        "Request accepted! The passenger has been notified."
      );
    } catch (error) {
      console.error("Error in handleApproveRequest:", error);
      Alert.alert("Error", "Failed to accept request. Please try again.");
    } finally {
      setProcessingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
    }
  };

  const handleRejectRequest = async (notification: Notification) => {
    const requestId = notification.data?.requestId;
    if (!requestId || processingRequests.has(requestId)) return;

    setProcessingRequests((prev) => new Set(prev).add(requestId));

    try {
      // Get request details
      const { data: requestData, error: requestError } = await supabase
        .from("join_requests")
        .select(
          `
          *,
          carpool_rides!inner(
            id,
            ride_creator_id,
            ride_creator_name,
            from_location,
            to_location
          )
        `
        )
        .eq("id", requestId)
        .single();

      if (requestError || !requestData) {
        Alert.alert("Error", "Request not found");
        return;
      }

      // Update request status to rejected
      const { error: updateError } = await supabase
        .from("join_requests")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("Error rejecting request:", updateError);
        Alert.alert("Error", "Failed to reject request");
        return;
      }

      // Send notification to passenger
      await NotificationService.createNotification({
        userId: requestData.passenger_id,
        type: "request_rejected",
        title: "❌ Ride Request Declined",
        message: `${requestData.carpool_rides.ride_creator_name} declined your request for ${requestData.carpool_rides.from_location} to ${requestData.carpool_rides.to_location}`,
        data: {
          rideId: requestData.ride_id,
          requestId: requestId,
          rideCreatorName: requestData.carpool_rides.ride_creator_name,
          from: requestData.carpool_rides.from_location,
          to: requestData.carpool_rides.to_location,
        },
      });

      // Send push notification
      await PushNotificationService.sendRideRequestRejectedNotification(
        requestData.passenger_id,
        requestData.carpool_rides.ride_creator_name,
        requestData.carpool_rides.from_location,
        requestData.carpool_rides.to_location
      );

      // Mark current notification as read
      await markAsRead(notification.id);

      // Refresh notifications to update the list
      await fetchNotifications();

      // Call parent callback to update counter immediately
      if (onNotificationUpdate) {
        onNotificationUpdate();
      }

      Alert.alert(
        "Success",
        "Request declined. The passenger has been notified."
      );
    } catch (error) {
      console.error("Error in handleRejectRequest:", error);
      Alert.alert("Error", "Failed to reject request. Please try again.");
    } finally {
      setProcessingRequests((prev) => {
        const newSet = new Set(prev);
        newSet.delete(requestId);
        return newSet;
      });
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
                  <View
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
                  >
                    <TouchableOpacity
                      onPress={() => markAsRead(notification.id)}
                      style={styles.notificationContent}
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

                    {/* Add approve/reject buttons for ride requests */}
                    {notification.type === "join_request" && (
                      <View style={styles.actionButtons}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.rejectButton]}
                          onPress={() => handleRejectRequest(notification)}
                        >
                          <X size={16} color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>Reject</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.approveButton]}
                          onPress={() => handleApproveRequest(notification)}
                        >
                          <Check size={16} color="#FFFFFF" />
                          <Text style={styles.actionButtonText}>Approve</Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
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
  notificationContent: {
    flex: 1,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  approveButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#F44336",
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});
