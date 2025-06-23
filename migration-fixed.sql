-- LNMIIT Carpool System - Migration Script (FIXED)
-- Run this script to update from original schema to enhanced version
-- This script only contains the changes/additions needed

BEGIN;

-- 1. Add new columns to carpool_rides table
ALTER TABLE carpool_rides 
  DROP COLUMN IF EXISTS vehicle_number,
  ADD COLUMN IF NOT EXISTS license_plate VARCHAR(20),
  ADD COLUMN IF NOT EXISTS estimated_duration VARCHAR(50) DEFAULT '30 mins',
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE;

-- Update status enum to include 'expired'
ALTER TABLE carpool_rides 
  DROP CONSTRAINT IF EXISTS carpool_rides_status_check;

ALTER TABLE carpool_rides 
  ADD CONSTRAINT carpool_rides_status_check 
  CHECK (status IN ('active', 'full', 'completed', 'cancelled', 'expired'));

-- 2. Add new columns to user_profiles table
ALTER TABLE user_profiles 
  ADD COLUMN IF NOT EXISTS email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS branch_code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS joining_year VARCHAR(4),
  ADD COLUMN IF NOT EXISTS profile_edit_count INTEGER DEFAULT 0 CHECK (profile_edit_count <= 2),
  ADD COLUMN IF NOT EXISTS can_edit_profile BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_profile_edit TIMESTAMP WITH TIME ZONE;

-- 3. Create notifications table
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

-- Enable RLS for notifications table
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 4. Create/Replace functions
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

CREATE OR REPLACE FUNCTION auto_expire_rides()
RETURNS void AS $$
BEGIN
  UPDATE carpool_rides 
  SET status = 'expired'
  WHERE status = 'active' 
    AND NOW() > expires_at;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_profile_edit()
RETURNS TRIGGER AS $$
BEGIN
  -- Only increment if this is an actual edit (not initial creation)
  IF OLD.profile_edit_count IS NOT NULL THEN
    NEW.profile_edit_count := OLD.profile_edit_count + 1;
    NEW.last_profile_edit := NOW();
    
    -- Disable editing if limit reached
    IF NEW.profile_edit_count >= 2 THEN
      NEW.can_edit_profile := false;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically set expires_at when departure_time changes
CREATE OR REPLACE FUNCTION set_ride_expiry()
RETURNS TRIGGER AS $$
BEGIN
  -- Set expires_at to 30 minutes before departure_time
  NEW.expires_at := NEW.departure_time - INTERVAL '30 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create triggers
DROP TRIGGER IF EXISTS track_profile_edits ON user_profiles;
CREATE TRIGGER track_profile_edits
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION increment_profile_edit();

DROP TRIGGER IF EXISTS set_ride_expiry_trigger ON carpool_rides;
CREATE TRIGGER set_ride_expiry_trigger
  BEFORE INSERT OR UPDATE OF departure_time ON carpool_rides
  FOR EACH ROW
  EXECUTE FUNCTION set_ride_expiry();

-- Update existing rides to set expires_at
UPDATE carpool_rides 
SET expires_at = departure_time - INTERVAL '30 minutes'
WHERE expires_at IS NULL;

-- 6. Update existing policies for carpool_rides to include expired status
DROP POLICY IF EXISTS "Anyone can view active rides" ON carpool_rides;
CREATE POLICY "Anyone can view active and expired rides" ON carpool_rides
  FOR SELECT USING (status IN ('active', 'expired'));

-- 7. Create new policies for notifications table
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
DROP POLICY IF EXISTS "System can create notifications" ON notifications;

-- Create new policies
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- 8. Create new indexes
CREATE INDEX IF NOT EXISTS idx_carpool_rides_expires ON carpool_rides(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_branch_code ON user_profiles(branch_code);

-- 9. Update existing user profiles with parsed email information (if data exists)
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT up.id, au.email 
        FROM user_profiles up 
        JOIN auth.users au ON up.id = au.id 
        WHERE au.email LIKE '%@lnmiit.ac.in'
    LOOP
        UPDATE user_profiles 
        SET 
            email = user_record.email,
            branch_code = (SELECT branch_code FROM parse_email_info(user_record.email)),
            joining_year = (SELECT joining_year FROM parse_email_info(user_record.email)),
            branch = (SELECT branch_full FROM parse_email_info(user_record.email))
        WHERE id = user_record.id;
    END LOOP;
END;
$$;

-- 10. Optional: Create scheduled job comment (uncomment if pg_cron is available)
-- SELECT cron.schedule('auto-expire-rides', '*/5 * * * *', 'SELECT auto_expire_rides();');

COMMIT; 