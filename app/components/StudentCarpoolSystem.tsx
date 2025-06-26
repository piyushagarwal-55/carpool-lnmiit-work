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
  TextInput,
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
  Timer,
  AlertCircle,
  Bell,
  Search,
  UserCheck,
} from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";

import { LinearGradient } from "expo-linear-gradient";
import { Image } from "react-native";
// Removed Button import - using TouchableOpacity instead
import RideDetailsScreen from "./RideDetailsScreen";
import CreateRideScreen from "./CreateRideScreen";
import SecureChatSystem from "./SecureChatSystem";
import RequestAcceptanceModal from "./RequestAcceptanceModal";
import LoadingOverlay from "./LoadingOverlay";
import NotificationScreen from "./NotificationScreen";
import InstructionScreen from "./InstructionScreen";
import FilterModal, { FilterOptions } from "./FilterModal";
import { socketService } from "../services/SocketService";
import { supabase } from "../lib/supabase";
import NotificationService from "../services/NotificationService";
import PushNotificationService from "../services/PushNotificationService";
import UserRideHistoryScreen from "./UserRideHistoryScreen";
import { rideManagementAPI } from "../api/carpool";

import {
  parseEmailInfo,
  calculateAcademicYear,
  formatTime,
  formatDate,
  calculateRideExpiry,
  filterRides,
  generateAvatarFromName,
  applyAdvancedFilters,
  isRideExpired,
  deleteExpiredRides,
  cleanupOldData,
  markExpiredRidesAsCompleted,
} from "../lib/utils";

