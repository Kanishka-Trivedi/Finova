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
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { BASE_URL } from "../config";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystemLegacy from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Buffer } from 'buffer';
import { Platform, StatusBar } from "react-native";
window.Buffer = window.Buffer || Buffer;

export default function DataManagement() {
    const { userToken } = useContext(AuthContext);
    const { t, themeColors, settings } = useSettings();
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

            const fileUri = `${FileSystemLegacy.documentDirectory}finova_backup_${new Date().getTime()}.json`;
            const jsonString = JSON.stringify(res.data, null, 2);

            await FileSystemLegacy.writeAsStringAsync(fileUri, jsonString);

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(fileUri);
            } else {
                Alert.alert("Success", "Backup saved to device.");
            }
        } catch (error) {
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
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                        <Ionicons name="chevron-back" size={24} color={themeColors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.headerTitle, { color: themeColors.text }]}>{t("data_management")}</Text>
                    <View style={{ width: 44 }} />
                </View>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

                    {/* Storage Usage Card */}
                    <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                        <View style={styles.cardHeader}>
                            <MaterialCommunityIcons name="database" size={24} color={themeColors.primary} />
                            <Text style={[styles.cardTitle, { color: themeColors.text }]}>{t("storage_usage")}</Text>
                        </View>
                        <View style={styles.storageInfo}>
                            <Text style={[styles.storageText, { color: themeColors.subtext }]}>
                                {stats?.usedKB > 1024 ? (stats.usedKB / 1024).toFixed(2) + " MB" : stats?.usedKB.toFixed(2) + " KB"} / {(stats?.limitKB / 1024).toFixed(0)} MB
                            </Text>
                            <Text style={[styles.storagePercent, { color: themeColors.primary }]}>
                                {stats?.percentage < 0.001 && stats?.percentage > 0 ? stats.percentage.toFixed(4) : stats?.percentage.toFixed(3)}%
                            </Text>
                        </View>
                        <View style={[styles.pBarBg, { backgroundColor: themeColors.border }]}>
                            <View style={[styles.pBarFill, { backgroundColor: themeColors.primary, width: `${stats?.percentage}%` }]} />
                        </View>
                    </View>

                    {/* Backup Section */}
                    <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="cloud-done-outline" size={24} color="#5B8A72" />
                            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Cloud Sync</Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={[styles.infoLabel, { color: themeColors.subtext }]}>{t("last_backup")}</Text>
                            <Text style={[styles.infoValue, { color: themeColors.text }]}>
                                {stats?.lastBackup ? new Date(stats.lastBackup).toLocaleString() : t("backup_none")}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: syncing ? themeColors.border : themeColors.primary }]}
                            onPress={handleBackup}
                            disabled={syncing}
                        >
                            {syncing ? <ActivityIndicator color={themeColors.tabBar} /> : (
                                <>
                                    <Ionicons name="sync" size={20} color={themeColors.tabBar} />
                                    <Text style={[styles.actionBtnText, { color: themeColors.tabBar }]}>{t("backup_now")}</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.actionBtn, { backgroundColor: themeColors.border, marginTop: 12, borderColor: themeColors.primary, borderWidth: 1 }]}
                            onPress={handleLocalDownload}
                            disabled={downloading}
                        >
                            {downloading ? <ActivityIndicator color={themeColors.primary} /> : (
                                <>
                                    <Ionicons name="download-outline" size={20} color={themeColors.primary} />
                                    <Text style={[styles.actionBtnText, { color: themeColors.primary }]}>Download JSON Backup</Text>
                                </>
                            )}
                        </TouchableOpacity>

                        <Text style={[styles.smallHeading, { color: themeColors.subtext, marginTop: 20 }]}>{t("auto_backup")}</Text>
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
                                        stats?.backupFrequency === f && { color: "#5B8A72", fontWeight: '700' }
                                    ]}>
                                        {t(f.toLowerCase())}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Export / Import Section */}
                    <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.border }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="document-text-outline" size={24} color="#D4A853" />
                            <Text style={[styles.cardTitle, { color: themeColors.text }]}>Files & Reports</Text>
                        </View>

                        <View style={styles.gridActions}>
                            <TouchableOpacity
                                style={[styles.gridBtn, { backgroundColor: themeColors.border }]}
                                onPress={() => handleExport('excel')}
                                disabled={exporting}
                            >
                                <MaterialCommunityIcons name="file-excel" size={24} color="#22C55E" />
                                <Text style={[styles.gridBtnText, { color: themeColors.text }]}>Excel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.gridBtn, { backgroundColor: themeColors.border }]}
                                onPress={() => setRangeModalVisible(true)}
                                disabled={exporting}
                            >
                                <MaterialCommunityIcons name="file-pdf-box" size={24} color="#EF4444" />
                                <Text style={[styles.gridBtnText, { color: themeColors.text }]}>PDF Report</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={{ height: 1.5, backgroundColor: themeColors.border, marginVertical: 20 }} />

                        <TouchableOpacity
                            style={[styles.importBtn, { borderColor: themeColors.primary }]}
                            onPress={handleImport}
                            disabled={importing}
                        >
                            {importing ? <ActivityIndicator color={themeColors.primary} /> : (
                                <>
                                    <Ionicons name="cloud-upload-outline" size={20} color={themeColors.primary} />
                                    <View>
                                        <Text style={[styles.importBtnText, { color: themeColors.primary }]}>{t("import_data")}</Text>
                                        <Text style={{ fontSize: 10, color: themeColors.subtext, textAlign: 'center' }}>Headers: Date, Vendor, Category, Quantity...</Text>
                                    </View>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Danger Zone */}
                    <View style={[styles.card, { backgroundColor: themeColors.card, borderColor: themeColors.danger + '30' }]}>
                        <View style={styles.cardHeader}>
                            <Ionicons name="warning-outline" size={24} color={themeColors.danger} />
                            <Text style={[styles.cardTitle, { color: themeColors.danger }]}>{t("danger_zone")}</Text>
                        </View>
                        <Text style={[styles.dangerNote, { color: themeColors.subtext }]}>{t("confirm_clear_msg")}</Text>

                        <TouchableOpacity
                            style={[styles.dangerBtn, { backgroundColor: themeColors.danger + '15' }]}
                            onPress={() => setClearModalVisible(true)}
                        >
                            <Text style={[styles.dangerBtnText, { color: themeColors.danger }]}>{t("clear_all_data")}</Text>
                        </TouchableOpacity>
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
        flex: 1
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center"
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
        paddingTop: Platform.OS === "android" ? 40 : 10,
        paddingBottom: 15,
        gap: 16,
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
        fontWeight: "800"
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    card: {
        borderRadius: 28,
        padding: 24,
        marginBottom: 24,
        borderWidth: 1,
        elevation: 2,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    cardHeader: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 24,
        gap: 12
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: "800"
    },
    storageInfo: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12
    },
    storageText: {
        fontSize: 14,
        fontWeight: "700",
        opacity: 0.8
    },
    storagePercent: {
        fontSize: 15,
        fontWeight: "800"
    },
    pBarBg: {
        height: 10,
        borderRadius: 5,
        overflow: "hidden",
        marginBottom: 24
    },
    pBarFill: {
        height: "100%",
        borderRadius: 5
    },
    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 20
    },
    infoLabel: {
        fontSize: 13,
        fontWeight: "600",
        opacity: 0.7
    },
    infoValue: {
        fontSize: 15,
        fontWeight: "700"
    },
    actionBtn: {
        flexDirection: "row",
        height: 60,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        elevation: 4,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    actionBtnText: {
        fontSize: 16,
        fontWeight: "800"
    },
    smallHeading: {
        fontSize: 12,
        fontWeight: "800",
        textTransform: "uppercase",
        letterSpacing: 2,
        marginBottom: 16,
        marginLeft: 4,
    },
    freqRow: {
        flexDirection: "row",
        gap: 10,
        marginTop: 4
    },
    freqChip: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: "transparent",
    },
    freqText: {
        fontSize: 13,
        fontWeight: "700"
    },
    gridActions: {
        flexDirection: "row",
        gap: 12
    },
    gridBtn: {
        flex: 1,
        height: 90,
        borderRadius: 24,
        justifyContent: "center",
        alignItems: "center",
        gap: 10,
        borderWidth: 1,
    },
    gridBtnText: {
        fontSize: 14,
        fontWeight: "700"
    },
    importBtn: {
        height: 60,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 12,
        borderWidth: 2,
        borderStyle: "dashed",
    },
    importBtnText: {
        fontSize: 16,
        fontWeight: "700"
    },
    dangerNote: {
        fontSize: 14,
        lineHeight: 22,
        marginBottom: 24,
        opacity: 0.8
    },
    dangerBtn: {
        height: 60,
        borderRadius: 18,
        alignItems: "center",
        justifyContent: "center",
        elevation: 4,
    },
    dangerBtnText: {
        fontWeight: "800",
        fontSize: 16,
        letterSpacing: 0.5
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(15,32,39,0.8)",
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
        fontSize: 24,
        fontWeight: "800",
        marginBottom: 12
    },
    modalSub: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 24,
        opacity: 0.8
    },
    passInput: {
        height: 60,
        borderWidth: 1.5,
        borderRadius: 16,
        paddingHorizontal: 18,
        fontSize: 16,
        marginBottom: 28,
        fontWeight: "600"
    },
    modalActions: {
        flexDirection: "row",
        gap: 12
    },
    mBtn: {
        flex: 1,
        height: 56,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center"
    },
    mBtnText: {
        fontSize: 16,
        fontWeight: "700"
    },
    rangeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24
    },
    rangeBtn: {
        width: '48%',
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    rangeBtnText: {
        fontWeight: '700',
        fontSize: 14
    },
    cancelBtn: {
        height: 54,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        borderWidth: 1,
    },
    cancelBtnText: {
        fontWeight: '800',
        fontSize: 15
    },
});
