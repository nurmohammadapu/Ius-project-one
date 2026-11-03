import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const STORAGE_KEY_SERVER_URL = "custom_backend_base_url";
export const DEFAULT_SERVER_URL = "http://10.0.13.88:5001/api/v1";

let currentServerUrl = DEFAULT_SERVER_URL;

// Initialize on app launch
AsyncStorage.getItem(STORAGE_KEY_SERVER_URL)
  .then((saved) => {
    if (saved && saved.trim()) {
      currentServerUrl = normalizeServerUrl(saved);
    }
  })
  .catch(() => {});

export const normalizeServerUrl = (input) => {
  if (!input || !input.trim()) return DEFAULT_SERVER_URL;
  let clean = input.trim();
  if (!clean.startsWith("http://") && !clean.startsWith("https://")) {
    clean = "http://" + clean;
  }
  // If user only wrote IP without port, add :5001
  const withoutProtocol = clean.replace(/^https?:\/\//, "");
  if (!withoutProtocol.includes(":") && !withoutProtocol.includes("/")) {
    clean = clean + ":5001";
  }
  // Ensure /api/v1 at the end
  if (!clean.endsWith("/api/v1")) {
    clean = clean.replace(/\/+$/, "") + "/api/v1";
  }
  return clean;
};

export const getServerUrl = async () => {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY_SERVER_URL);
    if (saved && saved.trim()) {
      currentServerUrl = normalizeServerUrl(saved);
      return currentServerUrl;
    }
  } catch (e) {}
  return currentServerUrl;
};

export const setServerUrl = async (newUrl) => {
  const normalized = normalizeServerUrl(newUrl);
  currentServerUrl = normalized;
  await AsyncStorage.setItem(STORAGE_KEY_SERVER_URL, normalized);
  return normalized;
};

export const testServerConnection = async (targetUrl) => {
  const norm = normalizeServerUrl(targetUrl);
  // Root health endpoint on backend server
  const rootUrl = norm.replace(/\/api\/v1\/?$/, "");
  try {
    const res = await axios.get(rootUrl, { timeout: 3500 });
    if (res.status === 200) {
      return { ok: true, message: "Connected! Server is reachable." };
    }
    return { ok: false, message: `Server replied with status ${res.status}` };
  } catch (err) {
    return {
      ok: false,
      message: err.message || "Cannot reach server. Check IP & Wi-Fi.",
    };
  }
};

export const axiosInstance = axios.create({
  timeout: 15000,
});

axiosInstance.interceptors.request.use(async (config) => {
  const base = currentServerUrl || DEFAULT_SERVER_URL;
  if (config.url) {
    // Replace whatever BASE_URL was prefixed with currentServerUrl
    config.url = config.url.replace(/^https?:\/\/[^/]+(:[0-9]+)?\/api\/v1/, base);
  }
  return config;
});

export const apiConnector = (method, url, bodyData, headers, params) => {
  return axiosInstance({
    method: `${method}`,
    url: `${url}`,
    data: bodyData ? bodyData : null,
    headers: headers ? headers : null,
    params: params ? params : null,
  });
};

