import type { AxiosError } from "axios";

const FIELD_BY_ERROR_KEY: Record<string, string> = {
  UserName: "userName",
  DuplicateUserName: "userName",
  InvalidUserName: "userName",
  Password: "password",
  PasswordTooShort: "password",
  PasswordRequiresDigit: "password",
  PasswordRequiresLower: "password",
  PasswordRequiresUpper: "password",
  PasswordRequiresNonAlphanumeric: "password",
  PasswordRequiresUniqueChars: "password",
  Name: "name",
  Surname: "surname",
  Phone: "phone",
  Birthday: "birthday",
};

export interface ParsedApiErrors {
  fieldErrors: Record<string, string>;
  generalError?: string;
}

function extractErrorDict(data: unknown): Record<string, string[]> | null {
  if (!data || typeof data !== "object") return null;
  const obj = data as Record<string, unknown>;
  const source =
    obj.errors && typeof obj.errors === "object"
      ? (obj.errors as Record<string, unknown>)
      : obj;

  const result: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(source)) {
    if (Array.isArray(value)) {
      const messages = value.filter((v): v is string => typeof v === "string");
      if (messages.length > 0) result[key] = messages;
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

function extractMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const message = (data as Record<string, unknown>).Message ??
    (data as Record<string, unknown>).message;
  return typeof message === "string" && message.length > 0 ? message : null;
}

export function parseApiErrors(err: unknown, fallback: string): ParsedApiErrors {
  const data =
    (err as AxiosError).response?.data ?? (err as { data?: unknown }).data;
  const errors = extractErrorDict(data);
  if (!errors) {
    return { fieldErrors: {}, generalError: extractMessage(data) ?? fallback };
  }

  const fieldErrors: Record<string, string> = {};
  const unmapped: string[] = [];

  for (const [key, messages] of Object.entries(errors)) {
    const message = messages.join(" ");
    const field = FIELD_BY_ERROR_KEY[key];
    if (field) {
      fieldErrors[field] = fieldErrors[field]
        ? `${fieldErrors[field]} ${message}`
        : message;
    } else {
      unmapped.push(message);
    }
  }

  return {
    fieldErrors,
    generalError: unmapped.length > 0 ? unmapped.join(" ") : undefined,
  };
}

export function getApiErrorMessage(err: unknown, fallback: string): string {
  const { fieldErrors, generalError } = parseApiErrors(err, fallback);
  const all = [...Object.values(fieldErrors)];
  if (generalError) all.push(generalError);
  return all.length > 0 ? all.join(" ") : fallback;
}
