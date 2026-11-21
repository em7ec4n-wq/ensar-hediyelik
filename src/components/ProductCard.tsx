import React from "react";
import Link from "next/link";
import type { Product } from "@/types/store";
import { formatPriceTRY } from "@/lib/format";

interface ProductCardProps {
  product: Product;
  previewMode?: boolean;
}

export function ProductCard({ product }: ProductCardProps) {
  const galleryCount = product.gallery?.length || 1;

  return (
    <Link
      href={`/urun/${product.slug}`}
      className="ensar-card group flex flex-col overflow-hidden transition-transform duration-300 hover:-translate-y-0.5"
    >
      <div className="relative aspect-[4/3.4] w-full overflow-hidden bg-[#FFFDF8]">
        <img
          src={product.image}
          alt={product.imageAlt}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {galleryCount > 1 && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-medium text-[#FFFDF8]">
            {galleryCount} görsel
          </span>
        )}
        {product.isConceptImage && (
          <span className="absolute bottom-2 right-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] italic text-[#F7F3EB]/85">
            Konsept görsel
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between p-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-[#6F606C]">
            {product.sku}
          </p>
          <h3 className="mt-1 text-[15px] font-medium leading-snug text-[#241722] sm:text-[16px]">
            {product.name}
          </h3>
        </div>

        <div className="mt-3 flex items-center justify-between border-t border-[#EFE7DC] pt-3">
          <span className="text-[16px] font-semibold text-[#321B2D]">
            {formatPriceTRY(product.price)}
          </span>
          <span className="text-xs font-semibold text-[#321B2D] group-hover:underline">
            İncele →
          </span>
        </div>
      </div>
    </Link>
  );
}
