import React from "react";
import type { Metadata } from "next";
import { CategoriesClient } from "@/components/CategoriesClient";

export const metadata: Metadata = {
  title: "Kategoriler",
  description:
    "Cam küreler, müzik kutuları, kum saatleri, ilginç kupalar, ışıklı hediyeler ve yılbaşı koleksiyonu. Ensar Hediyelik tüm ürün kategorileri.",
  alternates: { canonical: "/kategoriler" },
};

export default function CategoriesPage() {
  return <CategoriesClient />;
}
