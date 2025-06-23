export interface User {
  id: string;
  email: string;
  name: string;
  role: "driver" | "passenger";
  profileImage?: string;
  contactNumber?: string;
  branch?: string;
  year?: string;
  rating: number;
  isVerified: boolean;
  emergencyContacts: EmergencyContact[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relation: string;
  userId: string;
}

export interface UserPreferences {
  id: string;
  userId: string;
  locationSharing: boolean;
  notificationsEnabled: boolean;
  darkMode: boolean;
  language: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  role: "driver" | "passenger";
  contactNumber?: string;
  branch?: string;
  year?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

// Dummy default export to satisfy Expo Router
export default function UserModel() {
  return null;
}
