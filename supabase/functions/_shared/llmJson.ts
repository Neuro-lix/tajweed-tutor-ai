import { HttpError } from "./http.ts";

export function parseLlmJson<T = unknown>(raw: string): T {
  let s = (raw ?? "").trim().replace(/^