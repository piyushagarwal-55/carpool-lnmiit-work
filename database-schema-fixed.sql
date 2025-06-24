-- LNMIIT Carpool Database Schema
-- Fixed version with all issues resolved
-- Compatible with PostgreSQL and Supabase

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types for better data validation
CREATE TYPE user_role AS ENUM ('student', 'faculty', 'staff');
CREATE TYPE ride_status AS ENUM ('active', 'full', 'started', 'completed', 'cancelled', 'expired');
CREATE TYPE request_status AS ENUM ('pending', 'accepted', 'rejected', 'cancelled');
CREATE TYPE booking_status AS ENUM ('active', 'cancelled', 'completed');
CREATE TYPE notification_type AS ENUM (
  'ride_request', 'request_accepted', 'request_rejected', 
  'ride_update', 'ride_cancelled', 'ride_reminder',
  'chat_message', 'payment_received', 'rating_received',
  'chat_request'
);
CREATE TYPE priority_level AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE gender_preference AS ENUM ('male', 'female', 'any');
CREATE TYPE message_type AS ENUM ('text', 'image', 'location', 'system');
CREATE TYPE passenger_status AS ENUM ('pending', 'accepted', 'confirmed');

-- Create user_profiles table
CREATE TABLE user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Authentication
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  
  -- Profile Information
  avatar_url TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  
  -- LNMIIT Specific
  student_id TEXT UNIQUE,
  roll_number TEXT,
  branch_code TEXT,
  branch_full TEXT,
  joining_year INTEGER,
  academic_year TEXT,
  user_role user_role DEFAULT 'student',
  
  -- Location & Verification
  current_location JSONB DEFAULT '{}'::jsonb,
  home_location TEXT,
  is_verified BOOLEAN DEFAULT false,
  verification_document_url TEXT,
  
  -- Safety & Ratings
  rating DECIMAL(3,2) DEFAULT 4.5 CHECK (rating >= 0 AND rating <= 5),
  total_ratings INTEGER DEFAULT 0,
  safety_score INTEGER DEFAULT 100 CHECK (safety_score >= 0 AND safety_score <= 100),
  emergency_contact JSONB DEFAULT '{}'::jsonb,
  
  -- Activity
  total_rides_as_driver INTEGER DEFAULT 0,
  total_rides_as_passenger INTEGER DEFAULT 0,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_online BOOLEAN DEFAULT false,
  
  -- Settings
  notification_preferences JSONB DEFAULT '{"email": true, "push": true, "sms": false}'::jsonb,
  privacy_settings JSONB DEFAULT '{"show_phone": true, "show_location": false}'::jsonb,
  
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~* '^\+?[1-9]\d{1,14}$')
);

-- Create carpool_rides table
CREATE TABLE carpool_rides (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Driver Information
  driver_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  driver_name TEXT NOT NULL,
  driver_email TEXT NOT NULL,
  driver_phone TEXT,
  driver_rating DECIMAL(3,2) DEFAULT 4.5,
  
  -- Route Information
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  departure_date DATE NOT NULL,
  departure_time TIMESTAMP WITH TIME ZONE NOT NULL,
  estimated_duration INTEGER DEFAULT 30, -- in minutes
  route_details JSONB DEFAULT '[]'::jsonb, -- Waypoints, stops, etc.
  
  -- Seat Information
  total_seats INTEGER NOT NULL CHECK (total_seats > 0 AND total_seats <= 8),
  available_seats INTEGER NOT NULL CHECK (available_seats >= 0),
  booked_seats INTEGER DEFAULT 0 CHECK (booked_seats >= 0),
  
  -- Pricing
  price_per_seat DECIMAL(10,2) NOT NULL CHECK (price_per_seat >= 0),
  total_earnings DECIMAL(10,2) DEFAULT 0.0,
  
  -- Vehicle Information
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_color TEXT,
  vehicle_number TEXT,
  license_plate TEXT,
  is_ac BOOLEAN DEFAULT true,
  
  -- Ride Preferences
  smoking_allowed BOOLEAN DEFAULT false,
  music_allowed BOOLEAN DEFAULT true,
  pets_allowed BOOLEAN DEFAULT false,
  gender_preference gender_preference DEFAULT 'any',
  
  -- Booking Settings
  instant_booking BOOLEAN DEFAULT true,
  advance_booking_hours INTEGER DEFAULT 1,
  chat_enabled BOOLEAN DEFAULT true,
  
  -- Status Management
  status ride_status DEFAULT 'active',
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern JSONB DEFAULT '{}'::jsonb,
  
  -- Expiry Management (30 minutes after departure time)
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Additional Information
  description TEXT,
  special_instructions TEXT,
  luggage_allowed BOOLEAN DEFAULT true,
  
  -- Tracking
  current_location JSONB DEFAULT '{}'::jsonb,
  is_live BOOLEAN DEFAULT false,
  
  CONSTRAINT valid_seats CHECK (available_seats <= total_seats),
  CONSTRAINT valid_departure CHECK (departure_time > created_at)
);

