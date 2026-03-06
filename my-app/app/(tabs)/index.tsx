import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useSettings } from "../../context/SettingsContext";

const { width } = Dimensions.get("window");

export default function Index() {
  const router = useRouter();
  const { t, themeColors, settings } = useSettings();

  return (
    <LinearGradient
      colors={themeColors.background}
      style={styles.container}
    >
      <StatusBar barStyle={settings.theme === "light" ? "dark-content" : "light-content"} />

      {/* Logo */}
      <View style={styles.header}>
        <Text style={[styles.logo, { color: themeColors.text }]}>Finova.</Text>
        <View style={[styles.decorativeLine, { borderColor: `${themeColors.text}40` }]} />
      </View>

      {/* Floating Cards Section */}
      <View style={styles.cardsContainer}>

        {/* UK Background Card */}
        <View style={[styles.cardBackground, { backgroundColor: themeColors.card, borderColor: themeColors.border, borderWidth: 1 }]}>
          <View style={styles.cardHeader}>
            <View style={styles.flagIcon}>
              <Text style={styles.flagText}>🇬🇧</Text>
            </View>
            <Text style={[styles.currencyLabel, { color: themeColors.subtext }]}>British Pound</Text>
          </View>

          <Text style={[styles.balanceLabel, { color: themeColors.subtext }]}>Your balance</Text>
          <Text style={[styles.balanceAmount, { color: themeColors.text }]}>£28,920.40</Text>
          <Text style={[styles.cardNumber, { color: themeColors.subtext }]}>**** 5521</Text>
        </View>

        {/* Foreground Card */}
        <View style={[styles.cardForeground, { backgroundColor: themeColors.primary }]}>
          <View style={styles.cardHeader}>
            <View style={styles.flagIconSmall}>
              <Text style={styles.flagTextSmall}>🇺🇸</Text>
            </View>
            <Text style={styles.currencyLabelDark}>US Dollar</Text>
          </View>

          <Text style={styles.balanceLabelDark}>Your balance</Text>
          <Text style={styles.balanceAmountDark}>$40,500.80</Text>

          <View style={styles.cardFooter}>
            <Text style={styles.cardNumberDark}>**** 9934</Text>

            <View style={styles.expiryContainer}>
              <Text style={styles.expiryLabel}>Expiry Date</Text>
              <Text style={styles.expiryDate}>05/28</Text>
            </View>
          </View>

          <View style={styles.eyeIcon}>
            <View style={[styles.eyeCircle, { borderColor: themeColors.tabBar }]}>
              <Text style={[styles.eyeText, { color: themeColors.tabBar }]}>👁</Text>
            </View>
          </View>
        </View>

        {/* Request Badge */}
        <View style={[styles.requestBadge, { backgroundColor: themeColors.text }]}>
          <Text style={[styles.requestIcon, { color: themeColors.tabBar }]}>↙</Text>
          <Text style={[styles.requestText, { color: themeColors.tabBar }]}>Request</Text>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={[styles.title, { color: themeColors.text }]}>
          {t('hero_title')}
        </Text>

        <Text style={[styles.subtitle, { color: themeColors.subtext }]}>
          {t('hero_subtitle')}
        </Text>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: themeColors.primary }]}
        onPress={() => router.push("/(tabs)/expense")}
        activeOpacity={0.8}
      >
        <Text style={[styles.buttonText, { color: themeColors.tabBar }]}>{t('get_started')}</Text>
      </TouchableOpacity>

      <Text style={[styles.footerText, { color: themeColors.subtext }]}>
        {t('financial_future')}
      </Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
    justifyContent: "space-between",
  },
  header: {
    marginBottom: 20,
  },
  logo: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 1,
  },
  decorativeLine: {
    position: "absolute",
    right: 80,
    top: 35,
    width: 60,
    height: 40,
    borderWidth: 2,
    borderRadius: 50,
    transform: [{ rotate: "-20deg" }],
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },
  cardsContainer: {
    height: 280,
    marginBottom: 30,
    position: "relative",
  },
  cardBackground: {
    position: "absolute",
    top: 0,
    right: 0,
    width: width * 0.65,
    borderRadius: 20,
    padding: 20,
  },
  cardForeground: {
    position: "absolute",
    top: 60,
    left: 0,
    width: width * 0.75,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  flagIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  flagIconSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.4)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  flagText: {
    fontSize: 14,
  },
  flagTextSmall: {
    fontSize: 12,
  },
  currencyLabel: {
    fontSize: 13,
  },
  currencyLabelDark: {
    fontSize: 12,
    color: "#0F2027",
    fontWeight: "600",
  },
  balanceLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  balanceLabelDark: {
    fontSize: 11,
    color: "#0F2027",
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 8,
  },
  balanceAmountDark: {
    fontSize: 26,
    fontWeight: "700",
    color: "#0F2027",
    marginBottom: 12,
  },
  cardNumber: {
    fontSize: 13,
    letterSpacing: 1,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardNumberDark: {
    fontSize: 12,
    color: "#0F2027",
    letterSpacing: 1,
  },
  expiryContainer: {
    alignItems: "flex-end",
  },
  expiryLabel: {
    fontSize: 9,
    color: "#0F2027",
    marginBottom: 2,
  },
  expiryDate: {
    fontSize: 12,
    color: "#0F2027",
    fontWeight: "600",
  },
  eyeIcon: {
    position: "absolute",
    right: 20,
    top: "50%",
    marginTop: -10,
  },
  eyeCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
  },
  eyeText: {
    fontSize: 10,
  },
  requestBadge: {
    position: "absolute",
    bottom: 20,
    right: 20,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    elevation: 5,
  },
  requestIcon: {
    fontSize: 12,
    marginRight: 4,
    fontWeight: "bold",
  },
  requestText: {
    fontSize: 12,
    fontWeight: "600",
  },
  hero: {
    marginBottom: 20,
  },
  title: {
    fontSize: 34,
    fontWeight: "800",
    lineHeight: 42,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  button: {
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    elevation: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
  },
  footerText: {
    textAlign: "center",
    fontSize: 13,
    opacity: 0.6,
  },
});