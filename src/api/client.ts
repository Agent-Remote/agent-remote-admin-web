import type { ApiResponse, ListData } from "../types";

export const defaultApiBase =
  import.meta.env.VITE_AGENT_REMOTE_API_BASE ?? "http://127.0.0.1:8765";

export class ApiClient {
  constructor(
    private readonly apiBase: string,
    private readonly token: string
  ) {}

  async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      ...(options.headers as Record<string, string> | undefined)
    };
    if (this.token) headers.authorization = `Bearer ${this.token}`;
    const response = await fetch(`${this.apiBase.replace(/\/$/, "")}/api/v1${path}`, {
      ...options,
      headers
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const message = payload?.error?.message ?? `${response.status} ${response.statusText}`;
      throw new Error(message);
    }
    return payload as T;
  }

  async list<T>(path: string): Promise<T[]> {
    const response = await this.request<ApiResponse<ListData<T>>>(path);
    return response.data.items;
  }
}
