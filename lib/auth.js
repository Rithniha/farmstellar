/**
 * JWT Authentication utilities for the client side.
 * These utilities help verify JWT tokens stored in localStorage.
 */

/**
 * Get the stored JWT token from localStorage.
 * Returns the token string if present, null otherwise.
 */
export function getStoredToken() {
  if (typeof window === "undefined") return null; // SSR safety
  try {
    const stored = localStorage.getItem("farmquest_auth");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed.token || null;
  } catch (e) {
    console.warn("Failed to parse stored auth token", e);
    return null;
  }
}

/**
 * Check if user is authenticated (token exists in localStorage).
 * This is a lightweight check and does not validate token signature.
 */
export function isAuthenticated() {
  return !!getStoredToken();
}

/**
 * Clear the stored JWT token (logout).
 */
export function clearAuthToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("farmquest_auth");
  } catch (e) {
    console.warn("Failed to clear auth token", e);
  }
}

/**
 * Decode JWT payload without verification (client-side only).
 * Returns the payload object if token is valid, null otherwise.
 * WARNING: This does NOT verify the token signature; use server-side verification for security.
 */
export function decodeToken(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload;
  } catch (e) {
    console.warn("Failed to decode token", e);
    return null;
  }
}

/**
 * Get the userId from the stored token.
 * Returns userId if token is valid and contains userId, null otherwise.
 */
export function getUserId() {
  const token = getStoredToken();
  if (!token) return null;
  const payload = decodeToken(token);
  return payload?.userId || null;
}

/**
 * Check if token is expired (client-side check only).
 * Returns true if token is expired or cannot be decoded, false if valid.
 */
export function isTokenExpired(token) {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

/**
 * Clear all authentication data from localStorage.
 * Use this when authentication fails (e.g., 401 errors) to clean up state.
 * Does not call server - use logout() for intentional user logout.
 */
export function clearAuth() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("farmquest_auth");
    localStorage.removeItem("farmquest_userdata");
    localStorage.removeItem("onboard_phone");
    localStorage.removeItem("onboard_profile");
    localStorage.removeItem("onboard_level");
    localStorage.removeItem("pendingFarm");
  } catch (e) {
    console.warn("Failed to clear auth data", e);
  }
}

/**
 * Perform logout: clear all auth-related localStorage keys.
 * Optionally call server-side logout endpoint for audit logging.
 */
export async function logout(callServer = true) {
  // Clear all auth and user data from localStorage
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem("farmquest_auth");
      localStorage.removeItem("farmquest_userdata");
      localStorage.removeItem("onboard_phone");
      localStorage.removeItem("onboard_profile");
      localStorage.removeItem("onboard_level");
      localStorage.removeItem("pendingFarm");
    } catch (e) {
      console.warn("Failed to clear localStorage during logout", e);
    }
  }

  // Call server-side logout endpoint if requested (for audit logging, etc.)
  if (callServer) {
    try {
      const token = getStoredToken();
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
      }
    } catch (err) {
      console.warn("Server logout call failed", err);
      // Continue logout locally even if server call fails
    }
  }
}
