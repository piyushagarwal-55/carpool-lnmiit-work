-- Database Migration Script: Update Terminology from Driver/Rider to Ride Creator/Student
-- Run this script to update all references to maintain consistency

-- 1. Update carpool_rides table column names and references
ALTER TABLE carpool_rides 
  RENAME COLUMN driver_id TO ride_creator_id;

ALTER TABLE carpool_rides 
  RENAME COLUMN driver_name TO ride_creator_name;

ALTER TABLE carpool_rides 
  RENAME COLUMN driver_email TO ride_creator_email;

ALTER TABLE carpool_rides 
  RENAME COLUMN driver_phone TO ride_creator_phone;

ALTER TABLE carpool_rides 
  RENAME COLUMN driver_rating TO ride_creator_rating;

-- 2. Update user_profiles table activity tracking columns
ALTER TABLE user_profiles 
  RENAME COLUMN total_rides_as_driver TO total_rides_as_creator;

ALTER TABLE user_profiles 
  RENAME COLUMN total_rides_as_passenger TO total_rides_as_student;

-- 3. Update ride_requests table column names
ALTER TABLE ride_requests 
  RENAME COLUMN driver_message TO ride_creator_message;

-- 4. Update indexes that reference old column names
DROP INDEX IF EXISTS idx_carpool_rides_driver;
CREATE INDEX idx_carpool_rides_ride_creator ON carpool_rides(ride_creator_id);

-- 5. Update foreign key constraints
ALTER TABLE carpool_rides 
  DROP CONSTRAINT IF EXISTS carpool_rides_driver_id_fkey;

ALTER TABLE carpool_rides 
  ADD CONSTRAINT carpool_rides_ride_creator_id_fkey 
  FOREIGN KEY (ride_creator_id) REFERENCES user_profiles(id) ON DELETE CASCADE;

-- 6. Update RLS policies to use new column names
DROP POLICY IF EXISTS "Users can insert their own rides" ON carpool_rides;
CREATE POLICY "Users can insert their own rides" ON carpool_rides
  FOR INSERT WITH CHECK (auth.uid() = ride_creator_id);

DROP POLICY IF EXISTS "Users can update their own rides" ON carpool_rides;
CREATE POLICY "Users can update their own rides" ON carpool_rides
  FOR UPDATE USING (auth.uid() = ride_creator_id);

DROP POLICY IF EXISTS "Users can delete their own rides" ON carpool_rides;
CREATE POLICY "Users can delete their own rides" ON carpool_rides
  FOR DELETE USING (auth.uid() = ride_creator_id);

-- Update ride requests policies
DROP POLICY IF EXISTS "Ride requests are viewable by ride driver and requester" ON ride_requests;
CREATE POLICY "Ride requests are viewable by ride creator and requester" ON ride_requests
  FOR SELECT USING (
    auth.uid() = passenger_id OR 
    auth.uid() = (SELECT ride_creator_id FROM carpool_rides WHERE id = ride_id)
  );

DROP POLICY IF EXISTS "Users can update their own requests or drivers can update requests for their rides" ON ride_requests;
CREATE POLICY "Users can update their own requests or ride creators can update requests for their rides" ON ride_requests
  FOR UPDATE USING (
    auth.uid() = passenger_id OR 
    auth.uid() = (SELECT ride_creator_id FROM carpool_rides WHERE id = ride_id)
  );

-- Update ride passengers policies
DROP POLICY IF EXISTS "Users and drivers can add passengers" ON ride_passengers;
CREATE POLICY "Users and ride creators can add passengers" ON ride_passengers
  FOR INSERT WITH CHECK (
    auth.uid() = passenger_id OR
    auth.uid() IN (SELECT ride_creator_id FROM carpool_rides WHERE id = ride_id)
  );

-- Update chat policies
DROP POLICY IF EXISTS "Ride participants can view chat messages" ON chat_messages;
CREATE POLICY "Ride participants can view chat messages" ON chat_messages
  FOR SELECT USING (
    auth.uid() = sender_id OR
    auth.uid() = (SELECT ride_creator_id FROM carpool_rides WHERE id = ride_id) OR
    auth.uid() IN (
      SELECT passenger_id FROM ride_passengers 
      WHERE ride_id = chat_messages.ride_id
    )
  );

DROP POLICY IF EXISTS "Ride participants can send messages" ON chat_messages;
CREATE POLICY "Ride participants can send messages" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND (
      auth.uid() = (SELECT ride_creator_id FROM carpool_rides WHERE id = ride_id) OR
      auth.uid() IN (
        SELECT passenger_id FROM ride_passengers 
        WHERE ride_id = chat_messages.ride_id
      )
    )
  );

