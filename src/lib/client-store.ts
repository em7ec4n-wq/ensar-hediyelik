"use client";

import type { StoreData } from "@/types/store";
import { DEFAULT_STORE_DATA } from "./default-store";

const LS_FALLBACK_KEY = "ensar_hediyelik_store_v4";
const IDB_NAME = "ensar_hediyelik_idb_v1";
const IDB_VERSION = 1;
const STORE_KV = "store_kv";
const STORE_MEDIA = "media_blobs";
const MAIN_RECORD_KEY = "active_store_v4";

// In-memory cache mapping idb-media://<id> -> blob:... object URL
const mediaObjectUrlCache = new Map<string, string>();
// Reverse map blob:... -> idb-media://<id> so saving converts back to persistent key
const objectUrlToMediaKey = new Map<string, string>();

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
      if (!db.objectStoreNames.contains(STORE_MEDIA)) {
        db.createObjectStore(STORE_MEDIA);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error("IndexedDB open error"));
  });
}

/**
 * Stores a user-uploaded image File in IndexedDB as a raw, untouched Blob
 * (100% original resolution, bytes, and quality — zero compression or resizing).
 * Returns a ready-to-render URL and registers its persistent key.
 */
export async function uploadLosslessImage(file: File): Promise<string> {
  const mediaKey = `idb-media://${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const rawBlob = new Blob([await file.arrayBuffer()], {
    type: file.type || "image/webp",
  });

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_MEDIA, "readwrite");
      tx.objectStore(STORE_MEDIA).put(rawBlob, mediaKey);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch {
    // Fallback to lossless Data URL if IndexedDB is blocked in private mode
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(new Error("Dosya okunamadı"));
      reader.readAsDataURL(rawBlob);
    });
  }

  const objectUrl = URL.createObjectURL(rawBlob);
  mediaObjectUrlCache.set(mediaKey, objectUrl);
  objectUrlToMediaKey.set(objectUrl, mediaKey);
  return objectUrl;
}

async function resolveMediaKeyToUrl(src: string): Promise<string> {
  if (!src || !src.startsWith("idb-media://")) return src;
  const cached = mediaObjectUrlCache.get(src);
  if (cached) return cached;

  try {
    const db = await openDb();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_MEDIA, "readonly");
      const req = tx.objectStore(STORE_MEDIA).get(src);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    if (blob instanceof Blob) {
      const objUrl = URL.createObjectURL(blob);
      mediaObjectUrlCache.set(src, objUrl);
      objectUrlToMediaKey.set(objUrl, src);
      return objUrl;
    }
  } catch {
    // ignore
  }
  return "/ensar-web/gorseller/hero-astronot-cam-kure.webp";
}

function toPersistentUrl(src: string): string {
  if (!src) return src;
  return objectUrlToMediaKey.get(src) || src;
}

async function hydrateStoreMediaUrls(store: StoreData): Promise<StoreData> {
  const next = structuredClone(store);

  next.settings.logoLightBg = await resolveMediaKeyToUrl(
    next.settings.logoLightBg
  );
  next.settings.logoDarkBg = await resolveMediaKeyToUrl(
    next.settings.logoDarkBg
  );
  next.settings.favicon = await resolveMediaKeyToUrl(next.settings.favicon);

  for (const slide of next.heroSlides) {
    slide.image = await resolveMediaKeyToUrl(slide.image);
  }
  for (const cat of next.categories) {
    cat.image = await resolveMediaKeyToUrl(cat.image);
  }
  for (const prod of next.products) {
    prod.image = await resolveMediaKeyToUrl(prod.image);
    if (Array.isArray(prod.gallery)) {
      prod.gallery = await Promise.all(
        prod.gallery.map((g) => resolveMediaKeyToUrl(g))
      );
    }
  }
  return next;
}

function dehydrateStoreMediaUrls(store: StoreData): StoreData {
  const next = structuredClone(store);
  next.settings.logoLightBg = toPersistentUrl(next.settings.logoLightBg);
  next.settings.logoDarkBg = toPersistentUrl(next.settings.logoDarkBg);
  next.settings.favicon = toPersistentUrl(next.settings.favicon);

  for (const slide of next.heroSlides) {
    slide.image = toPersistentUrl(slide.image);
  }
  for (const cat of next.categories) {
    cat.image = toPersistentUrl(cat.image);
  }
  for (const prod of next.products) {
    prod.image = toPersistentUrl(prod.image);
    if (Array.isArray(prod.gallery)) {
      prod.gallery = prod.gallery.map((g) => toPersistentUrl(g));
    }
  }
  return next;
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
    return parsed;
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
      return await hydrateStoreMediaUrls(record);
    }
  } catch {
    // fallback to localStorage
  }
  return await hydrateStoreMediaUrls(loadClientStore());
}

export async function saveClientStoreAsync(data: StoreData): Promise<StoreData> {
  const persistable = dehydrateStoreMediaUrls(data);

  if (typeof window !== "undefined") {
    try {
      const db = await openDb();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_KV, "readwrite");
        tx.objectStore(STORE_KV).put(persistable, MAIN_RECORD_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch {
      // ignore IDB error
    }
    try {
      localStorage.setItem(LS_FALLBACK_KEY, JSON.stringify(persistable));
    } catch {
      // ignore quota error when large images are in IDB
    }
    window.dispatchEvent(new CustomEvent("ensar-store-updated"));
  }
  return data;
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
        const tx = db.transaction([STORE_KV, STORE_MEDIA], "readwrite");
        tx.objectStore(STORE_KV).clear();
        tx.objectStore(STORE_MEDIA).clear();
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
