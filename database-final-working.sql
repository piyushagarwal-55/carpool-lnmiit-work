-- FINAL WORKING VERSION - Only deletes from tables that have ride_id columns
-- Removes notifications deletion since it doesn't have ride_id column

-- Drop existing functions completely
DROP FUNCTION IF EXISTS delete_ride_with_cleanup(TEXT);
DROP FUNCTION IF EXISTS cancel_ride_soft_delete(TEXT, TEXT);
DROP FUNCTION IF EXISTS cancel_ride_soft_delete(TEXT);

-- Function 1: Hard delete with complete cleanup (FINAL VERSION)
CREATE OR REPLACE FUNCTION delete_ride_with_cleanup(ride_id_param TEXT)
RETURNS JSON AS $$
DECLARE
    current_user_id UUID;
    current_user_text TEXT;
    ride_record RECORD;
    deleted_messages INTEGER := 0;
    deleted_participants INTEGER := 0;
    deleted_requests INTEGER := 0;
    deleted_passengers INTEGER := 0;
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
    
    -- Delete related records (ONLY TABLES WITH ride_id COLUMN)
    BEGIN
        -- Delete chat messages
        DELETE FROM chat_messages 
        WHERE ride_id::TEXT = ride_id_param;
        GET DIAGNOSTICS deleted_messages = ROW_COUNT;
        
        -- Delete chat participants
        DELETE FROM chat_participants 
        WHERE ride_id::TEXT = ride_id_param;
        GET DIAGNOSTICS deleted_participants = ROW_COUNT;
        
        -- Delete ride requests  
        DELETE FROM ride_requests 
        WHERE ride_id::TEXT = ride_id_param;
        GET DIAGNOSTICS deleted_requests = ROW_COUNT;
        
        -- Delete ride passengers
        DELETE FROM ride_passengers 
        WHERE ride_id::TEXT = ride_id_param;
        GET DIAGNOSTICS deleted_passengers = ROW_COUNT;
        
        -- NOTE: NOT deleting from notifications because it doesn't have ride_id column
        -- Notifications are user-centric, not ride-centric
        
        -- Delete the main ride record
        DELETE FROM carpool_rides 
        WHERE id::TEXT = ride_id_param 
        AND driver_id::TEXT = current_user_text;
        
    EXCEPTION
        WHEN OTHERS THEN
            -- Try alternative deletion approach with UUID casting
            DELETE FROM chat_messages 
            WHERE ride_id = ride_id_param::UUID;
            GET DIAGNOSTICS deleted_messages = ROW_COUNT;
            
            DELETE FROM chat_participants 
            WHERE ride_id = ride_id_param::UUID;
            GET DIAGNOSTICS deleted_participants = ROW_COUNT;
            
            DELETE FROM ride_requests 
            WHERE ride_id = ride_id_param::UUID;
            GET DIAGNOSTICS deleted_requests = ROW_COUNT;
            
            DELETE FROM ride_passengers 
            WHERE ride_id = ride_id_param::UUID;
            GET DIAGNOSTICS deleted_passengers = ROW_COUNT;
            
            DELETE FROM carpool_rides 
            WHERE id = ride_id_param::UUID 
            AND driver_id = current_user_id;
    END;
    
    -- Return success with deletion counts
    RETURN json_build_object(
        'success', true,
        'message', 'Ride and all related data deleted successfully',
        'ride_id', ride_id_param,
        'deleted_counts', json_build_object(
            'messages', deleted_messages,
            'participants', deleted_participants,
            'requests', deleted_requests,
            'passengers', deleted_passengers
        )
    );
    
EXCEPTION
    WHEN OTHERS THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM || ' (SQLSTATE: ' || SQLSTATE || ')'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function 2: Soft delete (cancel) with reason (FINAL VERSION)
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
    cancelled_requests INTEGER := 0;
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
        
        GET DIAGNOSTICS cancelled_requests = ROW_COUNT;
        
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
            
            GET DIAGNOSTICS cancelled_requests = ROW_COUNT;
    END;
    
    -- Return success with operation counts
    RETURN json_build_object(
        'success', true,
        'message', 'Ride cancelled successfully',
        'ride_id', ride_id_param,
        'reason', cancellation_reason,
        'cancelled_requests', cancelled_requests
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
-- SELECT delete_ride_with_cleanup('0d5ffda3-d535-43a4-8c0e-8ca352918a89');
-- SELECT cancel_ride_soft_delete('0d5ffda3-d535-43a4-8c0e-8ca352918a89', 'Testing'); 