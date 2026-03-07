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
    Pressable,
} from "react-native";
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
                                    isSelected(day) && [dpStyles.dayCellSelected, { backgroundColor: "#38BDF8" }],
                                    isToday(day) && !isSelected(day) && [dpStyles.dayCellToday, { borderColor: "#38BDF8" }],
                                ]}
                                onPress={() => day && selectDay(day)}
                                disabled={!day}
                            >
                                <Text style={[
                                    dpStyles.dayText,
                                    { color: day ? themeColors.text : "transparent" },
                                    isSelected(day) && { color: "#0F2027", fontWeight: "700" },
                                    isToday(day) && !isSelected(day) && { color: "#38BDF8" },
                                ]}>
                                    {day || ""}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={dpStyles.actions}>
                        <TouchableOpacity onPress={selectToday} style={[dpStyles.todayBtn, { backgroundColor: themeColors.border }]}>
                            <Text style={[dpStyles.todayBtnText, { color: "#38BDF8" }]}>Today</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={confirmDate} style={[dpStyles.confirmBtn, { backgroundColor: "#38BDF8" }]}>
                            <Text style={[dpStyles.confirmBtnText, { color: "#0F2027" }]}>Confirm</Text>
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
    const { themeColors, settings, currencySymbol } = useSettings();
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
                { date, dealerName: dealerName.trim(), amount: Number(amount), paymentMode, notes },
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

    const formatDate = (d) => {
        if (!d) return "";
        const dt = new Date(d);
        return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
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
        Cash: "#4ADE80",
        UPI: "#38BDF8",
        "Bank Transfer": "#A78BFA",
        Cheque: "#FACC15",
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
                <View style={[styles.cardAccent, { backgroundColor: modeColors[item.paymentMode] || "#38BDF8" }]} />

                <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.cardDealer, { color: themeColors.text }]}>{item.dealerName}</Text>
                            <Text style={[styles.cardDate, { color: themeColors.subtext }]}>{formatDate(item.date)}</Text>
                        </View>
                        <Text style={[styles.cardAmount, { color: "#4ADE80" }]}>
                            +{currencySymbol}{item.amount?.toLocaleString("en-IN")}
                        </Text>
                    </View>

                    <View style={styles.cardFooter}>
                        <View style={[styles.paymentBadge, { backgroundColor: `${modeColors[item.paymentMode] || "#38BDF8"}18` }]}>
                            <Ionicons
                                name={paymentIcons[item.paymentMode] || "card-outline"}
                                size={13}
                                color={modeColors[item.paymentMode] || "#38BDF8"}
                            />
                            <Text style={[styles.paymentBadgeText, { color: modeColors[item.paymentMode] || "#38BDF8" }]}>
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
        </Swipeable>
    );

    return (
        <ExpoLinearGradient colors={themeColors.background} style={{ flex: 1 }}>
            <SafeAreaView style={styles.container}>
                <Text style={[styles.heading, { color: themeColors.text }]}>Income</Text>

                {/* Total Card */}
                <View style={[styles.totalBox, { borderColor: themeColors.border, borderWidth: isDark ? 0 : 1 }]}>
                    <View style={styles.totalTop}>
                        <View>
                            <Text style={styles.totalLabel}>Total Income</Text>
                            <Text style={styles.totalAmount}>
                                {currencySymbol}{totalIncome.toLocaleString("en-IN")}
                            </Text>
                        </View>
                        <View style={styles.totalIconWrap}>
                            <Ionicons name="trending-up" size={28} color="#4ADE80" />
                        </View>
                    </View>

                    {/* Payment mode breakdown */}
                    {Object.keys(modeBreakdown).length > 0 && (
                        <View style={styles.breakdownRow}>
                            {Object.entries(modeBreakdown).map(([mode, val]) => (
                                <View key={mode} style={styles.breakdownItem}>
                                    <View style={[styles.breakdownDot, { backgroundColor: modeColors[mode] }]} />
                                    <Text style={styles.breakdownLabel}>{mode}</Text>
                                    <Text style={styles.breakdownValue}>{currencySymbol}{val.toLocaleString("en-IN")}</Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* Search Bar */}
                <View style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
                    <Ionicons name="search-outline" size={18} color={themeColors.subtext} />
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
                                    filterMode === mode && styles.activeChip,
                                ]}
                                onPress={() => setFilterMode(mode)}
                            >
                                <Text
                                    style={[
                                        styles.filterText,
                                        filterMode === mode && styles.activeFilterText,
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
                    style={styles.fab}
                    onPress={() => setModalVisible(true)}
                    activeOpacity={0.8}
                >
                    <Ionicons name="add" size={28} color="#0F2027" />
                </TouchableOpacity>

                {/* Add Income Modal */}
                <Modal visible={modalVisible} animationType="slide">
                    <ExpoLinearGradient colors={themeColors.background} style={styles.modalContainer}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.modalHeader}>
                                <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                                    <Ionicons name="close" size={26} color={themeColors.text} />
                                </TouchableOpacity>
                                <Text style={[styles.modalHeading, { color: themeColors.text }]}>Add Income</Text>
                                <View style={{ width: 26 }} />
                            </View>

                            {/* Date */}
                            <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>Date</Text>
                            <TouchableOpacity
                                style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
                                onPress={() => setDatePickerVisible(true)}
                            >
                                <Ionicons name="calendar-outline" size={18} color={themeColors.subtext} style={{ marginRight: 10 }} />
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
                                style={[styles.inputText, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, color: themeColors.text }]}
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
                                    styles.inputText,
                                    {
                                        backgroundColor: themeColors.card,
                                        borderColor: "#4ADE80",
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
                                            paymentMode === mode && { backgroundColor: `${modeColors[mode]}20`, borderColor: modeColors[mode], borderWidth: 1.5 },
                                        ]}
                                        onPress={() => setPaymentMode(mode)}
                                    >
                                        <Ionicons
                                            name={paymentIcons[mode]}
                                            size={16}
                                            color={paymentMode === mode ? modeColors[mode] : themeColors.subtext}
                                        />
                                        <Text
                                            style={[
                                                styles.paymentChipText,
                                                { color: paymentMode === mode ? modeColors[mode] : themeColors.text },
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
                                    styles.inputText,
                                    {
                                        height: 90,
                                        textAlignVertical: "top",
                                        backgroundColor: themeColors.card,
                                        borderColor: themeColors.border,
                                        borderWidth: 1,
                                        color: themeColors.text,
                                    },
                                ]}
                                multiline
                            />

                            {/* Submit */}
                            <TouchableOpacity style={styles.addButton} onPress={handleAdd} activeOpacity={0.8}>
                                <Ionicons name="add-circle-outline" size={20} color="#0F2027" />
                                <Text style={styles.addButtonText}>Add Income</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => { setModalVisible(false); resetForm(); }}
                                style={styles.cancelBtn}
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

    /* ── Total Card ── */
    totalBox: {
        backgroundColor: "rgba(255,255,255,0.06)",
        padding: 20,
        borderRadius: 22,
        marginBottom: 18,
    },
    totalTop: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    totalLabel: { color: "#4ADE80", fontSize: 13, fontWeight: "600", letterSpacing: 0.5 },
    totalAmount: { fontSize: 28, color: "white", fontWeight: "800", marginTop: 4 },
    totalIconWrap: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: "rgba(74,222,128,0.12)",
        justifyContent: "center",
        alignItems: "center",
    },
    breakdownRow: {
        marginTop: 16,
        borderTopWidth: 1,
        borderTopColor: "rgba(255,255,255,0.08)",
        paddingTop: 14,
        gap: 8,
    },
    breakdownItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
    },
    breakdownDot: { width: 8, height: 8, borderRadius: 4 },
    breakdownLabel: { color: "rgba(255,255,255,0.5)", fontSize: 12, flex: 1 },
    breakdownValue: { color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: "600" },

    /* ── Search ── */
    searchBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderRadius: 14,
        marginBottom: 12,
        gap: 10,
    },
    searchInput: { flex: 1, fontSize: 14, padding: 0 },

    /* ── Filter ── */
    filterRow: { height: 42, marginBottom: 10 },
    filterChip: {
        height: 34,
        paddingHorizontal: 16,
        borderRadius: 18,
        backgroundColor: "rgba(255,255,255,0.08)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 8,
    },
    activeChip: { backgroundColor: "#38BDF8" },
    filterText: { color: "rgba(255,255,255,0.6)", fontWeight: "600", fontSize: 13 },
    activeFilterText: { color: "#0F2027" },

    /* ── Cards ── */
    card: {
        flexDirection: "row",
        borderRadius: 18,
        marginBottom: 10,
        overflow: "hidden",
    },
    cardAccent: {
        width: 4,
    },
    cardContent: {
        flex: 1,
        padding: 16,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    cardDealer: { fontSize: 16, fontWeight: "700" },
    cardDate: { fontSize: 12, marginTop: 2 },
    cardAmount: { fontSize: 18, fontWeight: "800" },
    cardFooter: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 10,
        gap: 10,
    },
    paymentBadge: {
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    paymentBadgeText: { fontSize: 11, fontWeight: "600" },
    cardNotes: { fontSize: 12, flex: 1 },

    /* ── Delete ── */
    deleteButton: {
        backgroundColor: "#EF4444",
        justifyContent: "center",
        alignItems: "center",
        width: 90,
        borderRadius: 18,
        marginBottom: 10,
        gap: 4,
    },
    deleteText: { color: "#fff", fontWeight: "600", fontSize: 12 },

    /* ── Empty ── */
    emptyState: {
        alignItems: "center",
        marginTop: 60,
    },

    /* ── FAB ── */
    fab: {
        position: "absolute",
        bottom: 100,
        right: 24,
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: "#38BDF8",
        justifyContent: "center",
        alignItems: "center",
        elevation: 8,
        shadowColor: "#38BDF8",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 10,
    },

    /* ── Modal ── */
    modalContainer: { flex: 1, padding: 20 },
    modalHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        marginTop: 40,
        marginBottom: 30,
    },
    modalHeading: { fontSize: 22, fontWeight: "800" },

    fieldLabel: {
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 0.5,
        textTransform: "uppercase",
        marginBottom: 8,
        marginTop: 18,
        paddingLeft: 2,
    },

    input: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        fontSize: 15,
    },
    inputText: {
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 14,
        fontSize: 15,
    },

    /* ── Payment Mode Grid ── */
    paymentGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 8,
    },
    paymentChip: {
        flexDirection: "row",
        alignItems: "center",
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
    },
    paymentChipText: { fontWeight: "600", fontSize: 13 },

    /* ── Buttons ── */
    addButton: {
        backgroundColor: "#38BDF8",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: 18,
        borderRadius: 16,
        marginTop: 28,
    },
    addButtonText: { color: "#0F2027", fontWeight: "800", fontSize: 16 },
    cancelBtn: {
        alignItems: "center",
        paddingVertical: 14,
        marginTop: 8,
    },
    cancelText: { fontSize: 15, fontWeight: "600" },
});

/* ── Date Picker Styles ── */
const dpStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
    },
    container: {
        width: "100%",
        maxWidth: 360,
        borderRadius: 22,
        padding: 20,
    },
    header: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    navBtn: { width: 36, height: 36, borderRadius: 10, justifyContent: "center", alignItems: "center" },
    navText: { fontSize: 22, fontWeight: "700" },
    monthYear: { fontSize: 17, fontWeight: "700" },
    weekRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 8 },
    weekDay: { width: 40, textAlign: "center", fontSize: 13, fontWeight: "600" },
    grid: { flexDirection: "row", flexWrap: "wrap" },
    dayCell: {
        width: `${100 / 7}%`,
        height: 40,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 10,
    },
    dayCellSelected: { borderRadius: 10 },
    dayCellToday: { borderWidth: 1.5, borderRadius: 10 },
    dayText: { fontSize: 15 },
    actions: {
        flexDirection: "row",
        justifyContent: "flex-end",
        gap: 10,
        marginTop: 16,
    },
    todayBtn: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
    todayBtnText: { fontWeight: "700", fontSize: 14 },
    confirmBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
    confirmBtnText: { fontWeight: "700", fontSize: 14 },
});
