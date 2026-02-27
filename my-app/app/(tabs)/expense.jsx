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
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { Swipeable } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../../context/AuthContext";
import { BASE_URL } from "../../config";

const screenWidth = Dimensions.get("window").width;

const categoriesList = [
  "Cement",
  "Steel",
  "Sand",
  "Bricks",
  "Labor",
  "Equipment",
  "Transport",
  "Miscellaneous",
];

const unitsList = ["Bags", "Kg", "Ton", "CFT", "Nos", "Trips", "Sqft", "Days", "Hours", "Liters"];

const paymentModes = ["Cash", "UPI", "Bank Transfer", "Cheque", "Credit"];

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS_OF_WEEK = ["Su","Mo","Tu","We","Th","Fr","Sa"];

// ─── Dark-themed Date Picker ───
function DatePickerModal({ visible, onClose, onSelect, selectedDate }) {
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

  const selectDay = (day) => {
    const d = new Date(viewYear, viewMonth, day);
    setPicked(d);
  };

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
        <Pressable style={dpStyles.container} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={dpStyles.header}>
            <TouchableOpacity onPress={goPrev} style={dpStyles.navBtn}>
              <Text style={dpStyles.navText}>‹</Text>
            </TouchableOpacity>
            <Text style={dpStyles.monthYear}>{MONTHS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={goNext} style={dpStyles.navBtn}>
              <Text style={dpStyles.navText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day-of-week headers */}
          <View style={dpStyles.weekRow}>
            {DAYS_OF_WEEK.map((d) => (
              <Text key={d} style={dpStyles.weekDay}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={dpStyles.grid}>
            {cells.map((day, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  dpStyles.dayCell,
                  isSelected(day) && dpStyles.dayCellSelected,
                  isToday(day) && !isSelected(day) && dpStyles.dayCellToday,
                ]}
                onPress={() => day && selectDay(day)}
                disabled={!day}
              >
                <Text style={[
                  dpStyles.dayText,
                  isSelected(day) && dpStyles.dayTextSelected,
                  isToday(day) && !isSelected(day) && dpStyles.dayTextToday,
                ]}>
                  {day || ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Actions */}
          <View style={dpStyles.actions}>
            <TouchableOpacity onPress={selectToday} style={dpStyles.todayBtn}>
              <Text style={dpStyles.todayBtnText}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmDate} style={dpStyles.confirmBtn}>
              <Text style={dpStyles.confirmBtnText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Dark-themed Dropdown Picker ───
function DropdownModal({ visible, onClose, onSelect, options, selected, title }) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={dpStyles.overlay} onPress={onClose}>
        <Pressable style={ddStyles.container} onPress={(e) => e.stopPropagation()}>
          <Text style={ddStyles.title}>{title}</Text>
          <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  ddStyles.option,
                  selected === opt && ddStyles.optionActive,
                ]}
                onPress={() => { onSelect(opt); onClose(); }}
              >
                <Text style={[
                  ddStyles.optionText,
                  selected === opt && ddStyles.optionTextActive,
                ]}>
                  {opt}
                </Text>
                {selected === opt && <Text style={ddStyles.check}>✓</Text>}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function Expense() {
  const { userToken } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Picker modals
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [unitDropdownVisible, setUnitDropdownVisible] = useState(false);

  // Form state
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [vendorName, setVendorName] = useState("");
  const [category, setCategory] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [ratePerUnit, setRatePerUnit] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [projectTag, setProjectTag] = useState("");
  const [notes, setNotes] = useState("");

  const calculatedTotal =
    quantity && ratePerUnit
      ? (Number(quantity) * Number(ratePerUnit)).toFixed(2)
      : "0.00";

  useEffect(() => {
    if (userToken) fetchExpenses();
  }, [userToken]);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/expenses`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setExpenses(res.data);
    } catch (error) {
      console.log("Fetch error:", error.message);
    }
  };

  const resetForm = () => {
    setDate(new Date().toISOString().split("T")[0]);
    setVendorName("");
    setCategory("");
    setQuantity("");
    setUnit("");
    setRatePerUnit("");
    setPaymentMode("Cash");
    setProjectTag("");
    setNotes("");
  };

  const handleAdd = async () => {
    if (!vendorName || !category || !quantity || !unit || !ratePerUnit) {
      Alert.alert("Missing Fields", "Please fill in vendor, category, quantity, unit, and rate.");
      return;
    }

    try {
      const res = await axios.post(
        `${BASE_URL}/expenses`,
        {
          date,
          vendorName,
          category,
          quantity: Number(quantity),
          unit,
          ratePerUnit: Number(ratePerUnit),
          paymentMode,
          projectTag,
          notes,
        },
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      setExpenses([res.data, ...expenses]);
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.log("Add error:", error.message);
      Alert.alert("Error", error.response?.data?.message || "Failed to add expense");
    }
  };

  const deleteExpense = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/expenses/${id}`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      setExpenses(expenses.filter((item) => item._id !== id));
    } catch (error) {
      console.log("Delete error:", error.message);
    }
  };

  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  };

  // Filter by category then by search query (vendor name or date)
  const filteredExpenses = useMemo(() => {
    let result = selectedFilter === "All"
      ? expenses
      : expenses.filter((e) => e.category === selectedFilter);

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter((e) => {
        const vendorMatch = e.vendorName?.toLowerCase().includes(q);
        const dateMatch = formatDate(e.date).toLowerCase().includes(q);
        const rawDateMatch = e.date?.includes(q);
        return vendorMatch || dateMatch || rawDateMatch;
      });
    }
    return result;
  }, [expenses, selectedFilter, searchQuery]);

  const totalAmount = expenses.reduce(
    (sum, item) => sum + (item.totalAmount || 0),
    0
  );

  const grouped = useMemo(() => {
    const data = {};
    expenses.forEach((item) => {
      data[item.category] = (data[item.category] || 0) + (item.totalAmount || 0);
    });
    return data;
  }, [expenses]);

  const chartColors = [
    "#4ADE80", "#38BDF8", "#FACC15", "#A78BFA",
    "#F472B6", "#FB923C", "#818CF8", "#F87171",
  ];

  const chartData =
    Object.keys(grouped).length > 0
      ? Object.keys(grouped).map((key, index) => ({
          name: key,
          amount: grouped[key],
          color: chartColors[index % chartColors.length],
          legendFontColor: "#fff",
          legendFontSize: 12,
        }))
      : [];

  const renderItem = ({ item }) => (
    <Swipeable
      renderRightActions={() => (
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => deleteExpense(item._id)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      )}
    >
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardVendor}>{item.vendorName}</Text>
            <Text style={styles.cardAmount}>₹{item.totalAmount?.toLocaleString("en-IN")}</Text>
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardCategory}>{item.category}</Text>
            <Text style={styles.cardDot}>•</Text>
            <Text style={styles.cardDetail}>{item.quantity} {item.unit} @ ₹{item.ratePerUnit}</Text>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardDate}>{formatDate(item.date)}</Text>
            {item.projectTag ? <Text style={styles.cardTag}>{item.projectTag}</Text> : null}
            <Text style={styles.cardPayment}>{item.paymentMode}</Text>
          </View>
        </View>
      </View>
    </Swipeable>
  );

  return (
    <LinearGradient
      colors={["#0F2027", "#203A43", "#2C5364"]}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <Text style={styles.heading}>Expense Overview</Text>

        {/* Total Card */}
        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total Expenses</Text>
          <Text style={styles.totalAmount}>₹{totalAmount.toLocaleString("en-IN")}</Text>
        </View>

        {/* Chart */}
        {chartData.length > 0 && (
          <View style={styles.chartWrapper}>
            <PieChart
              data={chartData}
              width={screenWidth - 80}
              height={170}
              chartConfig={{
                backgroundGradientFrom: "#0F2027",
                backgroundGradientTo: "#0F2027",
                color: () => "#fff",
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="10"
              hasLegend={true}
              center={[10, 0]}
            />
          </View>
        )}

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            placeholder="Search vendor or date..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={styles.searchClear}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Compact Filter */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {["All", ...categoriesList].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  selectedFilter === cat && styles.activeChip,
                ]}
                onPress={() => setSelectedFilter(cat)}
              >
                <Text
                  style={[
                    styles.filterText,
                    selectedFilter === cat && styles.activeFilterText,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* List */}
        <FlatList
          data={filteredExpenses}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120 }}
          ListEmptyComponent={
            <Text style={{ color: "rgba(255,255,255,0.4)", textAlign: "center", marginTop: 40 }}>
              No expenses yet. Tap + to add one.
            </Text>
          }
        />

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {/* Add Expense Modal */}
        <Modal visible={modalVisible} animationType="slide">
          <LinearGradient colors={["#0F2027", "#203A43"]} style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalHeading}>Add Expense</Text>

              {/* Date Picker */}
              <Text style={styles.fieldLabel}>Date</Text>
              <TouchableOpacity
                style={styles.input}
                onPress={() => setDatePickerVisible(true)}
              >
                <Text style={{ color: date ? "white" : "#aaa", fontSize: 15 }}>
                  {date ? formatDate(date) : "Select date"}
                </Text>
              </TouchableOpacity>
              <DatePickerModal
                visible={datePickerVisible}
                onClose={() => setDatePickerVisible(false)}
                onSelect={setDate}
                selectedDate={date}
              />

              {/* Vendor Name */}
              <Text style={styles.fieldLabel}>Vendor Name</Text>
              <TextInput
                placeholder="e.g. Ambuja Suppliers"
                placeholderTextColor="#aaa"
                value={vendorName}
                onChangeText={setVendorName}
                style={styles.input}
              />

              {/* Material Category */}
              <Text style={styles.fieldLabel}>Material Category</Text>
              <View style={styles.categoryGrid}>
                {categoriesList.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      category === cat && styles.activeCategoryChip,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === cat && styles.activeCategoryText,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quantity + Unit row */}
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.fieldLabel}>Quantity</Text>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor="#aaa"
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    style={styles.input}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.fieldLabel}>Unit</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.dropdownTrigger]}
                    onPress={() => setUnitDropdownVisible(true)}
                  >
                    <Text style={{ color: unit ? "white" : "#aaa", fontSize: 15, flex: 1 }}>
                      {unit || "Select unit"}
                    </Text>
                    <Text style={{ color: "rgba(255,255,255,0.5)", fontSize: 12 }}>▼</Text>
                  </TouchableOpacity>
                  <DropdownModal
                    visible={unitDropdownVisible}
                    onClose={() => setUnitDropdownVisible(false)}
                    onSelect={setUnit}
                    options={unitsList}
                    selected={unit}
                    title="Select Unit"
                  />
                </View>
              </View>

              {/* Rate per Unit */}
              <Text style={styles.fieldLabel}>Rate per Unit (₹)</Text>
              <TextInput
                placeholder="0"
                placeholderTextColor="#aaa"
                value={ratePerUnit}
                onChangeText={setRatePerUnit}
                keyboardType="numeric"
                style={styles.input}
              />

              {/* Auto-calculated Total */}
              <View style={styles.totalCalcBox}>
                <Text style={styles.totalCalcLabel}>Total Amount</Text>
                <Text style={styles.totalCalcValue}>₹{calculatedTotal}</Text>
              </View>

              {/* Payment Mode */}
              <Text style={styles.fieldLabel}>Payment Mode</Text>
              <View style={styles.categoryGrid}>
                {paymentModes.map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.categoryChip,
                      paymentMode === mode && styles.activeCategoryChip,
                    ]}
                    onPress={() => setPaymentMode(mode)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        paymentMode === mode && styles.activeCategoryText,
                      ]}
                    >
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Project Tag */}
              <Text style={styles.fieldLabel}>Project Tag</Text>
              <TextInput
                placeholder="e.g. Site-A, Tower-3"
                placeholderTextColor="#aaa"
                value={projectTag}
                onChangeText={setProjectTag}
                style={styles.input}
              />

              {/* Notes */}
              <Text style={styles.fieldLabel}>Notes</Text>
              <TextInput
                placeholder="Additional details..."
                placeholderTextColor="#aaa"
                value={notes}
                onChangeText={setNotes}
                style={[styles.input, { height: 80, textAlignVertical: "top" }]}
                multiline
              />

              {/* Submit */}
              <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
                <Text style={styles.addButtonText}>Add Expense</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => { setModalVisible(false); resetForm(); }}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <View style={{ height: 40 }} />
            </ScrollView>
          </LinearGradient>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },

  heading: {
    fontSize: 34,
    fontWeight: "700",
    color: "white",
    marginBottom: 15,
    marginTop: 40,
  },

  totalBox: {
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },

  totalLabel: { color: "#4ADE80", fontSize: 13 },

  totalAmount: {
    fontSize: 26,
    color: "white",
    fontWeight: "700",
  },

  chartWrapper: {
    alignItems: "center",
    marginBottom: 10,
  },

  filterRow: {
    height: 50,
    marginBottom: 10,
  },

  filterChip: {
    height: 34,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  filterText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.8)",
  },

  activeChip: { backgroundColor: "#4ADE80" },

  activeFilterText: {
    color: "#0F2027",
    fontWeight: "600",
  },

  // ── Expense Card ──
  card: {
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 16,
    borderRadius: 18,
    marginBottom: 12,
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },

  cardVendor: { color: "white", fontWeight: "700", fontSize: 15, flex: 1 },

  cardAmount: {
    color: "#4ADE80",
    fontWeight: "700",
    fontSize: 16,
  },

  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  cardCategory: {
    color: "#4ADE80",
    fontSize: 12,
    fontWeight: "600",
  },

  cardDot: { color: "rgba(255,255,255,0.4)", marginHorizontal: 6, fontSize: 10 },

  cardDetail: { color: "rgba(255,255,255,0.6)", fontSize: 12 },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  cardDate: { color: "rgba(255,255,255,0.5)", fontSize: 11 },

  cardTag: {
    backgroundColor: "rgba(74,222,128,0.15)",
    color: "#4ADE80",
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },

  cardPayment: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
  },

  deleteButton: {
    backgroundColor: "#EF4444",
    justifyContent: "center",
    alignItems: "center",
    width: 90,
    borderRadius: 18,
    marginBottom: 12,
  },

  deleteText: { color: "white", fontWeight: "600" },

  fab: {
    position: "absolute",
    bottom: 30,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4ADE80",
    justifyContent: "center",
    alignItems: "center",
    elevation: 10,
  },

  fabText: {
    fontSize: 30,
    color: "#0F2027",
    fontWeight: "600",
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
    color: "white",
    marginBottom: 20,
  },

  fieldLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 15,
    borderRadius: 14,
    marginBottom: 15,
    color: "white",
    fontSize: 15,
  },

  row: {
    flexDirection: "row",
    marginBottom: 0,
  },

  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 15,
  },

  categoryChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
  },

  categoryText: {
    color: "white",
    fontSize: 13,
  },

  activeCategoryChip: {
    backgroundColor: "#4ADE80",
  },

  activeCategoryText: {
    color: "#0F2027",
    fontWeight: "600",
  },

  unitChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginRight: 8,
  },

  unitText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
  },

  activeUnitChip: {
    backgroundColor: "#4ADE80",
  },

  activeUnitText: {
    color: "#0F2027",
    fontWeight: "600",
  },

  totalCalcBox: {
    backgroundColor: "rgba(74,222,128,0.1)",
    borderWidth: 1,
    borderColor: "rgba(74,222,128,0.3)",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  totalCalcLabel: {
    color: "#4ADE80",
    fontWeight: "600",
    fontSize: 14,
  },

  totalCalcValue: {
    color: "#4ADE80",
    fontWeight: "700",
    fontSize: 20,
  },

  addButton: {
    backgroundColor: "#4ADE80",
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 10,
  },

  addButtonText: {
    fontWeight: "700",
    color: "#0F2027",
    fontSize: 16,
  },

  cancelText: {
    color: "rgba(255,255,255,0.6)",
    marginTop: 15,
    textAlign: "center",
    fontSize: 15,
  },

  // ── Search Bar ──
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "web" ? 10 : 0,
    marginBottom: 12,
    height: 46,
  },

  searchIcon: {
    fontSize: 14,
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    color: "white",
    fontSize: 14,
    height: 46,
  },

  searchClear: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 16,
    paddingLeft: 10,
  },

  // ── Dropdown trigger ──
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
});

