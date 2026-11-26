"use client";

import React from "react";
import type { Category } from "@/types/store";

interface ExtraCategoriesPickerProps {
  categories: Category[];
  primarySlug: string;
  selectedSlugs: string[];
  onChange: (next: string[]) => void;
}

/**
 * Allows admins to assign a product to multiple extra categories in addition to its primary category.
 */
export function ExtraCategoriesPicker({
  categories,
  primarySlug,
  selectedSlugs,
  onChange,
}: ExtraCategoriesPickerProps) {
  const options = categories.filter((c) => c.slug !== primarySlug);
  const activeCount = selectedSlugs.filter((s) => s !== primarySlug).length;

  const toggleSlug = (slug: string) => {
    if (selectedSlugs.includes(slug)) {
      onChange(selectedSlugs.filter((s) => s !== slug));
    } else {
      onChange([...selectedSlugs, slug]);
    }
  };

  return (
    <div className="pt-3 border-t border-[#EFE7DC]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="block text-[11px] font-bold text-[#241722]">
          Ek Kategoriler (Birden Fazla Kategoriye Ekle)
        </label>
        {activeCount > 0 && (
          <span className="rounded-full bg-[#321B2D]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#321B2D]">
            +{activeCount} ek kategori seçili
          </span>
        )}
      </div>
      <p className="mt-0.5 text-[10px] text-[#6F606C]">
        Ürünün aynı anda başka kategorilerde de görünmesi için istediğiniz kategorilere dokunun:
      </p>
      <div className="mt-2 flex max-h-40 flex-wrap gap-1.5 overflow-y-auto pr-1">
        {options.map((cat) => {
          const isSelected = selectedSlugs.includes(cat.slug);
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => toggleSlug(cat.slug)}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all ${
                isSelected
                  ? "bg-[#321B2D] text-[#F7F3EB] shadow-xs"
                  : "border border-[#DDD3C6] bg-[#FFFDF8] text-[#4C3C49] hover:border-[#321B2D]/50"
              }`}
            >
              <span>{isSelected ? "✓" : "+"}</span>
              <span>{cat.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
