import React, { createContext, useState, useEffect, useContext, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { AuthContext } from "./AuthContext";
import { BASE_URL } from "../config";

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const { userToken } = useContext(AuthContext);
    const [expenses, setExpenses] = useState([]);
    const [incomes, setIncomes] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState(null);

    const loadCache = useCallback(async () => {
        try {
            const [cachedExpenses, cachedIncomes] = await Promise.all([
                AsyncStorage.getItem("cached_expenses"),
                AsyncStorage.getItem("cached_incomes"),
            ]);
            if (cachedExpenses) setExpenses(JSON.parse(cachedExpenses));
            if (cachedIncomes) setIncomes(JSON.parse(cachedIncomes));
        } catch (e) {
            console.log("Error loading data cache:", e);
        }
    }, []);

    const fetchAll = useCallback(async (showLoading = true) => {
        if (!userToken) return;
        try {
            if (showLoading) setIsRefreshing(true);
            const headers = { Authorization: `Bearer ${userToken}` };

            const [expenseRes, incomeRes] = await Promise.all([
                axios.get(`${BASE_URL}/expenses`, { headers }),
                axios.get(`${BASE_URL}/incomes`, { headers }),
            ]);

            setExpenses(expenseRes.data);
            setIncomes(incomeRes.data);
            setLastUpdated(new Date());

            // Update cache
            await Promise.all([
                AsyncStorage.setItem("cached_expenses", JSON.stringify(expenseRes.data)),
                AsyncStorage.setItem("cached_incomes", JSON.stringify(incomeRes.data)),
            ]);
        } catch (e) {
            console.log("Global data fetch error:", e.message);
        } finally {
            setIsRefreshing(false);
            setIsLoading(false);
        }
    }, [userToken]);

    // Initial load
    useEffect(() => {
        if (userToken) {
            setIsLoading(true);
            loadCache().finally(() => {
                fetchAll(false);
            });
        } else {
            setExpenses([]);
            setIncomes([]);
        }
    }, [userToken, loadCache, fetchAll]);

    const refresh = useCallback(() => fetchAll(true), [fetchAll]);
    const refreshSilently = useCallback(() => fetchAll(false), [fetchAll]);

    return (
        <DataContext.Provider value={{
            expenses,
            incomes,
            isLoading,
            isRefreshing,
            lastUpdated,
            refresh,
            refreshSilently,
            setExpenses,
            setIncomes,
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) {
        throw new Error("useData must be used within a DataProvider");
    }
    return context;
};
