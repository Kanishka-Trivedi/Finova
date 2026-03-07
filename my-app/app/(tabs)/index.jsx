import React, { useContext, useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import axios from "axios";
import { AuthContext } from "../../context/AuthContext";
import { useSettings } from "../../context/SettingsContext";
import { BASE_URL } from "../../config";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = SCREEN_W * 0.72;

/* ─── Helpers ─── */
const formatINR = (num) => {
  if (num === undefined || num === null) return "₹0";
  const abs = Math.abs(num);
  let formatted;
  if (abs >= 10000000) formatted = `${(abs / 10000000).toFixed(2)} Cr`;
  else if (abs >= 100000) formatted = `${(abs / 100000).toFixed(2)} L`;
  else formatted = abs.toLocaleString("en-IN");
  return `₹${num < 0 ? "-" : ""}${formatted}`;
};

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
};

const getMonthName = (idx) =>
  ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][idx];

const getTodayString = () => {
  const d = new Date();
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
};

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

/* ─── Sparkline (Simple SVG-free) ─── */
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

/* ─── Bar Chart (Fixed Y-axis + Scrollable Bars) ─── */
const BAR_GROUP_W = (SCREEN_W - 40 - 54) / 6; // 6 months visible at a time
const CHART_H = 130; // height of the bar drawing area
const LABEL_H = 22; // space for month labels below baseline

