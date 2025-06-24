# LNMIIT Carpool System - Database Setup Guide

This guide will help you set up the database for the LNMIIT Carpool System using Supabase (PostgreSQL).

## Prerequisites

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **SQL Editor Access**: You'll need access to the Supabase SQL Editor
3. **Project Setup**: Create a new Supabase project

## Setup Steps

### 1. Create New Supabase Project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: `lnmiit-carpool`
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your location (Asia South for India)
5. Click "Create new project"
6. Wait for the project to be ready (usually 2-3 minutes)

### 2. Execute Database Schema

1. Go to your project dashboard
2. Click on **"SQL Editor"** in the left sidebar
3. Click **"New query"**
4. Copy the entire content from `database-schema.sql` file
5. Paste it into the SQL editor
6. Click **"Run"** (or press Ctrl/Cmd + Enter)
7. Wait for execution to complete (should see "Success" message)

### 3. Verify Database Setup

After running the schema, you should see these tables in your database:

#### Core Tables

- `profiles` - User profiles extending Supabase auth
- `carpool_rides` - Main rides table
- `ride_requests` - Join requests for rides
- `notifications` - User notifications
- `chat_messages` - Ride chat messages
- `bus_schedules` - Bus route schedules
- `bus_bookings` - Bus seat bookings

#### Verify Setup

1. Go to **"Table Editor"** in Supabase dashboard
2. You should see all tables listed
3. Check `bus_schedules` table - it should have sample data (8 routes)

### 4. Configure Supabase in Your App

1. Go to **"Settings"** → **"API"** in your Supabase dashboard
2. Copy your project credentials:

```typescript
// In your app/lib/supabase.ts file
export const supabaseUrl = "YOUR_SUPABASE_URL";
export const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY";
```

### 5. Environment Variables

Create a `.env.local` file in your project root:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Schema Overview

### Tables Structure

#### 1. `profiles` - User Profiles

```sql
- id (UUID, Primary Key, references auth.users)
- email, full_name, phone, avatar_url
- student_id (e.g., 21UCS045)
- branch, year, joining_year
- hostel_block, room_number
- rating, total_rides_given, total_rides_taken
- preferences (JSONB)
- verification fields
```

#### 2. `carpool_rides` - Ride Listings

```sql
- id (UUID, Primary Key)
- driver_id (references profiles)
- route info (from_location, to_location, departure_time)
- seat info (total_seats, available_seats, booked_seats)
- pricing (price_per_seat, total_earnings)
- vehicle info (make, model, color, is_ac)
- preferences (smoking, music, pets, gender)
- status tracking
```

#### 3. `ride_requests` - Join Requests

```sql
- id (UUID, Primary Key)
- ride_id (references carpool_rides)
- passenger_id (references profiles)
- seats_requested, pickup_location, dropoff_location
- status (pending, accepted, rejected, cancelled)
- messages and timestamps
```

#### 4. `notifications` - User Notifications

```sql
- id (UUID, Primary Key)
- user_id (references profiles)
- type, title, message
- data (JSONB for additional info)
- read status and timestamps
```

#### 5. `chat_messages` - Ride Chat

```sql
- id (UUID, Primary Key)
- ride_id (references carpool_rides)
- sender_id (references profiles)
- message, message_type
- read_by (JSONB array)
```

#### 6. `bus_schedules` - Bus Routes

```sql
- id (UUID, Primary Key)
- route_name, origin, destination
- departure_time, arrival_time
- days_of_week (array)
- bus info and driver details
```

#### 7. `bus_bookings` - Bus Seat Reservations

```sql
- id (UUID, Primary Key)
- user_id (references profiles)
- schedule_id (references bus_schedules)
- booking_date, seat_number
- status tracking
```

## Row Level Security (RLS)

The database includes comprehensive RLS policies:

- **Profiles**: Public read, own record write
- **Carpool Rides**: Public read, driver write/update/delete
- **Ride Requests**: Driver and passenger can view/modify
- **Notifications**: Users see only their notifications
- **Chat Messages**: Only ride participants can view/send
- **Bus Bookings**: Users see only their bookings

