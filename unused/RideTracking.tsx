import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useTheme, Avatar, Card, Button, Surface } from "react-native-paper";
import {
  Navigation,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  Star,
  Car,
  Share,
  MoreHorizontal,
  X,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  withSequence,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";

interface RideTrackingProps {
  visible: boolean;
  onClose: () => void;
  rideData: any;
  isDarkMode?: boolean;
}

const { width, height } = Dimensions.get("window");

const RideTracking: React.FC<RideTrackingProps> = ({
  visible,
  onClose,
  rideData,
  isDarkMode = false,
}) => {
  const theme = useTheme();
  const [rideStatus, setRideStatus] = useState("searching"); // searching, found, arriving, ongoing, completed
  const [estimatedTime, setEstimatedTime] = useState(5);
  const [driverLocation, setDriverLocation] = useState({
    lat: 26.9124,
    lng: 75.7873,
  });
  const [userLocation] = useState({ lat: 26.9344, lng: 75.8067 });

  // Animation values
  const pulseAnimation = useSharedValue(0);
  const carAnimation = useSharedValue(0);
  const progressAnimation = useSharedValue(0);

  // Mock driver data
  const driverData = {
    id: "driver-1",
    name: "Rajesh Kumar",
    rating: 4.8,
    totalRides: 1247,
    carModel: "Maruti Swift",
    carNumber: "RJ 14 AB 1234",
    carColor: "White",
    phone: "+91 98765 43210",
    profilePicture: "https://api.dicebear.com/7.x/avataaars/svg?seed=rajesh",
    verificationLevel: "gold",
  };

  const rideStages = [
    {
      key: "searching",
      title: "Finding your ride",
      description: "Looking for nearby drivers",
    },
    {
      key: "found",
      title: "Driver found",
      description: "Driver is accepting your request",
    },
    {
      key: "arriving",
      title: "Driver is arriving",
      description: "Your driver is on the way",
    },
    {
      key: "ongoing",
      title: "Ride in progress",
      description: "Enjoy your journey",
    },
    {
      key: "completed",
      title: "Ride completed",
      description: "Thank you for riding with us",
    },
  ];

  useEffect(() => {
    // Start pulse animation
    pulseAnimation.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      true
    );

    // Simulate ride progress
    const progressTimer = setInterval(() => {
      setRideStatus((prevStatus) => {
        const stages = [
          "searching",
          "found",
          "arriving",
          "ongoing",
          "completed",
        ];
        const currentIndex = stages.indexOf(prevStatus);
        if (currentIndex < stages.length - 1) {
          return stages[currentIndex + 1];
        }
        return prevStatus;
      });
    }, 4000);

    // Simulate car movement
    carAnimation.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 2000 }),
        withTiming(1, { duration: 2000 })
      ),
      -1,
      false
    );

    // Update estimated time
    const timeTimer = setInterval(() => {
      setEstimatedTime((prev) => Math.max(0, prev - 1));
    }, 60000);

    return () => {
      clearInterval(progressTimer);
      clearInterval(timeTimer);
    };
  }, []);

  const pulseStyle = useAnimatedStyle(() => {
    const scale = interpolate(pulseAnimation.value, [0, 1], [1, 1.2]);
    const opacity = interpolate(pulseAnimation.value, [0, 1], [1, 0.3]);
    return {
      transform: [{ scale }],
      opacity,
    };
  });

  const carStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      carAnimation.value,
      [0, 1],
      [0, width * 0.6]
    );
    const rotate = interpolate(carAnimation.value, [0, 0.5, 1], [0, 10, -5]);
    return {
      transform: [{ translateX }, { rotate: `${rotate}deg` }],
    };
  });

  const getCurrentStage = () => {
    return (
      rideStages.find((stage) => stage.key === rideStatus) || rideStages[0]
    );
  };

  const handleCall = () => {
    Alert.alert("Call Driver", `Call ${driverData.name}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Call", onPress: () => console.log("Calling driver...") },
    ]);
  };

  const handleMessage = () => {
    Alert.alert("Message Driver", "Send a quick message to your driver?", [
      { text: "Cancel", style: "cancel" },
      { text: "Send", onPress: () => console.log("Sending message...") },
    ]);
  };

  const handleShare = () => {
    Alert.alert("Share Ride", "Share your ride details with someone?", [
      { text: "Cancel", style: "cancel" },
      { text: "Share", onPress: () => console.log("Sharing ride...") },
    ]);
  };

  const getStatusColor = () => {
    switch (rideStatus) {
      case "searching":
        return "#f59e0b";
      case "found":
        return "#10b981";
      case "arriving":
        return "#3b82f6";
      case "ongoing":
        return "#8b5cf6";
      case "completed":
        return "#10b981";
      default:
        return theme.colors.primary;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={theme.colors.onSurface} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.onSurface }]}>
            Track Ride
          </Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Share size={20} color={theme.colors.onSurface} />
          </TouchableOpacity>
        </View>

        {/* Map Simulation */}
        <View style={styles.mapContainer}>
          <LinearGradient
            colors={
              isDarkMode ? ["#1e293b", "#334155"] : ["#f8fafc", "#e2e8f0"]
            }
            style={styles.mapGradient}
          >
            {/* Animated pulse for user location */}
            <View style={styles.userLocationContainer}>
              <Animated.View style={[styles.userPulse, pulseStyle]} />
              <View
                style={[
                  styles.userMarker,
                  { backgroundColor: theme.colors.primary },
                ]}
              >
                <MapPin size={16} color="white" />
              </View>
            </View>

            {/* Animated car for driver */}
            {rideStatus !== "searching" && (
              <Animated.View style={[styles.carContainer, carStyle]}>
                <View
                  style={[
                    styles.carMarker,
                    { backgroundColor: getStatusColor() },
                  ]}
                >
                  <Car size={16} color="white" />
                </View>
              </Animated.View>
            )}

            {/* Route line */}
            {rideStatus !== "searching" && <View style={styles.routeLine} />}
          </LinearGradient>
        </View>

        {/* Status Card */}
        <Card style={styles.statusCard}>
          <Card.Content style={styles.statusContent}>
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: getStatusColor() },
              ]}
            />
            <View style={styles.statusText}>
              <Text
                style={[styles.statusTitle, { color: theme.colors.onSurface }]}
              >
                {getCurrentStage().title}
              </Text>
              <Text
                style={[
                  styles.statusDescription,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                {getCurrentStage().description}
              </Text>
            </View>
            {rideStatus === "arriving" && (
              <View style={styles.etaContainer}>
                <Clock size={16} color={theme.colors.primary} />
                <Text style={[styles.etaText, { color: theme.colors.primary }]}>
                  {estimatedTime} min
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Driver Info */}
        {rideStatus !== "searching" && (
          <Card style={styles.driverCard}>
            <Card.Content style={styles.driverContent}>
              <View style={styles.driverInfo}>
                <Avatar.Image
                  size={48}
                  source={{ uri: driverData.profilePicture }}
                />
                <View style={styles.driverDetails}>
                  <View style={styles.driverNameRow}>
                    <Text
                      style={[
                        styles.driverName,
                        { color: theme.colors.onSurface },
                      ]}
                    >
                      {driverData.name}
                    </Text>
                    <View style={styles.ratingContainer}>
                      <Star size={14} color="#fbbf24" fill="#fbbf24" />
                      <Text
                        style={[
                          styles.rating,
                          { color: theme.colors.onSurface },
                        ]}
                      >
                        {driverData.rating}
                      </Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.carInfo,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {driverData.carModel} • {driverData.carNumber}
                  </Text>
                  <Text
                    style={[
                      styles.ridesCount,
                      { color: theme.colors.onSurfaceVariant },
                    ]}
                  >
                    {driverData.totalRides} rides completed
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.colors.primary },
                  ]}
                  onPress={handleCall}
                >
                  <Phone size={20} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: theme.colors.secondary },
                  ]}
                  onPress={handleMessage}
                >
                  <MessageCircle size={20} color="white" />
                </TouchableOpacity>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Ride Details */}
        <Card style={styles.rideDetailsCard}>
          <Card.Content style={styles.rideDetailsContent}>
            <View style={styles.routeInfo}>
              <View style={styles.routePoint}>
                <View
                  style={[
                    styles.routeDot,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
                <Text
                  style={[styles.routeText, { color: theme.colors.onSurface }]}
                >
                  LNMIIT Campus
                </Text>
              </View>
              <View style={styles.routeLine} />
              <View style={styles.routePoint}>
                <View
                  style={[styles.routeDot, { backgroundColor: "#10b981" }]}
                />
                <Text
                  style={[styles.routeText, { color: theme.colors.onSurface }]}
                >
                  Jaipur Railway Station
                </Text>
              </View>
            </View>

            <View style={styles.fareInfo}>
              <Text
                style={[
                  styles.fareLabel,
                  { color: theme.colors.onSurfaceVariant },
                ]}
              >
                Fare
              </Text>
              <Text
                style={[styles.fareAmount, { color: theme.colors.onSurface }]}
              >
                ₹45
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Cancel/Complete Button */}
        <View style={styles.bottomActions}>
          {rideStatus === "searching" || rideStatus === "found" ? (
            <Button
              mode="outlined"
              onPress={() => {
                Alert.alert("Cancel Ride", "Are you sure you want to cancel?", [
                  { text: "No", style: "cancel" },
                  { text: "Yes", onPress: onClose },
                ]);
              }}
              style={styles.cancelButton}
              textColor={theme.colors.error}
            >
              Cancel Ride
            </Button>
          ) : rideStatus === "completed" ? (
            <Button
              mode="contained"
              onPress={onClose}
              style={styles.completeButton}
            >
              Rate & Finish
            </Button>
          ) : null}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  shareButton: {
    padding: 4,
  },
  mapContainer: {
    height: 200,
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  mapGradient: {
    flex: 1,
    position: "relative",
  },
  userLocationContainer: {
    position: "absolute",
    top: "70%",
    left: "20%",
    alignItems: "center",
    justifyContent: "center",
  },
  userPulse: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#3b82f640",
  },
  userMarker: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  carContainer: {
    position: "absolute",
    top: "30%",
    left: "10%",
  },
  carMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  routeLine: {
    position: "absolute",
    top: "35%",
    left: "15%",
    width: width * 0.4,
    height: 2,
    backgroundColor: "#94a3b8",
    transform: [{ rotate: "35deg" }],
  },
  statusCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  statusContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  statusDescription: {
    fontSize: 14,
  },
  etaContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  etaText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 4,
  },
  driverCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  driverContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  driverDetails: {
    marginLeft: 12,
    flex: 1,
  },
  driverNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  driverName: {
    fontSize: 16,
    fontWeight: "600",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 2,
  },
  carInfo: {
    fontSize: 14,
    marginBottom: 2,
  },
  ridesCount: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: "row",
    marginLeft: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  rideDetailsCard: {
    marginHorizontal: 20,
    marginBottom: 16,
  },
  rideDetailsContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  routeInfo: {
    flex: 1,
  },
  routePoint: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  routeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  routeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  fareInfo: {
    alignItems: "flex-end",
  },
  fareLabel: {
    fontSize: 12,
  },
  fareAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  bottomActions: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  cancelButton: {
    borderColor: "#ef4444",
  },
  completeButton: {
    backgroundColor: "#10b981",
  },
});

export default RideTracking;
