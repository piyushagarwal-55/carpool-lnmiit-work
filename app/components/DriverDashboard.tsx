import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { Avatar, ProgressBar } from "react-native-paper";
import {
  Car,
  MapPin,
  Clock,
  DollarSign,
  Star,
  Users,
  FileText,
  Shield,
  TrendingUp,
  Navigation,
  CheckCircle,
  AlertCircle,
  XCircle,
  Upload,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

interface DriverDashboardProps {
  isDarkMode?: boolean;
  driver?: {
    id: string;
    name: string;
    phone: string;
    verificationStatus: "pending" | "approved" | "rejected";
    rating: number;
    totalRides: number;
    monthlyEarnings: number;
    performanceScore: number;
    vehicleInfo: {
      make: string;
      model: string;
      licensePlate: string;
      isAC: boolean;
    };
    currentRide?: {
      pickupLocation: string;
      destination: string;
      passengers: number;
      fare: number;
    };
  };
}

const DriverDashboard = ({
  isDarkMode = false,
  driver = {
    id: "driver_001",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    verificationStatus: "approved",
    rating: 4.8,
    totalRides: 245,
    monthlyEarnings: 8500,
    performanceScore: 92,
    vehicleInfo: {
      make: "Maruti",
      model: "Swift Dzire",
      licensePlate: "RJ14 CA 1234",
      isAC: true,
    },
    currentRide: {
      pickupLocation: "LNMIIT Campus",
      destination: "Jaipur Railway Station",
      passengers: 3,
      fare: 120,
    },
  },
}: DriverDashboardProps) => {
  const [activeTab, setActiveTab] = useState<
    "dashboard" | "rides" | "earnings"
  >("dashboard");

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "#10B981";
      case "pending":
        return "#F59E0B";
      case "rejected":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const renderVerificationStatus = () => {
    const statusConfig = {
      pending: {
        text: "Verification Pending",
        color: "#F59E0B",
        progress: 0.5,
      },
      approved: { text: "Verified Driver", color: "#10B981", progress: 1.0 },
      rejected: {
        text: "Verification Rejected",
        color: "#EF4444",
        progress: 0.0,
      },
    };

    const config = statusConfig[driver.verificationStatus];

    return (
      <View
        style={[
          styles.verificationCard,
          { backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF" },
        ]}
      >
        <View style={styles.verificationHeader}>
          <Text
            style={[
              styles.verificationTitle,
              { color: isDarkMode ? "#FFFFFF" : "#000000" },
            ]}
          >
            Verification Status
          </Text>
          <Text style={[styles.verificationStatus, { color: config.color }]}>
            {config.text}
          </Text>
        </View>
        <ProgressBar
          progress={config.progress}
          color={config.color}
          style={styles.progressBar}
        />
      </View>
    );
  };

  const renderCurrentRide = () => {
    if (!driver.currentRide) return null;

    return (
      <View
        style={[
          styles.currentRideCard,
          { backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF" },
        ]}
      >
        <View style={styles.currentRideHeader}>
          <Text
            style={[
              styles.currentRideTitle,
              { color: isDarkMode ? "#FFFFFF" : "#000000" },
            ]}
          >
            Current Ride
          </Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <View style={styles.rideRoute}>
          <View style={styles.routePoint}>
            <MapPin size={16} color="#10B981" />
            <Text
              style={[
                styles.routeText,
                { color: isDarkMode ? "#CCCCCC" : "#666666" },
              ]}
            >
              {driver.currentRide.pickupLocation}
            </Text>
          </View>
          <View style={styles.routeLine} />
          <View style={styles.routePoint}>
            <MapPin size={16} color="#EF4444" />
            <Text
              style={[
                styles.routeText,
                { color: isDarkMode ? "#CCCCCC" : "#666666" },
              ]}
            >
              {driver.currentRide.destination}
            </Text>
          </View>
        </View>

        <View style={styles.rideDetails}>
          <View style={styles.rideDetail}>
            <Users size={16} color={isDarkMode ? "#CCCCCC" : "#666666"} />
            <Text
              style={[
                styles.rideDetailText,
                { color: isDarkMode ? "#CCCCCC" : "#666666" },
              ]}
            >
              {driver.currentRide.passengers} passengers
            </Text>
          </View>
          <View style={styles.rideDetail}>
            <DollarSign size={16} color={isDarkMode ? "#CCCCCC" : "#666666"} />
            <Text
              style={[
                styles.rideDetailText,
                { color: isDarkMode ? "#CCCCCC" : "#666666" },
              ]}
            >
              ₹{driver.currentRide.fare}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.navigateButton}
          onPress={() => Alert.alert("Navigation", "Opening GPS navigation...")}
        >
          <Navigation size={20} color="#FFFFFF" />
          <Text style={styles.navigateButtonText}>Navigate</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderStatsCards = () => {
    const stats = [
      {
        title: "Total Rides",
        value: driver.totalRides.toString(),
        icon: Car,
        color: "#3B82F6",
      },
      {
        title: "Rating",
        value: driver.rating.toFixed(1),
        icon: Star,
        color: "#F59E0B",
      },
      {
        title: "This Month",
        value: `₹${driver.monthlyEarnings.toLocaleString()}`,
        icon: TrendingUp,
        color: "#10B981",
      },
      {
        title: "Performance",
        value: `${driver.performanceScore}%`,
        icon: Shield,
        color: "#8B5CF6",
      },
    ];

    return (
      <View style={styles.statsContainer}>
        {stats.map((stat, index) => (
          <View
            key={index}
            style={[
              styles.statCard,
              { backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF" },
            ]}
          >
            <View style={[styles.statIcon, { backgroundColor: stat.color }]}>
              <stat.icon size={20} color="#FFFFFF" />
            </View>
            <Text
              style={[
                styles.statValue,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
            >
              {stat.value}
            </Text>
            <Text
              style={[
                styles.statTitle,
                { color: isDarkMode ? "#CCCCCC" : "#666666" },
              ]}
            >
              {stat.title}
            </Text>
          </View>
        ))}
      </View>
    );
  };

  const tabs = [
    { key: "dashboard", title: "Dashboard", icon: TrendingUp },
    { key: "rides", title: "Rides", icon: Car },
    { key: "earnings", title: "Earnings", icon: DollarSign },
  ];

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#000000" : "#F5F5F5" },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          { backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF" },
        ]}
      >
        <View style={styles.headerContent}>
          <Avatar.Image
            size={50}
            source={{
              uri: `https://api.dicebear.com/7.x/avataaars/svg?seed=${driver.name}`,
            }}
          />
          <View style={styles.headerInfo}>
            <Text
              style={[
                styles.headerName,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
            >
              {driver.name}
            </Text>
            <Text
              style={[
                styles.headerPhone,
                { color: isDarkMode ? "#CCCCCC" : "#666666" },
              ]}
            >
              {driver.phone}
            </Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View
        style={[
          styles.tabContainer,
          { backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF" },
        ]}
      >
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.activeTab]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <tab.icon
              size={18}
              color={
                activeTab === tab.key
                  ? "#FFFFFF"
                  : isDarkMode
                  ? "#CCCCCC"
                  : "#666666"
              }
            />
            <Text
              style={[
                styles.tabText,
                {
                  color:
                    activeTab === tab.key
                      ? "#FFFFFF"
                      : isDarkMode
                      ? "#CCCCCC"
                      : "#666666",
                },
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {renderVerificationStatus()}
        {renderCurrentRide()}
        {renderStatsCards()}
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerPhone: {
    fontSize: 14,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginHorizontal: 2,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: "#000000",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  verificationCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  verificationHeader: {
    marginBottom: 12,
  },
  verificationTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  verificationStatus: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
  },
  currentRideCard: {
    marginTop: 20,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  currentRideHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  currentRideTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    marginRight: 6,
  },
  liveText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EF4444",
  },
  rideRoute: {
    marginBottom: 16,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  routeText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: "#E5E7EB",
    marginLeft: 8,
    marginBottom: 8,
  },
  rideDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  rideDetail: {
    flexDirection: "row",
    alignItems: "center",
  },
  rideDetailText: {
    fontSize: 12,
    marginLeft: 4,
  },
  navigateButton: {
    backgroundColor: "#000000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  navigateButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 20,
    marginHorizontal: -6,
  },
  statCard: {
    width: (width - 52) / 2,
    marginHorizontal: 6,
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 12,
    textAlign: "center",
  },
});

export default DriverDashboard;
