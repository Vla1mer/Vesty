import { api, saveTokens, clearTokens } from "./client";
import { endpoints } from "./endpoints";
import type {
  TokenDto,
  UserForAuthenticationDto,
  UserForRegistrationDto,
} from "../types/api";

export async function register(dto: UserForRegistrationDto): Promise<void> {
  await api.post(endpoints.auth.register, dto);
}

export async function login(dto: UserForAuthenticationDto): Promise<TokenDto> {
  const response = await api.post<TokenDto>(endpoints.auth.login, dto);
  saveTokens(response.data);
  return response.data;
}

export function logout(): void {
  clearTokens();
}
