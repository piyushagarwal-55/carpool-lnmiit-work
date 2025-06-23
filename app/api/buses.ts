import {
  Bus,
  BusRoute,
  BusSchedule,
  BusBooking,
  CreateBusBookingRequest,
  BusSearchFilters,
} from "../models/bus";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";

class BusesAPI {
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

  async getSchedules(filters?: BusSearchFilters): Promise<BusSchedule[]> {
    const queryParams = new URLSearchParams();

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          queryParams.append(key, value.toString());
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/buses/schedules?${queryString}`
      : "/buses/schedules";

    return this.request<BusSchedule[]>(endpoint);
  }

  async getScheduleById(scheduleId: string): Promise<BusSchedule> {
    return this.request<BusSchedule>(`/buses/schedules/${scheduleId}`);
  }

  async getAvailableSeats(
    scheduleId: string,
  ): Promise<{ seatNumber: string; isAvailable: boolean }[]> {
    return this.request<{ seatNumber: string; isAvailable: boolean }[]>(
      `/buses/schedules/${scheduleId}/seats`,
    );
  }

  async bookBus(bookingData: CreateBusBookingRequest): Promise<BusBooking> {
    return this.request<BusBooking>("/buses/book", {
      method: "POST",
      body: JSON.stringify(bookingData),
    });
  }

  async getMyBookings(): Promise<BusBooking[]> {
    return this.request<BusBooking[]>("/buses/my-bookings");
  }

  async getBookingById(bookingId: string): Promise<BusBooking> {
    return this.request<BusBooking>(`/buses/bookings/${bookingId}`);
  }

  async cancelBooking(bookingId: string): Promise<void> {
    await this.request(`/buses/bookings/${bookingId}/cancel`, {
      method: "POST",
    });
  }

  async getBusLocation(
    scheduleId: string,
  ): Promise<{
    latitude: number;
    longitude: number;
    lastUpdated: Date;
  } | null> {
    return this.request<{
      latitude: number;
      longitude: number;
      lastUpdated: Date;
    } | null>(`/buses/schedules/${scheduleId}/location`);
  }

  async getRoutes(): Promise<BusRoute[]> {
    return this.request<BusRoute[]>("/buses/routes");
  }

  async getRouteById(routeId: string): Promise<BusRoute> {
    return this.request<BusRoute>(`/buses/routes/${routeId}`);
  }

  async getBuses(): Promise<Bus[]> {
    return this.request<Bus[]>("/buses");
  }

  async getBusById(busId: string): Promise<Bus> {
    return this.request<Bus>(`/buses/${busId}`);
  }

  async getPopularRoutes(): Promise<
    { routeName: string; bookingCount: number }[]
  > {
    return this.request<{ routeName: string; bookingCount: number }[]>(
      "/buses/popular-routes",
    );
  }

  async getSchedulesByRoute(
    routeId: string,
    date?: string,
  ): Promise<BusSchedule[]> {
    const endpoint = date
      ? `/buses/routes/${routeId}/schedules?date=${date}`
      : `/buses/routes/${routeId}/schedules`;
    return this.request<BusSchedule[]>(endpoint);
  }

  async updateBooking(
    bookingId: string,
    updates: Partial<BusBooking>,
  ): Promise<BusBooking> {
    return this.request<BusBooking>(`/buses/bookings/${bookingId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async getBookingHistory(): Promise<BusBooking[]> {
    return this.request<BusBooking[]>("/buses/booking-history");
  }

  async validateTicket(
    ticketNumber: string,
  ): Promise<{ valid: boolean; booking?: BusBooking }> {
    return this.request<{ valid: boolean; booking?: BusBooking }>(
      `/buses/validate-ticket/${ticketNumber}`,
    );
  }
}

export const busesAPI = new BusesAPI();
export default busesAPI;
