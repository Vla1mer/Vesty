import { api } from "./client";
import type { UserDto, UserForUpdateDto } from "../types/api";

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

export async function updateUser(
  id: number,
  dto: UserForUpdateDto
): Promise<void> {
  await api.put(`/api/User/${id}`, dto);
}

export async function deleteUser(id: number): Promise<void> {
  await api.delete(`/api/User/${id}`);
}
