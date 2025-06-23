-- LNMIIT Carpool System Database Setup
-- Run this script in your Supabase SQL Editor

-- 1. Create carpool_rides table
CREATE TABLE IF NOT EXISTS carpool_rides (
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

-- 2. Create join_requests table
CREATE TABLE IF NOT EXISTS join_requests (
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

-- 3. Create ride_passengers table
CREATE TABLE IF NOT EXISTS ride_passengers (
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

-- 4. Create ride_chats table
CREATE TABLE IF NOT EXISTS ride_chats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ride_id UUID NOT NULL REFERENCES carpool_rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  user_name VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  message_type VARCHAR(20) DEFAULT 'text' CHECK (message_type IN ('text', 'location', 'system')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
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

-- 6. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  type VARCHAR(50) NOT NULL CHECK (type IN ('join_request', 'request_accepted', 'request_rejected', 'ride_updated', 'ride_cancelled', 'chat_message')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE carpool_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE join_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view active rides" ON carpool_rides;
DROP POLICY IF EXISTS "Users can create their own rides" ON carpool_rides;
DROP POLICY IF EXISTS "Drivers can update their own rides" ON carpool_rides;
DROP POLICY IF EXISTS "Users can view requests for their rides or their own requests" ON join_requests;
DROP POLICY IF EXISTS "Users can create join requests" ON join_requests;
DROP POLICY IF EXISTS "Drivers can update requests for their rides" ON join_requests;
DROP POLICY IF EXISTS "Anyone can view confirmed passengers" ON ride_passengers;
DROP POLICY IF EXISTS "Users and drivers can add passengers" ON ride_passengers;
DROP POLICY IF EXISTS "Ride participants can view chat messages" ON ride_chats;
DROP POLICY IF EXISTS "Ride participants can send messages" ON ride_chats;
DROP POLICY IF EXISTS "Anyone can view profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- Create RLS Policies

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

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_carpool_rides_status ON carpool_rides(status);
CREATE INDEX IF NOT EXISTS idx_carpool_rides_driver ON carpool_rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_carpool_rides_date ON carpool_rides(departure_date);
CREATE INDEX IF NOT EXISTS idx_join_requests_ride ON join_requests(ride_id);
CREATE INDEX IF NOT EXISTS idx_join_requests_passenger ON join_requests(passenger_id);
CREATE INDEX IF NOT EXISTS idx_ride_passengers_ride ON ride_passengers(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_chats_ride ON ride_chats(ride_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- Insert some sample data for testing (optional)
-- Note: Replace with actual user IDs from your auth.users table

-- INSERT INTO carpool_rides (
--   driver_id, driver_name, driver_email, from_location, to_location,
--   departure_time, departure_date, available_seats, total_seats,
--   price_per_seat, vehicle_make, vehicle_model, instant_booking
-- ) VALUES 
-- (
--   '00000000-0000-0000-0000-000000000000', -- Replace with actual user ID
--   'Sample Driver',
--   'driver@lnmiit.ac.in',
--   'LNMIIT Main Gate',
--   'Jaipur Railway Station',
--   NOW() + INTERVAL '2 hours',
--   CURRENT_DATE + INTERVAL '1 day',
--   3,
--   4,
--   120.00,
--   'Hyundai',
--   'i20',
--   true
-- );

COMMIT; 