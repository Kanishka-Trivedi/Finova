// import React from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   Dimensions,
//   StatusBar,
// } from "react-native";
// import { LinearGradient } from "expo-linear-gradient";
// import { useRouter } from "expo-router";

// const { width } = Dimensions.get("window");

// export default function Index() {
//   const router = useRouter();

//   return (
//     <LinearGradient
//       colors={["#0F2027", "#203A43", "#2C5364"]}
//       style={styles.container}
//     >
//       <StatusBar barStyle="light-content" />

//       {/* Logo */}
//       <View style={styles.header}>
//         <Text style={styles.logo}>Finova.</Text>
//         <View style={styles.decorativeLine} />
//       </View>

//       {/* Floating Cards Section */}
//       <View style={styles.cardsContainer}>
//         {/* Background Card */}
//         <View style={styles.cardBackground}>
//           <View style={styles.cardHeader}>
//             <View style={styles.flagIcon}>
//               <Text style={styles.flagText}>🇺🇸</Text>
//             </View>
//             <Text style={styles.currencyLabel}>US Dollar</Text>
//           </View>

//           <Text style={styles.balanceLabel}>Your balance</Text>
//           <Text style={styles.balanceAmount}>$40,500.80</Text>
//           <Text style={styles.cardNumber}>**** 9934</Text>
//         </View>

//         {/* Foreground Card */}
//         <View style={styles.cardForeground}>
//           <View style={styles.cardHeader}>
//             <View style={styles.flagIconSmall}>
//               <Text style={styles.flagTextSmall}>🇺🇸</Text>
//             </View>
//             <Text style={styles.currencyLabelDark}>US Dollar</Text>
//           </View>

//           <Text style={styles.balanceLabelDark}>Your balance</Text>
//           <Text style={styles.balanceAmountDark}>$40,500.80</Text>

//           <View style={styles.cardFooter}>
//             <Text style={styles.cardNumberDark}>**** 9934</Text>

//             <View style={styles.expiryContainer}>
//               <Text style={styles.expiryLabel}>Expiry Date</Text>
//               <Text style={styles.expiryDate}>05/28</Text>
//             </View>
//           </View>

//           <View style={styles.eyeIcon}>
//             <View style={styles.eyeCircle}>
//               <Text style={styles.eyeText}>👁</Text>
//             </View>
//           </View>
//         </View>

//         {/* Request Badge */}
//         <View style={styles.requestBadge}>
//           <Text style={styles.requestIcon}>↙</Text>
//           <Text style={styles.requestText}>Request</Text>
//         </View>
//       </View>

//       {/* Hero Section */}
//       <View style={styles.hero}>
//         <Text style={styles.title}>
//           Your{"\n"}
//           Financial{"\n"}
//           Navigator
//         </Text>

//         <Text style={styles.subtitle}>
//           Invest in projects that make a difference. Join us in supporting
//           impactful initiatives and create a positive change in the world.
//         </Text>
//       </View>

//       {/* CTA */}
//       <TouchableOpacity
//         style={styles.button}
//         onPress={() => router.push("/(tabs)/practice")}
//         activeOpacity={0.8}
//       >
//         <Text style={styles.buttonText}>Get Started</Text>
//       </TouchableOpacity>

//       <Text style={styles.footerText}>
//         Take control of your financial future.
//       </Text>
//     </LinearGradient>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     paddingHorizontal: 24,
//     paddingTop: 60,
//     paddingBottom: 40,
//     justifyContent: "space-between",
//   },

//   header: {
//     marginBottom: 20,
//   },

//   logo: {
//     color: "white",
//     fontSize: 22,
//     fontWeight: "700",
//     letterSpacing: 1,
//   },

//   decorativeLine: {
//     position: "absolute",
//     right: 80,
//     top: 35,
//     width: 60,
//     height: 40,
//     borderWidth: 2,
//     borderColor: "rgba(255,255,255,0.4)",
//     borderRadius: 50,
//     transform: [{ rotate: "-20deg" }],
//     borderBottomWidth: 0,
//     borderRightWidth: 0,
//   },

//   cardsContainer: {
//     height: 280,
//     marginBottom: 30,
//     position: "relative",
//   },

//   cardBackground: {
//     position: "absolute",
//     top: 0,
//     right: 0,
//     width: width * 0.65,
//     backgroundColor: "rgba(255,255,255,0.08)",
//     borderRadius: 20,
//     padding: 20,
//   },

//   cardForeground: {
//     position: "absolute",
//     top: 60,
//     left: 0,
//     width: width * 0.75,
//     backgroundColor: "#4ADE80",
//     borderRadius: 20,
//     padding: 20,
//     shadowColor: "#000",
//     shadowOpacity: 0.4,
//     shadowRadius: 20,
//     elevation: 10,
//   },

