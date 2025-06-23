import React, { useState, useEffect, useRef } from "react";
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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { socketService, RideRequest } from "../services/SocketService";

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get("window");

interface RideDetailsProps {
  ride: {
    id: string;
    driverId: string;
    driverName: string;
    driverRating: number;
    driverPhoto: string;
    driverBranch: string;
    driverYear: string;
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
      petsAllowed: boolean;
    };
    status: "active" | "full" | "completed" | "cancelled";
    passengers: Array<{
      id: string;
      name: string;
      photo: string;
      joinedAt: string;
    }>;
    createdAt: string;
  };
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
  ride,
  currentUser,
  visible,
  onBack,
  onJoinRide,
  onStartChat,
}: RideDetailsProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [joinRequestSent, setJoinRequestSent] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const isDriverCurrentUser = ride.driverId === currentUser.id;
  const hasJoined = ride.passengers.some((p: any) => p.id === currentUser.id);
  const canJoin = !isDriverCurrentUser && !hasJoined && ride.availableSeats > 0;

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
        if (request.rideId === ride.id) {
          setRideRequests((prev) => [...prev, request]);
        }
      });

      return () => {
        socketService.offRideRequest();
      };
    }
  }, [isDriverCurrentUser, ride.id]);

  const handleJoinRide = () => {
    if (canJoin) {
      // Send ride request via Socket.IO
      const rideRequest = {
        userId: currentUser.id,
        userName: currentUser.name,
        userPhoto: currentUser.photo,
        rideId: ride.id,
      };

      socketService.sendRideRequest(rideRequest);
      setJoinRequestSent(true);

      // Also call the original join ride function
      onJoinRide(ride.id);
    }
  };

  const handleAcceptRequest = (requestId: string) => {
    socketService.acceptRideRequest(requestId);
    setRideRequests((prev) => prev.filter((req) => req.id !== requestId));
  };

  const handleRejectRequest = (requestId: string) => {
    socketService.rejectRideRequest(requestId);
    setRideRequests((prev) => prev.filter((req) => req.id !== requestId));
  };

  const handleStartChat = () => {
    const rideTitle = `${ride.from} → ${ride.to}`;
    onStartChat(ride.id, rideTitle);
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
        message: `Check out this carpool ride from ${ride.from} to ${ride.to} on ${ride.date} at ${ride.departureTime}. Driver: ${ride.driverName} (${ride.driverRating}⭐). Price: ₹${ride.pricePerSeat} per seat.`,
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
            backgroundColor: "#FFF",
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
              paddingVertical: 16,
              borderBottomWidth: 1,
              borderBottomColor: "#E0E0E0",
            }}
          >
            <Text style={{ fontSize: 20, fontWeight: "600", color: "#000" }}>
              Ride Details
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                onPress={() => setIsFavorited(!isFavorited)}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#F5F5F5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons
                  name={isFavorited ? "heart" : "heart-outline"}
                  size={20}
                  color={isFavorited ? "#FF0000" : "#666"}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleShare}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#F5F5F5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="share-outline" size={20} color="#666" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={onBack}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: "#F5F5F5",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="close" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 120 }}
          >
            {/* Driver Info */}
            <View style={{ padding: 20 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  backgroundColor: "#F8F9FA",
                  padding: 16,
                  borderRadius: 16,
                  marginBottom: 20,
                }}
              >
                <Image
                  source={{ uri: ride.driverPhoto }}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 30,
                    marginRight: 16,
                  }}
                />
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Text
                      style={{ fontSize: 18, fontWeight: "600", color: "#000" }}
                    >
                      {ride.driverName}
                    </Text>
                    <View
                      style={{
                        backgroundColor: "#4CAF50",
                        borderRadius: 8,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        marginLeft: 8,
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 10,
                          color: "#FFF",
                          fontWeight: "600",
                        }}
                      >
                        VERIFIED
                      </Text>
                    </View>
                  </View>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
                    <Ionicons name="star" size={16} color="#FFD700" />
                    <Text
                      style={{ fontSize: 14, color: "#666", marginLeft: 4 }}
                    >
                      {ride.driverRating} • {ride.driverBranch} •{" "}
                      {ride.driverYear}
                    </Text>
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <TouchableOpacity
                    onPress={handleCallDriver}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#000",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="call" size={18} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleStartChat}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 20,
                      backgroundColor: "#000",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="chatbubble" size={18} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Route Info */}
              <View
                style={{
                  backgroundColor: "#F8F9FA",
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
                  Route Details
                </Text>

                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12,
                  }}
                >
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: "#4CAF50",
                      marginRight: 12,
                    }}
                  />
                  <Text
                    style={{ fontSize: 16, color: "#000", fontWeight: "500" }}
                  >
                    {ride.from}
                  </Text>
                </View>

                <View
                  style={{
                    width: 2,
                    height: 30,
                    backgroundColor: "#DDD",
                    marginLeft: 5,
                    marginVertical: 4,
                  }}
                />

                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: "#FF5722",
                      marginRight: 12,
                    }}
                  />
                  <Text
                    style={{ fontSize: 16, color: "#000", fontWeight: "500" }}
                  >
                    {ride.to}
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
                    <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                      {ride.date}
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="time" size={20} color="#666" />
                    <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                      {ride.departureTime}
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="people" size={20} color="#666" />
                    <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                      {ride.availableSeats}/{ride.totalSeats} seats
                    </Text>
                  </View>
                  <View style={{ alignItems: "center" }}>
                    <Ionicons name="cash" size={20} color="#666" />
                    <Text style={{ fontSize: 14, color: "#666", marginTop: 4 }}>
                      ₹{ride.pricePerSeat}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Vehicle Info */}
              <View
                style={{
                  backgroundColor: "#F8F9FA",
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
                  Vehicle Information
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <Ionicons
                    name="car"
                    size={24}
                    color="#666"
                    style={{ marginRight: 12 }}
                  />
                  <View>
                    <Text
                      style={{ fontSize: 16, color: "#000", fontWeight: "500" }}
                    >
                      {ride.vehicleInfo.make} {ride.vehicleInfo.model}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#666" }}>
                      {ride.vehicleInfo.color} •{" "}
                      {ride.vehicleInfo.isAC ? "AC Available" : "Non-AC"}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Preferences */}
              <View
                style={{
                  backgroundColor: "#F8F9FA",
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
                  Ride Preferences
                </Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {[
                    {
                      key: "music",
                      label: "Music",
                      icon: "musical-notes",
                      allowed: ride.preferences.musicAllowed,
                    },
                    {
                      key: "smoking",
                      label: "Smoking",
                      icon: "ban",
                      allowed: ride.preferences.smokingAllowed,
                    },
                    {
                      key: "pets",
                      label: "Pets",
                      icon: "paw",
                      allowed: ride.preferences.petsAllowed,
                    },
                  ].map((pref) => (
                    <View
                      key={pref.key}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: pref.allowed ? "#E8F5E8" : "#FFE8E8",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                      }}
                    >
                      <Ionicons
                        name={pref.icon as any}
                        size={16}
                        color={pref.allowed ? "#4CAF50" : "#F44336"}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={{
                          fontSize: 14,
                          color: pref.allowed ? "#4CAF50" : "#F44336",
                          fontWeight: "500",
                        }}
                      >
                        {pref.label} {pref.allowed ? "OK" : "Not OK"}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Current Passengers */}
              {ride.passengers.length > 0 && (
                <View
                  style={{
                    backgroundColor: "#F8F9FA",
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
                    Current Passengers ({ride.passengers.length})
                  </Text>
                  {ride.passengers.map((passenger) => (
                    <View
                      key={passenger.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingVertical: 8,
                      }}
                    >
                      <Image
                        source={{ uri: passenger.photo }}
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
                          {passenger.name}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#666" }}>
                          Joined{" "}
                          {new Date(passenger.joinedAt).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Ride Requests (Driver Only) */}
              {isDriverCurrentUser && rideRequests.length > 0 && (
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
                    Ride Requests ({rideRequests.length})
                  </Text>
                  {rideRequests.map((request) => (
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
                        source={{ uri: request.userPhoto }}
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
                          {request.userName}
                        </Text>
                        <Text style={{ fontSize: 12, color: "#666" }}>
                          {new Date(request.timestamp).toLocaleTimeString()}
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
                          <Text style={{ color: "#FFF", fontWeight: "600" }}>
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
                          <Text style={{ color: "#FFF", fontWeight: "600" }}>
                            Reject
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
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
                    : `Join Ride - ₹${ride.pricePerSeat}`}
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
    </Modal>
  );
}
