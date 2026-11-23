import fs from "fs";
import path from "path";
import type { StoreData } from "@/types/store";
import { DEFAULT_STORE_DATA } from "./default-store";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const CLOUD_PATH = path.join(process.cwd(), "public", "cloud-store.json");

function ensureStoreFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH) && fs.existsSync(CLOUD_PATH)) {
    try {
      fs.copyFileSync(CLOUD_PATH, STORE_PATH);
    } catch {
      // ignore
    }
  }
}

export function readStore(): StoreData {
  try {
    ensureStoreFile();

    // Prefer whichever file has more products or is available
    let cloudData: StoreData | null = null;
    let localData: StoreData | null = null;

    if (fs.existsSync(CLOUD_PATH)) {
      try {
        const rawCloud = fs.readFileSync(CLOUD_PATH, "utf-8");
        cloudData = JSON.parse(rawCloud) as StoreData;
      } catch {
        // ignore
      }
    }

    if (fs.existsSync(STORE_PATH)) {
      try {
        const rawLocal = fs.readFileSync(STORE_PATH, "utf-8");
        localData = JSON.parse(rawLocal) as StoreData;
      } catch {
        // ignore
      }
    }

    if (cloudData && Array.isArray(cloudData.products) && cloudData.products.length > 0) {
      if (!localData || !Array.isArray(localData.products) || cloudData.products.length >= localData.products.length) {
        return cloudData;
      }
    }

    if (localData && Array.isArray(localData.products) && localData.products.length > 0) {
      return localData;
    }

    return structuredClone(DEFAULT_STORE_DATA);
  } catch {
    return structuredClone(DEFAULT_STORE_DATA);
  }
}

export function writeStore(data: StoreData): StoreData {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const json = JSON.stringify(data, null, 2);
    try {
      fs.writeFileSync(STORE_PATH, json, "utf-8");
    } catch {
      // ignore in read-only environment
    }
    try {
      const publicDir = path.join(process.cwd(), "public");
      if (fs.existsSync(publicDir)) {
        fs.writeFileSync(CLOUD_PATH, json, "utf-8");
      }
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }
  return data;
}
