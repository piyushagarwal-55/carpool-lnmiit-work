-- LNMIIT Carpool Database Migration Script
-- This script safely updates the existing database to fix all issues
-- Run this instead of the full schema if tables already exist

-- Start transaction for safety
BEGIN;

-- Drop the problematic view that has duplicate column issue
DROP VIEW IF EXISTS ride_summary CASCADE;

-- Drop the old view to recreate it properly
DROP VIEW IF EXISTS active_rides_with_expiry CASCADE;

-- Add missing columns to user_profiles table if they don't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS student_id TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact TEXT,
ADD COLUMN IF NOT EXISTS home_location TEXT,
ADD COLUMN IF NOT EXISTS branch_code TEXT,
ADD COLUMN IF NOT EXISTS joining_year TEXT,
ADD COLUMN IF NOT EXISTS current_year INTEGER,
ADD COLUMN IF NOT EXISTS rating DECIMAL(3,2) DEFAULT 4.5;

-- Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS ride_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES carpool_rides(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_email TEXT NOT NULL,
  seats_requested INTEGER NOT NULL DEFAULT 1,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ride_id, passenger_id)
);

CREATE TABLE IF NOT EXISTS ride_passengers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES carpool_rides(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL,
  passenger_name TEXT NOT NULL,
  passenger_email TEXT NOT NULL,
  seats_booked INTEGER NOT NULL DEFAULT 1,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ride_id, passenger_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'ride_request', 'ride_update')),
  read BOOLEAN DEFAULT FALSE,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES carpool_rides(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_name TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID NOT NULL REFERENCES carpool_rides(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_name TEXT NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ride_id, user_id)
);

CREATE TABLE IF NOT EXISTS bus_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_name TEXT NOT NULL,
  origin TEXT NOT NULL,
  destination TEXT NOT NULL,
  departure_time TIME NOT NULL,
  arrival_time TIME NOT NULL,
  days_of_week INTEGER[] NOT NULL, -- Array of day numbers (1=Monday, 7=Sunday)
  bus_number TEXT NOT NULL,
  total_seats INTEGER NOT NULL DEFAULT 40,
  driver_name TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  fare DECIMAL(10,2) NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bus_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  schedule_id UUID NOT NULL REFERENCES bus_schedules(id) ON DELETE CASCADE,
  passenger_name TEXT NOT NULL,
  passenger_email TEXT NOT NULL,
  passenger_phone TEXT,
  seat_number TEXT NOT NULL,
  booking_date DATE NOT NULL,
  fare_paid DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(schedule_id, seat_number, booking_date)
);

-- Now recreate the fixed views without the duplicate column issue
CREATE OR REPLACE VIEW ride_summary AS
SELECT 
  r.*,
  p.full_name AS driver_full_name,
  p.avatar_url AS driver_avatar,
  p.rating AS driver_user_rating,  -- Renamed to avoid conflict
  (r.total_seats - r.available_seats) AS passengers_count,
  CASE 
    WHEN r.expires_at < now() THEN 'expired'
    WHEN r.available_seats = 0 THEN 'full'
    ELSE r.status
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
    ELSE status
  END AS actual_status,
  EXTRACT(EPOCH FROM (expires_at - NOW())) / 60 AS minutes_until_expiry
FROM carpool_rides 
WHERE status IN ('active', 'full', 'expired')
   OR NOW() <= expires_at;

-- Update any missing functions
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create email parsing function (drop first to avoid return type conflict)
DROP FUNCTION IF EXISTS parse_email_info(TEXT);
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

-- Drop and recreate the trigger for seat management
DROP TRIGGER IF EXISTS manage_ride_seats ON ride_requests;
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

-- Drop and recreate the trigger for setting expiry time
DROP TRIGGER IF EXISTS set_ride_expiry_trigger ON carpool_rides;
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

-- Drop and recreate the trigger for profile edit tracking
DROP TRIGGER IF EXISTS track_profile_edits_trigger ON user_profiles;
CREATE TRIGGER track_profile_edits_trigger
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION track_profile_edits();

-- Drop and recreate updated_at triggers to ensure they exist
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_carpool_rides_updated_at ON carpool_rides;
CREATE TRIGGER update_carpool_rides_updated_at BEFORE UPDATE ON carpool_rides
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_ride_requests_updated_at ON ride_requests;
CREATE TRIGGER update_ride_requests_updated_at BEFORE UPDATE ON ride_requests
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_chat_messages_updated_at ON chat_messages;
CREATE TRIGGER update_chat_messages_updated_at BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_bus_schedules_updated_at ON bus_schedules;
CREATE TRIGGER update_bus_schedules_updated_at BEFORE UPDATE ON bus_schedules
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

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

-- Add any missing indexes (these will be ignored if they already exist)
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_student_id ON user_profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_branch_code ON user_profiles(branch_code);