interface CarpoolRide {
  id: string;
  rideCreatorId: string;
  rideCreatorName: string;
  rideCreatorRating: number;
  rideCreatorPhoto: string;
  rideCreatorBranch: string;
  rideCreatorYear: string;
  rideCreatorPhone?: string;
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
  onShowProfile?: () => void;
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
  onShowProfile = () => {},
}: StudentCarpoolSystemProps) => {
  const [rides, setRides] = useState<CarpoolRide[]>([]);
  const [filteredRides, setFilteredRides] = useState<CarpoolRide[]>([]);
  const [expiredRides, setExpiredRides] = useState<CarpoolRide[]>([]);
  const [allExpiredRides, setAllExpiredRides] = useState<CarpoolRide[]>([]);
  // NEW: Joined rides state
  const [joinedRides, setJoinedRides] = useState<CarpoolRide[]>([]);
  const [userCreatedRidesCount, setUserCreatedRidesCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRide, setSelectedRide] = useState<CarpoolRide | null>(null);
  const [showRideDetails, setShowRideDetails] = useState(false);
  // NEW: Enable ride details viewing
  const [enableRideDetails] = useState(true);
  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [rideToJoin, setRideToJoin] = useState<CarpoolRide | null>(null);
  const [chatModalVisible, setChatModalVisible] = useState(false);
  const [chatRideId, setChatRideId] = useState<string>("");
  const [chatRideTitle, setChatRideTitle] = useState<string>("");
  const [showCreateRide, setShowCreateRide] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Join ride modal states
  const [selectedJoinRequest, setSelectedJoinRequest] = useState<any>(null);
  const [showRequestAcceptance, setShowRequestAcceptance] = useState(false);
  const [selectedRideForJoin, setSelectedRideForJoin] =
    useState<CarpoolRide | null>(null);
  const [joinMessage, setJoinMessage] = useState("");
  const [seatsToBook, setSeatsToBook] = useState(1);
  const [showJoinVerification, setShowJoinVerification] = useState(false);
  const [showJoinRequestModal, setShowJoinRequestModal] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null);
  const [scrollX, setScrollX] = useState(new Animated.Value(0));
  const [mainScrollY] = useState(new Animated.Value(0));
  const [filters, setFilters] = useState<FilterOptions>({
    dateFilter: "all",
    timeFilter: "all",
    priceRange: { min: 0, max: 1000 },
    seatsFilter: "all",
    instantBooking: null,
    sortBy: "time",
    locations: { from: [], to: [] },
  });

  // Legacy variables for compatibility
  const selectedFilter = filters.dateFilter;
  const currentFilters = filters;
  const sectionLoading = loading;

  // Sidebar state
  const [notifications, setNotifications] = useState<any[]>([]);
  const [userRideHistory, setUserRideHistory] = useState<any[]>([]);
  const [availableRides, setAvailableRides] = useState(0);
  const [activeBusRoutes, setActiveBusRoutes] = useState(0);

  // Fetch rides from database

  const navigation = useNavigation();
  const fetchRides = async () => {
    try {
      setLoading(true);

      // Auto-cleanup expired rides before fetching
      try {
        await deleteExpiredRides(supabase);
      } catch (cleanupError) {
        console.warn("Cleanup failed, continuing with fetch:", cleanupError);
      }

      const { data: ridesData, error } = await supabase
        .from("carpool_rides")
        .select("*")
        .in("status", ["active", "expired"])
        .order("created_at", { ascending: false });

      if (error) {
        if (
          error.message.includes("Network request failed") ||
          error.message.includes("fetch")
        ) {
          console.warn("Network connectivity issue, using offline mode");
          setRides([]);
          setFilteredRides([]);
          return;
        }
        console.error("Error fetching rides:", error);
        return;
      }

      // Fetch passengers and requests for all rides
      const rideIds = ridesData.map((ride) => ride.id);

      // Fetch passengers for all rides
      const { data: passengersData, error: passengersError } = await supabase
        .from("ride_passengers")
        .select("*")
        .in("ride_id", rideIds);

      // Fetch requests for all rides
      const { data: requestsData, error: requestsError } = await supabase
        .from("join_requests")
        .select("*")
        .in("ride_id", rideIds);

      // Fetch user profiles for ride creators
      const creatorIds = ridesData.map((ride) => ride.ride_creator_id);
      const { data: creatorProfiles } = await supabase
        .from("user_profiles")
        .select("id, full_name, avatar_url, branch, year, rating")
        .in("id", creatorIds);

      // Fetch user profiles for passengers
      const passengerIds = (passengersData || []).map((p) => p.passenger_id);
      const { data: passengerProfiles } = await supabase
        .from("user_profiles")
        .select("id, full_name, avatar_url, branch, year")
        .in("id", passengerIds);

      // Fetch user profiles for requesters
      const requesterIds = (requestsData || []).map((r) => r.passenger_id);
      const { data: requesterProfiles } = await supabase
        .from("user_profiles")
        .select("id, full_name, avatar_url, branch, year")
        .in("id", requesterIds);

      if (passengersError) {
        if (passengersError.message.includes("Network request failed")) {
          console.warn("Network error fetching passengers, using empty data");
        } else {
          console.error("Error fetching passengers:", passengersError);
        }
      }
      if (requestsError) {
        if (requestsError.message.includes("Network request failed")) {
          console.warn("Network error fetching requests, using empty data");
        } else {
          console.error("Error fetching requests:", requestsError);
        }
      }

      // Transform database data to frontend format
      const transformedRides: CarpoolRide[] = ridesData.map((ride) => {
        const emailInfo = parseEmailInfo(ride.ride_creator_email || "");
        const academicYear = calculateAcademicYear(emailInfo.joiningYear);

        // Get creator profile
        const creatorProfile = (creatorProfiles || []).find(
          (profile) => profile.id === ride.ride_creator_id
        );

        // Get passengers for this ride
        const ridePassengers = (passengersData || [])
          .filter((p) => p.ride_id === ride.id)
          .map((p) => {
            const passengerProfile = (passengerProfiles || []).find(
              (profile) => profile.id === p.passenger_id
            );
            return {
              id: p.passenger_id,
              name: passengerProfile?.full_name || p.passenger_name,
              photo:
                passengerProfile?.avatar_url ||
                generateAvatarFromName(p.passenger_name),
              joinedAt: p.joined_at || p.created_at,
              status: p.status as "pending" | "accepted" | "confirmed",
              seatsBooked: p.seats_booked || 1,
            };
          });

        // Get pending requests for this ride
        const ridePendingRequests = (requestsData || [])
          .filter((r) => r.ride_id === ride.id)
          .map((r) => {
            const requesterProfile = (requesterProfiles || []).find(
              (profile) => profile.id === r.passenger_id
            );
            return {
              id: r.id,
              passengerId: r.passenger_id,
              passengerName: requesterProfile?.full_name || r.passenger_name,
              passengerPhoto:
                requesterProfile?.avatar_url ||
                generateAvatarFromName(r.passenger_name),
              seatsRequested: r.seats_requested || 1,
              message: r.message,
              requestedAt: r.created_at,
              status: r.status as "pending" | "accepted" | "rejected",
            };
          });

        return {
          id: ride.id,
          rideCreatorId: ride.ride_creator_id,
          rideCreatorName: creatorProfile?.full_name || ride.ride_creator_name,
          rideCreatorRating: creatorProfile?.rating || 4.8,
          rideCreatorPhoto: creatorProfile?.avatar_url || getDriverPhoto(ride),
          rideCreatorBranch: creatorProfile?.branch || emailInfo.branchFull,
          rideCreatorYear: creatorProfile?.year || academicYear,
          rideCreatorPhone: ride.ride_creator_phone,
          from: ride.from_location,
          to: ride.to_location,
          departureTime: ride.departure_time, // Keep as ISO string for proper formatting
          date: ride.departure_date,
          departure_date: ride.departure_date, // For isRideExpired function
          departure_time: ride.departure_time, // For isRideExpired function
          availableSeats: ride.available_seats,
          totalSeats: ride.total_seats,
          pricePerSeat: ride.price_per_seat,
          vehicleInfo: {
            make: ride.vehicle_make || "Unknown",
            model: ride.vehicle_model || "Unknown",
            color: ride.vehicle_color || "White",
            isAC: ride.is_ac,
          },
          route: [ride.from_location, ride.to_location],
          preferences: {
            gender: "any" as const,
            smokingAllowed: ride.smoking_allowed,
            musicAllowed: ride.music_allowed,
          },
          status: ride.status as "active" | "full" | "completed" | "cancelled",
          passengers: ridePassengers,
          pendingRequests: ridePendingRequests,
          instantBooking: ride.instant_booking,
          chatEnabled: ride.chat_enabled,
          createdAt: ride.created_at,
        };
      });

      // Separate available and expired rides
      const availableRides = transformedRides.filter(
        (ride) => !isRideExpired(ride)
      );
      const expiredRidesList = transformedRides.filter((ride) =>
        isRideExpired(ride)
      );

      setRides(availableRides);
      setExpiredRides(expiredRidesList);
      setAllExpiredRides(expiredRidesList);

      // Auto-flush expired rides that are 2+ hours old
      if (expiredRidesList.length > 0) {
        await autoFlushExpiredRides(expiredRidesList);
      }

      // Apply current filters to available rides only
      const filtered = availableRides.filter(
        (ride) =>
          (ride.from || "")
            .toLowerCase()
            .includes((searchQuery || "").toLowerCase()) ||
          (ride.to || "")
            .toLowerCase()
            .includes((searchQuery || "").toLowerCase())
      );
      setFilteredRides(filtered);

      // Also fetch joined rides and check daily limit
      await fetchJoinedRides();
      await checkDailyRideLimit(currentUser.id);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Network request failed")
      ) {
        console.warn(
          "Network connectivity issue in fetchRides, continuing in offline mode"
        );
        setRides([]);
        setFilteredRides([]);
      } else {
        console.error("Error in fetchRides:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // NEW: Auto-flush expired rides function
  const autoFlushExpiredRides = async (expiredRidesArray: CarpoolRide[]) => {
    try {
      const now = new Date();
      const ridesToDelete = expiredRidesArray.filter((ride) => {
        const departureDateTime = new Date(
          `${ride.date} ${ride.departureTime}`
        );
        const hoursSinceExpiry =
          (now.getTime() - departureDateTime.getTime()) / (1000 * 60 * 60);
        return hoursSinceExpiry >= 2;
      });

      if (ridesToDelete.length > 0) {
        console.log(`Auto-flushing ${ridesToDelete.length} expired rides`);

        for (const ride of ridesToDelete) {
          await supabase.from("carpool_rides").delete().eq("id", ride.id);
        }

        console.log("Successfully auto-flushed expired rides");
      }
    } catch (error) {
      console.error("Error auto-flushing expired rides:", error);
    }
  };

  // NEW: Check user's daily ride creation count
  const checkDailyRideLimit = async (userId: string): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("carpool_rides")
        .select("id")
        .eq("ride_creator_id", userId)
        .gte("created_at", `${today}T00:00:00.000Z`)
        .lt("created_at", `${today}T23:59:59.999Z`);

      if (error) {
        console.error("Error checking daily ride limit:", error);
        return false;
      }

      const todayRidesCount = data?.length || 0;
      setUserCreatedRidesCount(todayRidesCount);

      return todayRidesCount < 2;
    } catch (error) {
      console.error("Error in checkDailyRideLimit:", error);
      return false;
    }
  };

  // Helper function to get driver photo - use current user's photo if it's their ride
  const getDriverPhoto = (ride: any): string => {
    if (ride.ride_creator_id === currentUser.id) {
      return currentUser.photo;
    }
    return generateAvatarFromName(ride.ride_creator_name);
  };

  // NEW: Fetch joined rides (both as passenger and as driver)
  const fetchJoinedRides = async () => {
    try {
      // Fetch rides where user is a passenger
      const { data: passengerRidesData, error: passengerError } = await supabase
        .from("ride_passengers")
        .select(
          `
          ride_id,
          status,
          seats_booked,
          joined_at,
          carpool_rides!inner (
            id,
            ride_creator_id,
            ride_creator_name,
            from_location,
            to_location,
            departure_date,
            departure_time,
            status,
            price_per_seat,
            available_seats,
            total_seats,
            chat_enabled
          )
        `
        )
        .eq("passenger_id", currentUser.id)
        .in("status", ["accepted", "confirmed"])
        .eq("carpool_rides.status", "active");

      // Fetch driver rides (rides created by the user)
      const { data: driverRidesData, error: driverError } = await supabase
        .from("carpool_rides")
        .select("*")
        .eq("ride_creator_id", currentUser.id)
        .eq("status", "active");

      // Get all unique creator IDs for profile fetching
      const creatorIds = new Set();

      if (passengerRidesData) {
        passengerRidesData.forEach((item: any) => {
          if (item.carpool_rides?.ride_creator_id) {
            creatorIds.add(item.carpool_rides.ride_creator_id);
          }
        });
      }

      if (driverRidesData) {
        driverRidesData.forEach((ride: any) => {
          creatorIds.add(ride.ride_creator_id);
        });
      }

      // Fetch creator profiles
      const { data: creatorProfiles } = await supabase
        .from("user_profiles")
        .select("id, full_name, avatar_url, branch, year, rating")
        .in("id", Array.from(creatorIds));

      let allJoinedRides: any[] = [];

      // Process passenger rides
      if (!passengerError && passengerRidesData) {
        const passengerRides =
          passengerRidesData
            ?.filter((item: any) => item.carpool_rides !== null)
            .map((item: any) => {
              if (!item.carpool_rides) return null;

              const creatorProfile = (creatorProfiles || []).find(
                (profile) => profile.id === item.carpool_rides.ride_creator_id
              );

              return {
                id: item.carpool_rides.id,
                rideCreatorId: item.carpool_rides.ride_creator_id,
                rideCreatorName:
                  creatorProfile?.full_name ||
                  item.carpool_rides.ride_creator_name ||
                  "Unknown Creator",
                rideCreatorRating: creatorProfile?.rating || 4.5,
                rideCreatorPhoto:
                  creatorProfile?.avatar_url ||
                  getDriverPhoto(item.carpool_rides),
                rideCreatorBranch: creatorProfile?.branch || "Unknown",
                rideCreatorYear: creatorProfile?.year || "Unknown",
                rideCreatorPhone: item.carpool_rides.ride_creator_phone || "",
                from: item.carpool_rides.from_location,
                to: item.carpool_rides.to_location,
                departureTime: item.carpool_rides.departure_time,
                date: item.carpool_rides.departure_date,
                departure_date: item.carpool_rides.departure_date, // For isRideExpired function
                departure_time: item.carpool_rides.departure_time, // For isRideExpired function
                availableSeats: item.carpool_rides.available_seats,
                totalSeats: item.carpool_rides.total_seats,
                pricePerSeat: item.carpool_rides.price_per_seat,
                vehicleInfo: {
                  make: item.carpool_rides.vehicle_make || "Unknown",
                  model: item.carpool_rides.vehicle_model || "Car",
                  color: item.carpool_rides.vehicle_color || "Unknown",
                  isAC: item.carpool_rides.vehicle_ac || false,
                },
                route: item.carpool_rides.route || [],
                preferences: {
                  gender: item.carpool_rides.gender_preference || "any",
                  smokingAllowed: item.carpool_rides.smoking_allowed || false,
                  musicAllowed: item.carpool_rides.music_allowed || true,
                },
                status: item.carpool_rides.status || "active",
                passengers: [],
                pendingRequests: [],
                instantBooking: item.carpool_rides.instant_booking || false,
                chatEnabled: item.carpool_rides.chat_enabled || true,
                createdAt:
                  item.carpool_rides.created_at || new Date().toISOString(),
                userRole: "passenger", // Mark as passenger ride
                passengerStatus: item.status,
                seatsBooked: item.seats_booked,
              };
            })
            .filter(
              (ride): ride is NonNullable<typeof ride> => ride !== null
            ) || [];

        allJoinedRides = [...allJoinedRides, ...passengerRides];
      }

      // Process driver rides (rides created by the user)
      if (!driverError && driverRidesData) {
        const driverRides = driverRidesData.map((ride: any) => {
          const emailInfo = parseEmailInfo(
            ride.ride_creator_email || currentUser.email || ""
          );
          const academicYear = calculateAcademicYear(emailInfo.joiningYear);

          const creatorProfile = (creatorProfiles || []).find(
            (profile) => profile.id === ride.ride_creator_id
          );

          return {
            id: ride.id,
            rideCreatorId: ride.ride_creator_id,
            rideCreatorName:
              creatorProfile?.full_name || ride.ride_creator_name,
            rideCreatorRating: creatorProfile?.rating || 4.8,
            rideCreatorPhoto:
              creatorProfile?.avatar_url || getDriverPhoto(ride),
            rideCreatorBranch: creatorProfile?.branch || emailInfo.branchFull,
            rideCreatorYear: creatorProfile?.year || academicYear,
            rideCreatorPhone: ride.ride_creator_phone,
            from: ride.from_location,
            to: ride.to_location,
            departureTime: ride.departure_time,
            date: ride.departure_date,
            departure_date: ride.departure_date, // For isRideExpired function
            departure_time: ride.departure_time, // For isRideExpired function
            availableSeats: ride.available_seats,
            totalSeats: ride.total_seats,
            pricePerSeat: ride.price_per_seat,
            vehicleInfo: {
              make: ride.vehicle_make || "Unknown",
              model: ride.vehicle_model || "Unknown",
              color: ride.vehicle_color || "White",
              isAC: ride.is_ac,
            },
            route: [ride.from_location, ride.to_location],
            preferences: {
              gender: "any" as const,
              smokingAllowed: ride.smoking_allowed,
              musicAllowed: ride.music_allowed,
            },
            status: ride.status as
              | "active"
              | "full"
              | "completed"
              | "cancelled",
            passengers: [],
            pendingRequests: [],
            instantBooking: ride.instant_booking,
            chatEnabled: ride.chat_enabled,
            createdAt: ride.created_at,
            userRole: "driver", // Mark as driver ride
            passengerStatus: "driver", // Special status for driver
            seatsBooked: 0, // Driver doesn't book seats
          };
        });

        allJoinedRides = [...allJoinedRides, ...driverRides];
      }

      // Filter out expired rides using the same logic as main rides (30 minutes after departure)
      const nonExpiredJoinedRides = allJoinedRides.filter((ride) => {
        return !isRideExpired(ride);
      });

      // Sort by departure time (earliest first)
      nonExpiredJoinedRides.sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.departureTime}`);
        const dateB = new Date(`${b.date}T${b.departureTime}`);
        return dateA.getTime() - dateB.getTime();
      });

      setJoinedRides(nonExpiredJoinedRides);
    } catch (error) {
      console.error("Error fetching joined rides:", error);
      // Set empty array on error to prevent crashes
      setJoinedRides([]);
    }
  };

  // Fetch notifications from database
  const fetchNotifications = async () => {
    try {
      const { data: notificationsData, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        // If notifications table doesn't exist, just set empty array
        if (error.code === "42P01") {
          console.warn(
            "Notifications table not found. Please run setup-database.sql"
          );
          setNotifications([]);
          return;
        }
        // Handle network errors gracefully
        if (
          error.message.includes("Network request failed") ||
          error.message.includes("fetch")
        ) {
          console.warn(
            "Network error fetching notifications, using offline mode"
          );
          setNotifications([]);
          return;
        }
        console.error("Error fetching notifications:", error);
        return;
      }

      setNotifications(notificationsData || []);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Network request failed")
      ) {
        console.warn(
          "Network connectivity issue in fetchNotifications, using offline mode"
        );
        setNotifications([]);
      } else {
        console.error("Error in fetchNotifications:", error);
        setNotifications([]);
      }
    }
  };

  // Fetch user's ride history
  const fetchUserRideHistory = async () => {
    try {
      // Fetch rides where user is driver
      const { data: driverRides, error: driverError } = await supabase
        .from("carpool_rides")
        .select("*")
        .eq("ride_creator_id", currentUser.id)
        .order("created_at", { ascending: false });

      // Fetch rides where user is passenger
      const { data: passengerRides, error: passengerError } = await supabase
        .from("ride_passengers")
        .select(
          `
          *,
          carpool_rides (*)
        `
        )
        .eq("passenger_id", currentUser.id);

      let allRides: any[] = [];

      // Handle driver rides with network error handling
      if (driverError) {
        if (driverError.message.includes("Network request failed")) {
          console.warn("Network error fetching driver rides, using empty data");
        } else {
          console.error("Error fetching driver rides:", driverError);
        }
      } else if (driverRides) {
        allRides = [
          ...allRides,
          ...driverRides.map((ride) => ({ ...ride, userRole: "driver" })),
        ];
      }

      // Handle passenger rides with network error handling
      if (passengerError) {
        if (passengerError.message.includes("Network request failed")) {
          console.warn(
            "Network error fetching passenger rides, using empty data"
          );
        } else {
          console.error("Error fetching passenger rides:", passengerError);
        }
      } else if (passengerRides) {
        allRides = [
          ...allRides,
          ...passengerRides.map((p) => ({
            ...p.carpool_rides,
            userRole: "passenger",
            joinedAt: p.joined_at,
          })),
        ];
      }

      // Sort by date
      allRides.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setUserRideHistory(allRides);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Network request failed")
      ) {
        console.warn(
          "Network connectivity issue in fetchUserRideHistory, using offline mode"
        );
        setUserRideHistory([]);
      } else {
        console.error("Error fetching ride history:", error);
        setUserRideHistory([]);
      }
    }
  };

  useEffect(() => {
    fetchRides();
    fetchNotifications();
    fetchUserRideHistory();
    socketService.connect(currentUser.id);

    // Initialize push notifications
    PushNotificationService.initializePushNotifications(currentUser.id)
      .catch((err) => console.warn("Push notification setup failed:", err))
      .then((token) => {
        if (token) {
          console.log("Push notifications initialized with token:", token);
        }
      })
      .catch((error) => {
        console.error("Failed to initialize push notifications:", error);
      });

    // Set up notification listeners
    const cleanup = PushNotificationService.setupNotificationListeners(
      (notification) => {
        console.log("Notification received:", notification);
        // Refresh notifications when received
        fetchNotifications();
      },
      (response) => {
        console.log("Notification tapped:", response);
        // Handle notification tap - could navigate to specific screen
        const notificationData = response.notification.request.content.data;
        if (notificationData?.type === "ride_request") {
          setShowNotifications(true);
        }
      }
    );

    // Set up real-time subscription for notifications
    const notificationSubscription = supabase
      .channel("notifications_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${currentUser.id}`,
        },
        (payload) => {
          console.log("Notification change:", payload);
          // Refresh notifications on any change
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      socketService.disconnect();
      cleanup();
      notificationSubscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Apply search filter to available rides
    const searchFiltered = rides.filter(
      (ride) =>
        (ride.from || "")
          .toLowerCase()
          .includes((searchQuery || "").toLowerCase()) ||
        (ride.to || "")
          .toLowerCase()
          .includes((searchQuery || "").toLowerCase())
    );

    // Apply advanced filters using the utility function
    const advancedFiltered = applyAdvancedFilters(searchFiltered, filters);
    setFilteredRides(advancedFiltered);

    // Also filter expired rides
    const filteredExpired = allExpiredRides.filter(
      (ride) =>
        (ride.from || "")
          .toLowerCase()
          .includes((searchQuery || "").toLowerCase()) ||
        (ride.to || "")
          .toLowerCase()
          .includes((searchQuery || "").toLowerCase())
    );
    setExpiredRides(filteredExpired);
  }, [searchQuery, rides, allExpiredRides, filters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchRides(),
      fetchNotifications(),
      fetchUserRideHistory(),
    ]);
    setRefreshing(false);
  };

  // Function to flush all data - can be called from profile
  const flushAllData = async () => {
    setRides([]);
    setFilteredRides([]);
    setNotifications([]);
    setUserRideHistory([]);
    await handleRefresh();
  };

  // Manual cleanup function for expired rides and old data
  const handleManualCleanup = async () => {
    try {
      setLoading(true);
      const results = await cleanupOldData(supabase);

      Alert.alert(
        "Cleanup Complete! 🧹",
        `Deleted:\n• ${results.deletedRides} expired rides\n• Old notifications and messages\n• Rejected ride requests`,
        [
          {
            text: "OK",
            onPress: () => handleRefresh(),
          },
        ]
      );
    } catch (error) {
      console.error("Error during manual cleanup:", error);
      Alert.alert("Error", "Failed to cleanup data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Alternative: Mark expired rides as completed instead of deleting
  const handleMarkExpiredAsCompleted = async () => {
    try {
      setLoading(true);
      const count = await markExpiredRidesAsCompleted(supabase);

      if (count > 0) {
        Alert.alert(
          "Rides Updated! ✅",
          `Marked ${count} expired rides as completed`,
          [
            {
              text: "OK",
              onPress: () => handleRefresh(),
            },
          ]
        );
      } else {
        Alert.alert("Info", "No expired rides found to update");
      }
    } catch (error) {
      console.error("Error marking expired rides:", error);
      Alert.alert("Error", "Failed to update expired rides. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle notification clicks
  const handleNotificationClick = async (notification: any) => {
    try {
      if (notification.type === "join_request") {
        // For join request notifications, show the request acceptance modal
        const requestId = notification.data?.requestId;
        if (requestId) {
          // Fetch the full request details
          const { data: requestData, error } = await supabase
            .from("join_requests")
            .select(
              `
              *,
              carpool_rides(from_location, to_location, departure_time)
            `
            )
            .eq("id", requestId)
            .single();

          if (error || !requestData) {
            Alert.alert("Error", "Could not fetch request details");
            return;
          }

          // Transform data for the modal
          const transformedRequest = {
            id: requestData.id,
            passengerId: requestData.passenger_id,
            passengerName: requestData.passenger_name,
            passengerEmail: requestData.passenger_email,
            rideId: requestData.ride_id,
            from: requestData.carpool_rides.from_location,
            to: requestData.carpool_rides.to_location,
            departureTime: requestData.carpool_rides.departure_time,
            requestMessage: requestData.message,
            createdAt: requestData.created_at,
          };

          setSelectedJoinRequest(transformedRequest);
          setShowRequestAcceptance(true);

          // Mark notification as read
          await NotificationService.markAsRead(notification.id);
          fetchNotifications(); // Refresh notifications
        }
      }
    } catch (error) {
      console.error("Error handling notification:", error);
    }
  };

  // Handle request acceptance/rejection from modal
  const handleRequestHandled = (
    requestId: string,
    action: "accepted" | "rejected"
  ) => {
    setShowRequestAcceptance(false);
    setSelectedJoinRequest(null);
    // Refresh data
    handleRefresh();
  };

  const handleApplyFilters = (newFilters: FilterOptions) => {
    setFilters(newFilters);
    // Apply both search and advanced filters to rides
    const searchFiltered = rides.filter(
      (ride) =>
        (ride.from || "")
          .toLowerCase()
          .includes((searchQuery || "").toLowerCase()) ||
        (ride.to || "")
          .toLowerCase()
          .includes((searchQuery || "").toLowerCase())
    );

    // Apply advanced filters using the utility function
    const advancedFiltered = applyAdvancedFilters(searchFiltered, newFilters);
    setFilteredRides(advancedFiltered);
  };

  const handleJoinRide = (rideId: string) => {
    const ride = rides.find((r) => r.id === rideId);
    if (ride) {
      setSelectedRideForJoin(ride);
      setSeatsToBook(1);
      setJoinMessage("");
      if (ride.instantBooking) {
        setShowJoinVerification(true);
      } else {
        setShowJoinRequestModal(true);
      }
    }
  };

  const confirmJoinRide = async () => {
    if (!selectedRideForJoin) return;

    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        Alert.alert("Error", "You must be logged in to join a ride");
        return;
      }

      // Check if user has already joined this ride
      const { data: existingPassenger } = await supabase
        .from("ride_passengers")
        .select("id")
        .eq("ride_id", selectedRideForJoin.id)
        .eq("passenger_id", user.id)
        .single();

      if (existingPassenger) {
        Alert.alert("Info", "You have already joined this ride!");
        return;
      }

      // Check if user has already sent a request for this ride
      const { data: existingRequest } = await supabase
        .from("join_requests")
        .select("id, status")
        .eq("ride_id", selectedRideForJoin.id)
        .eq("passenger_id", user.id)
        .single();

      if (existingRequest) {
        if (existingRequest.status === "pending") {
          Alert.alert("Info", "You have already sent a request for this ride!");
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

      if (selectedRideForJoin.instantBooking) {
        // Use the new instant booking API function
        const { data: bookingResult, error: bookingError } = await supabase.rpc(
          "handle_instant_booking",
          {
            p_ride_id: selectedRideForJoin.id,
            p_passenger_id: user.id,
            p_passenger_name:
              user.user_metadata?.full_name ||
              user.email?.split("@")[0] ||
              "Passenger",
            p_passenger_email: user.email,
            p_seats_requested: seatsToBook,
            p_pickup_location: null,
            p_dropoff_location: null,
          }
        );

        if (bookingError || !bookingResult?.success) {
          console.error("Error with instant booking:", bookingError);
          Alert.alert(
            "Error",
            bookingResult?.error || "Failed to join ride. Please try again."
          );
          return;
        }

        Alert.alert("Success", "You have successfully joined the ride!");
      } else {
        // For request-based booking, create a join request
        const { data: requestData, error: requestError } = await supabase
          .from("join_requests")
          .insert([
            {
              ride_id: selectedRideForJoin.id,
              passenger_id: user.id,
              passenger_name:
                user.user_metadata?.full_name ||
                user.email?.split("@")[0] ||
                "Passenger",
              passenger_email: user.email,
              seats_requested: seatsToBook,
              message: joinMessage,
              status: "pending",
              created_at: new Date().toISOString(),
            },
          ])
          .select();

        if (requestError || !requestData || requestData.length === 0) {
          console.error("Error creating join request:", requestError);
          Alert.alert(
            "Error",
            "Failed to send join request. Please try again."
          );
          return;
        }

        // Send notification to driver about the join request
        await NotificationService.notifyJoinRequest(
          selectedRideForJoin.rideCreatorId,
          user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "Passenger",
          selectedRideForJoin.id,
          requestData[0].id,
          selectedRideForJoin.from,
          selectedRideForJoin.to
        );

        Alert.alert(
          "Request Sent",
          "Your join request has been sent to the driver. You'll be notified when they respond."
        );
      }

      // Refresh all data
      await handleRefresh();

      setShowJoinRequestModal(false);
      setShowJoinVerification(false);
      setSelectedRideForJoin(null);
      setJoinMessage("");
      setSeatsToBook(1);
    } catch (error) {
      console.error("Error in confirmJoinRide:", error);
      Alert.alert("Error", "Failed to process your request. Please try again.");
    }
  };

  const handleContactDriver = (ride: CarpoolRide) => {
    Alert.alert(
      "Contact Ride Creator",
      `How would you like to contact ${ride.rideCreatorName}?`,
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
          onPress: () => {
            // Check if user can chat (same logic as handleStartChat)
            const isRideCreator = ride.rideCreatorId === currentUser.id;
            const hasJoinedRide = ride.passengers.some(
              (p) => p.id === currentUser.id && p.status === "accepted"
            );
            const hasAcceptedRequest = ride.pendingRequests?.some(
              (r) => r.passengerId === currentUser.id && r.status === "accepted"
            );

            if (!isRideCreator && !hasJoinedRide && !hasAcceptedRequest) {
              Alert.alert(
                "Chat Not Available",
                "You can only chat after joining the ride. Please send a join request first."
              );
            } else {
              handleStartChat(ride.id, `${ride.from} → ${ride.to}`);
            }
          },
        },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleStartChat = (rideId: string, rideTitle: string) => {
    // Check if user has joined the ride or is the ride creator
    const ride =
      rides.find((r) => r.id === rideId) ||
      joinedRides.find((r) => r.id === rideId);
    if (!ride) {
      Alert.alert("Error", "Ride not found");
      return;
    }

    const isRideCreator = ride.rideCreatorId === currentUser.id;
    const hasJoinedRide = ride.passengers.some(
      (p) => p.id === currentUser.id && p.status === "accepted"
    );
    const hasAcceptedRequest = ride.pendingRequests?.some(
      (r) => r.passengerId === currentUser.id && r.status === "accepted"
    );

    if (!isRideCreator && !hasJoinedRide && !hasAcceptedRequest) {
      Alert.alert(
        "Chat Not Available",
        "You can only chat after joining the ride. Please send a join request first.",
        [{ text: "OK" }]
      );
      return;
    }

    // Opening chat for ride
    setSelectedRideId(rideId);
    setChatRideId(rideId);
    setChatRideTitle(rideTitle);
    setShowChat(true);
  };

  const handleCreateRide = async () => {
    // Check daily ride creation limit
    const canCreateRide = await checkDailyRideLimit(currentUser.id);

    if (!canCreateRide) {
      Alert.alert(
        "Daily Limit Reached",
        `You can only create 2 rides per day. You've already created ${userCreatedRidesCount} ride(s) today.`,
        [{ text: "OK" }]
      );
      return;
    }

    setShowCreateRide(true);
  };

  const handleRideCreated = (rideData: any) => {
    // Transform database ride data to UI format
    const transformedRide: CarpoolRide = {
      id: rideData.id || `ride_${Date.now()}`,
      rideCreatorId: rideData.ride_creator_id || currentUser.id,
      rideCreatorName: rideData.ride_creator_name || currentUser.name,
      rideCreatorRating: 4.5,
      rideCreatorPhoto: rideData.ride_creator_photo || currentUser.photo,
      rideCreatorBranch: currentUser.branch,
      rideCreatorYear: currentUser.year,
      from: rideData.from_location || rideData.from,
      to: rideData.to_location || rideData.to,
      departureTime: rideData.departure_time || `${formatTime(rideData.time)}`,
      date: rideData.departure_date || formatDate(rideData.date),
      availableSeats: rideData.available_seats || rideData.availableSeats,
      totalSeats: rideData.total_seats || rideData.availableSeats,
      pricePerSeat: rideData.price_per_seat || rideData.pricePerSeat,
      vehicleInfo: {
        make: rideData.vehicle_make || "Car",
        model: rideData.vehicle_model || "Model",
        color: rideData.vehicle_color || "White",
        isAC: rideData.is_ac !== undefined ? rideData.is_ac : true,
      },
      route: [
        rideData.from_location || rideData.from,
        rideData.to_location || rideData.to,
      ],
      preferences: {
        smokingAllowed:
          rideData.smoking_allowed !== undefined
            ? rideData.smoking_allowed
            : false,
        musicAllowed:
          rideData.music_allowed !== undefined ? rideData.music_allowed : true,
      },
      status: rideData.status || "active",
      passengers: [],
      pendingRequests: [],
      instantBooking:
        rideData.instant_booking !== undefined
          ? rideData.instant_booking
          : false,
      chatEnabled:
        rideData.chat_enabled !== undefined ? rideData.chat_enabled : true,
      createdAt: rideData.created_at || new Date().toISOString(),
    };

    setRides((prev) => [transformedRide, ...prev]);
    setFilteredRides((prev) => [transformedRide, ...prev]);
    setShowCreateRide(false);
    handleRefresh(); // Refresh all data including ride history
  };

  const handleRideCardPress = (ride: CarpoolRide) => {
    // Disabled ride details viewing as requested
    // if (!enableRideDetails) {
    //   return;
    // }
    setSelectedRideId(ride.id);
    setShowRideDetails(true);
  };

  const handleBackFromDetails = () => {
    setShowRideDetails(false);
    setSelectedRideId(null);
  };

  const handleDeleteRide = (ride: CarpoolRide) => {
    Alert.alert(
      "Delete Ride",
      `Are you sure you want to delete the ride from ${ride.from} to ${ride.to}?\n\nThis action cannot be undone. All passengers will be notified.`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Cancel Ride",
          style: "default",
          onPress: () => confirmDeleteRide(ride.id, "soft"),
        },
        {
          text: "Delete Permanently",
          style: "destructive",
          onPress: () => confirmDeleteRide(ride.id, "hard"),
        },
      ]
    );
  };

  const confirmDeleteRide = async (
    rideId: string,
    deleteType: "soft" | "hard"
  ) => {
    try {
      setLoading(true);
      // Attempting ride deletion

      let result;
      if (deleteType === "hard") {
        result = await rideManagementAPI.deleteRideWithCleanup(rideId);
      } else {
        result = await rideManagementAPI.cancelRideWithReason(
          rideId,
          "Cancelled by driver"
        );
      }

      if (result.error) {
        Alert.alert("Error", result.error);
        return;
      }

      // Show success message
      Alert.alert(
        "Success",
        deleteType === "hard"
          ? "Ride deleted permanently!"
          : "Ride cancelled successfully!"
      );

      // Remove ride from local state
      setRides((prev) => prev.filter((r) => r.id !== rideId));
      setFilteredRides((prev) => prev.filter((r) => r.id !== rideId));

      // Refresh data to ensure consistency
      await handleRefresh();
    } catch (error: any) {
      console.error("Error deleting ride:", error);
      Alert.alert("Error", error.message || "Failed to delete ride");
    } finally {
      setLoading(false);
    }
  };

  const renderExpiredRideCard = (ride: CarpoolRide) => {
    const isDriverCurrentUser = ride.rideCreatorId === currentUser.id;

    return (
      <TouchableOpacity
        key={ride.id}
        style={[
          styles.jobCard,
          {
            backgroundColor: isDarkMode ? "#2A2A2A" : "#F9F9F9",
            borderWidth: 2,
            borderColor: isDarkMode ? "#444" : "#E5E5E5",
            opacity: 0.8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 1,
          },
        ]}
        onPress={() => handleRideCardPress(ride)}
      >
        {/* Header with toggle and company name */}
        <View style={styles.jobHeader}>
          <View style={styles.companyInfo}>
            <Text
              style={[
                styles.companyName,
                { color: isDarkMode ? "#888" : "#666" },
              ]}
            >
              LNMIIT Carpool
            </Text>
            <Text
              style={[styles.jobTitle, { color: isDarkMode ? "#666" : "#999" }]}
            >
              {ride.from} → {ride.to}
            </Text>
          </View>
          <View style={styles.toggleContainer}>
            <View style={[styles.toggle, { backgroundColor: "#888" }]}>
              <View style={styles.toggleButton} />
            </View>
          </View>
        </View>

        {/* Job tags/skills - Expired style */}
        <View style={styles.tagsContainer}>
          <View style={[styles.tag, { backgroundColor: "#FF5722" + "20" }]}>
            <Text style={[styles.tagText, { color: "#FF5722" }]}>
              ⏰ EXPIRED
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: "#888" + "20" }]}>
            <Text style={[styles.tagText, { color: "#888" }]}>
              ₹{ride.pricePerSeat}
            </Text>
          </View>
          <View style={[styles.tag, { backgroundColor: "#888" + "20" }]}>
            <Text style={[styles.tagText, { color: "#888" }]}>
              {formatTime(ride.departureTime)}
            </Text>
          </View>
        </View>

        {/* Driver avatars and time */}
        <View style={styles.bottomSection}>
          <View style={styles.avatarsContainer}>
            <Avatar.Image
              size={32}
              source={{ uri: ride.rideCreatorPhoto }}
              style={[styles.driverAvatar, { opacity: 0.7 }]}
            />
            {ride.passengers.slice(0, 2).map((passenger, index) => (
              <Avatar.Image
                key={passenger.id}
                size={32}
                source={{ uri: passenger.photo }}
                style={[
                  styles.passengerAvatar,
                  { marginLeft: -8, opacity: 0.7 },
                ]}
              />
            ))}
            {ride.passengers.length > 2 && (
              <View style={[styles.morePassengers, { opacity: 0.7 }]}>
                <Text style={styles.morePassengersText}>
                  +{ride.passengers.length - 2}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.timeAgo, { color: "#888" }]}>
            {new Date(ride.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Expired status */}
        <View style={styles.jobActionButtons}>
          <View
            style={[
              styles.joinedBtn,
              { backgroundColor: "#FF5722" + "20", flex: 1 },
            ]}
          >
            <Text style={[styles.joinedBtnText, { color: "#FF5722" }]}>
              🚫 Ride Expired
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Clean and modern joined ride card
  const renderJoinedRideCircle = (ride: any, index: number) => {
    const isDriver = ride.userRole === "driver";

    const colors = isDarkMode
      ? {
          bg: "#1F2937",
          border: isDriver ? "#3B82F6" : "#10B981",
          text: "#FFFFFF",
          subtext: "#D1D5DB",
          shadow: "#000000",
        }
      : {
          bg: "#FFFFFF",
          border: isDriver ? "#3B82F6" : "#10B981",
          text: "#1F2937",
          subtext: "#6B7280",
          shadow: "#000000",
        };

    // Clean gradient colors
    const gradientColors: [string, string, ...string[]] = isDriver
      ? ["#3B82F6", "#2563EB", "#1D4ED8"] // Clean blue gradient for driver
      : ride.passengerStatus === "confirmed"
      ? ["#10B981", "#059669", "#047857"] // Clean green gradient for confirmed passenger
      : ["#F59E0B", "#D97706", "#B45309"]; // Clean amber gradient for pending

    return (
      <View
        key={ride.id}
        style={[
          styles.joinedRideCircle,
          {
            backgroundColor: colors.bg,
            borderColor: colors.border,
            borderWidth: 2,
            shadowColor: colors.shadow,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          },
        ]}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          onPress={() => handleStartChat(ride.id, `${ride.from} → ${ride.to}`)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={gradientColors}
            style={styles.joinedRideGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.joinedRideContent}>
              {/* Clean role indicator */}
              <View style={styles.roleIndicator}>
                <Text style={styles.roleText}>{isDriver ? "🚗" : "👤"}</Text>
              </View>

              <Text style={styles.joinedRideTime}>
                {formatTime(ride.departureTime)}
              </Text>
              <Text style={styles.joinedRidePrice}>₹{ride.pricePerSeat}</Text>

              {/* Clean status indicator */}
              <Text style={styles.statusIndicator}>
                {isDriver
                  ? "Creator"
                  : ride.passengerStatus === "confirmed"
                  ? "Joined"
                  : "Pending"}
              </Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  const renderJobStyleCard = (ride: CarpoolRide) => {
    const isDriverCurrentUser = ride.rideCreatorId === currentUser.id;
    const currentPassenger = ride.passengers.find(
      (p) => p.id === currentUser.id
    );

    // Check if user has a pending or accepted request
    const currentRequest = ride.pendingRequests?.find(
      (r) => r.passengerId === currentUser.id
    );

    const hasJoined =
      !!currentPassenger || currentRequest?.status === "accepted";
    const isPending =
      currentPassenger?.status === "pending" ||
      currentRequest?.status === "pending";
    const isAccepted =
      currentPassenger?.status === "accepted" ||
      currentRequest?.status === "accepted";

    // Status tracking for debugging when needed

    // Calculate expiry information
    const expiryInfo = calculateRideExpiry(ride.departureTime);

    const cardColors = [
      { bg: "#E8F5E9", accent: "#4CAF50", border: "#C8E6C9" }, // Light green theme
      { bg: "#FFF3E0", accent: "#FF9800", border: "#FFE0B2" }, // Light orange theme
      { bg: "#E3F2FD", accent: "#2196F3", border: "#BBDEFB" }, // Light blue theme
      { bg: "#F3E5F5", accent: "#9C27B0", border: "#E1BEE7" }, // Light purple theme
      { bg: "#FCE4EC", accent: "#E91E63", border: "#F8BBD9" }, // Light pink theme
      { bg: "#FFF8E1", accent: "#FFC107", border: "#FFECB3" }, // Light amber theme
    ];
    const colorIndex = ride.id
      ? (parseInt(ride.id.slice(-1)) || 0) % cardColors.length
      : 0;
    const colors = cardColors[colorIndex] || cardColors[0];

    return (
      <TouchableOpacity
        key={ride.id}
        style={[
          styles.jobCard,
          {
            backgroundColor: colors.bg,
            borderWidth: 2,
            borderColor: colors.border,
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          },
        ]}
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
            {/* Delete button - only show for driver */}
            {isDriverCurrentUser && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation(); // Prevent card press
                  handleDeleteRide(ride);
                }}
                style={{
                  backgroundColor: "#FF4444",
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 12,
                  marginRight: 8,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                <X size={14} color="#FFF" />
                <Text
                  style={{
                    color: "#FFF",
                    fontSize: 10,
                    fontWeight: "600",
                  }}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            )}
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
              {formatTime(ride.departureTime)}
            </Text>
          </View>
          {ride.instantBooking && (
            <View style={[styles.tag, { backgroundColor: "#4CAF50" + "20" }]}>
              <Text style={[styles.tagText, { color: "#4CAF50" }]}>
                ⚡ Instant
              </Text>
            </View>
          )}
          {ride.pendingRequests.length > 0 &&
            ride.rideCreatorId === currentUser.id && (
              <View style={[styles.tag, { backgroundColor: "#FF9800" + "20" }]}>
                <Text style={[styles.tagText, { color: "#FF9800" }]}>
                  📩 {ride.pendingRequests.length} Request
                  {ride.pendingRequests.length > 1 ? "s" : ""}
                </Text>
              </View>
            )}
          {ride.chatEnabled && (
            <View style={[styles.tag, { backgroundColor: "#2196F3" + "20" }]}>
              <Text style={[styles.tagText, { color: "#2196F3" }]}>
                💬 Chat
              </Text>
            </View>
          )}
          {hasJoined && (
            <View style={[styles.statusBadge, { backgroundColor: "#4CAF50" }]}>
              <Text style={styles.statusBadgeText}>✓ Joined</Text>
            </View>
          )}
          {isPending && (
            <View style={[styles.statusBadge, { backgroundColor: "#FF9800" }]}>
              <Text style={styles.statusBadgeText}>⏳ Pending</Text>
            </View>
          )}
        </View>

        {/* Expiry and availability section */}
        <View style={styles.applicantsSection}>
          <Clock size={16} color="#666" />
          <Text style={styles.applicantsText}>
            {ride.availableSeats > 0
              ? `${ride.availableSeats} seats available`
              : "Ride is full"}
            {ride.passengers.length > 0 &&
              ` • ${ride.passengers.length} joined`}
          </Text>
        </View>

        {/* Expiry information */}
        <View style={styles.expirySection}>
          {expiryInfo.isExpired ? (
            <View style={styles.expiredTag}>
              <AlertCircle size={14} color="#F44336" />
              <Text style={styles.expiredText}>Expired</Text>
            </View>
          ) : (
            <View style={styles.expiryTag}>
              <Timer size={14} color="#FF9800" />
              <Text style={styles.expiryText}>
                Expires in {expiryInfo.timeUntilExpiry}
              </Text>
            </View>
          )}
          <Text style={styles.startTimeText}>
            Starts in {expiryInfo.timeUntilStart}
          </Text>
        </View>

        {/* Driver avatars and time */}
        <View style={styles.bottomSection}>
          <View style={styles.avatarsContainer}>
            <Avatar.Image
              size={32}
              source={{ uri: ride.rideCreatorPhoto }}
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
          {!isDriverCurrentUser &&
            !hasJoined &&
            !isPending &&
            ride.availableSeats > 0 && (
              <>
                <TouchableOpacity
                  style={[
                    styles.modernContactBtn,
                    { borderColor: colors.accent },
                  ]}
                  onPress={() => handleContactDriver(ride)}
                >
                  <Phone size={16} color={colors.accent} />
                  <Text
                    style={[
                      styles.modernContactBtnText,
                      { color: colors.accent },
                    ]}
                  >
                    Contact
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.modernJoinBtn,
                    { backgroundColor: colors.accent },
                  ]}
                  onPress={() => handleJoinRide(ride.id)}
                >
                  <UserCheck size={18} color="#FFFFFF" />
                  <Text style={styles.modernJoinBtnText}>
                    {ride.instantBooking ? "Book Now" : "Request Join"}
                  </Text>
                </TouchableOpacity>
              </>
            )}

          {(hasJoined || isDriverCurrentUser) && ride.chatEnabled && (
            <TouchableOpacity
              style={[styles.chatBtn, { backgroundColor: "#2196F3" }]}
              onPress={() =>
                handleStartChat(ride.id, `${ride.from} → ${ride.to}`)
              }
            >
              <MessageCircle size={16} color="#FFFFFF" />
              <Text style={styles.chatBtnText}>Chat with Group</Text>
            </TouchableOpacity>
          )}

          {isAccepted && !hasJoined && (
            <View
              style={[
                styles.fullWidthStatusBtn,
                { backgroundColor: colors.accent },
              ]}
            >
              <Text style={styles.fullWidthStatusText}>✓ Request Accepted</Text>
            </View>
          )}

          {hasJoined && currentPassenger?.status === "confirmed" && (
            <View
              style={[
                styles.fullWidthStatusBtn,
                { backgroundColor: "#4CAF50" },
              ]}
            >
              <Text style={styles.fullWidthStatusText}>✓ Joined Ride</Text>
            </View>
          )}

          {isPending && !isAccepted && (
            <View
              style={[
                styles.fullWidthStatusBtn,
                { backgroundColor: "#FF9800" },
              ]}
            >
              <Text style={styles.fullWidthStatusText}>
                ⏳ Pending Approval
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const unreadNotifications = notifications.filter((n) => !n.read).length;

  const sidebarCategories = [
    {
      key: "instructions",
      label: "App Instructions",
      count: "Help",
      color: "#4CAF50",
      icon: "📖",
    },
    {
      key: "notifications",
      label: "Notifications",
      count: `${unreadNotifications}`,
      color: "#FF5722",
      icon: "🔔",
    },
    {
      key: "bus_schedule",
      label: "Bus Schedule",
      count: "Live",
      color: "#FEF3C7",
      icon: "🚌",
    },
    {
      key: "create",
      label: "Create Ride",
      count: "New",
      color: "#2196F3",
      icon: "➕",
    },
    {
      key: "profile",
      label: "My Profile",
      count: "View",
      color: "#8B5CF6",
      icon: "👤",
    },
    {
      key: "history",
      label: "My History",
      count: `${userRideHistory.length}`,
      color: "#9C27B0",
      icon: "📋",
    },
  ];

  const [showRideHistory, setShowRideHistory] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  return (
    <>
      {/* Main Container */}
      <View
        style={[
          styles.container,
          { backgroundColor: isDarkMode ? "#000" : "#F5F7FA" },
        ]}
      >
        {/* Enhanced Search Bar with Menu and Notifications */}
        <View style={styles.searchContainer}>
          {/* Modern Sidebar Menu with Purple Background */}
          <TouchableOpacity
            onPress={onToggleSidebar}
            style={[
              styles.modernMenuBtn,
              {
                backgroundColor: isDarkMode ? "#9C27B0" : "#BA68C8",
                shadowColor: "#9C27B0",
              },
            ]}
          >
            <Menu size={22} color="#FFFFFF" />
          </TouchableOpacity>

          <View
            style={[
              styles.enhancedSearchWrapper,
              {
                backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                borderColor: isDarkMode ? "#333" : "#E5E7EB",
                shadowColor: isDarkMode ? "#000" : "#000",
              },
            ]}
          >
            <Search
              size={18}
              color={isDarkMode ? "#9CA3AF" : "#6B7280"}
              style={styles.searchIcon}
            />
            <TextInput
              placeholder="Search..."
              placeholderTextColor={isDarkMode ? "#6B7280" : "#9CA3AF"}
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={[
                styles.enhancedSearchInput,
                { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
              ]}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearButton}
              >
                <X size={16} color={isDarkMode ? "#6B7280" : "#9CA3AF"} />
              </TouchableOpacity>
            )}
          </View>

          {/* Modern Notification Bell with Yellow Background */}
          <TouchableOpacity
            style={[
              styles.modernNotificationIcon,
              {
                backgroundColor: isDarkMode ? "#FFC107" : "#FFD54F",
                shadowColor: "#FFC107",
              },
            ]}
            onPress={() => setShowNotifications(true)}
          >
            <Bell size={18} color="#FFFFFF" />
            {unreadNotifications > 0 && (
              <View style={styles.modernNotificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadNotifications > 9 ? "9+" : unreadNotifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Modern Filter Icon with Blue Background */}
          <TouchableOpacity
            style={[
              styles.modernFilterIcon,
              {
                backgroundColor: isDarkMode ? "#2196F3" : "#42A5F5",
                shadowColor: "#2196F3",
              },
            ]}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Single Unified ScrollView with Slide-up Effect */}
        <ScrollView
          style={styles.mainScrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#000000"]}
              tintColor={isDarkMode ? "#FFF" : "#000"}
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: mainScrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          stickyHeaderIndices={joinedRides.length > 0 ? [1] : [0]}
        >
          {/* Joined Rides Section that slides up */}
          {joinedRides.length > 0 && (
            <View style={styles.joinedRidesSection}>
              <View style={styles.joinedRidesSectionHeader}>
                <View style={styles.sectionTitleContainer}>
                  <Text
                    style={[
                      styles.joinedRidesSectionTitle,
                      { color: isDarkMode ? "#FFF" : "#000" },
                    ]}
                  >
                    My Joined Rides
                  </Text>
                  <View
                    style={[
                      styles.rideCountBadge,
                      { backgroundColor: isDarkMode ? "#4CAF50" : "#4CAF50" },
                    ]}
                  >
                    <Text style={styles.rideCountText}>
                      {joinedRides.length}
                    </Text>
                  </View>
                </View>
                <Text
                  style={[
                    styles.joinedRidesSectionSubtitle,
                    { color: isDarkMode ? "#CCC" : "#666" },
                  ]}
                >
                  Tap to open group chat
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.joinedRidesScrollView}
                contentContainerStyle={styles.joinedRidesContainer}
                decelerationRate="fast"
                snapToInterval={96} // Adjusted for circular cards (80px + 16px margin)
                snapToAlignment="start"
                bounces={true}
                bouncesZoom={false}
                pagingEnabled={false}
                scrollEventThrottle={16}
                contentInset={{ left: 0, right: 20 }}
                directionalLockEnabled={true}
              >
                {joinedRides.map((ride, index) =>
                  renderJoinedRideCircle(ride, index)
                )}

                {/* Add ride prompt at the end */}
                <TouchableOpacity
                  style={[
                    styles.addRidePrompt,
                    {
                      backgroundColor: isDarkMode
                        ? "rgba(76, 175, 80, 0.15)"
                        : "rgba(76, 175, 80, 0.1)",
                      borderColor: isDarkMode
                        ? "rgba(76, 175, 80, 0.6)"
                        : "rgba(76, 175, 80, 0.5)",
                    },
                  ]}
                  onPress={() => {
                    console.log("Add Ride button pressed");
                    handleCreateRide();
                  }}
                  activeOpacity={0.6}
                >
                  <Plus size={32} color="#4CAF50" strokeWidth={3} />
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Sticky Available Rides Header */}
          <View
            style={[
              styles.stickyHeader,
              {
                backgroundColor: isDarkMode ? "#000" : "#F5F7FA",
                borderBottomColor: isDarkMode ? "#333" : "#E5E7EB",
              },
            ]}
          >
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
          {/* Scrollable Content Below Sticky Header */}
          <View style={styles.scrollableContent}>
            {/* Quick Tips */}
            {!searchQuery &&
              filteredRides.length === 0 &&
              joinedRides.length === 0 && (
                <View style={styles.quickTips}>
                  <Text
                    style={[
                      styles.tipsTitle,
                      { color: isDarkMode ? "#FFF" : "#000" },
                    ]}
                  >
                    💡 Quick Tips
                  </Text>
                  <Text
                    style={[
                      styles.tipsText,
                      { color: isDarkMode ? "#CCC" : "#666" },
                    ]}
                  >
                    • Try searching for specific locations like "Railway
                    Station"
                    {"\n"}• Create your own ride to build your network{"\n"}•
                    Use destinations like "Railway Station", "Airport", or
                    "Mall"
                  </Text>
                </View>
              )}

            {/* Available Rides List */}
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
          </View>

          {/* Quick Actions Section */}
          <Text
            style={[
              styles.sectionTitle,
              {
                color: isDarkMode ? "#FFF" : "#000",
                marginTop: 32,
                marginHorizontal: 16,
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
                  category.key === "bus_schedule" && styles.busThemeCard,
                ]}
                onPress={() => {
                  if (category.key === "instructions") {
                    setShowInstructions(true);
                  } else if (category.key === "create") {
                    handleCreateRide();
                  } else if (category.key === "notifications") {
                    setShowNotifications(true);
                  } else if (category.key === "history") {
                    setShowRideHistory(true);
                  } else if (category.key === "bus_schedule") {
                    // Show bus booking system
                    onShowBusBooking();
                  } else if (category.key === "profile") {
                    // Show profile screen
                    onShowProfile();
                  }
                }}
              >
                {/* Bus stripe pattern for bus_schedule card */}
                {category.key === "bus_schedule" && (
                  <View style={styles.busStripes}>
                    <View style={styles.busStripe} />
                    <View style={styles.busStripe} />
                    <View style={styles.busStripe} />
                  </View>
                )}
                <Text style={styles.categoryCardEmoji}>{category.icon}</Text>
                <Text
                  style={[
                    styles.categoryCardTitle,
                    category.key === "bus_schedule" && { color: "#000000" },
                  ]}
                >
                  {category.label}
                </Text>
                <Text
                  style={[
                    styles.categoryCardCount,
                    category.key === "bus_schedule" && { color: "#000000" },
                  ]}
                >
                  {category.key === "create"
                    ? category.count
                    : `${category.count} available`}
                </Text>
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
      {showRideDetails && selectedRideId && (
        <RideDetailsScreen
          rideId={selectedRideId}
          currentUser={currentUser}
          visible={showRideDetails}
          onBack={handleBackFromDetails}
          onJoinRide={handleJoinRide}
          onStartChat={handleStartChat}
        />
      )}

      {/* Create Ride Screen */}
      <CreateRideScreen
        visible={showCreateRide}
        onBack={() => setShowCreateRide(false)}
        onRideCreated={handleRideCreated}
        isDarkMode={isDarkMode}
      />

      {showChat && (
        <Modal
          visible={showChat}
          transparent={false}
          animationType="slide"
          onRequestClose={() => setShowChat(false)}
        >
          <SecureChatSystem
            rideId={chatRideId}
            currentUser={currentUser}
            rideDetails={{
              from: "LNMIIT Campus",
              to: "Jaipur Railway Station",
              driverName: "Ride Creator",
              departureTime: "2:30 PM",
            }}
            onBack={() => setShowChat(false)}
            isDarkMode={isDarkMode}
          />
        </Modal>
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
                      source={{ uri: selectedRideForJoin.rideCreatorPhoto }}
                      style={styles.driverVerificationAvatar}
                    />
                    <View style={styles.driverVerificationDetails}>
                      <Text
                        style={[
                          styles.driverVerificationName,
                          { color: isDarkMode ? "#FFFFFF" : "#000000" },
                        ]}
                      >
                        {selectedRideForJoin.rideCreatorName}
                      </Text>
                      <View style={styles.driverVerificationRating}>
                        <Star size={14} color="#FFD700" fill="#FFD700" />
                        <Text
                          style={[
                            styles.driverVerificationRatingText,
                            { color: isDarkMode ? "#CCCCCC" : "#666666" },
                          ]}
                        >
                          {selectedRideForJoin.rideCreatorRating} •{" "}
                          {selectedRideForJoin.rideCreatorBranch}
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

      {/* Join Request Modal */}
      {showJoinRequestModal && selectedRideForJoin && (
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
                    { backgroundColor: isDarkMode ? "#2196F3" : "#E3F2FD" },
                  ]}
                >
                  <MessageCircle
                    size={32}
                    color={isDarkMode ? "#FFFFFF" : "#2196F3"}
                  />
                </View>
                <Text
                  style={[
                    styles.verificationTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" },
                  ]}
                >
                  Request to Join Ride
                </Text>
                <Text
                  style={[
                    styles.verificationSubtitle,
                    { color: isDarkMode ? "#CCCCCC" : "#666666" },
                  ]}
                >
                  Send a request to the Ride Creator
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

                {/* Seat Selection */}
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
                    🎫 Seats Required
                  </Text>
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <TouchableOpacity
                      onPress={() =>
                        setSeatsToBook(Math.max(1, seatsToBook - 1))
                      }
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: isDarkMode ? "#333" : "#E0E0E0",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: isDarkMode ? "#FFF" : "#000",
                          fontSize: 18,
                        }}
                      >
                        -
                      </Text>
                    </TouchableOpacity>
                    <Text
                      style={{
                        fontSize: 18,
                        fontWeight: "600",
                        color: isDarkMode ? "#FFFFFF" : "#000000",
                        minWidth: 30,
                        textAlign: "center",
                      }}
                    >
                      {seatsToBook}
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setSeatsToBook(
                          Math.min(
                            selectedRideForJoin.availableSeats,
                            seatsToBook + 1
                          )
                        )
                      }
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: isDarkMode ? "#333" : "#E0E0E0",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: isDarkMode ? "#FFF" : "#000",
                          fontSize: 18,
                        }}
                      >
                        +
                      </Text>
                    </TouchableOpacity>
                    <Text
                      style={[
                        styles.verificationText,
                        {
                          color: isDarkMode ? "#CCCCCC" : "#666666",
                          marginLeft: 8,
                        },
                      ]}
                    >
                      (Max: {selectedRideForJoin.availableSeats})
                    </Text>
                  </View>
                </View>

                {/* Message */}
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
                    💬 Message to Ride Creator (Optional)
                  </Text>
                  <TextInput
                    style={{
                      borderWidth: 1,
                      borderColor: isDarkMode ? "#444" : "#E0E0E0",
                      borderRadius: 8,
                      padding: 12,
                      minHeight: 80,
                      textAlignVertical: "top",
                      color: isDarkMode ? "#FFFFFF" : "#000000",
                      backgroundColor: isDarkMode ? "#333" : "#FFFFFF",
                    }}
                    multiline
                    placeholder="Introduce yourself or add any special requests..."
                    placeholderTextColor={isDarkMode ? "#888" : "#999"}
                    value={joinMessage}
                    onChangeText={setJoinMessage}
                  />
                </View>
              </ScrollView>

              <View style={styles.verificationActions}>
                <TouchableOpacity
                  style={[
                    styles.cancelVerificationButton,
                    { borderColor: isDarkMode ? "#666666" : "#CCCCCC" },
                  ]}
                  onPress={() => {
                    setShowJoinRequestModal(false);
                    setSelectedRideForJoin(null);
                    setJoinMessage("");
                    setSeatsToBook(1);
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
                    { backgroundColor: "#2196F3" },
                  ]}
                  onPress={confirmJoinRide}
                >
                  <MessageCircle size={16} color="#FFFFFF" />
                  <Text
                    style={[
                      styles.confirmVerificationText,
                      { color: "#FFFFFF" },
                    ]}
                  >
                    Send Request
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Request Acceptance Modal */}
      <RequestAcceptanceModal
        visible={showRequestAcceptance}
        onClose={() => {
          setShowRequestAcceptance(false);
          setSelectedJoinRequest(null);
        }}
        request={selectedJoinRequest}
        onRequestHandled={handleRequestHandled}
        isDarkMode={isDarkMode}
      />

      {/* Loading Overlays */}
      <LoadingOverlay
        visible={loading}
        message="Loading rides..."
        isDarkMode={false}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
        isDarkMode={isDarkMode}
      />

      {/* Notification Screen */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        presentationStyle="fullScreen"
      >
        <NotificationScreen
          onBack={() => setShowNotifications(false)}
          currentUser={currentUser}
          isDarkMode={isDarkMode}
          onNotificationUpdate={fetchNotifications}
        />
      </Modal>

      {/* Instruction Screen */}
      <InstructionScreen
        visible={showInstructions}
        onClose={() => setShowInstructions(false)}
        isDarkMode={isDarkMode}
      />

      {/* Ride History Screen */}
      {showRideHistory && currentUser && (
        <UserRideHistoryScreen
          visible={showRideHistory}
          onClose={() => setShowRideHistory(false)}
          user={currentUser}
          isDarkMode={isDarkMode}
        />
      )}

      <LoadingOverlay
        visible={loading}
        message="Loading..."
        isDarkMode={isDarkMode}
      />
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
    paddingHorizontal: 16,
    paddingTop: 20, // ← ADJUST THIS VALUE to change top spacing from status bar
    marginBottom: 24,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    maxWidth: 220, // Limit the maximum width
    borderRadius: 12,
  },
  enhancedSearchWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    gap: 12,
  },
  searchIcon: {
    opacity: 0.7,
  },
  enhancedSearchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  menuBtn: {
    padding: 12,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  // Modern Icon Styles
  modernMenuBtn: {
    padding: 12,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  modernNotificationIcon: {
    padding: 12,
    borderRadius: 16,
    position: "relative",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  modernFilterIcon: {
    padding: 12,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 6,
  },
  modernNotificationBadge: {
    position: "absolute",
    top: 4,
    right: 4,
    backgroundColor: "#FF3030",
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  notificationIcon: {
    padding: 12,
    borderRadius: 12,
    position: "relative",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  filterIcon: {
    padding: 12,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 16,
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
    marginHorizontal: 16,
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
  expirySection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingLeft: 4,
  },
  expiredTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFEBEE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiredText: {
    fontSize: 12,
    color: "#F44336",
    fontWeight: "600",
    marginLeft: 4,
  },
  expiryTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  expiryText: {
    fontSize: 12,
    color: "#FF9800",
    fontWeight: "600",
    marginLeft: 4,
  },
  startTimeText: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
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
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
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
    paddingHorizontal: 16,
  },
  categoryCard: {
    flex: 1,
    minWidth: "30%",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  busThemeCard: {
    backgroundColor: "#FFF9C4", // Light yellow
    borderLeftWidth: 4,
    borderLeftColor: "#000000",
    borderRightWidth: 4,
    borderRightColor: "#000000",
    borderTopWidth: 4,
    borderTopColor: "#000000",
    borderBottomWidth: 4,
    borderBottomColor: "#000000",
    shadowColor: "#FFD700",
    shadowOpacity: 0,
  },
  busStripes: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    opacity: 0.1,
  },
  busStripe: {
    width: 2,
    height: "100%",
    backgroundColor: "#000000",
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
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  filterContent: {
    paddingHorizontal: 0,
  },
  filterChip: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  filterChipActive: {
    borderColor: "#000",
  },
  filterChipText: {
    fontSize: 14,
    fontWeight: "600",
  },
  notificationBadge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#FF5722",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  notificationBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  statusBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
  },
  chatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    gap: 8,
  },
  chatBtnText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modernStatusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    marginHorizontal: 4,
  },
  modernStatusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  modernJoinBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    gap: 8,
  },
  modernJoinBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  modernContactBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 2,
    gap: 8,
  },
  modernContactBtnText: {
    fontSize: 14,
    fontWeight: "600",
  },
  fullWidthStatusBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    minWidth: 160,
  },
  fullWidthStatusText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  // NEW: Enhanced Joined Rides Section Styles
  joinedRidesSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 4,
  },
  joinedRidesSectionHeader: {
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  joinedRidesSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginRight: 10,
  },
  rideCountBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  rideCountText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  joinedRidesSectionSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.8,
  },
  joinedRidesScrollView: {
    flexGrow: 0,
  },
  joinedRidesContainer: {
    paddingLeft: 4,
    paddingRight: 16,
    alignItems: "center",
    justifyContent: "flex-start",
    minWidth: "100%",
  },
  joinedRideCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginHorizontal: 8,
    borderWidth: 3,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    position: "relative",
  },
  joinedRideGradient: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  joinedRideContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 8,
  },
  joinedRideHeader: {
    alignItems: "center",
    marginBottom: 12,
  },
  joinedRideTime: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginBottom: 2,
  },
  joinedRideDate: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
    opacity: 0.9,
    marginTop: 4,
  },
  joinedRideRoute: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 6,
  },
  locationContainer: {
    flex: 1,
    alignItems: "center",
  },
  arrowContainer: {
    paddingHorizontal: 6,
  },
  joinedRideFrom: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  joinedRideTo: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  joinedRideFooter: {
    alignItems: "center",
  },
  joinedRidePrice: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  roleIndicator: {
    position: "absolute",
    top: 4,
    left: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  roleText: {
    fontSize: 10,
    textAlign: "center",
  },
  statusIndicator: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "600",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 2,
    opacity: 0.9,
  },
  chatIndicator: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.4)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  chatIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  joinedRideStatusDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  addRidePrompt: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginHorizontal: 8,
    borderWidth: 3,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },

  stickyHeader: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    zIndex: 10,
  },
  scrollableContent: {
    paddingHorizontal: 0,
  },
  mainScrollView: {
    flex: 1,
  },
  mainRidesList: {
    flex: 1,
    paddingHorizontal: 0,
  },
});

StudentCarpoolSystem.displayName = "StudentCarpoolSystem";

export default StudentCarpoolSystem;
