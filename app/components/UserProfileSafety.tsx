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
  Edit2,
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
} from "lucide-react-native";

interface UserProfileSafetyProps {
  user?: {
    name: string;
    email: string;
    profilePicture?: string;
    role: "driver" | "passenger";
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

const UserProfileSafety = ({
  user = {
    name: "Demo User",
    email: "demo@lnmiit.ac.in",
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
  rideHistory = [
    {
      id: "1",
      date: "2023-10-15 14:30",
      from: "LNMIIT Campus",
      to: "Jaipur Railway Station",
      driver: "Amit Kumar",
      driverRating: 4.8,
      status: "completed",
    },
    {
      id: "2",
      date: "2023-10-10 09:15",
      from: "Jaipur City Mall",
      to: "LNMIIT Campus",
      driver: "Priya Singh",
      driverRating: 4.5,
      status: "completed",
    },
  ],
  busBookings = [
    {
      id: "1",
      busRoute: "Campus to City Center",
      seatNumber: "5A",
      departureTime: "08:00 AM",
      price: 50,
      bookingTime: new Date(),
      status: "active",
    },
    {
      id: "2",
      busRoute: "Campus to Railway Station",
      seatNumber: "3B",
      departureTime: "09:30 AM",
      price: 75,
      bookingTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: "expired",
    },
  ],
  isDarkMode = false,
  onLogout = () => {},
}: UserProfileSafetyProps) => {
  const [activeTab, setActiveTab] = useState<"profile" | "safety" | "bookings">(
    "profile"
  );
  const [locationSharing, setLocationSharing] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  const handleSOS = () => {
    console.log("SOS Alert triggered - Emergency contacts would be notified");
    // TODO: Implement actual SOS functionality
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
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && [
                  styles.activeTab,
                  { backgroundColor: isDarkMode ? "#FFFFFF" : "#000000" },
                ],
              ]}
              onPress={() =>
                setActiveTab(tab.key as "profile" | "safety" | "bookings")
              }
            >
              <tab.icon
                size={16}
                color={
                  activeTab === tab.key
                    ? isDarkMode
                      ? "#000000"
                      : "#FFFFFF"
                    : isDarkMode
                    ? "#CCCCCC"
                    : "#666666"
                }
              />
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      activeTab === tab.key
                        ? isDarkMode
                          ? "#000000"
                          : "#FFFFFF"
                        : isDarkMode
                        ? "#CCCCCC"
                        : "#666666",
                  },
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "profile" ? (
          <View style={styles.content}>
            {/* User Info Card */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDarkMode ? "#1A1A2E" : "#E8F4FD",
                  borderColor: isDarkMode ? "#4A90E2" : "#2196F3",
                  borderWidth: 2,
                },
              ]}
            >
              <View style={styles.userHeader}>
                <View style={styles.avatarContainer}>
                  <Avatar.Image
                    size={90}
                    source={{
                      uri:
                        user.profilePicture ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
                    }}
                  />
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: "#22C55E",
                        position: "absolute",
                        bottom: 2,
                        right: 2,
                      },
                    ]}
                  >
                    <Text style={[styles.statusText, { fontSize: 8 }]}>
                      Online
                    </Text>
                  </View>
                </View>
                <View style={styles.userInfo}>
                  <Text
                    style={[
                      styles.userName,
                      {
                        color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                        fontSize: 22,
                      },
                    ]}
                  >
                    {user.name}
                  </Text>
                  <Text
                    style={[
                      styles.userEmail,
                      {
                        color: isDarkMode ? "#B8C5D1" : "#5A6C7D",
                        fontSize: 15,
                      },
                    ]}
                  >
                    {user.email}
                  </Text>
                  <View style={styles.ratingContainer}>
                    <View style={styles.stars}>{renderStars(user.rating)}</View>
                    <Text
                      style={[
                        styles.ratingText,
                        {
                          color: isDarkMode ? "#B8C5D1" : "#5A6C7D",
                          fontSize: 13,
                          fontWeight: "500",
                        },
                      ]}
                    >
                      {user.rating} ⭐ ({user.ridesCompleted} rides)
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={[
                    styles.editButton,
                    {
                      backgroundColor: isDarkMode ? "#4A90E2" : "#2196F3",
                      width: 44,
                      height: 44,
                    },
                  ]}
                  onPress={() => {
                    Alert.alert(
                      "✏️ Edit Profile",
                      "Profile editing features:\n\n📝 Update personal information\n📷 Change profile picture\n🎓 Edit academic details\n📞 Update contact information\n⭐ View ratings & reviews\n\nComing soon in the next update!",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Got it! 👍", style: "default" },
                      ]
                    );
                  }}
                >
                  <Edit2 size={20} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.userDetails}>
                <View
                  style={[
                    styles.detailRow,
                    {
                      backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF",
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    },
                  ]}
                >
                  <View style={styles.detailIconContainer}>
                    <User
                      size={18}
                      color={isDarkMode ? "#4A90E2" : "#2196F3"}
                    />
                    <Text
                      style={[
                        styles.detailLabel,
                        {
                          color: isDarkMode ? "#B8C5D1" : "#5A6C7D",
                          fontWeight: "500",
                        },
                      ]}
                    >
                      Role
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.detailValue,
                      {
                        color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.detailRow,
                    {
                      backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF",
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    },
                  ]}
                >
                  <View style={styles.detailIconContainer}>
                    <Settings
                      size={18}
                      color={isDarkMode ? "#4A90E2" : "#2196F3"}
                    />
                    <Text
                      style={[
                        styles.detailLabel,
                        {
                          color: isDarkMode ? "#B8C5D1" : "#5A6C7D",
                          fontWeight: "500",
                        },
                      ]}
                    >
                      Branch
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.detailValue,
                      {
                        color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {user.branch}
                  </Text>
                </View>
                <View
                  style={[
                    styles.detailRow,
                    {
                      backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF",
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    },
                  ]}
                >
                  <View style={styles.detailIconContainer}>
                    <Clock
                      size={18}
                      color={isDarkMode ? "#4A90E2" : "#2196F3"}
                    />
                    <Text
                      style={[
                        styles.detailLabel,
                        {
                          color: isDarkMode ? "#B8C5D1" : "#5A6C7D",
                          fontWeight: "500",
                        },
                      ]}
                    >
                      Year
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.detailValue,
                      {
                        color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {user.year}
                  </Text>
                </View>
                <View
                  style={[
                    styles.detailRow,
                    {
                      backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF",
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 12,
                    },
                  ]}
                >
                  <View style={styles.detailIconContainer}>
                    <Phone
                      size={18}
                      color={isDarkMode ? "#4A90E2" : "#2196F3"}
                    />
                    <Text
                      style={[
                        styles.detailLabel,
                        {
                          color: isDarkMode ? "#B8C5D1" : "#5A6C7D",
                          fontWeight: "500",
                        },
                      ]}
                    >
                      Phone
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.detailValue,
                      {
                        color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                        fontWeight: "600",
                      },
                    ]}
                  >
                    {user.phone}
                  </Text>
                </View>
              </View>
            </View>

            {/* Settings */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDarkMode ? "#1A1A2E" : "#F0F9FF",
                  borderColor: isDarkMode ? "#8B5CF6" : "#7C3AED",
                  borderWidth: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                    fontSize: 20,
                    marginBottom: 20,
                  },
                ]}
              >
                ⚙️ Settings & Preferences
              </Text>

              <View
                style={[
                  styles.settingItem,
                  {
                    backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                    marginBottom: 12,
                  },
                ]}
              >
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.settingIconContainer,
                      { backgroundColor: isDarkMode ? "#8B5CF6" : "#7C3AED" },
                    ]}
                  >
                    <Bell size={18} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.settingText,
                        {
                          color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                          fontSize: 16,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      Push Notifications
                    </Text>
                    <Text
                      style={[
                        styles.settingDescription,
                        {
                          color: isDarkMode ? "#B8C5D1" : "#5A6C7D",
                          fontSize: 13,
                        },
                      ]}
                    >
                      Get notified for rides & bookings
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{
                    false: isDarkMode ? "#374151" : "#E5E7EB",
                    true: isDarkMode ? "#8B5CF6" : "#7C3AED",
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <TouchableOpacity
                style={[
                  styles.settingItem,
                  {
                    backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF",
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 16,
                  },
                ]}
                onPress={() =>
                  Alert.alert(
                    "⚙️ App Settings",
                    "Customize your app experience!\n\nComing Soon Features:\n• 🎨 Theme preferences\n• 🌐 Language settings\n• 📊 Data usage controls\n• 🔒 Privacy settings\n• 👤 Account management\n• 🔔 Notification preferences",
                    [{ text: "Got it! 👍", style: "default" }]
                  )
                }
              >
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.settingIconContainer,
                      { backgroundColor: isDarkMode ? "#8B5CF6" : "#7C3AED" },
                    ]}
                  >
                    <Settings size={18} color="#FFFFFF" />
                  </View>
                  <View>
                    <Text
                      style={[
                        styles.settingText,
                        {
                          color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                          fontSize: 16,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      Advanced Settings
                    </Text>
                    <Text
                      style={[
                        styles.settingDescription,
                        {
                          color: isDarkMode ? "#B8C5D1" : "#5A6C7D",
                          fontSize: 13,
                        },
                      ]}
                    >
                      Privacy, themes & more options
                    </Text>
                  </View>
                </View>
                <ChevronRight
                  size={20}
                  color={isDarkMode ? "#8B5CF6" : "#7C3AED"}
                />
              </TouchableOpacity>
            </View>

            {/* Recent Rides */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDarkMode ? "#1A1A2E" : "#F0FDF4",
                  borderColor: isDarkMode ? "#22C55E" : "#16A34A",
                  borderWidth: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                    fontSize: 20,
                    marginBottom: 20,
                  },
                ]}
              >
                🚗 Recent Rides
              </Text>

              {rideHistory.slice(0, 3).map((ride, index) => (
                <View
                  key={ride.id}
                  style={[
                    styles.rideItem,
                    {
                      backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF",
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      marginBottom:
                        index === rideHistory.slice(0, 3).length - 1 ? 0 : 12,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.rideIcon,
                      {
                        backgroundColor: isDarkMode ? "#22C55E" : "#16A34A",
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                      },
                    ]}
                  >
                    <Car size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.rideDetails}>
                    <Text
                      style={[
                        styles.rideRoute,
                        {
                          color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                          fontSize: 16,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {ride.from} → {ride.to}
                    </Text>
                    <View style={styles.rideInfo}>
                      <Text
                        style={[
                          styles.rideDate,
                          {
                            color: isDarkMode ? "#B8C5D1" : "#5A6C7D",
                            fontSize: 13,
                            fontWeight: "500",
                          },
                        ]}
                      >
                        📅 {new Date(ride.date).toLocaleDateString()}
                      </Text>
                      <Text
                        style={[
                          styles.rideDriver,
                          {
                            color: isDarkMode ? "#B8C5D1" : "#5A6C7D",
                            fontSize: 13,
                            fontWeight: "500",
                          },
                        ]}
                      >
                        👤 {ride.driver}
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          ride.status === "completed" ? "#22C55E" : "#EF4444",
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { fontSize: 11, fontWeight: "600" },
                      ]}
                    >
                      {ride.status === "completed"
                        ? "✅ Completed"
                        : "❌ Cancelled"}
                    </Text>
                  </View>
                </View>
              ))}

              {rideHistory.length === 0 && (
                <View style={styles.emptyBookings}>
                  <Car size={48} color={isDarkMode ? "#666666" : "#CCCCCC"} />
                  <Text
                    style={[
                      styles.emptyText,
                      { color: isDarkMode ? "#B8C5D1" : "#5A6C7D" },
                    ]}
                  >
                    No rides yet
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtext,
                      { color: isDarkMode ? "#666666" : "#999999" },
                    ]}
                  >
                    Start carpooling to see your rides here
                  </Text>
                </View>
              )}
            </View>

            {/* Logout */}
            <TouchableOpacity
              style={[
                styles.logoutButton,
                {
                  backgroundColor: isDarkMode ? "#DC2626" : "#EF4444",
                  borderRadius: 16,
                  paddingVertical: 18,
                  shadowColor: "#DC2626",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 8,
                  elevation: 6,
                },
              ]}
              onPress={() => {
                console.log("Logout pressed");
                onLogout();
              }}
            >
              <LogOut size={22} color="#FFFFFF" />
              <Text
                style={[styles.logoutText, { fontSize: 17, fontWeight: "700" }]}
              >
                🚪 Logout
              </Text>
            </TouchableOpacity>
          </View>
        ) : activeTab === "safety" ? (
          // Safety Tab
          <View style={styles.content}>
            {/* Emergency SOS */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDarkMode ? "#1A1A2E" : "#FEF2F2",
                  borderColor: isDarkMode ? "#DC2626" : "#EF4444",
                  borderWidth: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                    fontSize: 20,
                    marginBottom: 12,
                  },
                ]}
              >
                🚨 Emergency SOS
              </Text>
              <Text
                style={[
                  styles.cardDescription,
                  {
                    color: isDarkMode ? "#B8C5D1" : "#5A6C7D",
                    fontSize: 15,
                    lineHeight: 22,
                    marginBottom: 20,
                  },
                ]}
              >
                In case of emergency, press the button below to instantly send
                your location and alert to all your emergency contacts. Your
                safety is our priority! 🛡️
              </Text>

              <TouchableOpacity
                style={[
                  styles.sosButton,
                  {
                    shadowColor: "#DC2626",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.4,
                    shadowRadius: 10,
                    elevation: 8,
                    paddingVertical: 18,
                    borderRadius: 16,
                  },
                ]}
                onPress={handleSOS}
              >
                <AlertTriangle size={26} color="#FFFFFF" />
                <Text
                  style={[styles.sosText, { fontSize: 18, fontWeight: "800" }]}
                >
                  Send SOS Alert
                </Text>
              </TouchableOpacity>
            </View>

            {/* Emergency Contacts */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDarkMode ? "#1A1A2E" : "#F0F9FF",
                  borderColor: isDarkMode ? "#3B82F6" : "#2563EB",
                  borderWidth: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                    fontSize: 20,
                    marginBottom: 20,
                  },
                ]}
              >
                📞 Emergency Contacts
              </Text>

              {emergencyContacts.map((contact, index) => (
                <View
                  key={contact.id}
                  style={[
                    styles.contactItem,
                    {
                      backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF",
                      borderRadius: 12,
                      paddingHorizontal: 16,
                      paddingVertical: 14,
                      marginBottom:
                        index === emergencyContacts.length - 1 ? 0 : 12,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.contactIcon,
                      {
                        backgroundColor: isDarkMode ? "#3B82F6" : "#2563EB",
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                      },
                    ]}
                  >
                    <Phone size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.contactDetails}>
                    <Text
                      style={[
                        styles.contactName,
                        {
                          color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                          fontSize: 16,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {contact.name}
                    </Text>
                    <Text
                      style={[
                        styles.contactRelation,
                        {
                          color: isDarkMode ? "#B8C5D1" : "#5A6C7D",
                          fontSize: 13,
                          fontWeight: "500",
                        },
                      ]}
                    >
                      👥 {contact.relation} • 📱 {contact.phone}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.callButton,
                      { backgroundColor: isDarkMode ? "#00AA00" : "#00AA00" },
                    ]}
                    onPress={() => {
                      console.log(
                        `Calling emergency contact: ${contact.name} - ${contact.phone}`
                      );
                      // TODO: Implement actual call functionality
                    }}
                  >
                    <Phone size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}

              <TouchableOpacity
                style={[
                  styles.addContactButton,
                  { borderColor: isDarkMode ? "#333333" : "#E0E0E0" },
                ]}
                onPress={() => {
                  console.log("Add emergency contact pressed");
                  // TODO: Navigate to add contact screen
                }}
              >
                <Text
                  style={[
                    styles.addContactText,
                    { color: isDarkMode ? "#CCCCCC" : "#666666" },
                  ]}
                >
                  + Add Emergency Contact
                </Text>
              </TouchableOpacity>
            </View>

            {/* Safety Settings */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDarkMode ? "#1A1A1A" : "#FFFFFF",
                  borderColor: isDarkMode ? "#333333" : "#E0E0E0",
                },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                Safety Settings
              </Text>

              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <MapPin
                    size={20}
                    color={isDarkMode ? "#CCCCCC" : "#666666"}
                  />
                  <View>
                    <Text
                      style={[
                        styles.settingText,
                        { color: isDarkMode ? "#FFFFFF" : "#000000" },
                      ]}
                    >
                      Location Sharing
                    </Text>
                    <Text
                      style={[
                        styles.settingDescription,
                        { color: isDarkMode ? "#CCCCCC" : "#666666" },
                      ]}
                    >
                      Share your location during rides
                    </Text>
                  </View>
                </View>
                <Switch
                  value={locationSharing}
                  onValueChange={setLocationSharing}
                  trackColor={{
                    false: isDarkMode ? "#333333" : "#E0E0E0",
                    true: isDarkMode ? "#666666" : "#000000",
                  }}
                  thumbColor={
                    locationSharing
                      ? isDarkMode
                        ? "#FFFFFF"
                        : "#FFFFFF"
                      : isDarkMode
                      ? "#CCCCCC"
                      : "#CCCCCC"
                  }
                />
              </View>
            </View>
          </View>
        ) : (
          // Bookings Tab
          <View style={styles.content}>
            {/* Active Bus Bookings */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDarkMode ? "#1A1A2E" : "#FFF7ED",
                  borderColor: isDarkMode ? "#F97316" : "#EA580C",
                  borderWidth: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                    fontSize: 20,
                    marginBottom: 20,
                  },
                ]}
              >
                🚌 Active Bus Bookings
              </Text>

              {busBookings.filter((booking) => booking.status === "active")
                .length > 0 ? (
                busBookings
                  .filter((booking) => booking.status === "active")
                  .map((booking, index) => (
                    <View
                      key={booking.id}
                      style={[
                        styles.bookingItem,
                        {
                          backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF",
                          borderRadius: 12,
                          paddingHorizontal: 16,
                          paddingVertical: 16,
                          marginBottom:
                            index ===
                            busBookings.filter((b) => b.status === "active")
                              .length -
                              1
                              ? 0
                              : 12,
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.1,
                          shadowRadius: 4,
                          elevation: 3,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.bookingIcon,
                          {
                            backgroundColor: isDarkMode ? "#F97316" : "#EA580C",
                            width: 48,
                            height: 48,
                            borderRadius: 24,
                          },
                        ]}
                      >
                        <Bus size={22} color="#FFFFFF" />
                      </View>
                      <View style={styles.bookingDetails}>
                        <Text
                          style={[
                            styles.bookingRoute,
                            {
                              color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                              fontSize: 16,
                              fontWeight: "700",
                              marginBottom: 4,
                            },
                          ]}
                        >
                          {booking.busRoute}
                        </Text>
                        <View
                          style={[
                            styles.bookingInfo,
                            {
                              flexDirection: "column",
                              alignItems: "flex-start",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.bookingTime,
                              {
                                color: isDarkMode ? "#B8C5D1" : "#5A6C7D",
                                fontSize: 14,
                                fontWeight: "500",
                                marginBottom: 2,
                              },
                            ]}
                          >
                            🪑 Seat {booking.seatNumber}
                          </Text>
                          <Text
                            style={[
                              styles.bookingTime,
                              {
                                color: isDarkMode ? "#B8C5D1" : "#5A6C7D",
                                fontSize: 14,
                                fontWeight: "500",
                              },
                            ]}
                          >
                            🕐 Departure: {booking.departureTime}
                          </Text>
                        </View>
                      </View>
                      <View style={{ alignItems: "flex-end" }}>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor: "#22C55E",
                              paddingHorizontal: 10,
                              paddingVertical: 6,
                              borderRadius: 12,
                              marginBottom: 8,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              { fontSize: 11, fontWeight: "600" },
                            ]}
                          >
                            ✅ Active
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.bookingTime,
                            {
                              color: isDarkMode ? "#9CA3AF" : "#6B7280",
                              fontSize: 12,
                              fontWeight: "500",
                            },
                          ]}
                        >
                          📅{" "}
                          {new Date(booking.bookingTime).toLocaleDateString()}
                        </Text>
                      </View>
                    </View>
                  ))
              ) : (
                <View style={styles.emptyBookings}>
                  <Bus size={48} color={isDarkMode ? "#666666" : "#CCCCCC"} />
                  <Text
                    style={[
                      styles.emptyText,
                      { color: isDarkMode ? "#CCCCCC" : "#666666" },
                    ]}
                  >
                    No active bus bookings
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtext,
                      { color: isDarkMode ? "#666666" : "#999999" },
                    ]}
                  >
                    Book a bus to see your bookings here
                  </Text>
                </View>
              )}
            </View>

            {/* Expired/Past Bookings */}
            {busBookings.filter(
              (booking) =>
                booking.status === "expired" || booking.status === "completed"
            ).length > 0 && (
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: isDarkMode ? "#1A1A2E" : "#F8FAFC",
                    borderColor: isDarkMode ? "#6B7280" : "#9CA3AF",
                    borderWidth: 2,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.cardTitle,
                    {
                      color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                      fontSize: 20,
                      marginBottom: 20,
                    },
                  ]}
                >
                  📜 Past Bookings
                </Text>

                {busBookings
                  .filter(
                    (booking) =>
                      booking.status === "expired" ||
                      booking.status === "completed"
                  )
                  .map((booking) => (
                    <View
                      key={booking.id}
                      style={[styles.bookingItem, { opacity: 0.6 }]}
                    >
                      <View
                        style={[
                          styles.bookingIcon,
                          {
                            backgroundColor:
                              booking.status === "expired"
                                ? "#EF4444"
                                : "#6B7280",
                          },
                        ]}
                      >
                        <Bus size={16} color="#FFFFFF" />
                      </View>
                      <View style={styles.bookingDetails}>
                        <Text
                          style={[
                            styles.bookingRoute,
                            { color: isDarkMode ? "#CCCCCC" : "#666666" },
                          ]}
                        >
                          {booking.busRoute}
                        </Text>
                        <View style={styles.bookingInfo}>
                          <Text
                            style={[
                              styles.bookingTime,
                              { color: isDarkMode ? "#666666" : "#999999" },
                            ]}
                          >
                            Seat {booking.seatNumber} • {booking.departureTime}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor:
                              booking.status === "expired"
                                ? "#EF4444"
                                : "#6B7280",
                          },
                        ]}
                      >
                        <Text style={styles.statusText}>
                          {booking.status === "expired"
                            ? "Expired"
                            : "Completed"}
                        </Text>
                      </View>
                    </View>
                  ))}
              </View>
            )}

            {/* Booking History Stats */}
            <View
              style={[
                styles.card,
                {
                  backgroundColor: isDarkMode ? "#1A1A2E" : "#F3E8FF",
                  borderColor: isDarkMode ? "#A855F7" : "#9333EA",
                  borderWidth: 2,
                },
              ]}
            >
              <Text
                style={[
                  styles.cardTitle,
                  {
                    color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                    fontSize: 20,
                    marginBottom: 20,
                  },
                ]}
              >
                📊 Booking Statistics
              </Text>

              {/* Enhanced Analytics Grid */}
              <View style={styles.analyticsGrid}>
                {/* Total Bookings */}
                <View
                  style={[
                    styles.analyticsCard,
                    {
                      backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF",
                      borderLeftColor: isDarkMode ? "#A855F7" : "#9333EA",
                    },
                  ]}
                >
                  <View style={styles.analyticsHeader}>
                    <View
                      style={[
                        styles.analyticsIcon,
                        { backgroundColor: isDarkMode ? "#A855F7" : "#9333EA" },
                      ]}
                    >
                      <Text style={styles.analyticsEmoji}>📊</Text>
                    </View>
                    <Text
                      style={[
                        styles.analyticsNumber,
                        { color: isDarkMode ? "#A855F7" : "#9333EA" },
                      ]}
                    >
                      {busBookings.length}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.analyticsLabel,
                      { color: isDarkMode ? "#B8C5D1" : "#5A6C7D" },
                    ]}
                  >
                    Total Bookings
                  </Text>
                  <Text
                    style={[
                      styles.analyticsSubtext,
                      { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    All time bookings
                  </Text>
                </View>

                {/* Active Bookings */}
                <View
                  style={[
                    styles.analyticsCard,
                    {
                      backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF",
                      borderLeftColor: isDarkMode ? "#22C55E" : "#16A34A",
                    },
                  ]}
                >
                  <View style={styles.analyticsHeader}>
                    <View
                      style={[
                        styles.analyticsIcon,
                        { backgroundColor: isDarkMode ? "#22C55E" : "#16A34A" },
                      ]}
                    >
                      <Text style={styles.analyticsEmoji}>🎫</Text>
                    </View>
                    <Text
                      style={[
                        styles.analyticsNumber,
                        { color: isDarkMode ? "#22C55E" : "#16A34A" },
                      ]}
                    >
                      {busBookings.filter((b) => b.status === "active").length}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.analyticsLabel,
                      { color: isDarkMode ? "#B8C5D1" : "#5A6C7D" },
                    ]}
                  >
                    Active Bookings
                  </Text>
                  <Text
                    style={[
                      styles.analyticsSubtext,
                      { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    Ready to travel
                  </Text>
                </View>

                {/* Completed Journeys */}
                <View
                  style={[
                    styles.analyticsCard,
                    {
                      backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF",
                      borderLeftColor: isDarkMode ? "#3B82F6" : "#2563EB",
                    },
                  ]}
                >
                  <View style={styles.analyticsHeader}>
                    <View
                      style={[
                        styles.analyticsIcon,
                        { backgroundColor: isDarkMode ? "#3B82F6" : "#2563EB" },
                      ]}
                    >
                      <Text style={styles.analyticsEmoji}>🏆</Text>
                    </View>
                    <Text
                      style={[
                        styles.analyticsNumber,
                        { color: isDarkMode ? "#3B82F6" : "#2563EB" },
                      ]}
                    >
                      {
                        busBookings.filter((b) => b.status === "completed")
                          .length
                      }
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.analyticsLabel,
                      { color: isDarkMode ? "#B8C5D1" : "#5A6C7D" },
                    ]}
                  >
                    Completed
                  </Text>
                  <Text
                    style={[
                      styles.analyticsSubtext,
                      { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    Successful trips
                  </Text>
                </View>

                {/* Most Used Route */}
                <View
                  style={[
                    styles.analyticsCard,
                    {
                      backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF",
                      borderLeftColor: isDarkMode ? "#F97316" : "#EA580C",
                    },
                  ]}
                >
                  <View style={styles.analyticsHeader}>
                    <View
                      style={[
                        styles.analyticsIcon,
                        { backgroundColor: isDarkMode ? "#F97316" : "#EA580C" },
                      ]}
                    >
                      <Text style={styles.analyticsEmoji}>🚌</Text>
                    </View>
                    <Text
                      style={[
                        styles.analyticsNumber,
                        {
                          color: isDarkMode ? "#F97316" : "#EA580C",
                          fontSize: 14,
                          fontWeight: "600",
                        },
                      ]}
                    >
                      {busBookings.length > 0
                        ? busBookings.reduce((acc, booking) => {
                            acc[booking.busRoute] =
                              (acc[booking.busRoute] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)[
                            Object.keys(
                              busBookings.reduce((acc, booking) => {
                                acc[booking.busRoute] =
                                  (acc[booking.busRoute] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)
                            ).reduce((a, b) =>
                              busBookings.reduce((acc, booking) => {
                                acc[booking.busRoute] =
                                  (acc[booking.busRoute] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)[a] >
                              busBookings.reduce((acc, booking) => {
                                acc[booking.busRoute] =
                                  (acc[booking.busRoute] || 0) + 1;
                                return acc;
                              }, {} as Record<string, number>)[b]
                                ? a
                                : b
                            )
                          ] || 0
                        : 0}
                      x
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.analyticsLabel,
                      { color: isDarkMode ? "#B8C5D1" : "#5A6C7D" },
                    ]}
                  >
                    Favorite Route
                  </Text>
                  <Text
                    style={[
                      styles.analyticsSubtext,
                      { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    {busBookings.length > 0
                      ? Object.keys(
                          busBookings.reduce((acc, booking) => {
                            acc[booking.busRoute] =
                              (acc[booking.busRoute] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        )
                          .reduce((a, b) =>
                            busBookings.reduce((acc, booking) => {
                              acc[booking.busRoute] =
                                (acc[booking.busRoute] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)[a] >
                            busBookings.reduce((acc, booking) => {
                              acc[booking.busRoute] =
                                (acc[booking.busRoute] || 0) + 1;
                              return acc;
                            }, {} as Record<string, number>)[b]
                              ? a
                              : b
                          )
                          .split(" to ")[0]
                      : "No routes"}
                  </Text>
                </View>
              </View>

              {/* Quick Insights */}
              <View
                style={[
                  styles.insightsContainer,
                  { backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF" },
                ]}
              >
                <Text
                  style={[
                    styles.insightsTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#1A1A2E" },
                  ]}
                >
                  📈 Quick Insights
                </Text>
                <View style={styles.insightsList}>
                  <View style={styles.insightItem}>
                    <Text style={styles.insightEmoji}>🕒</Text>
                    <Text
                      style={[
                        styles.insightText,
                        { color: isDarkMode ? "#B8C5D1" : "#5A6C7D" },
                      ]}
                    >
                      Most bookings in Morning hours
                    </Text>
                  </View>
                  <View style={styles.insightItem}>
                    <Text style={styles.insightEmoji}>📅</Text>
                    <Text
                      style={[
                        styles.insightText,
                        { color: isDarkMode ? "#B8C5D1" : "#5A6C7D" },
                      ]}
                    >
                      Last booking:{" "}
                      {busBookings.length > 0
                        ? new Date(
                            Math.max(
                              ...busBookings.map((b) => b.bookingTime.getTime())
                            )
                          ).toLocaleDateString()
                        : "No bookings yet"}
                    </Text>
                  </View>
                  <View style={styles.insightItem}>
                    <Text style={styles.insightEmoji}>⭐</Text>
                    <Text
                      style={[
                        styles.insightText,
                        { color: isDarkMode ? "#B8C5D1" : "#5A6C7D" },
                      ]}
                    >
                      {busBookings.filter((b) => b.status === "active").length >
                      0
                        ? `${
                            busBookings.filter((b) => b.status === "active")
                              .length
                          } upcoming journey${
                            busBookings.filter((b) => b.status === "active")
                              .length > 1
                              ? "s"
                              : ""
                          }`
                        : "No upcoming journeys"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "800",
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  activeTab: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  cardDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  userHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stars: {
    flexDirection: "row",
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  userDetails: {
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailIconContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  settingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  rideItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  rideIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  rideDetails: {
    flex: 1,
  },
  rideRoute: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  rideInfo: {
    flexDirection: "row",
    gap: 8,
  },
  rideDate: {
    fontSize: 12,
  },
  rideDriver: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
    textTransform: "capitalize",
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  sosButton: {
    backgroundColor: "#FF0000",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  sosText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  contactIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  contactRelation: {
    fontSize: 12,
  },
  callButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  addContactButton: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  addContactText: {
    fontSize: 14,
    fontWeight: "500",
  },
  // Bookings styles
  bookingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  bookingIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  bookingDetails: {
    flex: 1,
  },
  bookingRoute: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  bookingInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  bookingTime: {
    fontSize: 12,
    flex: 1,
  },
  bookingPrice: {
    fontSize: 12,
    fontWeight: "600",
  },
  emptyBookings: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    marginTop: 12,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 4,
    textAlign: "center",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: "center",
  },
  // Enhanced Analytics Styles
  analyticsGrid: {
    gap: 16,
  },
  analyticsCard: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  analyticsHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  analyticsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  analyticsEmoji: {
    fontSize: 16,
  },
  analyticsNumber: {
    fontSize: 28,
    fontWeight: "800",
  },
  analyticsLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  analyticsSubtext: {
    fontSize: 13,
    fontWeight: "500",
  },
  insightsContainer: {
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  insightsTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  insightsList: {
    gap: 8,
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  insightEmoji: {
    fontSize: 16,
    marginRight: 12,
    width: 24,
    textAlign: "center",
  },
  insightText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
});

export default UserProfileSafety;
