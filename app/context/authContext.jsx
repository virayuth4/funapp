"use client";

import { createContext, useContext, useSyncExternalStore } from "react";

const AuthContext = createContext(null);

const USER_ID_KEY = "userId";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 year

function generateUUID() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback when not running in a secure HTTPS context
  return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, (c) =>
    (
      +c ^
      (typeof crypto !== "undefined" && crypto.getRandomValues
        ? crypto.getRandomValues(new Uint8Array(1))[0]
        : Math.floor(Math.random() * 256)) &
        (15 >> (+c / 4))
    ).toString(16)
  );
}

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
    id = generateUUID();
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