-- Create ride_requests table (for join requests)
CREATE TABLE ride_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Request Information
  ride_id UUID REFERENCES carpool_rides(id) ON DELETE CASCADE NOT NULL,
  passenger_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_email TEXT NOT NULL,
  passenger_phone TEXT,
  
  -- Request Details
  seats_requested INTEGER DEFAULT 1 CHECK (seats_requested > 0 AND seats_requested <= 4),
  pickup_location TEXT,
  dropoff_location TEXT,
  message TEXT,
  
  -- Status
  status request_status DEFAULT 'pending',
  responded_at TIMESTAMP WITH TIME ZONE,
  
  -- Driver Response
  driver_message TEXT,
  rejection_reason TEXT,
  
  UNIQUE(ride_id, passenger_id)
);

-- Create ride_passengers table (for confirmed passengers)
CREATE TABLE ride_passengers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Passenger Information
  ride_id UUID REFERENCES carpool_rides(id) ON DELETE CASCADE NOT NULL,
  passenger_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_email TEXT NOT NULL,
  seats_booked INTEGER NOT NULL CHECK (seats_booked > 0),
  
  -- Status
  status passenger_status DEFAULT 'confirmed',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(ride_id, passenger_id)
);

-- Create notifications table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Recipient
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Notification Content
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Additional Data
  data JSONB DEFAULT '{}'::jsonb,
  action_url TEXT,
  
  -- Status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  priority priority_level DEFAULT 'normal'
);

-- Create chat_messages table
CREATE TABLE chat_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Chat Context
  ride_id UUID REFERENCES carpool_rides(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  sender_name TEXT NOT NULL,
  sender_photo TEXT,
  
  -- Message Content
  message TEXT NOT NULL,
  message_type message_type DEFAULT 'text',
  reply_to UUID REFERENCES chat_messages(id),
  
  -- Message Status
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE,
  
  -- Read Receipts
  read_by JSONB DEFAULT '[]'::jsonb, -- Array of user IDs who have read this message
  
  CONSTRAINT valid_message CHECK (length(trim(message)) > 0)
);

-- Create chat_participants table
CREATE TABLE chat_participants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Participant Information
  ride_id UUID REFERENCES carpool_rides(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  user_photo TEXT,
  
  -- Status
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  
  UNIQUE(ride_id, user_id)
);

-- Create bus_schedules table
CREATE TABLE bus_schedules (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Route Information
  route_name TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  
  -- Schedule
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL, -- [1,2,3,4,5] for Mon-Fri
  
  -- Bus Information
  bus_number TEXT,
  total_seats INTEGER DEFAULT 40 CHECK (total_seats > 0),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  driver_name TEXT,
  driver_phone TEXT,
  
  -- Additional Info
  fare DECIMAL(10,2) DEFAULT 0.0,
  notes TEXT
);

-- Create bus_bookings table
CREATE TABLE bus_bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Booking Information
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE NOT NULL,
  schedule_id UUID REFERENCES bus_schedules(id) ON DELETE CASCADE NOT NULL,
  booking_date DATE NOT NULL,
  
  -- Seat Information
  seat_number TEXT NOT NULL,
  
  -- Status
  status booking_status DEFAULT 'active',
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Constraints
  UNIQUE(schedule_id, booking_date, seat_number),
  CONSTRAINT future_booking CHECK (booking_date >= current_date)
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_student_id ON user_profiles(student_id);
CREATE INDEX idx_user_profiles_branch_code ON user_profiles(branch_code);

CREATE INDEX idx_carpool_rides_driver ON carpool_rides(driver_id);
CREATE INDEX idx_carpool_rides_departure ON carpool_rides(departure_date, departure_time);
CREATE INDEX idx_carpool_rides_route ON carpool_rides(from_location, to_location);
CREATE INDEX idx_carpool_rides_status ON carpool_rides(status);
CREATE INDEX idx_carpool_rides_expires ON carpool_rides(expires_at);

