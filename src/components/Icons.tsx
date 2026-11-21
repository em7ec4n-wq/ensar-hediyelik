import React from "react";

interface IconProps {
  className?: string;
  size?: number;
}

const baseProps = (size = 20, className = "") => ({
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  width: size,
  height: size,
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  className,
  "aria-hidden": true as const,
});

export function SearchIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <circle cx="11" cy="11" r="6" />
      <path d="m16 16 4 4" />
    </svg>
  );
}

export function BagIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M5 8h14l2 13H3L5 8Z" />
      <path d="M8 10V6a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

export function MenuIcon({ className, size = 22 }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  );
}

export function CloseIcon({ className, size = 22 }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

export function ChevronLeftIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="m15 5-7 7 7 7" />
    </svg>
  );
}

export function ChevronRightIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

export function ChevronDownIcon({ className, size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function GiftIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M5 12v9h14v-9M12 8v13M12 8H8a3 3 0 1 1 3-3l1 3Zm0 0h4a3 3 0 1 0-3-3l-1 3Z" />
    </svg>
  );
}

export function LightIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M9 18h6m-5 3h4M8 14a6 6 0 1 1 8 0l-1 2H9l-1-2Z" />
    </svg>
  );
}

export function PhoneIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="m7 3 3 5-2 2a12 12 0 0 0 6 6l2-2 5 3v2a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2h2Z" />
    </svg>
  );
}

export function WhatsAppIcon({ className, size = 18 }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M21 11.5A9 9 0 0 1 7 19l-4 2 1.4-4.5A9 9 0 1 1 21 11.5Z" />
      <path d="m9 7 1.5 2.5-1 1a7 7 0 0 0 4 4l1-1L17 15l-.5 1.5c-4 1.5-10.5-5-9-9L9 7Z" />
    </svg>
  );
}

export function PauseIcon({ className, size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M9 5v14M15 5v14" />
    </svg>
  );
}

export function PlayIcon({ className, size = 16 }: IconProps) {
  return (
    <svg {...baseProps(size, className)}>
      <path d="M8 5v14l11-7-11-7Z" />
    </svg>
  );
}
