import { DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";
import "../global.css";
import { Platform } from "react-native";
import { PaperProvider, MD3DarkTheme, MD3LightTheme } from "react-native-paper";
import { useColorScheme } from "react-native";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const customLightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#6366f1",
    primaryContainer: "#e0e7ff",
    secondary: "#8b5cf6",
    secondaryContainer: "#f3e8ff",
    tertiary: "#06b6d4",
    tertiaryContainer: "#cffafe",
    surface: "#ffffff",
    surfaceVariant: "#f8fafc",
    background: "#f8fafc",
    error: "#ef4444",
    errorContainer: "#fef2f2",
    onPrimary: "#ffffff",
    onSecondary: "#ffffff",
    onSurface: "#1e293b",
    onBackground: "#1e293b",
  },
};

const customDarkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: "#818cf8",
    primaryContainer: "#4338ca",
    secondary: "#a78bfa",
    secondaryContainer: "#7c3aed",
    tertiary: "#22d3ee",
    tertiaryContainer: "#0891b2",
    surface: "#1e293b",
    surfaceVariant: "#334155",
    background: "#0f172a",
    error: "#f87171",
    errorContainer: "#7f1d1d",
    onPrimary: "#ffffff",
    onSecondary: "#ffffff",
    onSurface: "#f8fafc",
    onBackground: "#f8fafc",
  },
};

export default function RootLayout() {
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const colorScheme = useColorScheme();
  const paperTheme =
    colorScheme === "dark" ? customDarkTheme : customLightTheme;

  useEffect(() => {
    // Development initialization complete
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <PaperProvider theme={paperTheme}>
      <ThemeProvider value={DefaultTheme}>
        <Stack
          screenOptions={({ route }) => ({
            headerShown: false,
          })}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
        </Stack>
        <StatusBar style={colorScheme === "dark" ? "light" : "dark"} />
      </ThemeProvider>
    </PaperProvider>
  );
}