CREATE INDEX idx_ride_requests_ride ON ride_requests(ride_id);
CREATE INDEX idx_ride_requests_passenger ON ride_requests(passenger_id);
CREATE INDEX idx_ride_requests_status ON ride_requests(status);

CREATE INDEX idx_ride_passengers_ride ON ride_passengers(ride_id);
CREATE INDEX idx_ride_passengers_passenger ON ride_passengers(passenger_id);

CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(user_id, read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX idx_chat_messages_ride ON chat_messages(ride_id);
CREATE INDEX idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX idx_chat_messages_created ON chat_messages(created_at DESC);

CREATE INDEX idx_chat_participants_ride ON chat_participants(ride_id);
CREATE INDEX idx_chat_participants_user ON chat_participants(user_id);

CREATE INDEX idx_bus_bookings_user ON bus_bookings(user_id);
CREATE INDEX idx_bus_bookings_schedule ON bus_bookings(schedule_id, booking_date);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_carpool_rides_updated_at BEFORE UPDATE ON carpool_rides
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_ride_requests_updated_at BEFORE UPDATE ON ride_requests
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_bus_schedules_updated_at BEFORE UPDATE ON bus_schedules
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create email parsing function
CREATE OR REPLACE FUNCTION parse_email_info(email TEXT)
RETURNS TABLE(joining_year TEXT, branch_code TEXT, branch_full TEXT) AS $$
BEGIN
  -- Extract year from email (first 2 digits)
  joining_year := SUBSTRING(email FROM '(\d{2})[A-Z]+\d+@');
  
  -- Extract branch code (letters after year)
  branch_code := UPPER(SUBSTRING(email FROM '\d{2}([A-Z]+)\d+@'));
  
  -- Map branch codes to full names
  CASE branch_code
    WHEN 'UCS' THEN branch_full := 'Undergraduate Computer Science';
    WHEN 'UEC' THEN branch_full := 'Undergraduate Electronics and Communication';
    WHEN 'UCC' THEN branch_full := 'Undergraduate Computer and Communication';
    WHEN 'UME' THEN branch_full := 'Undergraduate Mechanical Engineering';
    WHEN 'UCE' THEN branch_full := 'Undergraduate Civil Engineering';
    WHEN 'UEE' THEN branch_full := 'Undergraduate Electrical Engineering';
    WHEN 'UCA' THEN branch_full := 'Undergraduate Chemical Engineering';
    WHEN 'UBI' THEN branch_full := 'Undergraduate Biotechnology';
    WHEN 'UMA' THEN branch_full := 'Undergraduate Mathematics';
    WHEN 'UPH' THEN branch_full := 'Undergraduate Physics';
    WHEN 'UCH' THEN branch_full := 'Undergraduate Chemistry';
    WHEN 'MBA' THEN branch_full := 'Master of Business Administration';
    WHEN 'MCA' THEN branch_full := 'Master of Computer Applications';
    WHEN 'MTH' THEN branch_full := 'Master of Technology';
    ELSE branch_full := 'Unknown Branch';
  END CASE;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Create auto-expire function
CREATE OR REPLACE FUNCTION auto_expire_rides()
RETURNS void AS $$
BEGIN
  UPDATE carpool_rides 
  SET status = 'expired'
  WHERE status = 'active' 
    AND NOW() > expires_at;
END;
$$ LANGUAGE plpgsql;

-- Function to update ride seats when request is accepted
CREATE OR REPLACE FUNCTION update_ride_seats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Add passenger to ride_passengers table
    INSERT INTO ride_passengers (
      ride_id, passenger_id, passenger_name, passenger_email, seats_booked
    ) VALUES (
      NEW.ride_id, NEW.passenger_id, NEW.passenger_name, NEW.passenger_email, NEW.seats_requested
    ) ON CONFLICT (ride_id, passenger_id) DO NOTHING;
    
    -- Update available seats
    UPDATE carpool_rides 
    SET 
      available_seats = available_seats - NEW.seats_requested,
      booked_seats = booked_seats + NEW.seats_requested
    WHERE id = NEW.ride_id;
    
    -- Update status to full if no seats left
    UPDATE carpool_rides 
    SET status = 'full'
    WHERE id = NEW.ride_id AND available_seats = 0;
    
  ELSIF NEW.status = 'rejected' AND OLD.status = 'accepted' THEN
    -- Remove from passengers if was previously accepted
    DELETE FROM ride_passengers 
    WHERE ride_id = NEW.ride_id AND passenger_id = NEW.passenger_id;
    
    -- Return seats
    UPDATE carpool_rides 
    SET 
      available_seats = available_seats + NEW.seats_requested,
      booked_seats = booked_seats - NEW.seats_requested,
      status = CASE WHEN status = 'full' THEN 'active' ELSE status END
    WHERE id = NEW.ride_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for seat management
CREATE TRIGGER manage_ride_seats
  AFTER UPDATE ON ride_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_ride_seats();

-- Function to set expires_at when ride is created or updated
CREATE OR REPLACE FUNCTION set_ride_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Set expires_at to 30 minutes after departure_time
  NEW.expires_at := NEW.departure_time + INTERVAL '30 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for setting expiry time
CREATE TRIGGER set_ride_expiry_trigger
  BEFORE INSERT OR UPDATE OF departure_time ON carpool_rides
  FOR EACH ROW
  EXECUTE FUNCTION set_ride_expiry();

-- Profile edit tracking function
CREATE OR REPLACE FUNCTION track_profile_edits()
RETURNS TRIGGER AS $$
BEGIN
  -- Log significant profile changes
  IF OLD.phone IS DISTINCT FROM NEW.phone 
     OR OLD.emergency_contact IS DISTINCT FROM NEW.emergency_contact
     OR OLD.home_location IS DISTINCT FROM NEW.home_location THEN
    -- You can add logging logic here if needed
    NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for profile edit tracking
CREATE TRIGGER track_profile_edits_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION track_profile_edits();

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE carpool_rides ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE ride_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE bus_bookings ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON user_profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Carpool rides policies
CREATE POLICY "Carpool rides are viewable by everyone" ON carpool_rides
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own rides" ON carpool_rides
  FOR INSERT WITH CHECK (auth.uid() = driver_id);

CREATE POLICY "Users can update their own rides" ON carpool_rides
  FOR UPDATE USING (auth.uid() = driver_id);

CREATE POLICY "Users can delete their own rides" ON carpool_rides
  FOR DELETE USING (auth.uid() = driver_id);

-- Ride requests policies
CREATE POLICY "Ride requests are viewable by ride driver and requester" ON ride_requests
  FOR SELECT USING (
    auth.uid() = passenger_id OR 
    auth.uid() = (SELECT driver_id FROM carpool_rides WHERE id = ride_id)
  );

CREATE POLICY "Users can insert their own ride requests" ON ride_requests
  FOR INSERT WITH CHECK (auth.uid() = passenger_id);

CREATE POLICY "Users can update their own requests or drivers can update requests for their rides" ON ride_requests
  FOR UPDATE USING (
    auth.uid() = passenger_id OR 
    auth.uid() = (SELECT driver_id FROM carpool_rides WHERE id = ride_id)
  );

-- Ride passengers policies
CREATE POLICY "Anyone can view confirmed passengers" ON ride_passengers
  FOR SELECT USING (true);

CREATE POLICY "System can manage passengers" ON ride_passengers
  FOR ALL USING (true);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Chat messages policies
CREATE POLICY "Chat messages are viewable by ride participants" ON chat_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR
    auth.uid() = (SELECT driver_id FROM carpool_rides WHERE id = ride_id) OR
    auth.uid() IN (
      SELECT passenger_id FROM ride_passengers 
      WHERE ride_id = chat_messages.ride_id
    )
  );

