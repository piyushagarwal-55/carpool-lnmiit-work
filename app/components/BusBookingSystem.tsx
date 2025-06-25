import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
  Image,
} from "react-native";
import {
  ArrowLeft,
  Bus,
  MapPin,
  Clock,
  Users,
  AlertCircle,
  ArrowRight,
  Search,
  Menu,
  X,
  Check,
  Calendar,
  Info,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { parseEmailInfo } from "../lib/utils";

// Enhanced Interfaces
interface BusSchedule {
  id: string;
  routeName: string;
  departureTime: string;
  arrivalTime: string;
  origin: string;
  destination: string;
  availableSeats: number;
  totalSeats: number;
  status: "active" | "departed" | "cancelled";
  driverNotification?: string;
  color: string;
}

interface BusSeat {
  id: string;
  row: number;
  position: number;
  seatNumber: string;
  isAvailable: boolean;
  isBooked: boolean;
  isFaculty: boolean;
  isSelected: boolean;
}

interface BusBooking {
  id: string;
  busId: string;
  busRoute: string;
  seatNumber: string;
  departureTime: string;
  bookingTime: Date;
  status: "active" | "completed" | "expired";
}

interface BusBookingSystemProps {
  isDarkMode?: boolean;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    branch: string;
    year: string;
    rating: number;
    photo?: string;
  };
  busBookings?: BusBooking[];
  onUpdateBookings?: (bookings: BusBooking[]) => void;
  bookedSeats?: { [busId: string]: string[] };
  onUpdateBookedSeats?: (seats: { [busId: string]: string[] }) => void;
  onToggleSidebar?: () => void;
  sidebarVisible?: boolean;
}

