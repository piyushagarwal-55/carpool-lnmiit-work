-- Database updates for LNMIIT Carpool App
-- Run this script in your Supabase SQL Editor to apply all fixes

-- 1. Add new columns to carpool_rides table for expiry tracking
ALTER TABLE carpool_rides 
ADD COLUMN IF NOT EXISTS license_plate VARCHAR(20),
ADD COLUMN IF NOT EXISTS estimated_duration VARCHAR(50) DEFAULT '30 mins',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITH TIME ZONE GENERATED ALWAYS AS (departure_time - INTERVAL '30 minutes') STORED;

-- 2. Update status column to include 'expired' status
ALTER TABLE carpool_rides 
DROP CONSTRAINT IF EXISTS carpool_rides_status_check;

ALTER TABLE carpool_rides 
ADD CONSTRAINT carpool_rides_status_check 
CHECK (status IN ('active', 'full', 'completed', 'cancelled', 'expired'));

-- 3. Enhance user_profiles table with edit tracking and email parsing
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS branch_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS joining_year VARCHAR(4),
ADD COLUMN IF NOT EXISTS profile_edit_count INTEGER DEFAULT 0 CHECK (profile_edit_count <= 2),
ADD COLUMN IF NOT EXISTS can_edit_profile BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_profile_edit TIMESTAMP WITH TIME ZONE;

-- 4. Create function to parse email and extract branch info (updated)
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

-- 5. Create function to automatically expire rides
CREATE OR REPLACE FUNCTION auto_expire_rides()
RETURNS void AS $$
BEGIN
  UPDATE carpool_rides 
  SET status = 'expired'
  WHERE status = 'active' 
    AND NOW() > expires_at;
END;
$$ LANGUAGE plpgsql;

-- 6. Create function to track profile edits
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

-- 7. Create trigger for profile edit tracking
DROP TRIGGER IF EXISTS track_profile_edits ON user_profiles;
CREATE TRIGGER track_profile_edits
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION increment_profile_edit();

-- 8. Update RLS policies to include expired rides
DROP POLICY IF EXISTS "Anyone can view active rides" ON carpool_rides;
CREATE POLICY "Anyone can view active and expired rides" ON carpool_rides
  FOR SELECT USING (status IN ('active', 'expired'));

-- 9. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_carpool_rides_expires ON carpool_rides(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_branch_code ON user_profiles(branch_code);

-- 10. Update existing user profiles with parsed email information
UPDATE user_profiles 
SET 
  email = auth.users.email,
  branch_code = (SELECT branch_code FROM parse_email_info(auth.users.email)),
  joining_year = (SELECT joining_year FROM parse_email_info(auth.users.email)),
  branch = (SELECT branch_full FROM parse_email_info(auth.users.email))
FROM auth.users 
WHERE user_profiles.id = auth.users.id 
  AND auth.users.email LIKE '%@lnmiit.ac.in';

-- 11. Create a scheduled job to auto-expire rides (if pg_cron extension is available)
-- Uncomment the line below if you have pg_cron extension enabled
-- SELECT cron.schedule('auto-expire-rides', '*/5 * * * *', 'SELECT auto_expire_rides();');

COMMIT; 