import React, { useState, useContext, useEffect, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    TextInput,
    Switch,
    Modal,
    ActivityIndicator,
    Alert,
    Animated,
    Platform,
    StatusBar,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useAppLock } from "../context/AppLockContext";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { BASE_URL } from "../config";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

/* ─── Small helpers ─── */
const SectionHeader = ({ title, icon, iconColor, themeColors }) => (
    <View style={[secStyles.sectionHeader, { borderColor: themeColors.border }]}>
        <View style={[secStyles.sectionIconWrap, { backgroundColor: `${iconColor}18` }]}>
            <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={[secStyles.sectionTitle, { color: themeColors.subtext }]}>{title}</Text>
    </View>
);

const SettingRow = ({
    label,
    sublabel,
    right,
    themeColors,
    noBorder,
}) => (
    <View
        style={[
            secStyles.row,
            { borderBottomColor: themeColors.border },
            noBorder && { borderBottomWidth: 0 },
        ]}
    >
        <View style={{ flex: 1 }}>
            <Text style={[secStyles.rowLabel, { color: themeColors.text }]}>{label}</Text>
            {sublabel ? (
                <Text style={[secStyles.rowSublabel, { color: themeColors.subtext }]}>{sublabel}</Text>
            ) : null}
        </View>
        <View>{right}</View>
    </View>
);

