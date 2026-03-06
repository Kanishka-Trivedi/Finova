/**
 * AppLockScreen
 * ─────────────
 * Full-screen modal overlay shown when the app is locked.
 * Offers:
 *  1. Biometric authentication (if enabled + hardware available)
 *  2. PIN entry as fallback / primary method
 *
 * Calls `unlock()` from AppLockContext on success.
 */
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Alert,
    Animated,
    Vibration,
    StatusBar,
    Platform,
} from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { Ionicons } from "@expo/vector-icons";
import { useAppLock } from "../context/AppLockContext";
import { useSettings } from "../context/SettingsContext";
import { AuthContext } from "../context/AuthContext";
import { useContext } from "react";
import { useRouter } from "expo-router";
import axios from "axios";
import { BASE_URL } from "../config";
import * as Haptics from "expo-haptics";

export default function AppLockScreen() {
    const { isLocked, lockSettings, unlock } = useAppLock();
    const { themeColors } = useSettings();
    const { userToken, logout } = useContext(AuthContext);
    const router = useRouter();

    /* ── PIN state ── */
    const [pin, setPin] = useState("");
    const [attempts, setAttempts] = useState(0);
    const [error, setError] = useState("");

    /* ── Biometric state ── */
    const [biometricAvailable, setBiometricAvailable] = useState(false);
    const [biometricType, setBiometricType] = useState(null); // "fingerprint" | "face"

    /* ── animations ── */
    const shakeAnim = useRef(new Animated.Value(0)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;

    const pinLength = lockSettings?.pinLength || 4;
    const hasBiometric = lockSettings?.biometricsEnabled && biometricAvailable;
    const hasPin = lockSettings?.hasPin;

    /* ──────────────────────────────────────────
       Biometric hardware check
    ────────────────────────────────────────── */
    useEffect(() => {
        checkBiometricSupport();
    }, []);

    const checkBiometricSupport = async () => {
        try {
            const compatible = await LocalAuthentication.hasHardwareAsync();
            const enrolled = await LocalAuthentication.isEnrolledAsync();
            if (compatible && enrolled) {
                setBiometricAvailable(true);
                const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
                if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
                    setBiometricType("face");
                } else {
                    setBiometricType("fingerprint");
                }
            }
        } catch (e) {
            setBiometricAvailable(false);
        }
    };

    /* ──────────────────────────────────────────
       Auto-trigger biometric on lock screen open
    ────────────────────────────────────────── */
    useEffect(() => {
        if (!isLocked) {
            // Reset state on unlock
            setPin("");
            setAttempts(0);
            setError("");
            return;
        }

        // Fade in
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 250,
            useNativeDriver: true,
        }).start();

        // Auto-trigger biometric if enabled and no PIN set (or as primary)
        if (hasBiometric) {
            setTimeout(triggerBiometric, 600);
        }
    }, [isLocked]);

    /* ──────────────────────────────────────────
       Biometric prompt
    ────────────────────────────────────────── */
    const triggerBiometric = useCallback(async () => {
        try {
            const result = await LocalAuthentication.authenticateAsync({
                promptMessage: "Authenticate to continue",
                fallbackLabel: hasPin ? "Use PIN" : "Cancel",
                cancelLabel: "Cancel",
                disableDeviceFallback: false,
            });

            if (result.success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                unlock();
            } else if (result.error === "user_cancel" || result.error === "system_cancel") {
                // User cancelled — stay on lock screen (PIN available as fallback)
            } else {
                setError("Biometric failed. Use PIN instead.");
            }
        } catch (e) {
            setError("Biometric unavailable. Use PIN.");
        }
    }, [hasPin, unlock]);

    /* ──────────────────────────────────────────
       PIN verification
    ────────────────────────────────────────── */
    const verifyPin = useCallback(async (enteredPin) => {
        try {
            await axios.post(
                `${BASE_URL}/api/auth/security-settings/verify-pin`,
                { pin: enteredPin },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );
            // ✅ PIN correct
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setError("");
            setAttempts(0);
            unlock();
        } catch (e) {
            // ❌ PIN incorrect
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setPin("");
            setError(
                newAttempts >= 5
                    ? "Too many attempts. Try again later."
                    : `Incorrect PIN. ${5 - newAttempts} attempts left.`
            );
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Vibration.vibrate(400);
            triggerShake();

            if (newAttempts >= 5) {
                // Lock out: logout after 5 failures
                setTimeout(() => {
                    logout();
                    router.replace("/login");
                }, 1500);
            }
        }
    }, [attempts, userToken, unlock, logout, router]);

    /* ──────────────────────────────────────────
       PIN digit entry
    ────────────────────────────────────────── */
    const handleDigit = useCallback((d) => {
        if (attempts >= 5) return;
        setError("");
        const next = pin + d;
        setPin(next);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (next.length === pinLength) {
            // Tiny delay so user sees last dot fill before request starts
            setTimeout(() => verifyPin(next), 150);
        }
    }, [pin, pinLength, attempts, verifyPin]);

    const handleDelete = useCallback(() => {
        setPin((p) => p.slice(0, -1));
        setError("");
    }, []);

    /* ──────────────────────────────────────────
       Shake animation for wrong PIN
    ────────────────────────────────────────── */
    const triggerShake = () => {
        Animated.sequence([
            Animated.timing(shakeAnim, { toValue: 12, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
            Animated.timing(shakeAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
        ]).start();
    };

    /* ──────────────────────────────────────────
       Numpad layout
    ────────────────────────────────────────── */
    const pad = [
        ["1", "2", "3"],
        ["4", "5", "6"],
        ["7", "8", "9"],
        ["bio", "0", "⌫"],
    ];

    /* ──────────────────────────────────────────
       Render nothing when not locked
    ────────────────────────────────────────── */
    if (!isLocked) return null;

    const dots = Array.from({ length: pinLength }).map((_, i) => {
        const filled = i < pin.length;
        return (
            <Animated.View
                key={i}
                style={[
                    styles.dot,
                    {
                        backgroundColor: filled
                            ? error
                                ? "#EF4444"
                                : themeColors.primary
                            : "rgba(255,255,255,0.15)",
                        borderColor: filled
                            ? error
                                ? "#EF4444"
                                : themeColors.primary
                            : "rgba(255,255,255,0.3)",
                        transform: [{ scale: filled ? 1.15 : 1 }],
                    },
                ]}
            />
        );
    });

    return (
        <Modal visible={isLocked} transparent={false} animationType="none" statusBarTranslucent>
            <StatusBar barStyle="light-content" backgroundColor="#0F2027" />
            <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
                {/* Background gradient effect via views */}
                <View style={styles.bgTop} />
                <View style={styles.bgBottom} />

                {/* ── Top section ── */}
                <View style={styles.topSection}>
                    {/* Shield icon */}
                    <View style={styles.iconRing}>
                        <View style={styles.iconInner}>
                            <Ionicons name="shield-checkmark" size={38} color={themeColors.primary} />
                        </View>
                    </View>

                    <Text style={styles.title}>App Locked</Text>
                    <Text style={styles.subtitle}>
                        {hasBiometric && !hasPin
                            ? `Use ${biometricType === "face" ? "Face ID" : "fingerprint"} to unlock`
                            : hasPin
                                ? "Enter your PIN to continue"
                                : "Authenticating…"}
                    </Text>
                </View>

                {/* ── PIN dots ── */}
                {hasPin && (
                    <Animated.View
                        style={[styles.dotsRow, { transform: [{ translateX: shakeAnim }] }]}
                    >
                        {dots}
                    </Animated.View>
                )}

                {/* ── Error text ── */}
                {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : (
                    <View style={{ height: 20 }} />
                )}

                {/* ── Numpad ── */}
                {hasPin && (
                    <View style={styles.padGrid}>
                        {pad.map((row, ri) => (
                            <View key={ri} style={styles.padRow}>
                                {row.map((key, ci) => {
                                    if (key === "bio") {
                                        return hasBiometric ? (
                                            <TouchableOpacity
                                                key={ci}
                                                style={[styles.padKey, styles.padKeySpecial]}
                                                onPress={triggerBiometric}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons
                                                    name={biometricType === "face" ? "scan-outline" : "finger-print-outline"}
                                                    size={28}
                                                    color={themeColors.primary}
                                                />
                                            </TouchableOpacity>
                                        ) : (
                                            <View key={ci} style={[styles.padKey, { opacity: 0 }]} />
                                        );
                                    }
                                    if (key === "⌫") {
                                        return (
                                            <TouchableOpacity
                                                key={ci}
                                                style={[styles.padKey, styles.padKeySpecial]}
                                                onPress={handleDelete}
                                                activeOpacity={0.7}
                                            >
                                                <Ionicons name="backspace-outline" size={26} color="rgba(255,255,255,0.7)" />
                                            </TouchableOpacity>
                                        );
                                    }
                                    return (
                                        <TouchableOpacity
                                            key={ci}
                                            style={styles.padKey}
                                            onPress={() => handleDigit(key)}
                                            activeOpacity={0.6}
                                            disabled={attempts >= 5}
                                        >
                                            <Text style={styles.padKeyText}>{key}</Text>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        ))}
                    </View>
                )}

                {/* ── Biometric only (no PIN): big button ── */}
                {hasBiometric && !hasPin && (
                    <TouchableOpacity
                        style={[styles.biometricBtn, { borderColor: themeColors.primary }]}
                        onPress={triggerBiometric}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name={biometricType === "face" ? "scan-outline" : "finger-print-outline"}
                            size={32}
                            color={themeColors.primary}
                        />
                        <Text style={[styles.biometricBtnText, { color: themeColors.primary }]}>
                            {biometricType === "face" ? "Authenticate with Face ID" : "Authenticate with Fingerprint"}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* ── Biometric prompt link (when PIN is primary) ── */}
                {hasBiometric && hasPin && (
                    <TouchableOpacity style={styles.bioLink} onPress={triggerBiometric}>
                        <Ionicons
                            name={biometricType === "face" ? "scan-outline" : "finger-print-outline"}
                            size={18}
                            color="rgba(255,255,255,0.5)"
                        />
                        <Text style={styles.bioLinkText}>
                            Use {biometricType === "face" ? "Face ID" : "fingerprint"} instead
                        </Text>
                    </TouchableOpacity>
                )}

                {/* ── Logout link ── */}
                <TouchableOpacity
                    style={styles.logoutLink}
                    onPress={() => {
                        Alert.alert(
                            "Sign out",
                            "You'll need to log in again with your password.",
                            [
                                { text: "Cancel", style: "cancel" },
                                {
                                    text: "Sign out",
                                    style: "destructive",
                                    onPress: () => {
                                        logout();
                                        router.replace("/login");
                                    },
                                },
                            ]
                        );
                    }}
                >
                    <Text style={styles.logoutLinkText}>Sign out instead</Text>
                </TouchableOpacity>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#0F2027",
        alignItems: "center",
        justifyContent: "center",
        paddingBottom: Platform.OS === "android" ? 20 : 40,
    },
    bgTop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: "#0F2027",
    },
    bgBottom: {
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        height: "40%",
        backgroundColor: "#203A43",
        opacity: 0.5,
    },

    /* ── Top ── */
    topSection: {
        alignItems: "center",
        marginBottom: 40,
    },
    iconRing: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: "rgba(74,222,128,0.08)",
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        borderWidth: 1.5,
        borderColor: "rgba(74,222,128,0.2)",
    },
    iconInner: {
        width: 68,
        height: 68,
        borderRadius: 34,
        backgroundColor: "rgba(74,222,128,0.12)",
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 28,
        fontWeight: "800",
        color: "#FFFFFF",
        letterSpacing: -0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: "rgba(255,255,255,0.5)",
        textAlign: "center",
        paddingHorizontal: 40,
    },

    /* ── Dots ── */
    dotsRow: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 10,
    },
    dot: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
    },

    /* ── Error ── */
    errorText: {
        color: "#EF4444",
        fontSize: 13,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 14,
        paddingHorizontal: 30,
    },

    /* ── Numpad ── */
    padGrid: {
        gap: 14,
        width: "100%",
        maxWidth: 300,
        paddingHorizontal: 12,
    },
    padRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 14,
    },
    padKey: {
        flex: 1,
        height: 72,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.06)",
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.08)",
    },
    padKeySpecial: {
        backgroundColor: "transparent",
        borderColor: "transparent",
    },
    padKeyText: {
        fontSize: 26,
        fontWeight: "600",
        color: "#FFFFFF",
        letterSpacing: -0.5,
    },

    /* ── Biometric big btn (no-PIN mode) ── */
    biometricBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 32,
        paddingVertical: 18,
        borderRadius: 22,
        borderWidth: 2,
        marginTop: 10,
    },
    biometricBtnText: {
        fontSize: 16,
        fontWeight: "700",
    },

    /* ── Biometric link (PIN as primary) ── */
    bioLink: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        marginTop: 22,
        paddingVertical: 8,
    },
    bioLinkText: {
        color: "rgba(255,255,255,0.45)",
        fontSize: 13,
        fontWeight: "500",
    },

    /* ── Sign out ── */
    logoutLink: {
        marginTop: 10,
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    logoutLinkText: {
        color: "rgba(255,255,255,0.25)",
        fontSize: 12,
        textDecorationLine: "underline",
    },
});
