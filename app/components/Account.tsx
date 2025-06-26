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
} from "lucide-react-native";

export default function Account({ session }: { session: Session }) {
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={["#667eea", "#764ba2"]}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri:
                  avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.email}`,
              }}
              style={styles.avatar}
            />
            <View style={styles.onlineIndicator} />
          </View>

          <View style={styles.userInfo}>
            <Text style={styles.userName}>{username || "User"}</Text>
            <Text style={styles.userEmail}>{session?.user?.email}</Text>
            <View style={styles.userBadge}>
              <Shield size={14} color="#4CAF50" />
              <Text style={styles.badgeText}>Verified</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.editButton}
            onPress={() => setIsEditing(!isEditing)}
          >
            <Edit3 size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Star size={24} color="#FFD700" />
          <Text style={styles.statValue}>4.8</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>

        <View style={styles.statCard}>
          <MapPin size={24} color="#4CAF50" />
          <Text style={styles.statValue}>12</Text>
          <Text style={styles.statLabel}>Rides</Text>
        </View>

        <View style={styles.statCard}>
          <Calendar size={24} color="#2196F3" />
          <Text style={styles.statValue}>6</Text>
          <Text style={styles.statLabel}>Months</Text>
        </View>
      </View>

      {/* Profile Form */}
      <View style={styles.formContainer}>
        <Text style={styles.sectionTitle}>Profile Information</Text>

        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Mail size={20} color="#666" />
            <Text style={styles.inputLabel}>Email Address</Text>
          </View>
          <Input
            value={session?.user?.email}
            disabled
            inputStyle={styles.disabledInput}
            containerStyle={styles.inputWrapper}
            inputContainerStyle={styles.inputInnerContainer}
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <User size={20} color="#666" />
            <Text style={styles.inputLabel}>Username</Text>
          </View>
          <Input
            value={username || ""}
            onChangeText={(text) => setUsername(text)}
            disabled={!isEditing}
            placeholder="Enter your username"
            inputStyle={[styles.inputStyle, !isEditing && styles.disabledInput]}
            containerStyle={styles.inputWrapper}
            inputContainerStyle={styles.inputInnerContainer}
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Globe size={20} color="#666" />
            <Text style={styles.inputLabel}>Website</Text>
          </View>
          <Input
            value={website || ""}
            onChangeText={(text) => setWebsite(text)}
            disabled={!isEditing}
            placeholder="Enter your website URL"
            inputStyle={[styles.inputStyle, !isEditing && styles.disabledInput]}
            containerStyle={styles.inputWrapper}
            inputContainerStyle={styles.inputInnerContainer}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {isEditing ? (
            <TouchableOpacity
              style={[styles.actionButton, styles.saveButton]}
              onPress={() =>
                updateProfile({ username, website, avatar_url: avatarUrl })
              }
              disabled={loading}
            >
              <Save size={20} color="#FFF" />
              <Text style={styles.buttonText}>
                {loading ? "Saving..." : "Save Changes"}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionButton, styles.editActionButton]}
              onPress={() => setIsEditing(true)}
            >
              <Edit3 size={20} color="#FFF" />
              <Text style={styles.buttonText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Settings Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>

          <TouchableOpacity style={styles.settingsItem}>
            <Settings size={20} color="#666" />
            <Text style={styles.settingsText}>Privacy Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsItem}>
            <Shield size={20} color="#666" />
            <Text style={styles.settingsText}>Security</Text>
          </TouchableOpacity>
        </View>

        {/* Sign Out Button */}
        <TouchableOpacity
          style={[styles.actionButton, styles.signOutButton]}
          onPress={handleSignOut}
        >
          <LogOut size={20} color="#FFF" />
          <Text style={styles.buttonText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F7FA",
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: "#FFF",
  },
  onlineIndicator: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4CAF50",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  userInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 8,
  },
  userBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  badgeText: {
    color: "#FFF",
    fontSize: 12,
    marginLeft: 4,
    fontWeight: "600",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginTop: -20,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    marginTop: 4,
  },
  formContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginLeft: 8,
  },
  inputWrapper: {
    paddingHorizontal: 0,
  },
  inputInnerContainer: {
    borderBottomWidth: 0,
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#E1E5E9",
  },
  inputStyle: {
    fontSize: 16,
    color: "#333",
  },
  disabledInput: {
    color: "#999",
  },
  buttonContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  saveButton: {
    backgroundColor: "#4CAF50",
  },
  editActionButton: {
    backgroundColor: "#2196F3",
  },
  signOutButton: {
    backgroundColor: "#F44336",
    marginTop: 20,
  },
  buttonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  settingsSection: {
    marginTop: 20,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E1E5E9",
  },
  settingsText: {
    fontSize: 16,
    color: "#333",
    marginLeft: 12,
  },
});
