-- Database Updates for Ride Status and Request Handling
-- Run this script in your Supabase SQL Editor after the main schema

-- First, let's add a function to automatically add passengers when requests are accepted
CREATE OR REPLACE FUNCTION handle_accepted_ride_request()
RETURNS TRIGGER AS $$
BEGIN
  -- When a ride request is accepted, add the passenger to ride_passengers table
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    -- Insert passenger into ride_passengers table
    INSERT INTO ride_passengers (
      ride_id,
      passenger_id,
      passenger_name,
      passenger_email,
      seats_booked,
      status,
      pickup_location,
      dropoff_location
    ) VALUES (
      NEW.ride_id,
      NEW.passenger_id,
      NEW.passenger_name,
      NEW.passenger_email,
      NEW.seats_requested,
      'confirmed',
      NEW.pickup_location,
      NEW.dropoff_location
    ) ON CONFLICT (ride_id, passenger_id) DO UPDATE SET
      status = 'confirmed',
      seats_booked = NEW.seats_requested,
      pickup_location = NEW.pickup_location,
      dropoff_location = NEW.dropoff_location;
    
    -- Update available seats in carpool_rides table
    UPDATE carpool_rides 
    SET 
      available_seats = available_seats - NEW.seats_requested,
      booked_seats = booked_seats + NEW.seats_requested,
      updated_at = now()
    WHERE id = NEW.ride_id;
    
    -- Create notification for passenger
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      data,
      created_at
    ) VALUES (
      NEW.passenger_id,
      'Ride Request Accepted! 🎉',
      'Your request to join the ride from ' || (SELECT from_location FROM carpool_rides WHERE id = NEW.ride_id) || 
      ' to ' || (SELECT to_location FROM carpool_rides WHERE id = NEW.ride_id) || ' has been accepted.',
      'request_accepted',
      jsonb_build_object(
        'ride_id', NEW.ride_id,
        'request_id', NEW.id,
        'driver_message', NEW.driver_message
      ),
      now()
    );
  END IF;
  
  -- When a ride request is rejected, create notification
  IF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (
      user_id,
      title,
      message,
      type,
      data,
      created_at
    ) VALUES (
      NEW.passenger_id,
      'Ride Request Declined',
      'Your request to join the ride from ' || (SELECT from_location FROM carpool_rides WHERE id = NEW.ride_id) || 
      ' to ' || (SELECT to_location FROM carpool_rides WHERE id = NEW.ride_id) || ' was declined.' ||
      CASE WHEN NEW.rejection_reason IS NOT NULL THEN ' Reason: ' || NEW.rejection_reason ELSE '' END,
      'request_rejected',
      jsonb_build_object(
        'ride_id', NEW.ride_id,
        'request_id', NEW.id,
        'rejection_reason', NEW.rejection_reason
      ),
      now()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for ride request status changes
DROP TRIGGER IF EXISTS handle_ride_request_status_change ON ride_requests;
CREATE TRIGGER handle_ride_request_status_change
  AFTER UPDATE OF status ON ride_requests
  FOR EACH ROW
  EXECUTE FUNCTION handle_accepted_ride_request();

-- Function to handle instant booking
CREATE OR REPLACE FUNCTION handle_instant_booking(
  p_ride_id UUID,
  p_passenger_id UUID,
  p_passenger_name TEXT,
  p_passenger_email TEXT,
  p_seats_requested INTEGER,
  p_pickup_location TEXT DEFAULT NULL,
  p_dropoff_location TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_available_seats INTEGER;
  v_ride_status TEXT;
  v_result JSONB;
BEGIN
  -- Check if ride exists and has available seats
  SELECT available_seats, status INTO v_available_seats, v_ride_status
  FROM carpool_rides 
  WHERE id = p_ride_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ride not found');
  END IF;
  
  IF v_ride_status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ride is not active');
  END IF;
  
  IF v_available_seats < p_seats_requested THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not enough seats available');
  END IF;
  
  -- Add passenger directly to ride_passengers table
  INSERT INTO ride_passengers (
    ride_id,
    passenger_id,
    passenger_name,
    passenger_email,
    seats_booked,
    status,
    pickup_location,
    dropoff_location
  ) VALUES (
    p_ride_id,
    p_passenger_id,
    p_passenger_name,
    p_passenger_email,
    p_seats_requested,
    'confirmed',
    p_pickup_location,
    p_dropoff_location
  );
  
  -- Update available seats
  UPDATE carpool_rides 
  SET 
    available_seats = available_seats - p_seats_requested,
    booked_seats = booked_seats + p_seats_requested,
    updated_at = now()
  WHERE id = p_ride_id;
  
  -- Create notification for passenger
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    data,
    created_at
  ) VALUES (
    p_passenger_id,
    'Ride Booked Successfully! 🎉',
    'You have successfully joined the ride from ' || (SELECT from_location FROM carpool_rides WHERE id = p_ride_id) || 
    ' to ' || (SELECT to_location FROM carpool_rides WHERE id = p_ride_id) || '.',
    'booking_confirmed',
    jsonb_build_object(
      'ride_id', p_ride_id,
      'seats_booked', p_seats_requested
    ),
    now()
  );
  
  -- Notify driver
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    data,
    created_at
  ) VALUES (
    (SELECT driver_id FROM carpool_rides WHERE id = p_ride_id),
    'New Passenger Joined! 👥',
    p_passenger_name || ' has joined your ride from ' || (SELECT from_location FROM carpool_rides WHERE id = p_ride_id) || 
    ' to ' || (SELECT to_location FROM carpool_rides WHERE id = p_ride_id) || '.',
    'passenger_joined',
    jsonb_build_object(
      'ride_id', p_ride_id,
      'passenger_id', p_passenger_id,
      'passenger_name', p_passenger_name,
      'seats_booked', p_seats_requested
    ),
    now()
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Booking successful');
END;
$$ LANGUAGE plpgsql;

-- Add a unique constraint to prevent duplicate passengers
ALTER TABLE ride_passengers 
ADD CONSTRAINT unique_ride_passenger 
UNIQUE (ride_id, passenger_id);

-- Update the function to get rides with proper passenger data
CREATE OR REPLACE FUNCTION get_rides_with_passengers()
RETURNS TABLE (
  ride_id UUID,
  ride_data JSONB,
  passengers_data JSONB,
  pending_requests_data JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cr.id as ride_id,
    to_jsonb(cr.*) as ride_data,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', rp.passenger_id,
          'name', rp.passenger_name,
          'photo', up.avatar_url,
          'joinedAt', rp.joined_at,
          'status', rp.status,
          'seatsBooked', rp.seats_booked
        )
      ) FILTER (WHERE rp.passenger_id IS NOT NULL),
      '[]'::jsonb
    ) as passengers_data,
    COALESCE(
      jsonb_agg(
        jsonb_build_object(
          'id', rr.id,
          'passengerId', rr.passenger_id,
          'passengerName', rr.passenger_name,
          'passengerPhoto', up2.avatar_url,
          'seatsRequested', rr.seats_requested,
          'message', rr.message,
          'requestedAt', rr.created_at,
          'status', rr.status
        )
      ) FILTER (WHERE rr.id IS NOT NULL AND rr.status = 'pending'),
      '[]'::jsonb
    ) as pending_requests_data
  FROM carpool_rides cr
  LEFT JOIN ride_passengers rp ON cr.id = rp.ride_id
  LEFT JOIN user_profiles up ON rp.passenger_id = up.id
  LEFT JOIN ride_requests rr ON cr.id = rr.ride_id AND rr.status = 'pending'
  LEFT JOIN user_profiles up2 ON rr.passenger_id = up2.id
  WHERE cr.status = 'active'
  GROUP BY cr.id;
