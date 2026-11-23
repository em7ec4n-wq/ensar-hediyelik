"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { StoreData } from "@/types/store";
import { DEFAULT_STORE_DATA } from "@/lib/default-store";
import {
  loadClientStoreAsync,
  saveClientStoreAsync,
  resetClientStoreToDefault,
} from "@/lib/client-store";

interface StoreContextValue {
  store: StoreData;
  ready: boolean;
  updateStore: (next: StoreData) => Promise<StoreData>;
  resetStore: () => Promise<StoreData>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({
  initialStore,
  children,
}: {
  initialStore?: StoreData;
  children: React.ReactNode;
}) {
  const [store, setStore] = useState<StoreData>(
    () => initialStore || DEFAULT_STORE_DATA
  );
  const [ready, setReady] = useState(false);

  const refreshFromStorage = useCallback(async () => {
    const loaded = await loadClientStoreAsync();
    setStore(loaded);
    setReady(true);
  }, []);

  useEffect(() => {
    void refreshFromStorage();
    const handleCustomUpdate = (e: Event) => {
      const ce = e as CustomEvent<{ origin?: string }>;
      if (ce?.detail?.origin === "local-save") {
        // Local save already updated in-memory state; avoid re-fetching stale data over active edits!
        return;
      }
      void refreshFromStorage();
    };
    window.addEventListener("ensar-store-updated", handleCustomUpdate);
    return () => {
      window.removeEventListener("ensar-store-updated", handleCustomUpdate);
    };
  }, [refreshFromStorage]);

  const updateStore = useCallback(async (next: StoreData) => {
    setStore(next);
    await saveClientStoreAsync(next);
    return next;
  }, []);

  const resetStore = useCallback(async () => {
    const fresh = await resetClientStoreToDefault();
    setStore(fresh);
    return fresh;
  }, []);

  return (
    <StoreContext.Provider value={{ store, ready, updateStore, resetStore }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useLiveStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) {
    throw new Error("useLiveStore must be used within StoreProvider");
  }
  return ctx;
}
