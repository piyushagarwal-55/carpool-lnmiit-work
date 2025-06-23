import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ChevronRight,
} from "lucide-react-native";

interface AuthScreenProps {
  onAuthenticated?: (role: "driver" | "passenger") => void;
  isDarkMode?: boolean;
}

const AuthScreen = ({
  onAuthenticated = () => {},
  isDarkMode = false,
}: AuthScreenProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [selectedRole, setSelectedRole] = useState<
    "driver" | "passenger" | null
  >(null);
  const [step, setStep] = useState(1); // 1: Email, 2: Password, 3: Role Selection
  const [emailError, setEmailError] = useState("");

  const validateEmail = (email: string) => {
    // LNMIIT email format: YYUXXnnn@lnmiit.ac.in
    // YY - year, U - undergraduate, XX - branch code, nnn - registration number
    const emailRegex = /^\d{2}U[A-Z]{2}\d{3}@lnmiit\.ac\.in$/;
    return emailRegex.test(email);
  };

  const handleEmailSubmit = () => {
    if (!email) {
      setEmailError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setEmailError(
        "Invalid LNMIIT email format. Example: 24UEC092@lnmiit.ac.in",
      );
      return;
    }

    setEmailError("");
    setStep(2);
  };

  const handlePasswordSubmit = () => {
    if (!password || password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    // In a real app, you would verify credentials with a backend
    // For now, we'll just move to the next step
    setStep(3);
  };

  const handleRoleSelect = (role: "driver" | "passenger") => {
    setSelectedRole(role);
    // In a real app, you would save the role to the user's profile
    // For now, we'll just call the onAuthenticated callback
    onAuthenticated(role);
  };

  const handleToggleAuthMode = () => {
    setIsLogin(!isLogin);
    setStep(1);
    setEmail("");
    setPassword("");
    setEmailError("");
  };

  const renderEmailStep = () => (
    <View className="w-full space-y-4">
      <Text
        className={`text-2xl font-bold text-center mb-2 ${isDarkMode ? "text-dark-primary" : "text-gray-900"}`}
      >
        {isLogin ? "Welcome Back" : "Create Account"}
      </Text>
      <Text
        className={`text-center mb-4 ${isDarkMode ? "text-dark-tertiary" : "text-gray-500"}`}
      >
        {isLogin ? "Sign in to continue" : "Register with your LNMIIT email"}
      </Text>

      <View className="relative">
        <View className="absolute left-3 top-3 z-10">
          <Mail size={20} color={isDarkMode ? "#94a3b8" : "#6b7280"} />
        </View>
        <TextInput
          className={`${isDarkMode ? "bg-dark-tertiary text-dark-primary" : "bg-gray-100"} h-12 pl-10 pr-4 rounded-lg w-full ${emailError ? "border border-red-500" : ""}`}
          placeholder="LNMIIT Email"
          placeholderTextColor={isDarkMode ? "#94a3b8" : "#9ca3af"}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      {emailError ? (
        <Text className="text-red-500 text-sm">{emailError}</Text>
      ) : null}

      <TouchableOpacity
        className="bg-blue-600 py-3 rounded-lg items-center flex-row justify-center"
        onPress={handleEmailSubmit}
      >
        <Text className="text-white font-semibold mr-2">Continue</Text>
        <ChevronRight size={20} color="white" />
      </TouchableOpacity>

      <TouchableOpacity className="mt-4" onPress={handleToggleAuthMode}>
        <Text className="text-blue-600 text-center">
          {isLogin
            ? "Don't have an account? Sign up"
            : "Already have an account? Sign in"}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPasswordStep = () => (
    <View className="w-full space-y-4">
      <TouchableOpacity
        className="absolute left-0 top-0"
        onPress={() => setStep(1)}
      >
        <Text className="text-blue-600">Back</Text>
      </TouchableOpacity>

      <Text className="text-2xl font-bold text-center mt-8 mb-2">
        {isLogin ? "Enter Password" : "Create Password"}
      </Text>

      <Text className="text-center text-gray-500 mb-2">{email}</Text>

      <View className="relative">
        <View className="absolute left-3 top-3 z-10">
          <Lock size={20} color="#6b7280" />
        </View>
        <TextInput
          className="bg-gray-100 h-12 pl-10 pr-12 rounded-lg w-full"
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          className="absolute right-3 top-3 z-10"
          onPress={() => setShowPassword(!showPassword)}
        >
          {showPassword ? (
            <EyeOff size={20} color="#6b7280" />
          ) : (
            <Eye size={20} color="#6b7280" />
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        className="bg-blue-600 py-3 rounded-lg items-center flex-row justify-center"
        onPress={handlePasswordSubmit}
      >
        <Text className="text-white font-semibold mr-2">
          {isLogin ? "Sign In" : "Create Account"}
        </Text>
        <ChevronRight size={20} color="white" />
      </TouchableOpacity>

      {isLogin && (
        <TouchableOpacity className="mt-2">
          <Text className="text-blue-600 text-center">Forgot Password?</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const renderRoleSelectionStep = () => (
    <View className="w-full space-y-4">
      <TouchableOpacity
        className="absolute left-0 top-0"
        onPress={() => setStep(2)}
      >
        <Text className="text-blue-600">Back</Text>
      </TouchableOpacity>

      <Text className="text-2xl font-bold text-center mt-8 mb-2">
        Select Your Role
      </Text>

      <Text className="text-center text-gray-500 mb-6">
        How would you like to use the app?
      </Text>

      <TouchableOpacity
        className={`border-2 ${selectedRole === "driver" ? "border-blue-600 bg-blue-50" : "border-gray-300"} rounded-lg p-4 flex-row items-center mb-4`}
        onPress={() => handleRoleSelect("driver")}
      >
        <View className="bg-blue-100 p-3 rounded-full mr-4">
          <User size={24} color="#2563eb" />
        </View>
        <View>
          <Text className="font-bold text-lg">Driver</Text>
          <Text className="text-gray-500">Offer rides to other students</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        className={`border-2 ${selectedRole === "passenger" ? "border-blue-600 bg-blue-50" : "border-gray-300"} rounded-lg p-4 flex-row items-center`}
        onPress={() => handleRoleSelect("passenger")}
      >
        <View className="bg-blue-100 p-3 rounded-full mr-4">
          <User size={24} color="#2563eb" />
        </View>
        <View>
          <Text className="font-bold text-lg">Passenger</Text>
          <Text className="text-gray-500">Book rides from other students</Text>
        </View>
      </TouchableOpacity>

      <Text className="text-center text-gray-500 mt-4">
        You can change your role later in settings
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      className={`flex-1 ${isDarkMode ? "bg-dark-primary" : "bg-white"}`}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 px-6 py-8 justify-between">
            <View className="items-center mb-8">
              <Image
                source={{
                  uri: "https://api.dicebear.com/7.x/avataaars/svg?seed=lnmiit",
                }}
                style={{ width: 120, height: 120 }}
              />
              <Text className="text-2xl font-bold mt-4 text-blue-800">
                LNMIIT Carpool
              </Text>
              <Text className="text-gray-500">Connect, Ride, Save</Text>
            </View>

            {step === 1 && renderEmailStep()}
            {step === 2 && renderPasswordStep()}
            {step === 3 && renderRoleSelectionStep()}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default AuthScreen;
