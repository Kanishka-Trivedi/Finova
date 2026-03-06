import React, { useState, useContext, useEffect } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    ScrollView,
    Dimensions,
    Share,
    Platform,
    Modal,
    TextInput,
    Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { BASE_URL } from "../config";
import axios from "axios";

const { width } = Dimensions.get("window");

export default function ExpenseDetail() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { userToken } = useContext(AuthContext);
    const { t, themeColors, settings, currencySymbol } = useSettings();

    // Initial state from params
    const [expenseData, setExpenseData] = useState({
        vendorName: params.vendorName,
        totalAmount: Number(params.totalAmount),
        notes: params.notes || "",
        projectTag: params.projectTag || "",
        category: params.category,
        paymentMode: params.paymentMode,
        date: params.date,
        unit: params.unit,
        quantity: Number(params.quantity),
        ratePerUnit: Number(params.ratePerUnit),
        diameter: params.diameter,
    });

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editForm, setEditForm] = useState({ ...expenseData });

    const onShare = async () => {
        try {
            const message = `Expense Receipt\n\nVendor: ${expenseData.vendorName}\nCategory: ${expenseData.category}\nAmount: ${currencySymbol}${expenseData.totalAmount.toLocaleString(settings.language === 'English' ? 'en-US' : 'en-IN')}\nDate: ${expenseData.date}\n\nGenerated via Finova`;
            await Share.share({ message });
        } catch (error) {
            console.log(error.message);
        }
    };

    const handleUpdate = async () => {
        try {
            const res = await axios.patch(
                `${BASE_URL}/expenses/${params._id}`,
                {
                    vendorName: editForm.vendorName,
                    totalAmount: Number(editForm.totalAmount),
                    notes: editForm.notes,
                    projectTag: editForm.projectTag,
                },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );

            setExpenseData({
                ...expenseData,
                vendorName: res.data.vendorName,
                totalAmount: res.data.totalAmount,
                notes: res.data.notes,
                projectTag: res.data.projectTag,
            });

            setIsEditModalVisible(false);
            Alert.alert("Success", "Expense updated successfully");
        } catch (error) {
            console.log("Update error:", error.message);
            Alert.alert("Error", "Failed to update expense");
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-IN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    const DetailItem = ({ icon, label, value, color = "#fff", isLarge = false }) => (
        <View style={styles.detailItem}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
                <Ionicons name={icon} size={22} color={color} />
            </View>
            <View style={styles.detailTextContainer}>
                <Text style={styles.detailLabel}>{label}</Text>
                <Text style={[styles.detailValue, isLarge && styles.largeValue, { color }]}>
                    {value}
                </Text>
            </View>
        </View>
    );

    return (
        <LinearGradient colors={themeColors.background} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                {/* Header Navigation */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.backButton, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
                    >
                        <Ionicons name="chevron-back" size={28} color={themeColors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t('details') || "Details"}</Text>
                    <TouchableOpacity onPress={onShare} style={[styles.shareButton, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
                        <Ionicons name="share-social-outline" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    {/* Hero Section Card */}
                    <LinearGradient
                        colors={settings.theme === 'light' ? ['#FFFFFF', '#F8FAFC'] : ["rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)"]}
                        style={[styles.heroCard, { borderColor: themeColors.border }]}
                    >
                        <View style={styles.categoryBadge}>
                            <Text style={styles.categoryBadgeText}>{expenseData.category}</Text>
                        </View>

                        <Text style={[styles.vendorName, { color: themeColors.text }]}>{expenseData.vendorName}</Text>
                        <View style={styles.amountContainer}>
                            <Text style={styles.currencySymbol}>{currencySymbol}</Text>
                            <Text style={[styles.amountText, { color: themeColors.text }]}>{expenseData.totalAmount.toLocaleString(settings.language === 'English' ? 'en-US' : 'en-IN')}</Text>
                        </View>

                        <View style={styles.statusRow}>
                            <View style={[styles.paymentHighlight, { backgroundColor: settings.theme === 'light' ? '#F0FDF4' : 'rgba(255, 255, 255, 0.04)' }]}>
                                <Ionicons name="card-outline" size={14} color="#4ADE80" />
                                <Text style={styles.paymentMethod}>{expenseData.paymentMode}</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Detailed Stats Grid */}
                    <View style={[styles.statsCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>{t('transaction_summary') || "Transaction Summary"}</Text>

                        <View style={styles.statsGrid}>
                            <DetailItem
                                icon="calendar-outline"
                                label="Transaction Date"
                                value={formatDate(expenseData.date)}
                                color="#38BDF8"
                            />

                            {expenseData.unit !== "None" && (
                                <DetailItem
                                    icon="cube-outline"
                                    label="Quantity/Unit"
                                    value={`${expenseData.quantity} ${expenseData.unit}`}
                                    color="#4ADE80"
                                />
                            )}

                            {expenseData.diameter && (
                                <DetailItem
                                    icon="resize-outline"
                                    label="Size/Diameter"
                                    value={expenseData.diameter}
                                    color="#FACC15"
                                />
                            )}

                            <DetailItem
                                icon="pricetag-outline"
                                label={t('rate_per_unit')}
                                value={`${currencySymbol}${expenseData.ratePerUnit.toLocaleString(settings.language === 'English' ? 'en-US' : 'en-IN')}`}
                                color="#A78BFA"
                            />

                            {expenseData.projectTag && (
                                <DetailItem
                                    icon="business-outline"
                                    label="Project/Site"
                                    value={expenseData.projectTag}
                                    color="#F472B6"
                                />
                            )}
                        </View>

                        {/* Price Calculations */}
                        <View style={[styles.calculationBox, { borderTopColor: themeColors.border }]}>
                            <View style={styles.calcRow}>
                                <Text style={[styles.calcLabel, { color: themeColors.subtext }]}>Base Price</Text>
                                <Text style={[styles.calcValue, { color: themeColors.text }]}>{currencySymbol}{(expenseData.ratePerUnit * (expenseData.quantity || 1)).toLocaleString(settings.language === 'English' ? 'en-US' : 'en-IN', { minimumFractionDigits: 2 })}</Text>
                            </View>
                            <View style={styles.calcRow}>
                                <Text style={[styles.calcLabel, { color: themeColors.subtext }]}>Tax (Inc. GST)</Text>
                                <Text style={[styles.calcValue, { color: themeColors.text }]}>{currencySymbol}{(expenseData.totalAmount - (expenseData.ratePerUnit * (expenseData.quantity || 1))).toLocaleString(settings.language === 'English' ? 'en-US' : 'en-IN', { minimumFractionDigits: 2 })}</Text>
                            </View>
                            <View style={[styles.calcRow, styles.totalRow, { borderTopColor: themeColors.border }]}>
                                <Text style={[styles.totalLabelText, { color: themeColors.text }]}>Net Amount</Text>
                                <Text style={styles.totalValueText}>{currencySymbol}{expenseData.totalAmount.toLocaleString(settings.language === 'English' ? 'en-US' : 'en-IN')}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Notes Section */}
                    {expenseData.notes && (
                        <View style={[styles.notesCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                            <View style={styles.notesHeader}>
                                <Ionicons name="document-text-outline" size={20} color="#4ADE80" />
                                <Text style={[styles.notesTitle, { color: themeColors.text }]}>{t('notes')}</Text>
                            </View>
                            <Text style={[styles.notesBody, { color: themeColors.subtext }]}>{expenseData.notes}</Text>
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionSection}>
                        <TouchableOpacity
                            style={[styles.editButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                            onPress={() => {
                                setEditForm({ ...expenseData });
                                setIsEditModalVisible(true);
                            }}
                        >
                            <Ionicons name="create-outline" size={20} color={themeColors.text} />
                            <Text style={[styles.buttonText, { color: themeColors.text }]}>Edit Entry</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.downloadButton, { backgroundColor: themeColors.primary }]} onPress={onShare}>
                            <Ionicons name="cloud-download-outline" size={20} color={themeColors.tabBar} />
                            <Text style={[styles.buttonText, { color: themeColors.tabBar }]}>Export Receipt</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer - Verification Stamp */}
                    <View style={styles.verificationStamp}>
                        <MaterialCommunityIcons name="shield-check" size={18} color="rgba(74,222,128,0.4)" />
                        <Text style={styles.verificationText}>Digitally Verified Transaction • {params._id?.substring(0, 8)}</Text>
                    </View>
                </ScrollView>

                {/* Edit Modal */}
                <Modal visible={isEditModalVisible} animationType="slide" transparent>
                    <View style={styles.modalOverlay}>
                        <LinearGradient colors={themeColors.background} style={[styles.modalForm, { backgroundColor: themeColors.card }]}>
                            <Text style={[styles.modalTitle, { color: themeColors.text }]}>{t('add_expense_title') || "Edit Expense"}</Text>

                            <Text style={[styles.modalLabel, { color: themeColors.subtext }]}>{t('vendor_name')}</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, color: themeColors.text }]}
                                value={editForm.vendorName}
                                onChangeText={(t) => setEditForm({ ...editForm, vendorName: t })}
                                placeholder="Vendor Name"
                                placeholderTextColor={themeColors.subtext}
                            />

                            <Text style={[styles.modalLabel, { color: themeColors.subtext }]}>{t('total_amount_label')} ({currencySymbol})</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, color: themeColors.text }]}
                                value={editForm.totalAmount.toString()}
                                onChangeText={(t) => setEditForm({ ...editForm, totalAmount: t })}
                                keyboardType="numeric"
                                placeholder="Amount"
                                placeholderTextColor={themeColors.subtext}
                            />

                            <Text style={[styles.modalLabel, { color: themeColors.subtext }]}>{t('project_tag')}</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, color: themeColors.text }]}
                                value={editForm.projectTag}
                                onChangeText={(t) => setEditForm({ ...editForm, projectTag: t })}
                                placeholder="Project Tag"
                                placeholderTextColor={themeColors.subtext}
                            />

                            <Text style={[styles.modalLabel, { color: themeColors.subtext }]}>{t('notes')}</Text>
                            <TextInput
                                style={[styles.modalInput, { height: 80, backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, color: themeColors.text }]}
                                value={editForm.notes}
                                onChangeText={(t) => setEditForm({ ...editForm, notes: t })}
                                multiline
                                placeholder="Notes"
                                placeholderTextColor={themeColors.subtext}
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.cancelBtn, { backgroundColor: themeColors.border }]}
                                    onPress={() => setIsEditModalVisible(false)}
                                >
                                    <Text style={[styles.cancelBtnText, { color: themeColors.text }]}>{t('cancel')}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.saveBtn, { backgroundColor: themeColors.primary }]}
                                    onPress={handleUpdate}
                                >
                                    <Text style={[styles.saveBtnText, { color: themeColors.tabBar }]}>{t('save_changes')}</Text>
                                </TouchableOpacity>
                            </View>
                        </LinearGradient>
                    </View>
                </Modal>
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
        paddingTop: 40,
        paddingBottom: 15,
    },
    headerTitle: {
        color: "white",
        fontSize: 20,
        fontWeight: "bold",
    },
    backButton: {
        padding: 8,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 12,
    },
    shareButton: {
        padding: 10,
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 12,
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    heroCard: {
        borderRadius: 32,
        padding: 30,
        alignItems: "center",
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    categoryBadge: {
        backgroundColor: "rgba(74, 222, 128, 0.2)",
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 100,
        marginBottom: 20,
    },
    categoryBadgeText: {
        color: "#4ADE80",
        fontWeight: "700",
        textTransform: "uppercase",
        fontSize: 12,
        letterSpacing: 1,
    },
    vendorName: {
        fontSize: 28,
        fontWeight: "800",
        color: "white",
        textAlign: "center",
    },
    amountContainer: {
        flexDirection: "row",
        alignItems: "baseline",
        marginTop: 15,
    },
    currencySymbol: {
        color: "#4ADE80",
        fontSize: 52,
        fontWeight: "700",
        marginRight: 6,
    },
    amountText: {
        fontSize: 52,
        fontWeight: "800",
        color: "white",
    },
    statusRow: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 25,
        width: "100%",
        justifyContent: "center",
        gap: 15,
    },
    paymentHighlight: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.08)",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "rgba(74, 222, 128, 0.3)",
        gap: 6,
    },
    paymentMethod: {
        color: "#4ADE80",
        fontSize: 14,
        fontWeight: "600",
    },
    statsCard: {
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 28,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    sectionTitle: {
        color: "white",
        fontSize: 17,
        fontWeight: "700",
        marginBottom: 20,
    },
    statsGrid: {
        gap: 18,
    },
    detailItem: {
        flexDirection: "row",
        alignItems: "center",
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    detailTextContainer: {
        marginLeft: 15,
        flex: 1,
    },
    detailLabel: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 12,
        textTransform: "uppercase",
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: "600",
    },
    calculationBox: {
        marginTop: 25,
        paddingTop: 25,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.1)",
    },
    calcRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    calcLabel: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 14,
    },
    calcValue: {
        color: "white",
        fontSize: 14,
        fontWeight: "600",
    },
    totalRow: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.05)",
    },
    totalLabelText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
    totalValueText: {
        color: "#4ADE80",
        fontSize: 20,
        fontWeight: "800",
    },
    notesCard: {
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 24,
        padding: 20,
        marginBottom: 30,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.05)",
    },
    notesHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    notesTitle: {
        color: "white",
        fontSize: 15,
        fontWeight: "600",
        marginLeft: 10,
    },
    notesBody: {
        color: "rgba(255,255,255,0.7)",
        fontSize: 14,
        lineHeight: 22,
    },
    actionSection: {
        flexDirection: "row",
        gap: 15,
    },
    editButton: {
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.1)",
        height: 56,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.1)",
    },
    downloadButton: {
        flex: 1,
        backgroundColor: "#4ADE80",
        height: 56,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        fontWeight: "700",
    },
    verificationStamp: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 30,
        opacity: 0.6,
    },
    verificationText: {
        color: "rgba(255,255,255,0.4)",
        fontSize: 11,
        marginLeft: 6,
        letterSpacing: 0.5,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "flex-end",
    },
    modalForm: {
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: 24,
        paddingBottom: 50,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "700",
        color: "white",
        marginBottom: 20,
    },
    modalLabel: {
        color: "rgba(255,255,255,0.6)",
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 8,
        textTransform: "uppercase",
    },
    modalInput: {
        backgroundColor: "rgba(255,255,255,0.1)",
        borderRadius: 16,
        padding: 16,
        color: "white",
        fontSize: 16,
        marginBottom: 20,
    },
    modalActions: {
        flexDirection: "row",
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgba(255,255,255,0.1)",
    },
    cancelBtnText: {
        color: "white",
        fontSize: 16,
        fontWeight: "600",
    },
    saveBtn: {
        flex: 2,
        height: 56,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#4ADE80",
    },
    saveBtnText: {
        color: "#0F2027",
        fontSize: 16,
        fontWeight: "700",
    },
});
