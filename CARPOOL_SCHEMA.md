# LNMIIT Carpool System - Enhanced Schema & Features

## 🚗 Overview

The LNMIIT Carpool system has been enhanced with comprehensive ride sharing functionality including join requests, instant booking, chat integration, and driver-passenger interaction systems.

## 📋 Enhanced Data Schema

### CarpoolRide Interface

```typescript
interface CarpoolRide {
  id: string;
  driverId: string;
  driverName: string;
  driverRating: number;
  driverPhoto: string;
  driverBranch: string;
  driverYear: string;
  driverPhone?: string;
  from: string;
  to: string;
  departureTime: string;
  date: string;
  availableSeats: number;
  totalSeats: number;
  pricePerSeat: number;
  vehicleInfo: VehicleInfo;
  route: string[];
  preferences: RidePreferences;
  status: "active" | "full" | "completed" | "cancelled";
  passengers: CarpoolPassenger[];
  pendingRequests: JoinRequest[]; // NEW: Join requests from passengers
  instantBooking: boolean; // NEW: Auto-accept vs manual approval
  chatEnabled: boolean; // NEW: Group chat functionality
  createdAt: string;
}
```

### CarpoolPassenger Interface

```typescript
interface CarpoolPassenger {
  id: string;
  name: string;
  photo: string;
  branch?: string;
  year?: string;
  rating?: number;
  phone?: string;
  joinedAt: string;
  status: "pending" | "accepted" | "confirmed"; // Enhanced status tracking
  seatsBooked: number; // Multiple seats per passenger
  pickupPoint?: string;
  dropoffPoint?: string;
  paymentStatus: "pending" | "paid" | "refunded";
}
```

### JoinRequest Interface (NEW)

```typescript
interface JoinRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhoto: string;
  passengerBranch?: string;
  passengerYear?: string;
  passengerRating?: number;
  seatsRequested: number;
  message?: string; // Optional message to driver
  pickupPreference?: string;
  dropoffPreference?: string;
  requestedAt: string;
  status: "pending" | "accepted" | "rejected" | "cancelled";
}
```

## 🎯 Core Features

### 1. Two Booking Systems

- **Instant Booking**: Passengers can immediately join rides (instant confirmation)
- **Request-Based**: Driver manually approves join requests

### 2. Join Request System

- Passengers can send join requests with custom messages
- Seat quantity selection (1 to available seats)
- Driver approval workflow
- Request status tracking

### 3. Enhanced Ride Display

- **Instant Booking Badge**: ⚡ Instant indicator
- **Pending Requests**: 📩 Shows count for drivers
- **Chat Enabled**: 💬 Chat indicator
- **Status-Based Actions**: Different buttons based on user relationship

### 4. Chat Integration

- Group chat for each ride
- Participants: Driver + confirmed passengers
- Real-time messaging via Socket.IO
- Message reactions and replies

### 5. Smart Action Buttons

- **For Non-Passengers**: "Book Now" or "Request Join" based on ride type
- **For Passengers**: "Chat" button when enabled
- **Status Indicators**: ✓ Joined, ⏳ Pending Approval

## 🔧 User Workflows

### Passenger Journey

1. **Browse Available Rides**

   - See instant booking vs request-based rides
   - View driver ratings and vehicle info
   - Check route and preferences

2. **Join a Ride**

   - **Instant Booking**: Immediate confirmation
   - **Request-Based**: Fill join request form with message
   - Select number of seats needed

3. **Post-Join Activities**
   - Access group chat (if enabled)
   - Contact driver directly
   - Receive ride updates

### Driver Journey

1. **Create a Ride**

   - Set pickup/drop locations
   - Choose instant booking or manual approval
   - Configure preferences and vehicle details
   - Enable/disable group chat

2. **Manage Requests** (if not instant booking)

   - Review pending join requests
   - See passenger profiles and messages
   - Accept or reject requests

3. **Ride Management**
   - Monitor passenger status
   - Communicate via group chat
   - Update ride details if needed

## 🎨 UI/UX Enhancements

### Ride Cards

- **Color-coded by route**
- **Badge system**: Instant booking, pending requests, chat enabled
- **Smart action buttons**: Context-aware based on user status
- **Avatar display**: Driver + passengers preview

### Modals & Forms

- **Join Request Modal**: Seat selection + message to driver
- **Verification Modal**: Detailed ride and user information
- **Chat Integration**: Full-featured messaging system

### Status Indicators

- **⚡ Instant**: Quick booking available
- **📩 X Requests**: Pending requests for drivers
- **💬 Chat**: Group chat enabled
- **✓ Joined**: User has joined the ride
- **⏳ Pending**: Awaiting driver approval

## 🚀 Create Ride Functionality

