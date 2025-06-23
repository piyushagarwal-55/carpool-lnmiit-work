import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Alert,
  Platform,
  Modal,
  StyleSheet,
  Switch,
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
} from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { supabase } from "../lib/supabase";

interface CreateRideScreenProps {
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
    pets: boolean;
  };
  instantBooking: boolean;
}

export default function CreateRideScreen({
  onBack,
  onRideCreated,
  isDarkMode = false,
}: CreateRideScreenProps) {
  const [formData, setFormData] = useState<CreateRideFormData>({
    from: "",
    to: "",
    date: new Date(),
    time: new Date(),
    availableSeats: "3",
    pricePerSeat: "100",
    carModel: "",
    description: "",
    preferences: {
      airConditioning: true,
      smoking: false,
      music: true,
      pets: false,
    },
    instantBooking: false,
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleCreateRide = async () => {
    // Validation
    if (
      !formData.from ||
      !formData.to ||
      !formData.pricePerSeat ||
      !formData.carModel
    ) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    setIsLoading(true);

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert("Error", "You must be logged in to create a ride");
        return;
      }

      // Create ride data for database
      const rideData = {
        driver_id: user.id,
        driver_name:
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Driver",
        driver_email: user.email,
        from_location: formData.from,
        to_location: formData.to,
        departure_time: new Date(
          formData.date.getFullYear(),
          formData.date.getMonth(),
          formData.date.getDate(),
          formData.time.getHours(),
          formData.time.getMinutes()
        ).toISOString(),
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
        pets_allowed: formData.preferences.pets,
        status: "active",
        instant_booking: formData.instantBooking,
        chat_enabled: true,
        description: formData.description,
        created_at: new Date().toISOString(),
      };

      // Insert ride into database
      const { data: insertedRide, error: insertError } = await supabase
        .from("carpool_rides")
        .insert([rideData])
        .select()
        .single();

      if (insertError) {
        console.error("Database insert error:", insertError);
        throw insertError;
      }

      // Transform database response to frontend format
      const transformedRide = {
        id: insertedRide.id,
        driverId: insertedRide.driver_id,
        driverName: insertedRide.driver_name,
        driverRating: 4.8, // Default rating
        driverPhoto: `https://api.dicebear.com/7.x/avataaars/svg?seed=${insertedRide.driver_name}`,
        driverBranch: "Computer Science", // Default - should come from user profile
        driverYear: "3rd Year", // Default - should come from user profile
        from: insertedRide.from_location,
        to: insertedRide.to_location,
        departureTime: new Date(insertedRide.departure_time).toLocaleTimeString(
          "en-US",
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        ),
        date: insertedRide.departure_date,
        availableSeats: insertedRide.available_seats,
        totalSeats: insertedRide.total_seats,
        pricePerSeat: insertedRide.price_per_seat,
        vehicleInfo: {
          make: insertedRide.vehicle_make,
          model: insertedRide.vehicle_model,
          color: insertedRide.vehicle_color,
          isAC: insertedRide.is_ac,
        },
        route: [insertedRide.from_location, insertedRide.to_location],
        preferences: {
          gender: "any" as const,
          smokingAllowed: insertedRide.smoking_allowed,
          musicAllowed: insertedRide.music_allowed,
          petsAllowed: insertedRide.pets_allowed,
        },
        status: insertedRide.status as "active",
        passengers: [],
        pendingRequests: [],
        instantBooking: insertedRide.instant_booking,
        chatEnabled: insertedRide.chat_enabled,
        createdAt: insertedRide.created_at,
      };

      onRideCreated(transformedRide);
      Alert.alert("Success", "Your ride has been created successfully!");
      onBack();
    } catch (error) {
      console.error("Error creating ride:", error);
      Alert.alert("Error", "Failed to create ride. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData((prev) => ({ ...prev, date: selectedDate }));
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(Platform.OS === "ios" ? false : false);
    if (event.type === "dismissed") {
      setShowTimePicker(false);
      return;
    }
    if (selectedTime) {
      // Ensure the time has proper values
      const newTime = new Date(selectedTime);
      setFormData((prev) => ({ ...prev, time: newTime }));
      if (Platform.OS === "android") {
        setShowTimePicker(false);
      }
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (time: Date) => {
    return time.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const updateFormData = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updatePreference = (pref: string, value: boolean) => {
    setFormData((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [pref]: value },
    }));
  };

  const renderInput = (
    placeholder: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: React.ReactNode,
    keyboardType: any = "default",
    multiline = false
  ) => (
    <View
      style={[
        styles.inputContainer,
        { backgroundColor: isDarkMode ? "#1A1A1A" : "#F8F9FA" },
      ]}
    >
      <View style={styles.inputIcon}>{icon}</View>
      <TextInput
        style={[
          styles.textInput,
          {
            color: isDarkMode ? "#FFFFFF" : "#000000",
            textAlignVertical: multiline ? "top" : "center",
            height: multiline ? 80 : 50,
          },
        ]}
        placeholder={placeholder}
        placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
        value={value}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  );

  const renderLocationButton = (
    location: string,
    isSelected: boolean,
    onPress: () => void
  ) => (
    <TouchableOpacity
      key={location}
      style={[
        styles.locationChip,
        {
          backgroundColor: isSelected
            ? isDarkMode
              ? "#FFFFFF"
              : "#000000"
            : isDarkMode
            ? "#2A2A2A"
            : "#F0F0F0",
          borderColor: isSelected
            ? isDarkMode
              ? "#FFFFFF"
              : "#000000"
            : "transparent",
        },
      ]}
      onPress={onPress}
    >
      <Text
        style={[
          styles.locationChipText,
          {
            color: isSelected
              ? isDarkMode
                ? "#000000"
                : "#FFFFFF"
              : isDarkMode
              ? "#FFFFFF"
              : "#000000",
          },
        ]}
      >
        {location}
      </Text>
    </TouchableOpacity>
  );

  return (
    <Modal visible={true} animationType="slide" presentationStyle="fullScreen">
      <View
        style={[
          styles.container,
          { backgroundColor: isDarkMode ? "#000000" : "#FFFFFF" },
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          {/* Header */}
          <LinearGradient
            colors={
              isDarkMode ? ["#000000", "#1A1A1A"] : ["#FFFFFF", "#F8F9FA"]
            }
            style={styles.header}
          >
            <TouchableOpacity
              onPress={onBack}
              style={[
                styles.backButton,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
                },
              ]}
            >
              <ArrowLeft size={20} color={isDarkMode ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>

            <Text
              style={[
                styles.headerTitle,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
            >
              Create New Ride
            </Text>

            <View style={styles.headerSpacer} />
          </LinearGradient>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Route Section */}
            <View
              style={[
                styles.section,
                styles.routeSection,
                { borderLeftColor: isDarkMode ? "#4CAF50" : "#2E7D32" },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? "#4CAF50" : "#2E7D32" },
                ]}
              >
                📍 Route Details
              </Text>

              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDarkMode ? "#CCCCCC" : "#666666" },
                ]}
              >
                From *
              </Text>
              {renderInput(
                "Enter pickup location",
                formData.from,
                (text) => updateFormData("from", text),
                <MapPin size={20} color={isDarkMode ? "#666666" : "#999999"} />
              )}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.locationChipsContainer}
              >
                {popularLocations.map((location) =>
                  renderLocationButton(
                    location,
                    formData.from === location,
                    () => updateFormData("from", location)
                  )
                )}
              </ScrollView>

              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDarkMode ? "#CCCCCC" : "#666666" },
                ]}
              >
                To *
              </Text>
              {renderInput(
                "Enter destination",
                formData.to,
                (text) => updateFormData("to", text),
                <MapPin size={20} color={isDarkMode ? "#666666" : "#999999"} />
              )}

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.locationChipsContainer}
              >
                {popularLocations.map((location) =>
                  renderLocationButton(location, formData.to === location, () =>
                    updateFormData("to", location)
                  )
                )}
              </ScrollView>
            </View>

            {/* Date & Time Section */}
            <View
              style={[
                styles.section,
                styles.scheduleSection,
                { borderLeftColor: isDarkMode ? "#FF9800" : "#F57C00" },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? "#FF9800" : "#F57C00" },
                ]}
              >
                🕒 Schedule
              </Text>

              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDarkMode ? "#CCCCCC" : "#666666" },
                ]}
              >
                Select Date & Time *
              </Text>

              <View style={styles.dateTimeContainer}>
                <TouchableOpacity
                  style={[
                    styles.dateTimeButton,
                    {
                      backgroundColor: isDarkMode ? "#2A2A2A" : "#F8F9FA",
                      borderColor: isDarkMode ? "#FF9800" : "#F57C00",
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar
                    size={20}
                    color={isDarkMode ? "#FF9800" : "#F57C00"}
                  />
                  <Text
                    style={[
                      styles.dateTimeText,
                      { color: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                  >
                    {formatDate(formData.date)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.dateTimeButton,
                    {
                      backgroundColor: isDarkMode ? "#2A2A2A" : "#F8F9FA",
                      borderColor: isDarkMode ? "#FF9800" : "#F57C00",
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => setShowTimePicker(true)}
                >
                  <Clock size={20} color={isDarkMode ? "#FF9800" : "#F57C00"} />
                  <Text
                    style={[
                      styles.dateTimeText,
                      { color: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                  >
                    {formatTime(formData.time)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Ride Details Section */}
            <View
              style={[
                styles.section,
                styles.rideSection,
                { borderLeftColor: isDarkMode ? "#2196F3" : "#1976D2" },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? "#2196F3" : "#1976D2" },
                ]}
              >
                🚗 Ride Details
              </Text>

              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDarkMode ? "#CCCCCC" : "#666666" },
                ]}
              >
                Available Seats *
              </Text>
              <View style={styles.seatsContainer}>
                {["1", "2", "3", "4"].map((seat) => (
                  <TouchableOpacity
                    key={seat}
                    style={[
                      styles.seatButton,
                      {
                        backgroundColor:
                          formData.availableSeats === seat
                            ? isDarkMode
                              ? "#FFFFFF"
                              : "#000000"
                            : isDarkMode
                            ? "#1A1A1A"
                            : "#F8F9FA",
                      },
                    ]}
                    onPress={() => updateFormData("availableSeats", seat)}
                  >
                    <Users
                      size={16}
                      color={
                        formData.availableSeats === seat
                          ? isDarkMode
                            ? "#000000"
                            : "#FFFFFF"
                          : isDarkMode
                          ? "#666666"
                          : "#999999"
                      }
                    />
                    <Text
                      style={[
                        styles.seatButtonText,
                        {
                          color:
                            formData.availableSeats === seat
                              ? isDarkMode
                                ? "#000000"
                                : "#FFFFFF"
                              : isDarkMode
                              ? "#666666"
                              : "#999999",
                        },
                      ]}
                    >
                      {seat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDarkMode ? "#CCCCCC" : "#666666" },
                ]}
              >
                Price per Seat (₹) *
              </Text>
              {renderInput(
                "Enter amount (e.g., 120)",
                formData.pricePerSeat,
                (text) => updateFormData("pricePerSeat", text),
                <DollarSign
                  size={20}
                  color={isDarkMode ? "#666666" : "#999999"}
                />,
                "numeric"
              )}
            </View>

            {/* Vehicle Section */}
            <View
              style={[
                styles.section,
                styles.vehicleSection,
                { borderLeftColor: isDarkMode ? "#9C27B0" : "#7B1FA2" },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? "#9C27B0" : "#7B1FA2" },
                ]}
              >
                🚙 Vehicle Information
              </Text>

              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDarkMode ? "#CCCCCC" : "#666666" },
                ]}
              >
                Car Model *
              </Text>
              {renderInput(
                "e.g., Hyundai i20",
                formData.carModel,
                (text) => updateFormData("carModel", text),
                <Car size={20} color={isDarkMode ? "#666666" : "#999999"} />
              )}
            </View>

            {/* Preferences Section */}
            <View
              style={[
                styles.section,
                styles.preferencesSection,
                { borderLeftColor: isDarkMode ? "#E91E63" : "#C2185B" },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? "#E91E63" : "#C2185B" },
                ]}
              >
                ⚙️ Preferences
              </Text>

              {[
                {
                  key: "airConditioning",
                  label: "Air Conditioning",
                  icon: "❄️",
                },
                { key: "music", label: "Music Allowed", icon: "🎵" },
                { key: "smoking", label: "Smoking Allowed", icon: "🚭" },
                { key: "pets", label: "Pets Allowed", icon: "🐕" },
              ].map((pref) => (
                <View key={pref.key} style={styles.preferenceRow}>
                  <View style={styles.preferenceLeft}>
                    <Text style={styles.preferenceIcon}>{pref.icon}</Text>
                    <Text
                      style={[
                        styles.preferenceLabel,
                        { color: isDarkMode ? "#FFFFFF" : "#000000" },
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
                    onValueChange={(value) => updatePreference(pref.key, value)}
                    trackColor={{
                      false: "#767577",
                      true: isDarkMode ? "#FFFFFF" : "#000000",
                    }}
                    thumbColor={isDarkMode ? "#000000" : "#FFFFFF"}
                  />
                </View>
              ))}
            </View>

            {/* Description Section */}
            <View
              style={[
                styles.section,
                styles.notesSection,
                { borderLeftColor: isDarkMode ? "#607D8B" : "#455A64" },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? "#607D8B" : "#455A64" },
                ]}
              >
                📝 Additional Notes
              </Text>

              <Text
                style={[
                  styles.fieldLabel,
                  { color: isDarkMode ? "#CCCCCC" : "#666666" },
                ]}
              >
                Description (Optional)
              </Text>
              {renderInput(
                "Any additional details for passengers...",
                formData.description,
                (text) => updateFormData("description", text),
                <Settings
                  size={20}
                  color={isDarkMode ? "#666666" : "#999999"}
                />,
                "default",
                true
              )}
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>

          {/* Create Button */}
          <View
            style={[
              styles.createButtonContainer,
              { backgroundColor: isDarkMode ? "#000000" : "#FFFFFF" },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.createButton,
                {
                  backgroundColor: isDarkMode ? "#FFFFFF" : "#000000",
                  opacity: isLoading ? 0.7 : 1,
                },
              ]}
              onPress={handleCreateRide}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text
                  style={[
                    styles.createButtonText,
                    { color: isDarkMode ? "#000000" : "#FFFFFF" },
                  ]}
                >
                  Creating Ride...
                </Text>
              ) : (
                <>
                  <Check size={20} color={isDarkMode ? "#000000" : "#FFFFFF"} />
                  <Text
                    style={[
                      styles.createButtonText,
                      { color: isDarkMode ? "#000000" : "#FFFFFF" },
                    ]}
                  >
                    Create Ride
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Enhanced Date/Time Pickers */}
          {showDatePicker && (
            <DateTimePicker
              value={formData.date}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onDateChange}
              minimumDate={new Date()}
              maximumDate={
                new Date(new Date().setMonth(new Date().getMonth() + 6))
              }
              textColor={isDarkMode ? "#FFFFFF" : "#000000"}
              themeVariant={isDarkMode ? "dark" : "light"}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={formData.time}
              mode="time"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={onTimeChange}
              textColor={isDarkMode ? "#FFFFFF" : "#000000"}
              themeVariant={isDarkMode ? "dark" : "light"}
            />
          )}
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 16,
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
  },
  routeSection: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    marginLeft: 4,
  },
  scheduleSection: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    marginLeft: 4,
  },
  rideSection: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    marginLeft: 4,
  },
  vehicleSection: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    marginLeft: 4,
  },
  preferencesSection: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    marginLeft: 4,
  },
  notesSection: {
    borderLeftWidth: 4,
    paddingLeft: 16,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
  },
  locationChipsContainer: {
    marginBottom: 16,
  },
  locationChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  locationChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  dateTimeContainer: {
    flexDirection: "row",
    gap: 12,
  },
  dateTimeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
  },
  dateTimeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  seatsContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  seatButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  seatButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  preferenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  preferenceLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  preferenceIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  preferenceLabel: {
    fontSize: 16,
    fontWeight: "500",
  },
  bottomPadding: {
    height: 100,
  },
  createButtonContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: "700",
  },
});