CREATE POLICY "Ride participants can insert chat messages" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND (
      auth.uid() = (SELECT driver_id FROM carpool_rides WHERE id = ride_id) OR
      auth.uid() IN (
        SELECT passenger_id FROM ride_passengers 
        WHERE ride_id = chat_messages.ride_id
      )
    )
  );

CREATE POLICY "Users can update their own messages" ON chat_messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Chat participants policies
CREATE POLICY "Chat participants are viewable by ride participants" ON chat_participants
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() = (SELECT driver_id FROM carpool_rides WHERE id = ride_id) OR
    auth.uid() IN (
      SELECT passenger_id FROM ride_passengers 
      WHERE ride_id = chat_participants.ride_id
    )
  );

CREATE POLICY "System can manage chat participants" ON chat_participants
  FOR ALL USING (true);

-- Bus schedules policies (public read)
CREATE POLICY "Bus schedules are viewable by everyone" ON bus_schedules
  FOR SELECT USING (true);

-- Bus bookings policies
CREATE POLICY "Users can view their own bookings" ON bus_bookings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookings" ON bus_bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" ON bus_bookings
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert sample bus schedules
INSERT INTO bus_schedules (route_name, origin, destination, departure_time, arrival_time, days_of_week, bus_number, total_seats, driver_name, driver_phone, fare) VALUES
  ('LNMIIT to Raja Park', 'LNMIIT Campus', 'Raja Park', '06:00:00', '06:40:00', '{1,2,3,4,5}', 'RJ14-BUS-001', 40, 'Ramesh Kumar', '+91-9876543210', 25.00),
  ('LNMIIT to Ajmeri Gate', 'LNMIIT Campus', 'Ajmeri Gate', '06:00:00', '06:45:00', '{1,2,3,4,5}', 'RJ14-BUS-002', 40, 'Suresh Sharma', '+91-9876543211', 30.00),
  ('Raja Park to LNMIIT', 'Raja Park', 'LNMIIT Campus', '07:15:00', '07:55:00', '{1,2,3,4,5}', 'RJ14-BUS-001', 40, 'Ramesh Kumar', '+91-9876543210', 25.00),
  ('Ajmeri Gate to LNMIIT', 'Ajmeri Gate', 'LNMIIT Campus', '07:15:00', '08:00:00', '{1,2,3,4,5}', 'RJ14-BUS-002', 40, 'Suresh Sharma', '+91-9876543211', 30.00),
  ('LNMIIT to Railway Station', 'LNMIIT Campus', 'Jaipur Railway Station', '08:00:00', '09:00:00', '{1,2,3,4,5}', 'RJ14-BUS-003', 40, 'Mohan Lal', '+91-9876543212', 50.00),
  ('Railway Station to LNMIIT', 'Jaipur Railway Station', 'LNMIIT Campus', '17:00:00', '18:00:00', '{1,2,3,4,5}', 'RJ14-BUS-003', 40, 'Mohan Lal', '+91-9876543212', 50.00),
  ('LNMIIT to Airport', 'LNMIIT Campus', 'Jaipur Airport', '10:00:00', '11:15:00', '{1,2,3,4,5,6,7}', 'RJ14-BUS-004', 40, 'Vikram Singh', '+91-9876543213', 75.00),
  ('Airport to LNMIIT', 'Jaipur Airport', 'LNMIIT Campus', '15:00:00', '16:15:00', '{1,2,3,4,5,6,7}', 'RJ14-BUS-004', 40, 'Vikram Singh', '+91-9876543213', 75.00);

