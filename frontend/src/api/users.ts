import { api } from "./client";
import type { UserDto } from "../types/api";

export async function getAllUsers(): Promise<UserDto[]> {
  const response = await api.get<UserDto[]>("/api/User", {
    params: { pageSize: 50 },
  });
  return response.data;
}
