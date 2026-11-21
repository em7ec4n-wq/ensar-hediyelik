"use client";

import React, { useEffect, useState } from "react";

interface SplashOverlayProps {
  logoSrc: string;
  brandName: string;
}

const SPLASH_KEY = "ensar_splash_seen_v1";

export function SplashOverlay({ logoSrc, brandName }: SplashOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    try {
      if (sessionStorage.getItem(SPLASH_KEY) === "1") return;
      sessionStorage.setItem(SPLASH_KEY, "1");
    } catch {
      return;
    }

    const img = new Image();
    img.src = logoSrc;
    let timer: ReturnType<typeof setTimeout> | undefined;

    img.onload = () => {
      setVisible(true);
      timer = setTimeout(() => {
        setVisible(false);
      }, 680);
    };
    img.onerror = () => {
      setVisible(false);
    };

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [logoSrc]);

  if (!visible) return null;

  return (
    <div
      className="ensar-splash fixed inset-0 z-50 flex items-center justify-center bg-[#F7F3EB]"
      aria-hidden="true"
    >
      <img
        src={logoSrc}
        alt={brandName}
        className="h-10 w-auto max-w-[240px] object-contain"
      />
    </div>
  );
}