const BusBookingSystem: React.FC<BusBookingSystemProps> = ({
  isDarkMode = false,
  currentUser = {
    id: "1",
    name: "Student",
    email: "student@lnmiit.ac.in",
    branch: "CSE",
    year: "3rd Year",
    rating: 4.5,
    photo: undefined,
  },
  busBookings = [],
  onUpdateBookings,
  bookedSeats = {},
  onUpdateBookedSeats,
  onToggleSidebar,
  sidebarVisible = false,
}) => {
  // State Management (Schedule-only)
  const [scheduleType, setScheduleType] = useState<"weekday" | "weekend">(
    "weekday"
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState<
    "all" | "morning" | "afternoon" | "evening"
  >("all");

  // Comprehensive Bus Schedules - Real LNMIIT Monday-Friday Timetable
  const weekdaySchedules: BusSchedule[] = [
    // Morning Routes (6:00 AM - 8:00 AM)
    {
      id: "1",
      routeName: "LNMIIT to Raja Park",
      departureTime: "6:00 AM",
      arrivalTime: "6:40 AM",
      origin: "LNMIIT Campus",
      destination: "Raja Park",
      availableSeats: 35,
      totalSeats: 40,
      status: "active",
      driverNotification: "Only 5 seats left!",
      color: "#E3F2FD",
    },
    {
      id: "2",
      routeName: "LNMIIT to Ajmeri Gate",
      departureTime: "6:00 AM",
      arrivalTime: "6:45 AM",
      origin: "LNMIIT Campus",
      destination: "Ajmeri Gate",
      availableSeats: 30,
      totalSeats: 40,
      status: "active",
      color: "#F3E5F5",
    },
    {
      id: "3",
      routeName: "Raja Park to LNMIIT",
      departureTime: "7:15 AM",
      arrivalTime: "7:55 AM",
      origin: "Raja Park",
      destination: "LNMIIT Campus",
      availableSeats: 28,
      totalSeats: 40,
      status: "active",
      color: "#E8F5E8",
    },
    {
      id: "4",
      routeName: "Ajmeri Gate to LNMIIT",
      departureTime: "7:15 AM",
      arrivalTime: "8:00 AM",
      origin: "Ajmeri Gate",
      destination: "LNMIIT Campus",
      availableSeats: 25,
      totalSeats: 40,
      status: "active",
      color: "#FFF3E0",
    },
    // Mid-Morning Routes (10:00 AM - 12:00 PM)
    {
      id: "5",
      routeName: "LNMIIT to Raja Park",
      departureTime: "10:00 AM",
      arrivalTime: "10:40 AM",
      origin: "LNMIIT Campus",
      destination: "Raja Park",
      availableSeats: 32,
      totalSeats: 40,
      status: "active",
      color: "#E3F2FD",
    },
    {
      id: "6",
      routeName: "LNMIIT to Ajmeri Gate",
      departureTime: "10:00 AM",
      arrivalTime: "10:45 AM",
      origin: "LNMIIT Campus",
      destination: "Ajmeri Gate",
      availableSeats: 38,
      totalSeats: 40,
      status: "active",
      color: "#F3E5F5",
    },
    {
      id: "7",
      routeName: "Raja Park to LNMIIT",
      departureTime: "12:00 PM",
      arrivalTime: "12:40 PM",
      origin: "Raja Park",
      destination: "LNMIIT Campus",
      availableSeats: 22,
      totalSeats: 40,
      status: "active",
      color: "#E8F5E8",
    },
    {
      id: "8",
      routeName: "Ajmeri Gate to LNMIIT",
      departureTime: "12:00 PM",
      arrivalTime: "12:45 PM",
      origin: "Ajmeri Gate",
      destination: "LNMIIT Campus",
      availableSeats: 20,
      totalSeats: 40,
      status: "active",
      color: "#FFF3E0",
    },
    // Afternoon Routes (2:00 PM - 4:00 PM)
    {
      id: "9",
      routeName: "LNMIIT to Raja Park",
      departureTime: "2:00 PM",
      arrivalTime: "2:40 PM",
      origin: "LNMIIT Campus",
      destination: "Raja Park",
      availableSeats: 18,
      totalSeats: 40,
      status: "active",
      driverNotification: "High demand route!",
      color: "#E3F2FD",
    },
    {
      id: "10",
      routeName: "LNMIIT to Ajmeri Gate",
      departureTime: "2:00 PM",
      arrivalTime: "2:45 PM",
      origin: "LNMIIT Campus",
      destination: "Ajmeri Gate",
      availableSeats: 15,
      totalSeats: 40,
      status: "active",
      color: "#F3E5F5",
    },
    {
      id: "11",
      routeName: "Raja Park to LNMIIT",
      departureTime: "4:00 PM",
      arrivalTime: "4:40 PM",
      origin: "Raja Park",
      destination: "LNMIIT Campus",
      availableSeats: 12,
      totalSeats: 40,
      status: "active",
      color: "#E8F5E8",
    },
    {
      id: "12",
      routeName: "Ajmeri Gate to LNMIIT",
      departureTime: "4:00 PM",
      arrivalTime: "4:45 PM",
      origin: "Ajmeri Gate",
      destination: "LNMIIT Campus",
      availableSeats: 10,
      totalSeats: 40,
      status: "active",
      color: "#FFF3E0",
    },
    // Evening Routes (5:45 PM - 7:15 PM)
    {
      id: "13",
      routeName: "LNMIIT to Raja Park",
      departureTime: "5:45 PM",
      arrivalTime: "6:25 PM",
      origin: "LNMIIT Campus",
      destination: "Raja Park",
      availableSeats: 8,
      totalSeats: 40,
      status: "active",
      driverNotification: "Peak hours - Book fast!",
      color: "#E3F2FD",
    },
    {
      id: "14",
      routeName: "Raja Park to LNMIIT",
      departureTime: "7:15 PM",
      arrivalTime: "7:55 PM",
      origin: "Raja Park",
      destination: "LNMIIT Campus",
      availableSeats: 5,
      totalSeats: 40,
      status: "active",
      driverNotification: "Almost full!",
      color: "#E8F5E8",
    },
    // Night Route (9:00 PM)
    {
      id: "15",
      routeName: "Raja Park to LNMIIT",
      departureTime: "9:00 PM",
      arrivalTime: "9:40 PM",
      origin: "Raja Park",
      destination: "LNMIIT Campus",
      availableSeats: 35,
      totalSeats: 40,
      status: "active",
      color: "#E8F5E8",
    },
  ];

  // Weekend Schedules (Saturday, Sunday & Holidays)
  const weekendSchedules: BusSchedule[] = [
    // Morning (8:00 AM - 12:00 PM)
    {
      id: "w1",
      routeName: "LNMIIT to Raja Park",
      departureTime: "8:00 AM",
      arrivalTime: "8:40 AM",
      origin: "LNMIIT Campus",
      destination: "Raja Park",
      availableSeats: 25,
      totalSeats: 40,
      status: "active",
      color: "#E8F5E8",
    },
    {
      id: "w2",
      routeName: "LNMIIT to Ajmeri Gate",
      departureTime: "8:00 AM",
      arrivalTime: "8:45 AM",
      origin: "LNMIIT Campus",
      destination: "Ajmeri Gate",
      availableSeats: 30,
      totalSeats: 40,
      status: "active",
      color: "#FFF3E0",
    },
    {
      id: "w3",
      routeName: "Raja Park to LNMIIT",
      departureTime: "10:00 AM",
      arrivalTime: "10:40 AM",
      origin: "Raja Park",
      destination: "LNMIIT Campus",
      availableSeats: 20,
      totalSeats: 40,
      status: "active",
      color: "#E3F2FD",
    },
    {
      id: "w4",
      routeName: "Ajmeri Gate to LNMIIT",
      departureTime: "10:00 AM",
      arrivalTime: "10:45 AM",
      origin: "Ajmeri Gate",
      destination: "LNMIIT Campus",
      availableSeats: 22,
      totalSeats: 40,
      status: "active",
      color: "#F3E5F5",
    },
    {
      id: "w5",
      routeName: "LNMIIT to Raja Park",
      departureTime: "12:00 PM",
      arrivalTime: "12:40 PM",
      origin: "LNMIIT Campus",
      destination: "Raja Park",
      availableSeats: 28,
      totalSeats: 40,
      status: "active",
      color: "#E8F5E8",
    },
    // Afternoon (1:00 PM - 5:00 PM)
    {
      id: "w6",
      routeName: "LNMIIT to Ajmeri Gate",
      departureTime: "1:00 PM",
      arrivalTime: "1:45 PM",
      origin: "LNMIIT Campus",
      destination: "Ajmeri Gate",
      availableSeats: 32,
      totalSeats: 40,
      status: "active",
      color: "#FFF3E0",
    },
    {
      id: "w7",
      routeName: "Raja Park to LNMIIT",
      departureTime: "2:00 PM",
      arrivalTime: "2:40 PM",
      origin: "Raja Park",
      destination: "LNMIIT Campus",
      availableSeats: 18,
      totalSeats: 40,
      status: "active",
      color: "#E3F2FD",
    },
    {
      id: "w8",
      routeName: "Ajmeri Gate to LNMIIT",
      departureTime: "3:00 PM",
      arrivalTime: "3:45 PM",
      origin: "Ajmeri Gate",
      destination: "LNMIIT Campus",
      availableSeats: 15,
      totalSeats: 40,
      status: "active",
      color: "#F3E5F5",
    },
    {
      id: "w9",
      routeName: "LNMIIT to Raja Park",
      departureTime: "4:00 PM",
      arrivalTime: "4:40 PM",
      origin: "LNMIIT Campus",
      destination: "Raja Park",
      availableSeats: 12,
      totalSeats: 40,
      status: "active",
      color: "#E8F5E8",
    },
    {
      id: "w10",
      routeName: "LNMIIT to Ajmeri Gate",
      departureTime: "5:00 PM",
      arrivalTime: "5:45 PM",
      origin: "LNMIIT Campus",
      destination: "Ajmeri Gate",
      availableSeats: 10,
      totalSeats: 40,
      status: "active",
      color: "#FFF3E0",
    },
    // Evening (6:00 PM - 8:00 PM)
    {
      id: "w11",
      routeName: "Raja Park to LNMIIT",
      departureTime: "6:00 PM",
      arrivalTime: "6:40 PM",
      origin: "Raja Park",
      destination: "LNMIIT Campus",
      availableSeats: 8,
      totalSeats: 40,
      status: "active",
      color: "#E3F2FD",
    },
    {
      id: "w12",
      routeName: "Ajmeri Gate to LNMIIT",
      departureTime: "7:00 PM",
      arrivalTime: "7:45 PM",
      origin: "Ajmeri Gate",
      destination: "LNMIIT Campus",
      availableSeats: 6,
      totalSeats: 40,
      status: "active",
      color: "#F3E5F5",
    },
    {
      id: "w13",
      routeName: "LNMIIT to Raja Park",
      departureTime: "8:00 PM",
      arrivalTime: "8:40 PM",
      origin: "LNMIIT Campus",
      destination: "Raja Park",
      availableSeats: 35,
      totalSeats: 40,
      status: "active",
      color: "#E8F5E8",
    },
    // Night (9:00 PM)
    {
      id: "w14",
      routeName: "Raja Park to LNMIIT",
      departureTime: "9:00 PM",
      arrivalTime: "9:40 PM",
      origin: "Raja Park",
      destination: "LNMIIT Campus",
      availableSeats: 38,
      totalSeats: 40,
      status: "active",
      color: "#E3F2FD",
    },
  ];

  const [busSchedules, setBusSchedules] =
    useState<BusSchedule[]>(weekdaySchedules);
  const [departedBuses, setDepartedBuses] = useState<BusSchedule[]>([]);

  // Update schedules when type changes and check for departed buses
  useEffect(() => {
    const schedules =
      scheduleType === "weekend" ? weekendSchedules : weekdaySchedules;

    // Check current time and separate active vs departed buses
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const activeBuses: BusSchedule[] = [];
    const departedBuses: BusSchedule[] = [];

    schedules.forEach((bus) => {
      // Parse departure time
      const timeStr = bus.departureTime.toLowerCase();
      let hour = parseInt(bus.departureTime.split(":")[0]);
      const minute = parseInt(bus.departureTime.split(":")[1].split(" ")[0]);
      const isPM = timeStr.includes("pm");

      // Convert to 24-hour format
      if (isPM && hour !== 12) {
        hour += 12;
      } else if (!isPM && hour === 12) {
        hour = 0;
      }

      const busTimeInMinutes = hour * 60 + minute;

      // Check if bus has already departed (add 5 minute buffer)
      if (busTimeInMinutes + 5 < currentTimeInMinutes) {
        departedBuses.push({
          ...bus,
          status: "departed" as const,
          availableSeats: 0,
        });
      } else {
        activeBuses.push(bus);
      }
    });

    setBusSchedules(activeBuses);
    setDepartedBuses(departedBuses);
  }, [scheduleType]);

  // Real-time update to check for newly departed buses every minute
  useEffect(() => {
    const interval = setInterval(() => {
      const schedules =
        scheduleType === "weekend" ? weekendSchedules : weekdaySchedules;

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      const activeBuses: BusSchedule[] = [];
      const departedBuses: BusSchedule[] = [];

      schedules.forEach((bus) => {
        const timeStr = bus.departureTime.toLowerCase();
        let hour = parseInt(bus.departureTime.split(":")[0]);
        const minute = parseInt(bus.departureTime.split(":")[1].split(" ")[0]);
        const isPM = timeStr.includes("pm");

        if (isPM && hour !== 12) {
          hour += 12;
        } else if (!isPM && hour === 12) {
          hour = 0;
        }

        const busTimeInMinutes = hour * 60 + minute;

        if (busTimeInMinutes + 5 < currentTimeInMinutes) {
          departedBuses.push({
            ...bus,
            status: "departed" as const,
            availableSeats: 0,
          });
        } else {
          activeBuses.push(bus);
        }
      });

      setBusSchedules(activeBuses);
      setDepartedBuses(departedBuses);
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [scheduleType, weekdaySchedules, weekendSchedules]);

  // Computed values for filtering and sidebar
  const getFilteredBuses = () => {
    let filteredBuses = busSchedules;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filteredBuses = filteredBuses.filter((bus) => {
        return (
          bus.routeName.toLowerCase().includes(query) ||
          bus.origin.toLowerCase().includes(query) ||
          bus.destination.toLowerCase().includes(query) ||
          bus.departureTime.toLowerCase().includes(query)
        );
      });
    }

    // Time filter
    if (timeFilter === "all") return filteredBuses;

    return filteredBuses.filter((bus) => {
      const timeStr = bus.departureTime.toLowerCase();
      const hour = parseInt(bus.departureTime.split(":")[0]);
      const isPM = timeStr.includes("pm");
      const hour24 =
        isPM && hour !== 12 ? hour + 12 : !isPM && hour === 12 ? 0 : hour;

      switch (timeFilter) {
        case "morning":
          return hour24 >= 6 && hour24 < 12;
        case "afternoon":
          return hour24 >= 12 && hour24 < 17;
        case "evening":
          return hour24 >= 17 && hour24 <= 23;
        default:
          return true;
      }
    });
  };

  const filteredBuses = getFilteredBuses();
  const isWeekend = scheduleType === "weekend";

  // Removed seat generation and bus selection functions - schedule-only view

  // Removed booking restriction functions - schedule-only view

  // Removed booking handler and seat styling functions - schedule-only view

  // Removed seat selection render function completely - schedule-only view

  // Removed bookings render function completely - schedule-only view

  // Redesigned bus card with ride card inspiration - better spacing and hierarchy
  const renderBusCard = (bus: BusSchedule) => {
    // Enhanced departure status logic
    const getDepartureStatus = () => {
      const now = new Date();
      const departure = new Date();
      const [time, period] = bus.departureTime.split(" ");
      const [hours, minutes] = time.split(":").map(Number);

      let hour24 = hours;
      if (period === "PM" && hours !== 12) hour24 += 12;
      if (period === "AM" && hours === 12) hour24 = 0;

      departure.setHours(hour24, minutes, 0, 0);
      const diffMinutes = (departure.getTime() - now.getTime()) / (1000 * 60);

      if (diffMinutes < 0) {
        return {
          status: "departed",
          message: "Departed",
          color: "#9CA3AF",
          bgColor: "#F9FAFB",
          borderColor: "#E5E7EB",
        };
      } else if (diffMinutes <= 30) {
        return {
          status: "boarding",
          message: "Boarding Now",
          color: "#F59E0B",
          bgColor: "#FEF3C7",
          borderColor: "#FCD34D",
        };
      } else if (diffMinutes <= 60) {
        return {
          status: "soon",
          message: "Departing Soon",
          color: "#10B981",
          bgColor: "#D1FAE5",
          borderColor: "#6EE7B7",
        };
      } else {
        return {
          status: "scheduled",
          message: "Scheduled",
          color: "#3B82F6",
          bgColor: "#DBEAFE",
          borderColor: "#93C5FD",
        };
      }
    };

    const statusInfo = getDepartureStatus();

    return (
      <View
        key={bus.id}
        style={[
          styles.busCard,
          {
            backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
            borderLeftColor: statusInfo.color,
            borderLeftWidth: 4,
            opacity: statusInfo.status === "departed" ? 0.8 : 1,
            shadowColor: statusInfo.color,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          },
        ]}
      >
        {/* Header with bus info and status */}
        <View style={styles.busHeader}>
          <View style={styles.busIconSection}>
            <View
              style={[
                styles.busIcon,
                {
                  backgroundColor: statusInfo.color,
                },
              ]}
            >
              <Bus size={20} color="#FFFFFF" />
            </View>
            <View style={styles.busTitleSection}>
              <Text
                style={[
                  styles.busTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {bus.routeName}
              </Text>
              <Text
                style={[
                  styles.busRoute,
                  { color: isDarkMode ? "#D1D5DB" : "#6B7280" },
                ]}
              >
                {bus.origin} → {bus.destination}
              </Text>
            </View>
          </View>

          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: statusInfo.color,
              },
            ]}
          >
            <Text style={styles.statusText}>{statusInfo.message}</Text>
          </View>
        </View>

        {/* Time and seat information */}
        <View
          style={[
            styles.busDetails,
            {
              backgroundColor: isDarkMode ? "#374151" : statusInfo.bgColor,
            },
          ]}
        >
          <View style={styles.busDetailItem}>
            <View style={styles.detailIcon}>
              <Clock size={16} color={statusInfo.color} />
            </View>
            <View>
              <Text style={styles.detailLabel}>Departure</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {bus.departureTime}
              </Text>
            </View>
          </View>

          <View style={styles.busDetailItem}>
            <View style={styles.detailIcon}>
              <MapPin size={16} color={statusInfo.color} />
            </View>
            <View>
              <Text style={styles.detailLabel}>Arrival</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {bus.arrivalTime}
              </Text>
            </View>
          </View>

          <View style={styles.busDetailItem}>
            <View style={styles.detailIcon}>
              <Users size={16} color={statusInfo.color} />
            </View>
            <View>
              <Text style={styles.detailLabel}>Available</Text>
              <Text
                style={[
                  styles.detailValue,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {bus.availableSeats}/{bus.totalSeats}
              </Text>
            </View>
          </View>
        </View>

        {/* Action button */}
        <View style={styles.busActions}>
          {statusInfo.status === "departed" ? (
            <View style={styles.departedIndicator}>
              <Check size={16} color="#9CA3AF" />
              <Text style={styles.departedText}>Departed</Text>
            </View>
          ) : statusInfo.status === "boarding" ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.boardingButton]}
              onPress={() => {
                Alert.alert(
                  "🚌 Boarding Alert",
                  `Bus ${bus.routeName} is boarding now! Hurry to the boarding point.`,
                  [{ text: "Got it!", style: "default" }]
                );
              }}
            >
              <Bus size={16} color="#FFFFFF" />
              <Text style={styles.boardingButtonText}>Board Now</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.notifyButton]}
              onPress={() => {
                Alert.alert(
                  "🔔 Notification Set",
                  `You'll be notified 30 minutes before ${bus.routeName} departure at ${bus.departureTime}`,
                  [{ text: "Perfect!", style: "default" }]
                );
              }}
            >
              <AlertCircle size={16} color={statusInfo.color} />
              <Text
                style={[styles.notifyButtonText, { color: statusInfo.color }]}
              >
                Notify Me
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Render main bus list with enhanced filtering
  const renderBusList = () => (
    <View style={styles.busList}>
      {/* Header with Search and Bookings */}
      <View
        style={[
          styles.headerWithSearch,
          {
            backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
            borderBottomColor: isDarkMode ? "#374151" : "#E5E7EB",
          },
        ]}
      >
        {/* Main Header Row */}
        <View style={styles.mainHeaderRow}>
          <View
            style={[
              styles.searchContainer,
              {
                backgroundColor: isDarkMode ? "#374151" : "#F9FAFB",
                borderColor: isDarkMode ? "#4B5563" : "#E5E7EB",
              },
            ]}
          >
            <Search size={18} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            <TextInput
              style={[
                styles.searchInput,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
              placeholder="Search routes, destinations, times..."
              placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery("")}
                style={styles.clearSearchButton}
              >
                <X size={16} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[
              styles.notificationButton,
              {
                backgroundColor: isDarkMode ? "#3B82F6" : "#3B82F6",
              },
            ]}
            onPress={() =>
              Alert.alert(
                "Notifications",
                "Get notified 30 minutes before departure for selected routes"
              )
            }
          >
            <Bus size={16} color="#FFFFFF" />
            <Text style={styles.notificationButtonText}>Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Search Results Count */}
        {searchQuery.length > 0 && (
          <View style={styles.searchResultsRow}>
            <Text
              style={[
                styles.searchResultsText,
                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              Found {filteredBuses.length} bus
              {filteredBuses.length !== 1 ? "es" : ""} matching "{searchQuery}"
            </Text>
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearAllButton}
            >
              <Text
                style={[
                  styles.clearAllText,
                  { color: isDarkMode ? "#4CAF50" : "#4CAF50" },
                ]}
              >
                Clear
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Enhanced Time Filter Section */}
      <View style={styles.enhancedTimeFilterSection}>
        <View style={styles.filterHeader}>
          <Text
            style={[
              styles.filterTitle,
              { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
            ]}
          >
            ⏰ Filter by Time
          </Text>
          <Text
            style={[
              styles.filterDescription,
              { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            Select your preferred travel time
          </Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollHorizontal}
          contentContainerStyle={styles.enhancedFilterScrollContent}
        >
          {[
            {
              key: "all",
              label: "All Times",
              emoji: "🚌",
              color: "#4CAF50",
              description: "View all",
            },
            {
              key: "morning",
              label: "Morning",
              emoji: "🌅",
              color: "#FF9800",
              description: "6AM - 12PM",
            },
            {
              key: "afternoon",
              label: "Afternoon",
              emoji: "☀️",
              color: "#2196F3",
              description: "12PM - 6PM",
            },
            {
              key: "evening",
              label: "Evening",
              emoji: "🌆",
              color: "#9C27B0",
              description: "6PM - 10PM",
            },
          ].map((filter, index) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.enhancedFilterChip,
                timeFilter === filter.key && styles.enhancedActiveFilterChip,
                index === 0 && { marginLeft: -8 },
                {
                  backgroundColor:
                    timeFilter === filter.key
                      ? filter.color
                      : isDarkMode
                      ? "#374151"
                      : "#FFFFFF",
                  borderColor:
                    timeFilter === filter.key
                      ? filter.color
                      : isDarkMode
                      ? "#4B5563"
                      : "#E5E7EB",
                  shadowColor: filter.color,
                  shadowOpacity: timeFilter === filter.key ? 0.3 : 0.1,
                  shadowRadius: timeFilter === filter.key ? 8 : 4,
                  elevation: timeFilter === filter.key ? 6 : 2,
                },
              ]}
              onPress={() => setTimeFilter(filter.key as any)}
            >
              <View style={styles.filterChipContent}>
                <Text style={styles.enhancedFilterEmoji}>{filter.emoji}</Text>
                <Text
                  style={[
                    styles.enhancedFilterLabel,
                    {
                      color:
                        timeFilter === filter.key
                          ? "#FFFFFF"
                          : isDarkMode
                          ? "#FFFFFF"
                          : "#1F2937",
                    },
                  ]}
                >
                  {filter.label}
                </Text>
                <Text
                  style={[
                    styles.enhancedFilterDescription,
                    {
                      color:
                        timeFilter === filter.key
                          ? "#FFFFFF"
                          : isDarkMode
                          ? "#9CA3AF"
                          : "#6B7280",
                    },
                  ]}
                >
                  {filter.description}
                </Text>
                {timeFilter === filter.key && (
                  <View style={styles.enhancedFilterBadge}>
                    <Text style={styles.enhancedFilterBadgeText}>
                      {filteredBuses.length}
                    </Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bus Cards */}
      <ScrollView style={styles.busListScroll}>
        <View style={styles.enhancedSectionHeader}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.sectionIconContainer}>
              <Bus size={28} color="#3B82F6" />
            </View>
            <View style={styles.sectionTitleContent}>
              <Text
                style={[
                  styles.enhancedSectionTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                Live Bus Schedule
              </Text>
              <Text
                style={[
                  styles.enhancedSectionSubtitle,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                Real-time departure & arrival information
              </Text>
            </View>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </View>
          </View>
          <View style={styles.scheduleStats}>
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statNumber,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {filteredBuses.length}
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                Available
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statNumber,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                {
                  filteredBuses.filter((bus) => {
                    const now = new Date();
                    const departure = new Date();
                    const [time, period] = bus.departureTime.split(" ");
                    const [hours, minutes] = time.split(":").map(Number);
                    let hour24 = hours;
                    if (period === "PM" && hours !== 12) hour24 += 12;
                    if (period === "AM" && hours === 12) hour24 = 0;
                    departure.setHours(hour24, minutes, 0, 0);
                    const diffMinutes =
                      (departure.getTime() - now.getTime()) / (1000 * 60);
                    return diffMinutes <= 30 && diffMinutes > 0;
                  }).length
                }
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                Boarding
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text
                style={[
                  styles.statNumber,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                4
              </Text>
              <Text
                style={[
                  styles.statLabel,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                Routes
              </Text>
            </View>
          </View>
        </View>
        <Text
          style={[
            styles.busCount,
            { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
          ]}
        >
          {filteredBuses.length} buses found
        </Text>

        {filteredBuses.map(renderBusCard)}

        {/* Enhanced Departed Buses Section */}
        {departedBuses.length > 0 && (
          <View style={styles.departedSection}>
            <View style={styles.departedSectionHeader}>
              <Text
                style={[
                  styles.departedSectionTitle,
                  { color: isDarkMode ? "#EF4444" : "#DC2626" },
                ]}
              >
                🕐 Departed Buses ({departedBuses.length})
              </Text>
              <Text
                style={[
                  styles.departedSectionSubtitle,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                These buses have already left the campus
              </Text>
            </View>

            {departedBuses.map((bus) => {
              // Calculate how long ago the bus departed
              const now = new Date();
              const timeStr = bus.departureTime.toLowerCase();
              let hour = parseInt(bus.departureTime.split(":")[0]);
              const minute = parseInt(
                bus.departureTime.split(":")[1].split(" ")[0]
              );
              const isPM = timeStr.includes("pm");

              if (isPM && hour !== 12) {
                hour += 12;
              } else if (!isPM && hour === 12) {
                hour = 0;
              }

              const busTime = new Date();
              busTime.setHours(hour, minute, 0, 0);

              const timeDiff = Math.floor(
                (now.getTime() - busTime.getTime()) / (1000 * 60)
              );
              const hoursAgo = Math.floor(timeDiff / 60);
              const minutesAgo = timeDiff % 60;

              let timeAgoText = "";
              if (hoursAgo > 0) {
                timeAgoText = `${hoursAgo}h ${minutesAgo}m ago`;
              } else if (minutesAgo > 0) {
                timeAgoText = `${minutesAgo}m ago`;
              } else {
                timeAgoText = "Just departed";
              }

              return (
                <View
                  key={bus.id}
                  style={[
                    styles.departedBusCard,
                    {
                      backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB",
                      borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                    },
                  ]}
                >
                  <View style={styles.departedBusHeader}>
                    <View style={styles.departedBusIconContainer}>
                      <Bus
                        size={20}
                        color={isDarkMode ? "#EF4444" : "#DC2626"}
                      />
                      <View style={styles.departedStatusBadge}>
                        <Text style={styles.departedStatusText}>DEPARTED</Text>
                      </View>
                    </View>
                    <View style={styles.departedBusInfo}>
                      <Text
                        style={[
                          styles.departedRouteName,
                          { color: isDarkMode ? "#D1D5DB" : "#4B5563" },
                        ]}
                      >
                        {bus.routeName}
                      </Text>
                      <View style={styles.departedRouteDetails}>
                        <MapPin
                          size={12}
                          color={isDarkMode ? "#9CA3AF" : "#6B7280"}
                        />
                        <Text
                          style={[
                            styles.departedRouteText,
                            { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                          ]}
                        >
                          {bus.origin} → {bus.destination}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.departedTimeInfo}>
                    <View style={styles.departedTimeRow}>
                      <Text
                        style={[
                          styles.departedTimeLabel,
                          { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                        ]}
                      >
                        Departed at:
                      </Text>
                      <Text
                        style={[
                          styles.departedTime,
                          { color: isDarkMode ? "#EF4444" : "#DC2626" },
                        ]}
                      >
                        {bus.departureTime}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.timeAgoText,
                        { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                      ]}
                    >
                      {timeAgoText}
                    </Text>
                  </View>

                  <View style={styles.nextBusInfo}>
                    <Text
                      style={[
                        styles.nextBusText,
                        { color: isDarkMode ? "#60A5FA" : "#2563EB" },
                      ]}
                    >
                      💡 Check above for next available bus on this route
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );

  // Add sidebar data for enhanced navigation
  const sidebarCategories = [
    {
      key: "search",
      label: "Search Routes",
      count: `${filteredBuses.length}`,
      color: "#4CAF50",
      icon: "🔍",
    },
    {
      key: "bookings",
      label: "My Bookings",
      count: "0",
      color: "#2196F3",
      icon: "🎫",
    },
    {
      key: "schedule",
      label: "Live Schedule",
      count: isWeekend ? "14" : "15",
      color: "#9C27B0",
      icon: "📅",
    },
    {
      key: "routes",
      label: "Popular Routes",
      count: "4",
      color: "#FF9800",
      icon: "🚌",
    },
  ];

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Text key={i} style={{ color: i < rating ? "#FFD700" : "#E0E0E0" }}>
        ★
      </Text>
    ));
  };

  // Main render function
  return (
    <>
      {/* Enhanced Sidebar */}
      {sidebarVisible && (
        <>
          {/* Overlay */}
          <TouchableOpacity
            style={styles.overlay}
            activeOpacity={1}
            onPress={onToggleSidebar}
          >
            <View style={styles.overlayTouchable} />
          </TouchableOpacity>

          {/* Sidebar */}
          <View style={styles.sidebar}>
            <LinearGradient
              colors={
                isDarkMode
                  ? ["#1A1A1A", "#2A2A2A", "#1A1A1A"]
                  : ["#FFFFFF", "#F8F9FA", "#FFFFFF"]
              }
              style={styles.sidebarGradient}
            >
              {/* Sidebar Header */}
              <View style={styles.sidebarHeader}>
                <View style={styles.modernHeaderTop}>
                  <View style={styles.headerLogoSection}>
                    <View
                      style={[
                        styles.modernLogoContainer,
                        { backgroundColor: "#4CAF50" },
                      ]}
                    >
                      <Text style={styles.modernLogoText}>🚌</Text>
                    </View>
                    <View style={styles.headerTextSection}>
                      <Text
                        style={[
                          styles.modernSidebarTitle,
                          { color: isDarkMode ? "#FFFFFF" : "#000000" },
                        ]}
                      >
                        LNMIIT Bus
                      </Text>
                      <Text
                        style={[
                          styles.modernSidebarSubtitle,
                          { color: isDarkMode ? "#CCCCCC" : "#666666" },
                        ]}
                      >
                        Smart Campus Transport
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={onToggleSidebar}
                    style={[
                      styles.closeButton,
                      {
                        backgroundColor: isDarkMode
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                      },
                    ]}
                  >
                    <X size={18} color={isDarkMode ? "#FFFFFF" : "#000000"} />
                  </TouchableOpacity>
                </View>

                {/* Status Badge */}
                <View style={styles.sidebarStatusBadge}>
                  <View
                    style={[styles.statusDot, { backgroundColor: "#4CAF50" }]}
                  />
                  <Text
                    style={[styles.sidebarStatusText, { color: "#4CAF50" }]}
                  >
                    Live Schedule Active
                  </Text>
                </View>
              </View>

              {/* User Info Card */}
              <View
                style={[
                  styles.userInfoCard,
                  {
                    backgroundColor: isDarkMode
                      ? "rgba(255,255,255,0.05)"
                      : "rgba(76, 175, 80, 0.1)",
                  },
                ]}
              >
                <Image
                  source={{
                    uri:
                      currentUser?.photo ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email}`,
                  }}
                  style={styles.userAvatar}
                />
                <View style={styles.userInfo}>
                  <Text
                    style={[
                      styles.userName,
                      { color: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                  >
                    {currentUser?.name || "Student"}
                  </Text>
                  <Text
                    style={[
                      styles.userBranch,
                      { color: isDarkMode ? "#CCCCCC" : "#666666" },
                    ]}
                  >
                    {(() => {
                      if (currentUser?.email) {
                        const emailInfo = parseEmailInfo(currentUser.email);
                        return emailInfo.branchFull;
                      }
                      return currentUser?.branch || "Unknown Branch";
                    })()}
                  </Text>
                  <View style={styles.userRating}>
                    {renderStars(Math.floor(currentUser?.rating || 4.5))}
                    <Text
                      style={[
                        styles.ratingText,
                        { color: isDarkMode ? "#FFD700" : "#FF8F00" },
                      ]}
                    >
                      {currentUser?.rating || 4.5}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Categories */}
              <ScrollView style={styles.sidebarContent}>
                {sidebarCategories.map((category, index) => (
                  <TouchableOpacity
                    key={category.key}
                    style={[
                      styles.modernCategoryItem,
                      {
                        backgroundColor: isDarkMode
                          ? "rgba(255,255,255,0.05)"
                          : "rgba(0,0,0,0.02)",
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.modernCategoryIcon,
                        { backgroundColor: category.color + "20" },
                      ]}
                    >
                      <Text style={styles.modernCategoryEmoji}>
                        {category.icon}
                      </Text>
                    </View>
                    <View style={styles.modernCategoryInfo}>
                      <Text
                        style={[
                          styles.modernCategoryLabel,
                          { color: isDarkMode ? "#FFFFFF" : "#000000" },
                        ]}
                      >
                        {category.label}
                      </Text>
                      <Text
                        style={[
                          styles.modernCategoryCount,
                          { color: isDarkMode ? "#CCCCCC" : "#666666" },
                        ]}
                      >
                        {category.count} items
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}

                {/* Safety Alert Section */}
                <View style={styles.safetySection}>
                  <TouchableOpacity
                    style={[
                      styles.safetyAlertButton,
                      { backgroundColor: "#EF4444" },
                    ]}
                    onPress={() => {
                      Alert.alert(
                        "🚨 Emergency Alert",
                        "Emergency services have been notified. Your location and emergency contacts will be contacted immediately.",
                        [
                          {
                            text: "Cancel",
                            style: "cancel",
                          },
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
                    <View style={styles.safetyButtonContent}>
                      <Text style={styles.safetyIcon}>🚨</Text>
                      <View style={styles.safetyTextContainer}>
                        <Text style={styles.safetyMainText}>Emergency SOS</Text>
                        <Text style={styles.safetySubText}>
                          Tap for immediate help
                        </Text>
                      </View>
                    </View>
                    <View style={styles.safetyPulse}>
                      <View style={styles.safetyPulseInner} />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Quick Actions Menu */}
                <View style={styles.menuSection}>
                  <Text
                    style={[
                      styles.menuSectionTitle,
                      { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    QUICK ACTIONS
                  </Text>

                  {[
                    {
                      icon: "🔍",
                      label: "Search Routes",
                      count: filteredBuses.length,
                      color: "#4CAF50",
                      action: () => {
                        onToggleSidebar?.();
                        // Focus search after sidebar closes
                        setTimeout(() => {
                          setSearchQuery("");
                        }, 300);
                      },
                    },
                    {
                      icon: "📅",
                      label: "Today's Schedule",
                      count: busSchedules.length,
                      color: "#2196F3",
                      action: () => {
                        onToggleSidebar?.();
                        setSearchQuery("");
                        setTimeFilter("all");
                      },
                    },
                    {
                      icon: "⭐",
                      label: "Favorite Routes",
                      count: 3,
                      color: "#FF9800",
                      action: () => {
                        onToggleSidebar?.();
                        Alert.alert(
                          "⭐ Favorite Routes",
                          "Feature coming soon! You'll be able to save your most used routes for quick access.",
                          [{ text: "Got it!", style: "default" }]
                        );
                      },
                    },
                    {
                      icon: "🎫",
                      label: "Recent Bookings",
                      count: busBookings.length,
                      color: "#9C27B0",
                      action: () => {
                        onToggleSidebar?.();
                        Alert.alert(
                          "Recent Bookings",
                          "This feature shows your booking history and is coming soon!"
                        );
                      },
                    },
                  ].map((item, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.colorfulMenuItem,
                        {
                          backgroundColor: isDarkMode
                            ? "rgba(255,255,255,0.05)"
                            : item.color + "10",
                        },
                      ]}
                      onPress={item.action}
                    >
                      <View
                        style={[
                          styles.menuItemIconContainer,
                          { backgroundColor: item.color + "20" },
                        ]}
                      >
                        <Text style={styles.menuItemIcon}>{item.icon}</Text>
                      </View>
                      <View style={styles.menuItemContent}>
                        <Text
                          style={[
                            styles.menuItemLabel,
                            { color: isDarkMode ? "#FFFFFF" : "#000000" },
                          ]}
                        >
                          {item.label}
                        </Text>
                        <Text
                          style={[
                            styles.menuItemSubtext,
                            { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                          ]}
                        >
                          {item.count} available
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.menuItemBadge,
                          { backgroundColor: item.color },
                        ]}
                      >
                        <Text style={styles.menuItemCount}>{item.count}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>

              {/* Sidebar Footer */}
              <View
                style={[
                  styles.sidebarFooter,
                  { borderTopColor: isDarkMode ? "#374151" : "#E5E7EB" },
                ]}
              >
                <Text
                  style={[
                    styles.footerText,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" },
                  ]}
                >
                  LNMIIT Transport
                </Text>
                <Text
                  style={[
                    styles.footerSubtext,
                    { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  Smart Campus Solutions
                </Text>
              </View>
            </LinearGradient>
          </View>
        </>
      )}

      {/* Main Content */}
      <SafeAreaView
        style={[
          styles.safeArea,
          { backgroundColor: isDarkMode ? "#000000" : "#FFFFFF" },
        ]}
      >
        <View style={styles.container}>{renderBusList()}</View>

        {/* Removed seat unavailable modal - schedule-only view */}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  // Base Styles
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },

  // Header Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },

  // Modern Header Styles
  modernHeader: {
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  headerLeftSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modernMenuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  titleSection: {
    flex: 1,
  },
  modernHeaderTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 2,
  },
  modernHeaderSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  modernActionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modernBookingsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  modernBookingsText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },

  // Simple Top Bar
  simpleTopBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerCenterSection: {
    flex: 1,
    alignItems: "center",
  },

  // Header with Search
  headerWithSearch: {
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: "500",
  },
  clearSearchButton: {
    padding: 4,
  },
  searchResultsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  searchResultsText: {
    fontSize: 14,
    fontWeight: "500",
  },
  clearAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  clearAllText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Schedule Toggle Section
  scheduleToggleSection: {
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 16,
  },
  scheduleToggleTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  modernToggleContainer: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 4,
    gap: 8,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modernToggleCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
    borderColor: "transparent",
  },
  activeToggleCard: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  toggleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  toggleTextContainer: {
    flex: 1,
  },
  modernToggleButton: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
  },
  modernToggleIcon: {
    fontSize: 20,
  },
  modernToggleLabel: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
  },
  modernToggleSubtext: {
    fontSize: 12,
    fontWeight: "500",
  },
  toggleActiveBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleActiveBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#4CAF50",
  },

  // Time Filter Section
  timeFilterSection: {
    paddingTop: 12,
    paddingBottom: 20,
    marginBottom: 8,
    zIndex: 10,
  },
  filterHeaderRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterScrollHorizontal: {
    paddingHorizontal: 20,
  },
  filterScrollContent: {
    paddingRight: 20,
    paddingBottom: 8,
  },
  modernFilterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeFilterChip: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 3,
  },
  filterEmoji: {
    fontSize: 16,
  },
  modernFilterText: {
    fontSize: 14,
    fontWeight: "600",
  },
  filterBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  filterBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  bookingsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  bookingsButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Toggle Styles
  toggleContainer: {
    flexDirection: "row",
    margin: 16,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
  },
  activeToggle: {
    backgroundColor: "#FFFFFF",
  },
  toggleText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  activeToggleText: {
    color: "#000000",
  },
  toggleSubtext: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },

  // Filter Styles
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterScroll: {
    flexDirection: "row",
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 4,
  },
  activeFilterTab: {
    backgroundColor: "#4CAF50",
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  filterTabCount: {
    fontSize: 12,
    color: "#FFFFFF",
    opacity: 0.8,
  },

  // Bus List Styles
  busList: {
    flex: 1,
  },
  busListScroll: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    marginTop: 4,
  },
  busCount: {
    fontSize: 14,
    marginBottom: 16,
  },
  busCard: {
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  busHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  busIconSection: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  busIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  busTitleSection: {
    flex: 1,
    paddingRight: 8,
  },
  busTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  busRoute: {
    fontSize: 13,
    lineHeight: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
    textTransform: "capitalize",
  },
  busDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginBottom: 12,
  },
  busDetailItem: {
    alignItems: "center",
    flex: 1,
  },
  detailIcon: {
    marginBottom: 4,
  },
  detailLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
  },
  busActions: {
    alignItems: "center",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    gap: 6,
  },
  boardingButton: {
    backgroundColor: "#F59E0B",
  },
  boardingButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  notifyButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#3B82F6",
  },
  notifyButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  departedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
  },
  departedText: {
    fontSize: 14,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  busCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  busIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  busInfoContainer: {
    flex: 1,
  },
  routeName: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  routeDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  routeText: {
    fontSize: 14,
    fontWeight: "500",
  },
  busCardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeText: {
    fontSize: 16,
    fontWeight: "600",
  },
  seatsContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  seatsText: {
    fontSize: 16,
    fontWeight: "600",
  },
  notificationContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  notificationText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#F59E0B",
  },
  restrictionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#EF4444",
  },
  restrictionText: {
    fontSize: 14,
    fontWeight: "600",
    flex: 1,
  },
  busCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  readyToBookText: {
    fontSize: 16,
    fontWeight: "500",
  },
  bookButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },

  // Enhanced Departed Bus Styles
  departedSection: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 2,
    borderTopColor: "#E5E7EB",
  },
  departedSectionHeader: {
    marginBottom: 16,
    alignItems: "center",
  },
  departedSectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
    textAlign: "center",
  },
  departedSectionSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 8,
  },
  departedBusCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderStyle: "dashed",
    opacity: 0.8,
  },
  departedBusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  departedBusIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  departedStatusBadge: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 8,
  },
  departedStatusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  departedBusInfo: {
    flex: 1,
  },
  departedRouteName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  departedRouteDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  departedRouteText: {
    fontSize: 12,
    fontWeight: "500",
  },
  departedTimeInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    borderRadius: 8,
  },
  departedTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  departedTimeLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  departedTime: {
    fontSize: 14,
    fontWeight: "700",
  },
  timeAgoText: {
    fontSize: 12,
    fontWeight: "600",
    fontStyle: "italic",
  },
  nextBusInfo: {
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  nextBusText: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },

  // Enhanced Time Filter Styles
  enhancedTimeFilterSection: {
    paddingLeft: 20,
    paddingRight: 0,
    paddingVertical: 16,
    backgroundColor: "transparent",
  },
  filterHeader: {
    marginBottom: 16,
  },
  filterTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  filterDescription: {
    fontSize: 14,
    fontWeight: "500",
  },
  enhancedFilterScrollContent: {
    paddingLeft: 0,
    paddingRight: 20,
    gap: 12,
  },
  enhancedFilterChip: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 2,
    marginRight: 12,
    minWidth: 120,
    alignItems: "center",
  },
  enhancedActiveFilterChip: {
    transform: [{ scale: 1.02 }],
  },
  filterChipContent: {
    alignItems: "center",
    gap: 2,
  },
  enhancedFilterEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  enhancedFilterLabel: {
    fontSize: 14,
    fontWeight: "600",
  },
  enhancedFilterDescription: {
    fontSize: 11,
    fontWeight: "400",
    textAlign: "center",
  },
  enhancedFilterBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
    minWidth: 24,
    alignItems: "center",
  },
  enhancedFilterBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  // Enhanced Section Header Styles
  enhancedSectionHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: "transparent",
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#DBEAFE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sectionTitleContent: {
    flex: 1,
  },
  enhancedSectionTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 2,
  },
  enhancedSectionSubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EF4444",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
    marginRight: 4,
  },
  liveText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  scheduleStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
  },

  // Legacy Departed Bus Styles (keeping for compatibility)
  departedLabel: {
    marginTop: 8,
  },
  departedText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Seat Selection Styles
  seatContainer: {
    flex: 1,
  },
  seatHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: "center",
  },
  seatHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  seatHeaderSubtitle: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 2,
  },

  // Enhanced Bus Info Card
  busInfoCardEnhanced: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  busInfoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  busInfoRouteTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  busStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  busStatusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  busInfoGrid: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  busInfoGridItem: {
    flex: 1,
    alignItems: "center",
  },
  busInfoGridDivider: {
    paddingHorizontal: 12,
  },
  busInfoLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginTop: 4,
    marginBottom: 2,
  },
  busInfoValue: {
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  busInfoFooterEnhanced: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  busInfoTimeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  busInfoTimeText: {
    fontSize: 14,
    fontWeight: "600",
  },
  busInfoSeatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  busInfoSeatsText: {
    fontSize: 14,
    fontWeight: "600",
  },

  // Enhanced Seat Legend
  seatLegendEnhanced: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  legendGrid: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  legendItemEnhanced: {
    alignItems: "center",
    gap: 6,
  },
  legendSeatEnhanced: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  legendTextEnhanced: {
    fontSize: 12,
    fontWeight: "600",
  },

  // Enhanced Bus Layout
  seatGridEnhanced: {
    flex: 1,
  },
  seatScrollContent: {
    paddingBottom: 20,
  },
  busLayoutEnhanced: {
    margin: 16,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  driverSection: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
  },
  driverIcon: {
    marginRight: 8,
  },
  driverEmoji: {
    fontSize: 20,
  },
  driverLabelEnhanced: {
    fontSize: 16,
    fontWeight: "700",
  },
  seatRows: {
    gap: 8,
  },
  seatRowEnhanced: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  rowNumber: {
    fontSize: 12,
    fontWeight: "600",
    width: 20,
    textAlign: "center",
  },
  seatGroupEnhanced: {
    flexDirection: "row",
    gap: 6,
  },
  aisleEnhanced: {
    width: 24,
    height: 2,
    borderRadius: 1,
  },
  seatEnhanced: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 2.5,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  seatNumberEnhanced: {
    fontSize: 12,
    fontWeight: "600",
  },
  selectedIcon: {
    position: "absolute",
    top: 2,
    right: 2,
  },
  bookedIcon: {
    position: "absolute",
    top: 2,
    right: 2,
  },

  // Enhanced Booking Footer
  bookingFooterEnhanced: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  selectedSeatInfoEnhanced: {
    flex: 1,
    marginRight: 16,
  },
  selectedSeatHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  selectedSeatTextEnhanced: {
    fontSize: 16,
    fontWeight: "700",
  },
  selectedSeatSubtext: {
    fontSize: 14,
    fontWeight: "500",
  },
  confirmButtonEnhanced: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  confirmButtonTextEnhanced: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },

  // Bookings Styles
  bookingsContainer: {
    flex: 1,
  },
  bookingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  bookingsHeaderTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  bookingsList: {
    flex: 1,
    padding: 20,
  },
  bookingCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  bookingRoute: {
    fontSize: 16,
    fontWeight: "700",
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  bookingDetails: {
    marginLeft: 32,
  },
  bookingDetailText: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 2,
  },
  emptyState: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: "center",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    minWidth: 280,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  modalMessage: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: "#EF4444",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  // Sidebar Styles
  sidebar: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: 320,
    zIndex: 9999,
  },
  sidebarGradient: {
    flex: 1,
  },
  sidebarHeader: {
    padding: 24,
    paddingTop: 60,
  },
  modernHeaderTop: {
    flexDirection: "row",
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
  sidebarStatusBadge: {
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
  sidebarStatusText: {
    fontSize: 12,
    fontWeight: "500",
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
  sidebarContent: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
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
    fontSize: 12,
    fontWeight: "600",
  },

  // Safety Alert Styles
  safetySection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  safetyAlertButton: {
    borderRadius: 16,
    padding: 16,
    position: "relative",
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  safetyButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  safetyIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  safetyTextContainer: {
    flex: 1,
  },
  safetyMainText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  safetySubText: {
    color: "#FFCDD2",
    fontSize: 14,
    marginTop: 2,
  },
  safetyPulse: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
    opacity: 0.8,
  },
  safetyPulseInner: {
    width: "100%",
    height: "100%",
    borderRadius: 6,
    backgroundColor: "#FFFFFF",
  },

  // Colorful Menu Item Styles
  colorfulMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginVertical: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuItemIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemSubtext: {
    fontSize: 13,
    opacity: 0.7,
  },
  menuItemBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 32,
    alignItems: "center",
    justifyContent: "center",
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

  // Modern Booking Styles
  modernBookingsContainer: {
    flex: 1,
  },
  modernBookingsHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  modernBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  modernHeaderContent: {
    flex: 1,
  },
  modernBookingsTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 2,
  },
  modernBookingsSubtitle: {
    fontSize: 14,
    fontWeight: "500",
  },
  modernHeaderStats: {
    alignItems: "center",
  },
  statBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  statBadgeText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700",
  },
  modernBookingsList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  modernEmptyState: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyStateIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(74, 144, 226, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  emptyStateIcon: {
    fontSize: 32,
  },
  modernEmptyStateTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  modernEmptyStateSubtext: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A90E2",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  emptyStateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  bookingSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  bookingSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: "500",
  },
  modernBookingCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  completedBookingCard: {
    borderStyle: "dashed",
  },
  modernBookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  modernBookingIconSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  modernBookingIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modernBookingTitleSection: {
    flex: 1,
  },
  modernBookingRoute: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  modernBookingTime: {
    fontSize: 14,
    fontWeight: "500",
  },
  modernStatusBadge: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  modernStatusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  modernBookingDetails: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    paddingTop: 16,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
  },
  detailIcon: {
    fontSize: 20,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
    textAlign: "center",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  modernBookingActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  modernScheduleToggleTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  modernScheduleToggleCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
    borderWidth: 2,
  },
  modernToggleIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modernToggleTextContainer: {
    flex: 1,
  },
  modernToggleActiveBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  modernToggleActiveBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },

  // New Schedule-focused styles
  notificationButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  notificationButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 80,
    alignItems: "center",
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
  notifyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
    minWidth: 140,
  },
  notifyButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  departedText: {
    fontSize: 14,
    fontWeight: "500",
    fontStyle: "italic",
    textAlign: "center",
    paddingVertical: 12,
  },

  // Section Header Styles
  sectionHeaderContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 8,
  },
  modernSectionTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  scheduleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  scheduleSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    opacity: 0.8,
  },

  // Compact Bus Card Styles - Optimized for Space
  compactBusCard: {
    borderRadius: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderLeftWidth: 4,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    overflow: "hidden",
  },
  compactHeader: {
    padding: 16,
    paddingBottom: 12,
  },
  compactMainInfo: {
    gap: 8,
  },
  compactRouteRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  compactBusIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  compactRouteName: {
    fontSize: 18,
    fontWeight: "700",
    flex: 1,
    letterSpacing: 0.3,
  },
  compactStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  compactStatusIcon: {
    fontSize: 12,
  },
  compactStatusText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  compactRouteDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginLeft: 48,
  },
  compactLocationText: {
    fontSize: 13,
    fontWeight: "500",
  },
  compactInfoGrid: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  compactTimeSection: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  compactTimeItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  compactTimeIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  compactTimeDetails: {
    flex: 1,
  },
  compactTimeLabel: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 1,
  },
  compactTimeValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  compactSeatsSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    minWidth: 50,
  },
  compactSeatsValue: {
    fontSize: 13,
    fontWeight: "700",
  },
  compactDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 4,
  },
  compactActionSection: {
    justifyContent: "center",
    minWidth: 80,
  },
  compactActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    gap: 4,
    minWidth: 70,
  },
  urgentAction: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  compactActionIcon: {
    fontSize: 12,
  },
  compactActionText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  compactDepartedIndicator: {
    alignItems: "center",
    paddingVertical: 8,
  },
  compactDepartedText: {
    fontSize: 11,
    fontWeight: "600",
    fontStyle: "italic",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  compactBottomAccent: {
    height: 3,
    width: "100%",
  },

  // Modern Bus Card Styles (Legacy)
  modernBusCard: {
    borderRadius: 20,
    marginBottom: 16,
    marginHorizontal: 20,
    borderLeftWidth: 6,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: "hidden",
  },
  modernBusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 20,
    paddingBottom: 16,
  },
  busRouteSection: {
    flexDirection: "row",
    flex: 1,
    alignItems: "flex-start",
  },
  busIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  routeInfo: {
    flex: 1,
  },
  modernRouteName: {
    fontSize: 20,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  modernRouteDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  modernLocationText: {
    fontSize: 14,
    fontWeight: "600",
    maxWidth: 80,
  },
  arrowContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  arrowLine: {
    width: 20,
    height: 1,
    marginRight: 4,
  },
  arrowIcon: {
    fontSize: 14,
    fontWeight: "bold",
  },
  modernStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  statusEmoji: {
    fontSize: 14,
  },
  modernStatusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  modernInfoGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  timeInfoCard: {
    flex: 1,
  },
  seatsInfoCard: {
    flex: 1,
  },
  timeInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  timeIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  timeInfoText: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 11,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  timeValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  seatsValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  modernActionSection: {
    padding: 20,
    paddingTop: 8,
  },
  modernActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
    position: "relative",
  },
  actionButtonIcon: {
    fontSize: 16,
  },
  modernActionText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  urgentPulse: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    opacity: 0.6,
  },
  departedIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 8,
  },
  departedIcon: {
    fontSize: 18,
    color: "#10B981",
  },
  departedMessage: {
    fontSize: 16,
    fontWeight: "600",
    fontStyle: "italic",
  },
  cardAccent: {
    height: 4,
    width: "100%",
    marginTop: "auto",
  },
});

export default BusBookingSystem;
