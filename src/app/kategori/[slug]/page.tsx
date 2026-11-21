import React from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { readStore } from "@/lib/store-server";
import { CategoryCatalogClient } from "@/components/CategoryCatalogClient";

export function generateStaticParams() {
  const store = readStore();
  return store.categories.map((c) => ({ slug: c.slug }));
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const store = readStore();
  const cat = store.categories.find((c) => c.slug === slug);
  if (!cat) {
    return { title: "Kategori Bulunamadı" };
  }
  return {
    title: cat.name,
    description: cat.description,
    alternates: { canonical: `/kategori/${cat.slug}` },
  };
}

export default async function CategoryDetailPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const store = readStore();
  const category = store.categories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const parentCategory = category.parentSlug
    ? store.categories.find((c) => c.slug === category.parentSlug)
    : undefined;

  const subcategories = store.categories.filter(
    (c) => c.parentSlug === category.slug
  );
  const subSlugs = new Set(subcategories.map((s) => s.slug));

  const allCategoryProducts = store.products.filter(
    (p) =>
      p.categorySlug === category.slug ||
      p.extraCategorySlugs?.includes(category.slug) ||
      subSlugs.has(p.categorySlug)
  );

  return (
    <CategoryCatalogClient
      category={category}
      parentCategory={parentCategory}
      subcategories={subcategories}
      allCategoryProducts={allCategoryProducts}
    />
  );
}
