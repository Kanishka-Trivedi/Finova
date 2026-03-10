import React, { useContext, useEffect, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    Image,
    ActivityIndicator,
    Alert,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    StatusBar,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { BASE_URL } from "../config";
import { Ionicons } from "@expo/vector-icons";

const SectionHeader = ({ title, icon, iconColor, themeColors }) => (
    <View style={[styles.sectionHeader, { borderColor: themeColors.border }]}>
        <View style={[styles.sectionIconWrap, { backgroundColor: `${iconColor}18` }]}>
            <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={[styles.sectionTitle, { color: themeColors.subtext }]}>{title}</Text>
    </View>
);

const ProfileField = ({ icon, label, value, field, keyboardType = "default", multiline = false, isEditing, form, setForm, themeColors, noBorder }) => (
    <View style={[styles.row, { borderBottomColor: themeColors.border }, noBorder && { borderBottomWidth: 0 }]}>
        <View style={{ flex: 1 }}>
            <View style={styles.fieldHeader}>
                <Ionicons name={icon} size={16} color={themeColors.subtext} style={{ marginRight: 8 }} />
                <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>{label}</Text>
            </View>
            {isEditing ? (
                <TextInput
                    style={[styles.input, { color: themeColors.text, backgroundColor: themeColors.border + '40', borderRadius: 12, paddingHorizontal: 12, marginTop: 8 }, multiline && { height: 80, textAlignVertical: "top", paddingTop: 10 }]}
                    value={String(value)}
                    onChangeText={(text) => setForm({ ...form, [field]: text })}
                    keyboardType={keyboardType}
                    multiline={multiline}
                    placeholder={`Enter ${label}`}
                    placeholderTextColor={themeColors.subtext}
                />
            ) : (
                <Text style={[styles.fieldValue, { color: themeColors.text }]}>{value || `Not specified`}</Text>
            )}
        </View>
    </View>
);

export default function Info() {
    const { userToken } = useContext(AuthContext);
    const { t, themeColors, settings } = useSettings();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    const [form, setForm] = useState({
        name: "",
        firmName: "",
        gstNumber: "",
        panNumber: "",
        businessType: "Other",
        yearsInBusiness: "0",
        registeredAddress: "",
        pincode: "",
        siteLocation: "",
        primaryPhone: "",
        alternatePhone: "",
        website: "",
        profilePhoto: "",
    });

    const businessTypes = ["Proprietorship", "Partnership", "Pvt Ltd", "Public Ltd", "Other"];

    useEffect(() => {
        fetchProfile();
    }, [userToken]);

    const fetchProfile = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/auth/profile`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            setUserData(res.data);
            setForm({
                name: res.data.name || "",
                firmName: res.data.firmName || "",
                gstNumber: res.data.gstNumber || "",
                panNumber: res.data.panNumber || "",
                businessType: res.data.businessType || "Other",
                yearsInBusiness: String(res.data.yearsInBusiness || 0),
                registeredAddress: res.data.registeredAddress || "",
                pincode: res.data.pincode || "",
                siteLocation: res.data.siteLocation || "",
                primaryPhone: res.data.primaryPhone || "",
                alternatePhone: res.data.alternatePhone || "",
                website: res.data.website || "",
                profilePhoto: res.data.profilePhoto || "",
            });
        } catch (error) {
            console.log("Error fetching profile", error);
        } finally {
            setLoading(false);
        }
    };

    const validateGST = (gst) => {
        if (!gst) return true;
        const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        return regex.test(gst);
    };

    const handleUpdate = async () => {
        if (!form.name || !form.primaryPhone) {
            Alert.alert("Required Fields", "Please fill in your full name and primary phone number.");
            return;
        }

        if (form.gstNumber && !validateGST(form.gstNumber)) {
            Alert.alert("Invalid GST", "Please enter a valid GST number format.");
            return;
        }

        setSaving(true);
        try {
            const res = await axios.put(
                `${BASE_URL}/api/auth/profile`,
                { ...form, yearsInBusiness: Number(form.yearsInBusiness) },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );
            setUserData(res.data);
            setIsEditing(false);
            Alert.alert("Success", "Profile updated successfully!");
        } catch (error) {
            console.log("Update Error", error);
            Alert.alert("Error", "Failed to update profile.");
        } finally {
            setSaving(false);
        }
    };

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
                <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
                    <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
                        <TouchableOpacity
                            onPress={() => router.back()}
                            style={[styles.backBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                        >
                            <Ionicons name="chevron-back" size={24} color={themeColors.text} />
                        </TouchableOpacity>
                        <View style={{ flex: 1, marginLeft: 16 }}>
                            <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t('builder_details')}</Text>
                            <Text style={[styles.headerSub, { color: themeColors.subtext }]}>Manage your business profile</Text>
                        </View>
                        <TouchableOpacity
                            onPress={isEditing ? handleUpdate : () => setIsEditing(true)}
                            style={[styles.editHeaderBtn, { backgroundColor: themeColors.primary }]}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator size="small" color={themeColors.tabBar} />
                            ) : (
                                <Text style={[styles.editHeaderText, { color: themeColors.tabBar }]}>{isEditing ? "Save" : "Edit"}</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                        <SectionHeader title="BUSINESS DETAILS" icon="business-outline" iconColor="#4ADE80" themeColors={themeColors} />
                        <View style={[styles.card, { backgroundColor: settings.theme === "light" ? themeColors.card : "#1A2B32", borderColor: themeColors.border }]}>
                            <ProfileField themeColors={themeColors} icon="person-outline" label="Builder Full Name" value={form.name} field="name" isEditing={isEditing} form={form} setForm={setForm} />
                            <ProfileField themeColors={themeColors} icon="business-outline" label="Firm/Company Name" value={form.firmName} field="firmName" isEditing={isEditing} form={form} setForm={setForm} />

                            <View style={styles.row}>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.fieldHeader}>
                                        <Ionicons name="briefcase-outline" size={16} color={themeColors.subtext} style={{ marginRight: 8 }} />
                                        <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>Business Type</Text>
                                    </View>
                                    {isEditing ? (
                                        <View style={styles.typeGrid}>
                                            {businessTypes.map(type => (
                                                <TouchableOpacity
                                                    key={type}
                                                    onPress={() => setForm({ ...form, businessType: type })}
                                                    style={[styles.typeChip, { backgroundColor: themeColors.border }, form.businessType === type && { backgroundColor: themeColors.primary }]}
                                                >
                                                    <Text style={[styles.typeChipText, { color: themeColors.subtext }, form.businessType === type && { color: themeColors.tabBar, fontWeight: "700" }]}>{type}</Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    ) : (
                                        <Text style={[styles.fieldValue, { color: themeColors.text }]}>{form.businessType}</Text>
                                    )}
                                </View>
                            </View>

                            <ProfileField themeColors={themeColors} icon="calendar-outline" label="Years in Business" value={form.yearsInBusiness} field="yearsInBusiness" keyboardType="numeric" isEditing={isEditing} form={form} setForm={setForm} noBorder />
                        </View>

                        <SectionHeader title="VERIFICATION" icon="document-text-outline" iconColor="#FACC15" themeColors={themeColors} />
                        <View style={[styles.card, { backgroundColor: settings.theme === "light" ? themeColors.card : "#1A2B32", borderColor: themeColors.border }]}>
                            <ProfileField themeColors={themeColors} icon="document-text-outline" label="GST Number" value={form.gstNumber} field="gstNumber" isEditing={isEditing} form={form} setForm={setForm} />
                            <ProfileField themeColors={themeColors} icon="card-outline" label="PAN Number" value={form.panNumber} field="panNumber" isEditing={isEditing} form={form} setForm={setForm} noBorder />
                        </View>

                        <SectionHeader title="LOCATION & SITES" icon="location-outline" iconColor="#38BDF8" themeColors={themeColors} />
                        <View style={[styles.card, { backgroundColor: settings.theme === "light" ? themeColors.card : "#1A2B32", borderColor: themeColors.border }]}>
                            <ProfileField themeColors={themeColors} icon="location-outline" label="Registered Address" value={form.registeredAddress} field="registeredAddress" multiline isEditing={isEditing} form={form} setForm={setForm} />
                            <ProfileField themeColors={themeColors} icon="map-outline" label="Pincode" value={form.pincode} field="pincode" keyboardType="numeric" isEditing={isEditing} form={form} setForm={setForm} />
                            <ProfileField themeColors={themeColors} icon="construct-outline" label="Active Site Location" value={form.siteLocation} field="siteLocation" isEditing={isEditing} form={form} setForm={setForm} noBorder />
                        </View>

                        <SectionHeader title="CONTACT INFO" icon="call-outline" iconColor="#A78BFA" themeColors={themeColors} />
                        <View style={[styles.card, { backgroundColor: settings.theme === "light" ? themeColors.card : "#1A2B32", borderColor: themeColors.border }]}>
                            <ProfileField themeColors={themeColors} icon="call-outline" label="Primary Phone" value={form.primaryPhone} field="primaryPhone" keyboardType="phone-pad" isEditing={isEditing} form={form} setForm={setForm} />
                            <ProfileField themeColors={themeColors} icon="call-outline" label="Alternate Phone" value={form.alternatePhone} field="alternatePhone" keyboardType="phone-pad" isEditing={isEditing} form={form} setForm={setForm} />
                            <ProfileField themeColors={themeColors} icon="globe-outline" label="Website" value={form.website} field="website" keyboardType="url" isEditing={isEditing} form={form} setForm={setForm} noBorder />
                        </View>

                        {isEditing && (
                            <TouchableOpacity style={[styles.cancelGlobalBtn, { borderColor: `${themeColors.danger}40`, backgroundColor: `${themeColors.danger}10` }]} onPress={() => { setIsEditing(false); fetchProfile(); }}>
                                <Text style={[styles.cancelGlobalBtnText, { color: themeColors.danger }]}>Discard Changes</Text>
                            </TouchableOpacity>
                        )}

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
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
    editHeaderBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 14,
        elevation: 2,
    },
    editHeaderText: {
        fontWeight: "700",
        fontSize: 14,
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
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    fieldHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 4,
    },
    fieldLabel: {
        fontSize: 10,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 1,
    },
    fieldValue: {
        fontSize: 16,
        fontWeight: "600",
        marginTop: 2,
    },
    input: {
        fontSize: 16,
        paddingVertical: 12,
        fontWeight: "600",
    },
    typeGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
        marginTop: 12,
    },
    typeChip: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "transparent",
    },
    typeChipText: {
        fontSize: 12,
        fontWeight: "600",
    },
    cancelGlobalBtn: {
        padding: 18,
        borderRadius: 20,
        alignItems: "center",
        borderWidth: 1,
        marginTop: 10,
        marginBottom: 30,
    },
    cancelGlobalBtnText: {
        fontWeight: "800",
        fontSize: 15,
    }
});
