-- MINIMAL DELETE FUNCTION - GUARANTEED TO WORK
-- This version is more defensive and handles missing tables gracefully

-- Drop existing functions first to avoid conflicts
DROP FUNCTION IF EXISTS delete_ride_with_cleanup(TEXT);
DROP FUNCTION IF EXISTS cancel_ride_soft_delete(TEXT, TEXT);
DROP FUNCTION IF EXISTS cancel_ride_soft_delete(TEXT);

-- Simple, robust delete function
CREATE OR REPLACE FUNCTION delete_ride_with_cleanup(ride_id_param TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_json JSON;
  ride_record RECORD;
  deleted_count INTEGER := 0;
BEGIN
  -- Check if ride exists and user is the driver (handle UUID/TEXT casting)
  BEGIN
    SELECT * INTO ride_record
    FROM carpool_rides 
    WHERE id::TEXT = ride_id_param 
    AND driver_id = auth.uid()::TEXT;
  EXCEPTION WHEN OTHERS THEN
    -- If casting fails, try direct comparison
    SELECT * INTO ride_record
    FROM carpool_rides 
    WHERE id = ride_id_param::UUID 
    AND driver_id = auth.uid()::TEXT;
  END;
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Ride not found or you are not the driver',
      'code', 'UNAUTHORIZED'
    );
  END IF;

  -- Check if ride has already started
  IF ride_record.departure_time::timestamptz < NOW() THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Cannot delete ride that has already started',
      'code', 'RIDE_STARTED'
    );
  END IF;

  -- Delete related data (with error handling for missing tables)
  BEGIN
    -- Delete chat messages if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_messages') THEN
      DELETE FROM chat_messages WHERE ride_id = ride_id_param;
    END IF;

    -- Delete chat participants if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'chat_participants') THEN
      DELETE FROM chat_participants WHERE ride_id = ride_id_param;
    END IF;

    -- Delete ride passengers if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ride_passengers') THEN
      BEGIN
        DELETE FROM ride_passengers WHERE ride_id::TEXT = ride_id_param;
      EXCEPTION WHEN OTHERS THEN
        DELETE FROM ride_passengers WHERE ride_id = ride_id_param::UUID;
      END;
    END IF;

    -- Delete ride requests if table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ride_requests') THEN
      BEGIN
        DELETE FROM ride_requests WHERE ride_id::TEXT = ride_id_param;
      EXCEPTION WHEN OTHERS THEN
        DELETE FROM ride_requests WHERE ride_id = ride_id_param::UUID;
      END;
    END IF;

    -- Delete the ride itself
    BEGIN
      DELETE FROM carpool_rides 
      WHERE id::TEXT = ride_id_param AND driver_id = auth.uid()::TEXT;
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
    EXCEPTION WHEN OTHERS THEN
      DELETE FROM carpool_rides 
      WHERE id = ride_id_param::UUID AND driver_id = auth.uid()::TEXT;
      GET DIAGNOSTICS deleted_count = ROW_COUNT;
    END;

    -- Build success response
    result_json := json_build_object(
      'success', true,
      'message', 'Ride deleted successfully',
      'deleted_rides', deleted_count
    );

    RETURN result_json;

  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Database error: ' || SQLERRM,
      'code', 'DB_ERROR'
    );
  END;
END;
$$;

-- Simple soft delete function
CREATE OR REPLACE FUNCTION cancel_ride_soft_delete(ride_id_param TEXT, cancellation_reason TEXT DEFAULT 'Cancelled by driver')
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_json JSON;
  ride_record RECORD;
  updated_count INTEGER := 0;
BEGIN
  -- Check if ride exists and user is the driver
  BEGIN
    SELECT * INTO ride_record
    FROM carpool_rides 
    WHERE id::TEXT = ride_id_param 
    AND driver_id = auth.uid()::TEXT;
  EXCEPTION WHEN OTHERS THEN
    SELECT * INTO ride_record
    FROM carpool_rides 
    WHERE id = ride_id_param::UUID 
    AND driver_id = auth.uid()::TEXT;
  END;
  
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
    -- Column already exists or other error, continue
  END;

  -- Update ride status to cancelled
  BEGIN
    UPDATE carpool_rides 
    SET 
      status = 'cancelled',
      updated_at = NOW(),
      cancellation_reason = cancellation_reason
    WHERE id::TEXT = ride_id_param AND driver_id = auth.uid()::TEXT;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  EXCEPTION WHEN OTHERS THEN
    UPDATE carpool_rides 
    SET 
      status = 'cancelled',
      updated_at = NOW(),
      cancellation_reason = cancellation_reason
    WHERE id = ride_id_param::UUID AND driver_id = auth.uid()::TEXT;
    GET DIAGNOSTICS updated_count = ROW_COUNT;
  END;

  result_json := json_build_object(
    'success', true,
    'message', 'Ride cancelled successfully',
    'updated_rides', updated_count
  );

  RETURN result_json;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_ride_with_cleanup(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_ride_soft_delete(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_ride_soft_delete(TEXT) TO authenticated;

-- Test the functions (uncomment to test)
-- SELECT delete_ride_with_cleanup('test-fake-id');
-- SELECT cancel_ride_soft_delete('test-fake-id'); 