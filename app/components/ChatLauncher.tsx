import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { MessageCircle, Users } from "lucide-react-native";
import { supabase } from "../lib/supabase";
import SecureChatSystem from "./SecureChatSystem";

interface ChatLauncherProps {
  rideId: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
    photo?: string;
  };
  rideDetails: {
    from: string;
    to: string;
    driverName: string;
    departureTime: string;
    driverId: string;
  };
  isDarkMode?: boolean;
}

const ChatLauncher: React.FC<ChatLauncherProps> = ({
  rideId,
  currentUser,
  rideDetails,
  isDarkMode = false,
}) => {
  const [showChat, setShowChat] = useState(false);
  const [participantCount, setParticipantCount] = useState(0);
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [lastMessageTime, setLastMessageTime] = useState<string | null>(null);

  useEffect(() => {
    loadChatInfo();
    const cleanup = setupRealtimeUpdates();

    return () => {
      cleanup();
    };
  }, [rideId]);

  const loadChatInfo = async () => {
    try {
      // Get participant count
      const { data: participants, error: participantsError } = await supabase
        .from("chat_participants")
        .select("id")
        .eq("ride_id", rideId)
        .eq("is_active", true);

      if (participantsError) throw participantsError;
      setParticipantCount(participants?.length || 0);

      // Get last message to check for unread
      const { data: lastMessage, error: messageError } = await supabase
        .from("chat_messages")
        .select("created_at, sender_id")
        .eq("ride_id", rideId)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!messageError && lastMessage) {
        setLastMessageTime(lastMessage.created_at);
        // Mark as unread if the last message is not from current user
        setHasUnreadMessages(lastMessage.sender_id !== currentUser.id);
      }
    } catch (error) {
      console.error("Error loading chat info:", error);
    }
  };

  const setupRealtimeUpdates = () => {
    const subscription = supabase
      .channel(`chat_launcher_${rideId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          const newMessage = payload.new;
          setLastMessageTime(newMessage.created_at);
          if (newMessage.sender_id !== currentUser.id) {
            setHasUnreadMessages(true);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "chat_participants",
          filter: `ride_id=eq.${rideId}`,
        },
        () => {
          loadChatInfo(); // Reload participant count
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleOpenChat = async () => {
    try {
      // Check if user has permission to join this chat
      const canJoinChat = await checkChatPermissions();

      if (!canJoinChat) {
        Alert.alert(
          "Access Denied",
          "You need to be part of this ride to access the chat.",
          [{ text: "OK" }]
        );
        return;
      }

      setHasUnreadMessages(false);
      setShowChat(true);
    } catch (error) {
      console.error("Error opening chat:", error);
      Alert.alert("Error", "Failed to open chat. Please try again.");
    }
  };

  const checkChatPermissions = async (): Promise<boolean> => {
    try {
      // Check if user is the driver
      if (currentUser.id === rideDetails.driverId) {
        return true;
      }

      // Check if user is a passenger
      const { data: passengerCheck, error } = await supabase
        .from("ride_passengers")
        .select("id")
        .eq("ride_id", rideId)
        .eq("passenger_id", currentUser.id)
        .eq("status", "confirmed")
        .single();

      if (!error && passengerCheck) {
        return true;
      }

      // Check if user has a pending/accepted request
      const { data: requestCheck, error: requestError } = await supabase
        .from("ride_requests")
        .select("id")
        .eq("ride_id", rideId)
        .eq("passenger_id", currentUser.id)
        .eq("status", "accepted")
        .single();

      if (!requestError && requestCheck) {
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking chat permissions:", error);
      return false;
    }
  };

  const formatLastMessageTime = () => {
    if (!lastMessageTime) return "";

    const date = new Date(lastMessageTime);
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffHours < 1) return "Active now";
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (showChat) {
    return (
      <SecureChatSystem
        rideId={rideId}
        currentUser={currentUser}
        rideDetails={rideDetails}
        onBack={() => setShowChat(false)}
        isDarkMode={isDarkMode}
      />
    );
  }

  return (
    <TouchableOpacity
      onPress={handleOpenChat}
      style={[
        styles.chatLauncher,
        {
          backgroundColor: isDarkMode ? "#2D3748" : "#FFFFFF",
          borderColor: isDarkMode ? "#4A5568" : "#E2E8F0",
        },
      ]}
    >
      <View style={styles.chatIconContainer}>
        <MessageCircle
          size={24}
          color={
            hasUnreadMessages ? "#007AFF" : isDarkMode ? "#A0AEC0" : "#718096"
          }
        />
        {hasUnreadMessages && <View style={styles.unreadIndicator} />}
      </View>

      <View style={styles.chatInfo}>
        <Text
          style={[
            styles.chatTitle,
            { color: isDarkMode ? "#E2E8F0" : "#2D3748" },
          ]}
        >
          Ride Chat
        </Text>
        <View style={styles.chatMeta}>
          <Users size={12} color={isDarkMode ? "#A0AEC0" : "#718096"} />
          <Text
            style={[
              styles.chatMetaText,
              { color: isDarkMode ? "#A0AEC0" : "#718096" },
            ]}
          >
            {participantCount} participants
          </Text>
          {lastMessageTime && (
            <Text
              style={[
                styles.chatMetaText,
                { color: isDarkMode ? "#A0AEC0" : "#718096" },
              ]}
            >
              • {formatLastMessageTime()}
            </Text>
          )}
        </View>
      </View>

      <View
        style={[
          styles.chatAction,
          { backgroundColor: hasUnreadMessages ? "#007AFF" : "transparent" },
        ]}
      >
        <Text
          style={[
            styles.chatActionText,
            {
              color: hasUnreadMessages
                ? "#FFFFFF"
                : isDarkMode
                ? "#63B3ED"
                : "#007AFF",
            },
          ]}
        >
          {hasUnreadMessages ? "New" : "Open"}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  chatLauncher: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  chatIconContainer: {
    position: "relative",
    marginRight: 12,
  },
  unreadIndicator: {
    position: "absolute",
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF3B30",
  },
  chatInfo: {
    flex: 1,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  chatMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  chatMetaText: {
    fontSize: 12,
  },
  chatAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  chatActionText: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default ChatLauncher;
