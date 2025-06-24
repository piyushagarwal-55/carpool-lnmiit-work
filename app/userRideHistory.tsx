import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Platform,
  StatusBar,
} from "react-native";
import { Car } from "lucide-react-native";
import { useColorScheme } from "react-native";
import { supabase } from "./lib/supabase";
import * as SystemUI from "expo-system-ui";

type UserRideHistoryScreenProps = {
  user: {
    id: string;
    name: string;
    email: string;
    branch: string;
    year: string;
    rating: number;
    photo: string;
  };
};

export default function UserRideHistoryScreen({ user }: UserRideHistoryScreenProps) {
  const currUser = user;
  const [userRideHistory, setUserRideHistory] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const isDarkMode = useColorScheme() === "dark";

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
    fetchUserRideHistory();
      SystemUI.setBackgroundColorAsync("#000"); 
  }, []);

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

  const cardColors = ["#E6F7FF", "#E8F5E9", "#FFF3E0"]; // blue, green, orange

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={isDarkMode ? "#FFF" : "#000"}
        />
      }
    >
      <Text style={styles.title}>My Ride History</Text>

      {userRideHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <Car size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>No rides yet</Text>
          <Text style={styles.emptySubtitle}>
            Your completed or joined rides will appear here.
          </Text>
        </View>
      ) : (
        userRideHistory.map((ride, index) => (
          <View
            key={`${ride.id ?? ride.carpool_ride_id}-${ride.userRole}-${ride.joinedAt ?? ""}`}
            style={[
              styles.card,
              {
                backgroundColor: cardColors[index % cardColors.length],
                borderColor: "#DDD",
              },
            ]}
          >
            <Text style={styles.roleTag}>
              {ride.userRole === "driver" ? "🚗 Driver" : "🧍 Passenger"}
            </Text>
            <Text style={styles.location}>
              Name: <Text style={styles.bold}>{ride.driver_name}</Text>
            </Text>
            <Text style={styles.location}>
              To: <Text style={styles.bold}>{ride.to_location}</Text>
            </Text>
            <Text style={styles.date}>📅 {formatDate(ride.departure_time)}</Text>
            <Text style={styles.status}>
              Status:{" "}
              <Text style={{ fontWeight: "600", color: "#2196F3" }}>
                {ride.status || "completed"}
              </Text>
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight ?? 32 : 48,
    backgroundColor: "#FFF",
  },
  title: {
   paddingTop: 30,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 16,
    color: "#000",
    textAlign: "center",     
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  roleTag: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  location: {
    fontSize: 16,
    marginBottom: 4,
  },
  bold: {
    fontWeight: "600",
  },
  date: {
    fontSize: 14,
    marginBottom: 4,
    color: "#666",
  },
  status: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: "center",
    marginTop: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    color: "#000",
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    color: "#666",
  },
});
