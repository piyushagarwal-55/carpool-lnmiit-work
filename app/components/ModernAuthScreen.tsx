import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  User,
  Phone,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from "react-native-reanimated";

import Button from "./ui/Button";
import Input from "./ui/Input";
import { supabase } from "../lib/supabase";

const { width, height } = Dimensions.get("window");

interface ModernAuthScreenProps {
  onAuthenticated: (
    email: string,
    password: string,
    role: "driver" | "passenger" | "external_driver"
  ) => void;
  isDarkMode?: boolean;
}

const ModernAuthScreen: React.FC<ModernAuthScreenProps> = ({
  onAuthenticated,
  isDarkMode = false,
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedRole, setSelectedRole] = useState<
    "driver" | "passenger" | "external_driver"
  >("passenger");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);

  const containerOpacity = useSharedValue(0);
  const headerScale = useSharedValue(0.8);
  const formTranslateY = useSharedValue(50);

  useEffect(() => {
    containerOpacity.value = withTiming(1, { duration: 600 });
    headerScale.value = withSequence(
      withTiming(1.05, { duration: 400, easing: Easing.out(Easing.back(1.2)) }),
      withTiming(1, { duration: 200 })
    );
    formTranslateY.value = withDelay(
      200,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })
    );
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: headerScale.value }],
  }));

  const formAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: formTranslateY.value }],
  }));

  const validateEmail = (email: string) => {
    const emailRegex = /^\d{2}u[a-z]{2}\d{3}@lnmiit\.ac\.in$/i;
    return emailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleSubmit = async () => {
    setEmailError("");
    setPasswordError("");

    if (!email) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError(
        "Invalid LNMIIT email format. Example: 24uec092@lnmiit.ac.in"
      );
      return;
    }

    if (!password) {
      setPasswordError("Password is required");
      return;
    }

    if (!validatePassword(password)) {
      setPasswordError("Password must be at least 6 characters");
      return;
    }

    if (!isLogin) {
      if (!name.trim()) {
        Alert.alert("Error", "Name is required");
        return;
      }
      if (!phone.trim()) {
        Alert.alert("Error", "Phone number is required");
        return;
      }
      if (password !== confirmPassword) {
        setPasswordError("Passwords do not match");
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          Alert.alert("Login Error", error.message);
          return;
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              phone: phone,
              role: selectedRole,
            },
          },
        });

        if (error) {
          Alert.alert("Signup Error", error.message);
          return;
        }
      }

      onAuthenticated(email, password, selectedRole);
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={styles.backgroundPattern}>
        <View style={styles.circle1} />
        <View style={styles.circle2} />
        <View style={styles.circle3} />
      </View>

      <Animated.View style={[styles.content, containerAnimatedStyle]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[styles.header, headerAnimatedStyle]}>
              <View style={styles.modernLogoContainer}>
                <LinearGradient
                  colors={["#667eea", "#764ba2"]}
                  style={styles.logoGradient}
                >
                  <Text style={styles.logoText}>🚗</Text>
                </LinearGradient>
                <View style={styles.logoShadow} />
              </View>

              <Text style={styles.title}>
                {isLogin ? "Welcome Back!" : "Join LNMIIT Carpool"}
              </Text>
              <Text style={styles.subtitle}>
                {isLogin
                  ? "Sign in to continue your carpooling journey"
                  : "Create your account and start sharing rides"}
              </Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.form,
                formAnimatedStyle,
                {
                  backgroundColor: "#fff",
                  borderRadius: 20,
                  padding: 24,
                  borderWidth: 1,
                  borderColor: "#e2e8f0",
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.1,
                  shadowRadius: 24,
                  elevation: 8,
                },
              ]}
            >
              {!isLogin && (
                <Input
                  label="Full Name"
                  value={name}
                  onChangeText={setName}
                  leftIcon={<User size={20} color="#64748b" />}
                  placeholder="Enter your full name"
                  autoCapitalize="words"
                />
              )}

              <Input
                label="LNMIIT Email"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setEmailError("");
                }}
                error={emailError}
                leftIcon={<Mail size={20} color="#64748b" />}
                placeholder="24uec092@lnmiit.ac.in"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              {!isLogin && (
                <Input
                  label="Phone Number"
                  value={phone}
                  onChangeText={setPhone}
                  leftIcon={<Phone size={20} color="#64748b" />}
                  placeholder="Enter your phone number"
                  keyboardType="phone-pad"
                />
              )}

              <Input
                label="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setPasswordError("");
                }}
                error={passwordError}
                secureTextEntry={!showPassword}
                leftIcon={<Lock size={20} color="#64748b" />}
                rightIcon={
                  showPassword ? (
                    <EyeOff size={20} color="#64748b" />
                  ) : (
                    <Eye size={20} color="#64748b" />
                  )
                }
                onRightIconPress={() => setShowPassword(!showPassword)}
                placeholder="Enter your password"
              />

              {!isLogin && (
                <Input
                  label="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  leftIcon={<Lock size={20} color="#64748b" />}
                  rightIcon={
                    showConfirmPassword ? (
                      <EyeOff size={20} color="#64748b" />
                    ) : (
                      <Eye size={20} color="#64748b" />
                    )
                  }
                  onRightIconPress={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  placeholder="Confirm your password"
                />
              )}

              {!isLogin && (
                <View>
                  <Text style={{ fontWeight: "bold", marginBottom: 8 }}>
                    I want to
                  </Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                    <Button
                      title="🧳 Find Rides"
                      onPress={() => setSelectedRole("passenger")}
                      variant={
                        selectedRole === "passenger" ? "primary" : "outline"
                      }
                    />
                    <Button
                      title="🚗 Student Driver"
                      onPress={() => setSelectedRole("driver")}
                      variant={
                        selectedRole === "driver" ? "primary" : "outline"
                      }
                    />
                    <Button
                      title="🚕 Pro Driver"
                      onPress={() => setSelectedRole("external_driver")}
                      variant={
                        selectedRole === "external_driver"
                          ? "primary"
                          : "outline"
                      }
                    />
                  </View>
                </View>
              )}

              <Button
                title={isLogin ? "Sign In" : "Create Account"}
                onPress={handleSubmit}
                loading={loading}
                fullWidth
                size="large"
                rightIcon={!loading && <ArrowRight size={20} color="white" />}
                style={{ marginTop: 16 }}
              />

              <Button
                title={
                  isLogin
                    ? "Don't have an account? Sign up"
                    : "Already have an account? Sign in"
                }
                onPress={() => {
                  setIsLogin(!isLogin);
                  setEmailError("");
                  setPasswordError("");
                }}
                variant="ghost"
                fullWidth
              />
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </SafeAreaView>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundPattern: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  circle1: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#667eea",
    opacity: 0.1,
  },
  circle2: {
    position: "absolute",
    top: 100,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: "#764ba2",
    opacity: 0.08,
  },
  circle3: {
    position: "absolute",
    bottom: -200,
    right: -200,
    width: 500,
    height: 500,
    borderRadius: 250,
    backgroundColor: "#667eea",
    opacity: 0.06,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  modernLogoContainer: {
    position: "relative",
    marginBottom: 32,
    alignItems: "center",
  },
  logoGradient: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  logoShadow: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#667eea",
    opacity: 0.2,
    zIndex: -1,
  },
  logoText: {
    fontSize: 40,
    color: "#ffffff",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
  demoCard: {
    marginBottom: 32,
  },
  demoCardGradient: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: "#6366f120",
  },
  demoTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    textAlign: "center",
  },
  demoSubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  demoButtons: {
    flexDirection: "row",
    justifyContent: "space-around",
    gap: 8,
  },
  form: {
    marginBottom: 20,
  },
  roleSelection: {
    marginBottom: 24,
  },
  roleTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  roleButtons: {
    flexDirection: "row",
    gap: 12,
  },
  roleButton: {
    flex: 1,
  },
  submitButton: {
    marginTop: 16,
    marginBottom: 16,
  },
});

ModernAuthScreen.displayName = "ModernAuthScreen";
export default ModernAuthScreen;
