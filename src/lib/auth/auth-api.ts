/** Auth endpoint bindings for the RCECAD Spring API. */

import { apiFetch } from "@/lib/api";

/** Response of POST /api/auth/login. */
export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
};

export function login(email: string, password: string): Promise<LoginResponse> {
  return apiFetch<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

/**
 * Self-service registration payload.
 *
 * NOTE (Phase 2): the API does not expose a public signup endpoint yet. Today
 * only `POST /api/users` exists, and it is ADMIN-only and expects `roles[]`
 * (no `name`). This client targets the intended public contract
 * `POST /api/auth/register`, which must be implemented on the backend before
 * registration works end to end.
 */
export type RegisterPayload = {
  name: string;
  email: string;
  cnpj: string;
  password: string;
};

export type RegisteredUserResponse = {
  id: string;
  email: string;
  cnpj: string;
  corporateName: string | null;
  roles: string[];
};

export function registerCompany(
  payload: RegisterPayload,
): Promise<RegisteredUserResponse> {
  return apiFetch<RegisteredUserResponse>("/api/auth/register", {
    method: "POST",
    body: payload,
  });
}
