export interface Ride {
  id: string;
  driverId: string;
  origin: string;
  destination: string;
  departureTime: Date;
  availableSeats: number;
  totalSeats: number;
  pricePerSeat: number;
  status: "active" | "completed" | "cancelled" | "in_progress";
  vehicleInfo: VehicleInfo;
  route?: RoutePoint[];
  passengers: RidePassenger[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VehicleInfo {
  make: string;
  model: string;
  color: string;
  licensePlate: string;
  year?: number;
}

export interface RoutePoint {
  latitude: number;
  longitude: number;
  address: string;
  estimatedTime?: Date;
}

export interface RidePassenger {
  id: string;
  rideId: string;
  passengerId: string;
  seatsBooked: number;
  status: "booked" | "confirmed" | "completed" | "cancelled";
  pickupPoint?: RoutePoint;
  dropoffPoint?: RoutePoint;
  bookedAt: Date;
}

export interface CreateRideRequest {
  origin: string;
  destination: string;
  departureTime: string;
  availableSeats: number;
  pricePerSeat: number;
  vehicleInfo: VehicleInfo;
  route?: RoutePoint[];
}

export interface BookRideRequest {
  rideId: string;
  seatsBooked: number;
  pickupPoint?: RoutePoint;
  dropoffPoint?: RoutePoint;
}

export interface RideSearchFilters {
  origin?: string;
  destination?: string;
  date?: string;
  maxPrice?: number;
  minSeats?: number;
}

export interface RideRating {
  id: string;
  rideId: string;
  raterId: string;
  ratedUserId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

// Dummy default export to satisfy Expo Router
export default function RideModel() {
  return null;
}
