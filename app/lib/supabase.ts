import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";

// TODO: Update these with your new Supabase project credentials
const supabaseUrl = "https://ynjzqkrnivxwtyzljwma.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inluanpxa3JuaXZ4d3R5emxqd21hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA2MDE5MzUsImV4cCI6MjA2NjE3NzkzNX0.gyQbjljqBwk1djlQL-B8pQe7yrDjkPTEMApKuKz4ReE";

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase configuration missing!");
  throw new Error("Supabase URL and anon key are required");
}

// Test if URL looks valid
try {
  new URL(supabaseUrl);
} catch (error) {
  console.error("❌ Invalid Supabase URL format:", supabaseUrl);
  throw new Error("Invalid Supabase URL format");
}

// Web-compatible storage
const webStorage = {
  getItem: (key: string) => {
    if (typeof window !== "undefined") {
      return Promise.resolve(window.localStorage.getItem(key));
    }
    return Promise.resolve(null);
  },
  setItem: (key: string, value: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(key, value);
    }
    return Promise.resolve();
  },
  removeItem: (key: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(key);
    }
    return Promise.resolve();
  },
};

// Use appropriate storage based on platform
const storage = Platform.OS === "web" ? webStorage : AsyncStorage;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Email confirmation settings
    flowType: "pkce",
  },
});

// Test connection on startup
const testConnection = async () => {
  try {
    console.log("🔗 Testing Supabase connection...");
    const { data, error } = await supabase
      .from("carpool_rides")
      .select("id")
      .limit(1);

    if (error) {
      console.error("❌ Supabase connection failed:", error.message);
      return false;
    }

    console.log("✅ Supabase connection successful");
    return true;
  } catch (error) {
    console.error("❌ Network error connecting to Supabase:", error);
    return false;
  }
};

// Test connection when module loads (only in development)
if (__DEV__) {
  testConnection();
}

// Default export for Expo Router compatibility
export default supabase;
