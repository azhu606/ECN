// src/authSession.ts

export function getCurrentUserId(): string | null {
  return localStorage.getItem("ecnUserId");
}

export function isUserLoggedIn(): boolean {
  return localStorage.getItem("ecnIsLoggedIn") === "true";
}

export function clearAuthSession() {
  localStorage.removeItem("ecnUserId");
  localStorage.removeItem("ecnIsLoggedIn");
}
