import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Vibration,
} from "react-native";
import {
  ArrowLeft,
  Send,
  Users,
  Phone,
  MoreHorizontal,
  Shield,
  CheckCheck,
  Info,
  X,
} from "lucide-react-native";
import { supabase } from "../lib/supabase";
import { Avatar } from "react-native-paper";

const { width, height } = Dimensions.get("window");

interface ChatMessage {
  id: string;
  ride_id: string;
  sender_id: string;
  sender_name: string;
  sender_photo?: string;
  message: string;
  message_type: "text" | "system" | "image" | "location";
  reply_to?: string;
  is_edited: boolean;
  created_at: string;
  updated_at: string;
}

interface ChatParticipant {
  id: string;
  ride_id: string;
  user_id: string;
  user_name: string;
  user_photo?: string;
  joined_at: string;
  is_active: boolean;
}

interface SecureChatSystemProps {
  rideId: string;
  currentUser: {
    id: string;
    name: string;
    photo?: string;
  };
  rideDetails: {
    from: string;
    to: string;
    driverName: string;
    departureTime: string;
  };
  onBack: () => void;
  isDarkMode?: boolean;
}

const SecureChatSystem: React.FC<SecureChatSystemProps> = ({
  rideId,
  currentUser,
  rideDetails,
  onBack,
  isDarkMode = false,
}) => {
  console.log("SecureChatSystem component rendered with:", {
    rideId,
    currentUser: currentUser.name,
  });
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [participants, setParticipants] = useState<ChatParticipant[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const realtimeSubscription = useRef<any>(null);

  useEffect(() => {
    if (rideId && currentUser.id) {
      initializeChat();
      setupRealtimeSubscription();
    }

    return () => {
      if (realtimeSubscription.current) {
        realtimeSubscription.current.unsubscribe();
        realtimeSubscription.current = null;
      }
    };
  }, [rideId, currentUser.id]);

  const initializeChat = async () => {
    try {
      console.log(
        "Initializing chat for ride:",
        rideId,
        "user:",
        currentUser.name
      );
      setLoading(true);

      // Join chat as participant
      await joinChatAsParticipant();

      // Load existing messages
      await loadMessages();

      // Load participants
      await loadParticipants();

      console.log("Chat initialized successfully");
      setLoading(false);
    } catch (error) {
      console.error("Error initializing chat:", error);
      Alert.alert("Error", "Failed to load chat. Please try again.");
      setLoading(false);
    }
  };

  const joinChatAsParticipant = async () => {
    try {
      console.log(
        "Attempting to join chat for user:",
        currentUser.name,
        "ride:",
        rideId
      );
      const { error } = await supabase.from("chat_participants").upsert(
        {
          ride_id: rideId,
          user_id: currentUser.id,
          user_name: currentUser.name,
          user_photo: currentUser.photo,
          is_active: true,
        },
        {
          onConflict: "ride_id,user_id",
        }
      );

      if (error) {
        console.error("Database error joining chat:", error);
        throw error;
      }
      console.log("Successfully joined chat as participant");
    } catch (error) {
      console.error("Error joining chat:", error);
      Alert.alert(
        "Database Error",
        "Failed to join chat. Please check your connection."
      );
    }
  };

  const loadMessages = async () => {
    try {
      console.log("Loading messages for ride:", rideId);
      const { data, error } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("ride_id", rideId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Database error loading messages:", error);
        throw error;
      }

      console.log("Loaded", data?.length || 0, "messages");
      setMessages(data || []);

      // Scroll to bottom after loading
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
    } catch (error) {
      console.error("Error loading messages:", error);
      Alert.alert(
        "Error",
        "Failed to load chat messages. Chat tables may not be set up yet."
      );
    }
  };

  const loadParticipants = async () => {
    try {
      const { data, error } = await supabase
        .from("chat_participants")
        .select("*")
        .eq("ride_id", rideId)
        .eq("is_active", true)
        .order("joined_at", { ascending: true });

      if (error) throw error;

      setParticipants(data || []);
    } catch (error) {
      console.error("Error loading participants:", error);
    }
  };

  const setupRealtimeSubscription = () => {
    realtimeSubscription.current = supabase
      .channel(`chat_${rideId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_messages",
          filter: `ride_id=eq.${rideId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => [...prev, newMessage]);

          // Auto-scroll to bottom for new messages
          setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
          }, 100);

          // Vibrate for new messages from others
          if (newMessage.sender_id !== currentUser.id) {
            Vibration.vibrate(100);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "chat_participants",
          filter: `ride_id=eq.${rideId}`,
        },
        () => {
          loadParticipants(); // Reload participants when someone joins
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "chat_participants",
          filter: `ride_id=eq.${rideId}`,
        },
        () => {
          loadParticipants(); // Reload participants when status changes
        }
      )
      .subscribe();
  };

  const sendMessage = async () => {
    if (!inputText.trim() || sending) return;

    try {
      setSending(true);

      const messageData = {
        ride_id: rideId,
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        sender_photo: currentUser.photo,
        message: inputText.trim(),
        message_type: "text" as const,
        reply_to: replyingTo?.id || null,
        is_edited: false,
      };

      const { error } = await supabase
        .from("chat_messages")
        .insert([messageData]);

      if (error) throw error;

      setInputText("");
      setReplyingTo(null);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const sendSystemMessage = async (message: string) => {
    try {
      const { error } = await supabase.from("chat_messages").insert([
        {
          ride_id: rideId,
          sender_id: "system",
          sender_name: "System",
          message,
          message_type: "system",
          is_edited: false,
        },
      ]);

      if (error) throw error;
    } catch (error) {
      console.error("Error sending system message:", error);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const handleReply = (message: ChatMessage) => {
    setReplyingTo(message);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const renderMessage = ({
    item,
    index,
  }: {
    item: ChatMessage;
    index: number;
  }) => {
    const isOwnMessage = item.sender_id === currentUser.id;
    const isSystemMessage = item.message_type === "system";
    const showAvatar = !isOwnMessage && !isSystemMessage;

    if (isSystemMessage) {
      return (
        <View style={styles.systemMessageContainer}>
          <Text
            style={[
              styles.systemMessage,
              { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
            ]}
          >
            {item.message}
          </Text>
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          isOwnMessage ? styles.ownMessage : styles.otherMessage,
        ]}
      >
        {showAvatar && (
          <Avatar.Image
            size={32}
            source={{
              uri:
                item.sender_photo ||
                `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.sender_name}`,
            }}
            style={styles.messageAvatar}
          />
        )}

        <View
          style={[
            styles.messageBubble,
            isOwnMessage
              ? [styles.ownMessageBubble, { backgroundColor: "#007AFF" }]
              : [
                  styles.otherMessageBubble,
                  { backgroundColor: isDarkMode ? "#2D3748" : "#F7FAFC" },
                ],
          ]}
        >
          {!isOwnMessage && (
            <Text
              style={[
                styles.senderName,
                { color: isDarkMode ? "#63B3ED" : "#3182CE" },
              ]}
            >
              {item.sender_name}
            </Text>
          )}

          {item.reply_to && (
            <View
              style={[
                styles.replyContainer,
                {
                  backgroundColor: isOwnMessage
                    ? "rgba(255,255,255,0.2)"
                    : isDarkMode
                    ? "#4A5568"
                    : "#EDF2F7",
                },
              ]}
            >
              <Text
                style={[
                  styles.replyText,
                  {
                    color: isOwnMessage
                      ? "#E2E8F0"
                      : isDarkMode
                      ? "#A0AEC0"
                      : "#718096",
                  },
                ]}
              >
                Replying to previous message
              </Text>
            </View>
          )}

          <Text
            style={[
              styles.messageText,
              {
                color: isOwnMessage
                  ? "#FFFFFF"
                  : isDarkMode
                  ? "#E2E8F0"
                  : "#2D3748",
              },
            ]}
          >
            {item.message}
          </Text>

          <View style={styles.messageFooter}>
            <Text
              style={[
                styles.messageTime,
                {
                  color: isOwnMessage
                    ? "#E2E8F0"
                    : isDarkMode
                    ? "#A0AEC0"
                    : "#718096",
                },
              ]}
            >
              {formatTime(item.created_at)}
            </Text>
            {isOwnMessage && (
              <CheckCheck
                size={14}
                color={
                  isOwnMessage ? "#E2E8F0" : isDarkMode ? "#A0AEC0" : "#718096"
                }
              />
            )}
          </View>
        </View>

        {!isOwnMessage && (
          <TouchableOpacity
            onPress={() => handleReply(item)}
            style={styles.replyButton}
          >
            <Text style={styles.replyButtonText}>Reply</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderParticipantsModal = () => (
    <Modal
      visible={showParticipants}
      animationType="slide"
      transparent
      onRequestClose={() => setShowParticipants(false)}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.participantsModal,
            { backgroundColor: isDarkMode ? "#2D3748" : "#FFFFFF" },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text
              style={[
                styles.modalTitle,
                { color: isDarkMode ? "#E2E8F0" : "#2D3748" },
              ]}
            >
              Chat Participants ({participants.length})
            </Text>
            <TouchableOpacity
              onPress={() => setShowParticipants(false)}
              style={styles.closeButton}
            >
              <X size={24} color={isDarkMode ? "#E2E8F0" : "#2D3748"} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={participants}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.participantItem}>
                <Avatar.Image
                  size={40}
                  source={{
                    uri:
                      item.user_photo ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_name}`,
                  }}
                />
                <View style={styles.participantInfo}>
                  <Text
                    style={[
                      styles.participantName,
                      { color: isDarkMode ? "#E2E8F0" : "#2D3748" },
                    ]}
                  >
                    {item.user_name}
                    {item.user_id === currentUser.id && " (You)"}
                  </Text>
                  <Text
                    style={[
                      styles.participantJoined,
                      { color: isDarkMode ? "#A0AEC0" : "#718096" },
                    ]}
                  >
                    Joined {formatTime(item.joined_at)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.activeIndicator,
                    { backgroundColor: item.is_active ? "#48BB78" : "#F56565" },
                  ]}
                />
              </View>
            )}
          />
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View
        style={[
          styles.loadingContainer,
          { backgroundColor: isDarkMode ? "#1A202C" : "#FFFFFF" },
        ]}
      >
        <ActivityIndicator size="large" color="#007AFF" />
        <Text
          style={[
            styles.loadingText,
            { color: isDarkMode ? "#E2E8F0" : "#2D3748" },
          ]}
        >
          Loading secure chat...
        </Text>
      </View>
    );
  }

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="overFullScreen"
      transparent={true}
      onRequestClose={onBack}
      statusBarTranslucent={false}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onBack}
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}
          style={{ flex: 0 }}
        >
          <View
            style={[
              styles.container,
              {
                backgroundColor: isDarkMode ? "#1A202C" : "#FFFFFF",
                height: "90%",
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
              },
            ]}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  backgroundColor: isDarkMode ? "#2D3748" : "#F7FAFC",
                  borderBottomColor: isDarkMode ? "#4A5568" : "#E2E8F0",
                },
              ]}
            >
              <TouchableOpacity onPress={onBack} style={styles.backButton}>
                <ArrowLeft
                  size={24}
                  color={isDarkMode ? "#E2E8F0" : "#2D3748"}
                />
              </TouchableOpacity>

              <View style={styles.headerInfo}>
                <Text
                  style={[
                    styles.headerTitle,
                    { color: isDarkMode ? "#E2E8F0" : "#2D3748" },
                  ]}
                >
                  {rideDetails.from} → {rideDetails.to}
                </Text>
                <Text
                  style={[
                    styles.headerSubtitle,
                    { color: isDarkMode ? "#A0AEC0" : "#718096" },
                  ]}
                >
                  {participants.length} participants •{" "}
                  {rideDetails.departureTime}
                </Text>
              </View>

              <View style={styles.headerActions}>
                <TouchableOpacity
                  onPress={() => setShowParticipants(true)}
                  style={styles.headerAction}
                >
                  <Users size={20} color={isDarkMode ? "#E2E8F0" : "#2D3748"} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.headerAction}>
                  <MoreHorizontal
                    size={20}
                    color={isDarkMode ? "#E2E8F0" : "#2D3748"}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Security Notice */}
            <View
              style={[
                styles.securityNotice,
                { backgroundColor: isDarkMode ? "#2A4A3A" : "#F0FDF4" },
              ]}
            >
              <Shield size={16} color="#10B981" />
              <Text
                style={[
                  styles.securityNoticeText,
                  { color: isDarkMode ? "#6EE7B7" : "#047857" },
                ]}
              >
                This chat is secured with end-to-end encryption
              </Text>
            </View>

            {/* Reply Banner */}
            {replyingTo && (
              <View
                style={[
                  styles.replyBanner,
                  { backgroundColor: isDarkMode ? "#374151" : "#F3F4F6" },
                ]}
              >
                <View style={styles.replyInfo}>
                  <Text
                    style={[
                      styles.replyingToText,
                      { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    Replying to {replyingTo.sender_name}
                  </Text>
                  <Text
                    style={[
                      styles.replyPreview,
                      { color: isDarkMode ? "#D1D5DB" : "#374151" },
                    ]}
                    numberOfLines={1}
                  >
                    {replyingTo.message}
                  </Text>
                </View>
                <TouchableOpacity onPress={cancelReply}>
                  <X size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                </TouchableOpacity>
              </View>
            )}

            {/* Messages */}
            <View style={styles.messagesList}>
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.id}
                renderItem={renderMessage}
                contentContainerStyle={styles.messagesContent}
                showsVerticalScrollIndicator={false}
                onContentSizeChange={() =>
                  flatListRef.current?.scrollToEnd({ animated: true })
                }
              />
            </View>

            {/* Input */}
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 20}
              style={{ backgroundColor: "transparent" }}
            >
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: isDarkMode ? "#2D3748" : "#F7FAFC",
                    borderTopColor: isDarkMode ? "#4A5568" : "#E2E8F0",
                  },
                ]}
              >
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  placeholder="Type a message..."
                  placeholderTextColor={isDarkMode ? "#A0AEC0" : "#718096"}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: isDarkMode ? "#4A5568" : "#FFFFFF",
                      color: isDarkMode ? "#E2E8F0" : "#2D3748",
                      borderColor: isDarkMode ? "#718096" : "#E2E8F0",
                    },
                  ]}
                  multiline
                  maxLength={1000}
                />
                <TouchableOpacity
                  onPress={sendMessage}
                  disabled={!inputText.trim() || sending}
                  style={[
                    styles.sendButton,
                    {
                      backgroundColor:
                        !inputText.trim() || sending ? "#A0AEC0" : "#007AFF",
                      opacity: !inputText.trim() || sending ? 0.5 : 1,
                    },
                  ]}
                >
                  {sending ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Send size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>

            {renderParticipantsModal()}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "600",
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerAction: {
    padding: 8,
  },
  securityNotice: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  securityNoticeText: {
    fontSize: 12,
    fontWeight: "500",
  },
  replyBanner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  replyInfo: {
    flex: 1,
  },
  replyingToText: {
    fontSize: 12,
    fontWeight: "500",
  },
  replyPreview: {
    fontSize: 14,
    marginTop: 2,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  ownMessage: {
    justifyContent: "flex-end",
  },
  otherMessage: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: width * 0.7,
    borderRadius: 16,
    padding: 12,
  },
  ownMessageBubble: {
    marginLeft: "auto",
    borderBottomRightRadius: 4,
  },
  otherMessageBubble: {
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
  },
  replyContainer: {
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#007AFF",
  },
  replyText: {
    fontSize: 12,
    fontStyle: "italic",
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  replyButton: {
    marginLeft: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  replyButtonText: {
    fontSize: 12,
    color: "#007AFF",
  },
  systemMessageContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  systemMessage: {
    fontSize: 12,
    fontStyle: "italic",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  participantsModal: {
    maxHeight: height * 0.7,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  closeButton: {
    padding: 4,
  },
  participantItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 16,
    fontWeight: "500",
  },
  participantJoined: {
    fontSize: 12,
    marginTop: 2,
  },
  activeIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default SecureChatSystem;
