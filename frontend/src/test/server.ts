import { vi } from "vitest";
import { api } from "../api/client";

export interface StubbedRequest {
  url: string;
  method: string;
  data?: unknown;
  params?: unknown;
}

type Handler = (request: StubbedRequest) => unknown;

const handlers = new Map<string, Handler>();
export const requests: StubbedRequest[] = [];

function key(method: string, url: string): string {
  return `${method.toUpperCase()} ${url}`;
}

export function stub(method: string, url: string, handler: Handler): void {
  handlers.set(key(method, url), handler);
}

export function stubJson(method: string, url: string, body: unknown): void {
  stub(method, url, () => body);
}

export function resetServer(): void {
  handlers.clear();
  requests.length = 0;
}

export function installServer(): void {
  vi.spyOn(api, "request").mockImplementation(async (config) => {
    const request: StubbedRequest = {
      url: config.url ?? "",
      method: (config.method ?? "get").toString(),
      data: config.data,
      params: config.params,
    };
    requests.push(request);

    const handler = handlers.get(key(request.method, request.url));
    if (!handler) {
      const error = Object.assign(new Error(`Unhandled ${key(request.method, request.url)}`), {
        response: { status: 404, data: { Message: "Not stubbed" } },
      });
      throw error;
    }

    return { data: handler(request) } as never;
  });
}
