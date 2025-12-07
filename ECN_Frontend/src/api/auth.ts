// src/api/auth.ts
import { post } from "./client";

export type RequestLinkResponse = {
  ok: boolean;
  verifyUrl?: string;  // present in dev mode
};

export function requestSignUpLink(email: string) {
  return post<RequestLinkResponse>("/auth/request-link", { email });
}

// Keep this for later when you build the full registration form
export type RegisterResponse = {
  ok: boolean;
  user?: unknown;
};

export function register(name: string, email: string, password: string) {
  return post<RegisterResponse>("/auth/register", { name, email, password });
}
