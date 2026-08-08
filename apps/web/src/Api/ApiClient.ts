import { ApiErrorSchema, type TApiErrorCode } from "@mooduck/contracts";
import type { ZodType } from "zod";

/** A typed failure carrying the contract's error `code` so callers branch on it. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: TApiErrorCode;

  constructor(status: number, code: TApiErrorCode, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: "GET" | "POST";
  body?: unknown;
}

/** Same-origin JSON fetch; validates the response body against a contract schema. */
export async function apiRequest<T>(path: string, schema: ZodType<T>, options: RequestOptions = {}): Promise<T> {
  const response = await sendRequest(path, options);
  if (!response.ok) {
    throw await toApiError(response);
  }
  return schema.parse(await response.json());
}

/** For `204 No Content` responses (logout) — nothing to validate. */
export async function apiRequestNoContent(path: string, options: RequestOptions = {}): Promise<void> {
  const response = await sendRequest(path, options);
  if (!response.ok) {
    throw await toApiError(response);
  }
}

function sendRequest(path: string, options: RequestOptions): Promise<Response> {
  const init: RequestInit = {
    method: options.method ?? "GET",
    credentials: "same-origin",
  };
  if (options.body !== undefined) {
    init.headers = { "Content-Type": "application/json" };
    init.body = JSON.stringify(options.body);
  }
  return fetch(path, init);
}

async function toApiError(response: Response): Promise<ApiError> {
  const body = await response.json().catch(() => null);
  const parsed = ApiErrorSchema.safeParse(body);
  if (parsed.success) {
    return new ApiError(response.status, parsed.data.error.code, parsed.data.error.message);
  }
  const fallback: TApiErrorCode = response.status === 401 ? "unauthorized" : "internal";
  return new ApiError(response.status, fallback, "Request failed");
}