CREATE INDEX IF NOT EXISTS idx_carpool_rides_driver ON carpool_rides(driver_id);
CREATE INDEX IF NOT EXISTS idx_carpool_rides_departure ON carpool_rides(departure_date, departure_time);
CREATE INDEX IF NOT EXISTS idx_carpool_rides_route ON carpool_rides(from_location, to_location);
CREATE INDEX IF NOT EXISTS idx_carpool_rides_status ON carpool_rides(status);
CREATE INDEX IF NOT EXISTS idx_carpool_rides_expires ON carpool_rides(expires_at);

CREATE INDEX IF NOT EXISTS idx_ride_requests_ride ON ride_requests(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_passenger ON ride_requests(passenger_id);
CREATE INDEX IF NOT EXISTS idx_ride_requests_status ON ride_requests(status);

CREATE INDEX IF NOT EXISTS idx_ride_passengers_ride ON ride_passengers(ride_id);
CREATE INDEX IF NOT EXISTS idx_ride_passengers_passenger ON ride_passengers(passenger_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_ride ON chat_messages(ride_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_participants_ride ON chat_participants(ride_id);
CREATE INDEX IF NOT EXISTS idx_chat_participants_user ON chat_participants(user_id);

CREATE INDEX IF NOT EXISTS idx_bus_bookings_user ON bus_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bus_bookings_schedule ON bus_bookings(schedule_id, booking_date);

-- Insert sample bus schedules only if they don't exist
INSERT INTO bus_schedules (route_name, origin, destination, departure_time, arrival_time, days_of_week, bus_number, total_seats, driver_name, driver_phone, fare) 
SELECT * FROM (VALUES
  ('LNMIIT to Raja Park', 'LNMIIT Campus', 'Raja Park', '06:00:00'::TIME, '06:40:00'::TIME, ARRAY[1,2,3,4,5], 'RJ14-BUS-001', 40, 'Ramesh Kumar', '+91-9876543210', 25.00),
  ('LNMIIT to Ajmeri Gate', 'LNMIIT Campus', 'Ajmeri Gate', '06:00:00'::TIME, '06:45:00'::TIME, ARRAY[1,2,3,4,5], 'RJ14-BUS-002', 40, 'Suresh Sharma', '+91-9876543211', 30.00),
  ('Raja Park to LNMIIT', 'Raja Park', 'LNMIIT Campus', '07:15:00'::TIME, '07:55:00'::TIME, ARRAY[1,2,3,4,5], 'RJ14-BUS-001', 40, 'Ramesh Kumar', '+91-9876543210', 25.00),
  ('Ajmeri Gate to LNMIIT', 'Ajmeri Gate', 'LNMIIT Campus', '07:15:00'::TIME, '08:00:00'::TIME, ARRAY[1,2,3,4,5], 'RJ14-BUS-002', 40, 'Suresh Sharma', '+91-9876543211', 30.00),
  ('LNMIIT to Railway Station', 'LNMIIT Campus', 'Jaipur Railway Station', '08:00:00'::TIME, '09:00:00'::TIME, ARRAY[1,2,3,4,5], 'RJ14-BUS-003', 40, 'Mohan Lal', '+91-9876543212', 50.00),
  ('Railway Station to LNMIIT', 'Jaipur Railway Station', 'LNMIIT Campus', '17:00:00'::TIME, '18:00:00'::TIME, ARRAY[1,2,3,4,5], 'RJ14-BUS-003', 40, 'Mohan Lal', '+91-9876543212', 50.00),
  ('LNMIIT to Airport', 'LNMIIT Campus', 'Jaipur Airport', '10:00:00'::TIME, '11:15:00'::TIME, ARRAY[1,2,3,4,5,6,7], 'RJ14-BUS-004', 40, 'Vikram Singh', '+91-9876543213', 75.00),
  ('Airport to LNMIIT', 'Jaipur Airport', 'LNMIIT Campus', '15:00:00'::TIME, '16:15:00'::TIME, ARRAY[1,2,3,4,5,6,7], 'RJ14-BUS-004', 40, 'Vikram Singh', '+91-9876543213', 75.00)
) AS v(route_name, origin, destination, departure_time, arrival_time, days_of_week, bus_number, total_seats, driver_name, driver_phone, fare)
WHERE NOT EXISTS (
  SELECT 1 FROM bus_schedules bs 
  WHERE bs.route_name = v.route_name 
  AND bs.bus_number = v.bus_number
);

-- Commit the transaction
COMMIT;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ LNMIIT Carpool Database Migration completed successfully!';
  RAISE NOTICE '✅ Fixed duplicate column issue in views';
  RAISE NOTICE '✅ Updated all functions and triggers';
  RAISE NOTICE '✅ Added missing indexes safely';
  RAISE NOTICE '✅ Sample bus schedules updated';
  RAISE NOTICE '🚀 Database migration complete - ready to use!';
END $$; 