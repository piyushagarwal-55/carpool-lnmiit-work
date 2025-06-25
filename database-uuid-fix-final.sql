-- FINAL FIX for UUID/TEXT type conflicts
-- This version uses the most defensive approach possible

-- Drop existing functions completely
DROP FUNCTION IF EXISTS delete_ride_with_cleanup(TEXT);
DROP FUNCTION IF EXISTS cancel_ride_soft_delete(TEXT, TEXT);
DROP FUNCTION IF EXISTS cancel_ride_soft_delete(TEXT);

-- Function 1: Hard delete with complete cleanup
CREATE OR REPLACE FUNCTION delete_ride_with_cleanup(ride_id_param TEXT)
RETURNS JSON AS $$
DECLARE
    current_user_id UUID;
    current_user_text TEXT;
    ride_record RECORD;
    deleted_count INTEGER := 0;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    current_user_text := current_user_id::TEXT;
    
    IF current_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Authentication required'
        );
    END IF;
    
    -- Try to find the ride using multiple approaches for compatibility
    BEGIN
        -- First try: assume ride ID column is UUID
        SELECT * INTO ride_record 
        FROM carpool_rides 
        WHERE id = ride_id_param::UUID 
        AND driver_id = current_user_id;
    EXCEPTION
        WHEN invalid_text_representation THEN
            -- Second try: assume ride ID column is TEXT
            SELECT * INTO ride_record 
            FROM carpool_rides 
            WHERE id::TEXT = ride_id_param 
            AND driver_id::TEXT = current_user_text;
    END;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Ride not found or you are not the driver'
        );
    END IF;
    
    -- Check if ride can be deleted
    IF ride_record.status = 'completed' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Cannot delete completed rides'
        );
    END IF;
    
    -- Delete related records with error handling
    BEGIN
        -- Delete chat messages
        DELETE FROM chat_messages 
        WHERE ride_id::TEXT = ride_id_param;
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        -- Delete ride requests  
        DELETE FROM ride_requests 
        WHERE ride_id::TEXT = ride_id_param;
        
        -- Delete ride bookings
        DELETE FROM ride_bookings 
        WHERE ride_id::TEXT = ride_id_param;
        
        -- Delete the main ride record
        DELETE FROM carpool_rides 
        WHERE id::TEXT = ride_id_param 
        AND driver_id::TEXT = current_user_text;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Try alternative deletion approach
            DELETE FROM chat_messages 
            WHERE ride_id = ride_id_param::UUID;
            
            DELETE FROM ride_requests 
            WHERE ride_id = ride_id_param::UUID;
            
            DELETE FROM ride_bookings 
            WHERE ride_id = ride_id_param::UUID;
            
            DELETE FROM carpool_rides 
            WHERE id = ride_id_param::UUID 
            AND driver_id = current_user_id;
    END;
    
    -- Return success
    RETURN json_build_object(
        'success', true,
        'message', 'Ride and all related data deleted successfully',
        'ride_id', ride_id_param,
        'deleted_messages', deleted_count
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Soft delete (cancel) with reason
CREATE OR REPLACE FUNCTION cancel_ride_soft_delete(
    ride_id_param TEXT,
    cancellation_reason TEXT DEFAULT 'Cancelled by driver'
)
RETURNS JSON AS $$
DECLARE
    current_user_id UUID;
    current_user_text TEXT;
    ride_record RECORD;
    updated_count INTEGER := 0;
BEGIN
    -- Get current user ID
    current_user_id := auth.uid();
    current_user_text := current_user_id::TEXT;
    
    IF current_user_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Authentication required'
        );
    END IF;
    
    -- Try to find the ride using multiple approaches
    BEGIN
        -- First try: assume ride ID column is UUID
        SELECT * INTO ride_record 
        FROM carpool_rides 
        WHERE id = ride_id_param::UUID 
        AND driver_id = current_user_id;
    EXCEPTION
        WHEN invalid_text_representation THEN
            -- Second try: assume ride ID column is TEXT
            SELECT * INTO ride_record 
            FROM carpool_rides 
            WHERE id::TEXT = ride_id_param 
            AND driver_id::TEXT = current_user_text;
    END;
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Ride not found or you are not the driver'
        );
    END IF;
    
    -- Check if ride can be cancelled
    IF ride_record.status = 'completed' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Cannot cancel completed rides'
        );
    END IF;
    
    IF ride_record.status = 'cancelled' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Ride is already cancelled'
        );
    END IF;
    
    -- Update ride status with error handling
    BEGIN
        -- Try TEXT approach first
        UPDATE carpool_rides 
        SET 
            status = 'cancelled',
            cancellation_reason = cancel_ride_soft_delete.cancellation_reason,
            cancelled_at = NOW(),
            updated_at = NOW()
        WHERE id::TEXT = ride_id_param 
        AND driver_id::TEXT = current_user_text;
        
        GET DIAGNOSTICS updated_count = ROW_COUNT;
        
        IF updated_count = 0 THEN
            -- Try UUID approach
            UPDATE carpool_rides 
            SET 
                status = 'cancelled',
                cancellation_reason = cancel_ride_soft_delete.cancellation_reason,
                cancelled_at = NOW(),
                updated_at = NOW()
            WHERE id = ride_id_param::UUID 
            AND driver_id = current_user_id;
        END IF;
        
        -- Cancel pending ride requests
        UPDATE ride_requests 
        SET 
            status = 'cancelled',
            updated_at = NOW()
        WHERE ride_id::TEXT = ride_id_param 
        AND status = 'pending';
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Alternative update approach
            UPDATE carpool_rides 
            SET 
                status = 'cancelled',
                cancellation_reason = cancel_ride_soft_delete.cancellation_reason,
                cancelled_at = NOW(),
                updated_at = NOW()
            WHERE id = ride_id_param::UUID 
            AND driver_id = current_user_id;
            
            UPDATE ride_requests 
            SET 
                status = 'cancelled',
                updated_at = NOW()
            WHERE ride_id = ride_id_param::UUID 
            AND status = 'pending';
    END;
    
    -- Return success
    RETURN json_build_object(
        'success', true,
        'message', 'Ride cancelled successfully',
        'ride_id', ride_id_param,
        'reason', cancellation_reason
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_ride_with_cleanup(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_ride_soft_delete(TEXT, TEXT) TO authenticated;

-- Test queries (uncomment to test)
-- SELECT delete_ride_with_cleanup('7a97766d-4c75-483f-a47f-0abe07d05a96');
-- SELECT cancel_ride_soft_delete('7a97766d-4c75-483f-a47f-0abe07d05a96', 'Testing'); 