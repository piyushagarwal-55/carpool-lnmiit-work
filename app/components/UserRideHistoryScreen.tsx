import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Modal,
  Dimensions,
  Alert,
} from "react-native";
import { Car, Clock, MapPin, X, Trash2 } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { rideManagementAPI } from "../api/carpool";

const { width } = Dimensions.get("window");

interface UserRideHistoryScreenProps {
  visible: boolean;
  onClose: () => void;
  user: {
    id: string;
    name: string;
    email: string;
    branch: string;
    year: string;
    rating: number;
    photo: string;
  };
  isDarkMode?: boolean;
}

const UserRideHistoryScreen: React.FC<UserRideHistoryScreenProps> = (props) => {
  const { visible, onClose, user, isDarkMode = false } = props;
  const [userRideHistory, setUserRideHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserRideHistory = async () => {
    try {
      const { data: driverRides, error: driverError } = await supabase
        .from("carpool_rides")
        .select("*")
        .eq("ride_creator_id", user.id)
        .order("created_at", { ascending: false });

      const { data: passengerRides, error: passengerError } = await supabase
        .from("ride_passengers")
        .select("*, carpool_rides (*)")
        .eq("passenger_id", user.id);

      let allRides: any[] = [];

      if (!driverError && driverRides) {
        allRides.push(
          ...driverRides.map((ride) => ({
            ...ride,
            userRole: "driver",
          }))
        );
      }

      if (!passengerError && passengerRides) {
        allRides.push(
          ...passengerRides.map((p) => ({
            ...p.carpool_rides,
            userRole: "passenger",
            joinedAt: p.joined_at,
            carpool_ride_id: p.ride_id,
          }))
        );
      }

      allRides.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setUserRideHistory(allRides);
    } catch (error) {
      console.error("Error fetching ride history:", error);
      setUserRideHistory([]);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchUserRideHistory();
    }
  }, [visible]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchUserRideHistory();
    setRefreshing(false);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getCardColor = (index: number) => {
    const colors = ["#F8FAFC", "#F1F5F9", "#F0F9FF", "#F7FEE7", "#FEF7F0"];
    return colors[index % colors.length];
  };

  const getRoleColor = (role: string) => {
    return role === "driver" ? "#4CAF50" : "#2196F3";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "#4CAF50";
      case "completed":
        return "#2196F3";
      case "cancelled":
        return "#F44336";
      default:
        return "#9CA3AF";
    }
  };

  const handleDeleteRide = (ride: any) => {
    Alert.alert(
      "Delete Ride",
      `Are you sure you want to delete the ride from ${ride.from_location} to ${ride.to_location}?\n\nThis action cannot be undone. All passengers will be notified.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Cancel Ride",
          style: "default",
          onPress: () => confirmDeleteRide(ride.id, "soft"),
        },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: () => confirmDeleteRide(ride.id, "hard"),
        },
      ]
    );
  };

  const confirmDeleteRide = async (
    rideId: string,
    deleteType: "soft" | "hard"
  ) => {
    try {
      let result;
      if (deleteType === "hard") {
        result = await rideManagementAPI.deleteRideWithCleanup(rideId);
      } else {
        result = await rideManagementAPI.cancelRideWithReason(
          rideId,
          "Cancelled by driver"
        );
      }

      if (result.error) {
        Alert.alert("Error", result.error);
        return;
      }

      // Show success message
      Alert.alert(
        "Success",
        deleteType === "hard"
          ? "Ride deleted permanently!"
          : "Ride cancelled successfully!"
      );

      // Refresh the ride history
      await fetchUserRideHistory();
    } catch (error: any) {
      console.error("Error deleting ride:", error);
      Alert.alert("Error", error.message || "Failed to delete ride");
    }
  };

  const activeRides = userRideHistory.filter(
    (ride) => ride.status === "active"
  );
  const completedRides = userRideHistory.filter(
    (ride) => ride.status !== "active"
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Car size={22} color="#1F2937" />
              <Text style={styles.headerTitle}>My Ride History</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={22} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#4CAF50"]}
                tintColor="#000"
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {userRideHistory.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={styles.emptyStateIconContainer}>
                  <Car size={48} color="#9CA3AF" />
                </View>
                <Text style={styles.emptyStateTitle}>No rides yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Your completed or joined rides will appear here when you start
                  carpooling
                </Text>
              </View>
            ) : (
              <>
                {activeRides.length > 0 && (
                  <View style={styles.rideSection}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionHeaderContent}>
                        <Clock size={18} color="#6B7280" />
                        <Text style={styles.sectionHeaderTitle}>
                          Active Rides
                        </Text>
                      </View>
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>
                          {activeRides.length}
                        </Text>
                      </View>
                    </View>

                    {activeRides.map((ride, index) => (
                      <View
                        key={`active-${
                          ride.id || ride.carpool_ride_id
                        }-${index}`}
                        style={[
                          styles.rideCard,
                          {
                            backgroundColor: getCardColor(index),
                            borderLeftColor: getRoleColor(ride.userRole),
                            borderLeftWidth: 4,
                          },
                        ]}
                      >
                        <View style={styles.rideHeader}>
                          <View style={styles.rideIconSection}>
                            <View
                              style={[
                                styles.rideIcon,
                                {
                                  backgroundColor: getRoleColor(ride.userRole),
                                },
                              ]}
                            >
                              <Car size={16} color="#FFFFFF" />
                            </View>
                            <View style={styles.rideTitleSection}>
                              <Text style={styles.rideTitle}>
                                {ride.userRole === "driver"
                                  ? "Driving"
                                  : "Riding"}
                              </Text>
                              <Text style={styles.rideLocation}>
                                {ride.from_location || "Unknown"} →{" "}
                                {ride.to_location || "Unknown"}
                              </Text>
                            </View>
                          </View>
                          <View style={styles.rideHeaderActions}>
                            {ride.userRole === "driver" && (
                              <TouchableOpacity
                                onPress={() => handleDeleteRide(ride)}
                                style={styles.deleteButton}
                                activeOpacity={0.8}
                              >
                                <Trash2 size={14} color="#FFF" />
                              </TouchableOpacity>
                            )}
                            <View
                              style={[
                                styles.statusBadge,
                                {
                                  backgroundColor: getStatusColor(ride.status),
                                },
                              ]}
                            >
                              <Text style={styles.statusText}>
                                {ride.status}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View style={styles.rideDetails}>
                          <View style={styles.rideDetailItem}>
                            <MapPin size={12} color="#6B7280" />
                            <Text style={styles.rideDetailText}>
                              Ride Creator:{" "}
                              {ride.ride_creator_name || "Unknown"}
                            </Text>
                          </View>
                          <View style={styles.rideDetailItem}>
                            <Clock size={12} color="#6B7280" />
                            <Text style={styles.rideDetailText}>
                              {ride.departure_time
                                ? formatDate(ride.departure_time)
                                : "Time not set"}
                            </Text>
                          </View>
                          {ride.price_per_seat && (
                            <View style={styles.rideDetailItem}>
                              <Text style={styles.ridePrice}>
                                ₹{ride.price_per_seat}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}

                {completedRides.length > 0 && (
                  <View style={styles.rideSection}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionHeaderContent}>
                        <Clock size={18} color="#6B7280" />
                        <Text style={styles.sectionHeaderTitle}>
                          Completed Rides
                        </Text>
                      </View>
                      <View style={styles.sectionBadge}>
                        <Text style={styles.sectionBadgeText}>
                          {completedRides.length}
                        </Text>
                      </View>
                    </View>

                    {completedRides.map((ride, index) => (
                      <View
                        key={`completed-${
                          ride.id || ride.carpool_ride_id
                        }-${index}`}
                        style={[
                          styles.rideCard,
                          {
                            backgroundColor: getCardColor(index),
                            borderLeftColor: getRoleColor(ride.userRole),
                            borderLeftWidth: 4,
                          },
                        ]}
                      >
                        <View style={styles.rideHeader}>
                          <View style={styles.rideIconSection}>
                            <View
                              style={[
                                styles.rideIcon,
                                {
                                  backgroundColor: getRoleColor(ride.userRole),
                                },
                              ]}
                            >
                              <Car size={16} color="#FFFFFF" />
                            </View>
                            <View style={styles.rideTitleSection}>
                              <Text style={styles.rideTitle}>
                                {ride.userRole === "driver"
                                  ? "Driving"
                                  : "Riding"}
                              </Text>
                              <Text style={styles.rideLocation}>
                                {ride.from_location || "Unknown"} →{" "}
                                {ride.to_location || "Unknown"}
                              </Text>
                            </View>
                          </View>
                          <View
                            style={[
                              styles.statusBadge,
                              { backgroundColor: getStatusColor(ride.status) },
                            ]}
                          >
                            <Text style={styles.statusText}>{ride.status}</Text>
                          </View>
                        </View>
                        <View style={styles.rideDetails}>
                          <View style={styles.rideDetailItem}>
                            <MapPin size={12} color="#6B7280" />
                            <Text style={styles.rideDetailText}>
                              Ride Creator:{" "}
                              {ride.ride_creator_name || "Unknown"}
                            </Text>
                          </View>
                          <View style={styles.rideDetailItem}>
                            <Clock size={12} color="#6B7280" />
                            <Text style={styles.rideDetailText}>
                              {ride.departure_time
                                ? formatDate(ride.departure_time)
                                : "Time not set"}
                            </Text>
                          </View>
                          {ride.price_per_seat && (
                            <View style={styles.rideDetailItem}>
                              <Text style={styles.ridePrice}>
                                ₹{ride.price_per_seat}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: width * 0.95,
    height: "80%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    backgroundColor: "#F9FAFB",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateIconContainer: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    maxWidth: 280,
  },
  rideSection: {
    marginVertical: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
  },
  sectionBadge: {
    backgroundColor: "#E5E7EB",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sectionBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  rideCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rideHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  rideIconSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rideIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  rideTitleSection: {
    flex: 1,
  },
  rideTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 2,
  },
  rideLocation: {
    fontSize: 13,
    color: "#6B7280",
  },
  rideHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF4444",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#FF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
    textTransform: "capitalize",
  },
  rideDetails: {
    gap: 8,
  },
  rideDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rideDetailText: {
    fontSize: 12,
    color: "#6B7280",
  },
  ridePrice: {
    fontSize: 14,
    fontWeight: "600",
    color: "#16A34A",
  },
});

export default UserRideHistoryScreen;