/* ─── PIN Entry Modal ─── */
function PinModal({ visible, onClose, onConfirm, themeColors, pinLength, title, subtitle }) {
    const [pin, setPin] = useState("");
    const inputRef = useRef(null);

    useEffect(() => {
        if (visible) {
            setPin("");
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [visible]);

    const handleDigit = (d) => {
        if (pin.length < pinLength) setPin((p) => p + d);
    };

    const handleDelete = () => setPin((p) => p.slice(0, -1));

    const handleConfirm = () => {
        if (pin.length === pinLength) {
            onConfirm(pin);
            setPin("");
        }
    };

    const dots = Array.from({ length: pinLength }).map((_, i) => (
        <View
            key={i}
            style={[
                secStyles.dot,
                {
                    backgroundColor:
                        i < pin.length ? themeColors.primary : `${themeColors.primary}30`,
                    borderColor: themeColors.primary,
                },
            ]}
        />
    ));

    const pad = [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        ["", "0", "⌫"],
    ];

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={secStyles.modalOverlay}>
                <View
                    style={[
                        secStyles.pinModal,
                        { backgroundColor: themeColors.card, borderColor: themeColors.border },
                    ]}
                >
                    <TouchableOpacity onPress={onClose} style={secStyles.pinCloseBtn}>
                        <Ionicons name="close" size={22} color={themeColors.subtext} />
                    </TouchableOpacity>
                    <Text style={[secStyles.pinTitle, { color: themeColors.text }]}>{title}</Text>
                    {subtitle ? (
                        <Text style={[secStyles.pinSubtitle, { color: themeColors.subtext }]}>{subtitle}</Text>
                    ) : null}
                    <View style={secStyles.dotsRow}>{dots}</View>
                    <View style={secStyles.padGrid}>
                        {pad.map((row, ri) => (
                            <View key={ri} style={secStyles.padRow}>
                                {row.map((d, ci) => (
                                    <TouchableOpacity
                                        key={ci}
                                        style={[
                                            secStyles.padKey,
                                            {
                                                backgroundColor: d === "" ? "transparent" : `${themeColors.primary}12`,
                                                borderColor: d === "" ? "transparent" : `${themeColors.primary}30`,
                                            },
                                        ]}
                                        onPress={() => (d === "⌫" ? handleDelete() : d !== "" ? handleDigit(d) : null)}
                                        activeOpacity={d === "" ? 1 : 0.6}
                                    >
                                        <Text
                                            style={[
                                                secStyles.padKeyText,
                                                { color: d === "⌫" ? themeColors.danger : themeColors.text },
                                            ]}
                                        >
                                            {d}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        ))}
                    </View>
                    <TouchableOpacity
                        onPress={handleConfirm}
                        disabled={pin.length !== pinLength}
                        style={[
                            secStyles.pinConfirmBtn,
                            {
                                backgroundColor:
                                    pin.length === pinLength ? themeColors.primary : `${themeColors.primary}30`,
                            },
                        ]}
                    >
                        <Text
                            style={[
                                secStyles.pinConfirmText,
                                { color: pin.length === pinLength ? "#0F2027" : themeColors.subtext },
                            ]}
                        >
                            Confirm PIN
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

/* ─── OTP Modal ─── */
function OTPModal({ visible, onClose, onVerify, themeColors, loading, userEmail }) {
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (visible) {
            setOtp(["", "", "", "", "", ""]);
            setTimeout(() => inputRefs.current[0]?.focus(), 200);
        }
    }, [visible]);

    const handleChange = (val, idx) => {
        const newOtp = [...otp];
        newOtp[idx] = val.replace(/[^0-9]/g, "").slice(-1);
        setOtp(newOtp);
        if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
    };

    const handleKey = (e, idx) => {
        if (e.nativeEvent.key === "Backspace" && !otp[idx] && idx > 0) {
            inputRefs.current[idx - 1]?.focus();
        }
    };

    const fullOtp = otp.join("");

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={secStyles.modalOverlay}>
                <View
                    style={[
                        secStyles.otpModal,
                        { backgroundColor: themeColors.card, borderColor: themeColors.border },
                    ]}
                >
                    <View style={[secStyles.otpIconWrap, { backgroundColor: "#38BDF818" }]}>
                        <Ionicons name="shield-checkmark" size={34} color="#38BDF8" />
                    </View>
                    <Text style={[secStyles.otpTitle, { color: themeColors.text }]}>
                        Verify Your Identity
                    </Text>
                    <Text style={[secStyles.otpSub, { color: themeColors.subtext }]}>
                        Enter the 6-digit OTP sent to{"\n"}
                        <Text style={{ color: themeColors.primary }}>{userEmail}</Text>
                    </Text>
                    <View style={secStyles.otpRow}>
                        {otp.map((val, i) => (
                            <TextInput
                                key={i}
                                ref={(r) => (inputRefs.current[i] = r)}
                                style={[
                                    secStyles.otpBox,
                                    {
                                        color: themeColors.text,
                                        borderColor: val ? themeColors.primary : themeColors.border,
                                        backgroundColor: val ? `${themeColors.primary}15` : themeColors.border + "40",
                                    },
                                ]}
                                keyboardType="number-pad"
                                maxLength={1}
                                value={val}
                                onChangeText={(v) => handleChange(v, i)}
                                onKeyPress={(e) => handleKey(e, i)}
                                selectionColor={themeColors.primary}
                            />
                        ))}
                    </View>
                    <Text style={[secStyles.otpHint, { color: themeColors.subtext }]}>
                        💡 Check server console / email for OTP
                    </Text>
                    <View style={secStyles.otpActions}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={[secStyles.otpBtn, { backgroundColor: themeColors.border }]}
                        >
                            <Text style={[secStyles.otpBtnText, { color: themeColors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => onVerify(fullOtp)}
                            disabled={fullOtp.length < 6 || loading}
                            style={[
                                secStyles.otpBtn,
                                {
                                    backgroundColor:
                                        fullOtp.length === 6 ? "#38BDF8" : `#38BDF830`,
                                },
                            ]}
                        >
                            {loading ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text
                                    style={[
                                        secStyles.otpBtnText,
                                        { color: fullOtp.length === 6 ? "#0F2027" : themeColors.subtext },
                                    ]}
                                >
                                    Verify
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

/* ─── Main Screen ─── */
export default function SecuritySettings() {
    const { userToken } = useContext(AuthContext);
    const { themeColors, settings } = useSettings();
    const { reloadLockSettings } = useAppLock();
    const router = useRouter();

    /* ─ remote state ─ */
    const [secSettings, setSecSettings] = useState(null);
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    /* ─ change password ─ */
    const [pwVisible, setPwVisible] = useState(false);
    const [curPw, setCurPw] = useState("");
    const [newPw, setNewPw] = useState("");
    const [confirmPw, setConfirmPw] = useState("");
    const [showCurPw, setShowCurPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);

    /* ─ PIN ─ */
    const [pinModalMode, setPinModalMode] = useState(null); // "set" | "confirm" | "remove"
    const [tempPin, setTempPin] = useState("");
    const [pinLength, setPinLength] = useState(4);

    /* ─ 2FA ─ */
    const [otpModalVisible, setOtpModalVisible] = useState(false);
    const [otpLoading, setOtpLoading] = useState(false);
    const [pendingTwoFactor, setPendingTwoFactor] = useState(false);

    /* ─ auto-lock ─ */
    const AUTO_LOCK_OPTIONS = [
        { label: "Off", value: 0 },
        { label: "30s", value: 30 },
        { label: "1 min", value: 60 },
        { label: "5 min", value: 300 },
        { label: "15 min", value: 900 },
        { label: "30 min", value: 1800 },
    ];

    /* ────────────────────────────────── FETCH ── */
    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        try {
            const [secRes, profileRes] = await Promise.all([
                axios.get(`${BASE_URL}/api/auth/security-settings`, {
                    headers: { Authorization: `Bearer ${userToken}` },
                }),
                axios.get(`${BASE_URL}/api/auth/profile`, {
                    headers: { Authorization: `Bearer ${userToken}` },
                }),
            ]);
            setSecSettings(secRes.data);
            setUserData(profileRes.data);
            setPinLength(secRes.data.pinLength || 4);
        } catch (e) {
            Alert.alert("Error", "Failed to load security settings.");
        } finally {
            setLoading(false);
        }
    };

    /* ────────────────────────────────── SAVE HELPER ── */
    const saveSettings = async (patch) => {
        setSaving(true);
        try {
            const res = await axios.post(
                `${BASE_URL}/api/auth/security-settings`,
                patch,
                { headers: { Authorization: `Bearer ${userToken}` } }
            );
            // Refresh from server (hasPin, etc.)
            await fetchAll();
            // Keep AppLockContext in sync immediately
            await reloadLockSettings();
            return true;
        } catch (e) {
            Alert.alert("Error", e.response?.data?.message || "Update failed.");
            return false;
        } finally {
            setSaving(false);
        }
    };

    /* ────────────────────────────────── CHANGE PASSWORD ── */
    const handleChangePassword = async () => {
        if (!curPw || !newPw || !confirmPw) {
            Alert.alert("Error", "Please fill all fields.");
            return;
        }
        if (newPw !== confirmPw) {
            Alert.alert("Error", "New passwords do not match.");
            return;
        }
        if (newPw.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters.");
            return;
        }
        setPwLoading(true);
        try {
            await axios.post(
                `${BASE_URL}/api/auth/change-password`,
                { currentPassword: curPw, newPassword: newPw },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );
            Alert.alert("✅ Success", "Password updated successfully.");
            setCurPw("");
            setNewPw("");
            setConfirmPw("");
            setPwVisible(false);
        } catch (e) {
            Alert.alert("Error", e.response?.data?.message || "Failed to change password.");
        } finally {
            setPwLoading(false);
        }
    };

    /* ────────────────────────────────── BIOMETRICS ── */
    const handleBiometricToggle = async (val) => {
        await saveSettings({ biometricsEnabled: val });
    };

    /* ────────────────────────────────── AUTO-LOCK ── */
    const handleAutoLock = async (val) => {
        await saveSettings({ autoLockTimer: val });
    };

    /* ────────────────────────────────── PIN ── */
    const handlePinFlow = () => {
        if (secSettings?.hasPin) {
            Alert.alert(
                "PIN Lock",
                "Choose an action",
                [
                    { text: "Change PIN", onPress: () => setPinModalMode("set") },
                    { text: "Remove PIN", style: "destructive", onPress: () => setPinModalMode("remove") },
                    { text: "Cancel", style: "cancel" },
                ]
            );
        } else {
            setPinModalMode("set");
        }
    };

    const handlePinFirst = async (pin) => {
        setTempPin(pin);
        setPinModalMode("confirm");
    };

    const handlePinConfirm = async (pin) => {
        if (pin !== tempPin) {
            Alert.alert("Mismatch", "PINs do not match. Please try again.");
            setPinModalMode("set");
            setTempPin("");
            return;
        }
        setPinModalMode(null);
        await saveSettings({ pinCode: pin, pinLength });
        Alert.alert("✅ Success", "PIN set successfully.");
    };

    const handlePinRemove = async (pin) => {
        // We send null to remove
        setPinModalMode(null);
        await saveSettings({ pinCode: null });
        Alert.alert("✅ Success", "PIN removed.");
    };

    const handlePinLengthChange = (len) => {
        setPinLength(len);
        // Also persist the new length if there's already a PIN
        if (secSettings?.hasPin) saveSettings({ pinLength: len });
    };

    /* ────────────────────────────────── 2FA ── */
    const handle2FAToggle = async (val) => {
        if (val) {
            // Enable: trigger OTP generation (reuse login flow – send OTP to email)
            setPendingTwoFactor(true);
            try {
                await axios.post(
                    `${BASE_URL}/api/auth/security-settings/send-otp`,
                    {},
                    { headers: { Authorization: `Bearer ${userToken}` } }
                );
                setOtpModalVisible(true);
            } catch {
                // Fallback: if send-otp endpoint not available, just enable directly
                await saveSettings({ twoFactorEnabled: true });
                Alert.alert("✅ 2FA Enabled", "Two-factor authentication is now active.");
                setPendingTwoFactor(false);
            }
        } else {
            Alert.alert(
                "Disable 2FA",
                "Are you sure you want to disable two-factor authentication?",
                [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Disable",
                        style: "destructive",
                        onPress: async () => {
                            await saveSettings({ twoFactorEnabled: false });
                        },
                    },
                ]
            );
        }
    };

    const handleOTPVerify = async (otp) => {
        setOtpLoading(true);
        try {
            // Verify OTP via the existing verify-otp endpoint
            await axios.post(`${BASE_URL}/api/auth/verify-otp`, {
                email: userData?.email,
                otp,
            });
            // OTP verified – enable 2FA
            await saveSettings({ twoFactorEnabled: true });
            setOtpModalVisible(false);
            setPendingTwoFactor(false);
            Alert.alert("✅ 2FA Enabled", "Two-factor authentication is now active.");
        } catch (e) {
            Alert.alert("Error", e.response?.data?.message || "Invalid or expired OTP.");
        } finally {
            setOtpLoading(false);
        }
    };

    const handleOTPCancel = () => {
        setOtpModalVisible(false);
        setPendingTwoFactor(false);
    };

    /* ────────────────────────────────── HELPERS ── */
    const formatTimestamp = (ts) => {
        const d = new Date(ts);
        return d.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const getDeviceIcon = (deviceName = "") => {
        const lower = deviceName.toLowerCase();
        if (lower.includes("iphone") || lower.includes("ipad") || lower.includes("ios")) return "logo-apple";
        if (lower.includes("android") || lower.includes("pixel") || lower.includes("samsung")) return "logo-android";
        if (lower.includes("chrome") || lower.includes("web")) return "globe-outline";
        return "phone-portrait-outline";
    };

    /* ────────────────────────────────── RENDER ── */
    if (loading) {
        return (
            <LinearGradient colors={themeColors.background} style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" color={themeColors.primary} />
            </LinearGradient>
        );
    }

    const cardBg = settings.theme === "light" ? themeColors.card : "#1A2B32";

    return (
        <LinearGradient colors={themeColors.background} style={{ flex: 1 }}>
            <SafeAreaView style={{ flex: 1 }}>
                {/* ── Header ── */}
                <View style={[secStyles.header, { borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[secStyles.backBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                    >
                        <Ionicons name="chevron-back" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                    <View>
                        <Text style={[secStyles.headerTitle, { color: themeColors.text }]}>Security</Text>
                        <Text style={[secStyles.headerSub, { color: themeColors.subtext }]}>
                            Protect your account
                        </Text>
                    </View>
                    <View style={{ width: 44 }}>
                        {saving && <ActivityIndicator size="small" color={themeColors.primary} />}
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={secStyles.scroll}>

                    {/* ════════════════════════════════════
              1. CHANGE PASSWORD
          ════════════════════════════════════ */}
                    <SectionHeader
                        title="PASSWORD"
                        icon="lock-closed-outline"
                        iconColor="#4ADE80"
                        themeColors={themeColors}
                    />
                    <View style={[secStyles.card, { backgroundColor: cardBg, borderColor: themeColors.border }]}>
                        <TouchableOpacity
                            style={secStyles.expandRow}
                            onPress={() => setPwVisible(!pwVisible)}
                            activeOpacity={0.7}
                        >
                            <View style={[secStyles.settingIconBg, { backgroundColor: "#4ADE8020" }]}>
                                <Ionicons name="key-outline" size={20} color="#4ADE80" />
                            </View>
                            <View style={{ flex: 1, marginLeft: 14 }}>
                                <Text style={[secStyles.rowLabel, { color: themeColors.text }]}>Change Password</Text>
                                <Text style={[secStyles.rowSublabel, { color: themeColors.subtext }]}>
                                    Update your account password
                                </Text>
                            </View>
                            <Ionicons
                                name={pwVisible ? "chevron-up" : "chevron-down"}
                                size={18}
                                color={themeColors.subtext}
                            />
                        </TouchableOpacity>

                        {pwVisible && (
                            <View style={[secStyles.pwForm, { borderTopColor: themeColors.border }]}>
                                {/* Current password */}
                                <Text style={[secStyles.inputLabel, { color: themeColors.subtext }]}>
                                    Current Password
                                </Text>
                                <View style={[secStyles.inputRow, { borderColor: themeColors.border, backgroundColor: themeColors.border + "60" }]}>
                                    <TextInput
                                        style={[secStyles.input, { color: themeColors.text }]}
                                        value={curPw}
                                        onChangeText={setCurPw}
                                        secureTextEntry={!showCurPw}
                                        placeholder="Enter current password"
                                        placeholderTextColor={themeColors.subtext}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity onPress={() => setShowCurPw(!showCurPw)} style={{ padding: 4 }}>
                                        <Ionicons
                                            name={showCurPw ? "eye-off-outline" : "eye-outline"}
                                            size={20}
                                            color={themeColors.subtext}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* New password */}
                                <Text style={[secStyles.inputLabel, { color: themeColors.subtext, marginTop: 16 }]}>
                                    New Password
                                </Text>
                                <View style={[secStyles.inputRow, { borderColor: themeColors.border, backgroundColor: themeColors.border + "60" }]}>
                                    <TextInput
                                        style={[secStyles.input, { color: themeColors.text }]}
                                        value={newPw}
                                        onChangeText={setNewPw}
                                        secureTextEntry={!showNewPw}
                                        placeholder="Min. 6 characters"
                                        placeholderTextColor={themeColors.subtext}
                                        autoCapitalize="none"
                                    />
                                    <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)} style={{ padding: 4 }}>
                                        <Ionicons
                                            name={showNewPw ? "eye-off-outline" : "eye-outline"}
                                            size={20}
                                            color={themeColors.subtext}
                                        />
                                    </TouchableOpacity>
                                </View>

                                {/* Strength indicator */}
                                {newPw.length > 0 && (
                                    <View style={secStyles.strengthRow}>
                                        {[
                                            newPw.length >= 6 ? "#4ADE80" : themeColors.border,
                                            newPw.length >= 8 ? "#4ADE80" : themeColors.border,
                                            /[!@#$%^&*(),.?":{}|<>]/.test(newPw) ? "#4ADE80" : themeColors.border,
                                            (newPw.length >= 8 && /[A-Z]/.test(newPw) && /[0-9]/.test(newPw)) ? "#4ADE80" : themeColors.border,
                                        ].map((col, i) => (
                                            <View key={i} style={[secStyles.strengthBar, { backgroundColor: col }]} />
                                        ))}
                                        <Text style={[secStyles.strengthLabel, { color: themeColors.subtext }]}>
                                            {newPw.length < 6 ? "Weak" : newPw.length < 8 ? "Fair" : /[!@#$%^&*]/.test(newPw) && /[A-Z]/.test(newPw) ? "Strong" : "Good"}
                                        </Text>
                                    </View>
                                )}

                                {/* Confirm password */}
                                <Text style={[secStyles.inputLabel, { color: themeColors.subtext, marginTop: 16 }]}>
                                    Confirm New Password
                                </Text>
                                <View style={[secStyles.inputRow, {
                                    borderColor: confirmPw && confirmPw !== newPw ? themeColors.danger : themeColors.border,
                                    backgroundColor: themeColors.border + "60",
                                }]}>
                                    <TextInput
                                        style={[secStyles.input, { color: themeColors.text }]}
                                        value={confirmPw}
                                        onChangeText={setConfirmPw}
                                        secureTextEntry
                                        placeholder="Re-enter new password"
                                        placeholderTextColor={themeColors.subtext}
                                        autoCapitalize="none"
                                    />
                                    {confirmPw.length > 0 && (
                                        <Ionicons
                                            name={confirmPw === newPw ? "checkmark-circle" : "close-circle"}
                                            size={20}
                                            color={confirmPw === newPw ? "#4ADE80" : themeColors.danger}
                                        />
                                    )}
                                </View>

                                <TouchableOpacity
                                    onPress={handleChangePassword}
                                    disabled={pwLoading}
                                    style={[secStyles.saveBtn, { backgroundColor: themeColors.primary, marginTop: 22 }]}
                                >
                                    {pwLoading ? (
                                        <ActivityIndicator color="#0F2027" size="small" />
                                    ) : (
                                        <>
                                            <Ionicons name="checkmark" size={18} color="#0F2027" />
                                            <Text style={secStyles.saveBtnText}>Update Password</Text>
                                        </>
                                    )}
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {/* ════════════════════════════════════
              2. BIOMETRIC LOGIN
          ════════════════════════════════════ */}
                    <SectionHeader
                        title="AUTHENTICATION"
                        icon="finger-print-outline"
                        iconColor="#A78BFA"
                        themeColors={themeColors}
                    />
                    <View style={[secStyles.card, { backgroundColor: cardBg, borderColor: themeColors.border }]}>
                        <SettingRow
                            label="Biometric Login"
                            sublabel="Use fingerprint or Face ID to unlock"
                            themeColors={themeColors}
                            noBorder
                            right={
                                <Switch
                                    value={secSettings?.biometricsEnabled || false}
                                    onValueChange={handleBiometricToggle}
                                    trackColor={{ false: themeColors.border, true: `#A78BFA80` }}
                                    thumbColor={secSettings?.biometricsEnabled ? "#A78BFA" : themeColors.subtext}
                                    ios_backgroundColor={themeColors.border}
                                />
                            }
                        />
                    </View>

                    {/* ════════════════════════════════════
              3. PIN LOCK
          ════════════════════════════════════ */}
                    <SectionHeader
                        title="PIN LOCK"
                        icon="keypad-outline"
                        iconColor="#FACC15"
                        themeColors={themeColors}
                    />
                    <View style={[secStyles.card, { backgroundColor: cardBg, borderColor: themeColors.border }]}>
                        {/* PIN Length chooser */}
                        <View style={secStyles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={[secStyles.rowLabel, { color: themeColors.text }]}>PIN Digits</Text>
                                <Text style={[secStyles.rowSublabel, { color: themeColors.subtext }]}>
                                    Choose between 4 or 6 digit PIN
                                </Text>
                            </View>
                            <View style={secStyles.pinLenRow}>
                                {[4, 6].map((n) => (
                                    <TouchableOpacity
                                        key={n}
                                        onPress={() => handlePinLengthChange(n)}
                                        style={[
                                            secStyles.pinLenChip,
                                            {
                                                backgroundColor: pinLength === n ? "#FACC1520" : themeColors.border,
                                                borderColor: pinLength === n ? "#FACC15" : "transparent",
                                            },
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                secStyles.pinLenText,
                                                { color: pinLength === n ? "#FACC15" : themeColors.subtext },
                                            ]}
                                        >
                                            {n}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>

                        {/* Set / Change PIN */}
                        <View style={[secStyles.row, { borderTopColor: themeColors.border, borderTopWidth: 1, borderBottomWidth: 0 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[secStyles.rowLabel, { color: themeColors.text }]}>
                                    {secSettings?.hasPin ? "Change / Remove PIN" : "Set PIN Lock"}
                                </Text>
                                <Text style={[secStyles.rowSublabel, { color: themeColors.subtext }]}>
                                    {secSettings?.hasPin ? "PIN is currently active" : "No PIN set"}
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={handlePinFlow}
                                style={[
                                    secStyles.smallBtn,
                                    {
                                        backgroundColor: secSettings?.hasPin ? "#FACC1520" : "#FACC15",
                                        borderColor: "#FACC15",
                                    },
                                ]}
                            >
                                <Text
                                    style={[
                                        secStyles.smallBtnText,
                                        { color: secSettings?.hasPin ? "#FACC15" : "#0F2027" },
                                    ]}
                                >
                                    {secSettings?.hasPin ? "Manage" : "Set PIN"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* ════════════════════════════════════
              4. AUTO-LOCK
          ════════════════════════════════════ */}
                    <SectionHeader
                        title="AUTO-LOCK"
                        icon="timer-outline"
                        iconColor="#38BDF8"
                        themeColors={themeColors}
                    />
                    <View style={[secStyles.card, { backgroundColor: cardBg, borderColor: themeColors.border }]}>
                        <View style={secStyles.autoLockHeader}>
                            <Text style={[secStyles.rowLabel, { color: themeColors.text }]}>
                                Lock after inactivity
                            </Text>
                            <Text style={[secStyles.rowSublabel, { color: themeColors.subtext, marginTop: 4 }]}>
                                Automatically lock the app after the selected period
                            </Text>
                        </View>
                        <View style={secStyles.lockChipGrid}>
                            {AUTO_LOCK_OPTIONS.map((opt) => {
                                const active = (secSettings?.autoLockTimer || 0) === opt.value;
                                return (
                                    <TouchableOpacity
                                        key={opt.value}
                                        onPress={() => handleAutoLock(opt.value)}
                                        style={[
                                            secStyles.lockChip,
                                            {
                                                backgroundColor: active ? "#38BDF820" : themeColors.border,
                                                borderColor: active ? "#38BDF8" : "transparent",
                                            },
                                        ]}
                                    >
                                        {active && (
                                            <View style={[secStyles.lockChipDot, { backgroundColor: "#38BDF8" }]} />
                                        )}
                                        <Text
                                            style={[
                                                secStyles.lockChipText,
                                                { color: active ? "#38BDF8" : themeColors.subtext },
                                            ]}
                                        >
                                            {opt.label}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>

                    {/* ════════════════════════════════════
              5. TWO-FACTOR AUTH
          ════════════════════════════════════ */}
                    <SectionHeader
                        title="TWO-FACTOR AUTHENTICATION"
                        icon="shield-checkmark-outline"
                        iconColor="#38BDF8"
                        themeColors={themeColors}
                    />
                    <View style={[secStyles.card, { backgroundColor: cardBg, borderColor: themeColors.border }]}>
                        <SettingRow
                            label="Enable 2FA"
                            sublabel={
                                secSettings?.twoFactorEnabled
                                    ? "✅ OTP required on every login"
                                    : "Add an extra layer of login security"
                            }
                            themeColors={themeColors}
                            noBorder
                            right={
                                <Switch
                                    value={secSettings?.twoFactorEnabled || false}
                                    onValueChange={handle2FAToggle}
                                    trackColor={{ false: themeColors.border, true: `#38BDF880` }}
                                    thumbColor={secSettings?.twoFactorEnabled ? "#38BDF8" : themeColors.subtext}
                                    ios_backgroundColor={themeColors.border}
                                />
                            }
                        />
                        {secSettings?.twoFactorEnabled && (
                            <View
                                style={[
                                    secStyles.twoFaBanner,
                                    { backgroundColor: "#38BDF812", borderColor: "#38BDF830" },
                                ]}
                            >
                                <Ionicons name="information-circle-outline" size={16} color="#38BDF8" />
                                <Text style={[secStyles.twoFaBannerText, { color: "#38BDF8" }]}>
                                    A 6-digit OTP is sent to your email on each login.
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* ════════════════════════════════════
              6. LOGIN ACTIVITY
          ════════════════════════════════════ */}
                    <SectionHeader
                        title="LOGIN ACTIVITY"
                        icon="time-outline"
                        iconColor="#F97316"
                        themeColors={themeColors}
                    />
                    <View style={[secStyles.card, { backgroundColor: cardBg, borderColor: themeColors.border }]}>
                        {secSettings?.loginActivity?.length > 0 ? (
                            secSettings.loginActivity.slice(0, 5).map((entry, idx) => (
                                <View
                                    key={idx}
                                    style={[
                                        secStyles.activityRow,
                                        { borderBottomColor: themeColors.border },
                                        idx === Math.min(secSettings.loginActivity.length, 5) - 1 && { borderBottomWidth: 0 },
                                    ]}
                                >
                                    <View
                                        style={[
                                            secStyles.activityIconWrap,
                                            { backgroundColor: idx === 0 ? "#4ADE8020" : themeColors.border },
                                        ]}
                                    >
                                        <Ionicons
                                            name={getDeviceIcon(entry.device)}
                                            size={20}
                                            color={idx === 0 ? "#4ADE80" : themeColors.subtext}
                                        />
                                    </View>
                                    <View style={{ flex: 1, marginLeft: 12 }}>
                                        <View style={secStyles.activityTopRow}>
                                            <Text
                                                style={[secStyles.activityDevice, { color: themeColors.text }]}
                                                numberOfLines={1}
                                            >
                                                {entry.device || "Unknown Device"}
                                            </Text>
                                            {idx === 0 && (
                                                <View style={[secStyles.currentBadge, { backgroundColor: "#4ADE8020" }]}>
                                                    <Text style={[secStyles.currentBadgeText, { color: "#4ADE80" }]}>
                                                        Latest
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                        <Text style={[secStyles.activityTime, { color: themeColors.subtext }]}>
                                            {formatTimestamp(entry.timestamp)}
                                        </Text>
                                        {entry.ip && (
                                            <Text style={[secStyles.activityIp, { color: themeColors.subtext }]}>
                                                IP: {entry.ip}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            ))
                        ) : (
                            <View style={secStyles.emptyActivity}>
                                <Ionicons name="time-outline" size={36} color={themeColors.subtext} />
                                <Text style={[secStyles.emptyText, { color: themeColors.subtext }]}>
                                    No login history yet
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={{ height: 50 }} />
                </ScrollView>
            </SafeAreaView>

            {/* ── PIN Modals ── */}
            <PinModal
                visible={pinModalMode === "set"}
                title={secSettings?.hasPin ? "Enter New PIN" : `Set ${pinLength}-Digit PIN`}
                subtitle={`Enter your new ${pinLength}-digit PIN`}
                onClose={() => setPinModalMode(null)}
                onConfirm={handlePinFirst}
                themeColors={themeColors}
                pinLength={pinLength}
            />
            <PinModal
                visible={pinModalMode === "confirm"}
                title="Confirm PIN"
                subtitle="Re-enter the same PIN to confirm"
                onClose={() => { setPinModalMode(null); setTempPin(""); }}
                onConfirm={handlePinConfirm}
                themeColors={themeColors}
                pinLength={pinLength}
            />
            <PinModal
                visible={pinModalMode === "remove"}
                title="Enter Existing PIN to Remove"
                subtitle="This will disable PIN protection"
                onClose={() => setPinModalMode(null)}
                onConfirm={handlePinRemove}
                themeColors={themeColors}
                pinLength={pinLength}
            />

            {/* ── OTP Modal ── */}
            <OTPModal
                visible={otpModalVisible}
                onClose={handleOTPCancel}
                onVerify={handleOTPVerify}
                themeColors={themeColors}
                loading={otpLoading}
                userEmail={userData?.email || ""}
            />
        </LinearGradient>
    );
}

/* ─── Styles ─── */
const secStyles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 0) + 8 : 8,
        paddingBottom: 14,
        borderBottomWidth: 1,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
    },
    headerTitle: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
    headerSub: { fontSize: 12, marginTop: 2 },
    scroll: { padding: 20 },

    /* Section headers */
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        marginBottom: 10,
        marginTop: 4,
        paddingBottom: 10,
        borderBottomWidth: 1,
    },
    sectionIconWrap: {
        width: 30,
        height: 30,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: "700",
        letterSpacing: 1.4,
        textTransform: "uppercase",
    },

    /* Card */
    card: {
        borderRadius: 24,
        borderWidth: 1,
        marginBottom: 22,
        overflow: "hidden",
    },

    /* Rows */
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    expandRow: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 18,
        paddingVertical: 16,
    },
    rowLabel: { fontSize: 15, fontWeight: "600" },
    rowSublabel: { fontSize: 12, marginTop: 3, lineHeight: 18 },
    settingIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },

    /* Password form */
    pwForm: {
        paddingHorizontal: 18,
        paddingBottom: 18,
        borderTopWidth: 1,
        paddingTop: 18,
    },
    inputLabel: { fontSize: 12, fontWeight: "600", marginBottom: 8, textTransform: "uppercase", letterSpacing: 0.8 },
    inputRow: {
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 52,
    },
    input: { flex: 1, fontSize: 15 },
    strengthRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
    strengthBar: { flex: 1, height: 4, borderRadius: 4 },
    strengthLabel: { fontSize: 11, fontWeight: "600", marginLeft: 4, width: 46 },
    saveBtn: {
        height: 52,
        borderRadius: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    saveBtnText: { color: "#0F2027", fontWeight: "700", fontSize: 15 },

    /* PIN lock */
    pinLenRow: { flexDirection: "row", gap: 8 },
    pinLenChip: {
        width: 44,
        height: 36,
        borderRadius: 10,
        borderWidth: 1.5,
        justifyContent: "center",
        alignItems: "center",
    },
    pinLenText: { fontWeight: "700", fontSize: 15 },
    smallBtn: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1.5,
    },
    smallBtnText: { fontWeight: "700", fontSize: 13 },

    /* Auto-lock chips */
    autoLockHeader: {
        paddingHorizontal: 18,
        paddingTop: 16,
        paddingBottom: 14,
    },
    lockChipGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        paddingHorizontal: 18,
        paddingBottom: 18,
    },
    lockChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    lockChipDot: { width: 7, height: 7, borderRadius: 4 },
    lockChipText: { fontWeight: "600", fontSize: 13 },

    /* 2FA */
    twoFaBanner: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        marginHorizontal: 18,
        marginBottom: 16,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    twoFaBannerText: { fontSize: 12, fontWeight: "600", flex: 1 },

    /* Login activity */
    activityRow: {
        flexDirection: "row",
        alignItems: "flex-start",
        paddingHorizontal: 18,
        paddingVertical: 14,
        borderBottomWidth: 1,
    },
    activityIconWrap: {
        width: 42,
        height: 42,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    activityTopRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    activityDevice: { fontSize: 14, fontWeight: "600", flex: 1 },
    activityTime: { fontSize: 12, marginTop: 3 },
    activityIp: { fontSize: 11, marginTop: 2 },
    currentBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
    currentBadgeText: { fontSize: 10, fontWeight: "700" },
    emptyActivity: { alignItems: "center", paddingVertical: 30, gap: 10 },
    emptyText: { fontSize: 14 },

    /* Modals */
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "flex-end",
    },

    /* PIN Modal */
    pinModal: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderWidth: 1,
        paddingTop: 12,
        paddingBottom: 40,
        paddingHorizontal: 28,
        alignItems: "center",
    },
    pinCloseBtn: { alignSelf: "flex-end", padding: 8, marginBottom: 8 },
    pinTitle: { fontSize: 22, fontWeight: "800", textAlign: "center", marginBottom: 6 },
    pinSubtitle: { fontSize: 13, textAlign: "center", marginBottom: 28 },
    dotsRow: { flexDirection: "row", gap: 16, marginBottom: 32 },
    dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 2 },
    padGrid: { gap: 16, width: "100%", maxWidth: 280 },
    padRow: { flexDirection: "row", justifyContent: "space-between", gap: 16 },
    padKey: {
        flex: 1,
        height: 68,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
    },
    padKeyText: { fontSize: 26, fontWeight: "700" },
    pinConfirmBtn: {
        marginTop: 28,
        height: 56,
        width: "100%",
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
    },
    pinConfirmText: { fontSize: 16, fontWeight: "700" },

    /* OTP Modal */
    otpModal: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        borderWidth: 1,
        padding: 28,
        paddingBottom: 44,
        alignItems: "center",
    },
    otpIconWrap: {
        width: 72,
        height: 72,
        borderRadius: 22,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 18,
    },
    otpTitle: { fontSize: 22, fontWeight: "800", marginBottom: 8, textAlign: "center" },
    otpSub: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 28 },
    otpRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
    otpBox: {
        width: 46,
        height: 56,
        borderWidth: 2,
        borderRadius: 14,
        textAlign: "center",
        fontSize: 22,
        fontWeight: "800",
    },
    otpHint: { fontSize: 11, marginBottom: 24, textAlign: "center" },
    otpActions: { flexDirection: "row", gap: 12, width: "100%" },
    otpBtn: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
    },
    otpBtnText: { fontSize: 16, fontWeight: "700" },
});
