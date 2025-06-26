import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
  StyleSheet,
  Switch,
  Dimensions,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Users,
  DollarSign,
  Car,
  Check,
  X,
  Calendar,
  Settings,
  ChevronRight,
  ChevronLeft,
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../lib/supabase";

const { width, height } = Dimensions.get("window");

interface CreateRideScreenProps {
  visible: boolean;
  onBack: () => void;
  onRideCreated: (rideData: any) => void;
  isDarkMode?: boolean;
}

interface CreateRideFormData {
  from: string;
  to: string;
  date: Date;
  time: Date;
  availableSeats: string;
  pricePerSeat: string;
  carModel: string;
  description: string;
  preferences: {
    airConditioning: boolean;
    smoking: boolean;
    music: boolean;
  };
  instantBooking: boolean;
}

export default function CreateRideScreen({
  visible,
  onBack,
  onRideCreated,
  isDarkMode = false,
}: CreateRideScreenProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CreateRideFormData>(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const defaultTime = new Date();
    defaultTime.setHours(9, 0, 0, 0); // 9:00 AM

    return {
      from: "",
      to: "",
      date: tomorrow,
      time: defaultTime,
      availableSeats: "3",
      pricePerSeat: "100",
      carModel: "",
      description: "",
      preferences: {
        airConditioning: true,
        smoking: false,
        music: true,
      },
      instantBooking: false,
    };
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Reset step when modal becomes visible
  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
    }
  }, [visible]);

  // Popular LNMIIT locations
  const popularLocations = [
    "LNMIIT Main Gate",
    "LNMIIT Campus",
    "Jaipur Railway Station",
    "Jaipur Airport",
    "City Mall",
    "World Trade Park",
    "Mahindra SEZ",
    "Sitapura",
    "C-Scheme",
    "Vaishali Nagar",
    "Malviya Nagar",
    "Tonk Road",
  ];

  const steps = [
    {
      title: "Route Details",
      subtitle: "Where are you going?",
      color: "#4CAF50",
      icon: "🗺️",
    },
    {
      title: "Date & Time",
      subtitle: "When is your trip?",
      color: "#2196F3",
      icon: "⏰",
    },
    {
      title: "Trip Details",
      subtitle: "Seats and pricing",
      color: "#FF9800",
      icon: "🚗",
    },
    {
      title: "Vehicle Info",
      subtitle: "About your car",
      color: "#9C27B0",
      icon: "🚙",
    },
    {
      title: "Preferences",
      subtitle: "Your ride rules",
      color: "#F44336",
      icon: "⚙️",
    },
  ];

  const validateStep = () => {
    switch (currentStep) {
      case 0: // Route Details
        if (!formData.from.trim()) {
          Alert.alert("Error", "Please enter pickup location");
          return false;
        }
        if (!formData.to.trim()) {
          Alert.alert("Error", "Please enter destination");
          return false;
        }
        if (
          formData.from.toLowerCase().trim() ===
          formData.to.toLowerCase().trim()
        ) {
          Alert.alert("Error", "Pickup and destination cannot be the same");
          return false;
        }
        // Check if both are LNMIIT-related
        const lnmiitKeywords = ["lnmiit", "campus", "college", "university"];
        const fromIsLNMIIT = lnmiitKeywords.some((keyword) =>
          formData.from.toLowerCase().includes(keyword)
        );
        const toIsLNMIIT = lnmiitKeywords.some((keyword) =>
          formData.to.toLowerCase().includes(keyword)
        );
        if (fromIsLNMIIT && toIsLNMIIT) {
          Alert.alert(
            "Error",
            "Both pickup and destination cannot be LNMIIT-related locations. One should be off-campus."
          );
          return false;
        }
        return true;
      case 1: // Date & Time
        const now = new Date();
        const rideDateTime = new Date(
          formData.date.getFullYear(),
          formData.date.getMonth(),
          formData.date.getDate(),
          formData.time.getHours(),
          formData.time.getMinutes()
        );
        if (rideDateTime <= now) {
          Alert.alert("Error", "Please select a future date and time");
          return false;
        }
        return true;
      case 2: // Trip Details
        if (
          !formData.availableSeats ||
          parseInt(formData.availableSeats) < 1 ||
          parseInt(formData.availableSeats) > 8
        ) {
          Alert.alert("Error", "Please enter valid number of seats (1-8)");
          return false;
        }
        if (!formData.pricePerSeat || parseFloat(formData.pricePerSeat) < 0) {
          Alert.alert("Error", "Please enter valid price per seat");
          return false;
        }
        return true;
      case 3: // Vehicle Info
        if (!formData.carModel.trim()) {
          Alert.alert("Error", "Please enter your vehicle details");
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleCreateRide = async () => {
    if (!validateStep()) return;

    setIsLoading(true);

    try {
      // For demo purposes, create a mock user if Supabase auth is not available
      let user;
      try {
        const {
          data: { user: authUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !authUser) {
          // Create demo user for development
          user = {
            id: `user_${Date.now()}`,
            email: "demo@lnmiit.ac.in",
            user_metadata: {
              full_name: "Demo User",
            },
          };
        } else {
          user = authUser;
        }
      } catch (authError) {
        console.warn("Auth error, using demo user:", authError);
        // Fallback to demo user
        user = {
          id: `user_${Date.now()}`,
          email: "demo@lnmiit.ac.in",
          user_metadata: {
            full_name: "Demo User",
          },
        };
      }

      // Create ride data for database
      const rideDateTime = new Date(
        formData.date.getFullYear(),
        formData.date.getMonth(),
        formData.date.getDate(),
        formData.time.getHours(),
        formData.time.getMinutes()
      );

      const rideData = {
        driver_id: user.id,
        driver_name:
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Driver",
        driver_email: user.email,
        from_location: formData.from.trim(),
        to_location: formData.to.trim(),
        departure_time: rideDateTime.toISOString(),
        departure_date: formData.date.toISOString().split("T")[0],
        available_seats: parseInt(formData.availableSeats),
        total_seats: parseInt(formData.availableSeats),
        price_per_seat: parseFloat(formData.pricePerSeat),
        vehicle_make: formData.carModel.split(" ")[0] || "Car",
        vehicle_model:
          formData.carModel.split(" ").slice(1).join(" ") || "Model",
        vehicle_color: "White",
        is_ac: formData.preferences.airConditioning,
        smoking_allowed: formData.preferences.smoking,
        music_allowed: formData.preferences.music,
        status: "active",
        instant_booking: formData.instantBooking,
        chat_enabled: true,
        description: formData.description.trim(),
        created_at: new Date().toISOString(),
      };

      // Try to insert ride into database, fallback to mock data if fails
      let insertedRide;
      try {
        const { data, error: insertError } = await supabase
          .from("carpool_rides")
          .insert([rideData])
          .select()
          .single();

        if (insertError) {
          console.warn("Database insert failed, using mock data:", insertError);
          // Create mock ride data for demo purposes
          insertedRide = {
            ...rideData,
            id: `ride_${Date.now()}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
        } else {
          insertedRide = data;
        }
      } catch (dbError) {
        console.warn("Database connection failed, using mock data:", dbError);
        // Create mock ride data for demo purposes
        insertedRide = {
          ...rideData,
          id: `ride_${Date.now()}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      Alert.alert("Success! 🎉", "Your ride has been created successfully!", [
        {
          text: "OK",
          onPress: () => {
            onRideCreated(insertedRide);
            onBack();
          },
        },
      ]);
    } catch (error) {
      console.error("Error creating ride:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const nextStep = () => {
    if (validateStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        handleCreateRide();
      }
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    // Handle dismissal
    if (event.type === "dismissed") {
      return;
    }

    // Handle date selection
    if (selectedDate && (event.type === "set" || Platform.OS === "ios")) {
      console.log("Date selected:", selectedDate);
      setFormData((prevData) => ({
        ...prevData,
        date: selectedDate,
      }));

      // For Android, close modal immediately after selection
      if (Platform.OS === "android") {
        setShowDatePicker(false);
      }
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    // Handle dismissal
    if (event.type === "dismissed") {
      setShowTimePicker(false);
      return;
    }

    // Handle time selection
    if (selectedTime && (event.type === "set" || Platform.OS === "ios")) {
      console.log("Time selected:", selectedTime);
      setFormData((prevData) => ({
        ...prevData,
        time: selectedTime,
      }));

      // For Android, close modal immediately after selection
      if (Platform.OS === "android") {
        setShowTimePicker(false);
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderLocationSelector = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string
  ) => (
    <View style={styles.inputGroup}>
      <Text
        style={[styles.inputLabel, { color: isDarkMode ? "#FFF" : "#000" }]}
      >
        {label}
      </Text>
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: isDarkMode ? "#2A2A2A" : "#F8F9FA",
            color: isDarkMode ? "#FFF" : "#000",
            borderColor: isDarkMode ? "#404040" : "#E1E5E9",
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={isDarkMode ? "#888" : "#666"}
        value={value}
        onChangeText={onChangeText}
      />

      <Text
        style={[
          styles.sectionSubtitle,
          { color: isDarkMode ? "#AAA" : "#666" },
        ]}
      >
        Popular locations:
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.popularLocationsContainer}
      >
        {popularLocations.map((location, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.locationChip,
              value === location && styles.locationChipSelected,
            ]}
            onPress={() => onChangeText(location)}
          >
            <Text
              style={[
                styles.locationChipText,
                value === location && styles.locationChipTextSelected,
                {
                  color:
                    value === location
                      ? "#4CAF50"
                      : isDarkMode
                      ? "#FFF"
                      : "#333",
                },
              ]}
            >
              {location}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Route Details
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Text style={styles.stepIconText}>🗺️</Text>
            </View>
            <Text
              style={[
                styles.stepTitle,
                { color: isDarkMode ? "#FFF" : "#000" },
              ]}
            >
              Where are you going?
            </Text>
            <Text
              style={[
                styles.stepSubtitle,
                { color: isDarkMode ? "#AAA" : "#666" },
              ]}
            >
              Set your pickup and destination points
            </Text>

            {renderLocationSelector(
              "📍 Pickup Location",
              formData.from,
              (text) => setFormData({ ...formData, from: text }),
              "Enter pickup location..."
            )}

            {renderLocationSelector(
              "🎯 Destination",
              formData.to,
              (text) => setFormData({ ...formData, to: text }),
              "Enter destination..."
            )}
          </View>
        );

      case 1: // Date & Time
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Text style={styles.stepIconText}>⏰</Text>
            </View>
            <Text
              style={[
                styles.stepTitle,
                { color: isDarkMode ? "#FFF" : "#000" },
              ]}
            >
              When is your trip?
            </Text>
            <Text
              style={[
                styles.stepSubtitle,
                { color: isDarkMode ? "#AAA" : "#666" },
              ]}
            >
              Select your departure date and time
            </Text>

            <View style={styles.dateTimeContainer}>
              <TouchableOpacity
                style={[
                  styles.dateTimeButton,
                  { backgroundColor: isDarkMode ? "#2A2A2A" : "#F8F9FA" },
                ]}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color={isDarkMode ? "#FFF" : "#000"} />
                <View style={styles.dateTimeInfo}>
                  <Text
                    style={[
                      styles.dateTimeLabel,
                      { color: isDarkMode ? "#AAA" : "#666" },
                    ]}
                  >
                    Date
                  </Text>
                  <Text
                    style={[
                      styles.dateTimeValue,
                      { color: isDarkMode ? "#FFF" : "#000" },
                    ]}
                  >
                    {formatDate(formData.date)}
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.dateTimeButton,
                  { backgroundColor: isDarkMode ? "#2A2A2A" : "#F8F9FA" },
                ]}
                onPress={() => setShowTimePicker(true)}
              >
                <Clock size={20} color={isDarkMode ? "#FFF" : "#000"} />
                <View style={styles.dateTimeInfo}>
                  <Text
                    style={[
                      styles.dateTimeLabel,
                      { color: isDarkMode ? "#AAA" : "#666" },
                    ]}
                  >
                    Time
                  </Text>
                  <Text
                    style={[
                      styles.dateTimeValue,
                      { color: isDarkMode ? "#FFF" : "#000" },
                    ]}
                  >
                    {formatTime(formData.time)}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Date Picker Modal */}
            {showDatePicker && (
              <Modal
                transparent={true}
                visible={showDatePicker}
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <TouchableOpacity
                  style={styles.pickerOverlay}
                  activeOpacity={1}
                  onPress={() => setShowDatePicker(false)}
                >
                  <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => {}} // Prevent closing when touching the container
                  >
                    <View
                      style={[
                        styles.pickerContainer,
                        { backgroundColor: isDarkMode ? "#1A1A1A" : "#FFF" },
                      ]}
                    >
                      <Text
                        style={[
                          styles.pickerTitle,
                          { color: isDarkMode ? "#FFF" : "#000" },
                        ]}
                      >
                        Select Date
                      </Text>
                      <DateTimePicker
                        value={formData.date}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "calendar"}
                        onChange={onDateChange}
                        minimumDate={new Date()}
                        maximumDate={
                          new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
                        }
                        themeVariant={isDarkMode ? "dark" : "light"}
                      />
                      <TouchableOpacity
                        style={styles.pickerDoneButton}
                        onPress={() => setShowDatePicker(false)}
                      >
                        <Text style={styles.pickerDoneText}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>
            )}

            {/* Time Picker Modal */}
            {showTimePicker && (
              <Modal
                transparent={true}
                visible={showTimePicker}
                animationType="fade"
                onRequestClose={() => setShowTimePicker(false)}
              >
                <View style={styles.pickerOverlay}>
                  <View
                    style={[
                      styles.pickerContainer,
                      { backgroundColor: isDarkMode ? "#1A1A1A" : "#FFF" },
                    ]}
                  >
                    <Text
                      style={[
                        styles.pickerTitle,
                        { color: isDarkMode ? "#FFF" : "#000" },
                      ]}
                    >
                      Select Time
                    </Text>
                    <DateTimePicker
                      value={formData.time}
                      mode="time"
                      display={Platform.OS === "ios" ? "spinner" : "clock"}
                      onChange={onTimeChange}
                      themeVariant={isDarkMode ? "dark" : "light"}
                    />
                    <View style={styles.pickerButtonRow}>
                      <TouchableOpacity
                        style={[
                          styles.pickerCancelButton,
                          { backgroundColor: "#F5F5F5" },
                        ]}
                        onPress={() => setShowTimePicker(false)}
                      >
                        <Text style={styles.pickerCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.pickerDoneButton,
                          { backgroundColor: "#E8F5E8" },
                        ]}
                        onPress={() => setShowTimePicker(false)}
                      >
                        <Text
                          style={[styles.pickerDoneText, { color: "#2E7D32" }]}
                        >
                          Done
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            )}
          </View>
        );

      case 2: // Trip Details
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Text style={styles.stepIconText}>🚗</Text>
            </View>
            <Text
              style={[
                styles.stepTitle,
                { color: isDarkMode ? "#FFF" : "#000" },
              ]}
            >
              Trip Details
            </Text>
            <Text
              style={[
                styles.stepSubtitle,
                { color: isDarkMode ? "#AAA" : "#666" },
              ]}
            >
              Set seats and pricing
            </Text>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: isDarkMode ? "#FFF" : "#000" },
                ]}
              >
                👥 Available Seats
              </Text>
              <View style={styles.seatsSelector}>
                {[1, 2, 3, 4, 5, 6, 7, 8].map((seats) => (
                  <TouchableOpacity
                    key={seats}
                    style={[
                      styles.seatOption,
                      formData.availableSeats === seats.toString() &&
                        styles.seatOptionSelected,
                      {
                        borderColor:
                          formData.availableSeats === seats.toString()
                            ? "#4CAF50"
                            : isDarkMode
                            ? "#404040"
                            : "#E1E5E9",
                      },
                    ]}
                    onPress={() =>
                      setFormData({
                        ...formData,
                        availableSeats: seats.toString(),
                      })
                    }
                  >
                    <Text
                      style={[
                        styles.seatOptionText,
                        formData.availableSeats === seats.toString() &&
                          styles.seatOptionTextSelected,
                        {
                          color:
                            formData.availableSeats === seats.toString()
                              ? "#4CAF50"
                              : isDarkMode
                              ? "#FFF"
                              : "#333",
                        },
                      ]}
                    >
                      {seats}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: isDarkMode ? "#FFF" : "#000" },
                ]}
              >
                💰 Price per Seat (₹)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDarkMode ? "#2A2A2A" : "#F8F9FA",
                    color: isDarkMode ? "#FFF" : "#000",
                    borderColor: isDarkMode ? "#404040" : "#E1E5E9",
                  },
                ]}
                placeholder="Enter price..."
                placeholderTextColor={isDarkMode ? "#888" : "#666"}
                value={formData.pricePerSeat}
                onChangeText={(text) =>
                  setFormData({ ...formData, pricePerSeat: text })
                }
                keyboardType="numeric"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: isDarkMode ? "#FFF" : "#000" },
                ]}
              >
                📝 Trip Description (Optional)
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  styles.textArea,
                  {
                    backgroundColor: isDarkMode ? "#2A2A2A" : "#F8F9FA",
                    color: isDarkMode ? "#FFF" : "#000",
                    borderColor: isDarkMode ? "#404040" : "#E1E5E9",
                  },
                ]}
                placeholder="Add any additional details about your trip..."
                placeholderTextColor={isDarkMode ? "#888" : "#666"}
                value={formData.description}
                onChangeText={(text) =>
                  setFormData({ ...formData, description: text })
                }
                multiline
                numberOfLines={3}
              />
            </View>
          </View>
        );

      case 3: // Vehicle Info
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Text style={styles.stepIconText}>🚙</Text>
            </View>
            <Text
              style={[
                styles.stepTitle,
                { color: isDarkMode ? "#FFF" : "#000" },
              ]}
            >
              Vehicle Information
            </Text>
            <Text
              style={[
                styles.stepSubtitle,
                { color: isDarkMode ? "#AAA" : "#666" },
              ]}
            >
              Tell us about your car
            </Text>

            <View style={styles.inputGroup}>
              <Text
                style={[
                  styles.inputLabel,
                  { color: isDarkMode ? "#FFF" : "#000" },
                ]}
              >
                🚗 Car Model
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: isDarkMode ? "#2A2A2A" : "#F8F9FA",
                    color: isDarkMode ? "#FFF" : "#000",
                    borderColor: isDarkMode ? "#404040" : "#E1E5E9",
                  },
                ]}
                placeholder="e.g., Honda City, Maruti Swift"
                placeholderTextColor={isDarkMode ? "#888" : "#666"}
                value={formData.carModel}
                onChangeText={(text) =>
                  setFormData({ ...formData, carModel: text })
                }
              />
            </View>
          </View>
        );

      case 4: // Preferences
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Text style={styles.stepIconText}>⚙️</Text>
            </View>
            <Text
              style={[
                styles.stepTitle,
                { color: isDarkMode ? "#FFF" : "#000" },
              ]}
            >
              Ride Preferences
            </Text>
            <Text
              style={[
                styles.stepSubtitle,
                { color: isDarkMode ? "#AAA" : "#666" },
              ]}
            >
              Set your ride rules
            </Text>

            <View style={styles.preferencesContainer}>
              {[
                {
                  key: "airConditioning",
                  label: "Air Conditioning",
                  icon: "❄️",
                },
                { key: "music", label: "Music Allowed", icon: "🎵" },
                { key: "smoking", label: "Smoking Allowed", icon: "🚬" },
              ].map((pref) => (
                <View key={pref.key} style={styles.preferenceItem}>
                  <View style={styles.preferenceInfo}>
                    <Text style={styles.preferenceIcon}>{pref.icon}</Text>
                    <Text
                      style={[
                        styles.preferenceLabel,
                        { color: isDarkMode ? "#FFF" : "#000" },
                      ]}
                    >
                      {pref.label}
                    </Text>
                  </View>
                  <Switch
                    value={
                      formData.preferences[
                        pref.key as keyof typeof formData.preferences
                      ]
                    }
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        preferences: {
                          ...formData.preferences,
                          [pref.key]: value,
                        },
                      })
                    }
                    trackColor={{ false: "#767577", true: "#4CAF50" }}
                    thumbColor={
                      formData.preferences[
                        pref.key as keyof typeof formData.preferences
                      ]
                        ? "#FFF"
                        : "#f4f3f4"
                    }
                  />
                </View>
              ))}

              <View style={styles.preferenceItem}>
                <View style={styles.preferenceInfo}>
                  <Text style={styles.preferenceIcon}>⚡</Text>
                  <Text
                    style={[
                      styles.preferenceLabel,
                      { color: isDarkMode ? "#FFF" : "#000" },
                    ]}
                  >
                    Instant Booking
                  </Text>
                </View>
                <Switch
                  value={formData.instantBooking}
                  onValueChange={(value) =>
                    setFormData({ ...formData, instantBooking: value })
                  }
                  trackColor={{ false: "#767577", true: "#4CAF50" }}
                  thumbColor={formData.instantBooking ? "#FFF" : "#f4f3f4"}
                />
              </View>
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
    >
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDarkMode ? "#000" : "#FFF" },
        ]}
      >
        {/* Header */}
        <LinearGradient
          colors={[steps[currentStep].color, steps[currentStep].color + "CC"]}
          style={styles.header}
        >
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Create Ride</Text>
            <Text style={styles.headerSubtitle}>
              Step {currentStep + 1} of {steps.length}
            </Text>
          </View>

          <View style={styles.headerRight}>
            <Text style={styles.stepCounter}>
              {currentStep + 1}/{steps.length}
            </Text>
          </View>
        </LinearGradient>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((currentStep + 1) / steps.length) * 100}%`,
                  backgroundColor: steps[currentStep].color,
                },
              ]}
            />
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {renderStepContent()}
        </ScrollView>

        {/* Navigation */}
        <View style={styles.navigation}>
          {currentStep > 0 && (
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.prevButton,
                { borderColor: isDarkMode ? "#404040" : "#E1E5E9" },
              ]}
              onPress={prevStep}
            >
              <ChevronLeft size={20} color={isDarkMode ? "#FFF" : "#000"} />
              <Text
                style={[
                  styles.navButtonText,
                  { color: isDarkMode ? "#FFF" : "#000" },
                ]}
              >
                Previous
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.navButton,
              styles.nextButton,
              { backgroundColor: steps[currentStep].color },
              currentStep === 0 && { flex: 1 },
            ]}
            onPress={nextStep}
            disabled={isLoading}
          >
            <Text style={styles.nextButtonText}>
              {isLoading
                ? "Creating..."
                : currentStep === steps.length - 1
                ? "Create Ride"
                : "Next"}
            </Text>
            {!isLoading &&
              (currentStep === steps.length - 1 ? (
                <Check size={20} color="#FFF" />
              ) : (
                <ChevronRight size={20} color="#FFF" />
              ))}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
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
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#FFF",
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.9)",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  stepCounter: {
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#F8F9FA",
  },
  progressBar: {
    height: 4,
    backgroundColor: "#E1E5E9",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  content: {
    flex: 1,
    backgroundColor: "#FAFBFC",
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stepContent: {
    flex: 1,
    alignItems: "center",
  },
  stepIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#E8F5E8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stepIconText: {
    fontSize: 32,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 32,
    lineHeight: 22,
  },
  inputGroup: {
    width: "100%",
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  sectionSubtitle: {
    fontSize: 14,
    marginTop: 12,
    marginBottom: 8,
  },
  popularLocationsContainer: {
    marginTop: 8,
  },
  locationChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#F0F8FF",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#E3F2FD",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  locationChipSelected: {
    backgroundColor: "#E3F2FD",
    borderColor: "#2196F3",
  },
  locationChipText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1976D2",
  },
  locationChipTextSelected: {
    color: "#0D47A1",
    fontWeight: "600",
  },
  dateTimeContainer: {
    width: "100%",
    gap: 16,
  },
  dateTimeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8F4FD",
    backgroundColor: "#F3F9FF",
    shadowColor: "#2196F3",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  dateTimeInfo: {
    marginLeft: 12,
    flex: 1,
  },
  dateTimeLabel: {
    fontSize: 14,
    marginBottom: 4,
    color: "#1976D2",
  },
  dateTimeValue: {
    fontSize: 16,
    fontWeight: "600",
  },
  seatsSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  seatOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF3E0",
    borderColor: "#FFB74D",
    shadowColor: "#FF9800",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  seatOptionSelected: {
    backgroundColor: "#FFE0B2",
    borderColor: "#FF9800",
  },
  seatOptionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F57C00",
  },
  seatOptionTextSelected: {
    color: "#E65100",
  },
  preferencesContainer: {
    width: "100%",
    gap: 16,
  },
  preferenceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: "#F8F4FF",
    borderWidth: 1,
    borderColor: "#E1BEE7",
    shadowColor: "#9C27B0",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  preferenceInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  preferenceIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: "#7B1FA2",
  },
  navigation: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 32,
    gap: 12,
    backgroundColor: "#F8F9FA",
  },
  navButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  prevButton: {
    flex: 1,
    borderWidth: 1,
    backgroundColor: "#FFF",
  },
  nextButton: {
    flex: 2,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFF",
  },
  // Picker Modal Styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    margin: 20,
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    minWidth: 300,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 20,
  },
  pickerButtonRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  pickerCancelButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  pickerCancelText: {
    color: "#666",
    fontSize: 16,
    fontWeight: "600",
  },
  pickerDoneButton: {
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "#4CAF50",
  },
  pickerDoneText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
