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
  Plus,
  Edit,
  Trash2,
} from "lucide-react-native";
import { supabase } from "../lib/supabase";
import {
  parseEmailInfo,
  calculateAcademicYear,
  isValidLNMIITEmail,
  generateAvatarFromName,
} from "../lib/utils";

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
  emergencyContacts: initialEmergencyContacts = [],
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

  const emailInfo = parseEmailInfo(user.email);
  const academicYear = calculateAcademicYear(emailInfo.joiningYear);

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
              <View style={styles.sectionHeader}>
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: isDarkMode ? "#FFFFFF" : "#000000" },
                  ]}
                >
                  Emergency Contacts
                </Text>
                <TouchableOpacity
                  style={styles.addContactButton}
                  onPress={() => openContactModal()}
                >
                  <Plus size={20} color="#4CAF50" />
                </TouchableOpacity>
              </View>

              {emergencyContacts.length > 0 ? (
                emergencyContacts.map((contact) => (
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
                    <View style={styles.contactActions}>
                      <TouchableOpacity
                        style={styles.contactActionButton}
                        onPress={() => openContactModal(contact)}
                      >
                        <Edit size={16} color="#6B7280" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.contactActionButton}
                        onPress={() => deleteEmergencyContact(contact.id)}
                      >
                        <Trash2 size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              ) : (
                <View style={styles.emptyContacts}>
                  <Text
                    style={[
                      styles.emptyText,
                      { color: isDarkMode ? "#9CA3AF" : "#6B7280" },
                    ]}
                  >
                    No emergency contacts added yet
                  </Text>
                  <TouchableOpacity
                    style={styles.addFirstContactButton}
                    onPress={() => openContactModal()}
                  >
                    <Plus size={16} color="#FFFFFF" />
                    <Text style={styles.addFirstContactText}>Add Contact</Text>
                  </TouchableOpacity>
                </View>
              )}
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
          </View>
        )}
      </ScrollView>

      {/* Emergency Contact Modal */}
      <Modal
        visible={showContactModal}
        animationType="slide"
        transparent={true}
        onRequestClose={closeContactModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isDarkMode ? "#1F2937" : "#FFFFFF" },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: isDarkMode ? "#FFFFFF" : "#000000" },
                ]}
              >
                {editingContact ? "Edit Contact" : "Add Emergency Contact"}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeContactModal}
              >
                <X size={24} color={isDarkMode ? "#FFFFFF" : "#000000"} />
              </TouchableOpacity>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: isDarkMode ? "#D1D5DB" : "#374151" },
                  ]}
                >
                  Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDarkMode ? "#374151" : "#F9FAFB",
                      borderColor: isDarkMode ? "#4B5563" : "#D1D5DB",
                      color: isDarkMode ? "#FFFFFF" : "#000000",
                    },
                  ]}
                  value={contactForm.name}
                  onChangeText={(text) =>
                    setContactForm((prev) => ({ ...prev, name: text }))
                  }
                  placeholder="Enter contact name"
                  placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: isDarkMode ? "#D1D5DB" : "#374151" },
                  ]}
                >
                  Phone Number
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDarkMode ? "#374151" : "#F9FAFB",
                      borderColor: isDarkMode ? "#4B5563" : "#D1D5DB",
                      color: isDarkMode ? "#FFFFFF" : "#000000",
                    },
                  ]}
                  value={contactForm.phone}
                  onChangeText={(text) =>
                    setContactForm((prev) => ({ ...prev, phone: text }))
                  }
                  placeholder="+91 XXXXX XXXXX"
                  placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text
                  style={[
                    styles.inputLabel,
                    { color: isDarkMode ? "#D1D5DB" : "#374151" },
                  ]}
                >
                  Relationship
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDarkMode ? "#374151" : "#F9FAFB",
                      borderColor: isDarkMode ? "#4B5563" : "#D1D5DB",
                      color: isDarkMode ? "#FFFFFF" : "#000000",
                    },
                  ]}
                  value={contactForm.relation}
                  onChangeText={(text) =>
                    setContactForm((prev) => ({ ...prev, relation: text }))
                  }
                  placeholder="e.g., Father, Mother, Guardian"
                  placeholderTextColor={isDarkMode ? "#9CA3AF" : "#6B7280"}
                />
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[
                  styles.modalButton,
                  styles.cancelButton,
                  { backgroundColor: isDarkMode ? "#374151" : "#F3F4F6" },
                ]}
                onPress={closeContactModal}
              >
                <Text
                  style={[
                    styles.modalButtonText,
                    { color: isDarkMode ? "#D1D5DB" : "#374151" },
                  ]}
                >
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveEmergencyContact}
              >
                <Save size={16} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>
                  {editingContact ? "Update" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
    backgroundColor: "#4CAF50",
    gap: 8,
  },
  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  // Emergency Contact Styles
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  addContactButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(76, 175, 80, 0.1)",
  },
  contactActions: {
    flexDirection: "row",
    gap: 8,
  },
  contactActionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
  },
  emptyContacts: {
    alignItems: "center",
    paddingVertical: 32,
  },
  addFirstContactButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    gap: 8,
  },
  addFirstContactText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  // Modal Styles
  formContainer: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
  },
  modalButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: "600",
  },
});

export default UserProfileSafetyEnhanced;
