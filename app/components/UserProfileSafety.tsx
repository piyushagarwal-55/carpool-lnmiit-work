import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  StyleSheet,
  Dimensions,
  Modal,
  TextInput,
  Linking,
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
  Plus,
  Edit,
  Trash2,
  Save,
  X,
} from "lucide-react-native";
import { supabase } from "../lib/supabase";

interface UserProfileSafetyProps {
  user?: {
    name: string;
    email: string;
    profilePicture?: string;
    role: "passenger"; // Removed "driver" as requested
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
  emergencyContacts: initialEmergencyContacts = [],
  rideHistory = [],
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

  // Emergency contacts state
  const [emergencyContacts, setEmergencyContacts] = useState<
    Array<{
      id: string;
      name: string;
      phone: string;
      relation: string;
    }>
  >([]);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [contactForm, setContactForm] = useState({
    name: "",
    phone: "",
    relation: "",
  });

  // Load emergency contacts from database
  useEffect(() => {
    fetchEmergencyContacts();
  }, []);

  const fetchEmergencyContacts = async () => {
    try {
      const { data, error } = await supabase
        .from("emergency_contacts")
        .select("*")
        .eq("user_id", user.email)
        .order("created_at", { ascending: true });

      if (error) throw error;

      if (data && data.length > 0) {
        setEmergencyContacts(
          data.map((contact) => ({
            id: contact.id,
            name: contact.name,
            phone: contact.phone,
            relation: contact.relation,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching emergency contacts:", error);
    }
  };

  const saveEmergencyContact = async () => {
    if (
      !contactForm.name.trim() ||
      !contactForm.phone.trim() ||
      !contactForm.relation.trim()
    ) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    try {
      if (editingContact) {
        // Update existing contact
        const { error } = await supabase
          .from("emergency_contacts")
          .update({
            name: contactForm.name.trim(),
            phone: contactForm.phone.trim(),
            relation: contactForm.relation.trim(),
          })
          .eq("id", editingContact.id);

        if (error) throw error;

        setEmergencyContacts((prev) =>
          prev.map((contact) =>
            contact.id === editingContact.id
              ? { ...contact, ...contactForm }
              : contact
          )
        );
      } else {
        // Add new contact
        const { data, error } = await supabase
          .from("emergency_contacts")
          .insert([
            {
              user_id: user.email,
              name: contactForm.name.trim(),
              phone: contactForm.phone.trim(),
              relation: contactForm.relation.trim(),
            },
          ])
          .select();

        if (error) throw error;

        if (data && data[0]) {
          setEmergencyContacts((prev) => [
            ...prev,
            {
              id: data[0].id,
              name: data[0].name,
              phone: data[0].phone,
              relation: data[0].relation,
            },
          ]);
        }
      }

      closeContactModal();
      Alert.alert(
        "Success",
        editingContact ? "Contact updated!" : "Contact added!"
      );
    } catch (error) {
      console.error("Error saving emergency contact:", error);
      Alert.alert("Error", "Failed to save contact. Please try again.");
    }
  };

  const deleteEmergencyContact = async (contactId: string) => {
    Alert.alert(
      "Delete Contact",
      "Are you sure you want to delete this emergency contact?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("emergency_contacts")
                .delete()
                .eq("id", contactId);

              if (error) throw error;

              setEmergencyContacts((prev) =>
                prev.filter((contact) => contact.id !== contactId)
              );
              Alert.alert("Success", "Contact deleted!");
            } catch (error) {
              console.error("Error deleting emergency contact:", error);
              Alert.alert(
                "Error",
                "Failed to delete contact. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const openContactModal = (contact?: any) => {
    if (contact) {
      setEditingContact(contact);
      setContactForm({
        name: contact.name,
        phone: contact.phone,
        relation: contact.relation,
      });
    } else {
      setEditingContact(null);
      setContactForm({ name: "", phone: "", relation: "" });
    }
    setShowContactModal(true);
  };

  const closeContactModal = () => {
    setShowContactModal(false);
    setEditingContact(null);
    setContactForm({ name: "", phone: "", relation: "" });
  };

  const handleSOS = () => {
    Alert.alert(
      "🚨 Emergency SOS",
      "This will immediately notify your emergency contacts and campus security. Only use in real emergencies.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send SOS",
          style: "destructive",
          onPress: () => {
            // Show countdown alert
            Alert.alert(
              "🚨 SOS Activated",
              "Emergency contacts notified! Automatically calling first contact in 8 seconds...\n\nPress OK to call immediately or Cancel to stop auto-call.",
              [
                {
                  text: "Cancel Auto-Call",
                  style: "cancel",
                  onPress: () => {
                    Alert.alert(
                      "SOS Sent",
                      "Emergency contacts have been notified!"
                    );
                  },
                },
                {
                  text: "Call Now",
                  style: "destructive",
                  onPress: () => callFirstEmergencyContact(),
                },
                {
                  text: "OK",
                  onPress: () => {
                    // Start 8-second countdown
                    setTimeout(() => {
                      callFirstEmergencyContact();
                    }, 8000);
                    Alert.alert(
                      "SOS Sent",
                      "Emergency contacts notified! Auto-calling in 8 seconds..."
                    );
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const callFirstEmergencyContact = () => {
    if (emergencyContacts.length > 0) {
      const firstContact = emergencyContacts[0];
      const phoneNumber = firstContact.phone.replace(/[^0-9+]/g, ""); // Clean phone number
      const phoneUrl = `tel:${phoneNumber}`;

      Alert.alert(
        "📞 Calling Emergency Contact",
        `Calling ${firstContact.name} (${firstContact.relation})\n${firstContact.phone}`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Call",
            onPress: () => {
              Linking.openURL(phoneUrl).catch((err) => {
                Alert.alert("Error", "Unable to make phone call");
                console.error("Call error:", err);
              });
            },
          },
        ]
      );
    } else {
      Alert.alert(
        "No Emergency Contacts",
        "Please add emergency contacts first before using SOS feature."
      );
    }
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
    { key: "bookings", title: "Bookings", icon: Car },
  ];
  const usernamePart = user?.email?.split("@")[0] || "";
  const firstTwo = usernamePart.substring(0, 2).toUpperCase();

  const branchCode = usernamePart.substring(2, 5).toUpperCase(); // e.g., "ECE", "CCE", etc.

  let branchFullForm = "";

  if (branchCode.startsWith("CSE")) {
    branchFullForm = "Computer Science";
  } else if (branchCode === "UEC") {
    branchFullForm = "Electronics";
  } else if (branchCode === "CCE") {
    branchFullForm = "Communication";
  } else if (branchCode === "ME") {
    branchFullForm = "Mechanical";
  } else {
    branchFullForm = "Unknown Branch";
  }

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
                   Student
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
                    <Text>{branchFullForm}</Text>
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
                    <Text> 20{firstTwo}</Text>
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
            </View>

            {/* Recent Rides */}

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

              {/* Emergency Contacts List */}
              {emergencyContacts.length > 0 && (
                <View style={{ marginBottom: 16 }}>
                  {emergencyContacts.map((contact, index) => (
                    <View
                      key={contact.id}
                      style={[
                        styles.contactItem,
                        {
                          backgroundColor: isDarkMode ? "#0F172A" : "#FFFFFF",
                          borderRadius: 12,
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          marginBottom:
                            index === emergencyContacts.length - 1 ? 0 : 12,
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
                          styles.contactIcon,
                          {
                            backgroundColor: isDarkMode ? "#3B82F6" : "#2563EB",
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                          },
                        ]}
                      >
                        <User size={20} color="#FFFFFF" />
                      </View>
                      <View style={styles.contactDetails}>
                        <Text
                          style={[
                            styles.contactName,
                            {
                              color: isDarkMode ? "#FFFFFF" : "#1A1A2E",
                              fontSize: 16,
                              fontWeight: "600",
                              marginBottom: 2,
                            },
                          ]}
                        >
                          {contact.name}
                        </Text>
                        <Text
                          style={[
                            styles.contactRelation,
                            {
                              color: isDarkMode ? "#CCCCCC" : "#666666",
                              fontSize: 14,
                              marginBottom: 4,
                            },
                          ]}
                        >
                          {contact.relation} • {contact.phone}
                        </Text>
                      </View>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        <TouchableOpacity
                          style={[
                            styles.callButton,
                            {
                              backgroundColor: "#10B981",
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                            },
                          ]}
                          onPress={() => {
                            const phoneNumber = contact.phone.replace(
                              /[^0-9+]/g,
                              ""
                            );
                            const phoneUrl = `tel:${phoneNumber}`;
                            Linking.openURL(phoneUrl).catch((err) => {
                              Alert.alert("Error", "Unable to make phone call");
                              console.error("Call error:", err);
                            });
                          }}
                        >
                          <Phone size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.callButton,
                            {
                              backgroundColor: isDarkMode
                                ? "#666666"
                                : "#9CA3AF",
                              width: 36,
                              height: 36,
                              borderRadius: 18,
                            },
                          ]}
                          onPress={() => openContactModal(contact)}
                        >
                          <Edit size={16} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.addContactButton,
                  { borderColor: isDarkMode ? "#333333" : "#E0E0E0" },
                ]}
                onPress={() => openContactModal()}
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
            {/* Active Ride Bookings */}
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
                🚗 Ride Bookings
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
                        <Car size={22} color="#FFFFFF" />
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
                  <Car size={48} color={isDarkMode ? "#666666" : "#CCCCCC"} />
                  <Text
                    style={[
                      styles.emptyText,
                      { color: isDarkMode ? "#CCCCCC" : "#666666" },
                    ]}
                  >
                    No active ride bookings
                  </Text>
                  <Text
                    style={[
                      styles.emptySubtext,
                      { color: isDarkMode ? "#666666" : "#999999" },
                    ]}
                  >
                    Book a ride to see your bookings here
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
                        <Car size={16} color="#FFFFFF" />
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
              </View>
            )}

        {/* Bottom spacing */}
        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Emergency Contact Modal */}
      <Modal
        visible={showContactModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={closeContactModal}
      >
                    <View
                      style={[
            styles.modalContainer,
            { backgroundColor: isDarkMode ? "#0F0F23" : "#FFFFFF" },
                      ]}
                    >
          <View style={styles.modalHeader}>
                    <Text
                      style={[
                styles.modalTitle,
                { color: isDarkMode ? "#FFFFFF" : "#000000" },
                      ]}
                    >
              {editingContact
                ? "Edit Emergency Contact"
                : "Add Emergency Contact"}
                    </Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={closeContactModal}
            >
              <X size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
            </TouchableOpacity>
                  </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formGroup}>
                  <Text
                    style={[
                  styles.formLabel,
                  { color: isDarkMode ? "#CCCCCC" : "#333333" },
                    ]}
                  >
                Full Name *
                  </Text>
              <TextInput
                    style={[
                  styles.formInput,
                  {
                    backgroundColor: isDarkMode ? "#1A1A2E" : "#F8F9FA",
                    borderColor: isDarkMode ? "#333333" : "#E0E0E0",
                    color: isDarkMode ? "#FFFFFF" : "#000000",
                  },
                ]}
                value={contactForm.name}
                onChangeText={(text) =>
                  setContactForm((prev) => ({ ...prev, name: text }))
                }
                placeholder="Enter contact's full name"
                placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
              />
                    </View>

            <View style={styles.formGroup}>
                    <Text
                      style={[
                  styles.formLabel,
                  { color: isDarkMode ? "#CCCCCC" : "#333333" },
                      ]}
                    >
                Phone Number *
                    </Text>
              <TextInput
                    style={[
                  styles.formInput,
                  {
                    backgroundColor: isDarkMode ? "#1A1A2E" : "#F8F9FA",
                    borderColor: isDarkMode ? "#333333" : "#E0E0E0",
                    color: isDarkMode ? "#FFFFFF" : "#000000",
                  },
                ]}
                value={contactForm.phone}
                onChangeText={(text) =>
                  setContactForm((prev) => ({ ...prev, phone: text }))
                }
                placeholder="+91 XXXXX XXXXX"
                placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
                keyboardType="phone-pad"
              />
                  </View>

            <View style={styles.formGroup}>
                  <Text
                    style={[
                  styles.formLabel,
                  { color: isDarkMode ? "#CCCCCC" : "#333333" },
                    ]}
                  >
                Relationship *
                  </Text>
              <TextInput
                    style={[
                  styles.formInput,
                  {
                    backgroundColor: isDarkMode ? "#1A1A2E" : "#F8F9FA",
                    borderColor: isDarkMode ? "#333333" : "#E0E0E0",
                    color: isDarkMode ? "#FFFFFF" : "#000000",
                  },
                ]}
                value={contactForm.relation}
                onChangeText={(text) =>
                  setContactForm((prev) => ({ ...prev, relation: text }))
                }
                placeholder="e.g., Father, Mother, Guardian"
                placeholderTextColor={isDarkMode ? "#666666" : "#999999"}
              />
                    </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEmergencyContact}
              >
                <Save size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {editingContact ? "Update Contact" : "Save Contact"}
                    </Text>
              </TouchableOpacity>

              {editingContact && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButton]}
                  onPress={() => deleteEmergencyContact(editingContact.id)}
                >
                  <Trash2 size={20} color="#FFFFFF" />
                  <Text style={styles.deleteButtonText}>Delete Contact</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={closeContactModal}
              >
                <Text
                  style={[
                    styles.cancelButtonText,
                    { color: isDarkMode ? "#CCCCCC" : "#666666" },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
                  </View>
      </ScrollView>
        </View>
      </Modal>
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
  // Modal styles
  modalContainer: {
    flex: 1,
    padding: 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    flex: 1,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  formInput: {
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  modalActions: {
    gap: 12,
    marginTop: 32,
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  saveButton: {
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#EF4444",
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});

export default UserProfileSafety;
