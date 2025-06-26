import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase } from "../lib/supabase";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class PushNotificationService {
  private expoPushToken: string | null = null;

  /**
   * Initialize push notifications and register for push token
   */
  async initializePushNotifications(userId: string): Promise<string | null> {
    try {
      // Check if device supports push notifications
      if (!Device.isDevice) {
        console.warn("Push notifications only work on physical devices");
        return null;
      }

      // Check if we're in Expo Go (which has limitations)
      const isExpoGo = typeof expo !== "undefined" && expo?.modules?.ExpoGo;
      if (isExpoGo) {
        console.warn(
          "Push notifications are limited in Expo Go. Use a development build for full functionality."
        );
        return null;
      }

      // Request permissions
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.warn("Failed to get push token for push notification!");
        return null;
      }

      // Get push token with error handling
      let token;
      try {
        token = await Notifications.getExpoPushTokenAsync();
      } catch (tokenError: any) {
        // Handle specific cases where projectId is missing
        if (tokenError.message?.includes("projectId")) {
          console.warn(
            "Push notifications require a development build. Skipping initialization in Expo Go."
          );
          return null;
        }
        throw tokenError;
      }

      this.expoPushToken = token.data;

      // Store token in database for this user
      await this.storePushToken(userId, token.data);

      // Configure for Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync(
          "carpool-notifications",
          {
            name: "Carpool Notifications",
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: "#FF231F7C",
            sound: "default",
          }
        );
      }

      console.log("Push notifications initialized successfully");
      return token.data;
    } catch (error) {
      console.warn("Push notifications unavailable:", error);
      // Don't throw error - just return null to gracefully handle
      return null;
    }
  }

  /**
   * Store push token in database
   */
  private async storePushToken(userId: string, token: string): Promise<void> {
    try {
      const { error } = await supabase.from("user_profiles").upsert(
        {
          id: userId,
          push_token: token,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "id",
        }
      );

      if (error) {
        console.error("Error storing push token:", error);
      }
    } catch (error) {
      console.error("Error in storePushToken:", error);
    }
  }

  /**
   * Send push notification for ride request
   */
  async sendRideRequestNotification(
    rideCreatorId: string,
    passengerName: string,
    from: string,
    to: string,
    requestId: string
  ): Promise<void> {
    try {
      // Get ride creator's push token
      const { data: userData, error } = await supabase
        .from("user_profiles")
        .select("push_token")
        .eq("id", rideCreatorId)
        .single();

      if (error || !userData?.push_token) {
        console.log("No push token found for user:", rideCreatorId);
        return;
      }

      // Send push notification
      await this.sendPushNotification(
        userData.push_token,
        "🚗 New Ride Request",
        `${passengerName} wants to join your ride from ${from} to ${to}`,
        {
          type: "ride_request",
          requestId,
          from,
          to,
          passengerName,
        }
      );
    } catch (error) {
      console.error("Error sending ride request notification:", error);
    }
  }

  /**
   * Send push notification for ride request accepted
   */
  async sendRideRequestAcceptedNotification(
    passengerId: string,
    rideCreatorName: string,
    from: string,
    to: string,
    rideId: string
  ): Promise<void> {
    try {
      const { data: userData, error } = await supabase
        .from("user_profiles")
        .select("push_token")
        .eq("id", passengerId)
        .single();

      if (error || !userData?.push_token) {
        console.log("No push token found for user:", passengerId);
        return;
      }

      await this.sendPushNotification(
        userData.push_token,
        "✅ Ride Request Accepted!",
        `${rideCreatorName} accepted your request for ${from} to ${to}`,
        {
          type: "ride_accepted",
          rideId,
          from,
          to,
          rideCreatorName,
        }
      );
    } catch (error) {
      console.error("Error sending ride accepted notification:", error);
    }
  }

  /**
   * Send push notification for ride request rejected
   */
  async sendRideRequestRejectedNotification(
    passengerId: string,
    rideCreatorName: string,
    from: string,
    to: string
  ): Promise<void> {
    try {
      const { data: userData, error } = await supabase
        .from("user_profiles")
        .select("push_token")
        .eq("id", passengerId)
        .single();

      if (error || !userData?.push_token) {
        console.log("No push token found for user:", passengerId);
        return;
      }

      await this.sendPushNotification(
        userData.push_token,
        "❌ Ride Request Declined",
        `${rideCreatorName} declined your request for ${from} to ${to}`,
        {
          type: "ride_rejected",
          from,
          to,
          rideCreatorName,
        }
      );
    } catch (error) {
      console.error("Error sending ride rejected notification:", error);
    }
  }

  /**
   * Send push notification for new chat message
   */
  async sendChatMessageNotification(
    recipientId: string,
    senderName: string,
    message: string,
    rideId: string,
    from: string,
    to: string
  ): Promise<void> {
    try {
      const { data: userData, error } = await supabase
        .from("user_profiles")
        .select("push_token")
        .eq("id", recipientId)
        .single();

      if (error || !userData?.push_token) {
        console.log("No push token found for user:", recipientId);
        return;
      }

      await this.sendPushNotification(
        userData.push_token,
        `💬 ${senderName}`,
        message.length > 50 ? message.substring(0, 50) + "..." : message,
        {
          type: "chat_message",
          rideId,
          from,
          to,
          senderName,
        }
      );
    } catch (error) {
      console.error("Error sending chat message notification:", error);
    }
  }

  /**
   * Send push notification for ride cancellation
   */
  async sendRideCancellationNotification(
    passengerId: string,
    rideCreatorName: string,
    from: string,
    to: string,
    reason: string = "No reason provided"
  ): Promise<void> {
    try {
      const { data: userData, error } = await supabase
        .from("user_profiles")
        .select("push_token")
        .eq("id", passengerId)
        .single();

      if (error || !userData?.push_token) {
        console.log("No push token found for user:", passengerId);
        return;
      }

      await this.sendPushNotification(
        userData.push_token,
        "🚫 Ride Cancelled",
        `${rideCreatorName} cancelled the ride from ${from} to ${to}. Reason: ${reason}`,
        {
          type: "ride_cancelled",
          from,
          to,
          rideCreatorName,
          reason,
        }
      );
    } catch (error) {
      console.error("Error sending ride cancellation notification:", error);
    }
  }

  /**
   * Core function to send push notification
   */
  private async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data: any
  ): Promise<void> {
    try {
      const message = {
        to: pushToken,
        sound: "default",
        title,
        body,
        data,
        priority: "high",
        channelId: "carpool-notifications",
      };

      const response = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Accept-encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
      });

      const result = await response.json();

      if (result.errors) {
        console.error("Push notification errors:", result.errors);
      } else {
        console.log("Push notification sent successfully");
      }
    } catch (error) {
      console.error("Error sending push notification:", error);
    }
  }

  /**
   * Handle notification received when app is running
   */
  setupNotificationListeners(
    onNotificationReceived: (notification: any) => void,
    onNotificationTapped: (response: any) => void
  ): () => void {
    // Listener for notifications received while app is running
    const notificationListener = Notifications.addNotificationReceivedListener(
      onNotificationReceived
    );

    // Listener for when user taps on notification
    const responseListener =
      Notifications.addNotificationResponseReceivedListener(
        onNotificationTapped
      );

    // Cleanup function
    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  }

  /**
   * Get notification permissions status
   */
  async getPermissionStatus(): Promise<string> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      return status;
    } catch (error) {
      console.error("Error getting permission status:", error);
      return "unknown";
    }
  }
}

export default new PushNotificationService();
