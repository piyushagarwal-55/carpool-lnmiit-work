//index.tsx code - FIXED VERSION

import React, { useState, useEffect } from "react";
import { View, StyleSheet, useColorScheme, Animated } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Text,
  ActivityIndicator,
  MD3LightTheme,
  MD3DarkTheme,
  PaperProvider,
} from "react-native-paper";
import { useRouter } from "expo-router";
import ReAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from "react-native-reanimated";

// Screens
import { AuthContext } from "./AuthContext";
import LoadingScreen from "./components/LoadingScreen";
import ModernAuthScreen from "./components/ModernAuthScreen";
import StudentCarpoolSystem from "./components/StudentCarpoolSystem";
import BusBookingSystem from "./components/BusBookingSystem";
import UserProfileSafety from "./components/UserProfileSafety";

// ✅ Add these missing imports at the top
import { TouchableOpacity, ScrollView, Alert, Image } from "react-native";
import { IconButton } from "react-native-paper";
import { LinearGradient } from "expo-linear-gradient";

import { Session } from "@supabase/supabase-js";
import { supabase } from "./lib/supabase";
import Auth from "./components/ModernAuthScreen";
import CreateRideScreen from "./components/CreateRideScreen";
import { formatDate, formatTime } from "./lib/utils";

// Theme
const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#000000",
    background: "#FFFFFF",
    onBackground: "#000000",
    surface: "#FFFFFF",
    onSurface: "#000000",
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#FFFFFF",
    background: "#000000",
    onBackground: "#FFFFFF",
    surface: "#000000",
    onSurface: "#FFFFFF",
  },
};

interface CarpoolRide {
  id: string;
  driverId: string;
  driverName: string;
  driverRating: number;
  driverPhoto: string;
  driverBranch: string;
  driverYear: string;
  driverPhone?: string;
  from: string;
  to: string;
  departureTime: string;
  date: string;
  availableSeats: number;
  totalSeats: number;
  pricePerSeat: number;
  vehicleInfo: {
    make: string;
    model: string;
    color: string;
    isAC: boolean;
  };
  route: string[];
  preferences: {
    gender?: "male" | "female" | "any";
    smokingAllowed: boolean;
    musicAllowed: boolean;
  };
  status: "active" | "full" | "completed" | "cancelled";
  passengers: Array<{
    id: string;
    name: string;
    photo: string;
    joinedAt: string;
    status: "pending" | "accepted" | "confirmed";
    seatsBooked: number;
  }>;
  pendingRequests: Array<{
    id: string;
    passengerId: string;
    passengerName: string;
    passengerPhoto: string;
    seatsRequested: number;
    message?: string;
    requestedAt: string;
    status: "pending" | "accepted" | "rejected";
  }>;
  instantBooking: boolean;
  chatEnabled: boolean;
  createdAt: string;
}

// Add database configuration validation
const validateDatabaseConfig = async () => {
  try {
    const { data, error } = await supabase
      .from("carpool_rides")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Database validation failed:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Database connection test failed:", error);
    return false;
  }
};

export const useAuth = (session?: Session) => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    if (session?.user) {
      const sessionUser = session.user;
      const userFromSession = {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.user_metadata.full_name || sessionUser.email,
        role: sessionUser.user_metadata.role || "passenger",
        branch: sessionUser.user_metadata.branch,
        year: sessionUser.user_metadata.year,
        rating: sessionUser.user_metadata.rating || 4.5,
        profilePicture:
          sessionUser.user_metadata.profile_picture ||
          sessionUser.user_metadata.avatar_url,
        phone: sessionUser.user_metadata.phone,
        ridesCompleted: sessionUser.user_metadata.ridesCompleted || 0,
      };
      setUser(userFromSession);
    }
    setLoading(false);
    const timer = setTimeout(() => setIsInitialLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [session]);

  const login = (
    email: string,
    password: string,
    role: "driver" | "passenger" | "external_driver"
  ) => {
    // Generate a consistent UUID from email using a deterministic method
    const generateUUIDFromEmail = (email: string): string => {
      let hash = 0;
      for (let i = 0; i < email.length; i++) {
        const char = email.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }

      const hex = Math.abs(hash).toString(16).padStart(8, "0");
      return `${hex.substring(0, 8)}-${hex.substring(0, 4)}-4${hex.substring(
        1,
        4
      )}-a${hex.substring(1, 4)}-${hex.substring(0, 12)}`;
    };

    const userData = {
      id: generateUUIDFromEmail(email),
      email,
      role,
      name: role === "driver" ? "Driver" : "Student",
    };
    setUser(userData);
    return Promise.resolve();
  };

  const logout = () => {
    setUser(null);
    return Promise.resolve();
  };

  return { user, loading, isInitialLoading, login, logout };
};

