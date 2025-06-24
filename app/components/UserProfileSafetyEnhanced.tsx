import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Avatar } from "react-native-paper";
import {
  Star,
  Phone,
  Shield,
  AlertTriangle,
  LogOut,
  ChevronRight,
  MapPin,
  Clock,
  Car,
  User,
  Settings,
  Bell,
  Bus,
  CheckCircle,
  Save,
  X,
  Lock,
  Unlock,
} from "lucide-react-native";
import {
  parseEmailInfo,
  calculateAcademicYear,
  isValidLNMIITEmail,
  generateAvatarFromName,
} from "../lib/utils";
import { supabase } from "../lib/supabase";

interface UserProfileSafetyProps {
  user?: {
    name: string;
    email: string;
    profilePicture?: string;
    role: "passenger" | "driver";
    rating: number;
    branch: string;
    year: string;
    phone: string;
    ridesCompleted: number;
  };
  emergencyContacts?: Array<{
    id: string;
    name: string;
    phone: string;
    relation: string;
  }>;
  rideHistory?: Array<{
    id: string;
    date: string;
    from: string;
    to: string;
    driver: string;
    driverRating?: number;
    status: "completed" | "cancelled" | "upcoming";
  }>;
  busBookings?: Array<{
    id: string;
    busRoute: string;
    seatNumber: string;
    departureTime: string;
    price: number;
    bookingTime: Date;
    status: "active" | "completed" | "expired";
  }>;
  isDarkMode?: boolean;
  onLogout?: () => void;
}

const { width } = Dimensions.get("window");

