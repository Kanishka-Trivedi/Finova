import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from "@react-navigation/native";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import { useEffect, useContext } from "react";

import { AuthProvider, AuthContext } from "../context/AuthContext";
import { SettingsProvider, useSettings } from "../context/SettingsContext";
import { AppLockProvider } from "../context/AppLockContext";
import AppLockScreen from "../components/AppLockScreen";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

function RootLayoutNav() {
  const { userToken, isLoading } = useContext(AuthContext);
  const { settings } = useSettings();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const segment = segments[0] as string;
    const inAuthGroup = segment === "(tabs)" || segment === "expense-detail" || segment === "info" || segment === "preferences" || segment === "data-management" || segment === "security";
    const onAuthPage = segment === "login" || segment === "register";

    if (!userToken && (inAuthGroup || !segment)) {
      router.replace("/login");
    } else if (userToken && (onAuthPage || !segment)) {
      router.replace("/(tabs)");
    }
  }, [userToken, isLoading, segments]);

  const currentTheme = settings.theme === "light" ? DefaultTheme : DarkTheme;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <NavigationThemeProvider value={currentTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="register" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="expense-detail" />
          <Stack.Screen name="info" options={{ presentation: "card" }} />
          <Stack.Screen name="preferences" options={{ presentation: "card" }} />
          <Stack.Screen name="data-management" options={{ presentation: "card" }} />
          <Stack.Screen name="security" options={{ presentation: "card" }} />
          <Stack.Screen name="modal" options={{ presentation: "modal", title: "Modal" }} />
        </Stack>
        <StatusBar style={settings.theme === "light" ? "dark" : "light"} />
      </NavigationThemeProvider>
      {/* App Lock overlay — renders on top of everything when locked */}
      <AppLockScreen />
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppLockProvider>
          <RootLayoutNav />
        </AppLockProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}