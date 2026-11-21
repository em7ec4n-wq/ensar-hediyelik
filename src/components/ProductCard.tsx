import React from "react";
import Link from "next/link";
import type { Product } from "@/types/store";
import { formatPriceTRY } from "@/lib/format";
import { DEFAULT_STORE_DATA } from "@/lib/default-store";

const STATIC_PRODUCT_SLUGS = new Set(
  DEFAULT_STORE_DATA.products.map((p) => p.slug)
);

interface ProductCardProps {
  product: Product;
  previewMode?: boolean;
}

export function getProductHref(slug: string): string {
  if (STATIC_PRODUCT_SLUGS.has(slug)) {
    return `/urun/${slug}/`;
  }
  return `/urun/detay/?slug=${encodeURIComponent(slug)}`;
}

export function ProductCard({ product }: ProductCardProps) {
  const galleryCount = product.gallery?.length || 1;
  const href = getProductHref(product.slug);

  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-[16px] border border-[#E5DCD0] bg-white shadow-[0_6px_20px_rgba(36,23,34,0.06)] transition-transform duration-300 hover:-translate-y-0.5 hover:border-[#321B2D]/35"
    >
      {/* Pure white square container with object-contain so tall figures/trees/globes never have their heads or bases cropped */}
      <div className="relative aspect-square w-full overflow-hidden border-b border-[#F2ECE4] bg-white p-3">
        <img
          src={product.image}
          alt={product.imageAlt}
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
        />
        {galleryCount > 1 && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-[#321B2D]/85 px-2.5 py-0.5 text-[11px] font-medium text-[#FFFDF8]">
            {galleryCount} görsel
          </span>
        )}
        {product.isConceptImage && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/50 px-2 py-0.5 text-[10px] italic text-[#F7F3EB]">
            Konsept görsel
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between bg-white p-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-[#6F606C]">
            {product.sku}
          </p>
          <h3 className="mt-1 text-[15px] font-medium leading-snug text-[#241722] sm:text-[16px]">
            {product.name}
          </h3>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[#F2ECE4] pt-3">
          <span className="text-[17px] font-bold text-[#321B2D]">
            {formatPriceTRY(product.price)}
          </span>
          <span className="rounded-full bg-[#F7F3EB] px-3 py-1 text-xs font-semibold text-[#321B2D] transition-colors group-hover:bg-[#321B2D] group-hover:text-white">
            İncele →
          </span>
        </div>
      </div>
    </Link>
  );
}
