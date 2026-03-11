import React, { useState, useEffect, useContext } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    SafeAreaView,
    ActivityIndicator,
    Alert,
    TextInput,
    Modal,
} from "react-native";
import { AuthContext } from "../context/AuthContext";
import { useSettings } from "../context/SettingsContext";
import { useData } from "../context/DataContext";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { BASE_URL } from "../config";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystemLegacy from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Buffer } from 'buffer';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform, StatusBar } from "react-native";
window.Buffer = window.Buffer || Buffer;

const SectionHeader = ({ title, icon, iconColor, themeColors }) => (
    <View style={[styles.sectionHeader, { borderColor: themeColors.border }]}>
        <View style={[styles.sectionIconWrap, { backgroundColor: `${iconColor}18` }]}>
            <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <Text style={[styles.sectionTitle, { color: themeColors.subtext }]}>{title}</Text>
    </View>
);

export default function DataManagement() {
    const { userToken } = useContext(AuthContext);
    const { t, themeColors, settings } = useSettings();
    const { setExpenses, setIncomes } = useData();
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);

    const [clearModalVisible, setClearModalVisible] = useState(false);
    const [rangeModalVisible, setRangeModalVisible] = useState(false);
    const [password, setPassword] = useState("");
    const [clearing, setClearing] = useState(false);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await axios.get(`${BASE_URL}/api/data/stats`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            setStats(res.data);
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleBackup = async () => {
        setSyncing(true);
        try {
            const res = await axios.post(`${BASE_URL}/api/data/backup`, {}, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            Alert.alert(t("success"), t("back_up_success"));
            fetchStats();
        } catch (error) {
            Alert.alert(t("error"), "Cloud sync failed. Please try again.");
        } finally {
            setSyncing(false);
        }
    };

    const handleExport = async (type, range = 'all') => {
        setExporting(true);
        try {
            const isExcel = type === 'excel';
            const endpoint = isExcel ? 'excel' : `pdf?range=${range}`;
            const fileUri = `${FileSystemLegacy.documentDirectory}expenses_${range}.${isExcel ? 'xlsx' : 'pdf'}`;

            const response = await axios.get(`${BASE_URL}/api/data/export/${endpoint}`, {
                headers: { Authorization: `Bearer ${userToken}` },
                responseType: 'arraybuffer'
            });

            const base64 = Buffer.from(response.data).toString('base64');

            await FileSystemLegacy.writeAsStringAsync(fileUri, base64, {
                encoding: 'base64',
            });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert("Success", `File ready at: ${fileUri}`);
            }
            setRangeModalVisible(false);
        } catch (error) {
            console.error("Export error:", error);
            Alert.alert(t("error"), "Failed to generate report.");
        } finally {
            setExporting(false);
        }
    };

    const handleLocalDownload = async () => {
        setDownloading(true);
        try {
            const res = await axios.get(`${BASE_URL}/api/data/backup/local`, {
                headers: { Authorization: `Bearer ${userToken}` },
            });

            const fileName = `finova_backup_${new Date().getTime()}.json`;
            const fileUri = `${FileSystemLegacy.documentDirectory}${fileName}`;
            const jsonString = JSON.stringify(res.data, null, 2);

            await FileSystemLegacy.writeAsStringAsync(fileUri, jsonString);

            if (Platform.OS === 'android') {
                const permissions = await FileSystemLegacy.StorageAccessFramework.requestDirectoryPermissionsAsync();
                if (permissions.granted) {
                    const destinationUri = await FileSystemLegacy.StorageAccessFramework.createFileAsync(
                        permissions.directoryUri,
                        fileName,
                        'application/json'
                    );
                    await FileSystemLegacy.writeAsStringAsync(destinationUri, jsonString, { encoding: FileSystemLegacy.EncodingType.UTF8 });
                    Alert.alert("Success", "Backup downloaded to your selected folder.");
                } else {
                    // Fallback to sharing if permission denied
                    await Sharing.shareAsync(fileUri);
                }
            } else {
                // On iOS, sharing is the way to 'Save to Files'
                await Sharing.shareAsync(fileUri);
            }
        } catch (error) {
            console.error("Download error:", error);
            Alert.alert(t("error"), "Local download failed.");
        } finally {
            setDownloading(false);
        }
    };

    const handleImport = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            });

            if (!result.canceled) {
                setImporting(true);
                const file = result.assets[0];

                const formData = new FormData();
                formData.append("file", {
                    uri: file.uri,
                    name: file.name,
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                });

                const res = await axios.post(`${BASE_URL}/api/data/import/excel`, formData, {
                    headers: {
                        Authorization: `Bearer ${userToken}`,
                        "Content-Type": "multipart/form-data",
                    },
                });

                Alert.alert(t("success"), `${res.data.count} records imported successfully.`);
                fetchStats();
            }
        } catch (error) {
            Alert.alert(t("error"), "Failed to import data. Please check file format.");
        } finally {
            setImporting(false);
        }
    };

    const handleClearData = async () => {
        if (!password) return;

        Alert.alert(
            t("confirm_clear_title"),
            t("confirm_clear_msg"),
            [
                { text: t("cancel"), style: "cancel" },
                {
                    text: t("clear_all_data"),
                    style: "destructive",
                    onPress: async () => {
                        setClearing(true);
                        try {
                            await axios.post(`${BASE_URL}/api/data/clear`, { password }, {
                                headers: { Authorization: `Bearer ${userToken}` },
                            });

                            // Clear local context state
                            setExpenses([]);
                            setIncomes([]);

                            // Clear local Storage cache
                            await Promise.all([
                                AsyncStorage.removeItem("cached_expenses"),
                                AsyncStorage.removeItem("cached_incomes")
                            ]);

                            Alert.alert(t("success"), t("clear_success"));
                            setClearModalVisible(false);
                            setPassword("");
                            fetchStats();
                        } catch (error) {
                            Alert.alert(t("error"), error.response?.data?.message || "Action failed.");
                        } finally {
                            setClearing(false);
                        }
                    }
                }
            ]
        );
    };

    const updateFrequency = async (freq) => {
        try {
            await axios.put(`${BASE_URL}/api/data/backup-settings`, { frequency: freq }, {
                headers: { Authorization: `Bearer ${userToken}` },
            });
            fetchStats();
        } catch (error) {
            console.error(error);
        }
    };

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: themeColors.background[0] }]}>
                <ActivityIndicator size="large" color={themeColors.primary} />
            </View>
        );
    }

    return (
        <LinearGradient colors={themeColors.background} style={styles.container}>
            <SafeAreaView style={{ flex: 1 }}>
                <View style={[styles.header, { borderBottomColor: themeColors.border }]}>
                    <TouchableOpacity
                        onPress={() => router.back()}
                        style={[styles.backBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}
                    >
                        <Ionicons name="chevron-back" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 16 }}>
                        <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t("data_management")}</Text>
                        <Text style={[styles.headerSub, { color: themeColors.subtext }]}>Backup and secure your data</Text>
                    </View>
                    <View style={{ width: 44 }}>
                        {loading && <ActivityIndicator size="small" color={themeColors.primary} />}
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    <SectionHeader title="STORAGE STATUS" icon="server-outline" iconColor="#A78BFA" themeColors={themeColors} />
                    <View style={[styles.card, { backgroundColor: settings.theme === "light" ? themeColors.card : "#1A2B32", borderColor: themeColors.border }]}>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <View style={styles.storageInfo}>
                                    <Text style={[styles.storageText, { color: themeColors.text }]}>
                                        {stats?.usedKB > 1024 ? (stats.usedKB / 1024).toFixed(2) + " MB" : stats?.usedKB.toFixed(2) + " KB"} Used
                                    </Text>
                                    <Text style={[styles.storagePercent, { color: themeColors.primary }]}>
                                        {stats?.percentage < 0.001 && stats?.percentage > 0 ? stats.percentage.toFixed(4) : stats?.percentage.toFixed(3)}%
                                    </Text>
                                </View>
                                <View style={[styles.pBarBg, { backgroundColor: themeColors.border }]}>
                                    <View style={[styles.pBarFill, { backgroundColor: themeColors.primary, width: `${stats?.percentage}%` }]} />
                                </View>
                                <Text style={[styles.storageSubText, { color: themeColors.subtext }]}>
                                    Limit: {(stats?.limitKB / 1024).toFixed(0)} MB
                                </Text>
                            </View>
                        </View>
                    </View>

                    <SectionHeader title="CLOUD SYNC" icon="cloud-done-outline" iconColor="#5B8A72" themeColors={themeColors} />
                    <View style={[styles.card, { backgroundColor: settings.theme === "light" ? themeColors.card : "#1A2B32", borderColor: themeColors.border }]}>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.rowLabel, { color: themeColors.text }]}>Last Backup</Text>
                                <Text style={[styles.rowSublabel, { color: themeColors.subtext }]}>
                                    {stats?.lastBackup ? new Date(stats.lastBackup).toLocaleString() : t("backup_none")}
                                </Text>
                            </View>
                        </View>
                        <View style={[styles.row, { borderBottomWidth: 0 }]}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.rowLabel, { color: themeColors.text }]}>Vault Snapshots</Text>
                                <Text style={[styles.rowSublabel, { color: themeColors.subtext }]}>
                                    {stats?.vaultSnapshots || 0} secure snapshots stored in cloud
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity
                            style={[styles.primaryActionBtn, { backgroundColor: syncing ? themeColors.border : themeColors.primary }]}
                            onPress={handleBackup}
                            disabled={syncing}
                        >
                            {syncing ? <ActivityIndicator color={themeColors.tabBar} /> : (
                                <>
                                    <Ionicons name="cloud-upload" size={20} color={themeColors.tabBar} style={{ marginRight: 8 }} />
                                    <Text style={[styles.actionBtnText, { color: themeColors.tabBar }]}>{t("backup_now")}</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.secondaryActionBtn, { borderColor: themeColors.primary + '80' }]}
                            onPress={handleLocalDownload}
                            disabled={downloading}
                        >
                            {downloading ? (
                                <ActivityIndicator color={themeColors.primary} />
                            ) : (
                                <>
                                    <Ionicons name="download-outline" size={20} color={themeColors.primary} style={{ marginRight: 8 }} />
                                    <Text style={[styles.actionBtnText, { color: themeColors.primary }]}>Download Local JSON</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <SectionHeader title="FREQUENCY" icon="time-outline" iconColor={themeColors.subtext} themeColors={themeColors} />
                        <View style={styles.freqRow}>
                            {["None", "Daily", "Weekly", "Monthly"].map(f => (
                                <TouchableOpacity
                                    key={f}
                                    onPress={() => updateFrequency(f)}
                                    style={[
                                        styles.freqChip,
                                        { backgroundColor: themeColors.border },
                                        stats?.backupFrequency === f && { backgroundColor: themeColors.primary + '30', borderColor: themeColors.primary, borderWidth: 1 }
                                    ]}
                                >
                                    <Text style={[
                                        styles.freqText,
                                        { color: themeColors.subtext },
                                        stats?.backupFrequency === f && { color: themeColors.primary, fontWeight: '700' }
                                    ]}>
                                        {f}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={{ height: 16 }} />
                    </View>

                    <SectionHeader title="REPORTS & IMPORT" icon="document-text-outline" iconColor="#FACC15" themeColors={themeColors} />
                    <View style={[styles.card, { backgroundColor: settings.theme === "light" ? themeColors.card : "#1A2B32", borderColor: themeColors.border }]}>
                        <View style={styles.gridActions}>
                            <TouchableOpacity
                                style={[styles.gridBtn, { backgroundColor: themeColors.border }]}
                                onPress={() => handleExport('excel')}
                                disabled={exporting}
                            >
                                <MaterialCommunityIcons name="file-excel" size={24} color="#4ADE80" />
                                <Text style={[styles.gridBtnText, { color: themeColors.text }]}>Excel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.gridBtn, { backgroundColor: themeColors.border }]}
                                onPress={() => setRangeModalVisible(true)}
                                disabled={exporting}
                            >
                                <MaterialCommunityIcons name="file-pdf-box" size={24} color="#F87171" />
                                <Text style={[styles.gridBtnText, { color: themeColors.text }]}>PDF Report</Text>
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[styles.importBtn, { borderColor: themeColors.border, marginTop: 16 }]}
                            onPress={handleImport}
                            disabled={importing}
                        >
                            {importing ? <ActivityIndicator color={themeColors.primary} /> : (
                                <>
                                    <Ionicons name="cloud-upload-outline" size={20} color={themeColors.subtext} style={{ marginRight: 8 }} />
                                    <Text style={[styles.importBtnText, { color: themeColors.text }]}>Import from Excel</Text>
                                </>
                            )}
                        </TouchableOpacity>
                        <View style={{ height: 16 }} />
                    </View>

                    <SectionHeader title="DANGER ZONE" icon="warning-outline" iconColor={themeColors.danger} themeColors={themeColors} />
                    <View style={[styles.card, { backgroundColor: settings.theme === "light" ? themeColors.card : "#1A2B32", borderColor: themeColors.danger + '40' }]}>
                        <View style={styles.row}>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.rowLabel, { color: themeColors.danger }]}>Clear All Records</Text>
                                <Text style={[styles.rowSublabel, { color: themeColors.subtext }]}>Permanently wipe all local income and expense data</Text>
                            </View>
                        </View>
                        <TouchableOpacity
                            style={[styles.dangerBtn, { backgroundColor: themeColors.danger + '10', borderColor: themeColors.danger }]}
                            onPress={() => setClearModalVisible(true)}
                        >
                            <Ionicons name="trash-outline" size={20} color={themeColors.danger} style={{ marginRight: 8 }} />
                            <Text style={[styles.dangerBtnText, { color: themeColors.danger }]}>Wipe Local Data</Text>
                        </TouchableOpacity>
                        <View style={{ height: 16 }} />
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>

                {/* Clear Data Confirmation Modal */}
                <Modal visible={clearModalVisible} transparent animationType="slide">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, {
                            backgroundColor: themeColors.card,
                            borderColor: themeColors.border
                        }]}>
                            <Text style={[styles.modalTitle, { color: themeColors.text }]}>{t("clear_all_data")}</Text>
                            <Text style={[styles.modalSub, { color: themeColors.subtext }]}>{t("password_confirm")}</Text>

                            <TextInput
                                secureTextEntry
                                value={password}
                                onChangeText={setPassword}
                                style={[styles.passInput, { color: themeColors.text, borderColor: themeColors.border }]}
                                placeholder="••••••••"
                                placeholderTextColor={themeColors.subtext}
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity onPress={() => { setClearModalVisible(false); setPassword(""); }} style={[styles.mBtn, { backgroundColor: themeColors.border }]}>
                                    <Text style={[styles.mBtnText, { color: themeColors.text }]}>{t("cancel")}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    onPress={handleClearData}
                                    style={[styles.mBtn, { backgroundColor: themeColors.danger }]}
                                    disabled={clearing || !password}
                                >
                                    {clearing ? <ActivityIndicator color="white" /> : (
                                        <Text style={[styles.mBtnText, { color: "white" }]}>{t("delete")}</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>

                {/* Date Range Selection Modal */}
                <Modal visible={rangeModalVisible} transparent animationType="fade">
                    <View style={styles.modalOverlay}>
                        <View style={[styles.modalContent, {
                            backgroundColor: themeColors.card,
                            borderColor: themeColors.border
                        }]}>
                            <Text style={[styles.modalTitle, { color: themeColors.text }]}>Export PDF Range</Text>
                            <Text style={[styles.modalSub, { color: themeColors.subtext }]}>Select the time period for your report</Text>

                            <View style={styles.rangeGrid}>
                                {[
                                    { id: 'today', label: 'Today' },
                                    { id: '1m', label: '1 Month' },
                                    { id: '3m', label: '3 Months' },
                                    { id: '6m', label: '6 Months' },
                                    { id: '1y', label: '1 Year' },
                                    { id: 'all', label: 'All Time' }
                                ].map((r) => (
                                    <TouchableOpacity
                                        key={r.id}
                                        style={[styles.rangeBtn, { backgroundColor: themeColors.border }]}
                                        onPress={() => handleExport('pdf', r.id)}
                                    >
                                        <Text style={[styles.rangeBtnText, { color: themeColors.text }]}>{r.label}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <TouchableOpacity
                                onPress={() => setRangeModalVisible(false)}
                                style={[styles.cancelBtn, { backgroundColor: themeColors.border }]}
                            >
                                <Text style={[styles.cancelBtnText, { color: themeColors.text }]}>{t("cancel")}</Text>
                            </TouchableOpacity>
                        </View>
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
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 40) + 10 : 10,
        paddingBottom: 20,
        borderBottomWidth: 1,
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center",
        borderWidth: 1,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: "800",
    },
    headerSub: {
        fontSize: 12,
        marginTop: 2,
        fontWeight: "500",
    },
    scrollContent: {
        padding: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 30,
        marginBottom: 12,
        paddingBottom: 8,
        borderBottomWidth: 1,
    },
    sectionIconWrap: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: "800",
        letterSpacing: 1,
        textTransform: "uppercase",
    },
    card: {
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 12,
        marginBottom: 24,
        borderWidth: 1,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    row: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderColor: "rgba(0,0,0,0.05)",
    },
    rowLabel: {
        fontSize: 15,
        fontWeight: "700",
        marginBottom: 4,
    },
    rowSublabel: {
        fontSize: 12,
        opacity: 0.7,
        lineHeight: 18,
    },
    storageInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 12
    },
    storageText: {
        fontSize: 16,
        fontWeight: "700",
    },
    storagePercent: {
        fontSize: 15,
        fontWeight: "800"
    },
    storageSubText: {
        fontSize: 11,
        marginTop: 8,
        fontWeight: "600",
    },
    pBarBg: {
        height: 8,
        borderRadius: 4,
        overflow: "hidden",
    },
    pBarFill: {
        height: "100%",
        borderRadius: 4
    },
    primaryActionBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 54,
        borderRadius: 14,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        marginTop: 16,
        marginBottom: 12,
    },
    secondaryActionBtn: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 54,
        borderRadius: 14,
        borderWidth: 1.5,
        marginBottom: 10,
    },
    actionBtnText: {
        fontSize: 15,
        fontWeight: "700"
    },
    freqRow: {
        flexDirection: "row",
        gap: 8,
        marginTop: 4,
        flexWrap: "wrap",
    },
    freqChip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "transparent",
    },
    freqText: {
        fontSize: 12,
        fontWeight: "700"
    },
    gridActions: {
        flexDirection: "row",
        gap: 12,
        marginTop: 10,
    },
    gridBtn: {
        flex: 1,
        height: 80,
        borderRadius: 18,
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
    },
    gridBtnText: {
        fontSize: 13,
        fontWeight: "700"
    },
    importBtn: {
        height: 54,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        borderWidth: 1.5,
        borderStyle: "dashed",
    },
    importBtnText: {
        fontSize: 14,
        fontWeight: "700"
    },
    dangerBtn: {
        height: 54,
        borderRadius: 14,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1.5,
        marginTop: 16,
    },
    dangerBtnText: {
        fontWeight: "800",
        fontSize: 15,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.7)",
        justifyContent: "center",
        padding: 24
    },
    modalContent: {
        padding: 28,
        borderRadius: 32,
        borderWidth: 1,
        elevation: 8,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: "800",
        marginBottom: 12
    },
    modalSub: {
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
        opacity: 0.8
    },
    passInput: {
        height: 54,
        borderWidth: 1.5,
        borderRadius: 14,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 24,
        fontWeight: "600"
    },
    modalActions: {
        flexDirection: "row",
        gap: 12
    },
    mBtn: {
        flex: 1,
        height: 50,
        borderRadius: 14,
        justifyContent: "center",
        alignItems: "center"
    },
    mBtnText: {
        fontSize: 15,
        fontWeight: "700"
    },
    rangeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginBottom: 20
    },
    rangeBtn: {
        width: '48%',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    rangeBtnText: {
        fontWeight: '700',
        fontSize: 13
    },
    cancelBtn: {
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        borderWidth: 1,
    },
    cancelBtnText: {
        fontWeight: '800',
        fontSize: 14
    },
});
