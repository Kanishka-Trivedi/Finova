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
  const MenuLink = ({ icon, label, onPress, color = "#5B8A72", sublabel }) => (
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
        {/* ──── Hero Header ──── */}
        <LinearGradient
          colors={isDark ? ["rgba(91,138,114,0.15)", "rgba(91,138,114,0.05)"] : ["#FFFFFF", "#F0F9FF"]}
          style={[styles.heroCard, { borderColor: themeColors.border }]}
        >
          <TouchableOpacity
            style={styles.avatarWrapper}
            onPress={() => setShowPhotoSheet(true)}
            activeOpacity={0.8}
            disabled={uploading}
          >
            <View style={[styles.avatarRing, { borderColor: "#5B8A7250" }]}>
              {uploading ? (
                <ActivityIndicator size="small" color="#5B8A72" />
              ) : userData?.profilePhoto ? (
                <Image source={{ uri: userData.profilePhoto }} style={styles.avatarImg} />
              ) : (
                <View style={[styles.avatarInner, { backgroundColor: "#5B8A72" }]}>
                  <Text style={styles.avatarText}>
                    {userData?.name?.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={styles.cameraBadge}>
                <Ionicons name="camera" size={12} color="#fff" />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.heroInfo}>
            <Text style={[styles.displayName, { color: themeColors.text }]}>{userData?.name}</Text>
            <View style={styles.emailRow}>
              <Ionicons name="mail-outline" size={14} color={themeColors.subtext} />
              <Text style={[styles.displayEmail, { color: themeColors.subtext }]}>{userData?.email}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ──── Settings Groups ──── */}
        <View style={styles.menuContainer}>
          <Text style={[styles.sectionHeading, { color: themeColors.subtext }]}>{t("account_settings")}</Text>

          <View style={[styles.groupCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <MenuLink
              icon="person-outline"
              label={t("builder_details")}
              sublabel={t("builder_details_sublabel")}
              onPress={() => router.push("/info")}
              color="#5B8A72" // Teal
            />
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
            <MenuLink
              icon="shield-checkmark-outline"
              label={t("security")}
              sublabel={t("security_sublabel")}
              onPress={() => router.push("/security")}
              color="#0EA5E9" // Sky Blue
            />
          </View>

          <Text style={[styles.sectionHeading, { color: themeColors.subtext }]}>{t("app_preferences")}</Text>
          <View style={[styles.groupCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
            <MenuLink
              icon="settings-outline"
              label={t("app_settings")}
              sublabel={t("app_settings_sublabel")}
              onPress={() => router.push("/preferences")}
              color="#F59E0B" // Amber/Gold
            />
            <View style={[styles.divider, { backgroundColor: themeColors.border }]} />
            <MenuLink
              icon="cloud-upload-outline"
              label={t("data_management")}
              sublabel={t("data_management_sublabel")}
              onPress={() => router.push("/data-management")}
              color="#A855F7" // Purple
            />
          </View>

          <TouchableOpacity
            style={[styles.logoutBtn, { borderColor: `${themeColors.danger}30` }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={themeColors.danger} />
            <Text style={[styles.logoutText, { color: themeColors.danger }]}>{t("logout")}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: themeColors.subtext }]}>
            Finova Enterprise • Version 1.0.0
          </Text>
        </View>
        <View style={{ height: 100 }} />
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
                  <View style={[styles.sheetIconWrap, { backgroundColor: "#5B8A7215" }]}>
                    <Ionicons name="camera-outline" size={22} color="#5B8A72" />
                  </View>
                  <Text style={[styles.sheetOptionText, { color: themeColors.text }]}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sheetOption, { borderColor: themeColors.border }]}
                  onPress={() => pickImage(false)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.sheetIconWrap, { backgroundColor: "#3B6F8A15" }]}>
                    <Ionicons name="images-outline" size={22} color="#3B6F8A" />
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
    paddingBottom: 40,
  },
  /* ──── Hero Section ──── */
  heroCard: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
    marginTop: 10,
  },
  avatarWrapper: {
    position: "relative",
  },
  avatarRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
    padding: 3,
  },
  avatarInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImg: {
    width: 76,
    height: 76,
    borderRadius: 38,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "800",
    color: "#fff",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#5B8A72",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  heroInfo: {
    marginLeft: 20,
    flex: 1,
  },
  displayName: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
  },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    opacity: 0.7,
  },
  displayEmail: {
    fontSize: 14,
    fontWeight: "500",
  },

  /* ──── Menu List ──── */
  menuContainer: {
    gap: 12,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginLeft: 4,
    marginTop: 10,
    marginBottom: 4,
  },
  groupCard: {
    borderRadius: 24,
    borderWidth: 1,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  menuTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  menuLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  menuSublabel: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.8,
  },
  divider: {
    height: 1,
    marginHorizontal: 18,
  },

  /* ──── Actions ──── */
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 24,
    gap: 10,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "700",
  },

  footer: {
    marginTop: 40,
    alignItems: "center",
  },
  footerText: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.5,
    letterSpacing: 0.5,
  },

  /* ──── Bottom Sheet ──── */
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  sheetCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 20,
    textAlign: "center",
  },
  sheetOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  sheetIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  sheetOptionText: {
    fontSize: 16,
    fontWeight: "600",
  },
  sheetCancel: {
    marginTop: 10,
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  sheetCancelText: {
    fontSize: 16,
    fontWeight: "700",
  },
});
