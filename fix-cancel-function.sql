-- DEFINITIVE FIX for cancel_ride_soft_delete function
-- Run this in Supabase SQL Editor

-- First, drop any existing versions to avoid conflicts
DROP FUNCTION IF EXISTS cancel_ride_soft_delete(TEXT);
DROP FUNCTION IF EXISTS cancel_ride_soft_delete(TEXT, TEXT);

-- Create the function with explicit parameter handling
CREATE OR REPLACE FUNCTION cancel_ride_soft_delete(ride_id_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_json JSON;
  ride_record RECORD;
BEGIN
  -- Check if ride exists and user is the driver
  SELECT * INTO ride_record    
  FROM carpool_rides 
  WHERE id::TEXT = ride_id_param AND driver_id = auth.uid()::TEXT;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ride not found or you are not the driver',
      'code', 'UNAUTHORIZED'
    );
  END IF;

  -- Update ride status to cancelled
  UPDATE carpool_rides 
  SET 
    status = 'cancelled',
    updated_at = NOW()
  WHERE id::TEXT = ride_id_param AND driver_id = auth.uid()::TEXT;

  RETURN json_build_object(
    'success', true,
    'message', 'Ride cancelled successfully',
    'ride_data', json_build_object(
      'id', ride_record.id,
      'from', ride_record.from_location,
      'to', ride_record.to_location,
      'status', 'cancelled'
    )
  );
END;
$$;

-- Create the version with reason parameter
CREATE OR REPLACE FUNCTION cancel_ride_soft_delete(ride_id_param TEXT, cancellation_reason TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_json JSON;
  ride_record RECORD;
BEGIN
  -- Check if ride exists and user is the driver
  SELECT * INTO ride_record
  FROM carpool_rides 
  WHERE id::TEXT = ride_id_param AND driver_id = auth.uid()::TEXT;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ride not found or you are not the driver',
      'code', 'UNAUTHORIZED'
    );
  END IF;

  -- Add cancellation_reason column if it doesn't exist
  BEGIN
    ALTER TABLE carpool_rides ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
  EXCEPTION WHEN OTHERS THEN
    -- Column already exists, continue
  END;

  -- Update ride status to cancelled
  UPDATE carpool_rides 
  SET 
    status = 'cancelled',
    updated_at = NOW(),
    cancellation_reason = cancellation_reason
  WHERE id::TEXT = ride_id_param AND driver_id = auth.uid()::TEXT;

  RETURN json_build_object(
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
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION cancel_ride_soft_delete(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_ride_soft_delete(TEXT, TEXT) TO authenticated;

-- Test the function exists (this should return the function name if successful)
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'cancel_ride_soft_delete' 
AND routine_schema = 'public'; 