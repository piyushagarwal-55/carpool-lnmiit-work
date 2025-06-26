import React from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  X,
  Car,
  Users,
  MessageCircle,
  Bell,
  MapPin,
  Clock,
  Shield,
  Star,
  Info,
  CheckCircle,
} from "lucide-react-native";

interface InstructionScreenProps {
  visible: boolean;
  onClose: () => void;
  isDarkMode?: boolean;
}

export default function InstructionScreen({
  visible,
  onClose,
  isDarkMode = false,
}: InstructionScreenProps) {
  if (!visible) return null;

  const instructionSections = [
    {
      title: "🚗 Creating a Ride",
      icon: <Car size={24} color="#4CAF50" />,
      color: "#4CAF50",
      steps: [
        "Tap the 'Create Ride' button from the sidebar or quick actions",
        "Fill in departure and destination locations",
        "Select date, time, and number of available seats",
        "Set your price per seat and vehicle details",
        "Add any special instructions or preferences",
        "Choose instant booking or manual approval",
        "Publish your ride and wait for students to join!",
      ],
    },
    {
      title: "🎒 Joining a Ride",
      icon: <Users size={24} color="#2196F3" />,
      color: "#2196F3",
      steps: [
        "Browse available rides on the main screen",
        "Use search to find rides to your destination",
        "Tap on a ride card to view full details",
        "Check the ride creator's profile and rating",
        "Tap 'Join Ride' to send a request",
        "Wait for the ride creator to accept your request",
        "Once accepted, you'll receive a notification",
      ],
    },
    {
      title: "💬 Using Chat",
      icon: <MessageCircle size={24} color="#9C27B0" />,
      color: "#9C27B0",
      steps: [
        "Chat is available once you join a ride",
        "Tap the chat button on ride details",
        "Use chat to coordinate pickup points",
        "Share your location for easy meetup",
        "Discuss any ride-related questions",
        "Chat is secured and private to ride members",
      ],
    },
    {
      title: "🔔 Managing Notifications",
      icon: <Bell size={24} color="#FF9800" />,
      color: "#FF9800",
      steps: [
        "Tap the bell icon to view all notifications",
        "Approve or reject ride requests directly",
        "Get notified when requests are accepted/rejected",
        "Receive ride updates and important messages",
        "Mark notifications as read by tapping them",
        "Use 'Mark All Read' for bulk actions",
      ],
    },
    {
      title: "🛡️ Safety Guidelines",
      icon: <Shield size={24} color="#F44336" />,
      color: "#F44336",
      steps: [
        "Always verify ride creator/student identity",
        "Share your ride details with friends/family",
        "Meet in safe, public locations",
        "Check vehicle details match the description",
        "Report any suspicious behavior immediately",
        "Rate your experience after the ride",
        "Trust your instincts - cancel if uncomfortable",
      ],
    },
    {
      title: "⭐ Rating System",
      icon: <Star size={24} color="#FFC107" />,
      color: "#FFC107",
      steps: [
        "Rate ride creators and students after each ride",
        "Higher ratings build trust in the community",
        "Leave helpful feedback for future riders",
        "Check ratings before joining rides",
        "Maintain a good rating by being punctual",
        "Respect other riders and follow guidelines",
      ],
    },
  ];

  const quickTips = [
    "💡 Tip: Use specific landmarks for pickup/drop locations",
    "⏰ Tip: Plan your rides in advance for better availability",
    "🔍 Tip: Filter rides by time, price, and preferences",
    "📱 Tip: Enable notifications for real-time updates",
    "🤝 Tip: Be courteous and communicate clearly",
    "🚫 Tip: Cancel rides promptly if plans change",
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent={true}
      onRequestClose={onClose}
    >
      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor: isDarkMode ? "#000000" : "#FFFFFF" },
        ]}
      >
        <LinearGradient
          colors={isDarkMode ? ["#000000", "#1A1A1A"] : ["#FFFFFF", "#F8F9FA"]}
          style={styles.gradient}
        >
          {/* Header */}
          <View
            style={[
              styles.header,
              { borderBottomColor: isDarkMode ? "#333" : "#E5E7EB" },
            ]}
          >
            <View style={styles.headerContent}>
              <Info size={24} color={isDarkMode ? "#FFFFFF" : "#1F2937"} />
              <Text
                style={[
                  styles.headerTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                App Instructions
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={isDarkMode ? "#FFFFFF" : "#6B7280"} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Welcome Section */}
            <View
              style={[
                styles.welcomeSection,
                { backgroundColor: isDarkMode ? "#1F2937" : "#F3F4F6" },
              ]}
            >
              <Text
                style={[
                  styles.welcomeTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                Welcome to LNMIIT Carpool! 🚗
              </Text>
              <Text
                style={[
                  styles.welcomeText,
                  { color: isDarkMode ? "#D1D5DB" : "#6B7280" },
                ]}
              >
                Your smart campus transportation solution. Follow these
                instructions to get started with safe and convenient ride
                sharing.
              </Text>
            </View>

            {/* Instruction Sections */}
            {instructionSections.map((section, index) => (
              <View
                key={index}
                style={[
                  styles.instructionSection,
                  { backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF" },
                ]}
              >
                <View style={styles.sectionHeader}>
                  <View
                    style={[
                      styles.sectionIcon,
                      { backgroundColor: section.color + "20" },
                    ]}
                  >
                    {section.icon}
                  </View>
                  <Text
                    style={[
                      styles.sectionTitle,
                      { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                    ]}
                  >
                    {section.title}
                  </Text>
                </View>

                <View style={styles.stepsList}>
                  {section.steps.map((step, stepIndex) => (
                    <View key={stepIndex} style={styles.stepItem}>
                      <View
                        style={[
                          styles.stepNumber,
                          { backgroundColor: section.color },
                        ]}
                      >
                        <Text style={styles.stepNumberText}>
                          {stepIndex + 1}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.stepText,
                          { color: isDarkMode ? "#D1D5DB" : "#4B5563" },
                        ]}
                      >
                        {step}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Quick Tips */}
            <View
              style={[
                styles.tipsSection,
                { backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF" },
              ]}
            >
              <Text
                style={[
                  styles.tipsTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                💡 Quick Tips
              </Text>
              {quickTips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <CheckCircle size={16} color="#4CAF50" />
                  <Text
                    style={[
                      styles.tipText,
                      { color: isDarkMode ? "#D1D5DB" : "#4B5563" },
                    ]}
                  >
                    {tip}
                  </Text>
                </View>
              ))}
            </View>

            {/* Support Section */}
            <View
              style={[
                styles.supportSection,
                { backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF" },
              ]}
            >
              <Text
                style={[
                  styles.supportTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#1F2937" },
                ]}
              >
                🆘 Need Help?
              </Text>
              <Text
                style={[
                  styles.supportText,
                  { color: isDarkMode ? "#D1D5DB" : "#6B7280" },
                ]}
              >
                If you encounter any issues or have questions, please contact
                our support team or report issues through the app.
              </Text>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </LinearGradient>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  welcomeSection: {
    padding: 20,
    borderRadius: 16,
    marginVertical: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    textAlign: "center",
  },
  welcomeText: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  instructionSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
  },
  stepsList: {
    gap: 12,
  },
  stepItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  stepNumberText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  tipsSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  supportSection: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
  },
  supportText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomPadding: {
    height: 40,
  },
});
