import { View, ActivityIndicator } from "react-native";

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: "#000814", justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" color="#FFD60A" />
    </View>
  );
}
