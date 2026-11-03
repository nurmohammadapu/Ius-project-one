import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  DEFAULT_SERVER_URL,
  getServerUrl,
  setServerUrl,
  testServerConnection,
} from "../services/apiConnector";
import Ionicons from "react-native-vector-icons/Ionicons";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function ServerConfigModal({ visible, onClose }: Props) {
  const [url, setUrl] = useState("");
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (visible) {
      setTestResult(null);
      getServerUrl().then((saved) => {
        setUrl(saved || DEFAULT_SERVER_URL);
      });
    }
  }, [visible]);

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testServerConnection(url);
      setTestResult(res);
    } catch (e: any) {
      setTestResult({ ok: false, message: e?.message || "Failed" });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async () => {
    if (!url.trim()) {
      Alert.alert("Error", "Please enter a valid IP or server address");
      return;
    }
    const saved = await setServerUrl(url);
    Alert.alert("Success", `Server set to:\n${saved}`);
    onClose();
  };

  const setPreset = (presetHost: string) => {
    setUrl(`http://${presetHost}:5001/api/v1`);
    setTestResult(null);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View
        style={{ backgroundColor: "rgba(0,0,0,0.65)" }}
        className="flex-1 justify-center items-center px-4"
      >
        <View className="w-full bg-richblack-800 border border-richblack-700 rounded-2xl p-5 shadow-2xl">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center">
              <Ionicons name="server-outline" size={24} color="#FFD60A" />
              <Text className="text-richblack-5 font-bold text-lg ml-2">
                Server Settings
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} className="p-1">
              <Ionicons name="close" size={22} color="#AFB2BF" />
            </TouchableOpacity>
          </View>

          <Text className="text-xs text-richblack-300 mb-2">
            Change server IP to match your laptop's Wi-Fi / Hotspot or use Localhost with USB cable:
          </Text>

          <TextInput
            value={url}
            onChangeText={(txt) => {
              setUrl(txt);
              setTestResult(null);
            }}
            placeholder="http://10.0.13.88:5001/api/v1"
            placeholderTextColor="#6E727F"
            autoCapitalize="none"
            autoCorrect={false}
            className="w-full bg-richblack-900 border border-richblack-700 text-richblack-5 px-3 py-2.5 rounded-lg text-sm mb-3 font-mono"
          />

          {/* Quick preset buttons */}
          <Text className="text-xs text-richblack-400 mb-1.5 font-semibold">
            Quick Presets:
          </Text>
          <View className="flex-row gap-2 mb-4">
            <TouchableOpacity
              onPress={() => setPreset("10.0.13.88")}
              className="bg-richblack-700 px-3 py-1.5 rounded-md border border-richblack-600"
            >
              <Text className="text-xs text-yellow-50 font-medium">
                10.0.13.88 (Wi-Fi)
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPreset("localhost")}
              className="bg-richblack-700 px-3 py-1.5 rounded-md border border-richblack-600"
            >
              <Text className="text-xs text-blue-100 font-medium">
                localhost (USB ADB)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Test connection status display */}
          {testResult && (
            <View
              className={`p-2.5 rounded-lg mb-3 ${
                testResult.ok
                  ? "bg-caribbeangreen-900/30 border border-caribbeangreen-200"
                  : "bg-pink-900/30 border border-pink-200"
              }`}
            >
              <Text
                className={`text-xs ${
                  testResult.ok ? "text-caribbeangreen-200" : "text-pink-200"
                }`}
              >
                {testResult.ok ? "✅ " : "❌ "}
                {testResult.message}
              </Text>
            </View>
          )}

          {/* Action buttons */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={handleTest}
              disabled={testing}
              className="flex-1 bg-richblack-700 py-2.5 rounded-lg border border-richblack-600 items-center justify-center"
            >
              {testing ? (
                <ActivityIndicator size="small" color="#FFD60A" />
              ) : (
                <Text className="text-richblack-100 font-semibold text-sm">
                  Test Connection
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              className="flex-1 bg-yellow-50 py-2.5 rounded-lg items-center justify-center"
            >
              <Text className="text-richblack-900 font-bold text-sm">
                Save & Apply
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

