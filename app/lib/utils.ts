// Utility functions for LNMIIT Carpool App

export interface EmailInfo {
  joiningYear: string;
  branchCode: string;
  branchFull: string;
  rollNumber: string;
}

/**
 * Parse LNMIIT email to extract year and branch information
 * Example: "24UCS045@lnmiit.ac.in" -> { joiningYear: "24", branchCode: "UCS", branchFull: "Undergraduate Computer Science" }
 */
export function parseEmailInfo(email: string): EmailInfo {
  const emailPattern = /(\d{2})([A-Z]+)(\d+)@lnmiit\.ac\.in/;
  const match = email.match(emailPattern);

  if (!match) {
    return {
      joiningYear: "Unknown",
      branchCode: "Unknown",
      branchFull: "Unknown Branch",
      rollNumber: "Unknown",
    };
  }

  const [, year, branchCode, rollNum] = match;

  const branchMap: Record<string, string> = {
    UCS: "Undergraduate Computer Science",
    UEC: "Undergraduate Electronics and Communication",
    UCC: "Undergraduate Computer and Communication",
    UME: "Undergraduate Mechanical Engineering",
    UCE: "Undergraduate Civil Engineering",
    UEE: "Undergraduate Electrical Engineering",
    UCA: "Undergraduate Chemical Engineering",
    UBI: "Undergraduate Biotechnology",
    UMA: "Undergraduate Mathematics",
    UPH: "Undergraduate Physics",
    UCH: "Undergraduate Chemistry",
    MBA: "Master of Business Administration",
    MCA: "Master of Computer Applications",
    MTH: "Master of Technology",
  };

  return {
    joiningYear: `20${year}`, // Convert "24" to "2024"
    branchCode: branchCode.toUpperCase(),
    branchFull: branchMap[branchCode.toUpperCase()] || "Unknown Branch",
    rollNumber: `${year}${branchCode}${rollNum}`,
  };
}

/**
 * Calculate academic year based on joining year
 */
export function calculateAcademicYear(joiningYear: string): string {
  const currentYear = new Date().getFullYear();
  const joinYear = parseInt(joiningYear);

  if (isNaN(joinYear)) return "Unknown";

  const yearDiff = currentYear - joinYear;

  if (yearDiff < 0) return "Future Student";
  if (yearDiff === 0) return "1st Year";
  if (yearDiff === 1) return "2nd Year";
  if (yearDiff === 2) return "3rd Year";
  if (yearDiff === 3) return "4th Year";
  if (yearDiff >= 4) return "Alumni";

  return "Unknown";
}

/**
 * Format time from ISO string to readable format
 */
export function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    return "Invalid Time";
  }
}

/**
 * Format date from ISO string to readable format
 */
export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch (error) {
    return "Invalid Date";
  }
}

/**
 * Calculate time until ride starts or if it's expired
 */
export function calculateRideExpiry(departureTime: string): {
  isExpired: boolean;
  timeUntilExpiry: string;
  timeUntilStart: string;
} {
  try {
    const departure = new Date(departureTime);
    const expiryTime = new Date(departure.getTime() - 30 * 60 * 1000); // 30 minutes before
    const now = new Date();

    const isExpired = now > expiryTime;

    const timeUntilExpiry = isExpired
      ? "Expired"
      : formatTimeDifference(expiryTime.getTime() - now.getTime());

    const timeUntilStart =
      now > departure
        ? "Started"
        : formatTimeDifference(departure.getTime() - now.getTime());

    return {
      isExpired,
      timeUntilExpiry,
      timeUntilStart,
    };
  } catch (error) {
    return {
      isExpired: true,
      timeUntilExpiry: "Error",
      timeUntilStart: "Error",
    };
  }
}

/**
 * Format time difference in human readable format
 */
export function formatTimeDifference(milliseconds: number): string {
  if (milliseconds <= 0) return "0 minutes";

  const minutes = Math.floor(milliseconds / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days} day${days > 1 ? "s" : ""}`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? "s" : ""} ${minutes % 60} min${
      minutes % 60 > 1 ? "s" : ""
    }`;
  } else {
    return `${minutes} minute${minutes > 1 ? "s" : ""}`;
  }
}

