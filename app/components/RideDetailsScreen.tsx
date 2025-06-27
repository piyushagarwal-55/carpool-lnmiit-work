import React, { useState, useEffect, useRef } from "react";
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Modal,
  SafeAreaView,
  Image,
  Share,
  PanResponder,
  Linking,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { socketService, RideRequest } from "../services/SocketService";
import { supabase } from "../lib/supabase";
import { CarpoolRide, JoinRequest, CarpoolPassenger } from "../models/ride";
import NotificationService from "../services/NotificationService";
import PushNotificationService from "../services/PushNotificationService";
import {
  parseEmailInfo,
  calculateAcademicYear,
  formatTime,
  formatDate,
  calculateRideExpiry,
  generateAvatarFromName,
} from "../lib/utils";
import SecureChatSystem from "./SecureChatSystem";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

// Avatar generation utility
const generateAvatarFomName = (name: string, size: number = 40): string => {
  const initials = name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .substring(0, 2);

  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FECA57",
    "#FF9FF3",
    "#54A0FF",
    "#5F27CD",
    "#00D2D3",
    "#FF9F43",
    "#FFA502",
    "#2ED573",
    "#1E90FF",
    "#3742FA",
    "#FF6348",
  ];

  const colorIndex = name.length % colors.length;
  const backgroundColor = colors[colorIndex];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    initials
  )}&size=${size}&background=${backgroundColor.slice(
    1
  )}&color=fff&bold=true&format=svg`;
};

interface RideDetailsProps {
  rideId: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
    branch: string;
    year: string;
    rating: number;
    photo: string;
  };
  visible: boolean;
  onBack: () => void;
  onJoinRide: (rideId: string) => void;
  onStartChat: (rideId: string, rideTitle: string) => void;
}

export default function RideDetailsScreen({
  rideId,
  currentUser,
  visible,
  onBack,
  onJoinRide,
  onStartChat,
}: RideDetailsProps) {
  const [ride, setRide] = useState<CarpoolRide | null>(null);
  const [loading, setLoading] = useState(true);
  const [passengers, setPassengers] = useState<CarpoolPassenger[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const [isFavorited, setIsFavorited] = useState(false);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [joinRequestSent, setJoinRequestSent] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const sidebarAnimation = useSharedValue(-400);
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const isDriverCurrentUser = ride?.rideCreatorId === currentUser.id;
  const hasJoined = passengers.some((p) => p.id === currentUser.id);
  const canJoin =
    !isDriverCurrentUser && !hasJoined && ride && ride.availableSeats > 0;

  // Fetch ride details from database
  useEffect(() => {
    if (visible && rideId) {
      fetchRideDetails();
    }
  }, [visible, rideId]);

  const fetchRideDetails = async () => {
    try {
      setLoading(true);

      // Fetch ride details
      const { data: rideData, error: rideError } = await supabase
        .from("carpool_rides")
        .select("*")
        .eq("id", rideId)
        .single();

      // Fetch creator profile separately
      let creatorProfile = null;
      if (!rideError && rideData) {
        const { data: profileData } = await supabase
          .from("user_profiles")
          .select("id, full_name, avatar_url, branch, year, rating, phone")
          .eq("id", rideData.ride_creator_id)
          .single();
        creatorProfile = profileData;
      }

      if (rideError) {
        console.error("Error fetching ride:", rideError);
        Alert.alert("Error", "Failed to load ride details");
        return;
      }

      // Parse driver email for branch and year info
      const emailInfo = parseEmailInfo(rideData.ride_creator_email || "");
      const academicYear = calculateAcademicYear(emailInfo.joiningYear);

      // Transform database data to CarpoolRide interface
      const transformedRide: CarpoolRide = {
        id: rideData.id,
        rideCreatorId: rideData.ride_creator_id,
        rideCreatorName:
          creatorProfile?.full_name || rideData.ride_creator_name,
        rideCreatorPhone:
          creatorProfile?.phone || rideData.ride_creator_phone || "",
        rideCreatorRating: creatorProfile?.rating || 0,
        rideCreatorPhoto:
          rideData.ride_creator_id === currentUser.id
            ? currentUser.photo
            : creatorProfile?.avatar_url ||
              generateAvatarFomName(rideData.ride_creator_name),
        rideCreatorBranch: creatorProfile?.branch || emailInfo.branchFull,
        rideCreatorYear: creatorProfile?.year || academicYear,
        from: rideData.from_location,
        to: rideData.to_location,
        departureTime: formatTime(rideData.departure_time),
        date: formatDate(rideData.departure_date),
        availableSeats: rideData.available_seats,
        totalSeats: rideData.total_seats,
        pricePerSeat: rideData.price_per_seat,
        vehicleInfo: {
          make: rideData.vehicle_make || "Unknown",
          model: rideData.vehicle_model || "Unknown",
          color: rideData.vehicle_color || "Unknown",
          licensePlate: rideData.license_plate || "N/A",
          isAC: rideData.is_ac || false,
        },
        route: [rideData.from_location, rideData.to_location],
        preferences: {
          smokingAllowed: rideData.smoking_allowed || false,
          musicAllowed: rideData.music_allowed || true,
          petsAllowed: rideData.pets_allowed || false,
        },
        status: rideData.status as
          | "active"
          | "full"
          | "completed"
          | "cancelled",
        instantBooking: rideData.instant_booking || true,
        chatEnabled: rideData.chat_enabled || true,
        estimatedDuration: rideData.estimated_duration || "30 mins",
        createdAt: rideData.created_at,
        students: [], // Add required students property
        passengers: [],
        pendingRequests: [],
      };

      setRide(transformedRide);

      // Fetch passengers
      const { data: passengersData, error: passengersError } = await supabase
        .from("ride_passengers")
        .select("*")
        .eq("ride_id", rideId);

      // Fetch passenger profiles separately
      let passengerProfiles: any[] = [];
      if (!passengersError && passengersData && passengersData.length > 0) {
        const passengerIds = passengersData.map((p) => p.passenger_id);
        const { data: profilesData } = await supabase
          .from("user_profiles")
          .select("id, full_name, avatar_url, branch, year")
          .in("id", passengerIds);
        passengerProfiles = profilesData || [];
      }

      if (!passengersError && passengersData) {
        const transformedPassengers: CarpoolPassenger[] = passengersData.map(
          (p) => {
            const profile = passengerProfiles.find(
              (prof) => prof.id === p.passenger_id
            );
            return {
              id: p.passenger_id,
              name: profile?.full_name || p.passenger_name,
              photo:
                profile?.avatar_url || generateAvatarFomName(p.passenger_name),
              seatsBooked: p.seats_booked,
              status: p.status as "pending" | "accepted" | "confirmed",
              joinedAt: p.joined_at,
              paymentStatus: "pending" as const,
              branch: profile?.branch,
              year: profile?.year,
            };
          }
        );
        setPassengers(transformedPassengers);
      }

      // Fetch join requests (for drivers)
      if (transformedRide.rideCreatorId === currentUser.id) {
        const { data: requestsData, error: requestsError } = await supabase
          .from("join_requests")
          .select("*")
          .eq("ride_id", rideId)
          .eq("status", "pending");

        // Fetch requester profiles separately
        let requesterProfiles: any[] = [];
        if (!requestsError && requestsData && requestsData.length > 0) {
          const requesterIds = requestsData.map((r) => r.passenger_id);
          const { data: profilesData } = await supabase
            .from("user_profiles")
            .select("id, full_name, avatar_url, branch, year")
            .in("id", requesterIds);
          requesterProfiles = profilesData || [];
        }

        if (!requestsError && requestsData) {
          const transformedRequests: JoinRequest[] = requestsData.map((r) => {
            const profile = requesterProfiles.find(
              (prof) => prof.id === r.passenger_id
            );
            return {
              id: r.id,
              passengerId: r.passenger_id,
              passengerName: profile?.full_name || r.passenger_name,
              passengerPhoto:
                profile?.avatar_url || generateAvatarFomName(r.passenger_name),
              seatsRequested: r.seats_requested,
              message: r.message || "",
              status: r.status as "pending" | "accepted" | "rejected",
              requestedAt: r.created_at,
              passengerBranch: profile?.branch,
              passengerYear: profile?.year,
            };
          });
          setJoinRequests(transformedRequests);
        }
      }

      // Check if current user has already sent a request
      const { data: userRequestData } = await supabase
        .from("join_requests")
        .select("*")
        .eq("ride_id", rideId)
        .eq("passenger_id", currentUser.id)
        .single();

      if (userRequestData) {
        setJoinRequestSent(true);
      }
    } catch (error) {
      console.error("Error in fetchRideDetails:", error);
      Alert.alert("Error", "Failed to load ride details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      // Animate slide up
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate slide down
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  useEffect(() => {
    if (isDriverCurrentUser) {
      // Listen for ride requests if current user is the driver
      socketService.onRideRequest((request: RideRequest) => {
        if (request.rideId === ride?.id) {
          setRideRequests((prev) => [...prev, request]);
        }
      });

      return () => {
        socketService.offRideRequest();
      };
    }
  }, [isDriverCurrentUser, ride?.id]);

  const handleJoinRide = async () => {
    if (canJoin && ride) {
      try {
        // Check if user has already joined this ride
        const { data: existingPassenger } = await supabase
          .from("ride_passengers")
          .select("id")
          .eq("ride_id", ride.id)
          .eq("passenger_id", currentUser.id)
          .single();

        if (existingPassenger) {
          Alert.alert("Info", "You have already joined this ride!");
          return;
        }

        // Check if user has already sent a request for this ride
        const { data: existingRequest } = await supabase
          .from("join_requests")
          .select("id, status")
          .eq("ride_id", ride.id)
          .eq("passenger_id", currentUser.id)
          .single();

        if (existingRequest) {
          if (existingRequest.status === "pending") {
            Alert.alert(
              "Info",
              "You have already sent a request for this ride!"
            );
          } else if (existingRequest.status === "accepted") {
            Alert.alert(
              "Info",
              "Your request for this ride has already been accepted!"
            );
          } else if (existingRequest.status === "rejected") {
            Alert.alert(
              "Info",
              "Your request for this ride was previously rejected. Please try a different ride."
            );
          }
          return;
        }

        // Create join request in database
        const { data: joinRequestData, error } = await supabase
          .from("join_requests")
          .insert({
            ride_id: ride.id,
            passenger_id: currentUser.id,
            passenger_name: currentUser.name,
            passenger_email: currentUser.email,
            seats_requested: 1,
            message: `Hi! I'd like to join your ride from ${ride.from} to ${ride.to}.`,
            status: "pending",
            created_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) {
          console.error("Error creating join request:", error);
          Alert.alert("Error", "Failed to send join request");
          return;
        }

        if (ride.instantBooking) {
          // For instant booking, add directly to passengers
          const { error: passengerError } = await supabase
            .from("ride_passengers")
            .insert({
              ride_id: ride.id,
              passenger_id: currentUser.id,
              passenger_name: currentUser.name,
              passenger_email: currentUser.email,
              seats_booked: 1,
              status: "confirmed",
              joined_at: new Date().toISOString(),
            });

          if (!passengerError) {
            // Update available seats
            await supabase
              .from("carpool_rides")
              .update({
                available_seats: ride.availableSeats - 1,
                updated_at: new Date().toISOString(),
              })
              .eq("id", ride.id);

            // Update join request to accepted for instant booking
            await supabase
              .from("join_requests")
              .update({
                status: "accepted",
                updated_at: new Date().toISOString(),
              })
              .eq("id", joinRequestData.id);

            Alert.alert("Success", "You have successfully joined the ride!");
            fetchRideDetails(); // Refresh data
          }
        } else {
          // For request-based booking, send notification to driver
          await NotificationService.notifyJoinRequest(
            ride.rideCreatorId,
            currentUser.name,
            ride.id,
            joinRequestData.id,
            ride.from,
            ride.to
          );

          // Send push notification immediately
          await PushNotificationService.sendRideRequestNotification(
            ride.rideCreatorId,
            currentUser.name,
            ride.from,
            ride.to,
            joinRequestData.id
          );

          // Send ride request via Socket.IO for real-time updates
          const rideRequest = {
            userId: currentUser.id,
            userName: currentUser.name,
            userPhoto: currentUser.photo,
            rideId: ride.id,
            requestId: joinRequestData.id,
          };

          socketService.sendRideRequest(rideRequest);
          setJoinRequestSent(true);
          Alert.alert(
            "Success",
            "Join request sent to driver! They will be notified."
          );
        }

        // Also call the original join ride function
        onJoinRide(ride.id);
      } catch (error) {
        console.error("Error in handleJoinRide:", error);
        Alert.alert("Error", "Failed to join ride");
      }
    }
  };

  const handleAcceptRequest = async (requestId: string) => {
    try {
      const request = joinRequests.find((r) => r.id === requestId);
      if (!request || !ride) return;

      // Get the full request details from database including email
      const { data: requestData, error: requestError } = await supabase
        .from("join_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (requestError || !requestData) {
        Alert.alert("Error", "Could not fetch request details");
        return;
      }

      // Update request status to accepted
      const { error: updateError } = await supabase
        .from("join_requests")
        .update({
          status: "accepted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (updateError) {
        console.error("Error accepting request:", updateError);
        Alert.alert("Error", "Failed to accept request");
        return;
      }

      // Check if passenger already exists for this ride
      const { data: existingPassenger } = await supabase
        .from("ride_passengers")
        .select("id")
        .eq("ride_id", ride.id)
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
          ride_id: ride.id,
          passenger_id: request.passengerId,
          passenger_name: request.passengerName,
          passenger_email: requestData.passenger_email,
          seats_booked: request.seatsRequested,
          status: "confirmed",
          joined_at: new Date().toISOString(),
        });

      if (passengerError) {
        console.error("Error adding passenger:", passengerError);
        Alert.alert("Error", "Failed to add passenger");
        return;
      }

      // Update available seats
      await supabase
        .from("carpool_rides")
        .update({
          available_seats: ride.availableSeats - request.seatsRequested,
          updated_at: new Date().toISOString(),
        })
        .eq("id", ride.id);

      // Send notification to passenger
      await NotificationService.notifyRequestAccepted(
        request.passengerId,
        currentUser.name,
        ride.id,
        ride.from,
        ride.to
      );

      socketService.acceptRideRequest(requestId);
      Alert.alert(
        "Success",
        "Request accepted! The passenger has been notified."
      );
      fetchRideDetails(); // Refresh data
    } catch (error) {
      console.error("Error in handleAcceptRequest:", error);
      Alert.alert("Error", "Failed to accept request");
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    try {
      const request = joinRequests.find((r) => r.id === requestId);
      if (!request || !ride) return;

      // Update request status to rejected
      const { error } = await supabase
        .from("join_requests")
        .update({
          status: "rejected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId);

      if (error) {
        console.error("Error rejecting request:", error);
        Alert.alert("Error", "Failed to reject request");
        return;
      }

      // Send notification to passenger
      await NotificationService.notifyRequestRejected(
        request.passengerId,
        currentUser.name,
        ride.id,
        ride.from,
        ride.to
      );

      socketService.rejectRideRequest(requestId);
      Alert.alert(
        "Success",
        "Request declined. The passenger has been notified."
      );
      fetchRideDetails(); // Refresh data
    } catch (error) {
      console.error("Error in handleRejectRequest:", error);
      Alert.alert("Error", "Failed to reject request");
    }
  };

  const handleStartChat = () => {
    if (!ride) {
      console.log("No ride data available for chat");
      return;
    }
    console.log("Opening chat for ride:", ride.id);
    setShowChat(true);
  };

  const handleCallDriver = async () => {
    const phoneNumber = "+919876543210"; // Demo phone number
    try {
      const supported = await Linking.canOpenURL(`tel:${phoneNumber}`);
      if (supported) {
        await Linking.openURL(`tel:${phoneNumber}`);
      } else {
        Alert.alert(
          "Call Driver",
          `Phone: ${phoneNumber}\n\nYour device doesn't support direct calling. Please dial manually.`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      Alert.alert("Error", "Unable to make call. Please try again.");
      console.log("Error calling:", error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this carpool ride from ${ride?.from} to ${ride?.to} on ${ride?.date} at ${ride?.departureTime}. Ride Creator: ${ride?.rideCreatorName} (${ride?.rideCreatorRating}⭐). Price: ₹${ride?.pricePerSeat} per seat.`,
      });
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (evt, gestureState) => {
      return gestureState.dy > 0 && gestureState.vy > 0;
    },
    onPanResponderMove: (evt, gestureState) => {
      if (gestureState.dy > 0) {
        slideAnim.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (evt, gestureState) => {
      if (gestureState.dy > 100 || gestureState.vy > 0.5) {
        onBack();
      } else {
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      }
    },
  });

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onBack}
    >
      <View style={{ flex: 1 }}>
        {/* Overlay */}
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            opacity: overlayOpacity,
          }}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={onBack}
          />
        </Animated.View>

        {/* Bottom Sheet */}
        <Animated.View
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: SCREEN_HEIGHT * 0.85,
            backgroundColor: "#F5F7FA",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            transform: [{ translateY: slideAnim }],
          }}
          {...panResponder.panHandlers}
        >
          {/* Handle */}
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: "#DDD",
              borderRadius: 2,
              alignSelf: "center",
              marginTop: 8,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 20,
              backgroundColor: "#F8F9FA",
              borderBottomWidth: 1,
              borderBottomColor: "#E8F4FD",
            }}
          >
            <Text style={{ fontSize: 22, fontWeight: "700", color: "#1565C0" }}>
              Ride Details
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={handleShare}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#E3F2FD",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <Ionicons name="share-outline" size={22} color="#1565C0" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onBack}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: "#FFEBEE",
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 3,
                  elevation: 2,
                }}
              >
                <Ionicons name="close" size={22} color="#D32F2F" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {loading ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingVertical: 100,
                }}
              >
                <ActivityIndicator size="large" color="#4CAF50" />
                <Text style={{ marginTop: 16, fontSize: 16, color: "#666" }}>
                  Loading ride details...
                </Text>
              </View>
            ) : !ride ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: "center",
                  alignItems: "center",
                  paddingVertical: 100,
                }}
              >
                <Text style={{ fontSize: 18, color: "#666", marginBottom: 16 }}>
                  Ride not found
                </Text>
                <TouchableOpacity
                  onPress={onBack}
                  style={{
                    backgroundColor: "#4CAF50",
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 8,
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "600" }}>
                    Go Back
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Driver Info */}
                <View style={{ padding: 20 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#E3F2FD",
                      padding: 20,
                      borderRadius: 20,
                      marginBottom: 20,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Image
                      source={{ uri: ride?.rideCreatorPhoto }}
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 35,
                        marginRight: 16,
                        borderWidth: 3,
                        borderColor: "#1565C0",
                      }}
                    />
                    <View style={{ flex: 1 }}>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text
                          style={{
                            fontSize: 20,
                            fontWeight: "700",
                            color: "#1565C0",
                          }}
                        >
                          {ride?.rideCreatorName}
                        </Text>
                      </View>
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          marginTop: 6,
                        }}
                      >
                        <Ionicons name="school" size={18} color="#1565C0" />
                        <Text
                          style={{
                            fontSize: 16,
                            color: "#1565C0",
                            marginLeft: 6,
                            fontWeight: "600",
                          }}
                        >
                          {ride?.rideCreatorBranch &&
                          !ride.rideCreatorBranch.includes("Unknown")
                            ? ride.rideCreatorBranch
                            : "LNM Student"}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: "row", gap: 10 }}>
                      <TouchableOpacity
                        onPress={handleCallDriver}
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 23,
                          backgroundColor: "#4CAF50",
                          alignItems: "center",
                          justifyContent: "center",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.15,
                          shadowRadius: 3,
                          elevation: 3,
                        }}
                      >
                        <Ionicons name="call" size={22} color="#FFF" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={handleStartChat}
                        style={{
                          width: 46,
                          height: 46,
                          borderRadius: 23,
                          backgroundColor: "#2196F3",
                          alignItems: "center",
                          justifyContent: "center",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.15,
                          shadowRadius: 3,
                          elevation: 3,
                        }}
                      >
                        <Ionicons name="chatbubble" size={20} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Route Info */}
                  <View
                    style={{
                      backgroundColor: "#E8F5E8",
                      padding: 20,
                      borderRadius: 20,
                      marginBottom: 20,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "#2E7D32",
                        marginBottom: 16,
                      }}
                    >
                      🚗 Route Details
                    </Text>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 16,
                        backgroundColor: "#FFF",
                        padding: 12,
                        borderRadius: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: "#4CAF50",
                          marginRight: 12,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "#FFF",
                          }}
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: 17,
                          color: "#2E7D32",
                          fontWeight: "600",
                          flex: 1,
                        }}
                      >
                        {ride?.from}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#4CAF50",
                          fontWeight: "600",
                          backgroundColor: "#E8F5E8",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                        }}
                      >
                        FROM
                      </Text>
                    </View>

                    <View
                      style={{
                        alignItems: "center",
                        marginVertical: 8,
                      }}
                    >
                      <View
                        style={{
                          width: 3,
                          height: 24,
                          backgroundColor: "#81C784",
                          borderRadius: 2,
                        }}
                      />
                      <Ionicons name="arrow-down" size={20} color="#4CAF50" />
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#FFF",
                        padding: 12,
                        borderRadius: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 16,
                          height: 16,
                          borderRadius: 8,
                          backgroundColor: "#FF5722",
                          marginRight: 12,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <View
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: "#FFF",
                          }}
                        />
                      </View>
                      <Text
                        style={{
                          fontSize: 17,
                          color: "#2E7D32",
                          fontWeight: "600",
                          flex: 1,
                        }}
                      >
                        {ride?.to}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#FF5722",
                          fontWeight: "600",
                          backgroundColor: "#FFEBEE",
                          paddingHorizontal: 8,
                          paddingVertical: 4,
                          borderRadius: 8,
                        }}
                      >
                        TO
                      </Text>
                    </View>

                    <View
                      style={{
                        flexDirection: "row",
                        justifyContent: "space-between",
                        marginTop: 16,
                        paddingTop: 16,
                        borderTopWidth: 1,
                        borderTopColor: "#E0E0E0",
                      }}
                    >
                      <View style={{ alignItems: "center" }}>
                        <Ionicons name="calendar" size={20} color="#666" />
                        <Text
                          style={{ fontSize: 14, color: "#666", marginTop: 4 }}
                        >
                          {ride?.date}
                        </Text>
                      </View>
                      <View style={{ alignItems: "center" }}>
                        <Ionicons name="time" size={20} color="#666" />
                        <Text
                          style={{ fontSize: 14, color: "#666", marginTop: 4 }}
                        >
                          {ride?.departureTime}
                        </Text>
                      </View>
                      <View style={{ alignItems: "center" }}>
                        <Ionicons name="people" size={20} color="#666" />
                        <Text
                          style={{ fontSize: 14, color: "#666", marginTop: 4 }}
                        >
                          {ride?.availableSeats}/{ride?.totalSeats} seats
                        </Text>
                      </View>
                      <View style={{ alignItems: "center" }}>
                        <Ionicons name="cash" size={20} color="#666" />
                        <Text
                          style={{ fontSize: 14, color: "#666", marginTop: 4 }}
                        >
                          ₹{ride?.pricePerSeat}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Vehicle Info */}
                  <View
                    style={{
                      backgroundColor: "#FFF3E0",
                      padding: 20,
                      borderRadius: 20,
                      marginBottom: 20,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "#E65100",
                        marginBottom: 16,
                      }}
                    >
                      🚗 Vehicle Information
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#FFF",
                        padding: 16,
                        borderRadius: 16,
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 24,
                          backgroundColor: "#FF9800",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 16,
                        }}
                      >
                        <Ionicons name="car" size={24} color="#FFF" />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text
                          style={{
                            fontSize: 17,
                            color: "#E65100",
                            fontWeight: "600",
                            marginBottom: 4,
                          }}
                        >
                          {ride?.vehicleInfo.make} {ride?.vehicleInfo.model}
                        </Text>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <View
                              style={{
                                width: 12,
                                height: 12,
                                borderRadius: 6,
                                backgroundColor: "#FF9800",
                                marginRight: 6,
                              }}
                            />
                            <Text
                              style={{
                                fontSize: 14,
                                color: "#E65100",
                                fontWeight: "500",
                              }}
                            >
                              {ride?.vehicleInfo.color}
                            </Text>
                          </View>
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                            }}
                          >
                            <Ionicons
                              name={
                                ride?.vehicleInfo.isAC ? "snow" : "thermometer"
                              }
                              size={14}
                              color="#E65100"
                              style={{ marginRight: 4 }}
                            />
                            <Text
                              style={{
                                fontSize: 14,
                                color: "#E65100",
                                fontWeight: "500",
                              }}
                            >
                              {ride?.vehicleInfo.isAC
                                ? "AC Available"
                                : "Non-AC"}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Preferences */}
                  <View
                    style={{
                      backgroundColor: "#F3E5F5",
                      padding: 20,
                      borderRadius: 20,
                      marginBottom: 20,
                      shadowColor: "#000",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.1,
                      shadowRadius: 4,
                      elevation: 3,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "#7B1FA2",
                        marginBottom: 16,
                      }}
                    >
                      ⚙️ Ride Preferences
                    </Text>
                    <View style={{ gap: 12 }}>
                      {[
                        {
                          key: "music",
                          label: "Music",
                          icon: "musical-notes",
                          allowed: ride?.preferences.musicAllowed,
                        },
                        {
                          key: "smoking",
                          label: "Smoking",
                          icon: "ban",
                          allowed: ride?.preferences.smokingAllowed,
                        },
                        {
                          key: "pets",
                          label: "Pets",
                          icon: "paw",
                          allowed: ride?.preferences.petsAllowed,
                        },
                      ].map((pref) => (
                        <View
                          key={pref.key}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#FFFFFF",
                            paddingHorizontal: 20,
                            paddingVertical: 16,
                            borderRadius: 16,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 3,
                            elevation: 3,
                            borderWidth: 2,
                            borderColor: pref.allowed ? "#E8F5E8" : "#FFEBEE",
                          }}
                        >
                          <View
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 22,
                              backgroundColor: pref.allowed
                                ? "#4CAF50"
                                : "#F44336",
                              alignItems: "center",
                              justifyContent: "center",
                              marginRight: 16,
                              shadowColor: pref.allowed ? "#4CAF50" : "#F44336",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.25,
                              shadowRadius: 4,
                              elevation: 4,
                            }}
                          >
                            <Ionicons
                              name={pref.icon as any}
                              size={22}
                              color="#FFFFFF"
                            />
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 16,
                                color: "#7B1FA2",
                                fontWeight: "700",
                                marginBottom: 4,
                              }}
                            >
                              {pref.label}
                            </Text>
                            <View
                              style={{
                                flexDirection: "row",
                                alignItems: "center",
                              }}
                            >
                              <View
                                style={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: 4,
                                  backgroundColor: pref.allowed
                                    ? "#4CAF50"
                                    : "#F44336",
                                  marginRight: 8,
                                }}
                              />
                              <Text
                                style={{
                                  fontSize: 14,
                                  color: pref.allowed ? "#4CAF50" : "#F44336",
                                  fontWeight: "600",
                                }}
                              >
                                {pref.allowed ? "Allowed" : "Not Allowed"}
                              </Text>
                            </View>
                          </View>
                          <View
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 12,
                              backgroundColor: pref.allowed
                                ? "#4CAF50"
                                : "#F44336",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 14,
                                color: "#FFFFFF",
                                fontWeight: "700",
                              }}
                            >
                              {pref.allowed ? "✓" : "✗"}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>

                  {/* Current Passengers */}
                  {passengers.length > 0 && (
                    <View
                      style={{
                        backgroundColor: "#E8F5E8",
                        padding: 20,
                        borderRadius: 20,
                        marginBottom: 20,
                        shadowColor: "#000",
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 3,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 18,
                          fontWeight: "700",
                          color: "#2E7D32",
                          marginBottom: 16,
                        }}
                      >
                        👥 Current Passengers ({passengers.length})
                      </Text>
                      {passengers.map((passenger) => (
                        <View
                          key={passenger.id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#FFF",
                            padding: 12,
                            borderRadius: 16,
                            marginBottom: 8,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                            elevation: 2,
                          }}
                        >
                          <Image
                            source={{ uri: passenger.photo }}
                            style={{
                              width: 48,
                              height: 48,
                              borderRadius: 24,
                              marginRight: 12,
                              borderWidth: 2,
                              borderColor: "#4CAF50",
                            }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 16,
                                color: "#2E7D32",
                                fontWeight: "600",
                                marginBottom: 2,
                              }}
                            >
                              {passenger.name}
                            </Text>
                            {(passenger.branch || passenger.year) && (
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: "#666",
                                  fontWeight: "500",
                                  marginBottom: 2,
                                }}
                              >
                                {passenger.branch}{" "}
                                {passenger.year && `• ${passenger.year}`}
                              </Text>
                            )}
                            <Text
                              style={{
                                fontSize: 12,
                                color: "#4CAF50",
                                fontWeight: "500",
                              }}
                            >
                              ✓ Joined{" "}
                              {new Date(
                                passenger.joinedAt
                              ).toLocaleDateString()}{" "}
                              • {passenger.seatsBooked} seat
                              {passenger.seatsBooked > 1 ? "s" : ""}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Join Requests (Driver Only) */}
                  {isDriverCurrentUser && joinRequests.length > 0 && (
                    <View
                      style={{
                        backgroundColor: "#FFF3E0",
                        padding: 16,
                        borderRadius: 16,
                        marginBottom: 20,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 16,
                          fontWeight: "600",
                          color: "#000",
                          marginBottom: 12,
                        }}
                      >
                        Join Requests ({joinRequests.length})
                      </Text>
                      {joinRequests.map((request) => (
                        <View
                          key={request.id}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingVertical: 8,
                            borderBottomWidth: 1,
                            borderBottomColor: "#E0E0E0",
                          }}
                        >
                          <Image
                            source={{ uri: request.passengerPhoto }}
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: 20,
                              marginRight: 12,
                            }}
                          />
                          <View style={{ flex: 1 }}>
                            <Text
                              style={{
                                fontSize: 16,
                                color: "#000",
                                fontWeight: "500",
                              }}
                            >
                              {request.passengerName}
                            </Text>
                            {(request.passengerBranch ||
                              request.passengerYear) && (
                              <Text
                                style={{
                                  fontSize: 11,
                                  color: "#666",
                                  marginBottom: 2,
                                }}
                              >
                                {request.passengerBranch}{" "}
                                {request.passengerYear &&
                                  `• ${request.passengerYear}`}
                              </Text>
                            )}
                            <Text style={{ fontSize: 12, color: "#666" }}>
                              {request.message && request.message.length > 0
                                ? request.message
                                : "No message"}{" "}
                              • {request.seatsRequested} seat
                              {request.seatsRequested > 1 ? "s" : ""}
                            </Text>
                            <Text style={{ fontSize: 10, color: "#999" }}>
                              {new Date(
                                request.requestedAt
                              ).toLocaleTimeString()}
                            </Text>
                          </View>
                          <View style={{ flexDirection: "row", gap: 8 }}>
                            <TouchableOpacity
                              onPress={() => handleAcceptRequest(request.id)}
                              style={{
                                backgroundColor: "#4CAF50",
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: 20,
                              }}
                            >
                              <Text
                                style={{ color: "#FFF", fontWeight: "600" }}
                              >
                                Accept
                              </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              onPress={() => handleRejectRequest(request.id)}
                              style={{
                                backgroundColor: "#F44336",
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                borderRadius: 20,
                              }}
                            >
                              <Text
                                style={{ color: "#FFF", fontWeight: "600" }}
                              >
                                Reject
                              </Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </>
            )}
          </ScrollView>

          {/* Bottom Action Bar */}
          <View
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              backgroundColor: "#FFF",
              paddingHorizontal: 20,
              paddingVertical: 16,
              paddingBottom: 34,
              borderTopWidth: 1,
              borderTopColor: "#E0E0E0",
            }}
          >
            {canJoin && (
              <TouchableOpacity
                onPress={handleJoinRide}
                disabled={joinRequestSent}
                style={{
                  backgroundColor: joinRequestSent ? "#CCC" : "#000",
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#FFF",
                  }}
                >
                  {joinRequestSent
                    ? "Request Sent"
                    : `Join Ride - ₹${ride?.pricePerSeat}`}
                </Text>
              </TouchableOpacity>
            )}

            {hasJoined && (
              <TouchableOpacity
                onPress={handleStartChat}
                style={{
                  backgroundColor: "#4CAF50",
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#FFF",
                  }}
                >
                  Chat with Group
                </Text>
              </TouchableOpacity>
            )}

            {isDriverCurrentUser && (
              <TouchableOpacity
                onPress={handleStartChat}
                style={{
                  backgroundColor: "#2196F3",
                  borderRadius: 12,
                  paddingVertical: 16,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#FFF",
                  }}
                >
                  Manage Ride
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>

      {/* Floating Chat Window */}
      {showChat && ride && (
        <Modal
          visible={showChat}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setShowChat(false)}
        >
          <SecureChatSystem
            rideId={rideId}
            currentUser={currentUser}
            rideDetails={{
              from: ride.from,
              to: ride.to,
              driverName: ride.rideCreatorName,
              departureTime: ride.departureTime,
            }}
            onBack={() => {
              // Chat back button pressed
              setShowChat(false);
            }}
            isDarkMode={false}
          />
        </Modal>
      )}
    </Modal>
  );
}
