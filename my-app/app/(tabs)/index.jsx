import React, { useContext, useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  RefreshControl,
  Dimensions,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { useData } from "../../context/DataContext";
import { BASE_URL } from "../../config";

const { width: SCREEN_W } = Dimensions.get("window");


const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const getMonthName = (idx) =>
  ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][idx];



const pctChange = (current, previous) => {
  if (!previous || previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
};

/* ─── Skeleton Placeholder ─── */
const Skeleton = ({ w, h, r = 12, style }) => {
  const { themeColors } = useSettings();
  return (
    <View
      style={[
        {
          width: w,
          height: h,
          borderRadius: r,
          backgroundColor: `${themeColors.text}12`,
        },
        style,
      ]}
    />
  );
};

/* ─── Sparkline (mini bar chart) ─── */
const MiniSparkline = ({ data, color, width: w = 100, height: h = 32 }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = w / (data.length - 1);

  return (
    <View style={{ width: w, height: h, flexDirection: "row", alignItems: "flex-end" }}>
      {data.map((val, i) => {
        const barH = Math.max(2, ((val - min) / range) * h * 0.9);
        return (
          <View
            key={i}
            style={{
              width: step - 2,
              height: barH,
              backgroundColor: color,
              marginRight: i < data.length - 1 ? 2 : 0,
              borderRadius: 2,
              opacity: i === data.length - 1 ? 1 : 0.5,
            }}
          />
        );
      })}
    </View>
  );
};

/* ─── Area-style Chart ─── */
const AreaChart = ({ data, color, labels, themeColors, height: chartH = 140 }) => {
  if (!data || data.length === 0) return null;
  const maxVal = Math.max(...data, 1);

  return (
    <View style={{ height: chartH + 30 }}>
      {/* Grid lines */}
      <View style={{ position: "absolute", top: 0, left: 0, right: 0, height: chartH }}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ position: "absolute", top: (chartH / 3) * i, left: 0, right: 0, height: 1, backgroundColor: `${themeColors.text}08` }} />
        ))}
      </View>

      {/* Bars with gradient appearance */}
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: chartH, paddingHorizontal: 4 }}>
        {data.map((val, i) => {
          const barH = Math.max(4, (val / maxVal) * (chartH - 10));
          const barW = (SCREEN_W - 80) / data.length - 8;
          return (
            <View key={i} style={{ flex: 1, alignItems: "center" }}>
              <View
                style={{
                  width: barW,
                  height: barH,
                  backgroundColor: `${color}25`,
                  borderTopLeftRadius: 4,
                  borderTopRightRadius: 4,
                  overflow: "hidden",
                }}
              >
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: barH * 0.7,
                    backgroundColor: color,
                    borderTopLeftRadius: 3,
                    borderTopRightRadius: 3,
                  }}
                />
              </View>
            </View>
          );
        })}
      </View>

      {/* Labels */}
      <View style={{ flexDirection: "row", marginTop: 8, paddingHorizontal: 4 }}>
        {labels.map((label, i) => (
          <View key={i} style={{ flex: 1, alignItems: "center" }}>
            <Text style={{ fontSize: 10, color: themeColors.subtext, fontWeight: "500" }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
};

/* ─── Bar Chart (Fixed Y-axis + Scrollable Bars) ─── */
const BAR_GROUP_W = (SCREEN_W - 40 - 54) / 6;
const CHART_H = 130;
const LABEL_H = 22;

const BarChart = ({ incomeData, expenseData, labels, themeColors, formatAmount }) => {
  const maxVal = Math.max(...incomeData, ...expenseData, 1);
  const totalW = BAR_GROUP_W * labels.length;

  if (labels.length === 0) {
    return (
      <View style={{ alignItems: "center", paddingVertical: 30 }}>
        <Ionicons name="bar-chart-outline" size={36} color={themeColors.subtext} style={{ opacity: 0.3 }} />
        <Text style={{ color: themeColors.subtext, marginTop: 10, fontSize: 13 }}>No data to display</Text>
      </View>
    );
  }

  const lineColor = `${themeColors.text}08`;

  return (
    <View style={chartStyles.outer}>
      {/* Fixed Y-axis */}
      <View style={[chartStyles.yCol, { height: CHART_H + LABEL_H }]}>
        <Text style={[chartStyles.yTxt, { color: themeColors.subtext, top: 0 }]}>{formatAmount(maxVal)}</Text>
        <Text style={[chartStyles.yTxt, { color: themeColors.subtext, top: CHART_H / 2 - 6 }]}>{formatAmount(maxVal / 2)}</Text>
        <Text style={[chartStyles.yTxt, { color: themeColors.subtext, top: CHART_H - 10 }]}>{formatAmount(0)}</Text>
      </View>

      {/* Scrollable area */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ width: totalW, height: CHART_H + LABEL_H }}>
          <View style={[chartStyles.hLine, { top: 4, width: totalW, borderColor: lineColor }]} />
          <View style={[chartStyles.hLine, { top: CHART_H / 2, width: totalW, borderColor: lineColor }]} />
          <View style={[chartStyles.hLine, { top: CHART_H - 2, width: totalW, borderColor: lineColor }]} />

          <View style={{ position: "absolute", left: 0, right: 0, bottom: LABEL_H, height: CHART_H, flexDirection: "row", alignItems: "flex-end" }}>
            {labels.map((label, i) => {
              const incVal = incomeData[i] || 0;
              const expVal = expenseData[i] || 0;
              const incBarH = (incVal / maxVal) * (CHART_H - 6);
              const expBarH = (expVal / maxVal) * (CHART_H - 6);

              return (
                <View key={i} style={{ width: BAR_GROUP_W, alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 3 }}>
                    <View style={[chartStyles.bar, chartStyles.incBar, { height: Math.max(incBarH, incVal > 0 ? 4 : 0) }]} />
                    <View style={[chartStyles.bar, chartStyles.expBar, { height: Math.max(expBarH, expVal > 0 ? 4 : 0) }]} />
                  </View>
                </View>
              );
            })}
          </View>

          <View style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: LABEL_H, flexDirection: "row" }}>
            {labels.map((label, i) => (
              <View key={i} style={{ width: BAR_GROUP_W, alignItems: "center", justifyContent: "center" }}>
                <Text style={[chartStyles.mLabel, { color: themeColors.subtext }]}>{label}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

/* ─── Donut Chart Component ─── */
const DonutChart = ({ data, size = 160, themeColors, formatAmount }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  let accumulated = 0;
  const segments = data.map((d) => {
    const pct = d.value / total;
    const start = accumulated;
    accumulated += pct;
    return { ...d, pct, start };
  });

  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ width: size, height: size, position: "relative" }}>
        {segments.map((seg, i) => {
          const rotStart = seg.start * 360 - 90;
          return (
            <View
              key={i}
              style={{
                position: "absolute",
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: 18,
                borderColor: "transparent",
                borderTopColor: seg.color,
                borderRightColor: seg.pct > 0.25 ? seg.color : "transparent",
                borderBottomColor: seg.pct > 0.5 ? seg.color : "transparent",
                borderLeftColor: seg.pct > 0.75 ? seg.color : "transparent",
                transform: [{ rotate: `${rotStart}deg` }],
              }}
            />
          );
        })}

        <View
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            width: size - 48,
            height: size - 48,
            borderRadius: (size - 48) / 2,
            backgroundColor: themeColors.card,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: themeColors.subtext, fontSize: 10, fontWeight: "600" }}>TOTAL</Text>
          <Text style={{ color: themeColors.text, fontSize: 16, fontWeight: "800" }}>
            {formatAmount(total)}
          </Text>
        </View>
      </View>
    </View>
  );
};