## Features Included

### 1. Automatic Data Management

- **Triggers**: Auto-update timestamps
- **Functions**: Seat management when requests accepted/rejected
- **Constraints**: Data validation and integrity
- **Indexes**: Optimized query performance

### 2. Sample Data

- **8 Bus Routes**: Pre-populated LNMIIT bus schedules
- **Popular Routes**: LNMIIT to/from major Jaipur locations

### 3. Advanced Features

- **Real-time Updates**: Automatic seat availability updates
- **Notification System**: Auto-notifications for ride events
- **Chat System**: Message read receipts
- **Analytics**: User stats and popular routes
- **Cleanup Functions**: Automatic old data cleanup

## API Usage

The database works with the comprehensive API in `app/api/carpool.ts`:

### Available APIs

- `carpoolAPI` - Ride CRUD operations
- `rideRequestsAPI` - Join request management
- `chatAPI` - Chat message handling
- `analyticsAPI` - User stats and analytics
- `carpoolUtils` - Helper functions

### Example Usage

```typescript
import { carpoolAPI } from "../api/carpool";

// Get all active rides
const { data: rides, error } = await carpoolAPI.getAllRides();

// Create new ride
const rideData = {
  driver_id: "user-uuid",
  driver_name: "John Doe",
  driver_email: "john@lnmiit.ac.in",
  from_location: "LNMIIT Campus",
  to_location: "Jaipur Railway Station",
  departure_time: "2024-01-15T09:00:00Z",
  departure_date: "2024-01-15",
  available_seats: 3,
  total_seats: 3,
  price_per_seat: 100,
};

const { data: newRide, error } = await carpoolAPI.createRide(rideData);
```

## Testing the Setup

### 1. Authentication Test

1. Try signing up a new user in your app
2. Check if profile is created in `profiles` table

### 2. Ride Creation Test

1. Create a test ride using the API
2. Verify it appears in `carpool_rides` table
3. Check if you can filter and search rides

### 3. Request Flow Test

1. Create a ride request
2. Accept/reject the request
3. Verify seat counts update automatically
4. Check notifications are created

### 4. Bus System Test

1. View bus schedules in your app
2. Try booking a seat
3. Verify booking appears in `bus_bookings` table

## Maintenance

### Regular Cleanup (Optional)

Run this function periodically to clean old data:

```sql
SELECT cleanup_expired_data();
```

### Monitor Performance

- Check table sizes in Supabase dashboard
- Monitor API response times
- Review RLS policy performance

## Troubleshooting

### Common Issues

1. **RLS Permission Denied**

   - Ensure user is authenticated
   - Check if RLS policies allow the operation
   - Verify user ID matches the policy requirements

2. **Constraint Violations**

   - Check required fields are provided
   - Verify foreign key references exist
   - Ensure data types match schema

3. **Trigger Errors**
   - Check if seat counts are within valid ranges
   - Verify ride status transitions are valid
   - Ensure referenced records exist

### Debugging Queries

```sql
-- Check user profile
SELECT * FROM profiles WHERE email = 'user@lnmiit.ac.in';

-- Check active rides
SELECT * FROM carpool_rides WHERE status = 'active';

-- Check ride requests for a ride
SELECT * FROM ride_requests WHERE ride_id = 'ride-uuid';

-- Check user notifications
SELECT * FROM notifications WHERE user_id = 'user-uuid' ORDER BY created_at DESC;
```

## Security Notes

1. **API Keys**: Keep your Supabase keys secure
2. **RLS Policies**: Don't disable RLS without understanding implications
3. **Data Validation**: Client-side validation + database constraints
4. **User Authentication**: Always verify user auth status

## Support

If you encounter issues:

1. Check Supabase logs in dashboard
2. Review RLS policies for permission issues
3. Verify API endpoint responses
4. Check browser console for client-side errors

---

**Database Schema Version**: 1.0  
**Last Updated**: December 2024  
**Compatible with**: Supabase PostgreSQL 15+
