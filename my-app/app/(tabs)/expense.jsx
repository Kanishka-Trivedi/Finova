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
import { PieChart } from "react-native-chart-kit";
import { Swipeable } from "react-native-gesture-handler";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { BASE_URL } from "../../config";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const screenWidth = Dimensions.get("window").width;

const categoriesList = [
  "Cement",
  "Steel",
  "Sand",
  "Bricks",
  "Aggregate",
  "Plumbing",
  "Granite",
  "Marble",
  "Tiles",
  "Color",
  "Block",
  "Labor",
  "Equipment",
  "Transport",
  "Miscellaneous",
];

const unitsList = ["Bags", "Kg", "Ton", "CFT", "Nos", "Trips", "Sqft", "Days", "Hours", "Liters", "Boxes", "Ltrs", "Brass"];

const fixedUnits = {
  Cement: "Bags",
  Steel: "Kg",
  Sand: "Ton",
  Bricks: "Nos",
  Aggregate: "Ton",
  Tiles: "Boxes",
  Color: "Ltrs",
  Block: "Brass",
  Granite: "Sqft",
  Marble: "Sqft",
};

const transportUnits = ["Hours", "Days", "Trips"];
const categoriesWithoutUnits = ["Labor", "Equipment", "Plumbing"];

const steelSizes = ["8mm", "10mm", "12mm", "16mm", "20mm", "25mm", "Centering Wire"];
const aggregateSizes = ["24 to 40mm", "40 to 60mm"];