//   cardHeader: {
//     flexDirection: "row",
//     alignItems: "center",
//     marginBottom: 12,
//   },

//   flagIcon: {
//     width: 28,
//     height: 28,
//     borderRadius: 14,
//     backgroundColor: "rgba(255,255,255,0.2)",
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 8,
//   },

//   flagIconSmall: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     backgroundColor: "rgba(255,255,255,0.4)",
//     justifyContent: "center",
//     alignItems: "center",
//     marginRight: 8,
//   },

//   flagText: {
//     fontSize: 14,
//   },

//   flagTextSmall: {
//     fontSize: 12,
//   },

//   currencyLabel: {
//     fontSize: 13,
//     color: "rgba(255,255,255,0.7)",
//   },

//   currencyLabelDark: {
//     fontSize: 12,
//     color: "#0F2027",
//     fontWeight: "600",
//   },

//   balanceLabel: {
//     fontSize: 12,
//     color: "rgba(255,255,255,0.6)",
//     marginBottom: 4,
//   },

//   balanceLabelDark: {
//     fontSize: 11,
//     color: "#0F2027",
//     marginBottom: 4,
//   },

//   balanceAmount: {
//     fontSize: 24,
//     fontWeight: "700",
//     color: "white",
//     marginBottom: 8,
//   },

//   balanceAmountDark: {
//     fontSize: 28,
//     fontWeight: "700",
//     color: "#0F2027",
//     marginBottom: 12,
//   },

//   cardNumber: {
//     fontSize: 13,
//     color: "rgba(255,255,255,0.6)",
//     letterSpacing: 1,
//   },

//   cardFooter: {
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "flex-end",
//   },

//   cardNumberDark: {
//     fontSize: 12,
//     color: "#0F2027",
//     letterSpacing: 1,
//   },

//   expiryContainer: {
//     alignItems: "flex-end",
//   },

//   expiryLabel: {
//     fontSize: 9,
//     color: "#0F2027",
//     marginBottom: 2,
//   },

//   expiryDate: {
//     fontSize: 12,
//     color: "#0F2027",
//     fontWeight: "600",
//   },

//   eyeIcon: {
//     position: "absolute",
//     right: 20,
//     top: "50%",
//     marginTop: -10,
//   },

//   eyeCircle: {
//     width: 24,
//     height: 24,
//     borderRadius: 12,
//     borderWidth: 1.5,
//     borderColor: "#0F2027",
//     justifyContent: "center",
//     alignItems: "center",
//   },

//   eyeText: {
//     fontSize: 10,
//     color: "#0F2027",
//   },

//   requestBadge: {
//     position: "absolute",
//     bottom: 20,
//     right: 20,
//     backgroundColor: "#FFFFFF",
//     borderRadius: 16,
//     paddingHorizontal: 12,
//     paddingVertical: 8,
//     flexDirection: "row",
//     alignItems: "center",
//     elevation: 5,
//   },

//   requestIcon: {
//     fontSize: 12,
//     color: "#0F2027",
//     marginRight: 4,
//     fontWeight: "bold",
//   },

//   requestText: {
//     fontSize: 12,
//     color: "#0F2027",
//     fontWeight: "600",
//   },

//   hero: {
//     marginBottom: 20,
//   },

//   title: {
//     fontSize: 34,
//     fontWeight: "800",
//     color: "white",
//     lineHeight: 42,
//     marginBottom: 12,
//   },

//   subtitle: {
//     fontSize: 14,
//     color: "rgba(255,255,255,0.8)",
//     lineHeight: 20,
//   },

//   button: {
//     backgroundColor: "#4ADE80",
//     paddingVertical: 18,
//     borderRadius: 20,
//     alignItems: "center",
//     shadowColor: "#000",
//     shadowOpacity: 0.3,
//     shadowRadius: 10,
//     elevation: 8,
//   },

//   buttonText: {
//     fontSize: 16,
//     fontWeight: "bold",
//     color: "#0F2027",
//   },

//   footerText: {
//     textAlign: "center",
//     color: "rgba(255,255,255,0.6)",
//     fontSize: 13,
//   },
// });







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

const { width } = Dimensions.get("window");

