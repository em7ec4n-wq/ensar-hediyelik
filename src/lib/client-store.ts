"use client";

import type { StoreData } from "@/types/store";
import { DEFAULT_STORE_DATA } from "./default-store";

const LS_FALLBACK_KEY = "ensar_hediyelik_store_v8";
const IDB_NAME = "ensar_hediyelik_idb_v4";
const IDB_VERSION = 1;
const STORE_KV = "store_kv";
const MAIN_RECORD_KEY = "active_store_v8";

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

export function deduplicateProducts(
  products: StoreData["products"]
): StoreData["products"] {
  const seenIds = new Set<string>();
  const seenCustomKeys = new Set<string>();
  const unique: StoreData["products"] = [];

  for (const p of products) {
    if (!p || !p.id) continue;
    if (seenIds.has(p.id)) continue;
    seenIds.add(p.id);

    // If it's a custom-added product, check for exact duplicates (same name and category)
    if (p.id.startsWith("custom-")) {
      const key = `${p.name?.trim().toLocaleLowerCase("tr-TR")}:::${p.categorySlug || ""}`;
      if (seenCustomKeys.has(key)) {
        continue;
      }
      seenCustomKeys.add(key);
    }

    unique.push(p);
  }

  return unique;
}

export function cleanYilbasiProducts(
  products: StoreData["products"]
): StoreData["products"] {
  if (!Array.isArray(products)) return [];
  for (const p of products) {
    if (!p) continue;
    const isYilbasi =
      (p.id && p.id.startsWith("yilbasi-")) ||
      (p.name && (p.name.includes("Yılbaşı") || p.name.includes("Noel") || p.name.includes("Kardan Adam")));
    if (isYilbasi) {
      p.categorySlug = "yilbasi";
      p.extraCategorySlugs = [];
    }
  }
  return products;
}

function sanitizeStoreImages(store: StoreData): StoreData {
  const next = structuredClone(store);
  next.products = cleanYilbasiProducts(deduplicateProducts(next.products));

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

function openDb(dbName = IDB_NAME): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !("indexedDB" in window)) {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = window.indexedDB.open(dbName, IDB_VERSION);
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
 * Uploads an image file via our Server API (`/api/upload`) in 100% original
 * quality and returns its permanent public URL so all visitors see it.
 */
export async function uploadLosslessImage(file: File): Promise<string> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/upload/", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.url) return data.url as string;
    }
  } catch {
    // fallback to lossless data URL
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Dosya okunamadı"));
    reader.readAsDataURL(file);
  });
}

/**
 * Rescues any custom categories or custom products that the shopkeeper previously
 * created locally on his phone or computer into the shared server store!
 */
