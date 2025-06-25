import { supabase } from "../lib/supabase";

export interface NotificationData {
  userId: string;
  type:
    | "join_request"
    | "request_accepted"
    | "request_rejected"
    | "ride_updated"
    | "ride_cancelled"
    | "chat_message";
  title: string;
  message: string;
  data: {
    rideId?: string;
    requestId?: string;
    chatId?: string;
    passengerName?: string;
    driverName?: string;
    from?: string;
    to?: string;
  };
}

export class NotificationService {
  static async createNotification(
    notificationData: NotificationData
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from("notifications").insert({
        user_id: notificationData.userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data,
        read: false,
        created_at: new Date().toISOString(),
      });

      if (error) {
        console.error("Error creating notification:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in createNotification:", error);
      return false;
    }
  }

  static async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) {
        console.error("Error marking notification as read:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in markAsRead:", error);
      return false;
    }
  }

  static async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", userId)
        .eq("read", false);

      if (error) {
        console.error("Error marking all notifications as read:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error in markAllAsRead:", error);
      return false;
    }
  }

  static async getUserNotifications(userId: string, limit: number = 20) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("Error fetching notifications:", error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error("Error in getUserNotifications:", error);
      return [];
    }
  }

  static async fetchNotifications(userId: string, limit: number = 20) {
    return this.getUserNotifications(userId, limit);
  }

  static async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("read", false);

      if (error) {
        console.error("Error getting unread count:", error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error("Error in getUnreadCount:", error);
      return 0;
    }
  }

  // Specific notification creators for different events
  static async notifyJoinRequest(
    driverId: string,
    passengerName: string,
    rideId: string,
    requestId: string,
    from: string,
    to: string
  ): Promise<boolean> {
    return this.createNotification({
      userId: driverId,
      type: "join_request",
      title: "New Ride Request",
      message: `${passengerName} wants to join your ride from ${from} to ${to}`,
      data: {
        rideId,
        requestId,
        passengerName,
        from,
        to,
      },
    });
  }

  static async notifyRequestAccepted(
    passengerId: string,
    driverName: string,
    rideId: string,
    from: string,
    to: string
  ): Promise<boolean> {
    return this.createNotification({
      userId: passengerId,
      type: "request_accepted",
      title: "Request Accepted!",
      message: `${driverName} accepted your request to join the ride from ${from} to ${to}`,
      data: {
        rideId,
        driverName,
        from,
        to,
      },
    });
  }

  static async notifyRequestRejected(
    passengerId: string,
    driverName: string,
    rideId: string,
    from: string,
    to: string
  ): Promise<boolean> {
    return this.createNotification({
      userId: passengerId,
      type: "request_rejected",
      title: "Request Declined",
      message: `${driverName} declined your request to join the ride from ${from} to ${to}`,
      data: {
        rideId,
        driverName,
        from,
        to,
      },
    });
  }

  static async notifyRideUpdated(
    userIds: string[],
    driverName: string,
    rideId: string,
    from: string,
    to: string
  ): Promise<boolean> {
    const promises = userIds.map((userId) =>
      this.createNotification({
        userId,
        type: "ride_updated",
        title: "Ride Updated",
        message: `${driverName} updated the ride from ${from} to ${to}`,
        data: {
          rideId,
          driverName,
          from,
          to,
        },
      })
    );

    try {
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error("Error sending ride updated notifications:", error);
      return false;
    }
  }

  static async notifyRideCancelled(
    userIds: string[],
    driverName: string,
    rideId: string,
    from: string,
    to: string
  ): Promise<boolean> {
    const promises = userIds.map((userId) =>
      this.createNotification({
        userId,
        type: "ride_cancelled",
        title: "Ride Cancelled",
        message: `${driverName} cancelled the ride from ${from} to ${to}`,
        data: {
          rideId,
          driverName,
          from,
          to,
        },
      })
    );

    try {
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error("Error sending ride cancelled notifications:", error);
      return false;
    }
  }
}

export default NotificationService;
