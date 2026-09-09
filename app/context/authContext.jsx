"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

const AuthContext = createContext(null);

const USER_ID_KEY = "userId";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? match[2] : null;
}

function setCookie(name, value, maxAge) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

function getOrSetUserId() {
  let id = localStorage.getItem(USER_ID_KEY) || getCookie(USER_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
  }
  localStorage.setItem(USER_ID_KEY, id);
  setCookie(USER_ID_KEY, id, COOKIE_MAX_AGE);
  return id;
}

// Dummy subscribe because userId doesn't change during session
const subscribe = () => () => {};

export function AuthProvider({ children }) {
  const userId = useSyncExternalStore(
    subscribe,
    getOrSetUserId, // Client snapshot
    () => null      // Server snapshot (avoids SSR hydration mismatch)
  );

  return (
    <AuthContext.Provider value={{ userId }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}