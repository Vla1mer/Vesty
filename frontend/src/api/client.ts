import axios from "axios";
import type { AxiosError, AxiosRequestConfig } from "axios";
import type { TokenDto } from "../types/api";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5005";

export const ACCESS_TOKEN_KEY = "chatapp.accessToken";
export const REFRESH_TOKEN_KEY = "chatapp.refreshToken";

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const saveTokens = (tokens: TokenDto) => {
  localStorage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
};

export const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>).Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<TokenDto> | null = null;

async function refreshTokens(): Promise<TokenDto> {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!accessToken || !refreshToken) throw new Error("No tokens to refresh");

  const response = await axios.post<TokenDto>(`${API_URL}/api/User/refresh`, {
    accessToken,
    refreshToken,
  });
  saveTokens(response.data);
  return response.data;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/User/login") &&
      !originalRequest.url?.includes("/User/refresh") &&
      !originalRequest.url?.includes("/User/register")
    ) {
      originalRequest._retry = true;
      try {
        refreshPromise = refreshPromise ?? refreshTokens();
        const tokens = await refreshPromise;
        refreshPromise = null;
        originalRequest.headers = originalRequest.headers ?? {};
        (originalRequest.headers as Record<string, string>).Authorization =
          `Bearer ${tokens.accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        refreshPromise = null;
        clearTokens();
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