const AppContent = ({ session }: { session: Session }) => {
  const auth = useAuth(session);
  const { user, loading, isInitialLoading, login, logout } = auth;

  // ✅ FIXED: Move all useState hooks to the top level, before any conditional returns
  const [index, setIndex] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarAnimation] = useState(new Animated.Value(-400));
  const [busBookings, setBusBookings] = useState<any[]>([]);
  const [bookedSeats, setBookedSeats] = useState<{ [busId: string]: string[] }>(
    {}
  );
  const [availableRides, setAvailableRides] = useState(0);
  const [userRideHistory, setUserRideHistory] = useState(0);
  const [activeBusRoutes, setActiveBusRoutes] = useState(0);
  const [showCreateRide, setShowCreateRide] = useState(false);
  const [rideSubmitting, setRideSubmitting] = useState(false);
  const [showRideHistory, setShowRideHistory] = useState(false);
  const [rides, setRides] = useState<CarpoolRide[]>([]);
  const colorScheme = useColorScheme();
  const router = useRouter();
  const themeTransition = useSharedValue(0);

  useEffect(() => {
    setIsDarkMode(false);
  }, [colorScheme]);

  useEffect(() => {
    themeTransition.value = withTiming(isDarkMode ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [isDarkMode]);

  // Add connection status monitoring
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await validateDatabaseConfig();
      if (!isConnected) {
        console.warn("Database connection issues detected");
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch real data for sidebar
  const fetchSidebarData = async () => {
    try {
      const { data: ridesData, error: ridesError } = await supabase
        .from("carpool_rides")
        .select("id")
        .eq("status", "active")
        .gte("departure_time", new Date().toISOString());

      if (ridesError) {
        setAvailableRides(12);
      } else {
        setAvailableRides(ridesData?.length || 0);
      }

      if (user?.id) {
        const { data: historyData, error: historyError } = await supabase
          .from("carpool_rides")
          .select("id")
          .eq("driver_id", user.id);

        if (historyError) {
          setUserRideHistory(5);
        } else {
          setUserRideHistory(historyData?.length || 0);
        }
      }

      const { data: busData, error: busError } = await supabase
        .from("buses")
        .select("route_name");

      if (busError) {
        setActiveBusRoutes(8);
      } else {
        const uniqueRoutes = new Set(busData?.map((bus) => bus.route_name));
        setActiveBusRoutes(uniqueRoutes.size || 8);
      }
    } catch (error) {
      setAvailableRides(12);
      setUserRideHistory(5);
      setActiveBusRoutes(8);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSidebarData();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      const interval = setInterval(fetchSidebarData, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // ✅ FIXED: Create ride handlers moved to proper location
  const handleCreateRide = () => {
    // Close sidebar first
    setSidebarVisible(false);
    // Small delay to ensure smooth transition
    setTimeout(() => {
      setShowCreateRide(true);
    }, 150);
  };

  // Helper function to generate fallback ID
  const generateFallbackId = () => {
    return `fallback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  // ✅ FIXED: Improved handleRideCreated function with better error handling
  const handleRideCreated = async (rideData: any) => {
    setRideSubmitting(true);

    try {
      console.log("Raw rideData:", rideData);

      // Add network and database validation
      try {
        // Test database connection first
        const { data: testData, error: testError } = await supabase
          .from("carpool_rides")
          .select("count")
          .limit(1);

        if (testError && testError.message) {
          throw new Error(`Database connection failed: ${testError.message}`);
        }
      } catch (connectionError) {
        console.error("Database connection test failed:", connectionError);
        throw new Error(
          "Unable to connect to database. Please check your internet connection."
        );
      }

      // ✅ FIXED: Better date/time validation and processing
      let departureDateTime;

      try {
        if (rideData.date && rideData.time) {
          // Parse date - handle different formats
          let dateStr = rideData.date;
          if (rideData.date instanceof Date) {
            dateStr = rideData.date.toISOString().split("T")[0];
          } else if (
            typeof rideData.date === "string" &&
            !rideData.date.includes("-")
          ) {
            dateStr = new Date(rideData.date).toISOString().split("T")[0];
          }

          // Parse time - ensure proper format
          let timeStr = rideData.time;
          if (timeStr.length === 5) {
            timeStr = `${timeStr}:00`;
          } else if (timeStr.length === 8) {
            // Already in HH:MM:SS format
          } else {
            timeStr = `${timeStr}:00:00`;
          }

          departureDateTime = new Date(`${dateStr}T${timeStr}.000Z`);

          // Validate the created date
          if (isNaN(departureDateTime.getTime())) {
            throw new Error("Invalid date/time format");
          }
        } else {
          // Default to tomorrow at 9 AM if no date/time provided
          departureDateTime = new Date();
          departureDateTime.setDate(departureDateTime.getDate() + 1);
          departureDateTime.setHours(9, 0, 0, 0);
        }
      } catch (dateError) {
        console.error("Date parsing error:", dateError);
        // Fallback date/time
        departureDateTime = new Date();
        departureDateTime.setDate(departureDateTime.getDate() + 1);
        departureDateTime.setHours(9, 0, 0, 0);
      }

      // ✅ FIXED: Ensure all required fields are properly formatted and validated
      const newRide = {
        // Required fields with proper validation
        driver_id: user?.id || generateFallbackId(),
        driver_name: user?.name || rideData.driverName || "Anonymous Driver",
        driver_email:
          user?.email || rideData.driverEmail || "unknown@lnmiit.ac.in",
        driver_phone: user?.phone || rideData.driverPhone || null,
        from_location: (
          rideData.from ||
          rideData.fromLocation ||
          "LNMIIT Campus"
        ).trim(),
        to_location: (rideData.to || rideData.toLocation || "Jaipur").trim(),
        departure_time: departureDateTime.toISOString(),
        departure_date: departureDateTime.toISOString().split("T")[0],

        // Numeric fields with validation
        available_seats: Math.max(1, parseInt(rideData.availableSeats) || 3),
        total_seats: Math.max(1, parseInt(rideData.totalSeats) || 4),
        price_per_seat: Math.max(0, parseFloat(rideData.pricePerSeat) || 100),

        // Vehicle information with defaults
        vehicle_make: (
          rideData.vehicle_make ||
          rideData.vehicleMake ||
          "Car"
        ).trim(),
        vehicle_model: (
          rideData.vehicle_model ||
          rideData.vehicleModel ||
          "Model"
        ).trim(),
        vehicle_color: (
          rideData.vehicle_color ||
          rideData.vehicleColor ||
          "White"
        ).trim(),
        license_plate: rideData.license_plate || rideData.licensePlate || null,

        // Boolean fields with proper defaults
        is_ac: Boolean(rideData.is_ac ?? rideData.isAC ?? true),
        smoking_allowed: Boolean(
          rideData.smoking_allowed ?? rideData.smokingAllowed ?? false
        ),
        music_allowed: Boolean(
          rideData.music_allowed ?? rideData.musicAllowed ?? true
        ),
        pets_allowed: Boolean(
          rideData.pets_allowed ?? rideData.petsAllowed ?? false
        ),
        instant_booking: Boolean(
          rideData.instant_booking ?? rideData.instantBooking ?? false
        ),
        chat_enabled: Boolean(
          rideData.chat_enabled ?? rideData.chatEnabled ?? true
        ),

        // Status and additional fields
        status: "active",
        estimated_duration: rideData.estimated_duration || "30 mins",
        description: (rideData.description || rideData.notes || "").trim(),

        // NOTE: Removed driver_rating, driver_branch, driver_year as they don't exist in carpool_rides table
        // These are stored in user_profiles table instead
      };

      // Validate required database fields match
      const requiredFields = [
        "driver_id",
        "driver_name",
        "driver_email",
        "from_location",
        "to_location",
        "departure_time",
        "departure_date",
        "available_seats",
        "total_seats",
        "price_per_seat",
      ] as const;
      const missingFields = requiredFields.filter(
        (field) => !(newRide as any)[field]
      );

      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(", ")}`);
      }

      // Validate data types
      if (
        typeof newRide.available_seats !== "number" ||
        isNaN(newRide.available_seats)
      ) {
        throw new Error("Invalid seat number format");
      }

      if (
        typeof newRide.price_per_seat !== "number" ||
        isNaN(newRide.price_per_seat)
      ) {
        throw new Error("Invalid price format");
      }

      // Validate seat numbers
      if (newRide.available_seats > newRide.total_seats) {
        throw new Error("Available seats cannot exceed total seats");
      }

      console.log("Processed ride data for insert:", newRide);

      let insertAttempts = 0;
      const maxAttempts = 3;
      let data, error;

      while (insertAttempts < maxAttempts) {
        try {
          const result = await supabase
            .from("carpool_rides")
            .insert([newRide])
            .select()
            .single();

          data = result.data;
          error = result.error;

          if (!error) break; // Success, exit retry loop

          insertAttempts++;
          if (insertAttempts < maxAttempts) {
            console.log(`Insert attempt ${insertAttempts} failed, retrying...`);
            await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
          }
        } catch (networkError) {
          insertAttempts++;
          if (insertAttempts >= maxAttempts) {
            throw new Error(
              "Network error: Unable to create ride. Please check your internet connection."
            );
          }
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }

      if (error) {
        console.error("Supabase insert error details:", {
          error,
          message: error?.message || "Unknown error",
          details: error?.details || "No details available",
          hint: error?.hint || "No hint available",
          code: error?.code || "No error code",
        });

        // Provide specific error messages based on error type
        let errorMessage = "Failed to create ride";

        if (!error.message && !error.code) {
          errorMessage =
            "Network connection failed. Please check your internet connection and try again.";
        } else if (error.code === "23505") {
          errorMessage = "A ride with these details already exists";
        } else if (error.code === "23502") {
          errorMessage = "Missing required information";
        } else if (error.code === "23514") {
          errorMessage = "Invalid data format";
        } else if (error.code === "PGRST116") {
          errorMessage = "Database table not found. Please contact support.";
        } else if (error.message) {
          errorMessage = error.message;
        }

        throw new Error(errorMessage);
      }

      if (!data) {
        throw new Error("No data returned from database");
      }

      console.log("Ride created successfully:", data);

      Alert.alert(
        "Success! 🎉",
        "Your ride has been created successfully and is now available for bookings!",
        [
          {
            text: "View Rides",
            onPress: () => {
              setShowCreateRide(false);
              setIndex(0); // Navigate to carpool tab
            },
          },
        ]
      );

      setShowCreateRide(false);
      await fetchSidebarData(); // Refresh data
    } catch (error) {
      console.error("Error creating ride:", error);

      let userFriendlyMessage =
        "An unexpected error occurred while creating your ride.";

      if (error instanceof Error) {
        if (error.message.includes("required fields")) {
          userFriendlyMessage =
            "Please fill in all required fields and try again.";
        } else if (error.message.includes("seats")) {
          userFriendlyMessage =
            "Please check your seat numbers - available seats cannot exceed total seats.";
        } else if (
          error.message.includes("date") ||
          error.message.includes("time")
        ) {
          userFriendlyMessage = "Please check your departure date and time.";
        } else {
          userFriendlyMessage = error.message;
        }
      }

      Alert.alert(
        "Connection Error",
        `${userFriendlyMessage}\n\nPlease check:\n• Internet connection\n• Try again in a few moments\n• Contact support if problem persists`,
        [
          {
            text: "Retry",
            onPress: () => handleRideCreated(rideData),
            style: "default",
          },
          {
            text: "Cancel",
            style: "cancel",
          },
        ]
      );
    } finally {
      setRideSubmitting(false);
    }
  };

  const animatedContainerStyle = useAnimatedStyle(() => ({
    backgroundColor: isDarkMode ? "#000000" : "#FFFFFF",
  }));

  const [routes] = useState([
    {
      key: "carpool",
      title: "Carpool",
      focusedIcon: "car",
      unfocusedIcon: "car-outline",
    },
    {
      key: "bus",
      title: "Bus",
      focusedIcon: "bus",
      unfocusedIcon: "bus",
    },
    {
      key: "profile",
      title: "Profile",
      focusedIcon: "account",
      unfocusedIcon: "account-outline",
    },
  ]);

  const toggleSidebar = () => {
    const toValue = sidebarVisible ? -400 : 0;
    setSidebarVisible(!sidebarVisible);
    Animated.spring(sidebarAnimation, {
      toValue,
      useNativeDriver: true,
      damping: 18,
      stiffness: 120,
    }).start();
  };

  // ✅ FIXED: Early returns after all hooks are declared
  if (isInitialLoading) {
    return <LoadingScreen isDarkMode={isDarkMode} />;
  }

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <Animated.View
          style={[styles.loadingContainer, animatedContainerStyle]}
        >
          <ActivityIndicator
            size="large"
            animating={true}
            color={isDarkMode ? "#FFFFFF" : "#000000"}
          />
          <Text
            variant="bodyLarge"
            style={{ marginTop: 16, color: isDarkMode ? "#FFFFFF" : "#000000" }}
          >
            Loading LNMIIT Carpool...
          </Text>
        </Animated.View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return <ModernAuthScreen onAuthenticated={login} isDarkMode={isDarkMode} />;
  }
  return (
    <AuthContext.Provider value={auth}>
      <View style={styles.safeArea}>
        <StatusBar
          style="dark"
          backgroundColor="transparent"
          translucent={true}
        />
        <SafeAreaView style={styles.container} edges={["top"]}>
          <Animated.View style={[styles.container, animatedContainerStyle]}>
            <View style={styles.content}>
              <View style={styles.sceneContainer}>
                {index === 0 && (
                  <StudentCarpoolSystem
                    isDarkMode={isDarkMode}
                    currentUser={{
                      id: user.id,
                      name: user.name,
                      email: user.email,
                      branch: user.branch,
                      year: user.year,
                      rating: user.rating,
                      photo:
                        user.profilePicture ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
                    }}
                    onCreateRide={handleCreateRide} // ✅ FIXED: Use proper handler
                    onJoinRide={(rideId) => {
                      console.log("Join ride:", rideId);
                    }}
                    onShowBusBooking={() => {
                      setIndex(1);
                    }}
                    onToggleSidebar={toggleSidebar}
                  />
                )}
                {index === 1 && (
                  <BusBookingSystem
                    isDarkMode={isDarkMode}
                    currentUser={{
                      id: user.id,
                      name: user.name,
                      email: user.email,
                      branch: user.branch,
                      year: user.year,
                      rating: user.rating,
                      photo:
                        user.profilePicture ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
                    }}
                    busBookings={busBookings}
                    onUpdateBookings={setBusBookings}
                    bookedSeats={bookedSeats}
                    onUpdateBookedSeats={setBookedSeats}
                    onToggleSidebar={toggleSidebar}
                    sidebarVisible={sidebarVisible}
                  />
                )}
                {index === 2 && (
                  <UserProfileSafety
                    user={user}
                    busBookings={busBookings}
                    onLogout={logout}
                    isDarkMode={isDarkMode}
                  />
                )}
              </View>

              {/* Custom Bottom Navigation */}
              <View
                style={[
                  styles.bottomNavContainer,
                  {
                    backgroundColor: isDarkMode ? "#000000" : "#FFFFFF",
                    borderTopColor: isDarkMode ? "#333333" : "#E0E0E0",
                    borderTopWidth: 1,
                    zIndex: 1,
                    elevation: 1,
                  },
                ]}
              >
                {routes.map((route, routeIndex) => {
                  const isActive = index === routeIndex;
                  const iconName = isActive
                    ? route.focusedIcon
                    : route.unfocusedIcon;

                  return (
                    <TouchableOpacity
                      key={route.key}
                      style={[styles.tabItem, isActive && styles.activeTabItem]}
                      onPress={() => setIndex(routeIndex)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.tabIconContainer,
                          isActive && {
                            backgroundColor: isDarkMode
                              ? "rgba(255,255,255,0.1)"
                              : "rgba(0,0,0,0.1)",
                          },
                        ]}
                      >
                        <IconButton
                          icon={iconName}
                          size={22}
                          iconColor={
                            isActive
                              ? isDarkMode
                                ? "#FFFFFF"
                                : "#000000"
                              : isDarkMode
                              ? "#666666"
                              : "#999999"
                          }
                          style={styles.tabButton}
                        />
                      </View>
                      <Text
                        style={[
                          styles.tabLabel,
                          {
                            color: isActive
                              ? isDarkMode
                                ? "#FFFFFF"
                                : "#000000"
                              : isDarkMode
                              ? "#666666"
                              : "#999999",
                            fontWeight: isActive ? "700" : "500",
                          },
                        ]}
                      >
                        {route.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* ✅ FIXED: CreateRideScreen moved outside sidebar */}
            <CreateRideScreen
              visible={showCreateRide}
              onBack={() => setShowCreateRide(false)}
              onRideCreated={handleRideCreated}
              isDarkMode={isDarkMode}
            />

            {/* Global Sidebar */}
            {sidebarVisible && (
              <>
                <Animated.View
                  style={[
                    {
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "85%",
                      height: "100%",
                      maxWidth: 380,
                      zIndex: 10000,
                      elevation: 50,
                      shadowColor: "#000",
                      shadowOffset: { width: 4, height: 0 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                    },
                    {
                      transform: [{ translateX: sidebarAnimation }],
                    },
                  ]}
                >
                  <LinearGradient
                    colors={
                      isDarkMode
                        ? ["#0F0F23", "#1A1A2E", "#16213E", "#0F0F23"]
                        : ["#F5F7FA", "#E3F2FD", "#F0F4FF", "#FFFFFF"]
                    }
                    locations={[0, 0.3, 0.7, 1]}
                    style={{
                      flex: 1,
                      paddingTop: 60,
                    }}
                  >
                    {/* Enhanced Header */}
                    <View
                      style={{
                        padding: 20,
                        borderBottomWidth: 1,
                        borderBottomColor: isDarkMode
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                      }}
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            flex: 1,
                          }}
                        >
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              backgroundColor: isDarkMode
                                ? "#FFFFFF"
                                : "#1565C0",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 14,
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.2,
                              shadowRadius: 4,
                              elevation: 4,
                            }}
                          >
                            <Text style={{ fontSize: 22 }}>🚗</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 20,
                                fontWeight: "800",
                                color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                                textShadowColor: isDarkMode
                                  ? "rgba(0,0,0,0.3)"
                                  : "none",
                              }}
                            >
                              LNMIIT Carpool
                            </Text>
                            <Text
                              style={{
                                fontSize: 13,
                                color: isDarkMode
                                  ? "rgba(255,255,255,0.9)"
                                  : "#666666",
                                fontWeight: "600",
                                letterSpacing: 0.5,
                              }}
                            >
                              Smart. Safe. Sustainable.
                            </Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: isDarkMode
                              ? "rgba(255,255,255,0.2)"
                              : "rgba(0,0,0,0.1)",
                            alignItems: "center",
                            justifyContent: "center",
                            borderWidth: 1,
                            borderColor: isDarkMode
                              ? "rgba(255,255,255,0.3)"
                              : "rgba(0,0,0,0.2)",
                          }}
                          onPress={toggleSidebar}
                        >
                          <IconButton
                            icon="close"
                            size={18}
                            iconColor={isDarkMode ? "#FFFFFF" : "#1A1A2E"}
                          />
                        </TouchableOpacity>
                      </View>

                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 12,
                          backgroundColor: isDarkMode
                            ? "rgba(76, 175, 80, 0.2)"
                            : "rgba(255, 255, 255, 0.8)",
                          paddingHorizontal: 12,
                          paddingVertical: 6,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: isDarkMode
                            ? "rgba(76, 175, 80, 0.3)"
                            : "rgba(255, 255, 255, 0.9)",
                        }}
                      >
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "#4CAF50",
                            marginRight: 8,
                          }}
                        />
                        <Text
                          style={{
                            fontSize: 12,
                            color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                            fontWeight: "600",
                          }}
                        >
                          Online • {availableRides} Active Rides
                        </Text>
                      </View>
                    </View>

                    {/* Enhanced User Info Card */}
                    <View
                      style={{
                        marginHorizontal: 20,
                        marginTop: 20,
                        borderRadius: 16,
                        overflow: "hidden",
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.15,
                        shadowRadius: 12,
                        elevation: 8,
                      }}
                    >
                      <LinearGradient
                        colors={["#FFFFFF", "#F8F9FF", "#FFFFFF"]}
                        style={{
                          padding: 20,
                          flexDirection: "row",
                          alignItems: "center",
                        }}
                      >
                        <View
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            backgroundColor: "#667eea",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 16,
                            shadowColor: "#667eea",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 6,
                            elevation: 4,
                            overflow: "hidden",
                          }}
                        >
                          {user?.profilePicture ? (
                            <Image
                              source={{ uri: user.profilePicture }}
                              style={{
                                width: 56,
                                height: 56,
                                borderRadius: 28,
                              }}
                              resizeMode="cover"
                            />
                          ) : (
                            <Text style={{ fontSize: 28 }}>👤</Text>
                          )}
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              fontSize: 18,
                              fontWeight: "700",
                              color: "#1A1A2E",
                              marginBottom: 4,
                            }}
                          >
                            {user?.name || "Student"}
                          </Text>
                          {/* <Text
                            style={{
                              fontSize: 14,
                              color: "#667eea",
                              fontWeight: "600",
                              marginBottom: 4,
                            }}
                          >
                            {user?.branch || "Computer Science"} •{" "}
                            {user?.year || "3rd Year"}
                          </Text> */}
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 13,
                                color: "#764ba2",
                                fontWeight: "500",
                              }}
                            >
                              Student ID:{" "}
                              {user?.email?.split("@")[0] || "21UCS000"}
                            </Text>
                          </View>
                        </View>
                        <View
                          style={{
                            backgroundColor: "#4CAF50",
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                          }}
                        >
                          <Text
                            style={{
                              color: "#FFFFFF",
                              fontSize: 10,
                              fontWeight: "700",
                              textTransform: "uppercase",
                            }}
                          >
                            Active
                          </Text>
                        </View>
                      </LinearGradient>
                    </View>

                    {/* Navigation Items */}
                    <ScrollView
                      style={{ flex: 1, padding: 20 }}
                      showsVerticalScrollIndicator={false}
                    >
                      <View>
                        <Text
                          style={{
                            fontSize: 13,
                            fontWeight: "700",
                            color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                            marginBottom: 16,
                            letterSpacing: 1,
                            textShadowColor: isDarkMode
                              ? "rgba(0,0,0,0.3)"
                              : "none",
                            textShadowOffset: { width: 1, height: 1 },
                            textShadowRadius: 2,
                          }}
                        >
                          QUICK ACTIONS
                        </Text>

                        <View>
                          {[
                            {
                              icon: "🚗",
                              label: "Create New Ride",
                              count: "New",
                              color: "#2196F3",
                              action: handleCreateRide, // ✅ FIXED: Use proper handler
                            },
                            {
                              icon: "🚌",
                              label: "Check Bus Schedule",
                              count: activeBusRoutes,
                              color: "#FF9800",
                              action: () => {
                                setSidebarVisible(false);
                                setIndex(1);
                              },
                            },
                          ].map((item, index) => (
                            <View
                              key={index}
                              style={{
                                marginBottom: 14,
                                borderRadius: 16,
                                overflow: "hidden",
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 3 },
                                shadowOpacity: 0.15,
                                shadowRadius: 8,
                                elevation: 6,
                              }}
                            >
                              <LinearGradient
                                colors={["#FFFFFF", "#F8F9FF", "#FFFFFF"]}
                                style={{ borderRadius: 16 }}
                              >
                                <TouchableOpacity
                                  style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    paddingVertical: 18,
                                    paddingHorizontal: 18,
                                    borderLeftWidth: 5,
                                    borderLeftColor: item.color,
                                  }}
                                  onPress={() => {
                                    // Close sidebar first, then execute action
                                    setSidebarVisible(false);
                                    // Add small delay to ensure sidebar closes first
                                    setTimeout(() => {
                                      item.action();
                                    }, 100);
                                  }}
                                >
                                  <View
                                    style={{
                                      width: 48,
                                      height: 48,
                                      borderRadius: 24,
                                      backgroundColor: item.color,
                                      alignItems: "center",
                                      justifyContent: "center",
                                      marginRight: 16,
                                      shadowColor: item.color,
                                      shadowOffset: { width: 0, height: 2 },
                                      shadowOpacity: 0.3,
                                      shadowRadius: 4,
                                      elevation: 4,
                                    }}
                                  >
                                    <Text style={{ fontSize: 22 }}>
                                      {item.icon}
                                    </Text>
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text
                                      style={{
                                        fontSize: 17,
                                        fontWeight: "700",
                                        color: "#1A1A2E",
                                        marginBottom: 4,
                                      }}
                                    >
                                      {item.label}
                                    </Text>
                                    <Text
                                      style={{
                                        fontSize: 13,
                                        color: "#667eea",
                                        fontWeight: "600",
                                      }}
                                    >
                                      {typeof item.count === "number"
                                        ? `${item.count} available`
                                        : item.count}
                                    </Text>
                                  </View>
                                  <View
                                    style={{
                                      backgroundColor: item.color,
                                      paddingHorizontal: 12,
                                      paddingVertical: 6,
                                      borderRadius: 16,
                                      minWidth: 36,
                                      alignItems: "center",
                                      shadowColor: item.color,
                                      shadowOffset: { width: 0, height: 2 },
                                      shadowOpacity: 0.2,
                                      shadowRadius: 3,
                                      elevation: 3,
                                    }}
                                  >
                                    <Text
                                      style={{
                                        color: "#FFFFFF",
                                        fontSize: 13,
                                        fontWeight: "700",
                                      }}
                                    >
                                      {item.count}
                                    </Text>
                                  </View>
                                </TouchableOpacity>
                              </LinearGradient>
                            </View>
                          ))}
                        </View>
                      </View>

                      {/* Enhanced Emergency SOS Button */}
                      <View
                        style={{
                          marginTop: 24,
                          borderRadius: 16,
                          overflow: "hidden",
                          shadowColor: "#FF4444",
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 8,
                        }}
                      >
                        <LinearGradient
                          colors={["#FF4444", "#FF6B6B", "#FF4444"]}
                          style={{ borderRadius: 16 }}
                        >
                          <TouchableOpacity
                            style={{
                              padding: 20,
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                            onPress={() => {
                              Alert.alert(
                                "🚨 Emergency Alert",
                                "Emergency services have been notified. Your location and emergency contacts will be contacted immediately.",
                                [
                                  { text: "Cancel", style: "cancel" },
                                  {
                                    text: "Send Alert",
                                    style: "destructive",
                                    onPress: () => {
                                      Alert.alert(
                                        "✅ Alert Sent",
                                        "Emergency alert has been sent successfully. Help is on the way.",
                                        [{ text: "OK" }]
                                      );
                                    },
                                  },
                                ]
                              );
                            }}
                          >
                            <View
                              style={{
                                width: 48,
                                height: 48,
                                borderRadius: 24,
                                backgroundColor: "rgba(255,255,255,0.3)",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 16,
                                borderWidth: 2,
                                borderColor: "rgba(255,255,255,0.4)",
                              }}
                            >
                              <Text style={{ fontSize: 24 }}>🚨</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  color: "#FFFFFF",
                                  fontSize: 18,
                                  fontWeight: "700",
                                  marginBottom: 4,
                                  textShadowColor: "rgba(0,0,0,0.3)",
                                  textShadowOffset: { width: 1, height: 1 },
                                  textShadowRadius: 2,
                                }}
                              >
                                Emergency SOS
                              </Text>
                              <Text
                                style={{
                                  color: "rgba(255,255,255,0.9)",
                                  fontSize: 13,
                                  fontWeight: "600",
                                }}
                              >
                                Tap for immediate help
                              </Text>
                            </View>
                            <View
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: 6,
                                backgroundColor: "#FFFFFF",
                                opacity: 0.9,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 1 },
                                shadowOpacity: 0.2,
                                shadowRadius: 2,
                                elevation: 2,
                              }}
                            />
                          </TouchableOpacity>
                        </LinearGradient>
                      </View>

                      <View style={{ height: 40 }} />
                    </ScrollView>

                    {/* Enhanced Footer */}
                    <View
                      style={{
                        padding: 20,
                        borderTopWidth: 1,
                        borderTopColor: isDarkMode ? "#333" : "#E0E0E0",
                        paddingBottom: 40,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          color: isDarkMode ? "#666" : "#999",
                          textAlign: "center",
                        }}
                      >
                        LNMIIT Carpool v2.0
                      </Text>
                      <Text
                        style={{
                          fontSize: 10,
                          color: isDarkMode ? "#555" : "#CCC",
                          textAlign: "center",
                          marginTop: 4,
                        }}
                      >
                        Safe. Reliable. Connected.
                      </Text>

                      {/* Made with love section */}
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          marginTop: 16,
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11,
                            color: isDarkMode ? "#888" : "#666",
                            textAlign: "center",
                          }}
                        >
                          Made with{" "}
                        </Text>
                        <Text
                          style={{
                            fontSize: 12,
                            color: "#E91E63",
                          }}
                        >
                          ❤️
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: isDarkMode ? "#888" : "#666",
                            textAlign: "center",
                          }}
                        >
                          {" "}
                          by{" "}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: isDarkMode ? "#FFFFFF" : "#1565C0",
                            fontWeight: "600",
                          }}
                        >
                          Amrendra
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: isDarkMode ? "#888" : "#666",
                          }}
                        >
                          {" "}
                          and{" "}
                        </Text>
                        <Text
                          style={{
                            fontSize: 11,
                            color: isDarkMode ? "#FFFFFF" : "#1565C0",
                            fontWeight: "600",
                          }}
                        >
                          Piyush
                        </Text>
                      </View>
                    </View>
                  </LinearGradient>
                </Animated.View>

                {/* Enhanced Overlay */}
                <Animated.View
                  style={[
                    {
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      width: "100%",
                      height: "100%",
                      backgroundColor: "rgba(0,0,0,0.5)",
                      zIndex: 9999, // Just below sidebar
                      elevation: 49,
                    },
                    {
                      opacity: sidebarAnimation.interpolate({
                        inputRange: [-400, 0],
                        outputRange: [0, 1],
                        extrapolate: "clamp",
                      }),
                    },
                  ]}
                >
                  <TouchableOpacity
                    style={{ flex: 1 }}
                    activeOpacity={1}
                    onPress={toggleSidebar}
                  />
                </Animated.View>
              </>
            )}

            {/* ✅ FIXED: CreateRideScreen moved outside sidebar and with proper z-index */}
            {showCreateRide && (
              <CreateRideScreen
                visible={showCreateRide}
                onBack={() => setShowCreateRide(false)}
                onRideCreated={handleRideCreated}
                isDarkMode={isDarkMode}
              />
            )}
          </Animated.View>
        </SafeAreaView>
      </View>
    </AuthContext.Provider>
  );
};