const paymentModes = ["Cash", "UPI", "Bank Transfer", "Cheque", "Credit Card"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// ─── Dark-themed Date Picker ───
function DatePickerModal({ visible, onClose, onSelect, selectedDate }) {
  const { themeColors } = useSettings();
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
        <Pressable style={[dpStyles.container, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={dpStyles.header}>
            <TouchableOpacity onPress={goPrev} style={[dpStyles.navBtn, { backgroundColor: themeColors.border }]}>
              <Text style={[dpStyles.navText, { color: themeColors.text }]}>‹</Text>
            </TouchableOpacity>
            <Text style={[dpStyles.monthYear, { color: themeColors.text }]}>{MONTHS[viewMonth]} {viewYear}</Text>
            <TouchableOpacity onPress={goNext} style={[dpStyles.navBtn, { backgroundColor: themeColors.border }]}>
              <Text style={[dpStyles.navText, { color: themeColors.text }]}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day-of-week headers */}
          <View style={dpStyles.weekRow}>
            {DAYS_OF_WEEK.map((d) => (
              <Text key={d} style={[dpStyles.weekDay, { color: themeColors.subtext }]}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={dpStyles.grid}>
            {cells.map((day, idx) => (
              <TouchableOpacity
                key={idx}
                style={[
                  dpStyles.dayCell,
                  isSelected(day) && [dpStyles.dayCellSelected, { backgroundColor: themeColors.primary }],
                  isToday(day) && !isSelected(day) && [dpStyles.dayCellToday, { borderColor: themeColors.primary }],
                ]}
                onPress={() => day && selectDay(day)}
                disabled={!day}
              >
                <Text style={[
                  dpStyles.dayText,
                  { color: day ? themeColors.text : "transparent" },
                  isSelected(day) && [dpStyles.dayTextSelected, { color: themeColors.tabBar }],
                  isToday(day) && !isSelected(day) && [dpStyles.dayTextToday, { color: themeColors.primary }],
                ]}>
                  {day || ""}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Actions */}
          <View style={dpStyles.actions}>
            <TouchableOpacity onPress={selectToday} style={[dpStyles.todayBtn, { backgroundColor: themeColors.border }]}>
              <Text style={[dpStyles.todayBtnText, { color: themeColors.primary }]}>Today</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={confirmDate} style={[dpStyles.confirmBtn, { backgroundColor: themeColors.primary }]}>
              <Text style={[dpStyles.confirmBtnText, { color: themeColors.tabBar }]}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ─── Dark-themed Dropdown Picker ───
function DropdownModal({ visible, onClose, onSelect, options, selected, title }) {
  const { themeColors } = useSettings();
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={dpStyles.overlay} onPress={onClose}>
        <Pressable style={[ddStyles.container, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]} onPress={(e) => e.stopPropagation()}>
          <Text style={[ddStyles.title, { color: themeColors.text }]}>{title}</Text>
          <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  ddStyles.option,
                  selected === opt && [ddStyles.optionActive, { backgroundColor: `${themeColors.primary}20` }],
                ]}
                onPress={() => { onSelect(opt); onClose(); }}
              >
                <Text style={[
                  ddStyles.optionText,
                  { color: themeColors.text },
                  selected === opt && [ddStyles.optionTextActive, { color: themeColors.primary }],
                ]}>
                  {opt}
                </Text>
                {selected === opt && <Text style={[ddStyles.check, { color: themeColors.primary }]}>✓</Text>}
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
  const { t, themeColors, settings, currencySymbol, formatAmount, convertToBase, formatDate } = useSettings();
  const [expenses, setExpenses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  // Picker modals
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [unitDropdownVisible, setUnitDropdownVisible] = useState(false);
  const router = useRouter();

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

  const [manualTotal, setManualTotal] = useState("");
  const [diameter, setDiameter] = useState("");
  const [diameterDropdownVisible, setDiameterDropdownVisible] = useState(false);

  const formattedCalculatedTotal = useMemo(() => {
    const r = Number(ratePerUnit) || 0;
    const q = Number(quantity) || (categoriesWithoutUnits.includes(category) ? 1 : 0);

    if (r > 0 && q > 0) {
      return (q * r).toFixed(2);
    }
    return "0.00";
  }, [quantity, ratePerUnit, category]);

  // Auto-fill manualTotal for unit-less categories when rate is entered
  useEffect(() => {
    if (categoriesWithoutUnits.includes(category) && ratePerUnit && !manualTotal) {
      setManualTotal(ratePerUnit);
    }
  }, [ratePerUnit, category]);

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
    setManualTotal("");
    setDiameter("");
  };

  const handleAdd = async () => {
    const trimmedVendor = vendorName?.trim();
    if (!trimmedVendor || !category) {
      Alert.alert("Missing Fields", "Please enter a vendor name and select a category.");
      return;
    }

    // Capture values directly to avoid any state sync race conditions
    const isNoUnit = categoriesWithoutUnits.includes(category);
    const rawRate = Number(ratePerUnit) || 0;
    const rawManual = Number(manualTotal) || 0;
    const rawQuantity = Number(quantity) || (isNoUnit ? 1 : 0);

    // For unit-less categories, only the manualTotal (Total Amount field) matters
    let definitiveTotal = rawManual;
    let finalRate = rawRate;

    if (isNoUnit) {
      definitiveTotal = rawManual;
      finalRate = rawManual; // Set rate to total for consistency in detail page
    } else {
      definitiveTotal = rawManual || (rawRate * rawQuantity);
    }

    if (definitiveTotal <= 0) {
      Alert.alert(
        "Invalid Amount",
        isNoUnit
          ? "Please enter the total amount."
          : "Total amount must be greater than 0. Please enter a rate or a manual total."
      );
      return;
    }

    try {
      const payload = {
        date,
        vendorName: trimmedVendor,
        category,
        quantity: isNoUnit ? 1 : rawQuantity,
        unit: unit || "None",
        diameter,
        ratePerUnit: convertToBase(isNoUnit ? definitiveTotal : (rawRate || definitiveTotal)),
        totalAmount: convertToBase(definitiveTotal),
        paymentMode,
        projectTag: projectTag?.trim(),
        notes: notes?.trim(),
      };

      const res = await axios.post(
        `${BASE_URL}/expenses`,
        payload,
        { headers: { Authorization: `Bearer ${userToken}` } }
      );

      setExpenses([res.data, ...expenses]);
      setModalVisible(false);
      resetForm();
    } catch (error) {
      console.log("Add expense error details:", error.response?.data || error.message);
      Alert.alert("Error", error.response?.data?.message || "Failed to add expense. Please try again.");
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

  const totalAmountValue = expenses.reduce(
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
    "#34D399", "#38BDF8", "#FBBF24", "#F87171",
    "#A78BFA", "#2DD4BF", "#FB923C", "#818CF8",
    "#F472B6", "#4ADE80", "#E879F9", "#22D3EE",
    "#FACC15", "#6366F1", "#14B8A6", "#F97316",
  ];

  const categoryColors = {
    Cement: "#34D399", Steel: "#38BDF8", Sand: "#FBBF24", Bricks: "#F87171",
    Aggregate: "#A78BFA", Plumbing: "#2DD4BF", Granite: "#FB923C", Marble: "#818CF8",
    Tiles: "#F472B6", Color: "#4ADE80", Block: "#E879F9", Labor: "#22D3EE",
    Equipment: "#FACC15", Transport: "#6366F1", Miscellaneous: "#14B8A6",
  };

  const chartData =
    Object.keys(grouped).length > 0
      ? Object.keys(grouped).map((key, index) => ({
        name: key,
        amount: grouped[key],
        color: categoryColors[key] || chartColors[index % chartColors.length],
        legendFontColor: settings.theme === 'light' ? "#4A4A4A" : "#fff",
        legendFontSize: 12,
      }))
      : [];

  const renderItem = ({ item }) => {
    const catColor = categoryColors[item.category] || "#5B8A72";
    return (
      <Swipeable
        renderRightActions={() => (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => deleteExpense(item._id)}
          >
            <Text style={styles.deleteText}>{t('delete') || "Delete"}</Text>
          </TouchableOpacity>
        )}
      >
        <TouchableOpacity
          style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: settings.theme === 'light' ? 1 : 0 }]}
          activeOpacity={0.7}
          onPress={() => {
            router.push({
              pathname: "/expense-detail",
              params: { ...item }
            });
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardVendor, { color: themeColors.text }]}>{item.vendorName}</Text>
              <Text style={styles.cardAmount}>{formatAmount(item.totalAmount)}</Text>
            </View>
            <View style={styles.cardMeta}>
              <View style={{ backgroundColor: `${catColor}18`, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                <Text style={{ color: catColor, fontSize: 12, fontWeight: "600" }}>
                  {item.category}{item.diameter ? ` (${item.diameter})` : ""}
                </Text>
              </View>
              <Text style={[styles.cardDot, { color: themeColors.subtext }]}>•</Text>
              <Text style={[styles.cardDetail, { color: themeColors.subtext }]}>{item.quantity} {item.unit} @ {formatAmount(item.ratePerUnit)}</Text>
            </View>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardDate, { color: themeColors.subtext }]}>{formatDate(item.date)}</Text>
              {item.projectTag ? <Text style={[styles.cardTag, { backgroundColor: `${catColor}15`, color: catColor, borderColor: `${catColor}30`, borderWidth: 0.5 }]}>{item.projectTag}</Text> : null}
              <Text style={[styles.cardPayment, { color: themeColors.subtext }]}>{item.paymentMode}</Text>
            </View>
          </View>
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <ExpoLinearGradient
      colors={themeColors.background}
      style={{ flex: 1 }}
    >
      <SafeAreaView style={styles.container}>
        <Text style={[styles.heading, { color: themeColors.text }]}>{t('expense_overview')}</Text>

        {/* Total Card */}
        <View style={[styles.totalBox, { backgroundColor: "#5B8A72", padding: 20 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.18)", justifyContent: "center", alignItems: "center" }}>
              <Ionicons name="arrow-up-outline" size={20} color="#fff" />
            </View>
            <Text style={[styles.totalLabel, { color: "rgba(255,255,255,0.85)" }]}>{t('total_expenses')}</Text>
          </View>
          <Text style={[styles.totalAmount, { color: "#fff", fontSize: 28, marginTop: 4 }]}>{formatAmount(totalAmountValue)}</Text>
        </View>

        {/* Chart */}
        {chartData.length > 0 ? (
          <View style={[styles.chartWrapper, { backgroundColor: themeColors.card, borderRadius: 20, padding: 14, borderWidth: 1, borderColor: themeColors.border, marginBottom: 14 }]}>
            <PieChart
              data={chartData}
              width={screenWidth - 80}
              height={170}
              chartConfig={{
                backgroundGradientFrom: themeColors.card,
                backgroundGradientTo: themeColors.card,
                color: () => themeColors.text,
              }}
              accessor="amount"
              backgroundColor="transparent"
              paddingLeft="10"
              hasLegend={true}
              center={[10, 0]}
            />
          </View>
        ) : null}

        {/* Search Bar */}
        <View style={[styles.searchBar, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
          <Ionicons name="search-outline" size={18} color={themeColors.subtext} style={{ marginRight: 10 }} />
          <TextInput
            placeholder={t('search_placeholder')}
            placeholderTextColor={themeColors.subtext}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchInput, { color: themeColors.text }]}
          />
          {searchQuery.length > 0 ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={[styles.searchClear, { color: themeColors.subtext }]}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Compact Filter */}
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {["All", ...categoriesList].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  { backgroundColor: `${themeColors.text}08` },
                  selectedFilter === cat && { backgroundColor: '#5B8A72' },
                ]}
                onPress={() => setSelectedFilter(cat)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: themeColors.subtext },
                    selectedFilter === cat && { color: '#fff', fontWeight: '600' },
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
            <Text style={{ color: themeColors.subtext, textAlign: "center", marginTop: 40 }}>
              {t('no_expenses')}
            </Text>
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

        {/* Add Expense Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          onRequestClose={() => {
            setModalVisible(false);
            resetForm();
          }}
        >
          <ExpoLinearGradient colors={themeColors.background} style={styles.modalContainer}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.modalHeading, { color: themeColors.text }]}>{t('add_expense_title')}</Text>

              {/* Date Picker */}
              <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>{t('date') || "Date"}</Text>
              <TouchableOpacity
                style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
                onPress={() => setDatePickerVisible(true)}
              >
                <Text style={{ color: date ? themeColors.text : themeColors.subtext, fontSize: 15 }}>
                  {date ? formatDate(date) : t('select_date') || "Select date"}
                </Text>
              </TouchableOpacity>
              <DatePickerModal
                visible={datePickerVisible}
                onClose={() => setDatePickerVisible(false)}
                onSelect={setDate}
                selectedDate={date}
              />

              {/* Vendor Name */}
              <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>{t('vendor_name')}</Text>
              <TextInput
                placeholder="e.g. Ambuja Suppliers"
                placeholderTextColor={themeColors.subtext}
                value={vendorName}
                onChangeText={setVendorName}
                style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, color: themeColors.text }]}
              />

              {/* Material Category */}
              <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>{t('material_category')}</Text>
              <View style={styles.categoryGrid}>
                {categoriesList.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: themeColors.border },
                      category === cat && styles.activeCategoryChip,
                    ]}
                    onPress={() => {
                      setCategory(cat);
                      if (fixedUnits[cat]) {
                        setUnit(fixedUnits[cat]);
                      } else if (categoriesWithoutUnits.includes(cat)) {
                        setUnit("None");
                      } else {
                        setUnit("");
                      }
                      setManualTotal(""); // Clear manual total on category change to prevent overlap
                    }}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        category === cat ? styles.activeCategoryText : { color: themeColors.text },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quantity + Unit row */}
              {!categoriesWithoutUnits.includes(category) ? (
                <View style={styles.row}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>{t('quantity')}</Text>
                    <TextInput
                      placeholder="0"
                      placeholderTextColor={themeColors.subtext}
                      value={quantity}
                      onChangeText={setQuantity}
                      keyboardType="numeric"
                      style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, color: themeColors.text }]}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>{t('unit')}</Text>
                    <TouchableOpacity
                      style={[
                        styles.input,
                        styles.dropdownTrigger,
                        { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 },
                        fixedUnits[category] && { opacity: 0.7 }
                      ]}
                      onPress={() => {
                        if (!fixedUnits[category]) {
                          setUnitDropdownVisible(true);
                        }
                      }}
                      disabled={!!fixedUnits[category]}
                    >
                      <Text style={{ color: unit ? themeColors.text : themeColors.subtext, fontSize: 15, flex: 1 }}>
                        {unit || "Select unit"}
                      </Text>
                      {!fixedUnits[category] && <Text style={{ color: themeColors.subtext, fontSize: 12 }}>▼</Text>}
                    </TouchableOpacity>
                    <DropdownModal
                      visible={unitDropdownVisible}
                      onClose={() => setUnitDropdownVisible(false)}
                      onSelect={setUnit}
                      options={category === "Transport" ? transportUnits : unitsList}
                      selected={unit}
                      title="Select Unit"
                    />
                  </View>
                </View>
              ) : null}

              {/* Diameter Selection (Steel & Aggregate only) */}
              {(category === "Steel" || category === "Aggregate") ? (
                <View>
                  <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>{category === "Steel" ? "Diameter" : "Size"}</Text>
                  <TouchableOpacity
                    style={[styles.input, styles.dropdownTrigger, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}
                    onPress={() => setDiameterDropdownVisible(true)}
                  >
                    <Text style={{ color: diameter ? themeColors.text : themeColors.subtext, fontSize: 15, flex: 1 }}>
                      {diameter || "Select size"}
                    </Text>
                    <Text style={{ color: themeColors.subtext, fontSize: 12 }}>▼</Text>
                  </TouchableOpacity>
                  <DropdownModal
                    visible={diameterDropdownVisible}
                    onClose={() => setDiameterDropdownVisible(false)}
                    onSelect={setDiameter}
                    options={category === "Steel" ? steelSizes : aggregateSizes}
                    selected={diameter}
                    title="Select Size"
                  />
                </View>
              ) : null}

              {/* Rate per Unit - Hidden for Labor, Equipment, Plumbing */}
              {!categoriesWithoutUnits.includes(category) && (
                <>
                  <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>{t('rate_per_unit')} ({currencySymbol})</Text>
                  <TextInput
                    placeholder="0"
                    placeholderTextColor={themeColors.subtext}
                    value={ratePerUnit}
                    onChangeText={setRatePerUnit}
                    keyboardType="numeric"
                    style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, color: themeColors.text }]}
                  />
                </>
              )}

              {/* Manual Total Amount */}
              <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>{t('total_amount_label')} ({currencySymbol})</Text>
              <TextInput
                placeholder={
                  formattedCalculatedTotal !== "0.00"
                    ? `Suggestion: ${currencySymbol}${formattedCalculatedTotal}`
                    : (categoriesWithoutUnits.includes(category) ? "Required: Enter total amount" : "Enter final amount")
                }
                placeholderTextColor={themeColors.subtext}
                value={manualTotal}
                onChangeText={setManualTotal}
                keyboardType="numeric"
                style={[styles.input, { backgroundColor: themeColors.card, borderBottomWidth: 1, borderBottomColor: "#5B8A72", borderWidth: 1, borderColor: themeColors.border, color: themeColors.text }]}
              />

              {/* Payment Mode */}
              <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>{t('payment_mode')}</Text>
              <View style={styles.categoryGrid}>
                {paymentModes.map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    style={[
                      styles.categoryChip,
                      { backgroundColor: themeColors.border },
                      paymentMode === mode && styles.activeCategoryChip,
                    ]}
                    onPress={() => setPaymentMode(mode)}
                  >
                    <Text
                      style={[
                        styles.categoryText,
                        paymentMode === mode ? styles.activeCategoryText : { color: themeColors.text },
                      ]}
                    >
                      {mode}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Project Tag */}
              <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>{t('project_tag')}</Text>
              <TextInput
                placeholder="e.g. Site-A, Tower-3"
                placeholderTextColor={themeColors.subtext}
                value={projectTag}
                onChangeText={setProjectTag}
                style={[styles.input, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, color: themeColors.text }]}
              />

              {/* Notes */}
              <Text style={[styles.fieldLabel, { color: themeColors.subtext }]}>{t('notes')}</Text>
              <TextInput
                placeholder="Additional details..."
                placeholderTextColor={themeColors.subtext}
                value={notes}
                onChangeText={setNotes}
                style={[styles.input, { height: 80, textAlignVertical: "top", backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1, color: themeColors.text }]}
                multiline
              />

              {/* Submit */}
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: "#5B8A72", marginTop: 20 }]}
                onPress={handleAdd}
                activeOpacity={0.8}
              >
                <Text style={[styles.addButtonText, { color: "#fff" }]}>
                  {t('add_expense_btn') || "Add Expense"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => { setModalVisible(false); resetForm(); }}
                style={{ paddingVertical: 15 }}
              >
                <Text style={[styles.cancelText, { color: themeColors.subtext }]}>
                  {t('cancel') || "Cancel"}
                </Text>
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

  totalLabel: { color: "#5B8A72", fontSize: 13, fontWeight: "600" },

  totalAmount: {
    fontSize: 26,
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
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },

  filterText: {
    fontSize: 12,
  },

  activeChip: { backgroundColor: "#5B8A72" },

  activeFilterText: {
    color: "#fff",
    fontWeight: "600",
  },

  // ── Expense Card ──
  card: {
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

  cardVendor: { fontWeight: "700", fontSize: 15, flex: 1 },

  cardAmount: {
    color: "#5B8A72",
    fontWeight: "700",
    fontSize: 16,
  },

  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  cardCategory: {
    color: "#5B8A72",
    fontSize: 12,
    fontWeight: "600",
  },

  cardDot: { marginHorizontal: 6, fontSize: 10 },

  cardDetail: { fontSize: 12 },

  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  cardDate: { fontSize: 11 },

  cardTag: {
    backgroundColor: "rgba(91,138,114,0.12)",
    color: "#5B8A72",
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },

  cardPayment: {
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

  fabText: {
    fontSize: 30,
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
  },

  categoryText: {
    fontSize: 13,
  },

  activeCategoryChip: {
    backgroundColor: "#5B8A72",
  },

  activeCategoryText: {
    color: "#fff",
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
    backgroundColor: "#5B8A72",
  },

  activeUnitText: {
    color: "#fff",
    fontWeight: "600",
  },

  totalCalcBox: {
    backgroundColor: "rgba(91,138,114,0.08)",
    borderWidth: 1,
    borderColor: "rgba(91,138,114,0.2)",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },

  totalCalcLabel: {
    color: "#5B8A72",
    fontWeight: "600",
    fontSize: 14,
  },

  totalCalcValue: {
    color: "#5B8A72",
    fontWeight: "700",
    fontSize: 20,
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

  // ── Search Bar ──
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 16,
    marginBottom: 15,
    height: 48,
  },

  searchIcon: {
    fontSize: 14,
    marginRight: 10,
  },

  searchInput: {
    flex: 1,
    fontSize: 14,
    height: 46,
  },

  searchClear: {
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
    backgroundColor: "#5B8A72",
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: "#5B8A72",
  },
  dayText: {
    fontSize: 14,
  },
  dayTextSelected: {
    color: "#fff",
    fontWeight: "700",
  },
  dayTextToday: {
    color: "#5B8A72",
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
    alignItems: "center",
  },
  todayBtnText: { color: "#5B8A72", fontWeight: "600", fontSize: 14 },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#5B8A72",
    alignItems: "center",
  },
  confirmBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
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
    backgroundColor: "rgba(91,138,114,0.1)",
  },
  optionText: {
    fontSize: 15,
  },
  optionTextActive: {
    color: "#5B8A72",
    fontWeight: "600",
  },
  check: {
    color: "#5B8A72",
    fontSize: 16,
    fontWeight: "700",
  },
});
