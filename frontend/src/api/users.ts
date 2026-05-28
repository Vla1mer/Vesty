import { api } from "./client";
import type { UserDto } from "../types/api";

export async function getAllUsers(): Promise<UserDto[]> {
  const response = await api.get<UserDto[]>("/api/User", {
    params: { pageSize: 50 },
  });
  return response.data;
}

export async function getUserById(id: number): Promise<UserDto> {
  const response = await api.get<UserDto>(`/api/User/${id}`);
  return response.data;
}
