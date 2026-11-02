import React from "react";
import { StatusBar } from "react-native";
import { Provider } from "react-redux";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { store } from "./src/redux/store";
import RootNavigator from "./src/navigation/RootNavigator";

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" backgroundColor="#000814" />
        <RootNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}

