import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    Platform,
    ActivityIndicator,
    Alert
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSettings } from "../context/SettingsContext";

const PreferenceItem = ({ icon, label, sublabel, children, color = "#4ADE80", themeColors }) => (
    <View style={[styles.preferenceCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.cardInfo}>
            <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={styles.textContainer}>
                <Text style={[styles.prefLabel, { color: themeColors.text }]}>{label}</Text>
                {sublabel && <Text style={[styles.prefSublabel, { color: themeColors.subtext }]}>{sublabel}</Text>}
            </View>
        </View>
        <View style={styles.controlBox}>
            {children}
        </View>
    </View>
);

const Selector = ({ options, selected, onSelect, themeColors }) => (
    <View style={styles.selectorGrid}>
        {options.map((opt) => (
            <TouchableOpacity
                key={opt.value}
                style={[
                    styles.chip,
                    { backgroundColor: themeColors.border },
                    selected === opt.value && { backgroundColor: themeColors.primary }
                ]}
                onPress={() => onSelect(opt.value)}
            >
                <Text style={[
                    styles.chipText,
                    { color: themeColors.subtext },
                    selected === opt.value && { color: themeColors.tabBar, fontWeight: "700" }
                ]}>
                    {opt.label}
                </Text>
            </TouchableOpacity>
        ))}
    </View>
);

export default function Preferences() {
    const router = useRouter();
    const { settings, applySettings, t, themeColors } = useSettings();
    const [localSettings, setLocalSettings] = useState(settings);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        setLocalSettings(settings);
    }, [settings]);

    const handleApply = async () => {
        setSaving(true);
        try {
            await applySettings(localSettings);
            Alert.alert(t('success'), t('pref_updated'));
        } catch (e) {
            Alert.alert(t('error'), t('fail_save'));
        } finally {
            setSaving(false);
        }
    };

    const updateSetting = (key, value) => {
        setLocalSettings({ ...localSettings, [key]: value });
    };

    return (
        <LinearGradient colors={themeColors.background} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: themeColors.border }]}>
                        <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t('app_settings')}</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: themeColors.subtext }]}>{t('localization')}</Text>

                        <PreferenceItem
                            icon="cash-outline"
                            label={t('default_currency')}
                            sublabel={`${t('current')}: ${localSettings.currency === 'INR' ? '₹' : '$'}`}
                            themeColors={themeColors}
                        >
                            <Selector
                                selected={localSettings.currency}
                                onSelect={(val) => updateSetting("currency", val)}
                                themeColors={themeColors}
                                options={[
                                    { label: "INR (₹)", value: "INR" },
                                    { label: "USD ($)", value: "USD" }
                                ]}
                            />
                        </PreferenceItem>

                        <PreferenceItem
                            icon="language-outline"
                            label={t('app_language')}
                            color="#38BDF8"
                            themeColors={themeColors}
                        >
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalSelector}>
                                <Selector
                                    selected={localSettings.language}
                                    onSelect={(val) => updateSetting("language", val)}
                                    themeColors={themeColors}
                                    options={[
                                        { label: "English", value: "English" },
                                        { label: "Hindi", value: "Hindi" },
                                        { label: "Marathi", value: "Marathi" },
                                        { label: "Gujarati", value: "Gujarati" },
                                        { label: "Tamil", value: "Tamil" }
                                    ]}
                                />
                            </ScrollView>
                        </PreferenceItem>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: themeColors.subtext }]}>{t('formatting_defaults')}</Text>

                        <PreferenceItem
                            icon="calendar-outline"
                            label={t('date_format')}
                            color="#FACC15"
                            themeColors={themeColors}
                        >
                            <Selector
                                selected={localSettings.dateFormat}
                                onSelect={(val) => updateSetting("dateFormat", val)}
                                themeColors={themeColors}
                                options={[
                                    { label: "DD/MM/YYYY", value: "DD/MM/YYYY" },
                                    { label: "MM/DD/YYYY", value: "MM/DD/YYYY" }
                                ]}
                            />
                        </PreferenceItem>

                        <PreferenceItem
                            icon="card-outline"
                            label={t('default_payment')}
                            color="#A78BFA"
                            themeColors={themeColors}
                        >
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalSelector}>
                                <Selector
                                    selected={localSettings.defaultPaymentMode}
                                    onSelect={(val) => updateSetting("defaultPaymentMode", val)}
                                    themeColors={themeColors}
                                    options={[
                                        { label: "Cash", value: "Cash" },
                                        { label: "UPI", value: "UPI" },
                                        { label: "Card", value: "Card" },
                                        { label: "Cheque", value: "Cheque" }
                                    ]}
                                />
                            </ScrollView>
                        </PreferenceItem>
                    </View>

                    <View style={styles.section}>
                        <Text style={[styles.sectionTitle, { color: themeColors.subtext }]}>{t('appearance')}</Text>

                        <PreferenceItem
                            icon="moon-outline"
                            label={t('theme_mode')}
                            color="#F472B6"
                            themeColors={themeColors}
                        >
                            <Selector
                                selected={localSettings.theme}
                                onSelect={(val) => updateSetting("theme", val)}
                                themeColors={themeColors}
                                options={[
                                    { label: "Light", value: "light" },
                                    { label: "Dark", value: "dark" }
                                ]}
                            />
                        </PreferenceItem>
                    </View>

                    <TouchableOpacity
                        style={[styles.applyButton, { backgroundColor: themeColors.primary }]}
                        onPress={handleApply}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color={themeColors.tabBar} />
                        ) : (
                            <Text style={[styles.applyButtonText, { color: themeColors.tabBar }]}>{t('confirm_apply')}</Text>
                        )}
                    </TouchableOpacity>

                    <View style={[styles.infoBox, { backgroundColor: themeColors.card }]}>
                        <Ionicons name="information-circle-outline" size={20} color={themeColors.subtext} />
                        <Text style={[styles.infoText, { color: themeColors.subtext }]}>{t('confirm_apply_info')}</Text>
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
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? 40 : 10,
        paddingBottom: 15,
        gap: 16,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "800",
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 2,
        marginBottom: 16,
        marginLeft: 4,
    },
    preferenceCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    cardInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 20,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    textContainer: {
        marginLeft: 15,
        flex: 1,
    },
    prefLabel: {
        fontSize: 16,
        fontWeight: "700",
    },
    prefSublabel: {
        fontSize: 12,
        marginTop: 3,
        opacity: 0.7,
    },
    controlBox: {
        marginTop: 5,
    },
    selectorGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
    },
    horizontalSelector: {
        marginLeft: -5,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 13,
        fontWeight: "600",
    },
    applyButton: {
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: "center",
        marginBottom: 20,
        elevation: 6,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 15,
    },
    applyButtonText: {
        fontSize: 16,
        fontWeight: "800",
        letterSpacing: 1,
    },
    infoBox: {
        flexDirection: "row",
        padding: 18,
        borderRadius: 20,
        alignItems: "center",
        gap: 12,
        borderWidth: 1,
        borderStyle: "dashed",
    },
    infoText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
        fontWeight: "500",
    }
});