// ─── Date Picker Styles ───
const dpStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#1a2e38",
    borderRadius: 20,
    padding: 20,
    width: screenWidth - 60,
    maxWidth: 380,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  navText: { color: "white", fontSize: 22, fontWeight: "600" },
  monthYear: { color: "white", fontSize: 17, fontWeight: "700" },
  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    color: "rgba(255,255,255,0.4)",
    fontSize: 12,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  dayCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 20,
  },
  dayCellSelected: {
    backgroundColor: "#4ADE80",
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: "#4ADE80",
  },
  dayText: {
    color: "white",
    fontSize: 14,
  },
  dayTextSelected: {
    color: "#0F2027",
    fontWeight: "700",
  },
  dayTextToday: {
    color: "#4ADE80",
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
    gap: 12,
  },
  todayBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
  },
  todayBtnText: { color: "#4ADE80", fontWeight: "600", fontSize: 14 },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#4ADE80",
    alignItems: "center",
  },
  confirmBtnText: { color: "#0F2027", fontWeight: "700", fontSize: 14 },
});

// ─── Dropdown Styles ───
const ddStyles = StyleSheet.create({
  container: {
    backgroundColor: "#1a2e38",
    borderRadius: 20,
    padding: 20,
    width: screenWidth - 80,
    maxWidth: 340,
  },
  title: {
    color: "white",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 14,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  optionActive: {
    backgroundColor: "rgba(74,222,128,0.15)",
  },
  optionText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 15,
  },
  optionTextActive: {
    color: "#4ADE80",
    fontWeight: "600",
  },
  check: {
    color: "#4ADE80",
    fontSize: 16,
    fontWeight: "700",
  },
});