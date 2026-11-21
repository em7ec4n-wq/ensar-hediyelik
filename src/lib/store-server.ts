import fs from "fs";
import path from "path";
import type { StoreData } from "@/types/store";
import { DEFAULT_STORE_DATA } from "./default-store";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

function ensureStoreFile(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(STORE_PATH)) {
    fs.writeFileSync(STORE_PATH, JSON.stringify(DEFAULT_STORE_DATA, null, 2), "utf-8");
  }
}

export function readStore(): StoreData {
  try {
    ensureStoreFile();
    const raw = fs.readFileSync(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as StoreData;
    if (!parsed || !Array.isArray(parsed.products)) {
      return structuredClone(DEFAULT_STORE_DATA);
    }
    return parsed;
  } catch {
    return structuredClone(DEFAULT_STORE_DATA);
  }
}

export function writeStore(data: StoreData): StoreData {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
  return data;
}
