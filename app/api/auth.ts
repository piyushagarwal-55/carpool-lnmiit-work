import {
  User,
  CreateUserRequest,
  LoginRequest,
  AuthResponse,
} from "../models/user";

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || "http://localhost:3001/api";

class AuthAPI {
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

  private async storeToken(token: string): Promise<void> {
    // In a real app, use AsyncStorage or SecureStore
    localStorage.setItem("auth_token", token);
  }

  private async removeToken(): Promise<void> {
    // In a real app, use AsyncStorage or SecureStore
    localStorage.removeItem("auth_token");
  }

  async register(userData: CreateUserRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });

    await this.storeToken(response.token);
    return response;
  }

  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(credentials),
    });

    await this.storeToken(response.token);
    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request("/auth/logout", {
        method: "POST",
      });
    } finally {
      await this.removeToken();
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>("/auth/me");
  }

  async refreshToken(): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>("/auth/refresh", {
      method: "POST",
    });

    await this.storeToken(response.token);
    return response;
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    return this.request<User>("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async changePassword(
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    await this.request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    await this.request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  }
}

export const authAPI = new AuthAPI();
export default authAPI;
