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
  const lnmiitPattern = /^\d{2}[A-Z]+\d+@lnmiit\.ac\.in$/;
  return lnmiitPattern.test(email);
}

/**
 * Filter rides based on criteria
 */
export function filterRides(
  rides: any[],
  filter: "all" | "today" | "tomorrow" | "this_week",
  searchQuery: string = ""
): any[] {
  let filtered = [...rides];

  // Apply search filter
  if (searchQuery) {
    filtered = filtered.filter(
      (ride) =>
        ride.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.driverName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Apply date filter
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  switch (filter) {
    case "today":
      filtered = filtered.filter(
        (ride) => new Date(ride.date).toDateString() === today.toDateString()
      );
      break;
    case "tomorrow":
      filtered = filtered.filter(
        (ride) => new Date(ride.date).toDateString() === tomorrow.toDateString()
      );
      break;
    case "this_week":
      filtered = filtered.filter((ride) => new Date(ride.date) <= nextWeek);
      break;
  }

  return filtered;
}


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
  const lnmiitPattern = /^\d{2}[A-Z]+\d+@lnmiit\.ac\.in$/;
  return lnmiitPattern.test(email);
}

/**
 * Filter rides based on criteria
 */
export function filterRides(
  rides: any[],
  filter: "all" | "today" | "tomorrow" | "this_week",
  searchQuery: string = ""
): any[] {
  let filtered = [...rides];

  // Apply search filter
  if (searchQuery) {
    filtered = filtered.filter(
      (ride) =>
        ride.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ride.driverName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }

  // Apply date filter
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  switch (filter) {
    case "today":
      filtered = filtered.filter(
        (ride) => new Date(ride.date).toDateString() === today.toDateString()
      );
      break;
    case "tomorrow":
      filtered = filtered.filter(
        (ride) => new Date(ride.date).toDateString() === tomorrow.toDateString()
      );
      break;
    case "this_week":
      filtered = filtered.filter((ride) => new Date(ride.date) <= nextWeek);
      break;
  }

  return filtered;
}
