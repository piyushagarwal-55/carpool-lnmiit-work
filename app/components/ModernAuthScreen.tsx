import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { Eye, EyeOff, ArrowRight } from "lucide-react-native";

import Input from "./ui/Input";
import Button from "./ui/Button";
import supabase from "../lib/supabase";

const { width } = Dimensions.get("window");

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
  // Form State
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [selectedRole] = useState<"driver" | "passenger" | "external_driver">(
    "passenger"
  );

  // UI State
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  // Validation State
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Animations
  const containerOpacity = useSharedValue(0);
  const containerTranslateY = useSharedValue(50);
  const titleScale = useSharedValue(0.8);

  useEffect(() => {
    containerOpacity.value = withSpring(1, { damping: 15 });
    containerTranslateY.value = withSpring(0, { damping: 15 });
    titleScale.value = withSpring(1, { damping: 12 });
  }, []);

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
    transform: [{ translateY: containerTranslateY.value }],
  }));

  const titleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: titleScale.value }],
  }));

  const validateEmail = (email: string) => {
    const lnmiitEmailRegex = /^\d{2}u[a-z]{2}\d{3}@lnmiit\.ac\.in$/i;
    return lnmiitEmailRegex.test(email);
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const extractBranchFromEmail = (email: string) => {
    const match = email.match(/^\d{2}u([a-z]{2})\d{3}@lnmiit\.ac\.in$/i);
    if (!match) return "Unknown";

    const branchCode = match[1].toUpperCase();
    const branchMap: { [key: string]: string } = {
      CS: "Computer Science",
      EC: "Electronics & Communication",
      ME: "Mechanical Engineering",
      CE: "Civil Engineering",
      EE: "Electrical Engineering",
      CH: "Chemical Engineering",
      CC: "Computer Communication",
      MM: "Materials & Metallurgy",
    };

    return branchMap[branchCode] || "Unknown";
  };

  const extractYearFromEmail = (email: string) => {
    const match = email.match(/^(\d{2})u[a-z]{2}\d{3}@lnmiit\.ac\.in$/i);
    if (!match) return "Unknown";

    const yearCode = parseInt(match[1]);
    const currentYear = new Date().getFullYear();
    const currentYearCode = currentYear % 100;

    // Calculate academic year
    if (yearCode <= currentYearCode) {
      const yearDiff = currentYearCode - yearCode;
      if (yearDiff === 0) return "1st Year";
      if (yearDiff === 1) return "2nd Year";
      if (yearDiff === 2) return "3rd Year";
      if (yearDiff === 3) return "4th Year";
    }

    return "Unknown";
  };

  const handleSubmit = async () => {
    setEmailError("");
    setPasswordError("");

    if (!validateEmail(email)) {
      setEmailError("Please enter a valid LNMIIT email.");
      return;
    }

    if (!validatePassword(password)) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      setPasswordError("Passwords don't match");
      return;
    }

    if (!isLogin && !name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return;
    }

    setLoading(true);

    try {
      if (!isLogin) {
        // SIGN UP WITH EMAIL CONFIRMATION
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              name,
              role: selectedRole,
              full_name: name,
              branch: extractBranchFromEmail(email),
              year: extractYearFromEmail(email),
            },
            emailRedirectTo: "https://lnmiit-carpool.app/auth/callback", // This would be your app's deep link
          },
        });

        if (error) {
          if (error.message.includes("User already registered")) {
            setEmailError("A user with this email already exists.");
          } else {
            Alert.alert("Signup Error", error.message);
          }
          return;
        }

        if (data.user && !data.session) {
          // Email confirmation required
          setUserEmail(email);
          setEmailSent(true);
          return;
        }
      } else {
        // LOGIN
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes("Email not confirmed")) {
            Alert.alert(
              "Email Not Confirmed",
              "Please check your email and click the confirmation link before signing in."
            );
          } else {
            Alert.alert("Login Error", error.message);
          }
          return;
        }
      }

      onAuthenticated(email, password, selectedRole);
    } catch (err) {
      Alert.alert("Error", "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.gradient}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View style={[styles.content, containerAnimatedStyle]}>
              {emailSent ? (
                // Email Confirmation Screen
                <View style={styles.confirmationContainer}>
                  <View style={styles.confirmationIcon}>
                    <Text style={styles.confirmationEmoji}>📧</Text>
                  </View>

                  <Text style={styles.confirmationTitle}>Check Your Email</Text>
                  <Text style={styles.confirmationSubtitle}>
                    We've sent a confirmation link to:
                  </Text>
                  <Text style={styles.confirmationEmail}>{userEmail}</Text>

                  <View style={styles.confirmationSteps}>
                    <Text style={styles.confirmationStepsTitle}>
                      Next steps:
                    </Text>
                    <Text style={styles.confirmationStep}>
                      1. Check your email inbox
                    </Text>
                    <Text style={styles.confirmationStep}>
                      2. Click the confirmation link
                    </Text>
                    <Text style={styles.confirmationStep}>
                      3. Return to the app to sign in
                    </Text>
                  </View>

                  <Button
                    title="Back to Sign In"
                    onPress={() => {
                      setEmailSent(false);
                      setIsLogin(true);
                      setEmail("");
                      setPassword("");
                      setConfirmPassword("");
                      setName("");
                    }}
                    style={styles.backToSignInButton}
                  />

                  <TouchableOpacity
                    style={styles.resendButton}
                    onPress={async () => {
                      setLoading(true);
                      try {
                        await supabase.auth.resend({
                          type: "signup",
                          email: userEmail,
                          options: {
                            emailRedirectTo:
                              "https://lnmiit-carpool.app/auth/callback",
                          },
                        });
                        Alert.alert(
                          "Email Sent",
                          "Confirmation email has been resent."
                        );
                      } catch (error) {
                        Alert.alert(
                          "Error",
                          "Failed to resend email. Please try again."
                        );
                      } finally {
                        setLoading(false);
                      }
                    }}
                  >
                    <Text style={styles.resendButtonText}>
                      Didn't receive the email? Resend
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // Regular Auth Form
                <>
                  {/* Simple Welcome Header */}
                  <Animated.View
                    style={[styles.welcomeHeader, containerAnimatedStyle]}
                  >
                    <Text style={styles.welcomeTitle}>
                      {isLogin ? "Welcome back!" : "Create your account"}
                    </Text>
                    <Text style={styles.welcomeSubtitle}>
                      {isLogin
                        ? "Sign in to continue your journey"
                        : "Join the LNMIIT carpool community"}
                    </Text>
                  </Animated.View>

                  {/* Form Card */}
                  <View style={styles.formCard}>
                    {/* Toggle Buttons */}
                    <View style={styles.toggleContainer}>
                      <TouchableOpacity
                        style={[
                          styles.toggleButton,
                          isLogin && styles.toggleButtonActive,
                        ]}
                        onPress={() => {
                          setIsLogin(true);
                          setEmailError("");
                          setPasswordError("");
                        }}
                      >
                        <Text
                          style={[
                            styles.toggleText,
                            isLogin && styles.toggleTextActive,
                          ]}
                        >
                          Sign In
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[
                          styles.toggleButton,
                          !isLogin && styles.toggleButtonActive,
                        ]}
                        onPress={() => {
                          setIsLogin(false);
                          setEmailError("");
                          setPasswordError("");
                        }}
                      >
                        <Text
                          style={[
                            styles.toggleText,
                            !isLogin && styles.toggleTextActive,
                          ]}
                        >
                          Sign Up
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Form Fields */}
                    <View style={styles.formFields}>
                      {/* Name Input - Only for Sign Up */}
                      {!isLogin && (
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>Full Name</Text>
                          <Input
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your full name"
                            autoCapitalize="words"
                          />
                        </View>
                      )}

                      {/* Email Input */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>
                          College Email Address
                        </Text>
                        <Input
                          value={email}
                          onChangeText={(text) => {
                            setEmail(text);
                            if (emailError) setEmailError("");
                          }}
                          placeholder="24ucs001@lnmiit.ac.in"
                          keyboardType="email-address"
                          autoCapitalize="none"
                          error={emailError}
                        />
                        <Text style={styles.inputHelper}>
                          Please use your official LNMIIT email address
                        </Text>
                      </View>

                      {/* Password Input */}
                      <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Password</Text>
                        <Input
                          value={password}
                          onChangeText={(text) => {
                            setPassword(text);
                            if (passwordError) setPasswordError("");
                          }}
                          secureTextEntry={!showPassword}
                          rightIcon={
                            showPassword ? (
                              <EyeOff size={20} color="#6B7280" />
                            ) : (
                              <Eye size={20} color="#6B7280" />
                            )
                          }
                          onRightIconPress={() =>
                            setShowPassword(!showPassword)
                          }
                          placeholder="Enter your password"
                          error={passwordError}
                        />
                      </View>

                      {/* Confirm Password Input - Only for Sign Up */}
                      {!isLogin && (
                        <View style={styles.inputGroup}>
                          <Text style={styles.inputLabel}>
                            Confirm Password
                          </Text>
                          <Input
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                            rightIcon={
                              showConfirmPassword ? (
                                <EyeOff size={20} color="#6B7280" />
                              ) : (
                                <Eye size={20} color="#6B7280" />
                              )
                            }
                            onRightIconPress={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            placeholder="Confirm your password"
                          />
                        </View>
                      )}
                    </View>

                    {/* Forgot Password Link - Only for Sign In */}
                    {isLogin && (
                      <TouchableOpacity style={styles.forgotPassword}>
                        <Text style={styles.forgotPasswordText}>
                          Forgot your password?
                        </Text>
                      </TouchableOpacity>
                    )}

                    {/* Submit Button */}
                    <LinearGradient
                      colors={
                        isDarkMode
                          ? ["#4CAF50", "#2196F3"]
                          : ["#667eea", "#764ba2"]
                      }
                      style={styles.submitButton}
                    >
                      <Button
                        title={isLogin ? "Sign In" : "Create Account"}
                        onPress={handleSubmit}
                        loading={loading}
                        fullWidth
                        size="large"
                        rightIcon={
                          !loading && <ArrowRight size={20} color="white" />
                        }
                        style={styles.submitButtonInner}
                      />
                    </LinearGradient>
                  </View>

                  {/* Footer */}
                  <Text style={styles.footer}>
                    By continuing, you agree to our Terms of Service and Privacy
                    Policy
                  </Text>
                </>
              )}
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
      <View style={styles.madeWithContainer}>
        <Text style={styles.madeWithCreative}>
          Crafted with ❤️ & ☕ by{" "}
          <Text style={styles.creatorNames}>Piyush</Text>
          {" & "}
          <Text style={styles.creatorNames}>Amrendra</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
    minHeight: Platform.OS === "ios" ? 700 : 650,
  },
  content: {
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },

  // Simple Welcome Header
  welcomeHeader: {
    alignItems: "center",
    marginBottom: 40,
    paddingHorizontal: 24,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },

  // Form Card
  formCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },

  // Toggle Buttons
  toggleContainer: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6B7280",
  },
  toggleTextActive: {
    color: "#1F2937",
  },

  // Form Fields
  formFields: {
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  inputHelper: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
    lineHeight: 16,
  },

  // Forgot Password
  forgotPassword: {
    alignItems: "center",
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: "#667eea",
    fontWeight: "600",
  },

  // Submit Button
  submitButton: {
    borderRadius: 12,
    shadowColor: "#667eea",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  submitButtonInner: {
    backgroundColor: "transparent",
  },

  // Footer
  footer: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  // Creative Made With Section
  madeWithContainer: {
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  madeWithCreative: {
    fontSize: 13,
    color: "#6B7280",
    textAlign: "center",
    fontWeight: "500",
    letterSpacing: 0.4,
    lineHeight: 18,
  },
  creatorNames: {
    color: "#667eea",
    fontWeight: "700",
    fontSize: 13.5,
  },

  madeWith: {
    fontSize: 14,
    color: "#667eea",
    textAlign: "center",
    fontWeight: "600",
    letterSpacing: 0.5,
  },

  // Email Confirmation Screen
  confirmationContainer: {
    alignItems: "center",
    padding: 24,
  },
  confirmationIcon: {
    backgroundColor: "#E5E7EB",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
  },
  confirmationEmoji: {
    fontSize: 24,
  },
  confirmationTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  confirmationSubtitle: {
    fontSize: 16,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
  },
  confirmationEmail: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 20,
  },
  confirmationSteps: {
    marginBottom: 20,
  },
  confirmationStepsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 8,
  },
  confirmationStep: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 4,
  },
  backToSignInButton: {
    backgroundColor: "#667eea",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  resendButton: {
    backgroundColor: "#667eea",
    borderRadius: 12,
    padding: 16,
  },
  resendButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
});

ModernAuthScreen.displayName = "ModernAuthScreen";
export default ModernAuthScreen;
