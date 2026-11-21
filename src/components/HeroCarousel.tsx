"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { HeroSlide } from "@/types/store";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
} from "./Icons";

interface HeroCarouselProps {
  slides: HeroSlide[];
}

export function HeroCarousel({ slides }: HeroCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [userPaused, setUserPaused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const count = slides.length;

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % count);
  }, [count]);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + count) % count);
  }, [count]);

  const isPaused = userPaused || interactionPaused || reducedMotion;

  useEffect(() => {
    if (isPaused || count <= 1) return;
    const timer = setInterval(goNext, 7000);
    return () => clearInterval(timer);
  }, [isPaused, count, goNext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goNext();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goPrev();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    setInteractionPaused(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 40) {
      if (delta < 0) goNext();
      else goPrev();
    }
    touchStartX.current = null;
    setInteractionPaused(false);
  };

  if (count === 0) return null;

  const current = slides[activeIndex];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Öne çıkan koleksiyonlar"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setInteractionPaused(true)}
      onMouseLeave={() => setInteractionPaused(false)}
      onFocus={() => setInteractionPaused(true)}
      onBlur={() => setInteractionPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full bg-[#321B2D] text-[#F7F3EB] focus:outline-none"
    >
      {/* DESKTOP LAYOUT (600-640px height, left ~45% slanted plum, right ~55% photo) */}
      <div className="relative mx-auto hidden h-[620px] max-w-[1440px] overflow-hidden lg:block">
        {/* Right Photo Area (~58% width so product dome & wooden base sit cleanly in frame) */}
        <div className="absolute inset-y-0 right-0 w-[58%] bg-[#241320]">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              aria-hidden={idx !== activeIndex}
              className={`absolute inset-0 transition-opacity duration-[400ms] ease-out ${
                idx === activeIndex
                  ? "z-10 opacity-100"
                  : "pointer-events-none z-0 opacity-0"
              }`}
            >
              <img
                src={slide.image}
                alt={slide.imageAlt}
                fetchPriority={idx === 0 ? "high" : "auto"}
                loading={idx === 0 ? "eager" : "lazy"}
                style={{
                  objectPosition: slide.desktopObjectPosition || "50% 50%",
                }}
                className="h-full w-full object-cover"
              />
              {slide.isConceptImage && (
                <span className="absolute bottom-3.5 right-5 rounded-full bg-black/45 px-2.5 py-0.5 text-[11px] italic tracking-wide text-[#F7F3EB]/85 backdrop-blur-xs">
                  Konsept görsel
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Left Slanted Plum Panel (~48% width with diagonal CSS clip) */}
        <div className="hero-plum-clip relative z-20 flex h-full w-[49%] flex-col justify-center bg-[#321B2D] pl-14 pr-20 xl:pl-20">
          <div
            key={current.id}
            className="max-w-[440px] transition-opacity duration-[400ms]"
          >
            <h1 className="font-heading text-[60px] font-medium leading-[1.06] tracking-[-0.01em] text-[#F7F3EB] xl:text-[68px]">
              {current.titleLines.map((line, i) => (
                <span key={i} className="block">
                  {line}
                </span>
              ))}
            </h1>

            <div className="mt-8">
              <Link
                href={current.buttonHref}
                className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#F7F3EB] px-7 py-3 text-[16px] font-semibold text-[#241722] shadow-sm transition-colors hover:bg-[#FFFDF8]"
              >
                <span>{current.buttonLabel}</span>
                <ChevronRightIcon size={17} />
              </Link>
            </div>
          </div>
        </div>

        {/* Desktop Prev / Next Arrows */}
        <button
          type="button"
          onClick={goPrev}
          aria-label="Önceki slayt"
          className="absolute left-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-[#F7F3EB]/12 text-[#F7F3EB] backdrop-blur-xs transition-colors hover:bg-[#F7F3EB]/25"
        >
          <ChevronLeftIcon size={20} />
        </button>
        <button
          type="button"
          onClick={goNext}
          aria-label="Sonraki slayt"
          className="absolute right-4 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-[#F7F3EB] backdrop-blur-xs transition-colors hover:bg-black/50"
        >
          <ChevronRightIcon size={20} />
        </button>

        {/* Bottom Center Dots + Pause Toggle */}
        <div className="absolute bottom-5 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/25 px-3.5 py-1.5 backdrop-blur-xs">
          <div className="flex items-center gap-2" role="tablist" aria-label="Slayt seçimi">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                role="tab"
                aria-selected={idx === activeIndex}
                aria-label={`Slayt ${idx + 1}: ${slide.titleLines.join(" ")}`}
                onClick={() => setActiveIndex(idx)}
                className={`h-2.5 rounded-full transition-all duration-300 ${
                  idx === activeIndex
                    ? "w-6 bg-[#F7F3EB]"
                    : "w-2.5 bg-[#F7F3EB]/45 hover:bg-[#F7F3EB]/75"
                }`}
              />
            ))}
          </div>
          <span className="h-3.5 w-px bg-[#F7F3EB]/30" aria-hidden="true" />
          <button
            type="button"
            onClick={() => setUserPaused((p) => !p)}
            aria-label={
              userPaused ? "Otomatik geçişi başlat" : "Otomatik geçişi duraklat"
            }
            className="flex h-6 w-6 items-center justify-center rounded-full text-[#F7F3EB]/90 hover:bg-[#F7F3EB]/15"
          >
            {userPaused || reducedMotion ? (
              <PlayIcon size={13} />
            ) : (
              <PauseIcon size={13} />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE LAYOUT (Photo top 320-340px, Plum text area right below, fits 390x844 first screen) */}
      <div className="lg:hidden">
        <div className="relative h-[325px] w-full overflow-hidden bg-[#241320]">
          {slides.map((slide, idx) => (
            <div
              key={slide.id}
              aria-hidden={idx !== activeIndex}
              className={`absolute inset-0 transition-opacity duration-[400ms] ease-out ${
                idx === activeIndex
                  ? "z-10 opacity-100"
                  : "pointer-events-none z-0 opacity-0"
              }`}
            >
              <img
                src={slide.image}
                alt={slide.imageAlt}
                fetchPriority={idx === 0 ? "high" : "auto"}
                loading={idx === 0 ? "eager" : "lazy"}
                style={{
                  objectPosition: slide.mobileObjectPosition || "50% 50%",
                }}
                className="h-full w-full object-cover"
              />
              {slide.isConceptImage && (
                <span className="absolute bottom-2.5 right-3 rounded-full bg-black/45 px-2 py-0.5 text-[10px] italic text-[#F7F3EB]/85">
                  Konsept görsel
                </span>
              )}
            </div>
          ))}

          {/* Mobile Prev / Next Arrows */}
          <button
            type="button"
            onClick={goPrev}
            aria-label="Önceki slayt"
            className="absolute left-2.5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-[#F7F3EB]"
          >
            <ChevronLeftIcon size={18} />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Sonraki slayt"
            className="absolute right-2.5 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-[#F7F3EB]"
          >
            <ChevronRightIcon size={18} />
          </button>

          {/* Mobile Dots + Pause */}
          <div className="absolute bottom-2.5 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2.5 rounded-full bg-black/35 px-3 py-1">
            {slides.map((slide, idx) => (
              <button
                key={slide.id}
                type="button"
                aria-label={`Slayt ${idx + 1}`}
                onClick={() => setActiveIndex(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === activeIndex
                    ? "w-5 bg-[#F7F3EB]"
                    : "w-2 bg-[#F7F3EB]/50"
                }`}
              />
            ))}
            <button
              type="button"
              onClick={() => setUserPaused((p) => !p)}
              aria-label={userPaused ? "Otomatik geçişi başlat" : "Duraklat"}
              className="ml-0.5 flex h-5 w-5 items-center justify-center text-[#F7F3EB]"
            >
              {userPaused || reducedMotion ? (
                <PlayIcon size={12} />
              ) : (
                <PauseIcon size={12} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Plum Text Block */}
        <div className="bg-[#321B2D] px-5 pb-6 pt-5">
          <h1 className="font-heading text-[38px] font-medium leading-[1.08] text-[#F7F3EB]">
            {current.titleLines.length === 3 ? (
              <>
                <span className="block">{current.titleLines[0]}</span>
                <span className="block">
                  {current.titleLines[1]} {current.titleLines[2]}
                </span>
              </>
            ) : (
              current.titleLines.join(" ")
            )}
          </h1>

          <div className="mt-4">
            <Link
              href={current.buttonHref}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[#F7F3EB] px-6 py-2.5 text-[15px] font-semibold text-[#241722]"
            >
              <span>{current.buttonLabel}</span>
              <ChevronRightIcon size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