/* ═══════════════════════════════════════════════
   MAIN DASHBOARD
═══════════════════════════════════════════════ */
export default function Dashboard() {
  const { userToken } = useContext(AuthContext);
  const { themeColors, settings, currencySymbol, formatAmount, formatDate } = useSettings();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = settings.theme !== "light";

  const TEAL = "#5B8A72";
  const ACCENT = "#D4A853";

  const { expenses, incomes, isRefreshing, lastUpdated: globalLastUpdated, refreshSilently, refresh: refreshData } = useData();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false); // Start false to show UI immediately
  const [activeTab, setActiveTab] = useState("Weekly");
  const [activeIncomeTab, setActiveIncomeTab] = useState("Weekly");

  const fetchProfile = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) {
        const cached = await AsyncStorage.getItem("cached_profile");
        if (cached) {
          setUserData(JSON.parse(cached));
          setLoading(false);
        }
      }
      const res = await axios.get(`${BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${userToken}` }
      });
      setUserData(res.data);
      AsyncStorage.setItem("cached_profile", JSON.stringify(res.data));
    } catch (e) {
      console.log("Profile error:", e);
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  useFocusEffect(
    useCallback(() => {
      if (userToken) {
        refreshSilently();
        fetchProfile();
      }
    }, [userToken, refreshSilently, fetchProfile])
  );

  useEffect(() => {
    if (userToken) {
      fetchProfile(true);
    }
  }, [userToken]);

  const onRefresh = useCallback(async () => {
    await Promise.all([fetchProfile(), refreshSilently()]);
  }, [fetchProfile, refreshSilently]);

  const lastUpdated = globalLastUpdated;

  /* ── Computed Data ── */
  const now = new Date();
  const thisMonth = now.getMonth();
  const thisYear = now.getFullYear();

  const thisMonthExpenses = useMemo(
    () => expenses.filter((e) => { const d = new Date(e.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; }),
    [expenses, thisMonth, thisYear]
  );
  const thisMonthIncomes = useMemo(
    () => incomes.filter((i) => { const d = new Date(i.date); return d.getMonth() === thisMonth && d.getFullYear() === thisYear; }),
    [incomes, thisMonth, thisYear]
  );
  const lastMonthExpenses = useMemo(
    () => {
      const lm = thisMonth === 0 ? 11 : thisMonth - 1;
      const ly = thisMonth === 0 ? thisYear - 1 : thisYear;
      return expenses.filter((e) => { const d = new Date(e.date); return d.getMonth() === lm && d.getFullYear() === ly; });
    },
    [expenses, thisMonth, thisYear]
  );
  const lastMonthIncomes = useMemo(
    () => {
      const lm = thisMonth === 0 ? 11 : thisMonth - 1;
      const ly = thisMonth === 0 ? thisYear - 1 : thisYear;
      return incomes.filter((i) => { const d = new Date(i.date); return d.getMonth() === lm && d.getFullYear() === ly; });
    },
    [incomes, thisMonth, thisYear]
  );

  const totalIncomeThisMonth = thisMonthIncomes.reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpenseThisMonth = thisMonthExpenses.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const totalIncomeAllTime = incomes.reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpenseAllTime = expenses.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const totalIncomeLastMonth = lastMonthIncomes.reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpenseLastMonth = lastMonthExpenses.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const netBalance = totalIncomeAllTime - totalExpenseAllTime;
  const incomePctChg = pctChange(totalIncomeThisMonth, totalIncomeLastMonth);
  const expensePctChg = pctChange(totalExpenseThisMonth, totalExpenseLastMonth);

  // Last 7 days sparkline
  const getLast7Days = useCallback((items, amtKey) => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayStr = d.toISOString().split("T")[0];
      const total = items.filter((it) => it.date?.startsWith(dayStr)).reduce((s, it) => s + (it[amtKey] || 0), 0);
      result.push(total);
    }
    return result;
  }, []);

  const incomeSpark = useMemo(() => getLast7Days(incomes, "amount"), [incomes]);
  const expenseSpark = useMemo(() => getLast7Days(expenses, "totalAmount"), [expenses]);

  // Full year bar data
  const yearlyData = useMemo(() => {
    const incData = [], expData = [], labels = [];
    for (let mo = 0; mo < 12; mo++) {
      incData.push(incomes.filter((x) => { const d = new Date(x.date); return d.getMonth() === mo && d.getFullYear() === thisYear; }).reduce((s, x) => s + (x.amount || 0), 0));
      expData.push(expenses.filter((x) => { const d = new Date(x.date); return d.getMonth() === mo && d.getFullYear() === thisYear; }).reduce((s, x) => s + (x.totalAmount || 0), 0));
      labels.push(getMonthName(mo));
    }
    return { incData, expData, labels };
  }, [incomes, expenses, thisYear]);

  // Expense category breakdown
  const categoryBreakdown = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      if (e.category) {
        map[e.category] = (map[e.category] || 0) + (e.totalAmount || 0);
      }
    });
    const colors = {
      Cement: "#34D399", Steel: "#38BDF8", Sand: "#FBBF24", Bricks: "#F87171",
      Aggregate: "#A78BFA", Plumbing: "#2DD4BF", Granite: "#FB923C", Marble: "#818CF8",
      Tiles: "#F472B6", Color: "#4ADE80", Block: "#E879F9", Labor: "#22D3EE",
      Equipment: "#FACC15", Transport: "#6366F1", Miscellaneous: "#14B8A6",
    };
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || "#8A8A7E",
    })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Recent transactions
  const recentTransactions = useMemo(() => {
    const all = [
      ...expenses.map((e) => ({ ...e, type: "expense", _amount: e.totalAmount, _name: e.vendorName, _date: e.date })),
      ...incomes.map((i) => ({ ...i, type: "income", _amount: i.amount, _name: i.dealerName, _date: i.date })),
    ];
    all.sort((a, b) => new Date(b._date) - new Date(a._date));
    return all.slice(0, 10);
  }, [expenses, incomes]);



  const lastUpdatedText = useMemo(() => {
    if (!lastUpdated) return "";
    const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} min ago`;
    return `${Math.floor(diff / 60)}h ago`;
  }, [lastUpdated, isRefreshing]);

  // Chart data based on active tab (expenses)
  const chartData = useMemo(() => {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    if (activeTab === "Weekly") {
      const data = [];
      const labels = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split("T")[0];
        const total = expenses.filter((it) => it.date?.startsWith(dayStr)).reduce((s, it) => s + (it.totalAmount || 0), 0);
        data.push(total);
        labels.push(dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1]);
      }
      return { data, labels };
    } else if (activeTab === "Monthly") {
      const data = [];
      const labels = [];
      for (let mo = 0; mo < 12; mo++) {
        data.push(expenses.filter((x) => { const d = new Date(x.date); return d.getMonth() === mo && d.getFullYear() === thisYear; }).reduce((s, x) => s + (x.totalAmount || 0), 0));
        labels.push(getMonthName(mo));
      }
      return { data, labels };
    } else {
      const data = [];
      const labels = [];
      for (let y = thisYear - 4; y <= thisYear; y++) {
        data.push(expenses.filter((x) => new Date(x.date).getFullYear() === y).reduce((s, x) => s + (x.totalAmount || 0), 0));
        labels.push(y.toString());
      }
      return { data, labels };
    }
  }, [activeTab, expenses, thisYear]);

  // Chart data based on active tab (income)
  const incomeChartData = useMemo(() => {
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    if (activeIncomeTab === "Weekly") {
      const data = [];
      const labels = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayStr = d.toISOString().split("T")[0];
        const total = incomes.filter((it) => it.date?.startsWith(dayStr)).reduce((s, it) => s + (it.amount || 0), 0);
        data.push(total);
        labels.push(dayNames[d.getDay() === 0 ? 6 : d.getDay() - 1]);
      }
      return { data, labels };
    } else if (activeIncomeTab === "Monthly") {
      const data = [];
      const labels = [];
      for (let mo = 0; mo < 12; mo++) {
        data.push(incomes.filter((x) => { const d = new Date(x.date); return d.getMonth() === mo && d.getFullYear() === thisYear; }).reduce((s, x) => s + (x.amount || 0), 0));
        labels.push(getMonthName(mo));
      }
      return { data, labels };
    } else {
      const data = [];
      const labels = [];
      for (let y = thisYear - 4; y <= thisYear; y++) {
        data.push(incomes.filter((x) => new Date(x.date).getFullYear() === y).reduce((s, x) => s + (x.amount || 0), 0));
        labels.push(y.toString());
      }
      return { data, labels };
    }
  }, [activeIncomeTab, incomes, thisYear]);

  // Aggressive: Remove the blocking loader block entirely

  return (
    <LinearGradient colors={themeColors.background} style={s.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 12 }]}
      >
        {/* ═══════════ HEADER ═══════════ */}
        <View style={s.headerBar}>
          <TouchableOpacity style={s.headerLeft} onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.7}>
            {userData?.profilePhoto ? (
              <Image source={{ uri: userData.profilePhoto }} style={s.headerAvatar} />
            ) : (
              <View style={[s.headerAvatarPH, { backgroundColor: TEAL }]}>
                <Text style={{ color: "#fff", fontWeight: "800", fontSize: 18 }}>
                  {userData?.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={[s.userName, { color: themeColors.text }]}>{userData?.name || "Builder"}</Text>
              <Text style={[s.greeting, { color: themeColors.subtext }]}>{getGreeting()}</Text>
            </View>
          </TouchableOpacity>

          <View style={s.activeBadge}>
            <View style={s.activeDot} />
            <Text style={s.activeText}>Active</Text>
          </View>
        </View>

        {/* ═══════════ TWO TEAL CARDS ═══════════ */}
        <View style={{ gap: 14, marginBottom: 20 }}>
          {/* Expenses Card */}
          <View style={[s.tealCardFull, { backgroundColor: TEAL }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" }}>
                  <Ionicons name="arrow-up-outline" size={20} color="#fff" />
                </View>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "700" }}>Expenses</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.6)" />
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "600" }}>{formatDate(new Date())}</Text>
              </View>
            </View>
            <Text style={s.tealAmountBig}>{formatAmount(totalExpenseAllTime)}</Text>
            <View style={{ marginTop: 14 }}>
              <MiniSparkline data={expenseSpark} color="rgba(255,255,255,0.45)" width={SCREEN_W - 80} height={32} />
            </View>
          </View>

          {/* Income Card */}
          <View style={[s.tealCardFull, { backgroundColor: TEAL }]}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.15)", justifyContent: "center", alignItems: "center" }}>
                  <Ionicons name="arrow-down-outline" size={20} color="#fff" />
                </View>
                <Text style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, fontWeight: "700" }}>Income</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.6)" />
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "600" }}>{formatDate(new Date())}</Text>
              </View>
            </View>
            <Text style={s.tealAmountBig}>{formatAmount(totalIncomeAllTime)}</Text>
            <View style={{ marginTop: 14 }}>
              <MiniSparkline data={incomeSpark} color="rgba(255,255,255,0.45)" width={SCREEN_W - 80} height={32} />
            </View>
          </View>
        </View>

        {/* ═══════════ EXPENSE CHART SECTION ═══════════ */}
        <View style={[s.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: themeColors.text }]}>Expense Trends</Text>
          </View>

          {/* Tab Chips */}
          <View style={s.chipRow}>
            {["Weekly", "Monthly", "Yearly"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[s.chip, activeTab === tab && { backgroundColor: TEAL }]}
                onPress={() => setActiveTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[s.chipText, activeTab === tab && { color: "#fff" }]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Big Amount */}
          <Text style={[s.chartBigAmount, { color: themeColors.text }]}>{formatAmount(totalExpenseAllTime)}</Text>
          <Text style={{ color: themeColors.subtext, fontSize: 12, marginBottom: 16 }}>Total Expenses</Text>

          <AreaChart
            data={chartData.data}
            labels={chartData.labels}
            color={TEAL}
            themeColors={themeColors}
          />
        </View>

        {/* ═══════════ INCOME TRENDS ═══════════ */}
        <View style={[s.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: themeColors.text }]}>Income Trends</Text>
          </View>

          {/* Tab Chips */}
          <View style={s.chipRow}>
            {["Weekly", "Monthly", "Yearly"].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[s.chip, activeIncomeTab === tab && { backgroundColor: ACCENT }]}
                onPress={() => setActiveIncomeTab(tab)}
                activeOpacity={0.7}
              >
                <Text style={[s.chipText, activeIncomeTab === tab && { color: "#fff" }]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Big Amount */}
          <Text style={[s.chartBigAmount, { color: themeColors.text }]}>{formatAmount(totalIncomeAllTime)}</Text>
          <Text style={{ color: themeColors.subtext, fontSize: 12, marginBottom: 16 }}>Total Income</Text>

          <AreaChart
            data={incomeChartData.data}
            labels={incomeChartData.labels}
            color={ACCENT}
            themeColors={themeColors}
          />
        </View>

        {/* ═══════════ HIGHLIGHTS ═══════════ */}
        <View style={s.statsRow}>
          {/* Expense highlight */}
          <View style={[s.colorStatCard, { backgroundColor: settings.theme === 'light' ? '#FFF5F5' : `${TEAL}15`, borderColor: settings.theme === 'light' ? '#FED7D7' : `${TEAL}30` }]}>
            <View style={[s.colorStatIcon, { backgroundColor: "#E53E3E" }]}>
              <Ionicons name="trending-up" size={16} color="#fff" />
            </View>
            <Text style={{ color: themeColors.text, fontSize: 20, fontWeight: "800", marginTop: 8 }}>{formatAmount(totalExpenseAllTime)}</Text>
            <Text style={{ color: themeColors.subtext, fontSize: 11, fontWeight: "600", marginTop: 2 }}>Total Expenses</Text>
            <View style={{ marginTop: 8 }}>
              <MiniSparkline data={expenseSpark} color="#E53E3E" width={90} height={22} />
            </View>
          </View>

          {/* Income highlight */}
          <View style={[s.colorStatCard, { backgroundColor: settings.theme === 'light' ? '#F0FFF4' : `${ACCENT}15`, borderColor: settings.theme === 'light' ? '#C6F6D5' : `${ACCENT}30` }]}>
            <View style={[s.colorStatIcon, { backgroundColor: TEAL }]}>
              <Ionicons name="trending-down" size={16} color="#fff" />
            </View>
            <Text style={{ color: themeColors.text, fontSize: 20, fontWeight: "800", marginTop: 8 }}>{formatAmount(totalIncomeAllTime)}</Text>
            <Text style={{ color: themeColors.subtext, fontSize: 11, fontWeight: "600", marginTop: 2 }}>Total Income</Text>
            <View style={{ marginTop: 8 }}>
              <MiniSparkline data={incomeSpark} color={TEAL} width={90} height={22} />
            </View>
          </View>
        </View>

        <View style={s.statsRow}>
          {/* Transactions count */}
          <View style={[s.colorStatCard, { backgroundColor: settings.theme === 'light' ? '#FFF9DB' : `${ACCENT}10`, borderColor: settings.theme === 'light' ? '#FFF3BF' : `${ACCENT}25` }]}>
            <View style={[s.colorStatIcon, { backgroundColor: "#FB923C" }]}>
              <Ionicons name="swap-horizontal" size={16} color="#fff" />
            </View>
            <Text style={{ color: themeColors.text, fontSize: 20, fontWeight: "800", marginTop: 8 }}>{expenses.length + incomes.length}</Text>
            <Text style={{ color: themeColors.subtext, fontSize: 11, fontWeight: "600", marginTop: 2 }}>Transactions</Text>
          </View>

          {/* Net Savings */}
          <View style={[s.colorStatCard, { backgroundColor: settings.theme === 'light' ? '#EBF8FF' : `${ACCENT}12`, borderColor: settings.theme === 'light' ? '#BEE3F8' : `${ACCENT}30` }]}>
            <View style={[s.colorStatIcon, { backgroundColor: ACCENT }]}>
              <Ionicons name="wallet" size={16} color="#fff" />
            </View>
            <Text style={{ color: themeColors.text, fontSize: 20, fontWeight: "800", marginTop: 8 }}>{formatAmount(netBalance)}</Text>
            <Text style={{ color: "#7A7A6E", fontSize: 11, fontWeight: "600", marginTop: 2 }}>Net Savings</Text>
          </View>
        </View>

        {/* ═══════════ WHAT TO DO TODAY ═══════════ */}
        <View style={[s.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <Text style={[s.sectionTitle, { color: themeColors.text, marginBottom: 16 }]}>What should we do today?</Text>

          <TouchableOpacity
            style={[s.actionRow, { borderColor: themeColors.border }]}
            onPress={() => router.push("/(tabs)/expense")}
            activeOpacity={0.7}
          >
            <View style={[s.actionIcon, { backgroundColor: "#FFEAEA" }]}>
              <Ionicons name="wallet-outline" size={20} color="#E53E3E" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.actionTitle, { color: themeColors.text }]}>Track Expenses</Text>
              <Text style={[s.actionSub, { color: themeColors.subtext }]}>Log today's spending</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.subtext} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionRow, { borderColor: themeColors.border }]}
            onPress={() => router.push("/(tabs)/income")}
            activeOpacity={0.7}
          >
            <View style={[s.actionIcon, { backgroundColor: `${TEAL}15` }]}>
              <Ionicons name="trending-up" size={20} color={TEAL} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.actionTitle, { color: themeColors.text }]}>Record Income</Text>
              <Text style={[s.actionSub, { color: themeColors.subtext }]}>Add new payments received</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.subtext} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.actionRow, { borderBottomWidth: 0 }]}
            onPress={() => router.push("/data-management")}
            activeOpacity={0.7}
          >
            <View style={[s.actionIcon, { backgroundColor: `${ACCENT}15` }]}>
              <Ionicons name="document-text-outline" size={20} color={ACCENT} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.actionTitle, { color: themeColors.text }]}>Export Report</Text>
              <Text style={[s.actionSub, { color: themeColors.subtext }]}>Download PDF summary</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={themeColors.subtext} />
          </TouchableOpacity>
        </View>

        {/* ═══════════ RECENT TRANSACTIONS ═══════════ */}
        <View style={[s.section, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: themeColors.text }]}>Recent Transactions</Text>
            <Text style={[s.sectionSub, { color: themeColors.subtext }]}>Latest 10</Text>
          </View>

          {recentTransactions.length > 0 ? (
            <>
              {recentTransactions.map((txn, idx) => (
                <TouchableOpacity
                  key={txn._id || idx}
                  style={[s.txnRow, idx < recentTransactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: `${themeColors.border}` }]}
                  activeOpacity={0.6}
                  onPress={() => {
                    if (txn.type === "expense") router.push("/(tabs)/expense");
                    else router.push("/(tabs)/income");
                  }}
                >
                  <View style={[s.txnIcon, { backgroundColor: txn.type === "income" ? `${ACCENT}12` : `${TEAL}12` }]}>
                    <Ionicons
                      name={txn.type === "income" ? "arrow-down-outline" : "arrow-up-outline"}
                      size={18}
                      color={txn.type === "income" ? ACCENT : TEAL}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.txnName, { color: themeColors.text }]}>{txn._name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <View style={[s.txnChip, { backgroundColor: txn.type === "income" ? `${ACCENT}12` : `${TEAL}12` }]}>
                        <Text style={{ color: txn.type === "income" ? ACCENT : TEAL, fontSize: 10, fontWeight: "600" }}>
                          {txn.type === "income" ? "Income" : txn.category}
                        </Text>
                      </View>
                      <Text style={[s.txnDate, { color: themeColors.subtext }]}>{formatDate(txn._date)}</Text>
                    </View>
                  </View>
                  <Text style={[s.txnAmount, { color: txn.type === "income" ? ACCENT : TEAL }]}>
                    {txn.type === "income" ? "+" : "-"}{formatAmount(txn._amount)}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[s.viewAllBtn, { borderColor: themeColors.border }]}
                onPress={() => router.push("/(tabs)/expense")}
              >
                <Text style={{ color: TEAL, fontWeight: "700", fontSize: 14 }}>View All Transactions</Text>
                <Ionicons name="arrow-forward" size={16} color={TEAL} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={s.emptyState}>
              <Ionicons name="receipt-outline" size={40} color={themeColors.subtext} style={{ opacity: 0.3 }} />
              <Text style={[s.emptyText, { color: themeColors.subtext }]}>No transactions yet</Text>
              <TouchableOpacity
                style={[s.emptyBtn, { backgroundColor: `${TEAL}15` }]}
                onPress={() => router.push("/(tabs)/expense")}
              >
                <Text style={{ color: TEAL, fontWeight: "700", fontSize: 13 }}>Add your first entry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ═══════════ FOOTER ═══════════ */}
        <View style={s.footer}>
          {lastUpdated && (
            <Text style={[s.footerText, { color: themeColors.subtext }]}>
              Last updated: {lastUpdatedText}
            </Text>
          )}
          <Text style={[s.footerText, { color: themeColors.subtext, marginTop: 4 }]}>Finova v1.0.0</Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </LinearGradient>
  );
}

/* ═══════════ STYLES ═══════════ */
const s = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, paddingBottom: 20 },

  /* ── Header ── */
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerAvatar: { width: 48, height: 48, borderRadius: 24 },
  headerAvatarPH: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  greeting: { fontSize: 13, fontWeight: "500" },
  userName: { fontSize: 20, fontWeight: "800", letterSpacing: -0.3 },
  balanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  balanceDot: { width: 8, height: 8, borderRadius: 4 },

  /* ── Banner ── */
  bannerCard: {
    borderRadius: 22,
    padding: 22,
    marginBottom: 20,
  },
  bannerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  bannerDate: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" },
  bannerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bannerBadgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  bannerSubtitle: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: "600", marginBottom: 4 },
  bannerAmount: { color: "#fff", fontSize: 32, fontWeight: "800", letterSpacing: -0.5, marginBottom: 16 },
  bannerProgressBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 3,
    marginBottom: 8,
    overflow: "hidden",
  },
  bannerProgressFill: {
    height: 6,
    backgroundColor: "#fff",
    borderRadius: 3,
  },
  bannerProgressLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11, fontWeight: "500" },

  /* ── Stat Cards ── */
  statsRow: { flexDirection: "row", gap: 14, marginBottom: 14 },
  statCard: {
    flex: 1,
    padding: 18,
    borderRadius: 18,
    borderWidth: 1,
  },
  statTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  statLabel: { fontSize: 13, fontWeight: "600", marginBottom: 8 },
  pctBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },

  /* ── Teal Cards ── */
  tealCardFull: {
    width: "100%",
    padding: 22,
    borderRadius: 22,
  },
  tealAmountBig: {
    color: "#fff",
    fontSize: 30,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  tealCard: {
    flex: 1,
    padding: 18,
    borderRadius: 20,
  },
  tealAmount: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "800",
    letterSpacing: -0.3,
  },
  tealPctBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  activeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(212, 168, 83, 0.12)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D4A853",
  },
  activeText: {
    color: "#D4A853",
    fontSize: 13,
    fontWeight: "700",
  },

  /* ── Sections ── */
  section: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
    marginBottom: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  sectionSub: { fontSize: 11, marginTop: 2 },

  /* ── Chart ── */
  chipRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  chipText: { fontSize: 12, fontWeight: "600", color: "#7A7A6E" },
  chartBigAmount: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },

  /* ── Highlights ── */
  highlightRow: { flexDirection: "row", gap: 12, marginBottom: 18 },
  highlightCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  colorStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
  },
  colorStatIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },

  /* ── Action Rows ── */
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  actionTitle: { fontSize: 15, fontWeight: "600" },
  actionSub: { fontSize: 12, marginTop: 2 },

  /* ── Transactions ── */
  txnRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  txnIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  txnName: { fontSize: 14, fontWeight: "600" },
  txnChip: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 },
  txnDate: { fontSize: 11 },
  txnAmount: { fontSize: 15, fontWeight: "700" },
  viewAllBtn: {
    marginTop: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },

  /* ── Legend ── */
  legendGrid: { marginTop: 18, gap: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { fontSize: 13, fontWeight: "600", flex: 1 },
  legendValue: { fontSize: 12 },

  /* ── Empty State ── */
  emptyState: { alignItems: "center", paddingVertical: 30, gap: 10 },
  emptyText: { fontSize: 14 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, marginTop: 4 },

  /* ── Footer ── */
  footer: { alignItems: "center", marginTop: 10 },
  footerText: { fontSize: 11, opacity: 0.5 },
});

/* ── Bar Chart Styles ── */
const chartStyles = StyleSheet.create({
  outer: { flexDirection: "row" },
  yCol: {
    width: 54,
    paddingRight: 6,
    position: "relative",
  },
  yTxt: {
    position: "absolute",
    right: 6,
    fontSize: 9,
    fontWeight: "500",
    opacity: 0.6,
  },
  hLine: {
    position: "absolute",
    left: 0,
    height: 0,
    borderTopWidth: 1,
    borderStyle: "dashed",
  },
  bar: {
    width: 14,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
  },
  incBar: { backgroundColor: "#D4A853" },
  expBar: { backgroundColor: "#5B8A72" },
  mLabel: { fontSize: 10, fontWeight: "600" },
});