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
import { BASE_URL } from "../config";
import axios from "axios";

const { width } = Dimensions.get("window");

export default function IncomeDetail() {
    const params = useLocalSearchParams();
    const router = useRouter();
    const { userToken } = useContext(AuthContext);
    const { t, themeColors, settings, currencySymbol, formatAmount, convertToDisplay, convertToBase, formatDate } = useSettings();

    // Initial state from params
    const [incomeData, setIncomeData] = useState({
        dealerName: params.dealerName,
        amount: Number(params.amount),
        notes: params.notes || "",
        paymentMode: params.paymentMode,
        date: params.date,
        _id: params._id,
    });

    const modeColors = {
        Cash: "#34D399",
        UPI: "#38BDF8",
        "Bank Transfer": "#A78BFA",
        Cheque: "#FBBF24",
        "Credit Card": "#F472B6",
    };

    const catColor = modeColors[incomeData.paymentMode] || "#5B8A72";

    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [editForm, setEditForm] = useState({
        dealerName: incomeData.dealerName,
        amount: convertToDisplay(incomeData.amount).toString(),
        notes: incomeData.notes
    });

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
            const message = `Income Receipt\n\nDealer/Person: ${incomeData.dealerName}\nAmount: ${formatAmount(incomeData.amount)}\nPayment Mode: ${incomeData.paymentMode}\nDate: ${incomeData.date}\n\nGenerated via Finova`;
            await Share.share({ message });
        } catch (error) {
            console.log(error.message);
        }
    };

    const handleUpdate = async () => {
        if (!editForm.dealerName.trim()) {
            Alert.alert("Error", "Please enter a name");
            return;
        }
        if (!editForm.amount || Number(editForm.amount) <= 0) {
            Alert.alert("Error", "Please enter a valid amount");
            return;
        }

        try {
            const res = await axios.patch(
                `${BASE_URL}/incomes/${incomeData._id}`,
                {
                    dealerName: editForm.dealerName.trim(),
                    amount: convertToBase(editForm.amount),
                    notes: editForm.notes,
                },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );

            setIncomeData({
                ...incomeData,
                dealerName: res.data.dealerName,
                amount: res.data.amount,
                notes: res.data.notes,
            });

            setIsEditModalVisible(false);
            Alert.alert("Success", "Income updated successfully");
        } catch (error) {
            console.log("Update error:", error.message);
            Alert.alert("Error", "Failed to update income");
        }
    };



    const DetailItem = ({ icon, label, value, color = "#fff" }) => (
        <View style={styles.detailItem}>
            <View style={[styles.iconContainer, { backgroundColor: `${color}16` }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <View style={styles.detailTextContainer}>
                <View style={styles.labelRow}>
                    <Text style={[styles.detailLabel, { color: themeColors.subtext }]}>{label}</Text>
                </View>
                <Text style={[styles.detailValue, { color: themeColors.text }]}>
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
                            <Text style={[styles.categoryBadgeText, { color: catColor }]}>Income</Text>
                        </View>

                        <Text style={[styles.vendorName, { color: themeColors.text }]}>{incomeData.dealerName}</Text>
                        <View style={styles.amountContainer}>
                            <Text style={[styles.amountText, { color: "#5B8A72" }]}>{formatAmount(incomeData.amount)}</Text>
                        </View>

                        <View style={styles.statusRow}>
                            <View style={[styles.paymentHighlight, { backgroundColor: `${catColor}10`, borderColor: `${catColor}30` }]}>
                                <Ionicons name="card-outline" size={14} color={catColor} />
                                <Text style={[styles.paymentMethod, { color: catColor }]}>{incomeData.paymentMode}</Text>
                            </View>
                        </View>
                    </LinearGradient>

                    {/* Detailed Stats Grid */}
                    <View style={[styles.statsCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                        <Text style={[styles.sectionTitle, { color: themeColors.text }]}>Transaction Summary</Text>

                        <View style={styles.statsGrid}>
                            <DetailItem
                                icon="calendar-outline"
                                label="Received Date"
                                value={formatDate(incomeData.date)}
                                color="#5B8A72"
                            />

                            <DetailItem
                                icon="wallet-outline"
                                label="Payment Mode"
                                value={incomeData.paymentMode}
                                color="#5B8A72"
                            />

                            <DetailItem
                                icon="person-outline"
                                label="Source/Dealer"
                                value={incomeData.dealerName}
                                color="#5B8A72"
                            />
                        </View>

                        {/* Net Amount Box */}
                        <View style={[styles.calculationBox, { borderTopColor: themeColors.border }]}>
                            <View style={[styles.calcRow, styles.totalRow, { borderTopColor: themeColors.border }]}>
                                <Text style={[styles.totalLabelText, { color: themeColors.text }]}>Total Received</Text>
                                <Text style={[styles.totalValueText, { color: "#5B8A72" }]}>{formatAmount(incomeData.amount)}</Text>
                            </View>
                        </View>
                    </View>

                    {/* Notes Section */}
                    {incomeData.notes && (
                        <View style={[styles.notesCard, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                            <View style={styles.notesHeader}>
                                <Ionicons name="document-text-outline" size={20} color="#5B8A72" />
                                <Text style={[styles.notesTitle, { color: themeColors.text }]}>{t('notes')}</Text>
                            </View>
                            <Text style={[styles.notesBody, { color: themeColors.subtext }]}>{incomeData.notes}</Text>
                        </View>
                    )}

                    {/* Action Buttons */}
                    <View style={styles.actionSection}>
                        <TouchableOpacity
                            style={[styles.editButton, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                            onPress={() => {
                                setEditForm({
                                    dealerName: incomeData.dealerName,
                                    amount: convertToDisplay(incomeData.amount).toString(),
                                    notes: incomeData.notes
                                });
                                setIsEditModalVisible(true);
                            }}
                        >
                            <Ionicons name="create-outline" size={20} color={themeColors.text} />
                            <Text style={[styles.buttonText, { color: themeColors.text }]}>Edit Entry</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[styles.downloadButton, { backgroundColor: themeColors.primary }]} onPress={onShare}>
                            <Ionicons name="cloud-download-outline" size={20} color={themeColors.tabBar} />
                            <Text style={[styles.buttonText, { color: themeColors.tabBar }]}>Export</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Footer - Verification Stamp */}
                    <View style={styles.verificationStamp}>
                        <MaterialCommunityIcons name="shield-check" size={18} color="#5B8A7266" />
                        <Text style={styles.verificationText}>Digitally Verified Income • {incomeData._id?.substring(0, 8)}</Text>
                    </View>
                </ScrollView>

                {/* Edit Modal */}
                <Modal
                    visible={isEditModalVisible}
                    animationType="slide"
                    transparent
                    onRequestClose={() => setIsEditModalVisible(false)}
                >
                    <View style={styles.modalOverlay}>
                        <LinearGradient colors={themeColors.background} style={[styles.modalForm, { backgroundColor: themeColors.card }]}>
                            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Edit Income</Text>

                            <Text style={[styles.modalLabel, { color: themeColors.subtext }]}>Dealer / Source Name</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, color: themeColors.text }]}
                                value={editForm.dealerName}
                                onChangeText={(t) => setEditForm({ ...editForm, dealerName: t })}
                                placeholder="Name"
                                placeholderTextColor={themeColors.subtext}
                            />

                            <Text style={[styles.modalLabel, { color: themeColors.subtext }]}>Amount ({currencySymbol})</Text>
                            <TextInput
                                style={[styles.modalInput, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, color: themeColors.text }]}
                                value={editForm.amount}
                                onChangeText={(t) => setEditForm({ ...editForm, amount: t })}
                                keyboardType="numeric"
                                placeholder="Amount"
                                placeholderTextColor={themeColors.subtext}
                            />

                            <Text style={[styles.modalLabel, { color: themeColors.subtext }]}>{t('notes')}</Text>
                            <TextInput
                                style={[styles.modalInput, { height: 80, backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, color: themeColors.text }]}
                                value={editForm.notes}
                                onChangeText={(t) => setEditForm({ ...editForm, notes: t })}
                                multiline
                                placeholder="Optional Notes"
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
        fontSize: 20,
        fontWeight: "bold",
    },
    backButton: {
        padding: 8,
        borderRadius: 12,
    },
    shareButton: {
        padding: 10,
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
    },
    categoryBadge: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 100,
        marginBottom: 20,
    },
    categoryBadgeText: {
        fontWeight: "700",
        textTransform: "uppercase",
        fontSize: 12,
        letterSpacing: 1,
    },
    vendorName: {
        fontSize: 28,
        fontWeight: "800",
        textAlign: "center",
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
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        gap: 6,
    },
    paymentMethod: {
        fontSize: 14,
        fontWeight: "600",
    },
    statsCard: {
        borderRadius: 28,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
    },
    sectionTitle: {
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
        marginLeft: 12,
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
        fontWeight: "600",
        textTransform: "uppercase",
        letterSpacing: 1,
        opacity: 0.7,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: "600",
    },
    calculationBox: {
        marginTop: 25,
        paddingTop: 25,
        borderTopWidth: 1,
    },
    calcRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 10,
    },
    totalRow: {
        marginTop: 15,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.05)",
    },
    totalLabelText: {
        fontSize: 16,
        fontWeight: "700",
    },
    totalValueText: {
        fontSize: 20,
        fontWeight: "800",
    },
    notesCard: {
        borderRadius: 24,
        padding: 20,
        marginBottom: 30,
        borderWidth: 1,
    },
    notesHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
    },
    notesTitle: {
        fontSize: 15,
        fontWeight: "600",
        marginLeft: 10,
    },
    notesBody: {
        fontSize: 14,
        lineHeight: 22,
    },
    actionSection: {
        flexDirection: "row",
        gap: 15,
    },
    editButton: {
        flex: 1,
        height: 56,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        borderWidth: 1,
    },
    downloadButton: {
        flex: 1,
        height: 56,
        borderRadius: 18,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
    },
    buttonText: {
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
        fontSize: 11,
        color: "rgba(255,255,255,0.4)",
        marginLeft: 6,
        letterSpacing: 0.5,
    },
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
        marginBottom: 20,
    },
    modalLabel: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 8,
        textTransform: "uppercase",
    },
    modalInput: {
        borderRadius: 16,
        padding: 16,
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
    },
    cancelBtnText: {
        fontSize: 16,
        fontWeight: "600",
    },
    saveBtn: {
        flex: 2,
        height: 56,
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
    },
    saveBtnText: {
        fontSize: 16,
        fontWeight: "700",
    },
});
