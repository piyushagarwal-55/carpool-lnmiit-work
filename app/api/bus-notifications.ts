import { supabase } from "../lib/supabase";
import React from "react";

// This is an API utility file, not a React component
// Adding a dummy component to satisfy the route requirement
export default function BusNotificationsAPI() {
  return null;
}

export interface BusSchedule {
  id: string;
  route_name: string;
  origin: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  available_seats: number;
  total_seats: number;
  status: "active" | "departed" | "cancelled";
  schedule_type: "weekday" | "weekend";
  driver_notification?: string;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface BusNotification {
  id: string;
  user_id: string;
  bus_schedule_id: string;
  route_name: string;
  origin: string;
  destination: string;
  departure_time: string;
  notification_time: string;
  is_sent: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  max_notifications: number;
  reminder_minutes: number;
  email_notifications: boolean;
  push_notifications: boolean;
  sms_notifications: boolean;
  created_at: string;
  updated_at: string;
}

export interface NotificationHistory {
  id: string;
  notification_id: string;
  user_id: string;
  bus_schedule_id: string;
  sent_at: string;
  notification_type: string;
  message: string;
  delivery_status: "sent" | "failed" | "pending";
}

// =============================================
// BUS SCHEDULES API
// =============================================

export const getBusSchedules = async (scheduleType?: "weekday" | "weekend") => {
  try {
    let query = supabase
      .from("bus_schedules")
      .select("*")
      .eq("status", "active")
      .order("departure_time", { ascending: true });

    if (scheduleType) {
      query = query.eq("schedule_type", scheduleType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching bus schedules:", error);
      throw error;
    }

    return data as BusSchedule[];
  } catch (error) {
    console.error("Error in getBusSchedules:", error);
    throw error;
  }
};

export const getBusScheduleById = async (scheduleId: string) => {
  try {
    const { data, error } = await supabase
      .from("bus_schedules")
      .select("*")
      .eq("id", scheduleId)
      .single();

    if (error) {
      console.error("Error fetching bus schedule:", error);
      throw error;
    }

    return data as BusSchedule;
  } catch (error) {
    console.error("Error in getBusScheduleById:", error);
    throw error;
  }
};

// =============================================
// BUS NOTIFICATIONS API
// =============================================

export const createBusNotification = async (
  userId: string,
  busScheduleId: string
) => {
  try {
    // First check if user can add more notifications
    const { data: canAdd, error: checkError } = await supabase.rpc(
      "can_add_notification",
      { p_user_id: userId }
    );

    if (checkError) {
      console.error("Error checking notification limit:", checkError);
      throw checkError;
    }

    if (!canAdd) {
      throw new Error(
        "Maximum notification limit reached. Please remove some notifications first."
      );
    }

    // Get bus schedule details
    const busSchedule = await getBusScheduleById(busScheduleId);

    // Create notification
    const { data, error } = await supabase
      .from("bus_notifications")
      .insert({
        user_id: userId,
        bus_schedule_id: busScheduleId,
        route_name: busSchedule.route_name,
        origin: busSchedule.origin,
        destination: busSchedule.destination,
        departure_time: busSchedule.departure_time,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating bus notification:", error);
      throw error;
    }

    return data as BusNotification;
  } catch (error) {
    console.error("Error in createBusNotification:", error);
    throw error;
  }
};

export const getUserBusNotifications = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("bus_notifications")
      .select(
        `
        *,
        bus_schedules (
          available_seats,
          total_seats,
          status,
          color,
          driver_notification
        )
      `
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("departure_time", { ascending: true });

    if (error) {
      console.error("Error fetching user notifications:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getUserBusNotifications:", error);
    throw error;
  }
};

export const deleteBusNotification = async (
  notificationId: string,
  userId: string
) => {
  try {
    const { error } = await supabase
      .from("bus_notifications")
      .update({ is_active: false })
      .eq("id", notificationId)
      .eq("user_id", userId);

    if (error) {
      console.error("Error deleting bus notification:", error);
      throw error;
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteBusNotification:", error);
    throw error;
  }
};

export const getUserNotificationCount = async (userId: string) => {
  try {
    const { data, error } = await supabase.rpc("get_user_notification_count", {
      p_user_id: userId,
    });

    if (error) {
      console.error("Error getting notification count:", error);
      throw error;
    }

    return data as number;
  } catch (error) {
    console.error("Error in getUserNotificationCount:", error);
    throw error;
  }
};

// =============================================
// NOTIFICATION PREFERENCES API
// =============================================

export const getUserNotificationPreferences = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("user_notification_preferences")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      // Not found error
      console.error("Error fetching notification preferences:", error);
      throw error;
    }

    // Return default preferences if none exist
    if (!data) {
      return {
        user_id: userId,
        max_notifications: 3,
        reminder_minutes: 30,
        email_notifications: true,
        push_notifications: true,
        sms_notifications: false,
      };
    }

    return data as NotificationPreferences;
  } catch (error) {
    console.error("Error in getUserNotificationPreferences:", error);
    throw error;
  }
};

export const updateNotificationPreferences = async (
  userId: string,
  preferences: Partial<NotificationPreferences>
) => {
  try {
    const { data, error } = await supabase
      .from("user_notification_preferences")
      .upsert({
        user_id: userId,
        ...preferences,
      })
      .select()
      .single();

    if (error) {
      console.error("Error updating notification preferences:", error);
      throw error;
    }

    return data as NotificationPreferences;
  } catch (error) {
    console.error("Error in updateNotificationPreferences:", error);
    throw error;
  }
};

// =============================================
// NOTIFICATION HISTORY API
// =============================================

export const getUserNotificationHistory = async (
  userId: string,
  limit = 50
) => {
  try {
    const { data, error } = await supabase
      .from("notification_history")
      .select(
        `
        *,
        bus_notifications (
          route_name,
          origin,
          destination,
          departure_time
        )
      `
      )
      .eq("user_id", userId)
      .order("sent_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error fetching notification history:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getUserNotificationHistory:", error);
    throw error;
  }
};

// =============================================
// ADMIN/SYSTEM FUNCTIONS
// =============================================

export const getPendingNotifications = async () => {
  try {
    const { data, error } = await supabase.rpc("get_pending_notifications");

    if (error) {
      console.error("Error fetching pending notifications:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Error in getPendingNotifications:", error);
    throw error;
  }
};

export const markNotificationAsSent = async (
  notificationId: string,
  message: string,
  deliveryStatus: "sent" | "failed" = "sent"
) => {
  try {
    // Update notification as sent
    const { error: updateError } = await supabase
      .from("bus_notifications")
      .update({ is_sent: true })
      .eq("id", notificationId);

    if (updateError) {
      console.error("Error updating notification status:", updateError);
      throw updateError;
    }

    // Add to history
    const { data: notification } = await supabase
      .from("bus_notifications")
      .select("user_id, bus_schedule_id")
      .eq("id", notificationId)
      .single();

    if (notification) {
      const { error: historyError } = await supabase
        .from("notification_history")
        .insert({
          notification_id: notificationId,
          user_id: notification.user_id,
          bus_schedule_id: notification.bus_schedule_id,
          message,
          delivery_status: deliveryStatus,
        });

      if (historyError) {
        console.error("Error adding to notification history:", historyError);
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error in markNotificationAsSent:", error);
    throw error;
  }
};

// =============================================
// UTILITY FUNCTIONS
// =============================================

export const searchBusSchedules = async (
  searchTerm: string,
  scheduleType?: "weekday" | "weekend"
) => {
  try {
    let query = supabase
      .from("bus_schedules")
      .select("*")
      .eq("status", "active");

    if (scheduleType) {
      query = query.eq("schedule_type", scheduleType);
    }

    // Search in route_name, origin, or destination
    query = query.or(
      `route_name.ilike.%${searchTerm}%,origin.ilike.%${searchTerm}%,destination.ilike.%${searchTerm}%`
    );

    query = query.order("departure_time", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Error searching bus schedules:", error);
      throw error;
    }

    return data as BusSchedule[];
  } catch (error) {
    console.error("Error in searchBusSchedules:", error);
    throw error;
  }
};

export const filterBusSchedulesByTime = async (
  startTime: string,
  endTime: string,
  scheduleType?: "weekday" | "weekend"
) => {
  try {
    let query = supabase
      .from("bus_schedules")
      .select("*")
      .eq("status", "active")
      .gte("departure_time", startTime)
      .lte("departure_time", endTime);

    if (scheduleType) {
      query = query.eq("schedule_type", scheduleType);
    }

    query = query.order("departure_time", { ascending: true });

    const { data, error } = await query;

    if (error) {
      console.error("Error filtering bus schedules by time:", error);
      throw error;
    }

    return data as BusSchedule[];
  } catch (error) {
    console.error("Error in filterBusSchedulesByTime:", error);
    throw error;
  }
};

// =============================================
// NOTIFICATION CHECKER (for background service)
// =============================================

export const checkAndSendNotifications = async () => {
  try {
    const pendingNotifications = await getPendingNotifications();

    for (const notification of pendingNotifications) {
      try {
        // Here you would integrate with your push notification service
        // For now, we'll just mark as sent with a basic message
        const message = `🚌 Reminder: Your bus ${notification.route_name} from ${notification.origin} to ${notification.destination} departs at ${notification.departure_time}. Don't miss it!`;

        await markNotificationAsSent(notification.notification_id, message);

        console.log(
          `Notification sent for user ${notification.user_id}: ${message}`
        );
      } catch (notificationError) {
        console.error(
          `Failed to send notification ${notification.notification_id}:`,
          notificationError
        );
        await markNotificationAsSent(
          notification.notification_id,
          "Failed to send notification",
          "failed"
        );
      }
    }

    return { success: true, processed: pendingNotifications.length };
  } catch (error) {
    console.error("Error in checkAndSendNotifications:", error);
    throw error;
  }
};
