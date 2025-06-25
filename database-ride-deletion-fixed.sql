-- Fixed Ride Deletion Functionality
-- Run this SQL in Supabase SQL Editor

-- Function to delete a ride and all related data (FIXED VERSION)
CREATE OR REPLACE FUNCTION delete_ride_with_cleanup(ride_id_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_json JSON;
  ride_record RECORD;
  affected_passengers INTEGER := 0;
  affected_requests INTEGER := 0;
  affected_chat_messages INTEGER := 0;
  affected_chat_participants INTEGER := 0;
BEGIN
  -- Check if ride exists and user is the driver
  -- Handle both UUID and TEXT types by using explicit casting
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

  -- Check if ride has already started (optional protection)
  IF ride_record.departure_time::timestamptz < NOW() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot delete ride that has already started',
      'code', 'RIDE_STARTED'
    );
  END IF;

  -- Start transaction-like operations
  BEGIN
    -- Delete chat messages first (foreign key dependencies)
    DELETE FROM chat_messages 
    WHERE ride_id = ride_id_param;
    GET DIAGNOSTICS affected_chat_messages = ROW_COUNT;

    -- Delete chat participants
    DELETE FROM chat_participants 
    WHERE ride_id = ride_id_param;
    GET DIAGNOSTICS affected_chat_participants = ROW_COUNT;

    -- Delete ride passengers - handle both UUID and TEXT
    DELETE FROM ride_passengers 
    WHERE ride_id::TEXT = ride_id_param;
    GET DIAGNOSTICS affected_passengers = ROW_COUNT;

    -- Delete pending requests - handle both UUID and TEXT
    DELETE FROM ride_requests 
    WHERE ride_id::TEXT = ride_id_param;
    GET DIAGNOSTICS affected_requests = ROW_COUNT;

    -- Finally delete the ride itself
    DELETE FROM carpool_rides 
    WHERE id::TEXT = ride_id_param AND driver_id = auth.uid()::TEXT;

    -- Build success response
    result_json := json_build_object(
      'success', true,
      'message', 'Ride deleted successfully',
      'cleanup_stats', json_build_object(
        'passengers_removed', affected_passengers,
        'requests_cancelled', affected_requests,
        'chat_messages_deleted', affected_chat_messages,
        'chat_participants_removed', affected_chat_participants
      ),
      'ride_data', json_build_object(
        'id', ride_record.id,
        'from', ride_record.from_location,
        'to', ride_record.to_location,
        'departure_time', ride_record.departure_time
      )
    );

    RETURN result_json;

  EXCEPTION WHEN OTHERS THEN
    -- Return error details
    RETURN json_build_object(
      'success', false,
      'error', 'Database error during deletion: ' || SQLERRM,
      'code', 'DB_ERROR'
    );
  END;
END;
$$;

-- Function to soft delete ride (mark as cancelled instead of hard delete) - FIXED VERSION
CREATE OR REPLACE FUNCTION cancel_ride_soft_delete(ride_id_param TEXT, cancellation_reason TEXT DEFAULT 'Cancelled by driver')
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
    updated_at = NOW(),
    cancellation_reason = cancellation_reason
  WHERE id::TEXT = ride_id_param AND driver_id = auth.uid()::TEXT;

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

-- Add cancellation_reason column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'carpool_rides' AND column_name = 'cancellation_reason'
  ) THEN
    ALTER TABLE carpool_rides ADD COLUMN cancellation_reason TEXT;
  END IF;
END $$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_ride_with_cleanup(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_ride_soft_delete(TEXT, TEXT) TO authenticated;

-- Test the function (uncomment to test)
-- SELECT delete_ride_with_cleanup('your-test-ride-id-here');
-- SELECT cancel_ride_soft_delete('your-test-ride-id-here', 'Testing cancellation');

-- Example usage:
-- Hard delete (removes all data):
-- SELECT delete_ride_with_cleanup('your-ride-id-here');

-- Soft delete (marks as cancelled):
-- SELECT cancel_ride_soft_delete('your-ride-id-here', 'Emergency cancellation'); 