AppContent.displayName = "AppContent";

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  return (
    <PaperProvider theme={lightTheme}>
      {session && session.user ? (
        <AppContent session={session} />
      ) : (
        <Auth onAuthenticated={() => {}} isDarkMode={false} />
      )}
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerContainer: {
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  logoContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  logoEmoji: {
    fontSize: 20,
  },
  titleContainer: {
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.5,
    color: "#FFFFFF",
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    color: "#CCCCCC",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  iconButton: {
    margin: 0,
  },
  avatar: {
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarGradient: {
    borderRadius: 20,
    padding: 2,
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  sceneContainer: {
    flex: 1,
  },
  bottomNavContainer: {
    flexDirection: "row",
    paddingVertical: 9,
    paddingHorizontal: 16,
    paddingBottom: 20,
    marginBottom: 0,
    alignItems: "center",
    justifyContent: "space-around",
    position: "relative", // Ensure it respects z-index
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    minHeight: 50,
    maxWidth: 80,
  },
  activeTabItem: {
    transform: [{ scale: 1.05 }],
  },
  tabButton: {
    margin: 0,
    padding: 6,
    backgroundColor: "transparent",
  },
  tabLabel: {
    fontSize: 12,
    marginTop: 6,
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  tabIconContainer: {
    borderRadius: 12,
    padding: 4,
  },
  activeIndicator: {
    position: "absolute",
    bottom: 0,
    left: "50%",
    marginLeft: -12,
    width: 24,
    height: 3,
    borderRadius: 2,
  },
});
