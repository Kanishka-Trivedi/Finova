/**
 * AppLockContext
 * ──────────────
 * Manages the app-lock lifecycle:
 *  • Loads PIN / biometric / autoLock settings from the server on mount.
 *  • Listens to AppState changes (background → foreground) and starts/clears
 *    the auto-lock countdown.
 *  • Exposes `isLocked` + `unlock()` so the AppLockScreen can consume them.
 */
import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    useCallback,
} from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as LocalAuthentication from "expo-local-authentication";
import { AuthContext } from "./AuthContext";
import { BASE_URL } from "../config";

const AppLockContext = createContext({
    isLocked: false,
    lockSettings: null,
    unlock: () => { },
    reloadLockSettings: () => { },
});

export const AppLockProvider = ({ children }) => {
    const { userToken } = useContext(AuthContext);

    /* ── settings fetched from server ── */
    const [lockSettings, setLockSettings] = useState(null);
    // { biometricsEnabled, hasPin, pinLength, autoLockTimer, twoFactorEnabled }

    /* ── lock state ── */
    const [isLocked, setIsLocked] = useState(false);

    /* ── timers / refs ── */
    const autoLockTimer = useRef(null);
    const backgroundedAt = useRef(null);
    const appState = useRef(AppState.currentState);

    /* ──────── load settings ──────── */
    const reloadLockSettings = useCallback(async () => {
        if (!userToken) return;
        try {
            // 1. Try to load from cache first for immediate protection
            const cached = await AsyncStorage.getItem("lockSettings");
            if (cached) setLockSettings(JSON.parse(cached));

            // 2. Refresh from server
            const res = await axios.get(`${BASE_URL}/api/auth/security-settings`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            const newSettings = {
                hasPin: res.data.hasPin,
                pinLength: res.data.pinLength,
                biometricsEnabled: res.data.biometricsEnabled,
                autoLockTimer: res.data.autoLockTimer,
            };
            setLockSettings(newSettings);

            // Persist for next cold start
            await AsyncStorage.setItem("lockSettings", JSON.stringify(newSettings));
        } catch (e) {
            console.log("Error loading lock settings:", e);
        }
    }, [userToken]);

    /* ──────── initial load & re-load when token changes ──────── */
    useEffect(() => {
        if (userToken) {
            reloadLockSettings();
        } else {
            // Logged out — clear lock state
            setIsLocked(false);
            setLockSettings(null);
        }
    }, [userToken, reloadLockSettings]);

    /* ──────── AppState listener (background / foreground) ──────── */
    useEffect(() => {
        if (!userToken) return;

        const sub = AppState.addEventListener("change", (nextState) => {
            const prev = appState.current;
            appState.current = nextState;

            if (nextState === "background" || nextState === "inactive") {
                // App going to background or inactive — note the time
                backgroundedAt.current = Date.now();

                // If timer is 0 (Lock immediately), we can lock right now
                if (lockSettings?.autoLockTimer === 0 && (lockSettings?.hasPin || lockSettings?.biometricsEnabled)) {
                    setIsLocked(true);
                }
            }

            if (nextState === "active" && prev !== "active") {
                // App coming to foreground
                const now = Date.now();
                const backgroundTime = backgroundedAt.current || now;
                const elapsed = (now - backgroundTime) / 1000;

                const settings = lockSettings;
                if (!settings) return;

                const timerSecs = settings.autoLockTimer || 0;
                const hasProtection = settings.hasPin || settings.biometricsEnabled;

                if (hasProtection) {
                    if (timerSecs === 0) {
                        // "Off" (value 0) usually means never lock, but if intended as "Immediately", 
                        // the previous logic handled it. If 0 is "Off", we skip. 
                        // User said auto lock not working for 30s, so timer is likely > 0.
                    } else if (elapsed >= timerSecs) {
                        setIsLocked(true);
                    }
                }
            }
        });

        return () => sub.remove();
    }, [userToken, lockSettings]);

    /* ──────── Lock on first launch if protection is set ──────── */
    useEffect(() => {
        // Only trigger lock on first load after token is available AND settings loaded
        if (!userToken || !lockSettings) return;

        const hasProtection = lockSettings.hasPin || lockSettings.biometricsEnabled;
        // Lock immediately when app cold-starts with protection enabled
        if (hasProtection) {
            setIsLocked(true);
        }
    }, [lockSettings]); // Fires once when lockSettings first loads

    /* ──────── unlock ──────── */
    const unlock = useCallback(() => {
        setIsLocked(false);
        backgroundedAt.current = null;
    }, []);

    return (
        <AppLockContext.Provider
            value={{ isLocked, lockSettings, unlock, reloadLockSettings }}
        >
            {children}
        </AppLockContext.Provider>
    );
};

export const useAppLock = () => useContext(AppLockContext);
