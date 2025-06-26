import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { User, MapPin, Clock, Star, Check, X } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import NotificationService from "../services/NotificationService";

interface JoinRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerEmail: string;
  rideId: string;
  from: string;
  to: string;
  departureTime: string;
  requestMessage?: string;
  passengerRating?: number;
  createdAt: string;
}

interface RequestAcceptanceModalProps {
  visible: boolean;
  onClose: () => void;
  request: JoinRequest | null;
  onRequestHandled: (
    requestId: string,
    action: "accepted" | "rejected"
  ) => void;
  isDarkMode?: boolean;
}

export default function RequestAcceptanceModal({
  visible,
  onClose,
  request,
  onRequestHandled,
  isDarkMode = false,
}: RequestAcceptanceModalProps) {
  const [isLoading, setIsLoading] = useState(false);

  const generateAvatarFromName = (name: string) => {
    const colors = [
      "FF6B6B",
      "4ECDC4",
      "45B7D1",
      "96CEB4",
      "FECA57",
      "FF9FF3",
      "DDA0DD",
      "98D8C8",
    ];
    const colorIndex = name.length % colors.length;
    const initials = name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 2)
      .toUpperCase();

    return `https://ui-avatars.com/api/?name=${initials}&background=${colors[colorIndex]}&color=fff&size=100&bold=true`;
  };

  const handleAcceptRequest = async () => {
    if (!request) return;

    setIsLoading(true);
    try {
      // Get current user (driver)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert("Error", "Authentication required");
        return;
      }

      // Get driver details
      const { data: driverData, error: driverError } = await supabase
        .from("carpool_rides")
        .select("ride_creator_name, available_seats")
        .eq("id", request.rideId)
        .single();

      if (driverError || !driverData) {
        Alert.alert("Error", "Could not fetch ride details");
        return;
      }

      // Check if there are available seats
      if (driverData.available_seats <= 0) {
        Alert.alert("Error", "No seats available for this ride");
        return;
      }

      // Update join request status to accepted
      const { error: updateError } = await supabase
        .from("join_requests")
        .update({
          status: "accepted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (updateError) {
        console.error("Error updating request:", updateError);
        Alert.alert("Error", "Failed to accept request");
        return;
      }

      // Check if passenger already exists for this ride
      const { data: existingPassenger } = await supabase
        .from("ride_passengers")
        .select("id")
        .eq("ride_id", request.rideId)
        .eq("passenger_id", request.passengerId)
        .single();

      if (existingPassenger) {
        Alert.alert("Info", "This passenger has already joined the ride!");
        return;
      }

      // Add passenger to ride
      const { error: passengerError } = await supabase
        .from("ride_passengers")
        .insert({
          ride_id: request.rideId,
          passenger_id: request.passengerId,
          passenger_name: request.passengerName,
          passenger_email: request.passengerEmail,
          seats_booked: 1, // Default to 1 seat
          status: "confirmed",
          joined_at: new Date().toISOString(),
        });

      if (passengerError) {
        console.error("Error adding passenger:", passengerError);
        Alert.alert("Error", "Failed to add passenger to ride");
        return;
      }

      // Update available seats count
      const { error: seatsError } = await supabase
        .from("carpool_rides")
        .update({
          available_seats: driverData.available_seats - 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.rideId);

      if (seatsError) {
        console.error("Error updating seats:", seatsError);
        // Don't show error to user as passenger is already added
      }

      // Send notification to passenger
      await NotificationService.notifyRequestAccepted(
        request.passengerId,
        driverData.ride_creator_name,
        request.rideId,
        request.from,
        request.to
      );

      // Mark related notifications as read
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("type", "join_request")
        .contains("data", { requestId: request.id });

      Alert.alert(
        "Success",
        "Request accepted! The passenger has been notified."
      );
      onRequestHandled(request.id, "accepted");
      onClose();
    } catch (error) {
      console.error("Error accepting request:", error);
      Alert.alert("Error", "Failed to accept request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!request) return;

    setIsLoading(true);
    try {
      // Get current user (driver)
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        Alert.alert("Error", "Authentication required");
        return;
      }

      // Get driver details
      const { data: driverData, error: driverError } = await supabase
        .from("carpool_rides")
        .select("ride_creator_name")
        .eq("id", request.rideId)
        .single();

      if (driverError || !driverData) {
        Alert.alert("Error", "Could not fetch ride details");
        return;
      }

      // Update join request status to rejected
      const { error: updateError } = await supabase
        .from("join_requests")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (updateError) {
        console.error("Error updating request:", updateError);
        Alert.alert("Error", "Failed to reject request");
        return;
      }

      // Send notification to passenger
      await NotificationService.notifyRequestRejected(
        request.passengerId,
        driverData.ride_creator_name,
        request.rideId,
        request.from,
        request.to
      );

      // Mark related notifications as read
      await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("type", "join_request")
        .contains("data", { requestId: request.id });

      Alert.alert("Request Declined", "The passenger has been notified.");
      onRequestHandled(request.id, "rejected");
      onClose();
    } catch (error) {
      console.error("Error rejecting request:", error);
      Alert.alert("Error", "Failed to reject request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!visible || !request) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          { backgroundColor: isDarkMode ? "#000000" : "#FFFFFF" },
        ]}
      >
        <SafeAreaView style={styles.safeArea}>
          <LinearGradient
            colors={
              isDarkMode ? ["#000000", "#1A1A1A"] : ["#FFFFFF", "#F8F9FA"]
            }
            style={styles.header}
          >
            <TouchableOpacity
              onPress={onClose}
              style={[
                styles.closeButton,
                {
                  backgroundColor: isDarkMode
                    ? "rgba(255,255,255,0.1)"
                    : "rgba(0,0,0,0.1)",
                },
              ]}
            >
              <X size={20} color={isDarkMode ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>

            <Text
              style={[
                styles.headerTitle,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
            >
              Ride Request
            </Text>

            <View style={styles.headerSpacer} />
          </LinearGradient>

          <View style={styles.content}>
            {/* Passenger Info */}
            <View
              style={[
                styles.section,
                { backgroundColor: isDarkMode ? "#1A1A1A" : "#F8F9FA" },
              ]}
            >
              <View style={styles.passengerHeader}>
                <Image
                  source={{
                    uri: generateAvatarFromName(request.passengerName),
                  }}
                  style={styles.avatar}
                />
                <View style={styles.passengerInfo}>
                  <Text
                    style={[
                      styles.passengerName,
                      { color: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                  >
                    {request.passengerName}
                  </Text>
                  <Text
                    style={[
                      styles.passengerEmail,
                      { color: isDarkMode ? "#CCCCCC" : "#666666" },
                    ]}
                  >
                    {request.passengerEmail}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <Star size={16} color="#FFD700" fill="#FFD700" />
                    <Text
                      style={[
                        styles.rating,
                        { color: isDarkMode ? "#CCCCCC" : "#666666" },
                      ]}
                    >
                      {request.passengerRating || "4.5"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Trip Details */}
            <View
              style={[
                styles.section,
                { backgroundColor: isDarkMode ? "#1A1A1A" : "#F8F9FA" },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? "#4CAF50" : "#2E7D32" },
                ]}
              >
                📍 Trip Details
              </Text>

              <View style={styles.tripDetail}>
                <MapPin size={16} color={isDarkMode ? "#4CAF50" : "#2E7D32"} />
                <Text
                  style={[
                    styles.tripText,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" },
                  ]}
                >
                  From: {request.from}
                </Text>
              </View>

              <View style={styles.tripDetail}>
                <MapPin size={16} color={isDarkMode ? "#F44336" : "#D32F2F"} />
                <Text
                  style={[
                    styles.tripText,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" },
                  ]}
                >
                  To: {request.to}
                </Text>
              </View>

              <View style={styles.tripDetail}>
                <Clock size={16} color={isDarkMode ? "#FF9800" : "#F57C00"} />
                <Text
                  style={[
                    styles.tripText,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" },
                  ]}
                >
                  Departure: {new Date(request.departureTime).toLocaleString()}
                </Text>
              </View>
            </View>

            {/* Request Message */}
            {request.requestMessage && (
              <View
                style={[
                  styles.section,
                  { backgroundColor: isDarkMode ? "#1A1A1A" : "#F8F9FA" },
                ]}
              >
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDarkMode ? "#2196F3" : "#1976D2" },
                  ]}
                >
                  💬 Message
                </Text>
                <Text
                  style={[
                    styles.messageText,
                    { color: isDarkMode ? "#CCCCCC" : "#666666" },
                  ]}
                >
                  {request.requestMessage}
                </Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.rejectButton,
                  { opacity: isLoading ? 0.6 : 1 },
                ]}
                onPress={handleRejectRequest}
                disabled={isLoading}
              >
                <X size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Decline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  styles.acceptButton,
                  { opacity: isLoading ? 0.6 : 1 },
                ]}
                onPress={handleAcceptRequest}
                disabled={isLoading}
              >
                <Check size={20} color="#FFFFFF" />
                <Text style={styles.buttonText}>Accept</Text>
              </TouchableOpacity>
            </View>
          </View>
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
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginLeft: 16,
    flex: 1,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  passengerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  passengerEmail: {
    fontSize: 14,
    marginBottom: 4,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rating: {
    fontSize: 14,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  tripDetail: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tripText: {
    fontSize: 14,
    marginLeft: 8,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: "auto",
    paddingTop: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  acceptButton: {
    backgroundColor: "#4CAF50",
  },
  rejectButton: {
    backgroundColor: "#F44336",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
