"use client";

import type { StoreData } from "@/types/store";
import { DEFAULT_STORE_DATA } from "./default-store";

const LS_FALLBACK_KEY = "ensar_hediyelik_store_v5";
const IDB_NAME = "ensar_hediyelik_idb_v2";
const IDB_VERSION = 1;
const STORE_KV = "store_kv";
const MAIN_RECORD_KEY = "active_store_v5";

const DEFAULT_PROD_IMG_MAP = new Map(
  DEFAULT_STORE_DATA.products.map((p) => [p.id, p.image])
);
const DEFAULT_SKU_IMG_MAP = new Map(
  DEFAULT_STORE_DATA.products.map((p) => [p.sku.toUpperCase(), p.image])
);
const DEFAULT_CAT_IMG_MAP = new Map(
  DEFAULT_STORE_DATA.categories.map((c) => [c.slug, c.image])
);
const DEFAULT_SLIDE_IMG_MAP = new Map(
  DEFAULT_STORE_DATA.heroSlides.map((s) => [s.id, s.image])
);

function isBrokenOrVolatileUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return true;
  const trimmed = url.trim();
  if (!trimmed) return true;
  // blob: URLs from previous page loads are always dead after navigation/refresh
  if (trimmed.startsWith("blob:") || trimmed.startsWith("idb-media://")) {
    return true;
  }
  return false;
}

export function sanitizeProductImage(
  url: string | undefined | null,
  productId?: string,
  sku?: string
): string {
  if (!isBrokenOrVolatileUrl(url)) {
    return url!;
  }
  if (productId && DEFAULT_PROD_IMG_MAP.has(productId)) {
    return DEFAULT_PROD_IMG_MAP.get(productId)!;
  }
  if (sku && DEFAULT_SKU_IMG_MAP.has(sku.toUpperCase())) {
    return DEFAULT_SKU_IMG_MAP.get(sku.toUpperCase())!;
  }
  return "/ensar-web/gorseller/hero-astronot-cam-kure.webp";
}

function sanitizeStoreImages(store: StoreData): StoreData {
  const next = structuredClone(store);

  if (isBrokenOrVolatileUrl(next.settings.logoLightBg)) {
    next.settings.logoLightBg = DEFAULT_STORE_DATA.settings.logoLightBg;
  }
  if (isBrokenOrVolatileUrl(next.settings.logoDarkBg)) {
    next.settings.logoDarkBg = DEFAULT_STORE_DATA.settings.logoDarkBg;
  }
  if (isBrokenOrVolatileUrl(next.settings.favicon)) {
    next.settings.favicon = DEFAULT_STORE_DATA.settings.favicon;
  }

  for (const slide of next.heroSlides) {
    if (isBrokenOrVolatileUrl(slide.image)) {
      slide.image =
        DEFAULT_SLIDE_IMG_MAP.get(slide.id) ||
        "/ensar-web/gorseller/hero-astronot-cam-kure.webp";
    }
  }

  for (const cat of next.categories) {
    if (isBrokenOrVolatileUrl(cat.image)) {
      cat.image =
        DEFAULT_CAT_IMG_MAP.get(cat.slug) ||
        "/ensar-web/gorseller/kategori-cam-kure.webp";
    }
  }

  for (const prod of next.products) {
    prod.image = sanitizeProductImage(prod.image, prod.id, prod.sku);
    if (Array.isArray(prod.gallery) && prod.gallery.length > 0) {
      const cleaned = prod.gallery.filter((g) => !isBrokenOrVolatileUrl(g));
      prod.gallery = cleaned.length > 0 ? cleaned : [prod.image];
    } else {
      prod.gallery = [prod.image];
    }
  }

  return next;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = window.indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_KV)) {
        db.createObjectStore(STORE_KV);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IndexedDB open error"));
  });
}

/**
 * Reads an uploaded image File into a persistent, 100% lossless Data URL
 * (exact original file bytes — zero canvas re-encoding or compression)
 * that never expires across page refreshes, cart storage, or PDF generation.
 */
export async function uploadLosslessImage(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });
}

export function loadClientStore(): StoreData {
  if (typeof window === "undefined") {
    return structuredClone(DEFAULT_STORE_DATA);
  }
  try {
    const raw = localStorage.getItem(LS_FALLBACK_KEY);
    if (!raw) return structuredClone(DEFAULT_STORE_DATA);
    const parsed = JSON.parse(raw) as StoreData;
    if (!parsed || !Array.isArray(parsed.products)) {
      return structuredClone(DEFAULT_STORE_DATA);
    }
    return sanitizeStoreImages(parsed);
  } catch {
    return structuredClone(DEFAULT_STORE_DATA);
  }
}

export async function loadClientStoreAsync(): Promise<StoreData> {
  if (typeof window === "undefined") {
    return structuredClone(DEFAULT_STORE_DATA);
  }
  try {
    const db = await openDb();
    const record = await new Promise<StoreData | undefined>(
      (resolve, reject) => {
        const tx = db.transaction(STORE_KV, "readonly");
        const req = tx.objectStore(STORE_KV).get(MAIN_RECORD_KEY);
        req.onsuccess = () => resolve(req.result as StoreData | undefined);
        req.onerror = () => reject(req.error);
      }
    );
    if (record && Array.isArray(record.products)) {
      return sanitizeStoreImages(record);
    }
  } catch {
    // fallback to localStorage
  }
  return loadClientStore();
}

export async function saveClientStoreAsync(
  data: StoreData
): Promise<StoreData> {
  const cleanData = sanitizeStoreImages(data);

  if (typeof window !== "undefined") {
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_KV, "readwrite");
        tx.objectStore(STORE_KV).put(cleanData, MAIN_RECORD_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // ignore IDB error
    }
    try {
      localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(cleanData));
    } catch {
      // ignore quota error when large lossless images are stored in IDB
    }
    window.dispatchEvent(new CustomEvent("ensar-store-updated"));
  }
  return cleanData;
}

export function saveClientStore(data: StoreData): StoreData {
  void saveClientStoreAsync(data);
  return data;
}

export async function resetClientStoreToDefault(): Promise<StoreData> {
  const fresh = structuredClone(DEFAULT_STORE_DATA);
  if (typeof window !== "undefined") {
    try {
      localStorage.removeItem(LS_FALLBACK_KEY);
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_KV, "readwrite");
        tx.objectStore(STORE_KV).clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent("ensar-store-updated"));
  }
  return fresh;
}
