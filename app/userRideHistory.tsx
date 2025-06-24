import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Dimensions,
} from "react-native";
import { Car, ArrowLeft, Clock, MapPin, Users, X } from "lucide-react-native";
import { useColorScheme } from "react-native";
import { supabase } from "./lib/supabase";
import * as SystemUI from "expo-system-ui";

const { width } = Dimensions.get("window");

type UserRideHistoryScreenProps = {
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
};

const UserRideHistoryScreen: React.FC<UserRideHistoryScreenProps> = (props) => {
  const visible = props.visible;
  const onClose = props.onClose;
  const user = props.user;
  const isDarkMode = props.isDarkMode || false;
  const currUser = user;
  const [userRideHistory, setUserRideHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUserRideHistory = async () => {
    try {
      const { data: driverRides, error: driverError } = await supabase
        .from("carpool_rides")
        .select("*")
        .eq("driver_id", currUser.id)
        .order("created_at", { ascending: false });

      const { data: passengerRides, error: passengerError } = await supabase
        .from("ride_passengers")
        .select(`*, carpool_rides (*)`)
        .eq("passenger_id", currUser.id);

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

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  const getCardColor = (ride: any, index: number) => {
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

  // Separate active and completed rides
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
          {/* Header */}
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
                {/* Active Rides Section */}
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
                        key={`${ride.id ?? ride.carpool_ride_id}-${
                          ride.userRole
                        }-${ride.joinedAt ?? ""}`}
                        style={[
                          styles.rideCard,
                          {
                            backgroundColor: getCardColor(ride, index),
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
                                  ? "🚗 Driver"
                                  : "🧍 Passenger"}
                              </Text>
                              <Text style={styles.rideLocation}>
                                {ride.from_location} → {ride.to_location}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor: getStatusColor(
                                  ride.status || "completed"
                                ),
                              },
                            ]}
                          >
                            <Text style={styles.statusText}>
                              {ride.status || "completed"}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.rideDetails}>
                          <View style={styles.rideDetailItem}>
                            <MapPin size={12} color="#6B7280" />
                            <Text style={styles.rideDetailText}>
                              Driver: {ride.driver_name}
                            </Text>
                          </View>
                          <View style={styles.rideDetailItem}>
                            <Clock size={12} color="#6B7280" />
                            <Text style={styles.rideDetailText}>
                              {formatDate(ride.departure_time)}
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

                {/* Completed Rides Section */}
                {completedRides.length > 0 && (
                  <View style={styles.rideSection}>
                    <View style={styles.sectionHeader}>
                      <View style={styles.sectionHeaderContent}>
                        <Car size={18} color="#6B7280" />
                        <Text style={styles.sectionHeaderTitle}>
                          Completed Rides
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.sectionBadge,
                          { backgroundColor: "#E5E7EB" },
                        ]}
                      >
                        <Text
                          style={[
                            styles.sectionBadgeText,
                            { color: "#6B7280" },
                          ]}
                        >
                          {completedRides.length}
                        </Text>
                      </View>
                    </View>

                    {completedRides.map((ride, index) => (
                      <View
                        key={`${ride.id ?? ride.carpool_ride_id}-${
                          ride.userRole
                        }-${ride.joinedAt ?? ""}`}
                        style={[
                          styles.rideCard,
                          {
                            backgroundColor: "#F9FAFB",
                            opacity: 0.8,
                            borderLeftColor: "#E5E7EB",
                            borderLeftWidth: 2,
                          },
                        ]}
                      >
                        <View style={styles.rideHeader}>
                          <View style={styles.rideIconSection}>
                            <View
                              style={[
                                styles.rideIcon,
                                {
                                  backgroundColor: "#E5E7EB",
                                },
                              ]}
                            >
                              <Car size={16} color="#6B7280" />
                            </View>
                            <View style={styles.rideTitleSection}>
                              <Text
                                style={[styles.rideTitle, { color: "#6B7280" }]}
                              >
                                {ride.userRole === "driver"
                                  ? "🚗 Driver"
                                  : "🧍 Passenger"}
                              </Text>
                              <Text
                                style={[
                                  styles.rideLocation,
                                  { color: "#9CA3AF" },
                                ]}
                              >
                                {ride.from_location} → {ride.to_location}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={[
                              styles.statusBadge,
                              {
                                backgroundColor: "#E5E7EB",
                              },
                            ]}
                          >
                            <Text
                              style={[styles.statusText, { color: "#6B7280" }]}
                            >
                              {ride.status || "completed"}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.rideDetails}>
                          <View style={styles.rideDetailItem}>
                            <MapPin size={12} color="#9CA3AF" />
                            <Text
                              style={[
                                styles.rideDetailText,
                                { color: "#9CA3AF" },
                              ]}
                            >
                              Driver: {ride.driver_name}
                            </Text>
                          </View>
                          <View style={styles.rideDetailItem}>
                            <Clock size={12} color="#9CA3AF" />
                            <Text
                              style={[
                                styles.rideDetailText,
                                { color: "#9CA3AF" },
                              ]}
                            >
                              {formatDate(ride.departure_time)}
                            </Text>
                          </View>
                          {ride.price_per_seat && (
                            <View style={styles.rideDetailItem}>
                              <Text
                                style={[styles.ridePrice, { color: "#9CA3AF" }]}
                              >
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

            <View style={styles.bottomPadding} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1F2937",
    letterSpacing: 0.3,
  },
  closeButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 4,
  },
  rideSection: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    marginBottom: 16,
  },
  sectionHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    letterSpacing: 0.2,
  },
  sectionBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
  },
  sectionBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  rideCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  rideHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  rideIconSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  rideIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  rideTitleSection: {
    flex: 1,
    paddingRight: 8,
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
    lineHeight: 16,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
    textTransform: "capitalize",
  },
  rideDetails: {
    gap: 6,
  },
  rideDetailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rideDetailText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  ridePrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
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
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 20,
  },
  bottomPadding: {
    height: 20,
  },
});

export default UserRideHistoryScreen;
