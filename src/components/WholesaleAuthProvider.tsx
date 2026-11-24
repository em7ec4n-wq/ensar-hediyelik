"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { WholesaleMember } from "@/types/store";
import { useLiveStore } from "./StoreProvider";
import { WholesaleAuthModal } from "./WholesaleAuthModal";

interface WholesaleAuthContextValue {
  member: WholesaleMember | null;
  isPriceVisible: boolean;
  hidePricesForGuests: boolean;
  isAuthModalOpen: boolean;
  authModalMode: "login" | "register";
  openAuthModal: (mode?: "login" | "register") => void;
  closeAuthModal: () => void;
  setAuthModalMode: (mode: "login" | "register") => void;
  login: (
    phone: string,
    password?: string
  ) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    companyName: string;
    contactName: string;
    phone: string;
    city?: string;
    email?: string;
    password?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const WholesaleAuthContext = createContext<WholesaleAuthContextValue | null>(null);

const STORAGE_KEY = "ensar_wholesale_session_v1";

function cleanDigits(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function WholesaleAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { store, updateStore } = useLiveStore();
  const [member, setMember] = useState<WholesaleMember | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">(
    "login"
  );

  // Initialize session from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as WholesaleMember;
        if (parsed && parsed.phone) {
          setMember(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const hidePricesForGuests = store.settings.hidePricesForGuests !== false;

  const isPriceVisible = useMemo(() => {
    if (!hidePricesForGuests) return true;
    return Boolean(member);
  }, [hidePricesForGuests, member]);

  const openAuthModal = useCallback((mode: "login" | "register" = "login") => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const logout = useCallback(() => {
    setMember(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  const register = useCallback(
    async (data: {
      companyName: string;
      contactName: string;
      phone: string;
      city?: string;
      email?: string;
      password?: string;
    }): Promise<{ success: boolean; error?: string }> => {
      const trimmedCompany = data.companyName.trim();
      const trimmedName = data.contactName.trim();
      const digits = cleanDigits(data.phone);

      if (!trimmedCompany) {
        return { success: false, error: "Lütfen firma veya mağaza adınızı girin." };
      }
      if (!trimmedName) {
        return { success: false, error: "Lütfen yetkili ad ve soyadınızı girin." };
      }
      if (digits.length < 10) {
        return {
          success: false,
          error: "Lütfen geçerli bir telefon numarası girin (Örn: 05XXXXXXXXX).",
        };
      }

      const existingMembers = store.members || [];
      const duplicate = existingMembers.find(
        (m) => cleanDigits(m.phone) === digits
      );

      const newMember: WholesaleMember = {
        id: duplicate?.id || `bayi-${Date.now()}`,
        companyName: trimmedCompany,
        contactName: trimmedName,
        phone: data.phone.trim(),
        email: data.email?.trim() || "",
        city: data.city?.trim() || "",
        password: data.password || "",
        createdAt: new Date().toLocaleDateString("tr-TR"),
      };

      const next = structuredClone(store);
      next.members = next.members || [];
      if (duplicate) {
        // Update existing member record
        const idx = next.members.findIndex((m) => m.id === duplicate.id);
        if (idx >= 0) next.members[idx] = newMember;
      } else {
        next.members.unshift(newMember);
      }

      await updateStore(next, true);

      setMember(newMember);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newMember));
      } catch {
        // ignore
      }

      setIsAuthModalOpen(false);
      return { success: true };
    },
    [store, updateStore]
  );

  const login = useCallback(
    async (
      phone: string,
      password?: string
    ): Promise<{ success: boolean; error?: string }> => {
      const digits = cleanDigits(phone);
      if (digits.length < 10) {
        return {
          success: false,
          error: "Lütfen geçerli bir telefon numarası girin.",
        };
      }

      const existingMembers = store.members || [];
      const found = existingMembers.find(
        (m) => cleanDigits(m.phone) === digits
      );

      if (found) {
        if (found.password && password && found.password !== password) {
          return { success: false, error: "Girdiğiniz şifre hatalı." };
        }
        setMember(found);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(found));
        } catch {
          // ignore
        }
        setIsAuthModalOpen(false);
        return { success: true };
      }

      // If user is logging in with a valid phone for the first time without prior registration,
      // create a quick wholesale member profile for them to avoid blocking sales!
      const quickMember: WholesaleMember = {
        id: `bayi-${Date.now()}`,
        companyName: "Toptan Bayi",
        contactName: "Bayi Yetkilisi",
        phone: phone.trim(),
        city: "",
        password: password || "",
        createdAt: new Date().toLocaleDateString("tr-TR"),
      };

      const next = structuredClone(store);
      next.members = next.members || [];
      next.members.unshift(quickMember);
      await updateStore(next, true);

      setMember(quickMember);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(quickMember));
      } catch {
        // ignore
      }
      setIsAuthModalOpen(false);
      return { success: true };
    },
    [store, updateStore]
  );

  return (
    <WholesaleAuthContext.Provider
      value={{
        member,
        isPriceVisible,
        hidePricesForGuests,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        setAuthModalMode,
        login,
        register,
        logout,
      }}
    >
      {children}
      <WholesaleAuthModal />
    </WholesaleAuthContext.Provider>
  );
}

export function useWholesaleAuth() {
  const ctx = useContext(WholesaleAuthContext);
  if (!ctx) {
    throw new Error(
      "useWholesaleAuth must be used within WholesaleAuthProvider"
    );
  }
  return ctx;
}