END;
$$ LANGUAGE plpgsql;

-- Create view for easy ride data access
CREATE OR REPLACE VIEW rides_with_full_data AS
SELECT 
  cr.*,
  up.full_name as driver_full_name,
  up.avatar_url as driver_photo,
  up.rating as driver_user_rating,
  up.phone as driver_profile_phone,
  up.branch as driver_branch,
  up.year as driver_year,
  COALESCE(
    json_agg(
      json_build_object(
        'id', rp.passenger_id,
        'name', rp.passenger_name,
        'photo', up_passenger.avatar_url,
        'joinedAt', rp.joined_at,
        'status', rp.status,
        'seatsBooked', rp.seats_booked
      )
    ) FILTER (WHERE rp.passenger_id IS NOT NULL),
    '[]'::json
  ) as passengers,
  COALESCE(
    json_agg(
      json_build_object(
        'id', rr.id,
        'passengerId', rr.passenger_id,
        'passengerName', rr.passenger_name,
        'passengerPhoto', up_requester.avatar_url,
        'seatsRequested', rr.seats_requested,
        'message', rr.message,
        'requestedAt', rr.created_at,
        'status', rr.status
      )
    ) FILTER (WHERE rr.id IS NOT NULL),
    '[]'::json
  ) as pending_requests
FROM carpool_rides cr
LEFT JOIN user_profiles up ON cr.driver_id = up.id
LEFT JOIN ride_passengers rp ON cr.id = rp.ride_id
LEFT JOIN user_profiles up_passenger ON rp.passenger_id = up_passenger.id
LEFT JOIN ride_requests rr ON cr.id = rr.ride_id
LEFT JOIN user_profiles up_requester ON rr.passenger_id = up_requester.id
GROUP BY cr.id, up.full_name, up.avatar_url, up.rating, up.phone, up.branch, up.year;

-- Enable Row Level Security policies for the new functions
ALTER TABLE ride_passengers ENABLE ROW LEVEL SECURITY;

-- Policy for ride_passengers - passengers can see their own records, drivers can see passengers in their rides
CREATE POLICY "Users can view ride passengers" ON ride_passengers
  FOR SELECT USING (
    passenger_id = auth.uid() OR 
    ride_id IN (SELECT id FROM carpool_rides WHERE driver_id = auth.uid())
  );

CREATE POLICY "Users can insert ride passengers" ON ride_passengers
  FOR INSERT WITH CHECK (
    passenger_id = auth.uid() OR 
    ride_id IN (SELECT id FROM carpool_rides WHERE driver_id = auth.uid())
  );

CREATE POLICY "Users can update their own ride passenger records" ON ride_passengers
  FOR UPDATE USING (
    passenger_id = auth.uid() OR 
    ride_id IN (SELECT id FROM carpool_rides WHERE driver_id = auth.uid())
  );

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION handle_instant_booking TO authenticated;
GRANT EXECUTE ON FUNCTION get_rides_with_passengers TO authenticated; 