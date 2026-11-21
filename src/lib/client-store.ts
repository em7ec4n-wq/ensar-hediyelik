"use client";

import type { StoreData } from "@/types/store";
import { DEFAULT_STORE_DATA } from "./default-store";

const STORE_KEY = "ensar_hediyelik_store_v1";

export function loadClientStore(): StoreData {
  if (typeof window === "undefined") {
    return structuredClone(DEFAULT_STORE_DATA);
  }
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return structuredClone(DEFAULT_STORE_DATA);
    const parsed = JSON.parse(raw) as StoreData;
    if (!parsed || !Array.isArray(parsed.products)) {
      return structuredClone(DEFAULT_STORE_DATA);
    }
    return parsed;
  } catch {
    return structuredClone(DEFAULT_STORE_DATA);
  }
}

export function saveClientStore(data: StoreData): StoreData {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(data));
    } catch {
      // ignore storage quota errors
    }
  }
  return data;
}
