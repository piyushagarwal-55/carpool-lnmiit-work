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
  // State Management
  const [currentView, setCurrentView] = useState<"list" | "seats" | "bookings">(
    "list"
  );
  const [scheduleType, setScheduleType] = useState<"weekday" | "weekend">(
    "weekday"
  );
  const [selectedBus, setSelectedBus] = useState<BusSchedule | null>(null);
  const [busSeats, setBusSeats] = useState<BusSeat[]>([]);
  const [selectedSeat, setSelectedSeat] = useState<string>("");
  const [bookings, setBookings] = useState<BusBooking[]>(busBookings);
  const [showSeatUnavailableModal, setShowSeatUnavailableModal] =
    useState(false);
  const [globalBookedSeats, setGlobalBookedSeats] = useState<{
    [busId: string]: string[];
  }>(bookedSeats);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchVisible, setSearchVisible] = useState(false);
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

  // Generate bus seat layout with 2+2 configuration
  const generateBusSeats = (busId: string): BusSeat[] => {
    const seats: BusSeat[] = [];
    const totalRows = 11; // 11 rows for 44 seats (2+2 configuration)
    const bookedSeatsForBus = globalBookedSeats[busId] || [];

    for (let row = 1; row <= totalRows; row++) {
      // Left side seats (A, B)
      for (let pos = 1; pos <= 2; pos++) {
        const seatId = `${row}${String.fromCharCode(64 + pos)}`;
        const isBookedGlobally = bookedSeatsForBus.includes(seatId);
        const isRandomBooked = Math.random() > 0.7;
        const isFaculty = row <= 2 && Math.random() > 0.5;
        const isBooked = isBookedGlobally || isRandomBooked;

        seats.push({
          id: seatId,
          row,
          position: pos,
          seatNumber: seatId,
          isAvailable: !isBooked && !isFaculty,
          isBooked,
          isFaculty,
          isSelected: false,
        });
      }

      // Right side seats (C, D)
      for (let pos = 3; pos <= 4; pos++) {
        const seatId = `${row}${String.fromCharCode(64 + pos)}`;
        const isBookedGlobally = bookedSeatsForBus.includes(seatId);
        const isRandomBooked = Math.random() > 0.7;
        const isFaculty = row <= 2 && Math.random() > 0.5;
        const isBooked = isBookedGlobally || isRandomBooked;

        seats.push({
          id: seatId,
          row,
          position: pos,
          seatNumber: seatId,
          isAvailable: !isBooked && !isFaculty,
          isBooked,
          isFaculty,
          isSelected: false,
        });
      }
    }

    return seats;
  };

  // Bus selection handler
  const handleBusSelect = (bus: BusSchedule) => {
    setSelectedBus(bus);
    setBusSeats(generateBusSeats(bus.id));
    setSelectedSeat("");
    setCurrentView("seats");
  };

  // Helper function to check consecutive seat restriction
  const isConsecutiveSeat = (targetSeat: BusSeat): boolean => {
    const targetRow = targetSeat.row;
    const targetPosition = targetSeat.position;

    // Check if user has any existing booking on this bus
    const userBookingsOnBus = bookings.filter(
      (booking) =>
        booking.status === "active" && booking.busId === selectedBus?.id
    );

    return userBookingsOnBus.some((booking) => {
      const seatNumber = booking.seatNumber;
      const seatMatch = seatNumber.match(/(\d+)([A-D])/);
      if (!seatMatch) return false;

      const bookedRow = parseInt(seatMatch[1]);
      const bookedPosition = seatMatch[2].charCodeAt(0) - "A".charCodeAt(0) + 1;

      // Check if it's the same row and adjacent position
      return (
        bookedRow === targetRow &&
        Math.abs(bookedPosition - targetPosition) === 1
      );
    });
  };

  // Seat selection handler
  const handleSeatSelect = (seat: BusSeat) => {
    if (!seat.isAvailable) {
      setShowSeatUnavailableModal(true);
      return;
    }

    // Check for consecutive seat booking restriction
    if (!seat.isSelected && isConsecutiveSeat(seat)) {
      Alert.alert(
        "⚠️ Consecutive Seat Restriction",
        "You cannot book consecutive seats to ensure fair distribution among students.\n\nPlease select a non-adjacent seat.",
        [{ text: "OK", style: "cancel" }]
      );
      return;
    }

    // Allow only single seat selection
    const updatedSeats = busSeats.map((s) => ({
      ...s,
      isSelected: s.id === seat.id ? !s.isSelected : false,
    }));

    setBusSeats(updatedSeats);
    setSelectedSeat(seat.isSelected ? "" : seat.id);
  };

  // Helper function to check if user can book within 2-hour time slot
  const canBookInTimeSlot = (
    targetDepartureTime: string
  ): { canBook: boolean; conflictingBooking?: BusBooking } => {
    const targetTime = new Date();
    const [hours, minutes] = targetDepartureTime.split(":").map(Number);
    targetTime.setHours(hours, minutes, 0, 0);

    // Check existing active bookings for conflicts within 2-hour window
    const conflictingBooking = bookings.find((booking) => {
      if (booking.status !== "active") return false;

      const bookingTime = new Date();
      const [bookingHours, bookingMinutes] = booking.departureTime
        .split(":")
        .map(Number);
      bookingTime.setHours(bookingHours, bookingMinutes, 0, 0);

      // Check if the new booking is within 2 hours of existing booking
      const timeDiff = Math.abs(targetTime.getTime() - bookingTime.getTime());
      const twoHoursInMs = 2 * 60 * 60 * 1000; // 2 hours in milliseconds

      return timeDiff < twoHoursInMs;
    });

    return {
      canBook: !conflictingBooking,
      conflictingBooking,
    };
  };

  // Book seat handler
  const handleBookSeat = () => {
    if (!selectedBus || !selectedSeat) {
      Alert.alert("Error", "Please select a seat to book.");
      return;
    }

    // Check if user can book within this time slot
    const { canBook, conflictingBooking } = canBookInTimeSlot(
      selectedBus.departureTime
    );

    if (!canBook && conflictingBooking) {
      Alert.alert(
        "⚠️ Booking Restriction",
        `You already have a booking for ${conflictingBooking.busRoute} at ${conflictingBooking.departureTime}.\n\nTo ensure fair access for all students, you can only book one seat within a 2-hour time window.\n\nPlease cancel your existing booking or choose a bus departing at least 2 hours apart.`,
        [
          {
            text: "View My Bookings",
            onPress: () => setCurrentView("bookings"),
          },
          {
            text: "Choose Different Time",
            style: "cancel",
            onPress: () => {
              setSelectedBus(null);
              setSelectedSeat("");
              setCurrentView("list");
            },
          },
        ]
      );
      return;
    }

    const newBooking: BusBooking = {
      id: Date.now().toString(),
      busId: selectedBus.id,
      busRoute: selectedBus.routeName,
      seatNumber: selectedSeat,
      departureTime: selectedBus.departureTime,
      bookingTime: new Date(),
      status: "active",
    };

    const updatedBookings = [...bookings, newBooking];
    setBookings(updatedBookings);
    onUpdateBookings?.(updatedBookings);

    // Update global booked seats
    const updatedGlobalBookedSeats = {
      ...globalBookedSeats,
      [selectedBus.id]: [
        ...(globalBookedSeats[selectedBus.id] || []),
        selectedSeat,
      ],
    };
    setGlobalBookedSeats(updatedGlobalBookedSeats);
    onUpdateBookedSeats?.(updatedGlobalBookedSeats);

    // Update bus available seats
    const updatedSchedules = busSchedules.map((bus) =>
      bus.id === selectedBus.id
        ? { ...bus, availableSeats: bus.availableSeats - 1 }
        : bus
    );
    setBusSchedules(updatedSchedules);

    // Regenerate seats to show the booked seat
    setBusSeats(generateBusSeats(selectedBus.id));
    setSelectedSeat("");

    Alert.alert(
      "Success! 🎉",
      `Seat ${selectedSeat} booked successfully for ${selectedBus.routeName}.\n\nDeparture: ${selectedBus.departureTime}\n\n⏰ Remember: You can book another seat only after 2 hours from this departure time to ensure fair access for all students.`,
      [
        {
          text: "View Bookings",
          onPress: () => setCurrentView("bookings"),
        },
        {
          text: "Back to Buses",
          onPress: () => setCurrentView("list"),
        },
      ]
    );
  };

  // Utility functions for styling
  const getSeatColor = (seat: BusSeat) => {
    if (seat.isSelected) return "#4CAF50"; // Green for selected
    if (seat.isBooked) return "#F44336"; // Red for booked
    if (seat.isFaculty) return "#000000"; // Black for faculty
    return "#E0E0E0"; // Gray for available
  };

  const getSeatBorderColor = (seat: BusSeat) => {
    if (seat.isSelected) return "#2E7D32";
    if (seat.isBooked) return "#C62828";
    if (seat.isFaculty) return "#424242";
    return "#BDBDBD";
  };

  // Render enhanced bus card with colorful themes
  const renderBusCard = (bus: BusSchedule) => {
    const getBorderColor = (color: string) => {
      const colorMap: { [key: string]: string } = {
        "#E3F2FD": "#1976D2", // Blue
        "#F3E5F5": "#7B1FA2", // Purple
        "#E8F5E8": "#388E3C", // Green
        "#FFF3E0": "#F57C00", // Orange
        "#FFEBEE": "#D32F2F", // Red
      };
      return colorMap[color] || "#000000";
    };

    // Check if user is restricted from booking this bus
    const { canBook, conflictingBooking } = canBookInTimeSlot(
      bus.departureTime
    );
    const isRestricted = !canBook;

    return (
      <TouchableOpacity
        key={bus.id}
        style={[
          styles.busCard,
          {
            backgroundColor: isDarkMode ? "#1F2937" : bus.color,
            borderColor: getBorderColor(bus.color),
            borderWidth: 2,
          },
        ]}
        onPress={() => handleBusSelect(bus)}
      >
        <View style={styles.busCardHeader}>
          <View style={styles.busIconContainer}>
            <Bus size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
          </View>
          <View style={styles.busInfoContainer}>
            <Text
              style={[
                styles.routeName,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
            >
              {bus.routeName}
            </Text>
            <View style={styles.routeDetails}>
              <MapPin size={14} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
              <Text
                style={[
                  styles.routeText,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                {bus.origin} → {bus.destination}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.busCardBody}>
          <View style={styles.timeContainer}>
            <Clock size={16} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            <Text
              style={[
                styles.timeText,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
            >
              {bus.departureTime} - {bus.arrivalTime}
            </Text>
          </View>

          <View style={styles.seatsContainer}>
            <Users size={16} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
            <Text
              style={[
                styles.seatsText,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
            >
              {bus.availableSeats}/{bus.totalSeats} seats
            </Text>
          </View>
        </View>

        {bus.driverNotification && (
          <View
            style={[
              styles.notificationContainer,
              { backgroundColor: isDarkMode ? "#FEF3C7" : "#FEF3C7" },
            ]}
          >
            <AlertCircle size={14} color="#F59E0B" />
            <Text style={styles.notificationText}>
              {bus.driverNotification}
            </Text>
          </View>
        )}

        {isRestricted && conflictingBooking && (
          <View
            style={[
              styles.restrictionContainer,
              { backgroundColor: isDarkMode ? "#7C2D12" : "#FEF2F2" },
            ]}
          >
            <AlertCircle size={14} color="#EF4444" />
            <Text style={[styles.restrictionText, { color: "#EF4444" }]}>
              Booking restricted due to existing booking at{" "}
              {conflictingBooking.departureTime}
            </Text>
          </View>
        )}

        <View style={styles.busCardFooter}>
          <Text
            style={[
              styles.readyToBookText,
              {
                color: isRestricted
                  ? isDarkMode
                    ? "#6B7280"
                    : "#9CA3AF"
                  : isDarkMode
                  ? "#9CA3AF"
                  : "#6B7280",
              },
            ]}
          >
            {isRestricted ? "Booking restricted" : "Ready to book"}
          </Text>
          <TouchableOpacity
            style={[
              styles.bookButton,
              {
                backgroundColor: isRestricted
                  ? isDarkMode
                    ? "#4B5563"
                    : "#E5E7EB"
                  : isDarkMode
                  ? "#FFFFFF"
                  : "#000000",
                opacity: isRestricted ? 0.6 : 1,
              },
            ]}
            onPress={() => {
              if (isRestricted) {
                Alert.alert(
                  "⚠️ Booking Restricted",
                  `You cannot book this bus as you already have a booking for ${conflictingBooking?.busRoute} at ${conflictingBooking?.departureTime}.\n\nYou can only book one seat within a 2-hour time window.`,
                  [
                    {
                      text: "View My Bookings",
                      onPress: () => setCurrentView("bookings"),
                    },
                    { text: "OK", style: "cancel" },
                  ]
                );
              } else {
                handleBusSelect(bus);
              }
            }}
            disabled={isRestricted}
          >
            <Text
              style={[
                styles.bookButtonText,
                {
                  color: isRestricted
                    ? isDarkMode
                      ? "#9CA3AF"
                      : "#6B7280"
                    : isDarkMode
                    ? "#000000"
                    : "#FFFFFF",
                },
              ]}
            >
              {isRestricted ? "Restricted" : "Select Seat"}
            </Text>
            {!isRestricted && (
              <ArrowRight
                size={16}
                color={isDarkMode ? "#000000" : "#FFFFFF"}
              />
            )}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render enhanced seat selection interface
  const renderSeatSelection = () => (
    <View
      style={[
        styles.seatContainer,
        { backgroundColor: isDarkMode ? "#000000" : "#FFFFFF" },
      ]}
    >
      {/* Professional Header */}
      <View
        style={[
          styles.seatHeader,
          {
            backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
            borderBottomColor: isDarkMode ? "#374151" : "#E5E7EB",
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.backButton,
            {
              backgroundColor: isDarkMode ? "#374151" : "#F3F4F6",
              borderRadius: 12,
              padding: 8,
            },
          ]}
          onPress={() => setCurrentView("list")}
        >
          <ArrowLeft size={20} color={isDarkMode ? "#FFFFFF" : "#000000"} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text
            style={[
              styles.seatHeaderTitle,
              { color: isDarkMode ? "#FFFFFF" : "#000000" },
            ]}
          >
            Choose Your Seat
          </Text>
          <Text
            style={[
              styles.seatHeaderSubtitle,
              { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            Select your preferred seat for the journey
          </Text>
        </View>
      </View>

      {/* Enhanced Bus Info Card */}
      {selectedBus && (
        <View
          style={[
            styles.busInfoCardEnhanced,
            {
              backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
              borderColor: isDarkMode ? "#374151" : "#E5E7EB",
            },
          ]}
        >
          <View style={styles.busInfoHeader}>
            <Text
              style={[
                styles.busInfoRouteTitle,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
            >
              {selectedBus.routeName}
            </Text>
            <View
              style={[styles.busStatusBadge, { backgroundColor: "#4CAF50" }]}
            >
              <Text style={styles.busStatusText}>ACTIVE</Text>
            </View>
          </View>

          <View style={styles.busInfoGrid}>
            <View style={styles.busInfoGridItem}>
              <MapPin size={18} color="#4CAF50" />
              <Text
                style={[
                  styles.busInfoLabel,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                From
              </Text>
              <Text
                style={[
                  styles.busInfoValue,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                {selectedBus.origin}
              </Text>
            </View>
            <View style={styles.busInfoGridDivider}>
              <ArrowRight
                size={16}
                color={isDarkMode ? "#9CA3AF" : "#6B7280"}
              />
            </View>
            <View style={styles.busInfoGridItem}>
              <MapPin size={18} color="#FF9800" />
              <Text
                style={[
                  styles.busInfoLabel,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                To
              </Text>
              <Text
                style={[
                  styles.busInfoValue,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                {selectedBus.destination}
              </Text>
            </View>
          </View>

          <View style={styles.busInfoFooterEnhanced}>
            <View style={styles.busInfoTimeRow}>
              <Clock size={16} color="#2196F3" />
              <Text
                style={[
                  styles.busInfoTimeText,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                {selectedBus.departureTime}
              </Text>
            </View>
            <View style={styles.busInfoSeatsRow}>
              <Users size={16} color="#9C27B0" />
              <Text
                style={[
                  styles.busInfoSeatsText,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                {selectedBus.availableSeats} available
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Enhanced Seat Legend */}
      <View
        style={[
          styles.seatLegendEnhanced,
          {
            backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
            borderColor: isDarkMode ? "#374151" : "#E5E7EB",
          },
        ]}
      >
        <Text
          style={[
            styles.legendTitle,
            { color: isDarkMode ? "#FFFFFF" : "#000000" },
          ]}
        >
          Seat Legend
        </Text>
        <View style={styles.legendGrid}>
          <View style={styles.legendItemEnhanced}>
            <View
              style={[
                styles.legendSeatEnhanced,
                { backgroundColor: "#E0E0E0", borderColor: "#BDBDBD" },
              ]}
            />
            <Text
              style={[
                styles.legendTextEnhanced,
                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              Available
            </Text>
          </View>
          <View style={styles.legendItemEnhanced}>
            <View
              style={[
                styles.legendSeatEnhanced,
                { backgroundColor: "#4CAF50", borderColor: "#2E7D32" },
              ]}
            >
              <Check size={12} color="#FFFFFF" />
            </View>
            <Text
              style={[
                styles.legendTextEnhanced,
                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              Selected
            </Text>
          </View>
          <View style={styles.legendItemEnhanced}>
            <View
              style={[
                styles.legendSeatEnhanced,
                { backgroundColor: "#F44336", borderColor: "#C62828" },
              ]}
            />
            <Text
              style={[
                styles.legendTextEnhanced,
                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              Booked
            </Text>
          </View>
          <View style={styles.legendItemEnhanced}>
            <View
              style={[
                styles.legendSeatEnhanced,
                { backgroundColor: "#000000", borderColor: "#424242" },
              ]}
            />
            <Text
              style={[
                styles.legendTextEnhanced,
                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              Faculty
            </Text>
          </View>
        </View>
      </View>

      {/* Enhanced Bus Layout */}
      <ScrollView
        style={styles.seatGridEnhanced}
        contentContainerStyle={styles.seatScrollContent}
      >
        <View
          style={[
            styles.busLayoutEnhanced,
            { backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF" },
          ]}
        >
          {/* Driver Section */}
          <View
            style={[
              styles.driverSection,
              { backgroundColor: isDarkMode ? "#374151" : "#F3F4F6" },
            ]}
          >
            <View style={styles.driverIcon}>
              <Text style={styles.driverEmoji}>👨‍💼</Text>
            </View>
            <Text
              style={[
                styles.driverLabelEnhanced,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
            >
              Driver
            </Text>
          </View>

          {/* Seat Grid */}
          <View style={styles.seatRows}>
            {Array.from({ length: 11 }, (_, rowIndex) => {
              const row = rowIndex + 1;
              const rowSeats = busSeats.filter((seat) => seat.row === row);
              const leftSeats = rowSeats.filter((seat) => seat.position <= 2);
              const rightSeats = rowSeats.filter((seat) => seat.position > 2);

              return (
                <View key={row} style={styles.seatRowEnhanced}>
                  <Text
                    style={[
                      styles.rowNumber,
                      { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    {row}
                  </Text>

                  <View style={styles.seatGroupEnhanced}>
                    {leftSeats.map((seat) => (
                      <TouchableOpacity
                        key={seat.id}
                        style={[
                          styles.seatEnhanced,
                          {
                            backgroundColor: getSeatColor(seat),
                            borderColor: getSeatBorderColor(seat),
                          },
                        ]}
                        onPress={() => handleSeatSelect(seat)}
                        disabled={!seat.isAvailable}
                      >
                        <Text
                          style={[
                            styles.seatNumberEnhanced,
                            {
                              color:
                                seat.isSelected || seat.isFaculty
                                  ? "#FFFFFF"
                                  : "#000000",
                            },
                          ]}
                        >
                          {seat.seatNumber}
                        </Text>
                        {seat.isSelected && (
                          <View style={styles.selectedIcon}>
                            <Check size={8} color="#FFFFFF" />
                          </View>
                        )}
                        {seat.isBooked && !seat.isSelected && (
                          <View style={styles.bookedIcon}>
                            <X size={8} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View
                    style={[
                      styles.aisleEnhanced,
                      { backgroundColor: isDarkMode ? "#374151" : "#E5E7EB" },
                    ]}
                  />

                  <View style={styles.seatGroupEnhanced}>
                    {rightSeats.map((seat) => (
                      <TouchableOpacity
                        key={seat.id}
                        style={[
                          styles.seatEnhanced,
                          {
                            backgroundColor: getSeatColor(seat),
                            borderColor: getSeatBorderColor(seat),
                          },
                        ]}
                        onPress={() => handleSeatSelect(seat)}
                        disabled={!seat.isAvailable}
                      >
                        <Text
                          style={[
                            styles.seatNumberEnhanced,
                            {
                              color:
                                seat.isSelected || seat.isFaculty
                                  ? "#FFFFFF"
                                  : "#000000",
                            },
                          ]}
                        >
                          {seat.seatNumber}
                        </Text>
                        {seat.isSelected && (
                          <View style={styles.selectedIcon}>
                            <Check size={8} color="#FFFFFF" />
                          </View>
                        )}
                        {seat.isBooked && !seat.isSelected && (
                          <View style={styles.bookedIcon}>
                            <X size={8} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text
                    style={[
                      styles.rowNumber,
                      { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    {row}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Enhanced Booking Footer */}
      {selectedSeat && (
        <View
          style={[
            styles.bookingFooterEnhanced,
            {
              backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
              borderTopColor: isDarkMode ? "#374151" : "#E5E7EB",
            },
          ]}
        >
          <View style={styles.selectedSeatInfoEnhanced}>
            <View style={styles.selectedSeatHeader}>
              <Check size={16} color="#4CAF50" />
              <Text
                style={[
                  styles.selectedSeatTextEnhanced,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                Seat {selectedSeat}
              </Text>
            </View>
            <Text
              style={[
                styles.selectedSeatSubtext,
                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              {selectedBus?.routeName} • {selectedBus?.departureTime}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.confirmButtonEnhanced,
              { backgroundColor: "#4CAF50" },
            ]}
            onPress={handleBookSeat}
          >
            <Text style={styles.confirmButtonTextEnhanced}>
              Confirm Booking
            </Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  // Render enhanced bookings interface
  const renderBookings = () => {
    // Separate active and completed bookings
    const activeBookings = bookings.filter(
      (booking) => booking.status === "active"
    );
    const completedBookings = bookings.filter(
      (booking) => booking.status !== "active"
    );

    const getBookingCardColor = (booking: BusBooking, index: number) => {
      const colors = ["#E3F2FD", "#F3E5F5", "#E8F5E8", "#FFF3E0", "#FFEBEE"];
      return colors[index % colors.length];
    };

    const getStatusColor = (status: string) => {
      switch (status) {
        case "active":
          return "#4CAF50";
        case "completed":
          return "#2196F3";
        case "expired":
          return "#FF9800";
        default:
          return "#9CA3AF";
      }
    };

    const getStatusIcon = (status: string) => {
      switch (status) {
        case "active":
          return "🟢";
        case "completed":
          return "✅";
        case "expired":
          return "⏰";
        default:
          return "⚪";
      }
    };

    return (
      <View
        style={[
          styles.modernBookingsContainer,
          { backgroundColor: isDarkMode ? "#000000" : "#F8FAFC" },
        ]}
      >
        {/* Enhanced Header */}
        <View
          style={[
            styles.modernBookingsHeader,
            {
              backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.modernBackButton,
              {
                backgroundColor: isDarkMode ? "#374151" : "#F3F4F6",
              },
            ]}
            onPress={() => setCurrentView("list")}
          >
            <ArrowLeft size={20} color={isDarkMode ? "#FFFFFF" : "#000000"} />
          </TouchableOpacity>

          <View style={styles.modernHeaderContent}>
            <Text
              style={[
                styles.modernBookingsTitle,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
              ]}
            >
              My Bookings
            </Text>
            <Text
              style={[
                styles.modernBookingsSubtitle,
                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
              ]}
            >
              {bookings.length} total booking{bookings.length !== 1 ? "s" : ""}
            </Text>
          </View>

          <View style={styles.modernHeaderStats}>
            <View style={[styles.statBadge, { backgroundColor: "#4CAF50" }]}>
              <Text style={styles.statBadgeText}>{activeBookings.length}</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.modernBookingsList}
          showsVerticalScrollIndicator={false}
        >
          {bookings.length === 0 ? (
            <View style={styles.modernEmptyState}>
              <View style={styles.emptyStateIconContainer}>
                <Text style={styles.emptyStateIcon}>🚌</Text>
              </View>
              <Text
                style={[
                  styles.modernEmptyStateTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                No bookings yet
              </Text>
              <Text
                style={[
                  styles.modernEmptyStateSubtext,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                Book your first bus seat to get started with your campus
                transportation
              </Text>
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => setCurrentView("list")}
              >
                <Text style={styles.emptyStateButtonText}>Browse Buses</Text>
                <ArrowRight size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Active Bookings Section */}
              {activeBookings.length > 0 && (
                <View style={styles.bookingSection}>
                  <View style={styles.sectionHeader}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: isDarkMode ? "#FFFFFF" : "#000000" },
                      ]}
                    >
                      🟢 Active Bookings
                    </Text>
                    <Text
                      style={[
                        styles.sectionCount,
                        { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                      ]}
                    >
                      {activeBookings.length} booking
                      {activeBookings.length !== 1 ? "s" : ""}
                    </Text>
                  </View>

                  {activeBookings.map((booking, index) => (
                    <View
                      key={booking.id}
                      style={[
                        styles.modernBookingCard,
                        {
                          backgroundColor: isDarkMode
                            ? "#1F2937"
                            : getBookingCardColor(booking, index),
                        },
                      ]}
                    >
                      <View style={styles.modernBookingHeader}>
                        <View style={styles.modernBookingIconSection}>
                          <View
                            style={[
                              styles.modernBookingIcon,
                              {
                                backgroundColor: getStatusColor(booking.status),
                              },
                            ]}
                          >
                            <Bus size={20} color="#FFFFFF" />
                          </View>
                          <View style={styles.modernBookingTitleSection}>
                            <Text
                              style={[
                                styles.modernBookingRoute,
                                { color: isDarkMode ? "#FFFFFF" : "#000000" },
                              ]}
                            >
                              {booking.busRoute}
                            </Text>
                            <Text
                              style={[
                                styles.modernBookingTime,
                                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                              ]}
                            >
                              Departure: {booking.departureTime}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.modernStatusBadge,
                            { backgroundColor: getStatusColor(booking.status) },
                          ]}
                        >
                          <Text style={styles.modernStatusText}>
                            {getStatusIcon(booking.status)}{" "}
                            {booking.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.modernBookingDetails}>
                        <View style={styles.detailRow}>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailIcon}>🪑</Text>
                            <Text
                              style={[
                                styles.detailLabel,
                                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                              ]}
                            >
                              Seat Number
                            </Text>
                            <Text
                              style={[
                                styles.detailValue,
                                { color: isDarkMode ? "#FFFFFF" : "#000000" },
                              ]}
                            >
                              {booking.seatNumber}
                            </Text>
                          </View>

                          <View style={styles.detailItem}>
                            <Text style={styles.detailIcon}>📅</Text>
                            <Text
                              style={[
                                styles.detailLabel,
                                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                              ]}
                            >
                              Booked On
                            </Text>
                            <Text
                              style={[
                                styles.detailValue,
                                { color: isDarkMode ? "#FFFFFF" : "#000000" },
                              ]}
                            >
                              {booking.bookingTime.toLocaleDateString()}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.modernBookingActions}>
                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              { backgroundColor: "#EF4444" },
                            ]}
                            onPress={() => {
                              Alert.alert(
                                "Cancel Booking",
                                `Are you sure you want to cancel your booking for seat ${booking.seatNumber} on ${booking.busRoute}?`,
                                [
                                  { text: "Keep Booking", style: "cancel" },
                                  {
                                    text: "Cancel Booking",
                                    style: "destructive",
                                    onPress: () => {
                                      const updatedBookings = bookings.filter(
                                        (b) => b.id !== booking.id
                                      );
                                      setBookings(updatedBookings);
                                      onUpdateBookings?.(updatedBookings);

                                      // Update global booked seats
                                      const updatedGlobalBookedSeats = {
                                        ...globalBookedSeats,
                                      };
                                      if (
                                        updatedGlobalBookedSeats[booking.busId]
                                      ) {
                                        updatedGlobalBookedSeats[
                                          booking.busId
                                        ] = updatedGlobalBookedSeats[
                                          booking.busId
                                        ].filter(
                                          (seat) => seat !== booking.seatNumber
                                        );
                                      }
                                      setGlobalBookedSeats(
                                        updatedGlobalBookedSeats
                                      );
                                      onUpdateBookedSeats?.(
                                        updatedGlobalBookedSeats
                                      );

                                      Alert.alert(
                                        "✅ Booking Cancelled",
                                        "Your booking has been cancelled successfully."
                                      );
                                    },
                                  },
                                ]
                              );
                            }}
                          >
                            <X size={14} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Cancel</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={[
                              styles.actionButton,
                              { backgroundColor: "#4CAF50" },
                            ]}
                            onPress={() => {
                              Alert.alert(
                                "🚌 Booking Details",
                                `Route: ${booking.busRoute}\nSeat: ${
                                  booking.seatNumber
                                }\nDeparture: ${
                                  booking.departureTime
                                }\nStatus: ${
                                  booking.status
                                }\nBooked: ${booking.bookingTime.toLocaleDateString()}`,
                                [{ text: "OK" }]
                              );
                            }}
                          >
                            <Info size={14} color="#FFFFFF" />
                            <Text style={styles.actionButtonText}>Details</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Completed Bookings Section */}
              {completedBookings.length > 0 && (
                <View style={styles.bookingSection}>
                  <View style={styles.sectionHeader}>
                    <Text
                      style={[
                        styles.sectionTitle,
                        { color: isDarkMode ? "#FFFFFF" : "#000000" },
                      ]}
                    >
                      📋 Booking History
                    </Text>
                    <Text
                      style={[
                        styles.sectionCount,
                        { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                      ]}
                    >
                      {completedBookings.length} booking
                      {completedBookings.length !== 1 ? "s" : ""}
                    </Text>
                  </View>

                  {completedBookings.map((booking, index) => (
                    <View
                      key={booking.id}
                      style={[
                        styles.modernBookingCard,
                        styles.completedBookingCard,
                        {
                          backgroundColor: isDarkMode ? "#111827" : "#F8F9FA",
                          opacity: 0.8,
                        },
                      ]}
                    >
                      <View style={styles.modernBookingHeader}>
                        <View style={styles.modernBookingIconSection}>
                          <View
                            style={[
                              styles.modernBookingIcon,
                              {
                                backgroundColor: getStatusColor(booking.status),
                              },
                            ]}
                          >
                            <Bus size={20} color="#FFFFFF" />
                          </View>
                          <View style={styles.modernBookingTitleSection}>
                            <Text
                              style={[
                                styles.modernBookingRoute,
                                { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                              ]}
                            >
                              {booking.busRoute}
                            </Text>
                            <Text
                              style={[
                                styles.modernBookingTime,
                                { color: isDarkMode ? "#6B7280" : "#9CA3AF" },
                              ]}
                            >
                              Departure: {booking.departureTime}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.modernStatusBadge,
                            { backgroundColor: getStatusColor(booking.status) },
                          ]}
                        >
                          <Text style={styles.modernStatusText}>
                            {getStatusIcon(booking.status)}{" "}
                            {booking.status.toUpperCase()}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.modernBookingDetails}>
                        <View style={styles.detailRow}>
                          <View style={styles.detailItem}>
                            <Text style={styles.detailIcon}>🪑</Text>
                            <Text
                              style={[
                                styles.detailLabel,
                                { color: isDarkMode ? "#6B7280" : "#9CA3AF" },
                              ]}
                            >
                              Seat: {booking.seatNumber}
                            </Text>
                          </View>

                          <View style={styles.detailItem}>
                            <Text style={styles.detailIcon}>📅</Text>
                            <Text
                              style={[
                                styles.detailLabel,
                                { color: isDarkMode ? "#6B7280" : "#9CA3AF" },
                              ]}
                            >
                              Booked: {booking.bookingTime.toLocaleDateString()}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
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
              styles.modernBookingsButton,
              {
                backgroundColor: isDarkMode ? "#4CAF50" : "#4CAF50",
              },
            ]}
            onPress={() => setCurrentView("bookings")}
          >
            <Calendar size={16} color="#FFFFFF" />
            <Text style={styles.modernBookingsText}>
              My Bookings ({bookings.length})
            </Text>
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

      {/* Enhanced Simple Schedule Toggle */}
      <View style={styles.scheduleToggleSection}>
        <View
          style={[
            styles.toggleContainer,
            {
              backgroundColor: isDarkMode ? "#374151" : "#F3F4F6",
              marginHorizontal: 20,
              borderRadius: 16,
              padding: 6,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 4,
              elevation: 2,
            },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.toggleButton,
              scheduleType === "weekday" && styles.activeToggle,
              {
                backgroundColor:
                  scheduleType === "weekday" ? "#2196F3" : "transparent",
                borderRadius: 12,
                paddingVertical: 14,
                shadowColor:
                  scheduleType === "weekday" ? "#2196F3" : "transparent",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: scheduleType === "weekday" ? 0.3 : 0,
                shadowRadius: 4,
                elevation: scheduleType === "weekday" ? 3 : 0,
              },
            ]}
            onPress={() => setScheduleType("weekday")}
          >
            <Text
              style={[
                styles.toggleText,
                scheduleType === "weekday" && styles.activeToggleText,
                {
                  color:
                    scheduleType === "weekday"
                      ? "#FFFFFF"
                      : isDarkMode
                      ? "#D1D5DB"
                      : "#6B7280",
                  fontWeight: scheduleType === "weekday" ? "700" : "600",
                  fontSize: 15,
                },
              ]}
            >
              📚 Weekdays (Mon. to Fri.)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.toggleButton,
              scheduleType === "weekend" && styles.activeToggle,
              {
                backgroundColor:
                  scheduleType === "weekend" ? "#9C27B0" : "transparent",
                borderRadius: 12,
                paddingVertical: 14,
                shadowColor:
                  scheduleType === "weekend" ? "#9C27B0" : "transparent",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: scheduleType === "weekend" ? 0.3 : 0,
                shadowRadius: 4,
                elevation: scheduleType === "weekend" ? 3 : 0,
              },
            ]}
            onPress={() => setScheduleType("weekend")}
          >
            <Text
              style={[
                styles.toggleText,
                scheduleType === "weekend" && styles.activeToggleText,
                {
                  color:
                    scheduleType === "weekend"
                      ? "#FFFFFF"
                      : isDarkMode
                      ? "#D1D5DB"
                      : "#6B7280",
                  fontWeight: scheduleType === "weekend" ? "700" : "600",
                  fontSize: 15,
                },
              ]}
            >
              🎉 Weekends & Holidays
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Time Filter Tabs */}
      <View style={styles.timeFilterSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScrollHorizontal}
          contentContainerStyle={styles.filterScrollContent}
        >
          {[
            { key: "all", label: "All", emoji: "🚌", color: "#4CAF50" },
            { key: "morning", label: "Morning", emoji: "🌅", color: "#FF9800" },
            {
              key: "afternoon",
              label: "Afternoon",
              emoji: "☀️",
              color: "#2196F3",
            },
            { key: "evening", label: "Evening", emoji: "🌆", color: "#9C27B0" },
          ].map((filter) => (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.modernFilterChip,
                timeFilter === filter.key && styles.activeFilterChip,
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
                  shadowColor:
                    timeFilter === filter.key ? filter.color : "#000",
                },
              ]}
              onPress={() => setTimeFilter(filter.key as any)}
            >
              <Text style={styles.filterEmoji}>{filter.emoji}</Text>
              <Text
                style={[
                  styles.modernFilterText,
                  {
                    color:
                      timeFilter === filter.key
                        ? "#FFFFFF"
                        : isDarkMode
                        ? "#FFFFFF"
                        : "#000000",
                  },
                ]}
              >
                {filter.label}
              </Text>
              {timeFilter === filter.key && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>
                    {filteredBuses.length}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Bus Cards */}
      <ScrollView style={styles.busListScroll}>
        <Text
          style={[
            styles.sectionTitle,
            { color: isDarkMode ? "#FFFFFF" : "#000000" },
          ]}
        >
          {scheduleType === "weekend"
            ? "🎉 Weekends & Holidays Schedule"
            : "📚 Weekdays Schedule (Monday to Friday)"}
        </Text>
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
      count: `${bookings.length}`,
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
                    {currentUser?.branch} • {currentUser?.year}
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
                      count: bookings.length,
                      color: "#9C27B0",
                      action: () => {
                        onToggleSidebar?.();
                        setCurrentView("bookings");
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
        <View style={styles.container}>
          {currentView === "list" && renderBusList()}
          {currentView === "seats" && renderSeatSelection()}
          {currentView === "bookings" && renderBookings()}
        </View>

        {/* Seat Unavailable Modal */}
        <Modal
          visible={showSeatUnavailableModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowSeatUnavailableModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View
              style={[
                styles.modalContent,
                { backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF" },
              ]}
            >
              <AlertCircle size={48} color="#F44336" />
              <Text
                style={[
                  styles.modalTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                Seat Unavailable
              </Text>
              <Text
                style={[
                  styles.modalMessage,
                  { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                ]}
              >
                This seat is already booked or reserved for faculty. Please
                select a different seat.
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowSeatUnavailableModal(false)}
              >
                <Text style={styles.modalButtonText}>Got it!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
});

export default BusBookingSystem;