export default function Index() {
  const router = useRouter();

  return (
    <LinearGradient
      colors={["#0F2027", "#203A43", "#2C5364"]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />

      {/* Logo */}
      <View style={styles.header}>
        <Text style={styles.logo}>Finova.</Text>
        <View style={styles.decorativeLine} />
      </View>

      {/* Floating Cards Section */}
      <View style={styles.cardsContainer}>
        
        {/* 🇬🇧 UK Background Card */}
        <View style={styles.cardBackground}>
          <View style={styles.cardHeader}>
            <View style={styles.flagIcon}>
              <Text style={styles.flagText}>🇬🇧</Text>
            </View>
            <Text style={styles.currencyLabel}>British Pound</Text>
          </View>

          <Text style={styles.balanceLabel}>Your balance</Text>
          <Text style={styles.balanceAmount}>£28,920.40</Text>
          <Text style={styles.cardNumber}>**** 5521</Text>
        </View>

        {/* 🇮🇳 India Tilted Card */}
        <View style={styles.indiaCard}>
          <View style={styles.cardHeader}>
            <View style={styles.flagIconSmall}>
              <Text style={styles.flagTextSmall}>🇮🇳</Text>
            </View>
            <Text style={styles.currencyLabelDark}>Indian Rupee</Text>
          </View>

          <Text style={styles.balanceLabelDark}>Your balance</Text>
          <Text style={styles.balanceAmountDark}>₹1,85,600</Text>

          <Text style={styles.cardNumberDark}>**** 7712</Text>
        </View>

        {/* 🇺🇸 Main Foreground Card */}
        <View style={styles.cardForeground}>
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
            <View style={styles.eyeCircle}>
              <Text style={styles.eyeText}>👁</Text>
            </View>
          </View>
        </View>

        {/* Request Badge */}
        <View style={styles.requestBadge}>
          <Text style={styles.requestIcon}>↙</Text>
          <Text style={styles.requestText}>Request</Text>
        </View>
      </View>

      {/* Hero Section */}
      <View style={styles.hero}>
        <Text style={styles.title}>
          Your{"\n"}
          Financial{"\n"}
          Navigator
        </Text>

        <Text style={styles.subtitle}>
          Invest in projects that make a difference. Join us in supporting
          impactful initiatives and create a positive change in the world.
        </Text>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(tabs)/practice")}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>

      <Text style={styles.footerText}>
        Take control of your financial future.
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
    color: "white",
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
    borderColor: "rgba(255,255,255,0.4)",
    borderRadius: 50,
    transform: [{ rotate: "-20deg" }],
    borderBottomWidth: 0,
    borderRightWidth: 0,
  },

  cardsContainer: {
    height: 320,
    marginBottom: 30,
    position: "relative",
  },

  /* 🇬🇧 UK */
  cardBackground: {
    position: "absolute",
    top: 0,
    right: 0,
    width: width * 0.65,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 20,
    padding: 20,
  },

  /* 🇮🇳 INDIA Tilted */
  indiaCard: {
    position: "absolute",
    top: 40,
    right: 30,
    width: width * 0.6,
    backgroundColor: "#22C55E", // different green shade
    borderRadius: 20,
    padding: 20,
    transform: [{ rotate: "-8deg" }],
    shadowColor: "#000",
    shadowOpacity: 0.4,
    shadowRadius: 15,
    elevation: 8,
  },

  /* 🇺🇸 MAIN */
  cardForeground: {
    position: "absolute",
    top: 100,
    left: 0,
    width: width * 0.75,
    backgroundColor: "#4ADE80",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.4,
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
    backgroundColor: "rgba(255,255,255,0.2)",
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
    color: "rgba(255,255,255,0.7)",
  },

  currencyLabelDark: {
    fontSize: 12,
    color: "#0F2027",
    fontWeight: "600",
  },

  balanceLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.6)",
    marginBottom: 4,
  },

  balanceLabelDark: {
    fontSize: 11,
    color: "#0F2027",
    marginBottom: 4,
  },

  balanceAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    marginBottom: 8,
  },

  balanceAmountDark: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0F2027",
    marginBottom: 12,
  },

  cardNumber: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
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
    borderColor: "#0F2027",
    justifyContent: "center",
    alignItems: "center",
  },

  eyeText: {
    fontSize: 10,
    color: "#0F2027",
  },

  requestBadge: {
    position: "absolute",
    bottom: 20,
    right: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    elevation: 5,
  },

  requestIcon: {
    fontSize: 12,
    color: "#0F2027",
    marginRight: 4,
    fontWeight: "bold",
  },

  requestText: {
    fontSize: 12,
    color: "#0F2027",
    fontWeight: "600",
  },

  hero: {
    marginBottom: 20,
  },

  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "white",
    lineHeight: 42,
    marginBottom: 12,
  },

  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 20,
  },

  button: {
    backgroundColor: "#4ADE80",
    paddingVertical: 18,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },

  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0F2027",
  },

  footerText: {
    textAlign: "center",
    color: "rgba(255,255,255,0.6)",
    fontSize: 13,
  },
});