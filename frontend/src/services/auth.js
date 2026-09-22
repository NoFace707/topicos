import { apiRequest } from "./api";

export const getSession = () => apiRequest("/api/auth/session/");
export const login = (credentials) =>
  apiRequest("/api/auth/login/", { method: "POST", body: credentials });
export const register = (credentials) =>
  apiRequest("/api/auth/register/", { method: "POST", body: credentials });
export const logout = () => apiRequest("/api/auth/logout/", { method: "POST" });

