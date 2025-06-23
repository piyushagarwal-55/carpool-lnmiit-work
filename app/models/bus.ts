export interface Bus {
  id: string;
  routeName: string;
  vehicleNumber: string;
  capacity: number;
  amenities: string[];
  status: "active" | "maintenance" | "inactive";
  driverId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BusRoute {
  id: string;
  busId: string;
  origin: string;
  destination: string;
  stops: BusStop[];
  departureTime: string;
  arrivalTime: string;
  price: number;
  isActive: boolean;
  operatingDays: string[]; // ['monday', 'tuesday', etc.]
}

export interface BusStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  estimatedArrival: string;
  order: number;
}

export interface BusSchedule {
  id: string;
  routeId: string;
  date: Date;
  departureTime: string;
  arrivalTime: string;
  availableSeats: number;
  totalSeats: number;
  price: number;
  status: "scheduled" | "in_transit" | "completed" | "cancelled";
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated: Date;
  };
}

export interface BusSeat {
  id: string;
  scheduleId: string;
  seatNumber: string;
  isAvailable: boolean;
  isReserved: boolean;
  passengerId?: string;
  bookedAt?: Date;
}

export interface BusBooking {
  id: string;
  scheduleId: string;
  passengerId: string;
  seatNumbers: string[];
  totalAmount: number;
  status: "booked" | "confirmed" | "completed" | "cancelled";
  ticketNumber: string;
  boardingStop: string;
  alightingStop: string;
  bookedAt: Date;
  paymentStatus: "pending" | "completed" | "failed" | "refunded";
}

export interface CreateBusBookingRequest {
  scheduleId: string;
  seatNumbers: string[];
  boardingStop: string;
  alightingStop: string;
}

export interface BusSearchFilters {
  origin?: string;
  destination?: string;
  date?: string;
  departureTime?: string;
}

// Dummy default export to satisfy Expo Router
export default function BusModel() {
  return null;
}
