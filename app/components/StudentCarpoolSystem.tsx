import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Animated,
  Linking,
  Alert,
  Modal,
} from "react-native";
import { Avatar, Chip, Searchbar } from "react-native-paper";
import {
  MapPin,
  Clock,
  Users,
  DollarSign,
  Filter,
  Star,
  Phone,
  MessageCircle,
  Calendar,
  Navigation,
  User,
  Car,
  ArrowRight,
  Plus,
  Menu,
  X,
  Check,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Image } from "react-native";
// Removed Button import - using TouchableOpacity instead
import RideDetailsScreen from "./RideDetailsScreen";
import CreateRideScreen from "./CreateRideScreen";
import ChatScreen from "./ChatScreen";
import { socketService } from "../services/SocketService";

interface CarpoolRide {
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
    status?: "pending" | "accepted";
  }>;
  createdAt: string;
}

interface StudentCarpoolSystemProps {
  isDarkMode?: boolean;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    branch: string;
    year: string;
    rating: number;
    photo: string;
  };
  onCreateRide?: () => void;
  onJoinRide?: (rideId: string) => void;
  onShowBusBooking?: () => void;
  onToggleSidebar?: () => void;
}

const StudentCarpoolSystem = ({
  isDarkMode = false,
  currentUser = {
    id: "user_001",
    name: "Arjun Sharma",
    email: "21UCS045@lnmiit.ac.in",
    branch: "Computer Science",
    year: "3rd Year",
    rating: 4.7,
    photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=arjun",
  },
  onCreateRide = () => {},
  onJoinRide = () => {},
  onShowBusBooking = () => {},
  onToggleSidebar = () => {},
}: StudentCarpoolSystemProps) => {
  const [rides, setRides] = useState<CarpoolRide[]>([]);
  const [filteredRides, setFilteredRides] = useState<CarpoolRide[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "today" | "tomorrow" | "this_week"
  >("all");
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRide, setSelectedRide] = useState<CarpoolRide | null>(null);
  const [showRideDetails, setShowRideDetails] = useState(false);
  const [showCreateRide, setShowCreateRide] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatRideId, setChatRideId] = useState<string>("");
  const [chatRideTitle, setChatRideTitle] = useState<string>("");
  const [showJoinVerification, setShowJoinVerification] = useState(false);
  const [selectedRideForJoin, setSelectedRideForJoin] =
    useState<CarpoolRide | null>(null);

  // Mock data for demonstration
  const mockRides: CarpoolRide[] = [
    {
      id: "ride_001",
      driverId: "driver_001",
      driverName: "Priya Gupta",
      driverRating: 4.8,
      driverPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=priya",
      driverBranch: "Mechanical Engineering",
      driverYear: "4th Year",
      from: "LNMIIT Main Gate",
      to: "Jaipur Railway Station",
      departureTime: "08:30 AM",
      date: "2024-01-15",
      availableSeats: 2,
      totalSeats: 4,
      pricePerSeat: 120,
      vehicleInfo: {
        make: "Hyundai",
        model: "i20",
        color: "White",
        isAC: true,
      },
      route: ["LNMIIT", "Mahindra SEZ", "Sitapura", "Railway Station"],
      preferences: {
        gender: "any",
        smokingAllowed: false,
        musicAllowed: true,
        petsAllowed: false,
      },
      status: "active",
      passengers: [
        {
          id: "pass_001",
          name: "Rahul Singh",
          photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=rahul",
          joinedAt: "2024-01-14T10:30:00Z",
        },
        {
          id: "pass_002",
          name: "Ananya Sharma",
          photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=ananya",
          joinedAt: "2024-01-14T11:15:00Z",
        },
      ],
      createdAt: "2024-01-14T09:00:00Z",
    },
    {
      id: "ride_002",
      driverId: "driver_002",
      driverName: "Amit Kumar",
      driverRating: 4.6,
      driverPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=amit",
      driverBranch: "Electronics & Communication",
      driverYear: "3rd Year",
      from: "Jaipur City Mall",
      to: "LNMIIT Campus",
      departureTime: "09:00",
      date: "2024-01-16",
      availableSeats: 3,
      totalSeats: 4,
      pricePerSeat: 60,
      vehicleInfo: {
        make: "Honda",
        model: "City",
        color: "Silver",
        isAC: true,
      },
      route: ["Jaipur City Mall", "C-Scheme", "Mahindra SEZ", "LNMIIT Campus"],
      preferences: {
        gender: "any",
        smokingAllowed: false,
        musicAllowed: true,
        petsAllowed: false,
      },
      status: "active",
      passengers: [],
      createdAt: "2024-01-14T15:20:00Z",
    },
    {
      id: "ride_003",
      driverId: "driver_003",
      driverName: "Sneha Patel",
      driverRating: 4.9,
      driverPhoto: "https://api.dicebear.com/7.x/avataaars/svg?seed=sneha",
      driverBranch: "Computer Science",
      driverYear: "2nd Year",
      from: "LNMIIT Campus",
      to: "Pink City Metro Station",
      departureTime: "18:00",
      date: "2024-01-15",
      availableSeats: 1,
      totalSeats: 4,
      pricePerSeat: 70,
      vehicleInfo: {
        make: "Hyundai",
        model: "i20",
        color: "Red",
        isAC: true,
      },
      route: ["LNMIIT Campus", "Mahindra SEZ", "Jagatpura", "Pink City Metro"],
      preferences: {
        gender: "female",
        smokingAllowed: false,
        musicAllowed: true,
        petsAllowed: false,
      },
      status: "active",
      passengers: [
        {
          id: "pass_002",
          name: "Ananya Sharma",
          photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=ananya",
          joinedAt: "2024-01-14T12:15:00Z",
        },
        {
          id: "pass_003",
          name: "Kavya Singh",
          photo: "https://api.dicebear.com/7.x/avataaars/svg?seed=kavya",
          joinedAt: "2024-01-14T13:45:00Z",
        },
      ],
      createdAt: "2024-01-14T11:30:00Z",
    },
  ];

  useEffect(() => {
    setRides(mockRides);
    setFilteredRides(mockRides);
    socketService.connect(currentUser.id);

    return () => {
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    let filtered = rides;

    if (searchQuery) {
      filtered = filtered.filter(
        (ride) =>
          ride.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ride.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
          ride.driverName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    switch (selectedFilter) {
      case "today":
        filtered = filtered.filter(
          (ride) => new Date(ride.date).toDateString() === today.toDateString()
        );
        break;
      case "tomorrow":
        filtered = filtered.filter(
          (ride) =>
            new Date(ride.date).toDateString() === tomorrow.toDateString()
        );
        break;
      case "this_week":
        filtered = filtered.filter((ride) => new Date(ride.date) <= nextWeek);
        break;
    }

    setFilteredRides(filtered);
  }, [searchQuery, selectedFilter, rides]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleFilterSelect = (filterKey: string, filterLabel: string) => {
    setSelectedFilter(filterKey as any);
    console.log(`Filter applied: ${filterLabel}`);
  };

  const handleJoinRide = (rideId: string) => {
    const ride = rides.find((r) => r.id === rideId);
    if (ride) {
      setSelectedRideForJoin(ride);
      setShowJoinVerification(true);
    }
  };

  const confirmJoinRide = () => {
    if (!selectedRideForJoin) return;

    setRides((prevRides) =>
      prevRides.map((ride) => {
        if (ride.id === selectedRideForJoin.id && ride.availableSeats > 0) {
          const newPassenger = {
            id: currentUser.id,
            name: currentUser.name,
            photo: currentUser.photo,
            joinedAt: new Date().toISOString(),
            status: "pending" as const, // Add pending status
          };
          return {
            ...ride,
            passengers: [...ride.passengers, newPassenger],
            availableSeats: ride.availableSeats - 1,
          };
        }
        return ride;
      })
    );

    setShowJoinVerification(false);
    setSelectedRideForJoin(null);
    Alert.alert(
      "Request Sent!",
      "Your join request has been sent to the ride creator. You'll be notified once they accept your request."
    );
    onJoinRide(selectedRideForJoin.id);
  };

  const handleContactDriver = (ride: CarpoolRide) => {
    Alert.alert(
      "Contact Driver",
      `How would you like to contact ${ride.driverName}?`,
      [
        {
          text: "Call",
          onPress: () => {
            const phoneNumber = "tel:+919876543210"; // Mock phone number
            Linking.openURL(phoneNumber).catch(() => {
              Alert.alert("Error", "Unable to make phone call");
            });
          },
        },
        {
          text: "Chat",
          onPress: () => handleStartChat(ride.id, `${ride.from} → ${ride.to}`),
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleStartChat = (rideId: string, rideTitle: string) => {
    setChatRideId(rideId);
    setChatRideTitle(rideTitle);
    setShowChat(true);
    setShowRideDetails(false);
  };

  const handleCreateRide = () => {
    setShowCreateRide(true);
  };

  const handleRideCreated = (rideData: any) => {
    setRides((prev) => [rideData, ...prev]);
    setShowCreateRide(false);
  };

  const handleRideCardPress = (ride: CarpoolRide) => {
    setSelectedRide(ride);
    setShowRideDetails(true);
  };

  const handleBackFromDetails = () => {
    setShowRideDetails(false);
    setSelectedRide(null);
  };

  const renderJobStyleCard = (ride: CarpoolRide) => {
    const isDriverCurrentUser = ride.driverId === currentUser.id;
    const currentPassenger = ride.passengers.find(
      (p) => p.id === currentUser.id
    );
    const hasJoined = !!currentPassenger;
    const isPending = currentPassenger?.status === "pending";
    const cardColors = [
      { bg: "#E8F5E8", accent: "#4CAF50" }, // Green
      { bg: "#FFF3E0", accent: "#FF9800" }, // Orange
      { bg: "#E3F2FD", accent: "#2196F3" }, // Blue
      { bg: "#F3E5F5", accent: "#9C27B0" }, // Purple
      { bg: "#FCE4EC", accent: "#E91E63" }, // Pink
    ];
    const colorIndex = parseInt(ride.id.slice(-1)) % cardColors.length;
    const colors = cardColors[colorIndex];

    return (
      <TouchableOpacity
        key={ride.id}
        style={[styles.jobCard, { backgroundColor: colors.bg }]}
        onPress={() => handleRideCardPress(ride)}
      >
        {/* Header with toggle and company name */}
        <View style={styles.jobHeader}>
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>LNMIIT Carpool</Text>
            <Text style={[styles.jobTitle, { color: colors.accent }]}>
              {ride.from} → {ride.to}
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <View style={[styles.toggle, { backgroundColor: colors.accent }]}>
              <View style={styles.toggleButton} />
            </View>
          </View>
        </View>

        {/* Job tags/skills */}
        <View style={styles.tagsContainer}>
          <View style={[styles.tag, { backgroundColor: colors.accent + "20" }]}>
            <Text style={[styles.tagText, { color: colors.accent }]}>
              ₹{ride.pricePerSeat}
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: colors.accent + "20" }]}>
            <Text style={[styles.tagText, { color: colors.accent }]}>
              {ride.departureTime}
            </Text>
          </View>
        </View>

        {/* Be in first applicants section */}
        <View style={styles.applicantsSection}>
          <Clock size={16} color="#666" />
          <Text style={styles.applicantsText}>
            {ride.availableSeats > 0
              ? `${ride.availableSeats} seats available`
              : "Ride is full"}
          </Text>
        </View>

        {/* Driver avatars and time */}
        <View style={styles.bottomSection}>
          <View style={styles.avatarsContainer}>
            <Avatar.Image
              size={32}
              source={{ uri: ride.driverPhoto }}
              style={styles.driverAvatar}
            />
            {ride.passengers.slice(0, 2).map((passenger, index) => (
              <Avatar.Image
                key={passenger.id}
                size={32}
                source={{ uri: passenger.photo }}
                style={[styles.passengerAvatar, { marginLeft: -8 }]}
              />
            ))}
            {ride.passengers.length > 2 && (
              <View style={styles.morePassengers}>
                <Text style={styles.morePassengersText}>
                  +{ride.passengers.length - 2}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.timeAgo}>
            {new Date(ride.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Action buttons */}
        <View style={styles.jobActionButtons}>
          {!isDriverCurrentUser && !hasJoined && ride.availableSeats > 0 && (
            <>
              <TouchableOpacity
                style={[styles.contactBtn, { borderColor: colors.accent }]}
                onPress={() => handleContactDriver(ride)}
              >
                <Phone size={16} color={colors.accent} />
                <Text style={[styles.contactBtnText, { color: colors.accent }]}>
                  Contact
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.joinBtn, { backgroundColor: colors.accent }]}
                onPress={() => handleJoinRide(ride.id)}
              >
                <Text style={styles.joinBtnText}>Join Ride</Text>
              </TouchableOpacity>
            </>
          )}

          {hasJoined && !isPending && (
            <View
              style={[
                styles.joinedBtn,
                { backgroundColor: colors.accent + "20" },
              ]}
            >
              <Text style={[styles.joinedBtnText, { color: colors.accent }]}>
                ✓ Joined
              </Text>
            </View>
          )}

          {isPending && (
            <View
              style={[styles.joinedBtn, { backgroundColor: "#FFA726" + "20" }]}
            >
              <Text style={[styles.joinedBtnText, { color: "#FFA726" }]}>
                ⏳ Pending Approval
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const sidebarCategories = [
    {
      key: "search",
      label: "Search Rides",
      count: `${filteredRides.length}`,
      color: "#4CAF50",
      icon: "🔍",
    },
    {
      key: "create",
      label: "Create Ride",
      count: "New",
      color: "#2196F3",
      icon: "➕",
    },
    {
      key: "history",
      label: "My History",
      count: "8",
      color: "#9C27B0",
      icon: "📋",
    },
  ];

  return (
    <>
      {/* Main Container */}
      <View
        style={[
          styles.container,
          { backgroundColor: isDarkMode ? "#000" : "#F8F9FA" },
        ]}
      >
        {/* Search Bar with Menu */}
        <View style={styles.searchContainer}>
          <TouchableOpacity onPress={onToggleSidebar} style={styles.menuBtn}>
            <Menu size={24} color={isDarkMode ? "#FFF" : "#000"} />
          </TouchableOpacity>
          <Searchbar
            placeholder="Search by destination..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={[
              styles.searchBar,
              { backgroundColor: isDarkMode ? "#1A1A1A" : "#F5F5F5" },
            ]}
            inputStyle={{ color: isDarkMode ? "#FFF" : "#000" }}
            iconColor={isDarkMode ? "#CCC" : "#666"}
          />
          <TouchableOpacity style={styles.filterIcon}>
            <Filter size={20} color={isDarkMode ? "#CCC" : "#666"} />
          </TouchableOpacity>
        </View>

        {/* Quick Tips */}
        {!searchQuery && filteredRides.length === 0 && (
          <View style={styles.quickTips}>
            <Text
              style={[
                styles.tipsTitle,
                { color: isDarkMode ? "#FFF" : "#000" },
              ]}
            >
              💡 Quick Tips for Finding Rides:
            </Text>
            <Text
              style={[styles.tipsText, { color: isDarkMode ? "#CCC" : "#666" }]}
            >
              • Most rides are posted 1-2 hours before departure{"\n"}• Check
              "Tomorrow" and "This Week" filters{"\n"}• Try searching popular
              destinations like "Railway Station", "Airport", or "Mall"
            </Text>
          </View>
        )}

        {/* Available Rides Section */}
        <View style={styles.sectionHeader}>
          <Text
            style={[
              styles.sectionTitle,
              { color: isDarkMode ? "#FFF" : "#000" },
            ]}
          >
            Available Rides
          </Text>
          <Text
            style={[
              styles.sectionSubtitle,
              { color: isDarkMode ? "#CCC" : "#666" },
            ]}
          >
            {filteredRides.length} rides found
          </Text>
        </View>

        {/* Rides List */}
        <ScrollView
          style={styles.ridesList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#000000"]}
              tintColor={isDarkMode ? "#FFF" : "#000"}
            />
          }
        >
          {filteredRides.length > 0 ? (
            filteredRides.map(renderJobStyleCard)
          ) : (
            <View style={styles.emptyState}>
              <Car size={64} color={isDarkMode ? "#666" : "#CCC"} />
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isDarkMode ? "#FFF" : "#000" },
                ]}
              >
                No rides available right now
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: isDarkMode ? "#CCC" : "#666" },
                ]}
              >
                • Try searching for different locations{"\n"}• Check rides for
                tomorrow or this week{"\n"}• Create your own ride and invite
                others
              </Text>
              <TouchableOpacity
                style={[
                  styles.createRideButton,
                  { backgroundColor: isDarkMode ? "#FFF" : "#000" },
                ]}
                onPress={handleCreateRide}
              >
                <Plus size={20} color={isDarkMode ? "#000" : "#FFF"} />
                <Text
                  style={[
                    styles.createRideText,
                    { color: isDarkMode ? "#000" : "#FFF" },
                  ]}
                >
                  Create a Ride
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Actions Section */}
          <Text
            style={[
              styles.sectionTitle,
              {
                color: isDarkMode ? "#FFF" : "#000",
                marginTop: 32,
                marginHorizontal: 20,
                marginBottom: 16,
              },
            ]}
          >
            Quick Actions
          </Text>

          <View style={styles.categoriesGrid}>
            {sidebarCategories.map((category, index) => (
              <TouchableOpacity
                key={category.key}
                style={[
                  styles.categoryCard,
                  { backgroundColor: category.color },
                ]}
              >
                <Text style={styles.categoryCardEmoji}>{category.icon}</Text>
                <Text style={styles.categoryCardTitle}>{category.label}</Text>
                <Text style={styles.categoryCardCount}>
                  {category.key === "create"
                    ? category.count
                    : `${category.count} available`}
                </Text>
                <TouchableOpacity
                  style={styles.viewJobsBtn}
                  onPress={() => {
                    if (category.key === "create") {
                      handleCreateRide();
                    }
                  }}
                >
                  <Text style={styles.viewJobsBtnText}>
                    {category.key === "create" ? "Start Now" : "View All"}
                  </Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ height: 20 }} />
        </ScrollView>

        {/* Floating Create Ride Button */}
        <TouchableOpacity
          style={[
            styles.floatingButton,
            { backgroundColor: isDarkMode ? "#FFF" : "#000" },
          ]}
          onPress={handleCreateRide}
        >
          <Plus size={24} color={isDarkMode ? "#000" : "#FFF"} />
        </TouchableOpacity>
      </View>

      {/* Modals */}
      {showRideDetails && selectedRide && (
        <RideDetailsScreen
          ride={selectedRide}
          currentUser={currentUser}
          visible={showRideDetails}
          onBack={handleBackFromDetails}
          onJoinRide={handleJoinRide}
          onStartChat={handleStartChat}
        />
      )}

      {showCreateRide && (
        <CreateRideScreen
          onBack={() => setShowCreateRide(false)}
          onRideCreated={handleRideCreated}
          isDarkMode={isDarkMode}
        />
      )}

      {showChat && (
        <ChatScreen
          rideId={chatRideId}
          currentUserId={currentUser.id}
          currentUserName={currentUser.name}
          rideTitle={chatRideTitle}
          onBack={() => setShowChat(false)}
          isDarkMode={isDarkMode}
          rideDetails={{
            from: selectedRide?.from || "LNMIIT Campus",
            to: selectedRide?.to || "Jaipur Railway Station",
            departureTime: selectedRide?.departureTime || "2:30 PM",
            date: selectedRide?.date || "Today",
            driverName: selectedRide?.driverName || "Ride Creator",
            driverPhone: "+91 98765 43210",
            driverRating: selectedRide?.driverRating || 4.8,
            driverPhoto:
              selectedRide?.driverPhoto ||
              "https://api.dicebear.com/7.x/avataaars/svg?seed=driver",
            pricePerSeat: selectedRide?.pricePerSeat || 120,
            availableSeats: selectedRide?.availableSeats || 2,
          }}
        />
      )}

      {/* Join Verification Modal */}
      {showJoinVerification && selectedRideForJoin && (
        <Modal visible={true} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.verificationModal,
                { backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF" },
              ]}
            >
              <View style={styles.verificationHeader}>
                <View
                  style={[
                    styles.verificationIcon,
                    { backgroundColor: isDarkMode ? "#4CAF50" : "#E8F5E8" },
                  ]}
                >
                  <Check size={32} color={isDarkMode ? "#FFFFFF" : "#4CAF50"} />
                </View>
                <Text
                  style={[
                    styles.verificationTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" },
                  ]}
                >
                  Join Ride Confirmation
                </Text>
                <Text
                  style={[
                    styles.verificationSubtitle,
                    { color: isDarkMode ? "#CCCCCC" : "#666666" },
                  ]}
                >
                  Please verify your details before joining
                </Text>
              </View>

              <ScrollView
                style={styles.verificationContent}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Ride Details */}
                <View
                  style={[
                    styles.verificationSection,
                    { backgroundColor: isDarkMode ? "#2A2A2A" : "#F8F9FA" },
                  ]}
                >
                  <Text
                    style={[
                      styles.verificationSectionTitle,
                      { color: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                  >
                    🚗 Ride Details
                  </Text>
                  <View style={styles.verificationRow}>
                    <MapPin
                      size={16}
                      color={isDarkMode ? "#CCCCCC" : "#666666"}
                    />
                    <Text
                      style={[
                        styles.verificationText,
                        { color: isDarkMode ? "#CCCCCC" : "#666666" },
                      ]}
                    >
                      {selectedRideForJoin.from} → {selectedRideForJoin.to}
                    </Text>
                  </View>
                  <View style={styles.verificationRow}>
                    <Clock
                      size={16}
                      color={isDarkMode ? "#CCCCCC" : "#666666"}
                    />
                    <Text
                      style={[
                        styles.verificationText,
                        { color: isDarkMode ? "#CCCCCC" : "#666666" },
                      ]}
                    >
                      {selectedRideForJoin.date} at{" "}
                      {selectedRideForJoin.departureTime}
                    </Text>
                  </View>
                  <View style={styles.verificationRow}>
                    <DollarSign
                      size={16}
                      color={isDarkMode ? "#CCCCCC" : "#666666"}
                    />
                    <Text
                      style={[
                        styles.verificationText,
                        { color: isDarkMode ? "#CCCCCC" : "#666666" },
                      ]}
                    >
                      ₹{selectedRideForJoin.pricePerSeat} per seat
                    </Text>
                  </View>
                </View>

                {/* Driver Info */}
                <View
                  style={[
                    styles.verificationSection,
                    { backgroundColor: isDarkMode ? "#2A2A2A" : "#F8F9FA" },
                  ]}
                >
                  <Text
                    style={[
                      styles.verificationSectionTitle,
                      { color: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                  >
                    👤 Ride Creator Details
                  </Text>
                  <View style={styles.driverVerificationInfo}>
                    <Image
                      source={{ uri: selectedRideForJoin.driverPhoto }}
                      style={styles.driverVerificationAvatar}
                    />
                    <View style={styles.driverVerificationDetails}>
                      <Text
                        style={[
                          styles.driverVerificationName,
                          { color: isDarkMode ? "#FFFFFF" : "#000000" },
                        ]}
                      >
                        {selectedRideForJoin.driverName}
                      </Text>
                      <View style={styles.driverVerificationRating}>
                        <Star size={14} color="#FFD700" fill="#FFD700" />
                        <Text
                          style={[
                            styles.driverVerificationRatingText,
                            { color: isDarkMode ? "#CCCCCC" : "#666666" },
                          ]}
                        >
                          {selectedRideForJoin.driverRating} •{" "}
                          {selectedRideForJoin.driverBranch}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                {/* User Verification */}
                <View
                  style={[
                    styles.verificationSection,
                    { backgroundColor: isDarkMode ? "#2A2A2A" : "#F8F9FA" },
                  ]}
                >
                  <Text
                    style={[
                      styles.verificationSectionTitle,
                      { color: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                  >
                    ✅ Your Details
                  </Text>
                  <View style={styles.userVerificationInfo}>
                    <Image
                      source={{ uri: currentUser.photo }}
                      style={styles.userVerificationAvatar}
                    />
                    <View style={styles.userVerificationDetails}>
                      <Text
                        style={[
                          styles.userVerificationName,
                          { color: isDarkMode ? "#FFFFFF" : "#000000" },
                        ]}
                      >
                        {currentUser.name}
                      </Text>
                      <Text
                        style={[
                          styles.userVerificationBranch,
                          { color: isDarkMode ? "#CCCCCC" : "#666666" },
                        ]}
                      >
                        {currentUser.branch} • {currentUser.year}
                      </Text>
                      <Text
                        style={[
                          styles.userVerificationEmail,
                          { color: isDarkMode ? "#999999" : "#888888" },
                        ]}
                      >
                        {currentUser.email}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.verificationActions}>
                <TouchableOpacity
                  style={[
                    styles.cancelVerificationButton,
                    { borderColor: isDarkMode ? "#666666" : "#CCCCCC" },
                  ]}
                  onPress={() => {
                    setShowJoinVerification(false);
                    setSelectedRideForJoin(null);
                  }}
                >
                  <X size={16} color={isDarkMode ? "#666666" : "#CCCCCC"} />
                  <Text
                    style={[
                      styles.cancelVerificationText,
                      { color: isDarkMode ? "#666666" : "#CCCCCC" },
                    ]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmVerificationButton,
                    { backgroundColor: isDarkMode ? "#4CAF50" : "#2E7D32" },
                  ]}
                  onPress={confirmJoinRide}
                >
                  <Check size={16} color="#FFFFFF" />
                  <Text
                    style={[
                      styles.confirmVerificationText,
                      { color: "#FFFFFF" },
                    ]}
                  >
                    Confirm & Join Ride
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0, // Full height coverage - covers bottom navbar too
    width: "75%", // 85% of screen width for better coverage
    maxWidth: 380, // Maximum width cap
    zIndex: 9999, // Very high z-index to ensure it covers everything
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 20, // Much higher elevation for Android
  },
  sidebarGradient: {
    flex: 1,
  },
  sidebarHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modernHeaderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLogoSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modernLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modernLogoText: {
    fontSize: 20,
  },
  headerTextSection: {
    flex: 1,
  },
  modernSidebarTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  modernSidebarSubtitle: {
    fontSize: 13,
    opacity: 0.8,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  logoContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 16,
  },
  sidebarSubtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  userInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 16,
    borderWidth: 3,
    borderColor: "#4CAF50",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  userBranch: {
    fontSize: 12,
    marginBottom: 4,
  },
  userRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: "600",
  },
  modernCategoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
  },
  modernCategoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  modernCategoryEmoji: {
    fontSize: 18,
  },
  modernCategoryInfo: {
    flex: 1,
  },
  modernCategoryLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  modernCategoryCount: {
    fontSize: 12,
  },
  menuSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  menuSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
    marginBottom: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 4,
  },
  menuItemIcon: {
    fontSize: 16,
    marginRight: 16,
    width: 20,
    textAlign: "center",
  },
  menuItemLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  menuItemCount: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  sidebarFooter: {
    padding: 20,
    borderTopWidth: 1,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  footerSubtext: {
    fontSize: 10,
  },
  sidebarHeader: {
    padding: 24,
    paddingTop: 60,
  },
  closeBtn: {
    marginRight: 16,
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  sidebarContent: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  categoryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  categoryEmoji: {
    fontSize: 20,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 2,
  },
  categoryCount: {
    fontSize: 14,
    fontWeight: "600",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    zIndex: 9998,
  },
  overlayTouchable: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
  },
  // Removed header styles - no longer needed
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20, // ← ADJUST THIS VALUE to change top spacing from status bar
    marginBottom: 24,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    borderRadius: 12,
  },
  menuBtn: {
    padding: 8,
    borderRadius: 8,
  },
  filterIcon: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F5F5F5",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.7,
  },
  quickTips: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 16,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: "#4CAF50",
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 20,
  },
  ridesList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  jobCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  jobTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  toggleContainer: {
    alignItems: "center",
  },
  toggle: {
    width: 32,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "flex-end",
    paddingHorizontal: 2,
  },
  toggleButton: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#FFF",
  },
  tagsContainer: {
    flexDirection: "row",
    marginBottom: 12,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: "600",
  },
  applicantsSection: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  applicantsText: {
    fontSize: 14,
    color: "#666",
    marginLeft: 8,
  },
  bottomSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  driverAvatar: {
    borderWidth: 2,
    borderColor: "#FFF",
  },
  passengerAvatar: {
    borderWidth: 2,
    borderColor: "#FFF",
  },
  morePassengers: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  morePassengersText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  timeAgo: {
    fontSize: 14,
    color: "#666",
  },
  jobActionButtons: {
    flexDirection: "row",
    gap: 12,
  },
  contactBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  contactBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  joinBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  joinBtnText: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  joinedBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  joinedBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  categoriesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
    paddingHorizontal: 20,
  },
  categoryCard: {
    flex: 1,
    minWidth: "30%",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  categoryCardEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  categoryCardTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  categoryCardCount: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
  },
  viewJobsBtn: {
    backgroundColor: "rgba(0,0,0,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  viewJobsBtnText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 12,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  createRideButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  createRideText: {
    fontSize: 16,
    fontWeight: "600",
  },
  floatingButton: {
    position: "absolute",
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Verification Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  verificationModal: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    height: "80%",
    maxHeight: 600,
  },
  verificationHeader: {
    alignItems: "center",
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  verificationIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  verificationTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  verificationSubtitle: {
    fontSize: 14,
    textAlign: "center",
  },
  verificationContent: {
    flex: 1,
    padding: 20,
  },
  verificationSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  verificationSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  verificationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingLeft: 4,
  },
  verificationText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  driverVerificationInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  driverVerificationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  driverVerificationDetails: {
    flex: 1,
  },
  driverVerificationName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  driverVerificationRating: {
    flexDirection: "row",
    alignItems: "center",
  },
  driverVerificationRatingText: {
    fontSize: 14,
    marginLeft: 4,
  },
  userVerificationInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userVerificationAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  userVerificationDetails: {
    flex: 1,
  },
  userVerificationName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  userVerificationBranch: {
    fontSize: 14,
    marginBottom: 2,
  },
  userVerificationEmail: {
    fontSize: 12,
  },
  importantNotice: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  noticeText: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: "center",
  },
  verificationActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  cancelVerificationButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  cancelVerificationText: {
    fontSize: 14,
    fontWeight: "600",
  },
  confirmVerificationButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  confirmVerificationText: {
    fontSize: 14,
    fontWeight: "600",
  },
  colorfulMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 8,
  },
  menuItemIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemSubtext: {
    fontSize: 12,
    fontWeight: "600",
  },
  menuItemBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: "#FFF",
  },
  safetySection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  safetyAlertButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  safetyButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  safetyIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  safetyTextContainer: {
    flex: 1,
  },
  safetyMainText: {
    fontSize: 16,
    fontWeight: "600",
  },
  safetySubText: {
    fontSize: 12,
    fontWeight: "500",
  },
  safetyPulse: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFF",
    marginLeft: 8,
  },
  safetyPulseInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#4CAF50",
    margin: 2,
  },
});

StudentCarpoolSystem.displayName = "StudentCarpoolSystem";

export default StudentCarpoolSystem;