-- Create helpful views (Fixed version)
CREATE OR REPLACE VIEW ride_summary AS
SELECT 
  r.*,
  p.full_name AS driver_full_name,
  p.avatar_url AS driver_avatar,
  p.rating AS driver_rating,
  (r.total_seats - r.available_seats) AS passengers_count,
  CASE 
    WHEN r.expires_at < now() THEN 'expired'
    WHEN r.available_seats = 0 THEN 'full'
    ELSE r.status::text
  END AS computed_status
FROM carpool_rides r
JOIN user_profiles p ON p.id = r.driver_id
WHERE r.status IN ('active', 'full') AND r.expires_at > now();

-- Create view for active rides with expiry info
CREATE OR REPLACE VIEW active_rides_with_expiry AS
SELECT 
  *,
  CASE 
    WHEN NOW() > expires_at THEN 'expired'
    ELSE status::text
  END AS actual_status,
  EXTRACT(EPOCH FROM (expires_at - NOW())) / 60 AS minutes_until_expiry
FROM carpool_rides 
WHERE status IN ('active', 'full', 'expired')
   OR NOW() <= expires_at;

-- Function to cleanup expired data
CREATE OR REPLACE FUNCTION cleanup_expired_data()
RETURNS void AS $$
BEGIN
  -- Delete expired ride requests
  DELETE FROM ride_requests 
  WHERE created_at < now() - interval '7 days'
    AND status IN ('rejected', 'cancelled');
  
  -- Mark old rides as completed
  UPDATE carpool_rides 
  SET status = 'completed'
  WHERE expires_at < now() - interval '2 hours'
    AND status IN ('active', 'full', 'started');
  
  -- Delete old notifications (keep for 30 days)
  DELETE FROM notifications 
  WHERE created_at < now() - interval '30 days';
  
  -- Delete old chat messages (keep for 30 days)
  DELETE FROM chat_messages 
  WHERE created_at < now() - interval '30 days';
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ LNMIIT Carpool Database Schema created successfully!';
  RAISE NOTICE '✅ All tables, indexes, and constraints created';
  RAISE NOTICE '✅ Row Level Security policies configured';
  RAISE NOTICE '✅ Sample bus schedules inserted';
  RAISE NOTICE '✅ Helper functions and views created';
  RAISE NOTICE '🚀 Database is ready for the carpool application!';
END $$; 