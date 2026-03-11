import { Redirect } from "expo-router";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
    const { userToken, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return null; // Don't show anything during the auth check to prevent the 'irritating loader' flash
    }

    if (userToken) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/login" />;
}