/**
 * Generate avatar URL from name
 */
export function generateAvatarFromName(
  name: string,
  size: number = 40
): string {
  const initials = name
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase())
    .join("")
    .substring(0, 2);

  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FECA57",
    "#FF9FF3",
    "#54A0FF",
    "#5F27CD",
    "#00D2D3",
    "#FF9F43",
    "#FFA502",
    "#2ED573",
    "#1E90FF",
    "#3742FA",
    "#FF6348",
  ];

  const colorIndex = name.length % colors.length;
  const backgroundColor = colors[colorIndex];

  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    initials
  )}&size=${size}&background=${backgroundColor.slice(
    1
  )}&color=fff&bold=true&format=svg`;
}

/**
 * Validate LNMIIT email format
 */
export function isValidLNMIITEmail(email: string): boolean {
  const pattern = /^\d{2}[A-Z]{3}\d{3}@lnmiit\.ac\.in$/;
  return pattern.test(email);
}

/**
 * Check if a ride is expired (30 minutes after start time)
 */
export function isRideExpired(ride: any): boolean {
  if (!ride.departureTime && !ride.departure_date && !ride.departure_time) {
    return false;
  }

  try {
    let rideDateTime: Date;

    if (ride.departureTime) {
      rideDateTime = new Date(ride.departureTime);
    } else if (ride.departure_date && ride.departure_time) {
      rideDateTime = new Date(`${ride.departure_date}T${ride.departure_time}`);
    } else {
      return false;
    }

    // Add 30 minutes to the departure time for expiry
    const expiryTime = new Date(rideDateTime.getTime() + 30 * 60 * 1000);
    const now = new Date();
    return now > expiryTime;
  } catch (error) {
    return false;
  }
}

/**
 * Check if a ride can still be booked (before departure time)
 */
export function canBookRide(ride: any): boolean {
  if (!ride.departureTime && !ride.departure_date && !ride.departure_time) {
    return false;
  }

  try {
    let rideDateTime: Date;

    if (ride.departureTime) {
      rideDateTime = new Date(ride.departureTime);
    } else if (ride.departure_date && ride.departure_time) {
      rideDateTime = new Date(`${ride.departure_date}T${ride.departure_time}`);
    } else {
      return false;
    }

    const now = new Date();
    return now < rideDateTime;
  } catch (error) {
    return false;
  }
}

/**
 * Filter rides based on date filter and search query
 */
export function filterRides(
  rides: any[],
  filter: "all" | "today" | "tomorrow" | "this_week",
  searchQuery: string = ""
): any[] {
  let filtered = rides;

  // First filter out expired rides
  filtered = filtered.filter((ride) => !isRideExpired(ride));

  // Apply date filter
  if (filter !== "all") {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    filtered = filtered.filter((ride) => {
      const rideDate = new Date(ride.departureTime || ride.date);

      switch (filter) {
        case "today":
          return rideDate.toDateString() === today.toDateString();
        case "tomorrow":
          return rideDate.toDateString() === tomorrow.toDateString();
        case "this_week":
          return rideDate >= today && rideDate <= nextWeek;
        default:
          return true;
      }
    });
  }

  // Apply search filter
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (ride) =>
        ride.from?.toLowerCase().includes(query) ||
        ride.to?.toLowerCase().includes(query) ||
        ride.driverName?.toLowerCase().includes(query)
    );
  }

  return filtered;
}

/**
 * Apply advanced filters to rides
 */
export function applyAdvancedFilters(rides: any[], filters: any): any[] {
  if (!rides || rides.length === 0) return [];

  let filtered = [...rides];

  // First filter out expired rides
  filtered = filtered.filter((ride) => !isRideExpired(ride));

  // Apply date filter
  if (filters.dateFilter !== "all") {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    switch (filters.dateFilter) {
      case "today":
        filtered = filtered.filter((ride) => {
          const rideDate = new Date(
            ride.departureTime || ride.departure_date || ride.date
          );
          const rideDateOnly = new Date(
            rideDate.getFullYear(),
            rideDate.getMonth(),
            rideDate.getDate()
          );
          return rideDateOnly.getTime() === today.getTime();
        });
        break;

      case "tomorrow":
        filtered = filtered.filter((ride) => {
          const rideDate = new Date(
            ride.departureTime || ride.departure_date || ride.date
          );
          const rideDateOnly = new Date(
            rideDate.getFullYear(),
            rideDate.getMonth(),
            rideDate.getDate()
          );
          return rideDateOnly.getTime() === tomorrow.getTime();
        });
        break;

      case "this_week":
        filtered = filtered.filter((ride) => {
          const rideDate = new Date(
            ride.departureTime || ride.departure_date || ride.date
          );
          return rideDate >= today && rideDate <= nextWeek;
        });
        break;
    }
  }

  // Apply time filter
  if (filters.timeFilter !== "all" && filters.timeFilter) {
    filtered = filtered.filter((ride) => {
      const timeStr = ride.departure_time || ride.departureTime;
      if (!timeStr) return false;

      let hour: number;
      if (typeof timeStr === "string") {
        const time = timeStr.includes(":")
          ? timeStr
          : new Date(timeStr).toTimeString();
        hour = parseInt(time.split(":")[0]);
      } else {
        hour = new Date(timeStr).getHours();
      }

      switch (filters.timeFilter) {
        case "morning":
          return hour >= 6 && hour < 12;
        case "afternoon":
          return hour >= 12 && hour < 18;
        case "evening":
          return hour >= 18 || hour < 6;
        default:
          return true;
      }
    });
  }

  // Apply price filter
  if (
    filters.priceRange &&
    (filters.priceRange.min > 0 || filters.priceRange.max < 1000)
  ) {
    filtered = filtered.filter((ride) => {
      const price = ride.price_per_seat || ride.pricePerSeat || 0;
      return price >= filters.priceRange.min && price <= filters.priceRange.max;
    });
  }

  // Apply seats filter
  if (filters.seatsFilter !== "all") {
    filtered = filtered.filter((ride) => {
      const availableSeats = ride.available_seats || ride.availableSeats || 0;
      switch (filters.seatsFilter) {
        case "1":
          return availableSeats >= 1;
        case "2":
          return availableSeats >= 2;
        case "3":
          return availableSeats >= 3;
        case "4+":
          return availableSeats >= 4;
        default:
          return true;
      }
    });
  }

  // Sort rides
  filtered.sort((a, b) => {
    switch (filters.sortBy) {
      case "price":
        const priceA = a.price_per_seat || a.pricePerSeat || 0;
        const priceB = b.price_per_seat || b.pricePerSeat || 0;
        return priceA - priceB;
      case "rating":
        const ratingA = a.driver_rating || a.driverRating || 0;
        const ratingB = b.driver_rating || b.driverRating || 0;
        return ratingB - ratingA;
      case "distance":
        // Default sort by distance (can be enhanced with actual distance calculation)
        return 0;
      case "time":
      default:
        const dateTimeA = new Date(
          a.departureTime || `${a.departure_date}T${a.departure_time}` || a.date
        );
        const dateTimeB = new Date(
          b.departureTime || `${b.departure_date}T${b.departure_time}` || b.date
        );
        return dateTimeA.getTime() - dateTimeB.getTime();
    }
  });

  return filtered;
}

/**
 * Delete expired rides from the database
 */
export async function deleteExpiredRides(supabase: any): Promise<number> {
  try {
    // First, get all expired rides
    const { data: expiredRides, error: fetchError } = await supabase
      .from("carpool_rides")
      .select("id, departure_time, departure_date")
      .in("status", ["active", "full"]);

    if (fetchError) {
      console.error("Error fetching rides for expiry check:", fetchError);
      return 0;
    }

    if (!expiredRides || expiredRides.length === 0) {
      return 0;
    }

    // Filter to find truly expired rides
    const expiredRideIds = expiredRides
      .filter((ride: any) => isRideExpired(ride))
      .map((ride: any) => ride.id);

    if (expiredRideIds.length === 0) {
      return 0;
    }

    // Delete expired rides and related data
    const { error: deleteError } = await supabase
      .from("carpool_rides")
      .delete()
      .in("id", expiredRideIds);

    if (deleteError) {
      console.error("Error deleting expired rides:", deleteError);
      return 0;
    }

    console.log(`Successfully deleted ${expiredRideIds.length} expired rides`);
    return expiredRideIds.length;
  } catch (error) {
    console.error("Error in deleteExpiredRides:", error);
    return 0;
  }
}

/**
 * Cleanup old data from the database (expired rides, old notifications, etc.)
 */
export async function cleanupOldData(supabase: any): Promise<{
  deletedRides: number;
  deletedNotifications: number;
  deletedMessages: number;
}> {
  try {
    const results = {
      deletedRides: 0,
      deletedNotifications: 0,
      deletedMessages: 0,
    };

    // 1. Delete expired rides
    results.deletedRides = await deleteExpiredRides(supabase);

    // 2. Delete old notifications (older than 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { error: notificationError } = await supabase
      .from("notifications")
      .delete()
      .lt("created_at", thirtyDaysAgo.toISOString());

    if (!notificationError) {
      console.log("Old notifications cleaned up");
    }

    // 3. Delete old chat messages (older than 30 days)
    const { error: messageError } = await supabase
      .from("chat_messages")
      .delete()
      .lt("created_at", thirtyDaysAgo.toISOString());

    if (!messageError) {
      console.log("Old chat messages cleaned up");
    }

    // 4. Delete rejected/cancelled ride requests (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { error: requestError } = await supabase
      .from("ride_requests")
      .delete()
      .in("status", ["rejected", "cancelled"])
      .lt("created_at", sevenDaysAgo.toISOString());

    if (!requestError) {
      console.log("Old ride requests cleaned up");
    }

    return results;
  } catch (error) {
    console.error("Error in cleanupOldData:", error);
    return {
      deletedRides: 0,
      deletedNotifications: 0,
      deletedMessages: 0,
    };
  }
}

/**
 * Mark expired rides as completed instead of deleting (alternative approach)
 */
export async function markExpiredRidesAsCompleted(
  supabase: any
): Promise<number> {
  try {
    // Get all active/full rides
    const { data: activeRides, error: fetchError } = await supabase
      .from("carpool_rides")
      .select("id, departure_time, departure_date")
      .in("status", ["active", "full"]);

    if (fetchError) {
      console.error("Error fetching rides for expiry check:", fetchError);
      return 0;
    }

    if (!activeRides || activeRides.length === 0) {
      return 0;
    }

    // Filter to find expired rides
    const expiredRideIds = activeRides
      .filter((ride: any) => isRideExpired(ride))
      .map((ride: any) => ride.id);

    if (expiredRideIds.length === 0) {
      return 0;
    }

    // Mark as completed instead of deleting
    const { error: updateError } = await supabase
      .from("carpool_rides")
      .update({
        status: "completed",
        updated_at: new Date().toISOString(),
      })
      .in("id", expiredRideIds);

    if (updateError) {
      console.error("Error marking expired rides as completed:", updateError);
      return 0;
    }

    console.log(
      `Successfully marked ${expiredRideIds.length} expired rides as completed`
    );
    return expiredRideIds.length;
  } catch (error) {
    console.error("Error in markExpiredRidesAsCompleted:", error);
    return 0;
  }
}

// Default export for compatibility
const utils = {
  parseEmailInfo,
  calculateAcademicYear,
  formatTime,
  formatDate,
  calculateRideExpiry,
  formatTimeDifference,
  generateAvatarFromName,
  isValidLNMIITEmail,
  isRideExpired,
  filterRides,
  applyAdvancedFilters,
  deleteExpiredRides,
  cleanupOldData,
  markExpiredRidesAsCompleted,
};

export default utils;