const BarChart = ({ incomeData, expenseData, labels, themeColors }) => {
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

  const lineColor = `${themeColors.subtext}18`;

  return (
    <View style={chartStyles.outer}>
      {/* ── Fixed Y-axis ── */}
      <View style={[chartStyles.yCol, { height: CHART_H + LABEL_H }]}>
        <Text style={[chartStyles.yTxt, { color: themeColors.subtext, top: 0 }]}>{formatINR(maxVal)}</Text>
        <Text style={[chartStyles.yTxt, { color: themeColors.subtext, top: CHART_H / 2 - 6 }]}>{formatINR(maxVal / 2)}</Text>
        <Text style={[chartStyles.yTxt, { color: themeColors.subtext, top: CHART_H - 10 }]}>₹0</Text>
      </View>

      {/* ── Scrollable area ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flex: 1 }}>
        <View style={{ width: totalW, height: CHART_H + LABEL_H }}>
          {/* 3 horizontal lines aligned with Y labels */}
          <View style={[chartStyles.hLine, { top: 4, width: totalW, borderColor: lineColor }]} />
          <View style={[chartStyles.hLine, { top: CHART_H / 2, width: totalW, borderColor: lineColor }]} />
          <View style={[chartStyles.hLine, { top: CHART_H - 2, width: totalW, borderColor: lineColor }]} />

          {/* Bars row — sits inside the CHART_H zone */}
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

          {/* Month labels — below the ₹0 line */}
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
const DonutChart = ({ data, size = 160, themeColors }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return null;

  // We'll draw a simple segmented ring using rotated arcs
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
        {/* Segments as colored rings */}
        {segments.map((seg, i) => {
          const degrees = seg.pct * 360;
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

        {/* Center white circle */}
        <View
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            width: size - 48,
            height: size - 48,
            borderRadius: (size - 48) / 2,
            backgroundColor: themeColors.background[0],
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text style={{ color: themeColors.subtext, fontSize: 10, fontWeight: "600" }}>TOTAL</Text>
          <Text style={{ color: themeColors.text, fontSize: 16, fontWeight: "800" }}>
            {formatINR(total)}
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
  const { themeColors, settings, currencySymbol } = useSettings();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isDark = settings.theme !== "light";

  const [userData, setUserData] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  /* ── Data Fetching ── */
  const fetchAll = useCallback(async () => {
    try {
      const headers = { Authorization: `Bearer ${userToken}` };
      const [profileRes, expenseRes, incomeRes] = await Promise.all([
        axios.get(`${BASE_URL}/api/auth/profile`, { headers }),
        axios.get(`${BASE_URL}/expenses`, { headers }),
        axios.get(`${BASE_URL}/incomes`, { headers }),
      ]);
      setUserData(profileRes.data);
      setExpenses(expenseRes.data);
      setIncomes(incomeRes.data);
      setLastUpdated(new Date());
    } catch (e) {
      console.log("Dashboard fetch error:", e.message);
    } finally {
      setLoading(false);
    }
  }, [userToken]);

  useEffect(() => {
    if (userToken) fetchAll();
  }, [userToken]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAll();
    setRefreshing(false);
  }, [fetchAll]);

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
  const totalIncomeLastMonth = lastMonthIncomes.reduce((s, i) => s + (i.amount || 0), 0);
  const totalExpenseLastMonth = lastMonthExpenses.reduce((s, e) => s + (e.totalAmount || 0), 0);
  const netBalance = totalIncomeThisMonth - totalExpenseThisMonth;
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

  // Full year bar data — Jan to Dec of current year
  const yearlyData = useMemo(() => {
    const incData = [], expData = [], labels = [];
    for (let mo = 0; mo < 12; mo++) {
      incData.push(incomes.filter((x) => { const d = new Date(x.date); return d.getMonth() === mo && d.getFullYear() === thisYear; }).reduce((s, x) => s + (x.amount || 0), 0));
      expData.push(expenses.filter((x) => { const d = new Date(x.date); return d.getMonth() === mo && d.getFullYear() === thisYear; }).reduce((s, x) => s + (x.totalAmount || 0), 0));
      labels.push(getMonthName(mo));
    }
    return { incData, expData, labels };
  }, [incomes, expenses, thisYear]);

  // Expense category breakdown — use ALL expenses
  const categoryBreakdown = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      if (e.category) {
        map[e.category] = (map[e.category] || 0) + (e.totalAmount || 0);
      }
    });
    const colors = {
      Cement: "#4ADE80", Steel: "#38BDF8", Sand: "#FACC15", Bricks: "#F472B6",
      Aggregate: "#A78BFA", Plumbing: "#2DD4BF", Labor: "#FB923C", Equipment: "#818CF8",
      Transport: "#F87171", Granite: "#34D399", Marble: "#C084FC", Tiles: "#E879F9",
      Color: "#A3E635", Block: "#6366F1", Miscellaneous: "#94A3B8",
    };
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: colors[name] || "#94A3B8",
    })).sort((a, b) => b.value - a.value);
  }, [expenses]);

  // Recent transactions (merged + sorted)
  const recentTransactions = useMemo(() => {
    const all = [
      ...expenses.map((e) => ({ ...e, type: "expense", _amount: e.totalAmount, _name: e.vendorName, _date: e.date })),
      ...incomes.map((i) => ({ ...i, type: "income", _amount: i.amount, _name: i.dealerName, _date: i.date })),
    ];
    all.sort((a, b) => new Date(b._date) - new Date(a._date));
    return all.slice(0, 10);
  }, [expenses, incomes]);

  const formatDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return dt.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
  };

  const lastUpdatedText = useMemo(() => {
    if (!lastUpdated) return "";
    const diff = Math.floor((Date.now() - lastUpdated.getTime()) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff} min ago`;
    return `${Math.floor(diff / 60)}h ago`;
  }, [lastUpdated, refreshing]);

  /* ── Loading State ── */
  if (loading) {
    return (
      <LinearGradient colors={themeColors.background} style={{ flex: 1, paddingTop: insets.top + 20, paddingHorizontal: 20 }}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />
        <View style={{ gap: 16 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <Skeleton w={48} h={48} r={24} />
            <View style={{ gap: 6 }}>
              <Skeleton w={160} h={14} />
              <Skeleton w={100} h={10} />
            </View>
          </View>
          <Skeleton w={SCREEN_W - 40} h={20} />
          <View style={{ flexDirection: "row", gap: 14 }}>
            <Skeleton w={CARD_W} h={170} r={22} />
            <Skeleton w={CARD_W} h={170} r={22} />
          </View>
          <Skeleton w={SCREEN_W - 40} h={200} r={22} />
          <Skeleton w={SCREEN_W - 40} h={180} r={22} />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} w={SCREEN_W - 40} h={72} r={16} />
          ))}
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={themeColors.background} style={s.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} translucent backgroundColor="transparent" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scroll, { paddingTop: insets.top + 12 }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={themeColors.primary}
            colors={[themeColors.primary]}
          />
        }
      >
        {/* ═══════════ HEADER BAR ═══════════ */}
        <View style={s.headerBar}>
          <TouchableOpacity style={s.headerLeft} onPress={() => router.push("/(tabs)/profile")} activeOpacity={0.7}>
            {userData?.profilePhoto ? (
              <Image source={{ uri: userData.profilePhoto }} style={s.headerAvatar} />
            ) : (
              <View style={[s.headerAvatarPH, { backgroundColor: themeColors.primary }]}>
                <Text style={{ color: isDark ? "#0F2027" : "#fff", fontWeight: "800", fontSize: 18 }}>
                  {userData?.name?.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={[s.greeting, { color: themeColors.subtext }]}>{getGreeting()},</Text>
              <Text style={[s.userName, { color: themeColors.text }]}>{userData?.name?.split(" ")[0] || "Builder"}</Text>
            </View>
          </TouchableOpacity>

          <View style={s.headerRight}>
            <TouchableOpacity style={[s.headerIconBtn, { backgroundColor: `${themeColors.text}10` }]} onPress={() => router.push("/preferences")}>
              <Ionicons name="settings-outline" size={22} color={themeColors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Date */}
        <Text style={[s.todayDate, { color: themeColors.subtext }]}>{getTodayString()}</Text>

        {/* ═══════════ HERO SUMMARY CARDS (Stacked) ═══════════ */}
        <View style={s.heroStack}>
          {/* Income Card */}
          <View style={[s.heroCard, { backgroundColor: isDark ? "rgba(74,222,128,0.08)" : "rgba(74,222,128,0.06)", borderColor: "rgba(74,222,128,0.2)" }]}>
            <View style={s.heroCardTop}>
              <View style={[s.heroIconWrap, { backgroundColor: "rgba(74,222,128,0.15)" }]}>
                <Ionicons name="trending-up" size={22} color="#4ADE80" />
              </View>
              <Text style={[s.heroLabel, { color: themeColors.subtext, marginBottom: 0 }]}>This Month's Income</Text>
            </View>
            <View style={s.heroBottom}>
              <Text style={[s.heroAmount, { color: "#4ADE80" }]}>{formatINR(totalIncomeThisMonth)}</Text>
              <MiniSparkline data={incomeSpark} color="#4ADE80" width={110} height={30} />
            </View>
          </View>

          {/* Expense Card */}
          <View style={[s.heroCard, { backgroundColor: isDark ? "rgba(56,189,248,0.08)" : "rgba(56,189,248,0.06)", borderColor: "rgba(56,189,248,0.2)" }]}>
            <View style={s.heroCardTop}>
              <View style={[s.heroIconWrap, { backgroundColor: "rgba(56,189,248,0.15)" }]}>
                <Ionicons name="trending-down" size={22} color="#38BDF8" />
              </View>
              <Text style={[s.heroLabel, { color: themeColors.subtext, marginBottom: 0 }]}>This Month's Expenses</Text>
            </View>
            <View style={s.heroBottom}>
              <Text style={[s.heroAmount, { color: "#38BDF8" }]}>{formatINR(totalExpenseThisMonth)}</Text>
              <MiniSparkline data={expenseSpark} color="#38BDF8" width={110} height={30} />
            </View>
          </View>
        </View>

        {/* ═══════════ FINANCIAL OVERVIEW BAR CHART ═══════════ */}
        <View style={[s.section, { backgroundColor: isDark ? "#1A2B32" : themeColors.card, borderColor: themeColors.border }]}>
          <View style={s.sectionHeader}>
            <View>
              <Text style={[s.sectionTitle, { color: themeColors.text }]}>Financial Overview</Text>
              <Text style={[s.sectionSub, { color: themeColors.subtext }]}>Jan – Dec {thisYear} • Scroll to see more</Text>
            </View>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#4ADE80" }} />
                <Text style={{ color: themeColors.subtext, fontSize: 11 }}>Income</Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#38BDF8" }} />
                <Text style={{ color: themeColors.subtext, fontSize: 11 }}>Expense</Text>
              </View>
            </View>
          </View>

          <BarChart
            incomeData={yearlyData.incData}
            expenseData={yearlyData.expData}
            labels={yearlyData.labels}
            themeColors={themeColors}
          />
        </View>

        {/* ═══════════ EXPENSE BREAKDOWN ═══════════ */}
        <View style={[s.section, { backgroundColor: isDark ? "#1A2B32" : themeColors.card, borderColor: themeColors.border }]}>
          <View style={s.sectionHeader}>
            <View>
              <Text style={[s.sectionTitle, { color: themeColors.text }]}>Expense Breakdown</Text>
              <Text style={[s.sectionSub, { color: themeColors.subtext }]}>All time by category</Text>
            </View>
          </View>

          {categoryBreakdown.length > 0 ? (
            <>
              <DonutChart data={categoryBreakdown} themeColors={themeColors} />

              {/* Legend */}
              <View style={s.legendGrid}>
                {categoryBreakdown.map((item) => {
                  const totalExp = expenses.reduce((s, e) => s + (e.totalAmount || 0), 0);
                  const pct = totalExp > 0 ? ((item.value / totalExp) * 100).toFixed(1) : 0;
                  return (
                    <View key={item.name} style={s.legendItem}>
                      <View style={[s.legendDot, { backgroundColor: item.color }]} />
                      <Text style={[s.legendName, { color: themeColors.text }]}>{item.name}</Text>
                      <Text style={[s.legendValue, { color: themeColors.subtext }]}>
                        {formatINR(item.value)} ({pct}%)
                      </Text>
                    </View>
                  );
                })}
              </View>
            </>
          ) : (
            <View style={s.emptyState}>
              <Ionicons name="pie-chart-outline" size={40} color={themeColors.subtext} style={{ opacity: 0.3 }} />
              <Text style={[s.emptyText, { color: themeColors.subtext }]}>No expenses this month</Text>
              <TouchableOpacity
                style={[s.emptyBtn, { backgroundColor: `${themeColors.primary}15` }]}
                onPress={() => router.push("/(tabs)/expense")}
              >
                <Text style={{ color: themeColors.primary, fontWeight: "700", fontSize: 13 }}>Add your first expense</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ═══════════ RECENT TRANSACTIONS ═══════════ */}
        <View style={[s.section, { backgroundColor: isDark ? "#1A2B32" : themeColors.card, borderColor: themeColors.border }]}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: themeColors.text }]}>Recent Transactions</Text>
            <Text style={[s.sectionSub, { color: themeColors.subtext }]}>Latest 10</Text>
          </View>

          {recentTransactions.length > 0 ? (
            <>
              {recentTransactions.map((txn, idx) => (
                <TouchableOpacity
                  key={txn._id || idx}
                  style={[s.txnRow, idx < recentTransactions.length - 1 && { borderBottomWidth: 1, borderBottomColor: `${themeColors.border}60` }]}
                  activeOpacity={0.6}
                  onPress={() => {
                    if (txn.type === "expense") router.push("/(tabs)/expense");
                    else router.push("/(tabs)/income");
                  }}
                >
                  <View style={[s.txnIcon, { backgroundColor: txn.type === "income" ? "rgba(74,222,128,0.12)" : "rgba(56,189,248,0.12)" }]}>
                    <Ionicons
                      name={txn.type === "income" ? "arrow-down-outline" : "arrow-up-outline"}
                      size={18}
                      color={txn.type === "income" ? "#4ADE80" : "#38BDF8"}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.txnName, { color: themeColors.text }]}>{txn._name}</Text>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 }}>
                      <View style={[s.txnChip, { backgroundColor: txn.type === "income" ? "rgba(74,222,128,0.12)" : "rgba(56,189,248,0.12)" }]}>
                        <Text style={{ color: txn.type === "income" ? "#4ADE80" : "#38BDF8", fontSize: 10, fontWeight: "600" }}>
                          {txn.type === "income" ? "Income" : txn.category}
                        </Text>
                      </View>
                      <Text style={[s.txnDate, { color: themeColors.subtext }]}>{formatDate(txn._date)}</Text>
                    </View>
                  </View>
                  <Text style={[s.txnAmount, { color: txn.type === "income" ? "#4ADE80" : "#38BDF8" }]}>
                    {txn.type === "income" ? "+" : "-"}{formatINR(txn._amount)}
                  </Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[s.viewAllBtn, { borderColor: themeColors.border }]}
                onPress={() => router.push("/(tabs)/expense")}
              >
                <Text style={{ color: themeColors.primary, fontWeight: "700", fontSize: 14 }}>View All Transactions</Text>
                <Ionicons name="arrow-forward" size={16} color={themeColors.primary} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={s.emptyState}>
              <Ionicons name="receipt-outline" size={40} color={themeColors.subtext} style={{ opacity: 0.3 }} />
              <Text style={[s.emptyText, { color: themeColors.subtext }]}>No transactions yet</Text>
              <TouchableOpacity
                style={[s.emptyBtn, { backgroundColor: `${themeColors.primary}15` }]}
                onPress={() => router.push("/(tabs)/expense")}
              >
                <Text style={{ color: themeColors.primary, fontWeight: "700", fontSize: 13 }}>Add your first entry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ═══════════ QUICK ACTIONS ═══════════ */}
        <View style={s.quickActions}>
          <TouchableOpacity
            style={[s.quickBtn, { backgroundColor: "rgba(74,222,128,0.1)", borderColor: "rgba(74,222,128,0.2)" }]}
            onPress={() => router.push("/(tabs)/expense")}
            activeOpacity={0.7}
          >
            <View style={[s.quickIconWrap, { backgroundColor: "rgba(74,222,128,0.2)" }]}>
              <Ionicons name="add-circle-outline" size={22} color="#4ADE80" />
            </View>
            <Text style={[s.quickLabel, { color: themeColors.text }]}>Add{"\n"}Expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.quickBtn, { backgroundColor: "rgba(56,189,248,0.1)", borderColor: "rgba(56,189,248,0.2)" }]}
            onPress={() => router.push("/(tabs)/income")}
            activeOpacity={0.7}
          >
            <View style={[s.quickIconWrap, { backgroundColor: "rgba(56,189,248,0.2)" }]}>
              <Ionicons name="cash-outline" size={22} color="#38BDF8" />
            </View>
            <Text style={[s.quickLabel, { color: themeColors.text }]}>Add{"\n"}Income</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.quickBtn, { backgroundColor: "rgba(167,139,250,0.1)", borderColor: "rgba(167,139,250,0.2)" }]}
            onPress={() => router.push("/data-management")}
            activeOpacity={0.7}
          >
            <View style={[s.quickIconWrap, { backgroundColor: "rgba(167,139,250,0.2)" }]}>
              <Ionicons name="download-outline" size={22} color="#A78BFA" />
            </View>
            <Text style={[s.quickLabel, { color: themeColors.text }]}>Export{"\n"}Report</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.quickBtn, { backgroundColor: "rgba(250,204,21,0.1)", borderColor: "rgba(250,204,21,0.2)" }]}
            onPress={() => router.push("/(tabs)/profile")}
            activeOpacity={0.7}
          >
            <View style={[s.quickIconWrap, { backgroundColor: "rgba(250,204,21,0.2)" }]}>
              <Ionicons name="person-outline" size={22} color="#FACC15" />
            </View>
            <Text style={[s.quickLabel, { color: themeColors.text }]}>My{"\n"}Profile</Text>
          </TouchableOpacity>
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
    marginBottom: 4,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerAvatar: { width: 48, height: 48, borderRadius: 24 },
  headerAvatarPH: { width: 48, height: 48, borderRadius: 24, justifyContent: "center", alignItems: "center" },
  greeting: { fontSize: 15, fontWeight: "600" },
  userName: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  headerRight: { flexDirection: "row", gap: 8 },
  headerIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  todayDate: { fontSize: 14, marginBottom: 22, paddingLeft: 2, fontWeight: "500" },

  /* ── Hero Cards ── */
  heroStack: { gap: 14, marginBottom: 24 },
  heroCard: {
    width: "100%",
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
  },
  heroCardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  heroIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  heroPctBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  heroLabel: { fontSize: 13, fontWeight: "600", marginBottom: 6 },
  heroAmount: { fontSize: 28, fontWeight: "800", letterSpacing: -0.5 },
  heroBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 10,
  },
  heroSub: { fontSize: 12 },

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
    marginBottom: 18,
  },
  sectionTitle: { fontSize: 17, fontWeight: "700" },
  sectionSub: { fontSize: 11, marginTop: 2 },

  /* ── Legend ── */
  legendGrid: { marginTop: 18, gap: 10 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { fontSize: 13, fontWeight: "600", flex: 1 },
  legendValue: { fontSize: 12 },

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

  /* ── Quick Actions ── */
  quickActions: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  quickBtn: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 8,
  },
  quickIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  quickLabel: { fontSize: 11, fontWeight: "600", textAlign: "center", lineHeight: 15 },

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
  incBar: { backgroundColor: "#4ADE80" },
  expBar: { backgroundColor: "#38BDF8" },
  mLabel: { fontSize: 10, fontWeight: "600" },
});