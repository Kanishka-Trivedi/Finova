import React, { useState, useContext, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import { BASE_URL } from "../config";
import { Ionicons } from "@expo/vector-icons";
import LottieView from "lottie-react-native";
import FinanceAnimation from "../assets/Finance.json";
import * as NavigationBar from "expo-navigation-bar";

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("#FFFFFF");
      NavigationBar.setButtonStyleAsync("dark");
    }
  }, []);

  const handleRegister = async () => {
    if (!name || !email || !password) {
      Alert.alert("Missing Fields", "Please fill in all details");
      return;
    }
    try {
      const res = await axios.post(`${BASE_URL}/api/auth/register`, {
        name,
        email,
        password,
      });
      login(res.data.token);
      router.replace("/(tabs)");
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Registration failed");
    }
  };

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "padding"}
        style={{ flex: 1, backgroundColor: "#FFFFFF" }}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.mainContainer}>
            <SafeAreaView style={{ backgroundColor: "#F8FAFC" }}>
              <View style={styles.topSpace}>
                <LottieView
                  source={FinanceAnimation}
                  autoPlay
                  loop
                  style={styles.lottieAnimation}
                />
              </View>
            </SafeAreaView>

            <View style={styles.formCard}>
              <View style={styles.brandContainer}>
                <Text style={styles.brandText}>
                  <Text style={styles.brandFin}>Fin</Text>
                  <Text style={styles.brandOva}>ova</Text>
                </Text>
                <View style={styles.brandLine} />
              </View>

              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join us and manage your finances elegantly</Text>

              <View style={styles.inputsWrapper}>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Full name"
                    placeholderTextColor="#94A3B8"
                    value={name}
                    onChangeText={setName}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Email address"
                    placeholderTextColor="#94A3B8"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#64748B" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="Password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.termsRow}>
                <Text style={styles.termsText}>
                  By signing up, you agree to our{" "}
                  <Text style={styles.linkText}>Terms</Text> & <Text style={styles.linkText}>Privacy</Text>
                </Text>
              </View>

              <TouchableOpacity style={styles.button} onPress={handleRegister}>
                <Text style={styles.buttonText}>Sign Up</Text>
              </TouchableOpacity>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/login")}>
                  <Text style={[styles.linkText, { fontWeight: "700" }]}>Sign In</Text>
                </TouchableOpacity>
              </View>
              <View style={{ height: 100, backgroundColor: '#FFFFFF' }} />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  topSpace: {
    height: SCREEN_HEIGHT * 0.32,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
    paddingBottom: 20,
    backgroundColor: "#F8FAFC",
  },
  lottieAnimation: {
    width: SCREEN_HEIGHT * 0.22,
    height: SCREEN_HEIGHT * 0.22,
  },
  formCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingHorizontal: 30,
    paddingTop: 30,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 20,
  },
  brandContainer: {
    alignItems: "center",
    marginBottom: 15,
  },
  brandText: {
    fontSize: 32,
    letterSpacing: -1.5,
  },
  brandFin: {
    fontWeight: "300",
    color: "#1E293B",
  },
  brandOva: {
    fontWeight: "900",
    color: "#22C55E",
  },
  brandLine: {
    width: 35,
    height: 3,
    backgroundColor: "#22C55E",
    borderRadius: 2,
    marginTop: -4,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1E293B",
    textAlign: "center",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "500",
  },
  inputsWrapper: {
    gap: 10,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#0F172A",
    fontWeight: "600",
  },
  termsRow: {
    marginTop: 12,
    marginBottom: 15,
  },
  termsText: {
    fontSize: 11,
    color: "#94A3B8",
    textAlign: "center",
  },
  linkText: {
    color: "#22C55E",
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#22C55E",
    height: 54,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 20,
    alignItems: "center",
  },
  footerText: {
    color: "#64748B",
    fontSize: 13,
    fontWeight: "500",
  },
});
