import { supabase } from "../lib/supabase";

// Types
export interface CreateRideData {
  ride_creator_id: string;
  ride_creator_name: string;
  ride_creator_email: string;
  from_location: string;
  to_location: string;
  departure_date: string;
  departure_time: string;
  available_seats: number;
  total_seats: number;
  price_per_seat: number;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_color?: string;
  is_ac?: boolean;
  smoking_allowed?: boolean;
  music_allowed?: boolean;
  pets_allowed?: boolean;
  instant_booking?: boolean;
  chat_enabled?: boolean;
  description?: string;
}

export interface RideRequestData {
  ride_id: string;
  passenger_id: string;
  passenger_name: string;
  passenger_email: string;
  seats_requested: number;
  pickup_location?: string;
  dropoff_location?: string;
  message?: string;
}

export interface UpdateRideData {
  id: string;
  [key: string]: any;
}

// Carpool Rides API
export const carpoolAPI = {
  // Get all active rides
  async getAllRides() {
    try {
      const { data, error } = await supabase
        .from("rides_with_full_data")
        .select("*")
        .eq("status", "active")
        .gte("departure_time", new Date().toISOString())
        .order("departure_time", { ascending: true });

      if (error) throw error;

      // Transform the data to match the expected format
      const transformedData = data?.map((ride) => ({
        ...ride,
        passengers: ride.passengers || [],
        pendingRequests: ride.pending_requests || [],
      }));

      return { data: transformedData, error: null };
    } catch (error) {
      console.error("Error fetching rides:", error);
      // Fallback to original query if view doesn't exist
      try {
        const { data, error } = await supabase
          .from("carpool_rides")
          .select(
            `
            *,
            user_profiles:ride_creator_id (
              full_name,
              avatar_url,
              rating,
              phone,
              student_id,
              branch,
              year
            ),
            ride_passengers (
              passenger_id,
              passenger_name,
              seats_booked,
              status,
              created_at,
              user_profiles:passenger_id (
                avatar_url
              )
            ),
            ride_requests (
              id,
              passenger_id,
              passenger_name,
              seats_requested,
              message,
              status,
              created_at,
              user_profiles:passenger_id (
                avatar_url
              )
            )
          `
          )
          .eq("status", "active")
          .gte("departure_time", new Date().toISOString())
          .order("departure_time", { ascending: true });

        if (error) throw error;
        return { data, error: null };
      } catch (fallbackError) {
        console.error("Fallback query also failed:", fallbackError);
        return { data: null, error: fallbackError };
      }
    }
  },

  // Get rides with advanced filtering
  async getFilteredRides(filters: {
    from_location?: string;
    to_location?: string;
    departure_date?: string;
    max_price?: number;
    min_seats?: number;
    is_ac?: boolean;
    smoking_allowed?: boolean;
    music_allowed?: boolean;
    pets_allowed?: boolean;
    search_query?: string;
  }) {
    try {
      let query = supabase
        .from("carpool_rides")
        .select(
          `
          *,
          user_profiles:ride_creator_id (
            full_name,
            avatar_url,
            rating,
            phone,
            student_id,
            branch,
            year
          )
        `
        )
        .eq("status", "active")
        .gte("departure_time", new Date().toISOString());

      // Apply filters
      if (filters.from_location) {
        query = query.ilike("from_location", `%${filters.from_location}%`);
      }
      if (filters.to_location) {
        query = query.ilike("to_location", `%${filters.to_location}%`);
      }
      if (filters.departure_date) {
        query = query.eq("departure_date", filters.departure_date);
      }
      if (filters.max_price) {
        query = query.lte("price_per_seat", filters.max_price);
      }
      if (filters.min_seats) {
        query = query.gte("available_seats", filters.min_seats);
      }
      if (filters.is_ac !== undefined) {
        query = query.eq("is_ac", filters.is_ac);
      }
      if (filters.smoking_allowed !== undefined) {
        query = query.eq("smoking_allowed", filters.smoking_allowed);
      }
      if (filters.music_allowed !== undefined) {
        query = query.eq("music_allowed", filters.music_allowed);
      }
      if (filters.pets_allowed !== undefined) {
        query = query.eq("pets_allowed", filters.pets_allowed);
      }

      const { data, error } = await query.order("departure_time", {
        ascending: true,
      });

      if (error) throw error;

      // Apply search query filter on client side for better fuzzy matching
      let filteredData = data;
      if (filters.search_query) {
        const searchQuery = filters.search_query.toLowerCase();
        filteredData =
          data?.filter(
            (ride) =>
              ride.from_location.toLowerCase().includes(searchQuery) ||
              ride.to_location.toLowerCase().includes(searchQuery) ||
              ride.ride_creator_name.toLowerCase().includes(searchQuery) ||
              ride.description?.toLowerCase().includes(searchQuery)
          ) || [];
      }

      return { data: filteredData, error: null };
    } catch (error) {
      console.error("Error fetching filtered rides:", error);
      return { data: null, error };
    }
  },

  // Get ride by ID
  async getRideById(rideId: string) {
    try {
      const { data, error } = await supabase
        .from("carpool_rides")
        .select(
          `
          *,
          user_profiles:ride_creator_id (
            full_name,
            avatar_url,
            rating,
            phone,
            student_id,
            branch,
            year
          ),
          ride_requests (
            id,
            passenger_id,
            passenger_name,
            passenger_email,
            seats_requested,
            status,
            message,
            created_at,
            user_profiles:passenger_id (
              full_name,
              avatar_url,
              student_id,
              branch,
              year
            )
          )
        `
        )
        .eq("id", rideId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching ride:", error);
      return { data: null, error };
    }
  },

  // Get rides by driver ID
  async getRidesByDriver(driverId: string) {
    try {
      const { data, error } = await supabase
        .from("carpool_rides")
        .select(
          `
          *,
          ride_requests (
            id,
            passenger_name,
            seats_requested,
            status,
            user_profiles:passenger_id (
              full_name,
              avatar_url,
              student_id
            )
          )
        `
        )
        .eq("ride_creator_id", driverId)
        .order("departure_time", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching driver rides:", error);
      return { data: null, error };
    }
  },

  // Create new ride
  async createRide(rideData: CreateRideData) {
    try {
      const { data, error } = await supabase
        .from("carpool_rides")
        .insert([rideData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error creating ride:", error);
      return { data: null, error };
    }
  },

  // Update ride
  async updateRide(rideId: string, updates: Partial<UpdateRideData>) {
    try {
      const { data, error } = await supabase
        .from("carpool_rides")
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", rideId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error updating ride:", error);
      return { data: null, error };
    }
  },

  // Cancel ride
  async cancelRide(rideId: string, reason?: string) {
    try {
      const { data, error } = await supabase
        .from("carpool_rides")
        .update({
          status: "cancelled",
          description: reason ? `Cancelled: ${reason}` : "Cancelled by driver",
          updated_at: new Date().toISOString(),
        })
        .eq("id", rideId)
        .select()
        .single();

      if (error) throw error;

      // Notify all passengers about cancellation
      const { data: requests } = await supabase
        .from("ride_requests")
        .select("passenger_id, passenger_name")
        .eq("ride_id", rideId)
        .eq("status", "accepted");

      if (requests) {
        const notifications = requests.map((request) => ({
          user_id: request.passenger_id,
          type: "ride_cancelled",
          title: "Ride Cancelled",
          message: `Your ride from ${data.from_location} to ${data.to_location} has been cancelled by the driver.`,
          data: { ride_id: rideId, reason },
        }));

        await supabase.from("notifications").insert(notifications);
      }

      return { data, error: null };
    } catch (error) {
      console.error("Error cancelling ride:", error);
      return { data: null, error };
    }
  },

  // Delete ride (only if no bookings)
  async deleteRide(rideId: string) {
    try {
      // Check if ride has any accepted requests
      const { data: requests } = await supabase
        .from("ride_requests")
        .select("id")
        .eq("ride_id", rideId)
        .eq("status", "accepted");

      if (requests && requests.length > 0) {
        return {
          data: null,
          error: new Error(
            "Cannot delete ride with accepted passengers. Cancel the ride instead."
          ),
        };
      }

      const { error } = await supabase
        .from("carpool_rides")
        .delete()
        .eq("id", rideId);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error("Error deleting ride:", error);
      return { data: null, error };
    }
  },
};

// Ride Requests API
export const rideRequestsAPI = {
  // Get requests for a ride
  async getRideRequests(rideId: string) {
    try {
      const { data, error } = await supabase
        .from("ride_requests")
        .select(
          `
          *,
          user_profiles:passenger_id (
            full_name,
            avatar_url,
            rating,
            phone,
            student_id,
            branch,
            year
          )
        `
        )
        .eq("ride_id", rideId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching ride requests:", error);
      return { data: null, error };
    }
  },

  // Get user's requests
  async getUserRequests(userId: string) {
    try {
      const { data, error } = await supabase
        .from("ride_requests")
        .select(
          `
          *,
          carpool_rides (
            id,
            from_location,
            to_location,
            departure_time,
            departure_date,
            driver_name,
            price_per_seat,
            status
          )
        `
        )
        .eq("passenger_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching user requests:", error);
      return { data: null, error };
    }
  },

  // Create ride request
  async createRideRequest(requestData: RideRequestData) {
    try {
      // Check if user already has a request for this ride
      const { data: existingRequest } = await supabase
        .from("ride_requests")
        .select("id")
        .eq("ride_id", requestData.ride_id)
        .eq("passenger_id", requestData.passenger_id)
        .single();

      if (existingRequest) {
        return {
          data: null,
          error: new Error("You have already requested to join this ride"),
        };
      }

      // Check if ride has enough seats
      const { data: ride } = await supabase
        .from("carpool_rides")
        .select(
          "available_seats, ride_creator_id, ride_creator_name, from_location, to_location"
        )
        .eq("id", requestData.ride_id)
        .single();

      if (!ride || ride.available_seats < requestData.seats_requested) {
        return {
          data: null,
          error: new Error("Not enough seats available"),
        };
      }

      const { data, error } = await supabase
        .from("ride_requests")
        .insert([requestData])
        .select()
        .single();

      if (error) throw error;

      // Create notification for driver
      await supabase.from("notifications").insert([
        {
          user_id: ride.ride_creator_id,
          type: "ride_request",
          title: "New Ride Request",
          message: `${requestData.passenger_name} wants to join your ride from ${ride.from_location} to ${ride.to_location}`,
          data: {
            ride_id: requestData.ride_id,
            request_id: data.id,
            passenger_name: requestData.passenger_name,
            seats_requested: requestData.seats_requested,
          },
        },
      ]);

      return { data, error: null };
    } catch (error) {
      console.error("Error creating ride request:", error);
      return { data: null, error };
    }
  },

  // Accept ride request
  async acceptRideRequest(requestId: string, driverMessage?: string) {
    try {
      const { data, error } = await supabase
        .from("ride_requests")
        .update({
          status: "accepted",
          responded_at: new Date().toISOString(),
          driver_message: driverMessage,
        })
        .eq("id", requestId)
        .select(
          `
          *,
          carpool_rides (
            from_location,
            to_location,
            driver_name
          )
        `
        )
        .single();

      if (error) throw error;

      // The database trigger will handle:
      // 1. Adding passenger to ride_passengers table
      // 2. Updating available seats
      // 3. Creating notifications

      return { data, error: null };
    } catch (error) {
      console.error("Error accepting ride request:", error);
      return { data: null, error };
    }
  },

  // Handle instant booking
  async bookRideInstantly(
    rideId: string,
    passengerData: {
      id: string;
      name: string;
      email: string;
      seatsRequested: number;
      pickupLocation?: string;
      dropoffLocation?: string;
    }
  ) {
    try {
      const { data, error } = await supabase.rpc("handle_instant_booking", {
        p_ride_id: rideId,
        p_passenger_id: passengerData.id,
        p_passenger_name: passengerData.name,
        p_passenger_email: passengerData.email,
        p_seats_requested: passengerData.seatsRequested,
        p_pickup_location: passengerData.pickupLocation,
        p_dropoff_location: passengerData.dropoffLocation,
      });

      if (error) throw error;

      return { data, error: null };
    } catch (error) {
      console.error("Error booking ride instantly:", error);
      return { data: null, error };
    }
  },

  // Reject ride request
  async rejectRideRequest(requestId: string, rejectionReason?: string) {
    try {
      const { data, error } = await supabase
        .from("ride_requests")
        .update({
          status: "rejected",
          responded_at: new Date().toISOString(),
          rejection_reason: rejectionReason,
        })
        .eq("id", requestId)
        .select(
          `
          *,
          carpool_rides (
            from_location,
            to_location,
            driver_name
          )
        `
        )
        .single();

      if (error) throw error;

      // Create notification for passenger
      await supabase.from("notifications").insert([
        {
          user_id: data.passenger_id,
          type: "request_rejected",
          title: "Request Declined",
          message: `${data.carpool_rides.driver_name} declined your request to join the ride from ${data.carpool_rides.from_location} to ${data.carpool_rides.to_location}`,
          data: {
            ride_id: data.ride_id,
            request_id: requestId,
            rejection_reason: rejectionReason,
          },
        },
      ]);

      return { data, error: null };
    } catch (error) {
      console.error("Error rejecting ride request:", error);
      return { data: null, error };
    }
  },

  // Cancel ride request (by passenger)
  async cancelRideRequest(requestId: string) {
    try {
      const { data, error } = await supabase
        .from("ride_requests")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error cancelling ride request:", error);
      return { data: null, error };
    }
  },
};

// Chat API
export const chatAPI = {
  // Get chat messages for a ride
  async getChatMessages(rideId: string) {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select(
          `
          *,
          user_profiles:sender_id (
            full_name,
            avatar_url,
            student_id
          )
        `
        )
        .eq("ride_id", rideId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error fetching chat messages:", error);
      return { data: null, error };
    }
  },

  // Send chat message
  async sendMessage(
    rideId: string,
    senderId: string,
    senderName: string,
    message: string
  ) {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert([
          {
            ride_id: rideId,
            sender_id: senderId,
            sender_name: senderName,
            message: message.trim(),
            message_type: "text",
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Error sending message:", error);
      return { data: null, error };
    }
  },

  // Mark messages as read
  async markMessagesAsRead(rideId: string, userId: string) {
    try {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, read_by")
        .eq("ride_id", rideId)
        .neq("sender_id", userId);

      if (error) throw error;

      // Update read_by array to include current user
      const updates =
        data?.map((message) => {
          const readBy = Array.isArray(message.read_by) ? message.read_by : [];
          if (!readBy.includes(userId)) {
            readBy.push(userId);
          }
          return { id: message.id, read_by: readBy };
        }) || [];

      if (updates.length > 0) {
        const { error: updateError } = await supabase
          .from("chat_messages")
          .upsert(updates);

        if (updateError) throw updateError;
      }

      return { data: true, error: null };
    } catch (error) {
      console.error("Error marking messages as read:", error);
      return { data: null, error };
    }
  },
};

// Analytics API
export const analyticsAPI = {
  // Get user statistics
  async getUserStats(userId: string) {
    try {
      const [ridesGiven, ridesTaken, totalEarnings] = await Promise.all([
        // Rides given as driver
        supabase
          .from("carpool_rides")
          .select("id, status")
          .eq("ride_creator_id", userId),

        // Rides taken as passenger
        supabase
          .from("ride_requests")
          .select("id, status")
          .eq("passenger_id", userId)
          .eq("status", "accepted"),

        // Total earnings
        supabase
          .from("carpool_rides")
          .select("total_earnings")
          .eq("ride_creator_id", userId)
          .eq("status", "completed"),
      ]);

      const stats = {
        rides_given: ridesGiven.data?.length || 0,
        rides_taken: ridesTaken.data?.length || 0,
        total_earnings:
          totalEarnings.data?.reduce(
            (sum, ride) => sum + (ride.total_earnings || 0),
            0
          ) || 0,
        completed_rides:
          ridesGiven.data?.filter((r) => r.status === "completed").length || 0,
        active_rides:
          ridesGiven.data?.filter((r) => r.status === "active").length || 0,
      };

      return { data: stats, error: null };
    } catch (error) {
      console.error("Error fetching user stats:", error);
      return { data: null, error };
    }
  },

  // Get popular routes
  async getPopularRoutes() {
    try {
      const { data, error } = await supabase
        .from("carpool_rides")
        .select("from_location, to_location")
        .eq("status", "completed");

      if (error) throw error;

      // Group by route and count
      const routeCounts: { [key: string]: number } = {};
      data?.forEach((ride) => {
        const route = `${ride.from_location} → ${ride.to_location}`;
        routeCounts[route] = (routeCounts[route] || 0) + 1;
      });

      // Sort by count and take top 10
      const popularRoutes = Object.entries(routeCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .map(([route, count]) => ({ route, count }));

      return { data: popularRoutes, error: null };
    } catch (error) {
      console.error("Error fetching popular routes:", error);
      return { data: null, error };
    }
  },
};

// Utility functions
export const carpoolUtils = {
  // Check if user can book a ride
  canUserBookRide(
    ride: any,
    userId: string
  ): { canBook: boolean; reason?: string } {
    if (ride.ride_creator_id === userId) {
      return { canBook: false, reason: "You cannot book your own ride" };
    }

    if (ride.available_seats <= 0) {
      return { canBook: false, reason: "No seats available" };
    }

    if (ride.status !== "active") {
      return { canBook: false, reason: "Ride is not active" };
    }

    const departureTime = new Date(ride.departure_time);
    const now = new Date();
    if (departureTime <= now) {
      return { canBook: false, reason: "Ride has already departed" };
    }

    return { canBook: true };
  },

  // Format ride for display
  formatRideForDisplay(ride: any) {
    return {
      ...ride,
      departure_time_formatted: new Date(ride.departure_time).toLocaleString(),
      departure_date_formatted: new Date(
        ride.departure_date
      ).toLocaleDateString(),
      price_formatted: `₹${ride.price_per_seat}`,
      seats_info: `${ride.available_seats}/${ride.total_seats} available`,
      driver_info: {
        name: ride.profiles?.full_name || ride.ride_creator_name,
        avatar: ride.profiles?.avatar_url,
        rating: ride.profiles?.rating || ride.ride_creator_rating,
        student_id: ride.profiles?.student_id,
        branch: ride.profiles?.branch,
        year: ride.profiles?.year,
      },
    };
  },

  // Calculate estimated arrival time
  calculateArrivalTime(departureTime: string, duration?: number) {
    const departure = new Date(departureTime);
    const estimatedDuration = duration || 60; // Default 1 hour
    const arrival = new Date(departure.getTime() + estimatedDuration * 60000);
    return arrival.toISOString();
  },

  // Validate ride data
  validateRideData(rideData: Partial<CreateRideData>): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!rideData.from_location?.trim()) {
      errors.push("Pickup location is required");
    }

    if (!rideData.to_location?.trim()) {
      errors.push("Destination is required");
    }

    if (
      rideData.from_location?.toLowerCase().trim() ===
      rideData.to_location?.toLowerCase().trim()
    ) {
      errors.push("Pickup and destination cannot be the same");
    }

    if (!rideData.departure_time) {
      errors.push("Departure time is required");
    } else {
      const departureTime = new Date(rideData.departure_time);
      const now = new Date();
      if (departureTime <= now) {
        errors.push("Departure time must be in the future");
      }
    }

    if (
      !rideData.available_seats ||
      rideData.available_seats < 1 ||
      rideData.available_seats > 8
    ) {
      errors.push("Available seats must be between 1 and 8");
    }

    if (!rideData.price_per_seat || rideData.price_per_seat < 0) {
      errors.push("Price per seat must be a positive number");
    }

    return { isValid: errors.length === 0, errors };
  },
};

// Enhanced ride deletion API
export const rideManagementAPI = {
  // Test function to debug database issues
  async testRideAccess(rideId: string) {
    try {
      console.log("=== DEBUGGING RIDE ACCESS ===");
      console.log("Testing database access for ride:", rideId);
      console.log("Ride ID type:", typeof rideId);
      console.log("Ride ID length:", rideId.length);

      // Test 1: Basic query first
      const { data: basicData, error: basicError } = await supabase
        .from("carpool_rides")
        .select("*")
        .eq("id", rideId);

      console.log("Basic query result:", {
        data: basicData,
        error: basicError,
        dataLength: basicData?.length || 0,
      });

      if (basicData && basicData.length > 0) {
        console.log(
          "✅ Ride found! Details:",
          JSON.stringify(basicData[0], null, 2)
        );
        return { success: true, ride: basicData[0] };
      }

      // Test 2: Check if any rides exist at all
      const { data: allRides, error: allError } = await supabase
        .from("carpool_rides")
        .select(
          "id, ride_creator_name, from_location, to_location, status, created_at"
        )
        .limit(10);

      console.log("=== ALL RIDES CHECK ===");
      console.log("All rides query result:", {
        data: allRides,
        error: allError,
        count: allRides?.length || 0,
      });

      if (allRides && allRides.length > 0) {
        console.log(
          "Available ride IDs:",
          allRides.map((r) => r.id)
        );
        console.log("Looking for:", rideId);

        // Check if the ride ID exists in a different format
        const matchingRide = allRides.find(
          (r) =>
            r.id === rideId || r.id.includes(rideId) || rideId.includes(r.id)
        );

        if (matchingRide) {
          console.log("⚠️ Found similar ride:", matchingRide);
          return {
            success: false,
            error: "Ride ID mismatch",
            similarRide: matchingRide,
          };
        }
      }

      console.log("❌ No ride found with ID:", rideId);
      return { success: false, error: "Ride not found in database" };
    } catch (error) {
      console.error("❌ Test failed:", error);
      return { success: false, error: error.message };
    }
  },

  // New function to check database state
  async debugDatabaseState() {
    try {
      console.log("=== DATABASE STATE DEBUG ===");

      const { data: ridesCount, error: countError } = await supabase
        .from("carpool_rides")
        .select("id", { count: "exact" });

      console.log("Total rides in database:", ridesCount?.length || 0);

      if (countError) {
        console.error("Error counting rides:", countError);
        return { totalRides: 0, error: countError };
      }

      const { data: recentRides, error: recentError } = await supabase
        .from("carpool_rides")
        .select(
          "id, ride_creator_name, from_location, to_location, status, created_at"
        )
        .order("created_at", { ascending: false })
        .limit(5);

      console.log("Recent rides:", recentRides);

      return {
        totalRides: ridesCount?.length || 0,
        recentRides: recentRides || [],
        error: recentError,
      };
    } catch (error) {
      console.error("Database state check failed:", error);
      return { totalRides: 0, error: error.message };
    }
  },
  // Delete ride with cleanup (hard delete)
  async deleteRideWithCleanup(rideId: string) {
    try {
      console.log("Attempting hard delete for ride:", rideId);

      // First, test basic access to the ride
      const testResult = await this.testRideAccess(rideId);
      if (!testResult.success) {
        throw new Error(testResult.error || "Cannot access ride");
      }

      // First, get ride details to notify passengers
      const { data: ride, error: rideError } = await supabase
        .from("carpool_rides")
        .select("*")
        .eq("id", rideId)
        .single();

      if (rideError) {
        console.error("Error fetching ride for deletion:", rideError);
        throw new Error(`Database error: ${rideError.message}`);
      }

      if (!ride) {
        console.error("Ride not found for deletion:", rideId);
        throw new Error("Ride not found");
      }

      // Get passengers separately to avoid potential join issues
      const { data: passengers, error: passengersError } = await supabase
        .from("ride_passengers")
        .select(
          `
          passenger_id,
          user_profiles:passenger_id (
            full_name
          )
        `
        )
        .eq("ride_id", rideId);

      if (passengersError) {
        console.error("Error fetching passengers:", passengersError);
        // Don't fail the entire operation for passenger fetch errors
      }

      console.log(
        "Found ride for deletion:",
        ride.id,
        "Creator:",
        ride.ride_creator_id
      );
      console.log("Found passengers:", passengers?.length || 0);

      // Send notifications to all passengers about ride deletion
      if (passengers && passengers.length > 0) {
        console.log(
          "Sending notifications to",
          passengers.length,
          "passengers"
        );
        const notifications = passengers.map((passenger: any) => ({
          user_id: passenger.passenger_id,
          type: "ride_cancelled",
          title: "Ride Deleted",
          message: `The ride from ${ride.from_location} to ${ride.to_location} has been permanently deleted by the driver.`,
          data: {
            ride_id: rideId,
            from: ride.from_location,
            to: ride.to_location,
            departure_time: ride.departure_time,
          },
        }));

        const { error: notificationError } = await supabase
          .from("notifications")
          .insert(notifications);
        if (notificationError) {
          console.error("Failed to send notifications:", notificationError);
        }
      } else {
        console.log("No passengers to notify for ride deletion");
      }

      // Delete related records in sequence with error handling
      console.log("Starting cleanup sequence...");

      // 1. Delete chat messages
      const { error: chatError } = await supabase
        .from("chat_messages")
        .delete()
        .eq("ride_id", rideId);
      if (chatError) console.error("Error deleting chat messages:", chatError);

      // 2. Delete ride passengers
      const { error: passengersDeleteError } = await supabase
        .from("ride_passengers")
        .delete()
        .eq("ride_id", rideId);
      if (passengersDeleteError)
        console.error("Error deleting ride passengers:", passengersDeleteError);

      // 3. Delete ride requests
      const { error: requestsError } = await supabase
        .from("ride_requests")
        .delete()
        .eq("ride_id", rideId);
      if (requestsError)
        console.error("Error deleting ride requests:", requestsError);

      // 4. Delete notifications related to this ride (skip errors as they're not critical)
      try {
        await supabase
          .from("notifications")
          .delete()
          .eq("data->>ride_id", rideId);
      } catch (notifError) {
        console.log(
          "Could not delete notifications (non-critical):",
          notifError
        );
      }

      // 5. Finally delete the ride itself
      console.log("Deleting main ride record...");
      const { error: deleteError } = await supabase
        .from("carpool_rides")
        .delete()
        .eq("id", rideId);

      if (deleteError) {
        console.error("Error deleting main ride record:", deleteError);
        throw new Error(`Failed to delete ride: ${deleteError.message}`);
      }

      console.log("Hard delete successful");
      return { data: { success: true }, error: null };
    } catch (error: any) {
      console.error("Error in deleteRideWithCleanup:", error);
      return {
        data: null,
        error: error.message || "Failed to delete ride",
      };
    }
  },

  // Cancel ride (soft delete)
  async cancelRideWithReason(
    rideId: string,
    reason: string = "Cancelled by driver"
  ) {
    try {
      console.log("Attempting soft delete (cancel) for ride:", rideId);

      // First, get ride details and passengers to notify them
      const { data: ride, error: rideError } = await supabase
        .from("carpool_rides")
        .select("*")
        .eq("id", rideId)
        .single();

      if (rideError) {
        console.error("Error fetching ride for cancellation:", rideError);
        throw new Error(`Database error: ${rideError.message}`);
      }

      if (!ride) {
        console.error("Ride not found for cancellation:", rideId);
        throw new Error("Ride not found");
      }

      // Get passengers separately
      const { data: passengers, error: passengersError } = await supabase
        .from("ride_passengers")
        .select(
          `
          passenger_id,
          user_profiles:passenger_id (
            full_name
          )
        `
        )
        .eq("ride_id", rideId);

      if (passengersError) {
        console.error("Error fetching passengers:", passengersError);
        // Don't fail the entire operation for passenger fetch errors
      }

      console.log(
        "Found ride for cancellation:",
        ride.id,
        "Creator:",
        ride.ride_creator_id
      );
      console.log("Found passengers:", passengers?.length || 0);

      // Update ride status to cancelled
      const { error: updateError } = await supabase
        .from("carpool_rides")
        .update({
          status: "cancelled",
          cancellation_reason: reason,
          cancelled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", rideId);

      if (updateError) {
        console.error("Error updating ride status:", updateError);
        throw new Error(`Failed to cancel ride: ${updateError.message}`);
      }

      // Send notifications to all passengers about ride cancellation
      if (passengers && passengers.length > 0) {
        console.log(
          "Sending cancellation notifications to",
          passengers.length,
          "passengers"
        );
        const notifications = passengers.map((passenger: any) => ({
          user_id: passenger.passenger_id,
          type: "ride_cancelled",
          title: "Ride Cancelled",
          message: `The ride from ${ride.from_location} to ${ride.to_location} has been cancelled. Reason: ${reason}`,
          data: {
            ride_id: rideId,
            from: ride.from_location,
            to: ride.to_location,
            departure_time: ride.departure_time,
            cancellation_reason: reason,
          },
        }));

        const { error: notificationError } = await supabase
          .from("notifications")
          .insert(notifications);
        if (notificationError) {
          console.error(
            "Failed to send cancellation notifications:",
            notificationError
          );
        }
      } else {
        console.log("No passengers to notify for ride cancellation");
      }

      console.log("Soft delete (cancel) successful");
      return { data: { success: true }, error: null };
    } catch (error: any) {
      console.error("Error in cancelRideWithReason:", error);
      return {
        data: null,
        error: error.message || "Failed to cancel ride",
      };
    }
  },

  // Check if user can delete ride
  async canDeleteRide(rideId: string, userId: string) {
    try {
      const { data: ride, error } = await supabase
        .from("carpool_rides")
        .select("ride_creator_id, status, departure_time")
        .eq("id", rideId)
        .single();

      if (error || !ride) {
        return { canDelete: false, reason: "Ride not found" };
      }

      if (ride.ride_creator_id !== userId) {
        return {
          canDelete: false,
          reason: "Only the driver can delete the ride",
        };
      }

      const now = new Date();
      const departureTime = new Date(ride.departure_time);

      if (departureTime <= now) {
        return {
          canDelete: false,
          reason: "Cannot delete ride that has already started",
        };
      }

      if (ride.status === "completed" || ride.status === "cancelled") {
        return {
          canDelete: false,
          reason: "Cannot delete completed or cancelled rides",
        };
      }

      return { canDelete: true };
    } catch (error) {
      console.error("Error checking delete permission:", error);
      return { canDelete: false, reason: "Error checking permissions" };
    }
  },
};

export default {
  carpoolAPI,
  rideRequestsAPI,
  chatAPI,
  analyticsAPI,
  carpoolUtils,
  rideManagementAPI,
};
