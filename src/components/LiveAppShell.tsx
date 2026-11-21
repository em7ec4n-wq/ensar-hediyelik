"use client";

import React from "react";
import { useLiveStore } from "./StoreProvider";
import { SplashOverlay } from "./SplashOverlay";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";

export function LiveAppShell({ children }: { children: React.ReactNode }) {
  const { store } = useLiveStore();

  return (
    <div className="flex min-h-screen flex-col pb-[66px] lg:pb-0">
      <SplashOverlay
        logoSrc={store.settings.logoLightBg}
        brandName={store.settings.brandName}
      />
      <Header settings={store.settings} categories={store.categories} />
      <main className="flex-1">{children}</main>
      <Footer settings={store.settings} />
      <MobileBottomNav />
    </div>
  );
}
