import { Redirect } from "expo-router";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { View, ActivityIndicator } from "react-native";

export default function Index() {
    const { userToken, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0F2027" }}>
                <ActivityIndicator size="large" color="#4ADE80" />
            </View>
        );
    }

    if (userToken) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/login" />;
}
