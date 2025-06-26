import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  StyleSheet,
  View,
  Alert,
  ScrollView,
  TouchableOpacity,
  Image,
  Text,
  SafeAreaView,
  Dimensions,
} from "react-native";
import { Button, Input } from "react-native-elements";
import { Session } from "@supabase/supabase-js";
import { LinearGradient } from "expo-linear-gradient";
import {
  User,
  Mail,
  Globe,
  Edit3,
  Save,
  LogOut,
  Star,
  MapPin,
  Calendar,
  Shield,
  Settings,
  ArrowLeft,
  Phone,
  Camera,
  Award,
  TrendingUp,
  Clock,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

interface AccountProps {
  session: Session;
  onBack?: () => void;
  isDarkMode?: boolean;
}

export default function Account({
  session,
  onBack,
  isDarkMode = false,
}: AccountProps) {
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [website, setWebsite] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const { data, error, status } = await supabase
        .from("profiles")
        .select(`username, website, avatar_url`)
        .eq("id", session?.user.id)
        .single();
      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setUsername(data.username);
        setWebsite(data.website);
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile({
    username,
    website,
    avatar_url,
  }: {
    username: string;
    website: string;
    avatar_url: string;
  }) {
    try {
      setLoading(true);
      if (!session?.user) throw new Error("No user on the session!");

      const updates = {
        id: session?.user.id,
        username,
        website,
        avatar_url,
        updated_at: new Date(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) {
        throw error;
      }

      setIsEditing(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => supabase.auth.signOut(),
      },
    ]);
  };

  const colors = isDarkMode
    ? {
        bg: "#000000",
        cardBg: "#1F2937",
        headerBg: "#111827",
        text: "#FFFFFF",
        subtext: "#9CA3AF",
        border: "#374151",
        accent: "#4CAF50",
      }
    : {
        bg: "#F8FAFC",
        cardBg: "#FFFFFF",
        headerBg: "#FFFFFF",
        text: "#000000",
        subtext: "#6B7280",
        border: "#E5E7EB",
        accent: "#4CAF50",
      };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Modern Header */}
      <View
        style={[
          styles.modernHeader,
          {
            backgroundColor: colors.headerBg,
            borderBottomColor: colors.border,
          },
        ]}
      >
        {onBack && (
          <TouchableOpacity
            style={[
              styles.modernBackButton,
              { backgroundColor: isDarkMode ? "#374151" : "#F3F4F6" },
            ]}
            onPress={onBack}
          >
            <ArrowLeft size={20} color={colors.text} />
          </TouchableOpacity>
        )}

        <View style={styles.modernHeaderContent}>
          <Text style={[styles.modernTitle, { color: colors.text }]}>
            My Profile
          </Text>
          <Text style={[styles.modernSubtitle, { color: colors.subtext }]}>
            Manage your account settings
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.modernEditButton,
            { backgroundColor: isEditing ? colors.accent : colors.border },
          ]}
          onPress={() => setIsEditing(!isEditing)}
        >
          {isEditing ? (
            <Save size={20} color="#FFFFFF" />
          ) : (
            <Edit3 size={20} color={isDarkMode ? "#FFFFFF" : "#6B7280"} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.modernScrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Profile Card with Enhanced Design */}
        <View
          style={[styles.modernProfileCard, { backgroundColor: colors.cardBg }]}
        >
          <LinearGradient
            colors={
              isDarkMode ? ["#1F2937", "#374151"] : ["#E3F2FD", "#BBDEFB"]
            }
            style={styles.profileCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.modernProfileSection}>
              <View style={styles.modernAvatarContainer}>
                <Image
                  source={{
                    uri:
                      avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.email}`,
                  }}
                  style={styles.modernAvatar}
                />
                <View
                  style={[
                    styles.modernOnlineIndicator,
                    { backgroundColor: colors.accent },
                  ]}
                />
                <TouchableOpacity style={styles.cameraButton}>
                  <Camera size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.modernUserInfo}>
                <Text style={[styles.modernUserName, { color: colors.text }]}>
                  {username || "User"}
                </Text>
                <Text
                  style={[styles.modernUserEmail, { color: colors.subtext }]}
                >
                  {session?.user?.email}
                </Text>
                <View style={styles.modernUserBadge}>
                  <Shield size={14} color={colors.accent} />
                  <Text
                    style={[styles.modernBadgeText, { color: colors.accent }]}
                  >
                    Verified Student
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Enhanced Stats Grid */}
        <View style={styles.modernStatsContainer}>
          <View
            style={[styles.modernStatCard, { backgroundColor: colors.cardBg }]}
          >
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "#FFD700" + "20" },
              ]}
            >
              <Star size={24} color="#FFD700" />
            </View>
            <Text style={[styles.modernStatValue, { color: colors.text }]}>
              4.8
            </Text>
            <Text style={[styles.modernStatLabel, { color: colors.subtext }]}>
              Rating
            </Text>
          </View>

          <View
            style={[styles.modernStatCard, { backgroundColor: colors.cardBg }]}
          >
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "#4CAF50" + "20" },
              ]}
            >
              <MapPin size={24} color="#4CAF50" />
            </View>
            <Text style={[styles.modernStatValue, { color: colors.text }]}>
              12
            </Text>
            <Text style={[styles.modernStatLabel, { color: colors.subtext }]}>
              Rides
            </Text>
          </View>

          <View
            style={[styles.modernStatCard, { backgroundColor: colors.cardBg }]}
          >
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "#2196F3" + "20" },
              ]}
            >
              <TrendingUp size={24} color="#2196F3" />
            </View>
            <Text style={[styles.modernStatValue, { color: colors.text }]}>
              95%
            </Text>
            <Text style={[styles.modernStatLabel, { color: colors.subtext }]}>
              Success
            </Text>
          </View>

          <View
            style={[styles.modernStatCard, { backgroundColor: colors.cardBg }]}
          >
            <View
              style={[
                styles.statIconContainer,
                { backgroundColor: "#FF9800" + "20" },
              ]}
            >
              <Clock size={24} color="#FF9800" />
            </View>
            <Text style={[styles.modernStatValue, { color: colors.text }]}>
              6mo
            </Text>
            <Text style={[styles.modernStatLabel, { color: colors.subtext }]}>
              Member
            </Text>
          </View>
        </View>

        {/* Profile Form with Modern Design */}
        <View
          style={[
            styles.modernFormContainer,
            { backgroundColor: colors.cardBg },
          ]}
        >
          <Text style={[styles.modernSectionTitle, { color: colors.text }]}>
            📋 Profile Information
          </Text>

          <View style={styles.modernInputContainer}>
            <View style={styles.modernInputHeader}>
              <View
                style={[
                  styles.inputIconContainer,
                  { backgroundColor: "#E3F2FD" },
                ]}
              >
                <Mail size={20} color="#2196F3" />
              </View>
              <Text style={[styles.modernInputLabel, { color: colors.text }]}>
                Email Address
              </Text>
              <View style={styles.verifiedBadge}>
                <Shield size={12} color="#4CAF50" />
              </View>
            </View>
            <Input
              value={session?.user?.email}
              disabled
              inputStyle={[
                styles.modernDisabledInput,
                { color: colors.subtext },
              ]}
              containerStyle={styles.modernInputWrapper}
              inputContainerStyle={[
                styles.modernInputInnerContainer,
                {
                  borderColor: colors.border,
                  backgroundColor: isDarkMode ? "#374151" : "#F9FAFB",
                },
              ]}
            />
          </View>

          <View style={styles.modernInputContainer}>
            <View style={styles.modernInputHeader}>
              <View
                style={[
                  styles.inputIconContainer,
                  { backgroundColor: "#E8F5E8" },
                ]}
              >
                <User size={20} color="#4CAF50" />
              </View>
              <Text style={[styles.modernInputLabel, { color: colors.text }]}>
                Display Name
              </Text>
            </View>
            <Input
              value={username}
              onChangeText={setUsername}
              disabled={!isEditing}
              placeholder="Enter your display name"
              placeholderTextColor={colors.subtext}
              inputStyle={[
                styles.modernInput,
                { color: colors.text },
                !isEditing && { color: colors.subtext },
              ]}
              containerStyle={styles.modernInputWrapper}
              inputContainerStyle={[
                styles.modernInputInnerContainer,
                {
                  borderColor: isEditing ? colors.accent : colors.border,
                  backgroundColor: isEditing
                    ? isDarkMode
                      ? "#1F2937"
                      : "#FFFFFF"
                    : isDarkMode
                    ? "#374151"
                    : "#F9FAFB",
                },
              ]}
            />
          </View>

          <View style={styles.modernInputContainer}>
            <View style={styles.modernInputHeader}>
              <View
                style={[
                  styles.inputIconContainer,
                  { backgroundColor: "#FFF3E0" },
                ]}
              >
                <Globe size={20} color="#FF9800" />
              </View>
              <Text style={[styles.modernInputLabel, { color: colors.text }]}>
                Website
              </Text>
            </View>
            <Input
              value={website}
              onChangeText={setWebsite}
              disabled={!isEditing}
              placeholder="https://yourwebsite.com"
              placeholderTextColor={colors.subtext}
              inputStyle={[
                styles.modernInput,
                { color: colors.text },
                !isEditing && { color: colors.subtext },
              ]}
              containerStyle={styles.modernInputWrapper}
              inputContainerStyle={[
                styles.modernInputInnerContainer,
                {
                  borderColor: isEditing ? colors.accent : colors.border,
                  backgroundColor: isEditing
                    ? isDarkMode
                      ? "#1F2937"
                      : "#FFFFFF"
                    : isDarkMode
                    ? "#374151"
                    : "#F9FAFB",
                },
              ]}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.modernActionContainer}>
          {isEditing && (
            <TouchableOpacity
              style={[
                styles.modernActionButton,
                { backgroundColor: colors.accent },
              ]}
              onPress={() =>
                updateProfile({ username, website, avatar_url: avatarUrl })
              }
              disabled={loading}
            >
              <Save size={20} color="#FFFFFF" />
              <Text style={styles.modernActionButtonText}>
                {loading ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.modernActionButton,
              {
                backgroundColor: "#F44336",
                marginTop: isEditing ? 12 : 0,
              },
            ]}
            onPress={handleSignOut}
          >
            <LogOut size={20} color="#FFFFFF" />
            <Text style={styles.modernActionButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Achievement Section */}
        <View
          style={[
            styles.achievementSection,
            { backgroundColor: colors.cardBg },
          ]}
        >
          <Text style={[styles.modernSectionTitle, { color: colors.text }]}>
            🏆 Achievements
          </Text>
          <View style={styles.achievementGrid}>
            <View style={styles.achievementItem}>
              <View
                style={[
                  styles.achievementIcon,
                  { backgroundColor: "#FFD700" + "20" },
                ]}
              >
                <Star size={20} color="#FFD700" />
              </View>
              <Text style={[styles.achievementTitle, { color: colors.text }]}>
                Top Rated
              </Text>
              <Text style={[styles.achievementDesc, { color: colors.subtext }]}>
                4.8+ Rating
              </Text>
            </View>

            <View style={styles.achievementItem}>
              <View
                style={[
                  styles.achievementIcon,
                  { backgroundColor: "#4CAF50" + "20" },
                ]}
              >
                <Award size={20} color="#4CAF50" />
              </View>
              <Text style={[styles.achievementTitle, { color: colors.text }]}>
                Reliable
              </Text>
              <Text style={[styles.achievementDesc, { color: colors.subtext }]}>
                12 Rides
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  modernHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modernBackButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  modernHeaderContent: {
    flex: 1,
  },
  modernTitle: {
    fontSize: 24,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  modernSubtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  modernEditButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modernScrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  modernProfileCard: {
    borderRadius: 20,
    marginTop: 20,
    marginBottom: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  profileCardGradient: {
    padding: 24,
  },
  modernProfileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  modernAvatarContainer: {
    position: "relative",
    marginRight: 20,
  },
  modernAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  modernOnlineIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  cameraButton: {
    position: "absolute",
    top: -5,
    right: -5,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2196F3",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  modernUserInfo: {
    flex: 1,
  },
  modernUserName: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
  },
  modernUserEmail: {
    fontSize: 14,
    marginBottom: 8,
  },
  modernUserBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(76, 175, 80, 0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  modernBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  modernStatsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  modernStatCard: {
    flex: 1,
    minWidth: (width - 64) / 2,
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modernStatValue: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  modernStatLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  modernFormContainer: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  modernSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
    letterSpacing: 0.2,
  },
  modernInputContainer: {
    marginBottom: 24,
  },
  modernInputHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  inputIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  modernInputLabel: {
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  verifiedBadge: {
    padding: 4,
    borderRadius: 8,
    backgroundColor: "rgba(76, 175, 80, 0.15)",
  },
  modernInputWrapper: {
    paddingHorizontal: 0,
  },
  modernInputInnerContainer: {
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 50,
  },
  modernInput: {
    fontSize: 16,
    fontWeight: "500",
  },
  modernDisabledInput: {
    fontSize: 16,
    fontWeight: "500",
  },
  modernActionContainer: {
    marginBottom: 24,
  },
  modernActionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  modernActionButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  achievementSection: {
    padding: 24,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  achievementGrid: {
    flexDirection: "row",
    gap: 16,
  },
  achievementItem: {
    flex: 1,
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  achievementIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 12,
    textAlign: "center",
  },
});
