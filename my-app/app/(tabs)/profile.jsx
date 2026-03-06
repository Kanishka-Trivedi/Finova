import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { AuthContext } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { BASE_URL } from "../../config";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function Profile() {
  const { userToken, logout } = useContext(AuthContext);
  const { t, themeColors } = useSettings();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, [userToken]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setUserData(res.data);
    } catch (error) {
      console.log("Error fetching profile", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  const MenuLink = ({ icon, label, onPress, color = "#4ADE80", sublabel }) => (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
      onPress={onPress}
    >
      <View style={[styles.menuIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <View style={styles.menuTextContainer}>
        <Text style={[styles.menuLabel, { color: themeColors.text }]}>{label}</Text>
        {sublabel && <Text style={[styles.menuSublabel, { color: themeColors.subtext }]}>{sublabel}</Text>}
      </View>
      <Ionicons name="chevron-forward" size={20} color={themeColors.subtext} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: "center", backgroundColor: themeColors.background[0] }]}>
        <ActivityIndicator size="large" color={themeColors.primary} />
      </View>
    );
  }

  return (
    <LinearGradient colors={themeColors.background} style={styles.container}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

          {/* Header & Avatar */}
          <View style={styles.header}>
            <View style={styles.avatarWrapper}>
              {userData?.profilePhoto ? (
                <Image source={{ uri: userData.profilePhoto }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: themeColors.primary }]}>
                  <Text style={[styles.avatarText, { color: themeColors.background[0] }]}>{userData?.name?.charAt(0).toUpperCase()}</Text>
                </View>
              )}
            </View>
            <Text style={[styles.displayName, { color: themeColors.text }]}>{userData?.name}</Text>
            <Text style={[styles.displayEmail, { color: themeColors.subtext }]}>{userData?.email}</Text>
          </View>

          {/* Account Settings Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.subtext }]}>{t('account_settings')}</Text>

            <MenuLink
              icon="person-outline"
              label={t('builder_details')}
              sublabel={t('builder_details_sublabel')}
              onPress={() => router.push("/info")}
            />

            <MenuLink
              icon="shield-checkmark-outline"
              label={t('security')}
              sublabel={t('security_sublabel')}
              onPress={() => router.push("/security")}
              color="#38BDF8"
            />
          </View>

          {/* Preferences Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: themeColors.subtext }]}>{t('app_preferences')}</Text>

            <MenuLink
              icon="settings-outline"
              label={t('app_settings')}
              sublabel={t('app_settings_sublabel')}
              onPress={() => router.push("/preferences")}
              color="#FACC15"
            />

            <MenuLink
              icon="cloud-upload-outline"
              label={t('data_management')}
              sublabel={t('data_management_sublabel')}
              onPress={() => router.push("/data-management")}
              color="#A78BFA"
            />
          </View>

          {/* Danger Zone */}
          <TouchableOpacity
            style={[styles.logoutButton, { borderColor: `${themeColors.danger}40`, backgroundColor: `${themeColors.danger}10` }]}
            onPress={handleLogout}
          >
            <MaterialCommunityIcons name="logout" size={20} color={themeColors.danger} />
            <Text style={[styles.logoutText, { color: themeColors.danger }]}>{t('logout')}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: themeColors.subtext, opacity: 0.5 }]}>Native-PR v1.0.0</Text>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  avatarWrapper: {
    marginBottom: 15,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatarImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "bold",
  },
  displayName: {
    fontSize: 24,
    fontWeight: "800",
  },
  displayEmail: {
    fontSize: 14,
    marginTop: 4,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 15,
    paddingLeft: 5,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  menuSublabel: {
    fontSize: 12,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 10,
  },
  logoutText: {
    fontWeight: "700",
    fontSize: 15,
  },
  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    letterSpacing: 1,
  },
});
