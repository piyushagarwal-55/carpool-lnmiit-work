import {
  Ride,
  CreateRideRequest,
  BookRideRequest,
  RideSearchFilters,
  RideRating,
} from "../models/ride";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";

class RidesAPI {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = await this.getStoredToken();
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      const error = await response
        .json()
        .catch(() => ({ message: "Network error" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private async getStoredToken(): Promise<string | null> {
    // In a real app, use AsyncStorage or SecureStore
    return localStorage.getItem("auth_token");
  }

  async createRide(rideData: CreateRideRequest): Promise<Ride> {
    return this.request<Ride>("/rides", {
      method: "POST",
      body: JSON.stringify(rideData),
    });
  }

  async searchRides(filters: RideSearchFilters): Promise<Ride[]> {
    const queryParams = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/rides/search?${queryString}`
      : "/rides/search";

    return this.request<Ride[]>(endpoint);
  }

  async getRideById(rideId: string): Promise<Ride> {
    return this.request<Ride>(`/rides/${rideId}`);
  }

  async bookRide(
    bookingData: BookRideRequest,
  ): Promise<{ success: boolean; bookingId: string }> {
    return this.request<{ success: boolean; bookingId: string }>(
      "/rides/book",
      {
        method: "POST",
        body: JSON.stringify(bookingData),
      },
    );
  }

  async getMyRides(): Promise<Ride[]> {
    return this.request<Ride[]>("/rides/my-rides");
  }

  async getMyBookings(): Promise<any[]> {
    return this.request<any[]>("/rides/my-bookings");
  }

  async updateRide(rideId: string, updates: Partial<Ride>): Promise<Ride> {
    return this.request<Ride>(`/rides/${rideId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async cancelRide(rideId: string): Promise<void> {
    await this.request(`/rides/${rideId}/cancel`, {
      method: "POST",
    });
  }

  async cancelBooking(bookingId: string): Promise<void> {
    await this.request(`/rides/bookings/${bookingId}/cancel`, {
      method: "POST",
    });
  }

  async startRide(rideId: string): Promise<void> {
    await this.request(`/rides/${rideId}/start`, {
      method: "POST",
    });
  }

  async completeRide(rideId: string): Promise<void> {
    await this.request(`/rides/${rideId}/complete`, {
      method: "POST",
    });
  }

  async updateLocation(
    rideId: string,
    location: { latitude: number; longitude: number },
  ): Promise<void> {
    await this.request(`/rides/${rideId}/location`, {
      method: "POST",
      body: JSON.stringify(location),
    });
  }

  async getRideLocation(
    rideId: string,
  ): Promise<{ latitude: number; longitude: number; lastUpdated: Date }> {
    return this.request<{
      latitude: number;
      longitude: number;
      lastUpdated: Date;
    }>(`/rides/${rideId}/location`);
  }

  async rateUser(
    ratingData: Omit<RideRating, "id" | "createdAt">,
  ): Promise<RideRating> {
    return this.request<RideRating>("/rides/rate", {
      method: "POST",
      body: JSON.stringify(ratingData),
    });
  }

  async getRideHistory(userId?: string): Promise<Ride[]> {
    const endpoint = userId
      ? `/rides/history?userId=${userId}`
      : "/rides/history";
    return this.request<Ride[]>(endpoint);
  }

  async getPopularRoutes(): Promise<
    { origin: string; destination: string; count: number }[]
  > {
    return this.request<
      { origin: string; destination: string; count: number }[]
    >("/rides/popular-routes");
  }
}

export const ridesAPI = new RidesAPI();
export default ridesAPI;
