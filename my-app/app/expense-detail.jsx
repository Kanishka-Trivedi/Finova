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
    BackHandler,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useData } from "../context/DataContext";
import { BASE_URL } from "../config";
import axios from "axios";

const { width } = Dimensions.get("window");

export default function ExpenseDetail() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { userToken } = useContext(AuthContext);
    const { t, themeColors, settings, currencySymbol, formatAmount, convertToDisplay, convertToBase, formatDate } = useSettings();
    const { refreshSilently } = useData();

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

    const categoryColors = {
        Cement: "#34D399", Steel: "#38BDF8", Sand: "#FBBF24", Bricks: "#F87171",
        Aggregate: "#A78BFA", Plumbing: "#2DD4BF", Granite: "#FB923C", Marble: "#818CF8",
        Tiles: "#F472B6", Color: "#4ADE80", Block: "#E879F9", Labor: "#22D3EE",
        Equipment: "#FACC15", Transport: "#6366F1", Miscellaneous: "#14B8A6",
    };
    const categoriesWithoutUnits = ["Labor", "Equipment", "Plumbing", "Miscellaneous"];
    const catColor = categoryColors[expenseData.category] || "#5B8A72";
    const isNoUnitCat = categoriesWithoutUnits.includes(expenseData.category);

    const [editForm, setEditForm] = useState({
        ...expenseData,
        totalAmount: convertToDisplay(expenseData.totalAmount).toString()
    });
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);

    useEffect(() => {
        const backAction = () => {
            if (isEditModalVisible) {
                setIsEditModalVisible(false);
                return true;
            }
            router.back();
            return true;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, [isEditModalVisible]);

    const onShare = async () => {
        try {
            const message = `Expense Receipt\n\nVendor: ${expenseData.vendorName}\nCategory: ${expenseData.category}\nAmount: ${formatAmount(expenseData.totalAmount)}\nDate: ${expenseData.date}\n\nGenerated via Finova`;
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
                    totalAmount: convertToBase(editForm.totalAmount),
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
            refreshSilently(); // Update central store
            Alert.alert("Success", "Expense updated successfully");
        } catch (error) {
            console.log("Update error:", error.message);
            Alert.alert("Error", "Failed to update expense");
        }
    };



    const DetailItem = ({ icon, label, value, color = "#fff", isLarge = false }) => (
        <View style={styles.detailItem}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}16` }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={styles.detailTextContainer}>
                <View style={styles.labelRow}>
                    <Text style={[styles.detailLabel, { color: themeColors.subtext }]}>{label}</Text>
                </View>
                <Text style={[styles.detailValue, isLarge && styles.largeValue, { color: themeColors.text }]}>
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
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>Details</Text>
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
                        <View style={[styles.categoryBadge, { backgroundColor: `${catColor}18` }]}>
                            <Text style={[styles.categoryBadgeText, { color: catColor }]}>{expenseData.category}</Text>
                        </View>

                        <Text style={[styles.vendorName, { color: themeColors.text }]}>{expenseData.vendorName}</Text>
                        <View style={styles.amountContainer}>
                            <Text style={[styles.amountText, { color: "#5B8A72" }]}>{formatAmount(expenseData.totalAmount)}</Text>
                        </View>

                        <View style={styles.statusRow}>
                            <View style={[styles.paymentHighlight, { backgroundColor: `${catColor}10`, borderColor: `${catColor}30` }]}>
                                <Ionicons name="card-outline" size={14} color={catColor} />
                                <Text style={[styles.paymentMethod, { color: catColor }]}>{expenseData.paymentMode}</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Detailed Stats Grid */}
                    <View style={[styles.statsCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Transaction Summary</Text>

                        <View style={styles.statsGrid}>
                            <DetailItem
                                icon="calendar-outline"
                                label="Transaction Date"
                                value={formatDate(expenseData.date)}
                                color="#5B8A72"
                            />

                            {expenseData.unit !== "None" && (
                                <DetailItem
                                    icon="cube-outline"
                                    label="Quantity/Unit"
                                    value={`${expenseData.quantity} ${expenseData.unit}`}
                                    color="#5B8A72"
                                />
                            )}

                            {expenseData.diameter && (
                                <DetailItem
                                    icon="resize-outline"
                                    label="Size/Diameter"
                                    value={expenseData.diameter}
                                    color="#5B8A72"
                                />
                            )}

                            {!isNoUnitCat && (
                                <DetailItem
                                    icon="pricetag-outline"
                                    label={t('rate_per_unit')}
                                    value={formatAmount(expenseData.ratePerUnit)}
                                    color="#5B8A72"
                                />
                            )}

                            {expenseData.projectTag && (
                                <DetailItem
                                    icon="business-outline"
                                    label="Project/Site"
                                    value={expenseData.projectTag}
                                    color="#5B8A72"
                                />
                            )}
                        </View>

                        {/* Price Calculations */}
                        <View style={[styles.calculationBox, { borderTopColor: themeColors.border }]}>
                            {!isNoUnitCat && expenseData.quantity > 0 && (
                                <>
                                    <View style={styles.calcRow}>
                                        <Text style={[styles.calcLabel, { color: themeColors.subtext }]}>Base Price</Text>
                                        <Text style={[styles.calcValue, { color: themeColors.text }]}>{formatAmount(expenseData.ratePerUnit * expenseData.quantity)}</Text>
                                    </View>
                                    <View style={styles.calcRow}>
                                        <Text style={[styles.calcLabel, { color: themeColors.subtext }]}>Tax (Inc. GST)</Text>
                                        <Text style={[styles.calcValue, { color: themeColors.text }]}>{formatAmount(Math.max(0, expenseData.totalAmount - (expenseData.ratePerUnit * expenseData.quantity)))}</Text>
                                    </View>
                                </>
                            )}

                            {isNoUnitCat && (
                                <View style={styles.calcRow}>
                                    <Text style={[styles.calcLabel, { color: themeColors.subtext }]}>Unit Price</Text>
                                    <Text style={[styles.calcValue, { color: themeColors.text }]}>{formatAmount(expenseData.ratePerUnit)}</Text>
                                </View>
                            )}

                            <View style={[styles.calcRow, styles.totalRow, { borderTopColor: themeColors.border }]}>
                                <Text style={[styles.totalLabelText, { color: themeColors.text }]}>Net Amount</Text>
                                <Text style={[styles.totalValueText, { color: "#5B8A72" }]}>{formatAmount(expenseData.totalAmount)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Notes Section */}
                    {expenseData.notes && (
                        <View style={[styles.notesCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                            <View style={styles.notesHeader}>
                                <Ionicons name="document-text-outline" size={20} color="#5B8A72" />
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
                                setEditForm({
                                    ...expenseData,
                                    totalAmount: convertToDisplay(expenseData.totalAmount).toString()
                                });
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
                        <MaterialCommunityIcons name="shield-check" size={18} color="#5B8A7266" />
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
        paddingTop: Platform.OS === "android" ? 40 : 10,
        paddingBottom: 15,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "800",
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
    },
    shareButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
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
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
    },
    categoryBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 100,
        marginBottom: 20,
    },
    categoryBadgeText: {
        fontWeight: "800",
        textTransform: "uppercase",
        fontSize: 12,
        letterSpacing: 1.5,
    },
    vendorName: {
        fontSize: 28,
        fontWeight: "800",
        textAlign: "center",
        letterSpacing: -0.5,
    },
    amountContainer: {
        flexDirection: "row",
        alignItems: "baseline",
        marginTop: 15,
    },
    currencySymbol: {
        fontSize: 52,
        fontWeight: "700",
        marginRight: 6,
    },
    amountText: {
        fontSize: 52,
        fontWeight: "800",
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
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 14,
        borderWidth: 1,
        gap: 8,
    },
    paymentMethod: {
        fontSize: 14,
        fontWeight: "700",
    },
    statsCard: {
        borderRadius: 28,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: "800",
        marginBottom: 20,
        letterSpacing: 0.5,
    },
    statsGrid: {
        gap: 20,
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
        justifyContent: "center",
    },
    labelRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 2,
    },
    detailLabel: {
        fontSize: 11,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 1,
        opacity: 0.7,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: "700",
    },
    calculationBox: {
        marginTop: 25,
        paddingTop: 25,
        borderTopWidth: 1,
    },
    calcRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    calcLabel: {
        fontSize: 14,
        fontWeight: "600",
        opacity: 0.6,
    },
    calcValue: {
        fontSize: 15,
        fontWeight: "700",
    },
    totalRow: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
    },
    totalLabelText: {
        fontSize: 16,
        fontWeight: "800",
    },
    totalValueText: {
        fontSize: 22,
        fontWeight: "800",
    },
    notesCard: {
        borderRadius: 24,
        padding: 24,
        marginBottom: 32,
        borderWidth: 1,
    },
    notesHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    notesTitle: {
        fontSize: 15,
        fontWeight: "700",
        marginLeft: 10,
    },
    notesBody: {
        fontSize: 14,
        lineHeight: 22,
        fontWeight: "500",
    },
    actionSection: {
        flexDirection: "row",
        gap: 16,
    },
    editButton: {
        flex: 1,
        height: 60,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        borderWidth: 1,
    },
    downloadButton: {
        flex: 1,
        height: 60,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: "800",
    },
    verificationStamp: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        marginTop: 32,
        opacity: 0.5,
    },
    verificationText: {
        fontSize: 11,
        fontWeight: "600",
        marginLeft: 8,
        letterSpacing: 0.5,
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15,32,39,0.8)",
        justifyContent: "flex-end",
    },
    modalForm: {
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        padding: 28,
        paddingBottom: 50,
        elevation: 20,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: "800",
        marginBottom: 24,
    },
    modalLabel: {
        fontSize: 12,
        fontWeight: "800",
        marginBottom: 10,
        textTransform: "uppercase",
        letterSpacing: 1,
        opacity: 0.7,
    },
    modalInput: {
        borderRadius: 18,
        padding: 16,
        fontSize: 16,
        marginBottom: 24,
        fontWeight: "600",
    },
    modalActions: {
        flexDirection: "row",
        gap: 12,
    },
    cancelBtn: {
        flex: 1,
        height: 58,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: "700",
    },
    saveBtn: {
        flex: 2,
        height: 58,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: "800",
    },
});
