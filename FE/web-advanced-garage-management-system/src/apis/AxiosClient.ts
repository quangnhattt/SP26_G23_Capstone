import axios from "axios";
import { authService } from "./auth";
import { AppStorageEnum } from "@/constants/types";
import LocalStorage from "./LocalStorage";
import isJwtTokenValid from "@/utils/jsJwtTokenValid";

export const API_URL = "http://42.96.15.55:3001"; //UAT
// export const API_URL = "http://42.96.15.55:3000"; //production

const getLanguage = () => LocalStorage.getLanguage() || "en";

const setAuthHeader = (token: string | null, headers: any) => {
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
};

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = []; // Queue for subscribers waiting for the token
let refreshPromise: Promise<string> | null = null; // Cached refresh promise

const refreshToken = async () => {
  if (isRefreshing) {
    // console.log("Token refresh already in progress. Adding to the queue.");
    return refreshPromise!;
  }

  isRefreshing = true;
  const token_refresh = localStorage.getItem(AppStorageEnum.REFRESH_TOKEN);

  if (!token_refresh || !isJwtTokenValid(token_refresh)) {
    handleLogout();
    isRefreshing = false;
    refreshPromise = null; // Reset the cached promise
    throw new Error("Refresh token invalid or expired.");
  }

  // Cache the refresh promise
  refreshPromise = new Promise<string>(async (resolve, reject) => {
    try {
      const res = await authService.refreshToken({
        refreshToken: token_refresh,
      });
      const newAccessToken = res.accessToken;

      LocalStorage.setToken(newAccessToken);
      localStorage.setItem(AppStorageEnum.REFRESH_TOKEN, res.refreshToken);

      // Notify all subscribers with the new token
      refreshSubscribers.forEach((callback) => callback(newAccessToken));
      refreshSubscribers = []; // Clear the queue

      resolve(newAccessToken);
    } catch (error) {
      console.error("Token refresh failed", error);
      handleLogout();

      refreshSubscribers = [];
      reject(new Error("Failed to refresh token. Please log in again."));
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  });

  return refreshPromise;
};

// Utility function to handle user logout
export const handleLogout = () => {
  const token_refresh = localStorage.getItem(AppStorageEnum.REFRESH_TOKEN);

  LocalStorage.removeToken();
  localStorage.removeItem(AppStorageEnum.REFRESH_TOKEN);

  if (token_refresh) {
    authService.logout({ refreshToken: token_refresh });
  }
  window.location.href = "/";
};
const AxiosClient = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": getLanguage(),
  },
});

// Request Interceptor
AxiosClient.interceptors.request.use((config) => {
  const token = LocalStorage.getToken();
  const newConfig = { ...config };

  if (newConfig.headers) {
    setAuthHeader(token, newConfig.headers);
    newConfig.headers["Accept-Language"] = getLanguage();
  }

  // Skip transformations for multipart/form-data
  if (newConfig.headers?.["Content-Type"] === "multipart/form-data") {
    return newConfig;
  }

  return newConfig;
});

AxiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshToken();
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return AxiosClient(originalRequest); // Retry the failed request with the new token
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default AxiosClient;
