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
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSettings } from "../context/SettingsContext";
import { StatusBar } from "react-native";

const SectionHeader = ({ title, icon, iconColor, themeColors }) => (
    <View style={[styles.sectionHeader, { borderColor: themeColors.border }]}>
        <View style={[styles.sectionIconWrap, { backgroundColor: `${iconColor}18` }]}>
            <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={[styles.sectionTitle, { color: themeColors.subtext }]}>{title}</Text>
    </View>
);

const PreferenceItem = ({ icon, label, sublabel, children, color = "#4ADE80", themeColors, noBorder }) => (
    <View style={[styles.row, { borderBottomColor: themeColors.border }, noBorder && { borderBottomWidth: 0 }]}>
        <View style={{ flex: 1 }}>
            <View style={styles.cardInfo}>
                <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
                    <Ionicons name={icon} size={20} color={color} />
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
                <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.backBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                    >
                        <Ionicons name="chevron-back" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t('app_settings')}</Text>
                        <Text style={[styles.headerSub, { color: themeColors.subtext }]}>Personalize your experience</Text>
                    </View>
                    <View style={{ width: 44 }}>
                        {saving && <ActivityIndicator size="small" color={themeColors.primary} />}
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    <SectionHeader title="LOCALIZATION" icon="globe-outline" iconColor="#4ADE80" themeColors={themeColors} />
                    <View style={[styles.card, { backgroundColor: settings.theme === "light" ? themeColors.card : "#1A2B32", borderColor: themeColors.border }]}>
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

                        {localSettings.currency === "USD" && (
                            <View style={[styles.infoBox, { marginVertical: 16, borderStyle: 'solid', borderColor: themeColors.primary + '30' }]}>
                                <Ionicons name="swap-horizontal" size={20} color={themeColors.primary} />
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.infoText, { color: themeColors.text, fontWeight: '700' }]}>
                                        Exchange Rate: 1 USD = {localSettings.exchangeRate || 92.59} INR
                                    </Text>
                                    <Text style={[styles.infoText, { color: themeColors.subtext, fontSize: 10 }]}>
                                        All your data is stored in INR and converted for display.
                                    </Text>
                                </View>
                            </View>
                        )}

                        <PreferenceItem
                            icon="language-outline"
                            label={t('app_language')}
                            color="#38BDF8"
                            themeColors={themeColors}
                            noBorder
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

                    <SectionHeader title="FORMATTING DEFAULTS" icon="calendar-outline" iconColor="#FACC15" themeColors={themeColors} />
                    <View style={[styles.card, { backgroundColor: settings.theme === "light" ? themeColors.card : "#1A2B32", borderColor: themeColors.border }]}>
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
                            noBorder
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

                    <SectionHeader title="APPEARANCE" icon="color-palette-outline" iconColor="#F472B6" themeColors={themeColors} />
                    <View style={[styles.card, { backgroundColor: settings.theme === "light" ? themeColors.card : "#1A2B32", borderColor: themeColors.border }]}>
                        <PreferenceItem
                            icon="moon-outline"
                            label={t('theme_mode')}
                            color="#F472B6"
                            themeColors={themeColors}
                            noBorder
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
        paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 40) + 10 : 10,
        paddingBottom: 20,
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
    headerTitle: {
        fontSize: 22,
        fontWeight: "800",
    },
    headerSub: {
        fontSize: 12,
        marginTop: 2,
        fontWeight: "500",
    },
    scrollContent: {
        padding: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 30,
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
    },
    sectionIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    card: {
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 8,
        marginBottom: 24,
        borderWidth: 1,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    row: {
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    cardInfo: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 16,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: "center",
        alignItems: "center",
    },
    textContainer: {
        marginLeft: 15,
        flex: 1,
    },
    prefLabel: {
        fontSize: 15,
        fontWeight: "700",
    },
    prefSublabel: {
        fontSize: 11,
        marginTop: 2,
        opacity: 0.7,
    },
    controlBox: {
        marginTop: 2,
    },
    selectorGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    horizontalSelector: {
        marginLeft: -2,
    },
    chip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
    },
    chipText: {
        fontSize: 12,
        fontWeight: "600",
    },
    applyButton: {
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: "center",
        marginTop: 10,
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
