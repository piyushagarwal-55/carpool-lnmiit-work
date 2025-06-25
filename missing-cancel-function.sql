-- Missing cancel_ride_soft_delete function
-- Run this in Supabase SQL Editor

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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION cancel_ride_soft_delete(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_ride_soft_delete(TEXT) TO authenticated; 