### Floating Action Button (+)

- Prominent create ride button
- Launches comprehensive ride creation form
- Supports all new features (instant booking, chat, preferences)

### CreateRideScreen Features

- **Popular locations**: Quick selection for common routes
- **Vehicle information**: Make, model, color, AC status
- **Preference settings**: Gender preference, smoking, pets, music
- **Booking type selection**: Instant vs manual approval
- **Route planning**: Multiple stops support

## 🔄 State Management

### Enhanced States

```typescript
const [joinMessage, setJoinMessage] = useState("");
const [seatsToBook, setSeatsToBook] = useState(1);
const [showJoinRequestModal, setShowJoinRequestModal] = useState(false);
```

### Request Handling

```typescript
const confirmJoinRide = () => {
  if (selectedRideForJoin.instantBooking) {
    // Immediate booking
  } else {
    // Add to pending requests
  }
};
```

## 📱 API Integration Points

### New Endpoints Needed

- `POST /rides/join-request` - Submit join request
- `PUT /rides/requests/:id/respond` - Accept/reject requests
- `GET /rides/:id/chat` - Get chat messages
- `POST /rides/:id/chat/message` - Send chat message

### Enhanced Search & Filters

- Filter by instant booking
- Filter by chat enabled
- Sort by pending requests (for drivers)

## 🎯 Key Differentiators

1. **Dual Booking System**: Instant vs request-based for maximum flexibility
2. **Rich Join Requests**: Messages, seat selection, driver approval workflow
3. **Integrated Chat**: Real-time communication for ride coordination
4. **Smart UI**: Context-aware buttons and status indicators
5. **Comprehensive Ride Management**: Full lifecycle from creation to completion

## 📈 Future Enhancements

1. **Real-time Location Tracking**: Live driver location
2. **Payment Integration**: Automated fare collection
3. **Rating System**: Post-ride ratings and reviews
4. **Route Optimization**: AI-powered route suggestions
5. **Push Notifications**: Request updates, chat messages
6. **Advanced Filtering**: Time ranges, vehicle preferences, gender preferences

---

This enhanced schema provides a complete carpool solution with modern UX patterns, real-time communication, and flexible booking options suitable for the LNMIIT campus community.

# LNMIIT Carpool System - Database Schema

## Overview

This document describes the complete database schema and features for the LNMIIT Carpool System, including ride management, join requests, and chat functionality.

## Features

### Dual Booking System

- **Instant Booking**: Passengers can immediately join rides without driver approval
- **Request-Based Booking**: Passengers send requests with messages, requiring driver approval

### Enhanced User Experience

- Smart ride cards with status indicators (⚡ Instant, 📩 Requests, 💬 Chat)
- Context-aware action buttons that change based on ride type and user status
- Real-time seat availability and pending request counts
- Chat integration for ride coordination

## Database Schema

### 1. carpool_rides table

```sql
CREATE TABLE carpool_rides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES auth.users(id),
  driver_name VARCHAR(255) NOT NULL,
  driver_email VARCHAR(255) NOT NULL,
  driver_phone VARCHAR(20),
  from_location VARCHAR(255) NOT NULL,
  to_location VARCHAR(255) NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  departure_date DATE NOT NULL,
  available_seats INTEGER NOT NULL CHECK (available_seats >= 0),
  total_seats INTEGER NOT NULL CHECK (total_seats > 0),
  price_per_seat DECIMAL(10,2) NOT NULL CHECK (price_per_seat >= 0),
  vehicle_make VARCHAR(100),
  vehicle_model VARCHAR(100),
  vehicle_number VARCHAR(20),
  vehicle_color VARCHAR(50),
  is_ac BOOLEAN DEFAULT true,
  smoking_allowed BOOLEAN DEFAULT false,
  music_allowed BOOLEAN DEFAULT true,
  pets_allowed BOOLEAN DEFAULT false,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'full', 'completed', 'cancelled')),
  instant_booking BOOLEAN DEFAULT true,
  chat_enabled BOOLEAN DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2. join_requests table

```sql
CREATE TABLE join_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES carpool_rides(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES auth.users(id),
  passenger_name VARCHAR(255) NOT NULL,
  passenger_email VARCHAR(255) NOT NULL,
  seats_requested INTEGER NOT NULL CHECK (seats_requested > 0),
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ride_id, passenger_id)
);
```

### 3. ride_passengers table

```sql
CREATE TABLE ride_passengers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES carpool_rides(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES auth.users(id),
  passenger_name VARCHAR(255) NOT NULL,
  passenger_email VARCHAR(255) NOT NULL,
  seats_booked INTEGER NOT NULL CHECK (seats_booked > 0),
  status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('pending', 'accepted', 'confirmed')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(ride_id, passenger_id)
);
```

### 4. ride_chats table (for group chat functionality)

```sql
CREATE TABLE ride_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES carpool_rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'location', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 5. user_profiles table (extended user information)

