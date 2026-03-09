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
    SafeAreaView
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { BASE_URL } from "../config";
import { Ionicons } from "@expo/vector-icons";

const ProfileField = ({ icon, label, value, field, keyboardType = "default", multiline = false, isEditing, form, setForm, themeColors }) => (
    <View style={[styles.fieldCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
        <View style={styles.fieldHeader}>
            <Ionicons name={icon} size={18} color={themeColors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>{label}</Text>
        </View>
        {isEditing ? (
            <TextInput
                style={[styles.input, { color: themeColors.text, borderBottomColor: themeColors.border }, multiline && { height: 80, textAlignVertical: "top" }]}
                value={value}
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
);

export default function Info() {
    const { userToken } = useContext(AuthContext);
    const { t, themeColors } = useSettings();
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
                    <View style={styles.header}>
                        <TouchableOpacity onPress={() => router.back()} style={[styles.backButton, { backgroundColor: themeColors.border }]}>
                            <Ionicons name="arrow-back" size={24} color={themeColors.text} />
                        </TouchableOpacity>
                        <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t('builder_details')}</Text>
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

                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>Business Details</Text>
                            <ProfileField themeColors={themeColors} icon="person-outline" label="Builder Full Name" value={form.name} field="name" isEditing={isEditing} form={form} setForm={setForm} />
                            <ProfileField themeColors={themeColors} icon="business-outline" label="Firm/Company Name" value={form.firmName} field="firmName" isEditing={isEditing} form={form} setForm={setForm} />

                            <View style={[styles.fieldCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                                <View style={styles.fieldHeader}>
                                    <Ionicons name="briefcase-outline" size={18} color={themeColors.primary} style={{ marginRight: 8 }} />
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

                            <ProfileField themeColors={themeColors} icon="calendar-outline" label="Years in Business" value={form.yearsInBusiness} field="yearsInBusiness" keyboardType="numeric" isEditing={isEditing} form={form} setForm={setForm} />
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>Verification</Text>
                            <ProfileField themeColors={themeColors} icon="document-text-outline" label="GST Number" value={form.gstNumber} field="gstNumber" isEditing={isEditing} form={form} setForm={setForm} />
                            <ProfileField themeColors={themeColors} icon="card-outline" label="PAN Number" value={form.panNumber} field="panNumber" isEditing={isEditing} form={form} setForm={setForm} />
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>Location & Sites</Text>
                            <ProfileField themeColors={themeColors} icon="location-outline" label="Registered Address" value={form.registeredAddress} field="registeredAddress" multiline isEditing={isEditing} form={form} setForm={setForm} />
                            <ProfileField themeColors={themeColors} icon="map-outline" label="Pincode" value={form.pincode} field="pincode" keyboardType="numeric" isEditing={isEditing} form={form} setForm={setForm} />
                            <ProfileField themeColors={themeColors} icon="construct-outline" label="Active Site Location" value={form.siteLocation} field="siteLocation" isEditing={isEditing} form={form} setForm={setForm} />
                        </View>

                        <View style={styles.section}>
                            <Text style={[styles.sectionTitle, { color: themeColors.primary }]}>Contact Info</Text>
                            <ProfileField themeColors={themeColors} icon="call-outline" label="Primary Phone" value={form.primaryPhone} field="primaryPhone" keyboardType="phone-pad" isEditing={isEditing} form={form} setForm={setForm} />
                            <ProfileField themeColors={themeColors} icon="call-outline" label="Alternate Phone" value={form.alternatePhone} field="alternatePhone" keyboardType="phone-pad" isEditing={isEditing} form={form} setForm={setForm} />
                            <ProfileField themeColors={themeColors} icon="globe-outline" label="Website" value={form.website} field="website" keyboardType="url" isEditing={isEditing} form={form} setForm={setForm} />
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
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? 40 : 10,
        paddingBottom: 15,
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
        fontSize: 20,
        fontWeight: "800",
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
        padding: 20,
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
    fieldCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 16,
        borderWidth: 1,
    },
    fieldHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    fieldLabel: {
        fontSize: 11,
        fontWeight: "700",
        textTransform: "uppercase",
        letterSpacing: 1,
        opacity: 0.6,
    },
    fieldValue: {
        fontSize: 16,
        fontWeight: "600",
    },
    input: {
        fontSize: 16,
        padding: 0,
        borderBottomWidth: 1.5,
        paddingBottom: 6,
        fontWeight: "600",
    },
    typeGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginTop: 10,
    },
    typeChip: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "transparent",
    },
    typeChipText: {
        fontSize: 13,
        fontWeight: "600",
    },
    cancelGlobalBtn: {
        padding: 18,
        borderRadius: 20,
        alignItems: "center",
        borderWidth: 1,
        marginTop: 10,
    },
    cancelGlobalBtnText: {
        fontWeight: "800",
        fontSize: 15,
    }
});
