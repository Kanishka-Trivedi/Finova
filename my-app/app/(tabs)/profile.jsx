import React, { useContext, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Image,
  ActivityIndicator,
  Modal,
  Platform,
  StatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AuthContext } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { BASE_URL } from "../../config";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

export default function Profile() {
  const { userToken, logout } = useContext(AuthContext);
  const { t, themeColors, settings } = useSettings();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isDark = settings.theme !== "light";

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

  /* ─── Image Picker & Upload ─── */
  const pickImage = async (useCamera = false) => {
    setShowPhotoSheet(false);
    // Small delay to let the modal close first
    await new Promise((r) => setTimeout(r, 350));
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") return;
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") return;
      }

      const opts = {
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      };

      const result = useCamera
        ? await ImagePicker.launchCameraAsync(opts)
        : await ImagePicker.launchImageLibraryAsync(opts);

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        uploadPhoto(asset.base64, asset.mimeType || "image/jpeg");
      }
    } catch (err) {
      console.error("Image picker error:", err);
    }
  };

  const uploadPhoto = async (base64, mimeType) => {
    setUploading(true);
    try {
      const dataUri = `data:${mimeType};base64,${base64}`;
      const res = await axios.put(
        `${BASE_URL}/api/auth/profile/photo`,
        { image: dataUri },
        {
          headers: { Authorization: `Bearer ${userToken}` },
          timeout: 30000,
        }
      );
      setUserData((prev) => ({ ...prev, profilePhoto: res.data.profilePhoto }));
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = async () => {
    setShowPhotoSheet(false);
    setUploading(true);
    try {
      await axios.put(
        `${BASE_URL}/api/auth/profile`,
        { profilePhoto: "" },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );
      setUserData((prev) => ({ ...prev, profilePhoto: "" }));
    } catch (err) {
      console.error("Remove error:", err);
    } finally {
      setUploading(false);
    }
  };

  /* ─── Menu Link Component ─── */
  const MenuLink = ({ icon, label, onPress, color = "#4ADE80", sublabel }) => (
    <TouchableOpacity
      style={[styles.menuItem, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
      onPress={onPress}
      activeOpacity={0.7}
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
      <LinearGradient colors={themeColors.background} style={styles.container}>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={themeColors.primary} />
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={themeColors.background} style={styles.container}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 20 }]}
      >
        {/* ──── Avatar & Info ──── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => setShowPhotoSheet(true)}
            activeOpacity={0.8}
            disabled={uploading}
          >
            {/* Outer glow ring */}
            <View style={[styles.avatarRing, { borderColor: `${themeColors.primary}35` }]}>
              {uploading ? (
                <View style={[styles.avatarInner, { backgroundColor: `${themeColors.primary}20` }]}>
                  <ActivityIndicator size="large" color={themeColors.primary} />
                </View>
              ) : userData?.profilePhoto ? (
                <Image source={{ uri: userData.profilePhoto }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarInner, { backgroundColor: themeColors.primary }]}>
                  <Text style={[styles.avatarText, { color: isDark ? "#0F2027" : "#fff" }]}>
                    {userData?.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* Camera badge */}
            <View
              style={[
                styles.cameraBadge,
                {
                  backgroundColor: themeColors.primary,
                  borderColor: themeColors.background[0],
                },
              ]}
            >
              <Ionicons name="camera" size={14} color={isDark ? "#0F2027" : "#fff"} />
            </View>
          </TouchableOpacity>

          <Text style={[styles.displayName, { color: themeColors.text }]}>{userData?.name}</Text>
          <Text style={[styles.displayEmail, { color: themeColors.subtext }]}>{userData?.email}</Text>
        </View>

        {/* ──── Account Settings ──── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.subtext }]}>{t("account_settings")}</Text>

          <MenuLink
            icon="person-outline"
            label={t("builder_details")}
            sublabel={t("builder_details_sublabel")}
            onPress={() => router.push("/info")}
          />

          <MenuLink
            icon="shield-checkmark-outline"
            label={t("security")}
            sublabel={t("security_sublabel")}
            onPress={() => router.push("/security")}
            color="#38BDF8"
          />
        </View>

        {/* ──── Preferences ──── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: themeColors.subtext }]}>{t("app_preferences")}</Text>

          <MenuLink
            icon="settings-outline"
            label={t("app_settings")}
            sublabel={t("app_settings_sublabel")}
            onPress={() => router.push("/preferences")}
            color="#FACC15"
          />

          <MenuLink
            icon="cloud-upload-outline"
            label={t("data_management")}
            sublabel={t("data_management_sublabel")}
            onPress={() => router.push("/data-management")}
            color="#A78BFA"
          />
        </View>

        {/* ──── Logout ──── */}
        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: `${themeColors.danger}40`, backgroundColor: `${themeColors.danger}10` }]}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="logout" size={20} color={themeColors.danger} />
          <Text style={[styles.logoutText, { color: themeColors.danger }]}>{t("logout")}</Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: themeColors.subtext, opacity: 0.4 }]}>
            Finova v1.0.0
          </Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ──── Photo Options Bottom Sheet ──── */}
      <Modal
        visible={showPhotoSheet}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowPhotoSheet(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowPhotoSheet(false)}>
          <View style={styles.sheetOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.sheetCard, { backgroundColor: isDark ? "#1A2B32" : "#fff", paddingBottom: insets.bottom + 20 }]}>
                {/* Handle bar */}
                <View style={[styles.sheetHandle, { backgroundColor: themeColors.border }]} />

                <Text style={[styles.sheetTitle, { color: themeColors.text }]}>Profile Photo</Text>

                <TouchableOpacity
                  style={[styles.sheetOption, { borderColor: themeColors.border }]}
                  onPress={() => pickImage(true)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.sheetIconWrap, { backgroundColor: "#4ADE8015" }]}>
                    <Ionicons name="camera-outline" size={22} color="#4ADE80" />
                  </View>
                  <Text style={[styles.sheetOptionText, { color: themeColors.text }]}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sheetOption, { borderColor: themeColors.border }]}
                  onPress={() => pickImage(false)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.sheetIconWrap, { backgroundColor: "#38BDF815" }]}>
                    <Ionicons name="images-outline" size={22} color="#38BDF8" />
                  </View>
                  <Text style={[styles.sheetOptionText, { color: themeColors.text }]}>Choose from Gallery</Text>
                </TouchableOpacity>

                {userData?.profilePhoto ? (
                  <TouchableOpacity
                    style={[styles.sheetOption, { borderColor: themeColors.border }]}
                    onPress={removePhoto}
                    activeOpacity={0.6}
                  >
                    <View style={[styles.sheetIconWrap, { backgroundColor: "#EF444415" }]}>
                      <Ionicons name="trash-outline" size={22} color="#EF4444" />
                    </View>
                    <Text style={[styles.sheetOptionText, { color: "#EF4444" }]}>Remove Photo</Text>
                  </TouchableOpacity>
                ) : null}

                <TouchableOpacity
                  style={[styles.sheetCancel, { backgroundColor: themeColors.border + "50" }]}
                  onPress={() => setShowPhotoSheet(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.sheetCancelText, { color: themeColors.subtext }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  /* ── Header / Avatar ── */
  header: {
    alignItems: "center",
    marginBottom: 36,
  },
  avatarWrapper: {
    marginBottom: 14,
    position: "relative",
  },
  avatarRing: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 3,
    justifyContent: "center",
    alignItems: "center",
    padding: 3,
  },
  avatarInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImg: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: "800",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  displayName: {
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  displayEmail: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.6,
  },

  /* ── Sections ── */
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginBottom: 14,
    paddingLeft: 5,
  },

  /* ── Menu Items ── */
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    marginBottom: 10,
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
    marginLeft: 14,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "600",
  },
  menuSublabel: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.6,
  },

  /* ── Logout ── */
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 6,
  },
  logoutText: {
    fontWeight: "700",
    fontSize: 15,
  },

  /* ── Footer ── */
  footer: {
    marginTop: 36,
    alignItems: "center",
  },
  footerText: {
    fontSize: 11,
    letterSpacing: 1.2,
    fontWeight: "500",
  },

  /* ── Photo Bottom Sheet ── */
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    paddingLeft: 4,
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
  },
  sheetIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  sheetOptionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  sheetCancel: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  sheetCancelText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
