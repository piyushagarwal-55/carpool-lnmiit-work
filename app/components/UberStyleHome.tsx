import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  Alert,
  Vibration,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Surface,
  IconButton,
  Avatar,
  useTheme,
  Searchbar,
  Card,
  Chip,
} from "react-native-paper";
import {
  Search,
  MapPin,
  Clock,
  Star,
  Car,
  Bus,
  Package,
  Calendar,
  Users,
  Navigation,
} from "lucide-react-native";
import RideBookingFlow from "./RideBookingFlow";
import RideTracking from "./RideTracking";

interface UberStyleHomeProps {
  user?: any;
  isDarkMode?: boolean;
  onLocationSelect?: (location: string) => void;
  onServiceSelect?: (service: string) => void;
  onCreateRide?: () => void;
  onShowBusBooking?: () => void;
}

const { width } = Dimensions.get("window");

const UberStyleHome = ({
  user,
  isDarkMode = false,
  onLocationSelect,
  onServiceSelect,
  onCreateRide,
  onShowBusBooking,
}: UberStyleHomeProps) => {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [showBookingFlow, setShowBookingFlow] = useState(false);
  const [showRideTracking, setShowRideTracking] = useState(false);
  const [currentRide, setCurrentRide] = useState<any>(null);

  const handleServiceSelect = (service: string) => {
    Vibration.vibrate(50); // Haptic feedback

    switch (service.toLowerCase()) {
      case "ride":
        setShowBookingFlow(true);
        break;
      case "reserve":
        Alert.alert("Schedule Ride", "Book a ride for later", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Schedule",
            onPress: () => {
              setShowBookingFlow(true);
            },
          },
        ]);
        break;
      case "bus":
        if (onShowBusBooking) {
          onShowBusBooking();
        } else {
          Alert.alert("Bus Booking", "Bus booking feature coming soon!");
        }
        break;
      case "group":
        if (onCreateRide) {
          onCreateRide();
        } else {
          Alert.alert("Group Ride", "Create a group ride to share costs!");
        }
        break;
      default:
        onServiceSelect?.(service);
    }
  };

  const handleLocationSelect = (location: string) => {
    Vibration.vibrate(50); // Haptic feedback

    if (location === "Add your home address") {
      Alert.alert(
        "Add Home Address",
        "Would you like to add your home address for quick access?",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Add Address",
            onPress: () => {
              Alert.alert(
                "Feature Coming Soon",
                "Address management will be available in the next update!"
              );
            },
          },
        ]
      );
    } else {
      onLocationSelect?.(location);
      setShowBookingFlow(true);
    }
  };

  const handlePlanningOptionSelect = (option: string) => {
    Vibration.vibrate(50); // Haptic feedback

    switch (option) {
      case "Schedule a ride":
        setShowBookingFlow(true);
        break;
      case "Group rides":
        if (onCreateRide) {
          onCreateRide();
        } else {
          Alert.alert(
            "Group Rides",
            "Create or join group rides to save money!"
          );
        }
        break;
      default:
        Alert.alert("Feature", `${option} feature coming soon!`);
    }
  };

  const savedLocations = [
    {
      id: "1",
      name: "LNMIIT Campus",
      address: "Rupa ki Nangal, Post-Sumel, Via-Jamdoli, Jaipur",
      icon: "🏫",
    },
    {
      id: "2",
      name: "Home",
      address: "Add your home address",
      icon: "🏠",
    },
  ];

  const suggestions = [
    {
      id: "1",
      title: "Ride",
      icon: Car,
      color: isDarkMode ? "#FFFFFF" : "#000000",
      bgColor: isDarkMode ? "#2A2A2A" : "#E8E8E8",
      description: "Book a ride now",
    },
    {
      id: "2",
      title: "Reserve",
      icon: Calendar,
      color: isDarkMode ? "#FFFFFF" : "#000000",
      bgColor: isDarkMode ? "#2A2A2A" : "#E8E8E8",
      description: "Schedule for later",
    },
    {
      id: "3",
      title: "Bus",
      icon: Bus,
      color: isDarkMode ? "#FFFFFF" : "#000000",
      bgColor: isDarkMode ? "#2A2A2A" : "#E8E8E8",
      description: "College bus booking",
    },
    {
      id: "4",
      title: "Group",
      icon: Users,
      color: isDarkMode ? "#FFFFFF" : "#000000",
      bgColor: isDarkMode ? "#2A2A2A" : "#E8E8E8",
      description: "Share rides & costs",
    },
  ];

  const planningOptions = [
    {
      id: "1",
      title: "Schedule a ride",
      subtitle: "Plan ahead for your trips",
      emoji: "🚗",
      bgColor: isDarkMode ? "#2A2A2A" : "#E8E8E8",
    },
    {
      id: "2",
      title: "Group rides",
      subtitle: "Share costs with friends",
      emoji: "👥",
      bgColor: isDarkMode ? "#2A2A2A" : "#E8E8E8",
    },
  ];

  const recentDestinations = [
    "Jaipur Railway Station",
    "Pink City Mall",
    "Birla Temple",
    "Hawa Mahal",
  ];

  if (showRideTracking && currentRide) {
    return (
      <RideTracking
        visible={showRideTracking}
        onClose={() => {
          setShowRideTracking(false);
          setCurrentRide(null);
        }}
        rideData={currentRide}
        isDarkMode={isDarkMode}
      />
    );
  }

  if (showBookingFlow) {
    return (
      <RideBookingFlow
        visible={showBookingFlow}
        onClose={() => setShowBookingFlow(false)}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#000000" : "#FFFFFF" },
      ]}
    >
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Bar */}
        <TouchableOpacity
          style={[
            styles.searchContainer,
            {
              backgroundColor: isDarkMode ? "#1A1A1A" : "#F5F5F5",
              borderColor: isDarkMode ? "#333333" : "#E0E0E0",
            },
          ]}
          onPress={() => setShowBookingFlow(true)}
          activeOpacity={0.7}
        >
          <Search size={20} color={isDarkMode ? "#CCCCCC" : "#666666"} />
          <Text
            style={[
              styles.searchText,
              { color: isDarkMode ? "#CCCCCC" : "#666666" },
            ]}
          >
            Where to?
          </Text>
          <View
            style={[
              styles.nowButton,
              { backgroundColor: isDarkMode ? "#333333" : "#E0E0E0" },
            ]}
          >
            <Clock size={16} color={isDarkMode ? "#FFFFFF" : "#000000"} />
            <Text
              style={[
                styles.nowText,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
            >
              Now
            </Text>
          </View>
        </TouchableOpacity>

        {/* Saved Locations */}
        <View style={styles.savedLocationsContainer}>
          {savedLocations.map((location) => (
            <TouchableOpacity
              key={location.id}
              style={[
                styles.savedLocation,
                { borderBottomColor: isDarkMode ? "#333333" : "#E0E0E0" },
              ]}
              onPress={() => handleLocationSelect(location.address)}
              activeOpacity={0.7}
            >
              <View style={styles.locationIcon}>
                <Text style={styles.locationEmoji}>{location.icon}</Text>
              </View>
              <View style={styles.locationInfo}>
                <Text
                  style={[
                    styles.locationName,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" },
                  ]}
                >
                  {location.name}
                </Text>
                <Text
                  style={[
                    styles.locationAddress,
                    { color: isDarkMode ? "#CCCCCC" : "#666666" },
                  ]}
                >
                  {location.address}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Suggestions */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDarkMode ? "#FFFFFF" : "#000000" },
            ]}
          >
            Suggestions
          </Text>
          <View style={styles.suggestionsGrid}>
            {suggestions.map((suggestion) => (
              <TouchableOpacity
                key={suggestion.id}
                style={[
                  styles.suggestionCard,
                  { backgroundColor: suggestion.bgColor },
                ]}
                onPress={() => handleServiceSelect(suggestion.title)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.suggestionIconContainer,
                    { backgroundColor: isDarkMode ? "#333333" : "#FFFFFF" },
                  ]}
                >
                  <suggestion.icon size={24} color={suggestion.color} />
                </View>
                <Text
                  style={[
                    styles.suggestionText,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" },
                  ]}
                >
                  {suggestion.title}
                </Text>
                <Text
                  style={[
                    styles.suggestionDescription,
                    { color: isDarkMode ? "#CCCCCC" : "#666666" },
                  ]}
                >
                  {suggestion.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Planning */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDarkMode ? "#FFFFFF" : "#000000" },
            ]}
          >
            Planning ahead
          </Text>
          <View style={styles.planningContainer}>
            {planningOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.planningCard,
                  { backgroundColor: option.bgColor },
                ]}
                onPress={() => handlePlanningOptionSelect(option.title)}
                activeOpacity={0.7}
              >
                <Text style={styles.planningEmoji}>{option.emoji}</Text>
                <View style={styles.planningText}>
                  <Text
                    style={[
                      styles.planningTitle,
                      { color: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                  >
                    {option.title}
                  </Text>
                  <Text
                    style={[
                      styles.planningSubtitle,
                      { color: isDarkMode ? "#CCCCCC" : "#666666" },
                    ]}
                  >
                    {option.subtitle}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Destinations */}
        <View style={styles.section}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDarkMode ? "#FFFFFF" : "#000000" },
            ]}
          >
            Recent destinations
          </Text>
          <View style={styles.recentContainer}>
            {recentDestinations.map((destination, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.recentItem,
                  { borderBottomColor: isDarkMode ? "#333333" : "#E0E0E0" },
                ]}
                onPress={() => handleLocationSelect(destination)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.recentIcon,
                    { backgroundColor: isDarkMode ? "#333333" : "#E0E0E0" },
                  ]}
                >
                  <Clock size={16} color={isDarkMode ? "#FFFFFF" : "#666666"} />
                </View>
                <Text
                  style={[
                    styles.recentText,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" },
                  ]}
                >
                  {destination}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  nowButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  nowText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: "500",
  },
  savedLocationsContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  savedLocation: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  locationEmoji: {
    fontSize: 20,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 14,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  suggestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  suggestionCard: {
    width: (width - 60) / 2,
    padding: 20,
    borderRadius: 20, // More rounded for harmony design
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  suggestionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  suggestionDescription: {
    fontSize: 12,
    marginTop: 4,
    textAlign: "center",
    opacity: 0.8,
  },
  planningContainer: {
    gap: 12,
  },
  planningCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    borderRadius: 20, // More rounded for harmony design
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  planningEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  planningText: {
    flex: 1,
  },
  planningTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  planningSubtitle: {
    fontSize: 14,
  },
  recentContainer: {
    gap: 0,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  recentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  recentText: {
    fontSize: 16,
    fontWeight: "500",
  },
});

export default UberStyleHome;
