import React, { useState, useMemo, useContext } from "react";
import axios from "axios";
import { useEffect } from "react";
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
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { Swipeable } from "react-native-gesture-handler";
import { LinearGradient } from "expo-linear-gradient";
import { AuthContext } from "../../context/AuthContext";

const screenWidth = Dimensions.get("window").width;
const BASE_URL = "http://10.85.43.153:5000";

const categoriesList = [
  "Food",
  "Travel",
  "Shopping",
  "Bills",
  "Health",
  "Housing",
  "Education",
  "Entertainment",
  "Groceries",
  "Transport",
  "Investment",
  "Subscriptions",
  "Others",
];

export default function Practice() {
  const { userToken } = useContext(AuthContext);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [expenses, setExpenses] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("All");

  useEffect(() => {
    if (userToken) {
      fetchExpenses();
    }
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

  // const handleAdd = () => {
  //   if (!title || !amount || !category) return;

  //   const newExpense = {
  //     id: Date.now().toString(),
  //     title,
  //     amount: Number(amount),
  //     category,
  //   };

  //   setExpenses([newExpense, ...expenses]);
  //   setTitle("");
  //   setAmount("");
  //   setCategory("");
  //   setModalVisible(false);
  // };


const handleAdd = async () => {
  if (!title || !amount || !category) return;

  try {
    const res = await axios.post(
      `${BASE_URL}/expenses`,
      {
        title,
        amount: Number(amount),
        category,
      },
      {
        headers: { Authorization: `Bearer ${userToken}` },
      }
    );

    setExpenses([res.data, ...expenses]);
    setModalVisible(false);
    setTitle("");
    setAmount("");
    setCategory("");
  } catch (error) {
    console.log("Add error:", error.message);
  }
};

  // const deleteExpense = (id) => {
  //   setExpenses((prev) => prev.filter((item) => item.id !== id));
  // };

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

  const filteredExpenses =
    selectedFilter === "All"
      ? expenses
      : expenses.filter((e) => e.category === selectedFilter);

  const totalAmount = filteredExpenses.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const grouped = useMemo(() => {
    const data = {};
    expenses.forEach((item) => {
      data[item.category] =
        (data[item.category] || 0) + item.amount;
    });
    return data;
  }, [expenses]);

  const chartData =
    Object.keys(grouped).length > 0
      ? Object.keys(grouped).map((key, index) => ({
        name: key,
        amount: grouped[key],
        color: [
          "#4ADE80",
          "#38BDF8",
          "#FACC15",
          "#A78BFA",
          "#F472B6",
        ][index % 5],
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
        <View>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardCategory}>{item.category}</Text>
        </View>
        <Text style={styles.cardAmount}>₹{item.amount}</Text>
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
          <Text style={styles.totalLabel}>Total Balance</Text>
          <Text style={styles.totalAmount}>₹{totalAmount}</Text>
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

        {/* Compact Filter */}
        <View style={styles.filterRow}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
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
                    selectedFilter === cat &&
                    styles.activeFilterText,
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
          // keyExtractor={(item) => item.id}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 120 }}
        />

        {/* Premium FAB */}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>

        {/* Modal */}
        <Modal visible={modalVisible} animationType="slide">
          <LinearGradient
            colors={["#0F2027", "#203A43"]}
            style={styles.modalContainer}
          >
            <Text style={styles.modalHeading}>
              Add Expense
            </Text>

            <TextInput
              placeholder="Title"
              placeholderTextColor="#aaa"
              value={title}
              onChangeText={setTitle}
              style={styles.input}
            />

            <TextInput
              placeholder="Amount"
              placeholderTextColor="#aaa"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              style={styles.input}
            />

            {/* <Text style={styles.selectText}>
              Select Category
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ maxHeight: 50 }}
              contentContainerStyle={{ alignItems: "center" }}
            >
              {categoriesList.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryChip,
                    category === cat &&
                    styles.activeChip,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={{
                      color:
                        category === cat
                          ? "#0F2027"
                          : "white",
                    }}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView> */}


            <Text style={styles.selectText}>Select Category</Text>

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

            <TouchableOpacity
              style={styles.addButton}
              onPress={handleAdd}
            >
              <Text style={styles.addButtonText}>
                Add Expense
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelText}>
                Cancel
              </Text>
            </TouchableOpacity>
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
    marginTop: 40
  },

  totalBox: {
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 20,
    borderRadius: 20,
    marginBottom: 20,
  },

  totalLabel: { color: "#4ADE80" },

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

  card: {
    backgroundColor: "rgba(255,255,255,0.08)",
    padding: 18,
    borderRadius: 18,
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },

  cardTitle: { color: "white", fontWeight: "600" },

  cardCategory: {
    color: "#4ADE80",
    fontSize: 12,
    marginTop: 3,
  },

  cardAmount: {
    color: "#4ADE80",
    fontWeight: "700",
    fontSize: 16,
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

  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 15,
    borderRadius: 14,
    marginBottom: 15,
    color: "white",
  },

  selectText: {
    color: "white",
    marginBottom: 10,
  },

  addButton: {
    backgroundColor: "#4ADE80",
    padding: 15,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 20,
  },

  addButtonText: {
    fontWeight: "600",
    color: "#0F2027",
  },

  cancelText: {
    color: "white",
    marginTop: 15,
    textAlign: "center",
  },

  // categoryChip: {
  //   height: 36,
  //   paddingHorizontal: 16,
  //   borderRadius: 18,
  //   backgroundColor: "rgba(255,255,255,0.15)",
  //   justifyContent: "center",
  //   alignItems: "center",
  //   marginRight: 10,
  // },

  categoryGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 10,
  marginBottom: 20,
},

categoryChip: {
  paddingVertical: 8,
  paddingHorizontal: 14,
  borderRadius: 18,
  backgroundColor: "rgba(255,255,255,0.15)",
  marginBottom: 10,
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
});