async function rescueLocalChangesIntoServerStore(
  serverStore: StoreData
): Promise<{ merged: StoreData; didRescue: boolean }> {
  if (typeof window === "undefined") {
    return { merged: serverStore, didRescue: false };
  }

  const serverCatSlugs = new Set(serverStore.categories.map((c) => c.slug));
  const serverProdIds = new Set(serverStore.products.map((p) => p.id));
  const serverProdSkus = new Set(
    serverStore.products.map((p) => p.sku.toUpperCase())
  );
  const serverProdNames = new Set(
    serverStore.products.map(
      (p) => `${p.name.trim().toLocaleLowerCase("tr-TR")}:::${p.categorySlug}`
    )
  );

  const rescuedCategories = new Map<
    string,
    StoreData["categories"][number]
  >();
  const rescuedProducts = new Map<string, StoreData["products"][number]>();

  const inspectCandidate = (candidate: StoreData | undefined | null) => {
    if (!candidate) return;
    if (Array.isArray(candidate.categories)) {
      for (const c of candidate.categories) {
        if (c?.slug && !serverCatSlugs.has(c.slug)) {
          rescuedCategories.set(c.slug, c);
        }
      }
    }
    if (Array.isArray(candidate.products)) {
      for (const p of candidate.products) {
        if (!p?.id) continue;
        const nameKey = `${p.name?.trim()?.toLocaleLowerCase("tr-TR") || ""}:::${p.categorySlug || ""}`;
        const isDuplicate =
          serverProdIds.has(p.id) ||
          (Boolean(p.sku) && serverProdSkus.has(p.sku.toUpperCase())) ||
          (p.id.startsWith("custom-") && serverProdNames.has(nameKey));

        if (!isDuplicate) {
          rescuedProducts.set(p.id, p);
        }
      }
    }
  };

  // Inspect current and past local storage keys
  for (const lsKey of [
    LS_FALLBACK_KEY,
    "ensar_hediyelik_store_v7",
    "ensar_hediyelik_store_v6",
    "ensar_hediyelik_store_v5",
    "ensar_hediyelik_store_v4",
    "ensar_hediyelik_store_v3",
  ]) {
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw) inspectCandidate(JSON.parse(raw) as StoreData);
    } catch {
      // ignore
    }
  }

  // Inspect active and past IndexedDB stores
  for (const [dbName, recKey] of [
    [IDB_NAME, MAIN_RECORD_KEY],
    ["ensar_hediyelik_idb_v3", "active_store_v6"],
    ["ensar_hediyelik_idb_v2", "active_store_v5"],
    ["ensar_hediyelik_idb_v1", "active_store_v4"],
  ]) {
    try {
      const db = await openDb(dbName);
      const record = await new Promise<StoreData | undefined>((resolve) => {
        try {
          const tx = db.transaction(STORE_KV, "readonly");
          const req = tx.objectStore(STORE_KV).get(recKey);
          req.onsuccess = () => resolve(req.result as StoreData | undefined);
          req.onerror = () => resolve(undefined);
        } catch {
          resolve(undefined);
        }
      });
      inspectCandidate(record);
    } catch {
      // ignore
    }
  }

  if (rescuedCategories.size === 0 && rescuedProducts.size === 0) {
    return { merged: serverStore, didRescue: false };
  }

  const merged = structuredClone(serverStore);
  for (const cat of rescuedCategories.values()) {
    merged.categories.push(cat);
  }
  for (const prod of rescuedProducts.values()) {
    merged.products.unshift(prod);
  }

  return { merged: sanitizeStoreImages(merged), didRescue: true };
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

  // 1. Fetch live shared catalog from Server API (/api/store) so all phones/computers see the exact same data
  try {
    const res = await fetch(`/api/store/?t=${Date.now()}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const serverData = sanitizeStoreImages((await res.json()) as StoreData);

      // Rescue any locally created products or categories before overwriting
      const { merged, didRescue } = await rescueLocalChangesIntoServerStore(serverData);

      try {
        localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(merged));
      } catch {
        // ignore
      }
      try {
        const db = await openDb();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_KV, "readwrite");
          tx.objectStore(STORE_KV).put(merged, MAIN_RECORD_KEY);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch {
        // ignore
      }

      if (didRescue) {
        // Sync rescued data back up to the server immediately!
        void executeServerSync(merged);
      }

      return merged;
    }
  } catch {
    // fallback if offline
  }

  return loadClientStore();
}

let serverSyncTimer: ReturnType<typeof setTimeout> | null = null;
let pendingServerPayload: StoreData | null = null;

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    void flushServerSync();
  });
  window.addEventListener("pagehide", () => {
    void flushServerSync();
  });
}

async function executeServerSync(payload: StoreData): Promise<void> {
  try {
    await fetch("/api/store/", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    console.warn("Could not sync store to cloud server:", e);
  }
}

export async function flushServerSync(): Promise<void> {
  if (serverSyncTimer) {
    clearTimeout(serverSyncTimer);
    serverSyncTimer = null;
  }
  if (pendingServerPayload) {
    const data = pendingServerPayload;
    pendingServerPayload = null;
    await executeServerSync(data);
  }
}

export async function saveClientStoreAsync(
  data: StoreData,
  immediateCloudSync = false
): Promise<StoreData> {
  data.updatedAt = Date.now();
  const cleanData = sanitizeStoreImages(data);

  if (typeof window !== "undefined") {
    // 1. Save to local cache for instant feedback (0ms)
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_KV, "readwrite");
        tx.objectStore(STORE_KV).put(cleanData, MAIN_RECORD_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // ignore
    }
    try {
      localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(cleanData));
    } catch {
      // ignore
    }

    // 2. Persist to global Server API (/api/store) with debouncing to prevent concurrent race conditions
    pendingServerPayload = cleanData;
    if (serverSyncTimer) {
      clearTimeout(serverSyncTimer);
      serverSyncTimer = null;
    }

    if (immediateCloudSync) {
      await flushServerSync();
    } else {
      serverSyncTimer = setTimeout(() => {
        void flushServerSync();
      }, 500);
    }

    window.dispatchEvent(
      new CustomEvent("ensar-store-updated", {
        detail: { origin: "local-save" },
      })
    );
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
    try {
      await fetch("/api/store/", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fresh),
      });
    } catch {
      // ignore
    }
    window.dispatchEvent(new CustomEvent("ensar-store-updated"));
  }
  return fresh;
}