```sql
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name VARCHAR(255),
  branch VARCHAR(100),
  year VARCHAR(20),
  phone VARCHAR(20),
  rating DECIMAL(3,2) DEFAULT 4.5 CHECK (rating >= 0 AND rating <= 5),
  total_rides INTEGER DEFAULT 0,
  profile_photo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE carpool_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Carpool rides policies
CREATE POLICY "Anyone can view active rides" ON carpool_rides
  FOR SELECT USING (status = 'active');

CREATE POLICY "Users can create their own rides" ON carpool_rides
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Drivers can update their own rides" ON carpool_rides
  FOR UPDATE USING (auth.uid() = driver_id);

-- Join requests policies
CREATE POLICY "Users can view requests for their rides or their own requests" ON join_requests
  FOR SELECT USING (
    auth.uid() = passenger_id OR
    auth.uid() IN (SELECT driver_id FROM carpool_rides WHERE id = ride_id)
  );

CREATE POLICY "Users can create join requests" ON join_requests
  FOR INSERT WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Drivers can update requests for their rides" ON join_requests
  FOR UPDATE USING (
    auth.uid() IN (SELECT driver_id FROM carpool_rides WHERE id = ride_id)
  );

-- Ride passengers policies
CREATE POLICY "Anyone can view confirmed passengers" ON ride_passengers
  FOR SELECT USING (true);

CREATE POLICY "Users and drivers can add passengers" ON ride_passengers
  FOR INSERT WITH CHECK (
    auth.uid() = passenger_id OR
    auth.uid() IN (SELECT driver_id FROM carpool_rides WHERE id = ride_id)
  );

-- Chat policies
CREATE POLICY "Ride participants can view chat messages" ON ride_chats
  FOR SELECT USING (
    auth.uid() IN (
      SELECT driver_id FROM carpool_rides WHERE id = ride_id
      UNION
      SELECT passenger_id FROM ride_passengers WHERE ride_id = ride_chats.ride_id
    )
  );

CREATE POLICY "Ride participants can send messages" ON ride_chats
  FOR INSERT WITH CHECK (
    auth.uid() IN (
      SELECT driver_id FROM carpool_rides WHERE id = ride_id
      UNION
      SELECT passenger_id FROM ride_passengers WHERE ride_id = ride_chats.ride_id
    )
  );

-- User profiles policies
CREATE POLICY "Anyone can view profiles" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR ALL USING (auth.uid() = id);
```

## API Integration Points

### Frontend Interfaces Used

```typescript
interface CarpoolRide {
  id: string;
  driverId: string;
  driverName: string;
  driverRating: number;
  driverPhoto: string;
  driverBranch: string;
  driverYear: string;
  driverPhone?: string;
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
  passengers: Array<CarpoolPassenger>;
  pendingRequests: Array<JoinRequest>;
  instantBooking: boolean;
  chatEnabled: boolean;
  createdAt: string;
}

interface JoinRequest {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhoto: string;
  seatsRequested: number;
  message?: string;
  requestedAt: string;
  status: "pending" | "accepted" | "rejected";
}

interface CarpoolPassenger {
  id: string;
  name: string;
  photo: string;
  joinedAt: string;
  status: "pending" | "accepted" | "confirmed";
  seatsBooked: number;
}
```

## User Workflows

### For Drivers

1. **Create Ride**: Fill ride details, set instant booking preference
2. **Manage Requests**: View and approve/reject join requests
3. **Chat with Passengers**: Group chat for coordination
4. **Update Ride Status**: Mark as completed or cancelled

### For Passengers

1. **Browse Rides**: View available rides with filters
2. **Join Rides**:
   - Instant booking: Immediate confirmation
   - Request-based: Send message and wait for approval
3. **Chat**: Coordinate with driver and other passengers
4. **Track Status**: Monitor booking status and ride updates

## Implementation Features

- **Real-time Updates**: Socket.io integration for live chat and status updates
- **Smart UI**: Context-aware buttons and status indicators
- **Responsive Design**: Optimized for mobile devices
- **Error Handling**: Comprehensive error handling and user feedback
- **Data Validation**: Client and server-side validation
- **Security**: Row-level security and authentication checks

## Future Enhancements

- **Rating System**: Post-ride ratings for drivers and passengers
- **Route Optimization**: Google Maps integration for optimal routes
- **Payment Integration**: In-app payment processing
- **Push Notifications**: Real-time notifications for ride updates
- **Advanced Filters**: Filter by gender, preferences, ratings
- **Recurring Rides**: Support for regular commute schedules
