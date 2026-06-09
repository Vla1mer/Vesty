import { api, saveTokens, clearTokens } from "./client";
import type {
  TokenDto,
  UserForAuthenticationDto,
  UserForRegistrationDto,
} from "../types/api";

export async function register(dto: UserForRegistrationDto): Promise<void> {
  await api.post("/api/User/register", dto);
}

export async function login(dto: UserForAuthenticationDto): Promise<TokenDto> {
  const response = await api.post<TokenDto>("/api/User/login", dto);
  saveTokens(response.data);
  return response.data;
}

export function logout(): void {
  clearTokens();
}