-- 7. Update view definitions
DROP VIEW IF EXISTS ride_summary;
CREATE OR REPLACE VIEW ride_summary AS
SELECT 
  r.*,
  p.full_name AS ride_creator_full_name,
  p.avatar_url AS ride_creator_avatar,
  p.rating AS ride_creator_rating,
  (r.total_seats - r.available_seats) AS students_count,
  CASE 
    WHEN r.expires_at < now() THEN 'expired'
    WHEN r.available_seats = 0 THEN 'full'
    ELSE r.status
  END AS computed_status
FROM carpool_rides r
JOIN user_profiles p ON p.id = r.ride_creator_id
WHERE r.status IN ('active', 'full') AND r.expires_at > now();

-- 8. Update functions that reference old column names
CREATE OR REPLACE FUNCTION update_ride_seats()
RETURNS TRIGGER AS $$
BEGIN
  -- When a ride request is accepted, add passenger and update seats
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Add passenger to ride_passengers table
    INSERT INTO ride_passengers (
      ride_id, 
      passenger_id, 
      passenger_name, 
      passenger_email, 
      seats_booked,
      status,
      joined_at
    ) VALUES (
      NEW.ride_id,
      NEW.passenger_id,
      NEW.passenger_name,
      NEW.passenger_email,
      NEW.seats_requested,
      'confirmed',
      NOW()
    )
    ON CONFLICT (ride_id, passenger_id) DO NOTHING;
    
    -- Update available seats in carpool_rides
    UPDATE carpool_rides 
    SET available_seats = available_seats - NEW.seats_requested,
        updated_at = NOW()
    WHERE id = NEW.ride_id;
    
    -- Update ride creator stats
    UPDATE user_profiles 
    SET total_rides_as_creator = total_rides_as_creator + 1,
        updated_at = NOW()
    WHERE id = (SELECT ride_creator_id FROM carpool_rides WHERE id = NEW.ride_id);
    
    -- Update student stats
    UPDATE user_profiles 
    SET total_rides_as_student = total_rides_as_student + 1,
        updated_at = NOW()
    WHERE id = NEW.passenger_id;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Update any stored procedures that reference old column names
CREATE OR REPLACE FUNCTION cancel_ride_soft_delete(ride_id_param TEXT, cancellation_reason TEXT DEFAULT 'Cancelled by ride creator')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_json JSON;
  ride_record RECORD;
BEGIN
  -- Check if ride exists and user is the ride creator
  SELECT * INTO ride_record
  FROM carpool_rides 
  WHERE id::TEXT = ride_id_param AND ride_creator_id = auth.uid()::TEXT;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ride not found or you are not the ride creator',
      'code', 'UNAUTHORIZED'
    );
  END IF;

  -- Update ride status to cancelled
  UPDATE carpool_rides 
  SET 
    status = 'cancelled',
    updated_at = NOW(),
    cancellation_reason = cancellation_reason
  WHERE id::TEXT = ride_id_param AND ride_creator_id = auth.uid()::TEXT;

  -- Notify students about cancellation
  
  result_json := json_build_object(
    'success', true,
    'message', 'Ride cancelled successfully',
    'ride_data', json_build_object(
      'id', ride_record.id,
      'from', ride_record.from_location,
      'to', ride_record.to_location,
      'status', 'cancelled',
      'cancellation_reason', cancellation_reason
    )
  );

  RETURN result_json;
END;
$$;

-- 10. Add comments to document the terminology change
COMMENT ON COLUMN carpool_rides.ride_creator_id IS 'ID of the user who created the ride (formerly driver_id)';
COMMENT ON COLUMN carpool_rides.ride_creator_name IS 'Name of the ride creator (formerly driver_name)';
COMMENT ON COLUMN carpool_rides.ride_creator_email IS 'Email of the ride creator (formerly driver_email)';
COMMENT ON COLUMN user_profiles.total_rides_as_creator IS 'Total rides created by this user (formerly total_rides_as_driver)';
COMMENT ON COLUMN user_profiles.total_rides_as_student IS 'Total rides joined by this user (formerly total_rides_as_passenger)';

-- 11. Update any remaining triggers or functions as needed
-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION cancel_ride_soft_delete(TEXT, TEXT) TO authenticated;

-- Final verification query to check the changes
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name IN ('carpool_rides', 'user_profiles', 'ride_requests')
  AND column_name LIKE '%creator%' OR column_name LIKE '%student%'
ORDER BY table_name, column_name; 