const UserProfileSafetyEnhanced = ({
  user = {
    name: "Demo User",
    email: "24UCS045@lnmiit.ac.in",
    profilePicture: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
    role: "passenger",
    rating: 4.7,
    branch: "Computer Science",
    year: "3rd Year",
    phone: "+91 99999 00000",
    ridesCompleted: 25,
  },
  emergencyContacts = [
    { id: "1", name: "Parent", phone: "+91 99887 76655", relation: "Father" },
    {
      id: "2",
      name: "Emergency",
      phone: "+91 88776 65544",
      relation: "Mother",
    },
  ],
  rideHistory = [],
  busBookings = [],
  isDarkMode = false,
  onLogout = () => {},
}: UserProfileSafetyProps) => {
  const [activeTab, setActiveTab] = useState<"profile" | "safety" | "bookings">(
    "profile"
  );
  const [locationSharing, setLocationSharing] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const emailInfo = parseEmailInfo(user.email);
  const academicYear = calculateAcademicYear(emailInfo.joiningYear);

  const handleSOS = () => {
    Alert.alert(
      "Emergency SOS",
      "This will immediately notify your emergency contacts and campus security. Only use in real emergencies.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send SOS",
          style: "destructive",
          onPress: () => {
            // TODO: Implement actual SOS functionality
            Alert.alert("SOS Sent", "Emergency contacts have been notified!");
          },
        },
      ]
    );
  };

  const renderStars = (rating: number) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={14}
          fill={i <= rating ? "#FFD700" : "none"}
          color={i <= rating ? "#FFD700" : isDarkMode ? "#666666" : "#CCCCCC"}
        />
      );
    }
    return stars;
  };

  const tabs = [
    { key: "profile", title: "Profile", icon: User },
    { key: "safety", title: "Safety", icon: Shield },
    { key: "bookings", title: "Bookings", icon: Bus },
  ];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: isDarkMode ? "#000000" : "#FFFFFF" },
      ]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: isDarkMode ? "#1F2937" : "#F9FAFB",
            borderBottomColor: isDarkMode ? "#374151" : "#E5E7EB",
          },
        ]}
      >
        <Text
          style={[
            styles.headerTitle,
            { color: isDarkMode ? "#FFFFFF" : "#000000" },
          ]}
        >
          Profile
        </Text>

        {/* Tab Selector */}
        <View
          style={[
            styles.tabContainer,
            { backgroundColor: isDarkMode ? "#1A1A1A" : "#F5F5F5" },
          ]}
        >
          {tabs.map(({ key, title, icon: Icon }) => (
            <TouchableOpacity
              key={key}
              style={[
                styles.tabButton,
                activeTab === key && {
                  backgroundColor: isDarkMode ? "#FFFFFF" : "#000000",
                },
              ]}
              onPress={() => setActiveTab(key as any)}
            >
              <Icon
                size={18}
                color={
                  activeTab === key
                    ? isDarkMode
                      ? "#000000"
                      : "#FFFFFF"
                    : isDarkMode
                    ? "#888888"
                    : "#666666"
                }
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === key
                        ? isDarkMode
                          ? "#000000"
                          : "#FFFFFF"
                        : isDarkMode
                        ? "#888888"
                        : "#666666",
                  },
                ]}
              >
                {title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === "profile" && (
          <View style={styles.tabContent}>
            {/* User Info Card */}
            <View
              style={[
                styles.userCard,
                {
                  backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                  borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                },
              ]}
            >
              <View style={styles.userHeader}>
                <Avatar.Image
                  size={80}
                  source={{
                    uri:
                      user.profilePicture || generateAvatarFromName(user.name),
                  }}
                  style={styles.avatar}
                />
                <View style={styles.userInfo}>
                  <Text
                    style={[
                      styles.userName,
                      { color: isDarkMode ? "#FFFFFF" : "#000000" },
                    ]}
                  >
                    {user.name}
                  </Text>
                  <Text
                    style={[
                      styles.userEmail,
                      { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    {user.email}
                  </Text>
                  <View style={styles.userDetails}>
                    <Text
                      style={[
                        styles.userBranch,
                        { color: isDarkMode ? "#D1D5DB" : "#374151" },
                      ]}
                    >
                      {emailInfo.branchFull}
                    </Text>
                    <Text
                      style={[
                        styles.userYear,
                        { color: isDarkMode ? "#D1D5DB" : "#374151" },
                      ]}
                    >
                      {academicYear} • Joined {emailInfo.joiningYear}
                    </Text>
                  </View>
                  <View style={styles.ratingContainer}>
                    <View style={styles.rating}>
                      {renderStars(user.rating)}
                    </View>
                    <Text
                      style={[
                        styles.ratingText,
                        { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                      ]}
                    >
                      {user.rating} ({user.ridesCompleted} rides)
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Profile Stats */}
            <View style={styles.statsGrid}>
              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                    borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                  },
                ]}
              >
                <Car size={24} color="#4CAF50" />
                <Text
                  style={[
                    styles.statNumber,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" },
                  ]}
                >
                  {user.ridesCompleted}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  Rides Completed
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                    borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                  },
                ]}
              >
                <Star size={24} color="#FFD700" />
                <Text
                  style={[
                    styles.statNumber,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" },
                  ]}
                >
                  {user.rating}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  Rating
                </Text>
              </View>

              <View
                style={[
                  styles.statCard,
                  {
                    backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                    borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                  },
                ]}
              >
                <CheckCircle size={24} color="#2196F3" />
                <Text
                  style={[
                    styles.statNumber,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" },
                  ]}
                >
                  {profileEditInfo.editCount}
                </Text>
                <Text
                  style={[
                    styles.statLabel,
                    { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  Profile Edits Used
                </Text>
              </View>
            </View>

            {/* Account Settings */}
            <View
              style={[
                styles.section,
                {
                  backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                  borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                Account Settings
              </Text>

              <TouchableOpacity style={styles.settingItem}>
                <Settings size={20} color="#6B7280" />
                <Text
                  style={[
                    styles.settingText,
                    { color: isDarkMode ? "#D1D5DB" : "#374151" },
                  ]}
                >
                  App Preferences
                </Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>

              <View style={styles.settingItem}>
                <Bell size={20} color="#6B7280" />
                <Text
                  style={[
                    styles.settingText,
                    { color: isDarkMode ? "#D1D5DB" : "#374151" },
                  ]}
                >
                  Notifications
                </Text>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: "#767577", true: "#4CAF50" }}
                  thumbColor={notificationsEnabled ? "#FFFFFF" : "#f4f3f4"}
                />
              </View>

              <TouchableOpacity style={styles.settingItem} onPress={onLogout}>
                <LogOut size={20} color="#EF4444" />
                <Text style={[styles.settingText, { color: "#EF4444" }]}>
                  Sign Out
                </Text>
                <ChevronRight size={16} color="#9CA3AF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {activeTab === "safety" && (
          <View style={styles.tabContent}>
            {/* Emergency SOS */}
            <TouchableOpacity
              style={[
                styles.sosButton,
                {
                  backgroundColor: "#DC2626",
                  borderColor: "#B91C1C",
                },
              ]}
              onPress={handleSOS}
            >
              <View style={styles.sosContent}>
                <AlertTriangle size={24} color="#FFFFFF" />
                <View style={styles.sosTextContainer}>
                  <Text style={styles.sosTitle}>Emergency SOS</Text>
                  <Text style={styles.sosSubtitle}>
                    Tap to alert emergency contacts
                  </Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Safety Settings */}
            <View
              style={[
                styles.section,
                {
                  backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                  borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                Safety Settings
              </Text>

              <View style={styles.settingItem}>
                <MapPin size={20} color="#6B7280" />
                <Text
                  style={[
                    styles.settingText,
                    { color: isDarkMode ? "#D1D5DB" : "#374151" },
                  ]}
                >
                  Share Location
                </Text>
                <Switch
                  value={locationSharing}
                  onValueChange={setLocationSharing}
                  trackColor={{ false: "#767577", true: "#4CAF50" }}
                  thumbColor={locationSharing ? "#FFFFFF" : "#f4f3f4"}
                />
              </View>
            </View>

            {/* Emergency Contacts */}
            <View
              style={[
                styles.section,
                {
                  backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                  borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                Emergency Contacts
              </Text>

              {emergencyContacts.map((contact) => (
                <View key={contact.id} style={styles.contactItem}>
                  <Phone size={20} color="#6B7280" />
                  <View style={styles.contactInfo}>
                    <Text
                      style={[
                        styles.contactName,
                        { color: isDarkMode ? "#FFFFFF" : "#000000" },
                      ]}
                    >
                      {contact.name}
                    </Text>
                    <Text
                      style={[
                        styles.contactPhone,
                        { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                      ]}
                    >
                      {contact.phone} • {contact.relation}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === "bookings" && (
          <View style={styles.tabContent}>
            {/* Ride History */}
            <View
              style={[
                styles.section,
                {
                  backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                  borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                Recent Rides
              </Text>

              {rideHistory.length > 0 ? (
                rideHistory.slice(0, 3).map((ride) => (
                  <View key={ride.id} style={styles.historyItem}>
                    <Car size={20} color="#6B7280" />
                    <View style={styles.historyInfo}>
                      <Text
                        style={[
                          styles.historyRoute,
                          { color: isDarkMode ? "#FFFFFF" : "#000000" },
                        ]}
                      >
                        {ride.from} → {ride.to}
                      </Text>
                      <Text
                        style={[
                          styles.historyDate,
                          { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                        ]}
                      >
                        {ride.date} • {ride.driver}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            ride.status === "completed"
                              ? "#10B981"
                              : ride.status === "cancelled"
                              ? "#EF4444"
                              : "#F59E0B",
                        },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {ride.status.charAt(0).toUpperCase() +
                          ride.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text
                  style={[
                    styles.emptyText,
                    { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  No ride history yet
                </Text>
              )}
            </View>

            {/* Bus Bookings */}
            <View
              style={[
                styles.section,
                {
                  backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF",
                  borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                },
              ]}
            >
              <Text
                style={[
                  styles.sectionTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                Bus Bookings
              </Text>

              {busBookings.length > 0 ? (
                busBookings.slice(0, 3).map((booking) => (
                  <View key={booking.id} style={styles.historyItem}>
                    <Bus size={20} color="#6B7280" />
                    <View style={styles.historyInfo}>
                      <Text
                        style={[
                          styles.historyRoute,
                          { color: isDarkMode ? "#FFFFFF" : "#000000" },
                        ]}
                      >
                        {booking.busRoute}
                      </Text>
                      <Text
                        style={[
                          styles.historyDate,
                          { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                        ]}
                      >
                        Seat {booking.seatNumber} • {booking.departureTime}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            booking.status === "active"
                              ? "#10B981"
                              : booking.status === "expired"
                              ? "#EF4444"
                              : "#F59E0B",
                        },
                      ]}
                    >
                      <Text style={styles.statusText}>
                        {booking.status.charAt(0).toUpperCase() +
                          booking.status.slice(1)}
                      </Text>
                    </View>
                  </View>
                ))
              ) : (
                <Text
                  style={[
                    styles.emptyText,
                    { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                  ]}
                >
                  No bus bookings yet
                </Text>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Edit Profile Modal */}
     
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  userCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  avatar: {
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  userDetails: {
    marginBottom: 8,
  },
  userBranch: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  userYear: {
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  rating: {
    flexDirection: "row",
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 4,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
  },
  sosButton: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
  },
  sosContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  sosTextContainer: {
    flex: 1,
  },
  sosTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  sosSubtitle: {
    color: "#FFFFFF",
    fontSize: 14,
    opacity: 0.9,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
  },
  contactPhone: {
    fontSize: 14,
  },
  historyItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyRoute: {
    fontSize: 16,
    fontWeight: "600",
  },
  historyDate: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    fontSize: 14,
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  editModal: {
    width: "90%",
    maxWidth: 400,
    maxHeight: "80%",
    borderRadius: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.1)",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  editWarning: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: "center",
    padding: 12,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderRadius: 8,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  readOnlyInfo: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 12,
  },
  readOnlyLabel: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  readOnlyValue: {
    fontSize: 16,
    marginBottom: 4,
  },
  readOnlySubtext: {
    fontSize: 12,
  },
  modalActions: {
    flexDirection: "row",
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
  },
  cancelButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
  saveButton: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default UserProfileSafetyEnhanced;
