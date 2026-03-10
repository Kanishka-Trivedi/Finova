import React, { useState, useMemo, useContext, useEffect, useCallback } from "react";
import axios from "axios";
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    FlatList,
    Modal,
    Dimensions,
    SafeAreaView,
    ScrollView,
    Alert,
    Platform,
    Pressable,
    BackHandler,
} from "react-native";
import { useRouter } from "expo-router";
import { Swipeable } from "react-native-gesture-handler";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { BASE_URL } from "../../config";
import { Ionicons } from "@expo/vector-icons";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const paymentModes = ["Cash", "UPI", "Bank Transfer", "Cheque", "Credit Card"];

const paymentIcons = {
    Cash: "cash-outline",
    UPI: "phone-portrait-outline",
    "Bank Transfer": "business-outline",
    Cheque: "document-text-outline",
    "Credit Card": "card-outline",
};

// ─── Date Picker ───
function DatePickerModal({ visible, onClose, onSelect, selectedDate, themeColors }) {
    const today = new Date();
    const initial = selectedDate ? new Date(selectedDate) : today;
    const [viewYear, setViewYear] = useState(initial.getFullYear());
    const [viewMonth, setViewMonth] = useState(initial.getMonth());
    const [picked, setPicked] = useState(initial);

    useEffect(() => {
        if (visible) {
            const d = selectedDate ? new Date(selectedDate) : new Date();
            setViewYear(d.getFullYear());
            setViewMonth(d.getMonth());
            setPicked(d);
        }
    }, [visible]);

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();

    const goPrev = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
        else setViewMonth(viewMonth - 1);
    };
    const goNext = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
        else setViewMonth(viewMonth + 1);
    };

    const selectDay = (day) => setPicked(new Date(viewYear, viewMonth, day));

    const confirmDate = () => {
        const y = picked.getFullYear();
        const m = String(picked.getMonth() + 1).padStart(2, "0");
        const d = String(picked.getDate()).padStart(2, "0");
        onSelect(`${y}-${m}-${d}`);
        onClose();
    };

    const selectToday = () => {
        const t = new Date();
        setPicked(t);
        setViewYear(t.getFullYear());
        setViewMonth(t.getMonth());
    };

    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);

    const isSelected = (day) =>
        day && picked.getDate() === day && picked.getMonth() === viewMonth && picked.getFullYear() === viewYear;
    const isToday = (day) =>
        day && today.getDate() === day && today.getMonth() === viewMonth && today.getFullYear() === viewYear;

    return (
        <Modal visible={visible} transparent animationType="fade">
            <Pressable style={dpStyles.overlay} onPress={onClose}>
                <Pressable style={[dpStyles.container, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]} onPress={(e) => e.stopPropagation()}>
                    <View style={dpStyles.header}>
                        <TouchableOpacity onPress={goPrev} style={[dpStyles.navBtn, { backgroundColor: themeColors.border }]}>
                            <Text style={[dpStyles.navText, { color: themeColors.text }]}>‹</Text>
                        </TouchableOpacity>
                        <Text style={[dpStyles.monthYear, { color: themeColors.text }]}>{MONTHS[viewMonth]} {viewYear}</Text>
                        <TouchableOpacity onPress={goNext} style={[dpStyles.navBtn, { backgroundColor: themeColors.border }]}>
                            <Text style={[dpStyles.navText, { color: themeColors.text }]}>›</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={dpStyles.weekRow}>
                        {DAYS_OF_WEEK.map((d) => (
                            <Text key={d} style={[dpStyles.weekDay, { color: themeColors.subtext }]}>{d}</Text>
                        ))}
                    </View>

                    <View style={dpStyles.grid}>
                        {cells.map((day, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={[
                                    dpStyles.dayCell,
                                    isSelected(day) && [dpStyles.dayCellSelected, { backgroundColor: "#5B8A72" }],
                                    isToday(day) && !isSelected(day) && [dpStyles.dayCellToday, { borderColor: "#5B8A72" }],
                                ]}
                                onPress={() => day && selectDay(day)}
                                disabled={!day}
                            >
                                <Text style={[
                                    dpStyles.dayText,
                                    { color: day ? themeColors.text : "transparent" },
                                    isSelected(day) && { color: "#fff", fontWeight: "700" },
                                    isToday(day) && !isSelected(day) && { color: "#5B8A72" },
                                ]}>
                                    {day || ""}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={dpStyles.actions}>
                        <TouchableOpacity onPress={selectToday} style={[dpStyles.todayBtn, { backgroundColor: themeColors.border }]}>
                            <Text style={[dpStyles.todayBtnText, { color: "#5B8A72" }]}>Today</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={confirmDate} style={[dpStyles.confirmBtn, { backgroundColor: "#5B8A72" }]}>
                            <Text style={[dpStyles.confirmBtnText, { color: "#fff" }]}>Confirm</Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// ─── Main Screen ───
export default function IncomeScreen() {
    const { userToken } = useContext(AuthContext);
    const { themeColors, settings, currencySymbol, formatAmount, convertToBase, formatDate } = useSettings();
    const [incomes, setIncomes] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterMode, setFilterMode] = useState("All");

    // Form state
    const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
    const [dealerName, setDealerName] = useState("");
    const [amount, setAmount] = useState("");
    const [paymentMode, setPaymentMode] = useState("Cash");
    const [notes, setNotes] = useState("");
    const [datePickerVisible, setDatePickerVisible] = useState(false);

    const isDark = settings.theme !== "light";

    const router = useRouter();

    useEffect(() => {
        const backAction = () => {
            if (modalVisible) {
                setModalVisible(false);
                resetForm();
                return true;
            }
            return false;
        };

        const backHandler = BackHandler.addEventListener(
            "hardwareBackPress",
            backAction
        );

        return () => backHandler.remove();
    }, [modalVisible]);

    useEffect(() => {
        if (userToken) fetchIncomes();
    }, [userToken]);

    const fetchIncomes = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/incomes`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            setIncomes(res.data);
        } catch (error) {
            console.log("Fetch income error:", error.message);
        }
    };

    const resetForm = () => {
        setDate(new Date().toISOString().split("T")[0]);
        setDealerName("");
        setAmount("");
        setPaymentMode("Cash");
        setNotes("");
    };

    const handleAdd = async () => {
        if (!dealerName.trim()) {
            Alert.alert("Missing Field", "Please enter the dealer / person name.");
            return;
        }
        if (!amount || Number(amount) <= 0) {
            Alert.alert("Missing Field", "Please enter a valid amount.");
            return;
        }

        try {
            const res = await axios.post(
                `${BASE_URL}/incomes`,
                { date, dealerName: dealerName.trim(), amount: convertToBase(amount), paymentMode, notes },
                { headers: { Authorization: `Bearer ${userToken}` } }
            );
            setIncomes([res.data, ...incomes]);
            setModalVisible(false);
            resetForm();
        } catch (error) {
            Alert.alert("Error", error.response?.data?.message || "Failed to add income");
        }
    };

    const deleteIncome = async (id) => {
        try {
            await axios.delete(`${BASE_URL}/incomes/${id}`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            setIncomes(incomes.filter((i) => i._id !== id));
        } catch (error) {
            console.log("Delete error:", error.message);
        }
    };



    // Filter
    const filteredIncomes = useMemo(() => {
        let result = filterMode === "All"
            ? incomes
            : incomes.filter((i) => i.paymentMode === filterMode);

        if (searchQuery.trim()) {
            const q = searchQuery.trim().toLowerCase();
            result = result.filter((i) => {
                const nameMatch = i.dealerName?.toLowerCase().includes(q);
                const dateMatch = formatDate(i.date).toLowerCase().includes(q);
                return nameMatch || dateMatch;
            });
        }
        return result;
    }, [incomes, filterMode, searchQuery]);

    const totalIncome = incomes.reduce((sum, i) => sum + (i.amount || 0), 0);

    // Group by payment mode for summary
    const modeBreakdown = useMemo(() => {
        const data = {};
        incomes.forEach((i) => {
            data[i.paymentMode] = (data[i.paymentMode] || 0) + (i.amount || 0);
        });
        return data;
    }, [incomes]);

    const modeColors = {
        Cash: "#34D399",
        UPI: "#38BDF8",
        "Bank Transfer": "#A78BFA",
        Cheque: "#FBBF24",
        "Credit Card": "#F472B6",
    };

    const renderItem = ({ item }) => (
        <Swipeable
            renderRightActions={() => (
                <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => deleteIncome(item._id)}
                >
                    <Ionicons name="trash-outline" size={20} color="#fff" />
                    <Text style={styles.deleteText}>Delete</Text>
                </TouchableOpacity>
            )}
        >
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => router.push({
                    pathname: "/income-detail",
                    params: {
                        _id: item._id,
                        dealerName: item.dealerName,
                        amount: item.amount,
                        notes: item.notes,
                        date: item.date,
                        paymentMode: item.paymentMode,
                    }
                })}
            >
                <View
                    style={[
                        styles.card,
                        {
                            backgroundColor: themeColors.card,
                            borderColor: themeColors.border,
                            borderWidth: isDark ? 0 : 1,
                        },
                    ]}
                >
                    {/* Left accent */}
                    <View style={[styles.cardAccent, { backgroundColor: modeColors[item.paymentMode] || "#5B8A72" }]} />

                    <View style={styles.cardContent}>
                        <View style={styles.cardHeader}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.cardDealer, { color: themeColors.text }]}>{item.dealerName}</Text>
                                <Text style={[styles.cardDate, { color: themeColors.subtext }]}>{formatDate(item.date)}</Text>
                            </View>
                            <Text style={[styles.cardAmount, { color: "#5B8A72" }]}>
                                +{formatAmount(item.amount)}
                            </Text>
                        </View>

                        <View style={styles.cardFooter}>
                            <View style={[styles.paymentBadge, { backgroundColor: `${modeColors[item.paymentMode] || "#5B8A72"}18` }]}>
                                <Ionicons
                                    name={paymentIcons[item.paymentMode] || "card-outline"}
                                    size={13}
                                    color={modeColors[item.paymentMode] || "#5B8A72"}
                                />
                                <Text style={[styles.paymentBadgeText, { color: modeColors[item.paymentMode] || "#5B8A72" }]}>
                                    {item.paymentMode}
                                </Text>
                            </View>
                            {item.notes ? (
                                <Text style={[styles.cardNotes, { color: themeColors.subtext }]} numberOfLines={1}>
                                    {item.notes}
                                </Text>
                            ) : null}
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Swipeable>
    );

    return (
        <ExpoLinearGradient colors={themeColors.background} style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <Text style={[styles.heading, { color: themeColors.text }]}>Income</Text>

                {/* Total Card */}
                <View style={[styles.totalBox, { backgroundColor: "#5B8A72", padding: 20 }]}>
                    <View style={styles.totalTop}>
                        <View>
                            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center" }}>
                                    <Ionicons name="arrow-down-outline" size={20} color="#fff" />
                                </View>
                                <Text style={[styles.totalLabel, { color: "rgba(255,255,255,0.85)" }]}>Total Income</Text>
                            </View>
                            <Text style={[styles.totalAmount, { color: "#fff", fontSize: 28, marginTop: 4 }]}>
                                {formatAmount(totalIncome)}
                            </Text>
                        </View>
                    </View>

                    {/* Payment mode breakdown */}
                    {Object.keys(modeBreakdown).length > 0 && (
                        <View style={[styles.breakdownRow, { borderTopColor: "rgba(255,255,255,0.15)", marginTop: 20, paddingTop: 15 }]}>
                            {Object.entries(modeBreakdown).map(([mode, val]) => (
                                <View key={mode} style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
                                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.5)" }} />
                                    <Text style={{ color: "rgba(255,255,255,0.7)", fontSize: 12, flex: 1 }}>{mode}</Text>
                                    <Text style={{ color: "#fff", fontSize: 13, fontWeight: "700" }}>{formatAmount(val)}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Search Bar */}
                <View style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
                    <Ionicons name="search-outline" size={18} color={themeColors.subtext} style={{ marginRight: 10 }} />
                    <TextInput
                        placeholder="Search by name or date..."
                        placeholderTextColor={themeColors.subtext}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={[styles.searchInput, { color: themeColors.text }]}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery("")}>
                            <Ionicons name="close-circle" size={18} color={themeColors.subtext} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Payment Mode Filter */}
                <View style={styles.filterRow}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {["All", ...paymentModes].map((mode) => (
                            <TouchableOpacity
                                key={mode}
                                style={[
                                    styles.filterChip,
                                    { backgroundColor: `${themeColors.text}08` },
                                    filterMode === mode && { backgroundColor: "#5B8A72" },
                                ]}
                                onPress={() => setFilterMode(mode)}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        { color: themeColors.subtext },
                                        filterMode === mode && { color: "#fff", fontWeight: "600" },
                                    ]}
                                >
                                    {mode}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>
                </View>

                {/* List */}
                <FlatList
                    data={filteredIncomes}
                    keyExtractor={(item) => item._id}
                    renderItem={renderItem}
                    contentContainerStyle={{ paddingBottom: 120 }}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="wallet-outline" size={48} color={themeColors.subtext} style={{ opacity: 0.4 }} />
                            <Text style={{ color: themeColors.subtext, textAlign: "center", marginTop: 12, fontSize: 15 }}>
                                No income entries yet
                            </Text>
                        </View>
                    }
                />

                {/* FAB */}
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: themeColors.primary }]}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={32} color="#fff" />
                </TouchableOpacity>

                {/* Add Income Modal */}
                <Modal
                    visible={modalVisible}
                    animationType="slide"
                    onRequestClose={() => { setModalVisible(false); resetForm(); }}
                >
                    <ExpoLinearGradient colors={themeColors.background} style={styles.modalContainer}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={[styles.modalHeading, { color: themeColors.text }]}>Add Income</Text>

                            {/* Date */}
                            <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>Date</Text>
                            <TouchableOpacity
                                style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
                                onPress={() => setDatePickerVisible(true)}
                            >
                                <Text style={{ color: date ? themeColors.text : themeColors.subtext, fontSize: 15 }}>
                                    {date ? formatDate(date) : "Select date"}
                                </Text>
                            </TouchableOpacity>
                            <DatePickerModal
                                visible={datePickerVisible}
                                onClose={() => setDatePickerVisible(false)}
                                onSelect={setDate}
                                selectedDate={date}
                                themeColors={themeColors}
                            />

                            {/* Dealer / Person Name */}
                            <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>Dealer / Person Name</Text>
                            <TextInput
                                placeholder="e.g. Rajesh Builders"
                                placeholderTextColor={themeColors.subtext}
                                value={dealerName}
                                onChangeText={setDealerName}
                                style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, color: themeColors.text }]}
                            />

                            {/* Amount */}
                            <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>Amount ({currencySymbol})</Text>
                            <TextInput
                                placeholder="0"
                                placeholderTextColor={themeColors.subtext}
                                value={amount}
                                onChangeText={setAmount}
                                keyboardType="numeric"
                                style={[
                                    styles.input,
                                    {
                                        backgroundColor: themeColors.card,
                                        borderColor: "#5B8A72",
                                        borderWidth: 1.5,
                                        color: themeColors.text,
                                        fontSize: 20,
                                        fontWeight: "700",
                                    },
                                ]}
                            />

                            {/* Payment Mode */}
                            <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>Payment Mode</Text>
                            <View style={styles.paymentGrid}>
                                {paymentModes.map((mode) => (
                                    <TouchableOpacity
                                        key={mode}
                                        style={[
                                            styles.paymentChip,
                                            { backgroundColor: themeColors.border },
                                            paymentMode === mode && styles.activePaymentChip,
                                        ]}
                                        onPress={() => setPaymentMode(mode)}
                                    >
                                        <Text
                                            style={[
                                                styles.paymentText,
                                                paymentMode === mode ? styles.activePaymentText : { color: themeColors.text },
                                            ]}
                                        >
                                            {mode}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Notes */}
                            <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>Notes (optional)</Text>
                            <TextInput
                                placeholder="Additional details..."
                                placeholderTextColor={themeColors.subtext}
                                value={notes}
                                onChangeText={setNotes}
                                style={[
                                    styles.input,
                                    {
                                        height: 90,
                                        textAlignVertical: "top",
                                        backgroundColor: themeColors.card,
                                        borderColor: themeColors.border,
                                        borderWidth: 1,
                                        color: themeColors.text,
                                        paddingTop: 15,
                                    },
                                ]}
                                multiline
                            />

                            {/* Submit */}
                            <TouchableOpacity style={[styles.addButton, { backgroundColor: "#5B8A72" }]} onPress={handleAdd} activeOpacity={0.8}>
                                <Text style={[styles.addButtonText, { color: "#fff" }]}>Add Income</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => { setModalVisible(false); resetForm(); }}
                            >
                                <Text style={[styles.cancelText, { color: themeColors.subtext }]}>Cancel</Text>
                            </TouchableOpacity>

                            <View style={{ height: 40 }} />
                        </ScrollView>
                    </ExpoLinearGradient>
                </Modal>
            </SafeAreaView>
        </ExpoLinearGradient>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },

    heading: {
        fontSize: 34,
        fontWeight: "700",
        marginBottom: 15,
        marginTop: 40,
    },

    totalBox: {
        padding: 20,
        borderRadius: 20,
        marginBottom: 20,
    },

    totalTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "flex-end",
    },

    totalLabel: {
        color: "#5B8A72",
        fontSize: 13,
        fontWeight: "600",
    },

    totalAmount: {
        fontSize: 26,
        fontWeight: "700",
    },

    breakdownRow: {
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.1)",
        marginTop: 15,
        paddingTop: 10,
    },

    // ── Search Bar ──
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        borderRadius: 14,
        paddingHorizontal: 16,
        marginBottom: 15,
        height: 48,
        borderWidth: 1,
    },

    searchInput: {
        flex: 1,
        fontSize: 14,
        height: 48,
    },

    // ── Filter ──
    filterRow: {
        height: 50,
        marginBottom: 10,
    },

    filterChip: {
        height: 34,
        paddingHorizontal: 16,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },

    filterText: {
        fontSize: 12,
    },

    // ── Card ──
    card: {
        borderRadius: 18,
        marginBottom: 12,
        padding: 15,
        flexDirection: "row",
    },

    cardAccent: {
        width: 3.5,
        borderRadius: 2,
        marginRight: 10,
    },

    cardContent: {
        flex: 1,
    },

    cardHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 6,
    },

    cardDealer: {
        fontSize: 15,
        fontWeight: "700",
    },

    cardDate: {
        fontSize: 11,
    },

    cardAmount: {
        fontSize: 16,
        fontWeight: "700",
    },

    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 8,
    },

    paymentBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        gap: 4,
    },

    paymentBadgeText: {
        fontSize: 10,
        fontWeight: "600",
    },

    cardNotes: {
        fontSize: 12,
        fontStyle: "italic",
        flex: 1,
        textAlign: "right",
        marginLeft: 10,
    },

    deleteButton: {
        backgroundColor: "#EF4444",
        justifyContent: "center",
        alignItems: "center",
        width: 80,
        borderRadius: 18,
        marginBottom: 12,
    },

    deleteText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 12,
    },

    fab: {
        position: "absolute",
        bottom: 30,
        right: 25,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: "center",
        alignItems: "center",
        elevation: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },

    // ── Modal / Form ──
    modalContainer: {
        flex: 1,
        padding: 24,
        paddingTop: 60,
    },

    modalHeading: {
        fontSize: 24,
        fontWeight: "700",
        marginBottom: 20,
    },

    fieldLabel: {
        fontSize: 12,
        fontWeight: "600",
        marginBottom: 6,
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },

    input: {
        padding: 15,
        borderRadius: 14,
        marginBottom: 15,
        fontSize: 15,
    },

    paymentGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 10,
        marginBottom: 15,
    },

    paymentChip: {
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 18,
    },

    paymentText: {
        fontSize: 13,
    },

    activePaymentChip: {
        backgroundColor: "#5B8A72",
    },

    activePaymentText: {
        color: "#fff",
        fontWeight: "600",
    },

    addButton: {
        padding: 16,
        borderRadius: 14,
        alignItems: "center",
        marginTop: 10,
    },

    addButtonText: {
        fontWeight: "700",
        fontSize: 16,
    },

    cancelText: {
        marginTop: 15,
        textAlign: "center",
        fontSize: 15,
    },

    emptyState: {
        alignItems: "center",
        marginTop: 50,
    },
});

/* ── Date Picker Styles ── */
const dpStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(15,32,39,0.8)",
        justifyContent: "center",
        alignItems: "center",
    },
    container: {
        width: Dimensions.get("window").width - 48,
        maxWidth: 400,
        borderRadius: 28,
        padding: 24,
        elevation: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 20,
    },
    navBtn: { width: 40, height: 40, borderRadius: 12, justifyContent: "center", alignItems: "center" },
    navText: { fontSize: 22, fontWeight: "600" },
    monthYear: { fontSize: 18, fontWeight: "800" },
    weekRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 10 },
    weekDay: { width: 40, textAlign: "center", fontSize: 12, fontWeight: "800", textTransform: "uppercase", opacity: 0.5 },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    dayCell: {
        width: `${100 / 7}%`,
        aspectRatio: 1,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 12,
    },
    dayCellSelected: { elevation: 4 },
    dayCellToday: { borderWidth: 2 },
    dayText: { fontSize: 15, fontWeight: "600" },
    actions: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 12,
        marginTop: 24,
    },
    todayBtn: { flex: 1, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    todayBtnText: { fontWeight: "700", fontSize: 15 },
    confirmBtn: { flex: 1, height: 50, borderRadius: 14, alignItems: "center", justifyContent: "center", elevation: 4 },
    confirmBtnText: { fontWeight: "800", fontSize: 15 },
});

