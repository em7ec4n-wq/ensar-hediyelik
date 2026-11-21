#!/usr/bin/env node
import fs from "fs";
import path from "path";

const PROJECT_ROOT = process.cwd();
const SOURCE_DIR =
  process.argv[2] || "/Users/emre/Downloads/ensar-yilbasi";
const SOURCE_JSON = path.join(SOURCE_DIR, "urunler.json");
const PUBLIC_MEDIA_ROOT = path.join(PROJECT_ROOT, "public", "ensar-yilbasi");
const DATA_DIR = path.join(PROJECT_ROOT, "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const GENERATED_CATALOG_PATH = path.join(
  PROJECT_ROOT,
  "src",
  "data",
  "yilbasi-catalog.json"
);

function slugifyTR(input) {
  return String(input || "")
    .replace(/Ğ/g, "g")
    .replace(/ğ/g, "g")
    .replace(/Ü/g, "u")
    .replace(/ü/g, "u")
    .replace(/Ş/g, "s")
    .replace(/ş/g, "s")
    .replace(/İ/g, "i")
    .replace(/I/g, "i")
    .replace(/ı/g, "i")
    .replace(/Ö/g, "o")
    .replace(/ö/g, "o")
    .replace(/Ç/g, "c")
    .replace(/ç/g, "c")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normSku(sku) {
  return String(sku || "").trim().toUpperCase();
}

function main() {
  if (!fs.existsSync(SOURCE_JSON)) {
    console.error(`Kaynak dosya bulunamadı: ${SOURCE_JSON}`);
    process.exit(1);
  }

  const rawItems = JSON.parse(fs.readFileSync(SOURCE_JSON, "utf-8"));
  if (!Array.isArray(rawItems)) {
    console.error("urunler.json geçerli bir dizi değil.");
    process.exit(1);
  }

  if (!fs.existsSync(STORE_PATH)) {
    console.error(
      `Mevcut store.json bulunamadı (${STORE_PATH}). Önce bir kez oluşturun.`
    );
    process.exit(1);
  }

  const store = JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
  if (!Array.isArray(store.categories)) store.categories = [];
  if (!Array.isArray(store.products)) store.products = [];

  // 1. Collect subcategories from source JSON
  const subCatMap = new Map();
  for (const item of rawItems) {
    if (!item.kategori_slug || !item.kategori) continue;
    if (!subCatMap.has(item.kategori_slug)) {
      const firstImg =
        Array.isArray(item.gorseller) && item.gorseller.length > 0
          ? `/ensar-yilbasi/${item.gorseller[0]}`
          : "/ensar-web/gorseller/urun-puskurtmeli-kar-kuresi.webp";
      subCatMap.set(item.kategori_slug, {
        slug: item.kategori_slug,
        name: item.kategori,
        firstImg,
      });
    }
  }

  // Ensure main category "Yılbaşı" exists
  const existingMain = store.categories.find((c) => c.slug === "yilbasi");
  const mainCover =
    subCatMap.get("yilbasi-agaclari")?.firstImg ||
    "/ensar-web/gorseller/urun-puskurtmeli-kar-kuresi.webp";

  let categoriesAdded = 0;
  let categoriesMatched = 0;

  if (!existingMain) {
    store.categories.push({
      slug: "yilbasi",
      name: "Yılbaşı",
      description:
        "Yılbaşı ağaçları, kar küreleri, fanuslar, Noel Baba figürleri, ağaç süsleri, ışıklar ve yılbaşı dekorları.",
      image: mainCover,
      imageAlt: "Yılbaşı koleksiyonu",
      showOnHome: false,
      isConceptImage: false,
    });
    categoriesAdded++;
  } else {
    categoriesMatched++;
  }

  // Ensure 10 subcategories exist and link to parentSlug: "yilbasi"
  for (const [slug, info] of subCatMap.entries()) {
    const existing = store.categories.find((c) => c.slug === slug);
    if (!existing) {
      store.categories.push({
        slug,
        name: info.name,
        description: `Yılbaşı koleksiyonu — ${info.name} ürünleri.`,
        image: info.firstImg,
        imageAlt: info.name,
        showOnHome: false,
        parentSlug: "yilbasi",
        isConceptImage: false,
      });
      categoriesAdded++;
    } else {
      if (!existing.parentSlug) {
        existing.parentSlug = "yilbasi";
      }
      categoriesMatched++;
    }
  }

  // 2. Match products by SKU (idempotent)
  const existingSkuMap = new Map();
  for (const p of store.products) {
    existingSkuMap.set(normSku(p.sku), p);
  }
  const existingSlugs = new Set(store.products.map((p) => p.slug));

  let added = 0;
  let matchedExisting = 0;
  const errors = [];
  const verifiedImages = new Set();
  const yilbasiProducts = [];

  for (const item of rawItems) {
    const skuKey = normSku(item.sku);
    if (!skuKey) {
      errors.push({ sku: item.sku, reason: "Boş SKU" });
      continue;
    }

    const gorseller = Array.isArray(item.gorseller) ? item.gorseller : [];
    const mappedGallery = [];
    for (const rel of gorseller) {
      const cleanRel = String(rel).replace(/^\/+/, "");
      const diskPath = path.join(PUBLIC_MEDIA_ROOT, cleanRel);
      if (!fs.existsSync(diskPath)) {
        errors.push({
          sku: item.sku,
          reason: `Eksik görsel dosyası: ${cleanRel}`,
        });
      } else {
        verifiedImages.add(cleanRel);
      }
      mappedGallery.push(`/ensar-yilbasi/${cleanRel}`);
    }

    if (mappedGallery.length === 0) {
      errors.push({ sku: item.sku, reason: "Ürüne ait görsel bulunamadı" });
      continue;
    }

    // If SKU already exists: preserve price, stock, published, approved content
    if (existingSkuMap.has(skuKey)) {
      matchedExisting++;
      yilbasiProducts.push(existingSkuMap.get(skuKey));
      continue;
    }

    let candidateSlug = `${slugifyTR(item.urun_adi)}-${slugifyTR(item.sku)}`;
    if (!candidateSlug) candidateSlug = `urun-${slugifyTR(item.sku)}`;
    let uniqueSlug = candidateSlug;
    let suffix = 2;
    while (existingSlugs.has(uniqueSlug)) {
      uniqueSlug = `${candidateSlug}-${suffix++}`;
    }
    existingSlugs.add(uniqueSlug);

    const newProduct = {
      id: `yilbasi-${slugifyTR(item.sku)}`,
      sku: String(item.sku).trim(),
      slug: uniqueSlug,
      name: String(item.urun_adi).trim(),
      shortName: String(item.urun_adi).trim(),
      categorySlug: item.kategori_slug,
      extraCategorySlugs: ["yilbasi"],
      description: "",
      price: null, // Satış fiyatı boş kalır (pdf_birim_fiyati dönüştürülmez)
      stock: null, // Stok boş kalır (koli_ici_adet dönüştürülmez)
      published: false, // Yeni ürünler taslak açılır
      image: mappedGallery[0],
      gallery: mappedGallery,
      imageAlt: `${item.urun_adi} (${item.sku})`,
      isConceptImage: false,
      occasions: ["Yılbaşı"],
      giftTypes: [item.kategori],
      birim: item.birim || "ADET",
      koliIciAdet:
        typeof item.koli_ici_adet === "number" ? item.koli_ici_adet : null,
      pdfBirimFiyati:
        item.pdf_birim_fiyati !== undefined && item.pdf_birim_fiyati !== null
          ? String(item.pdf_birim_fiyati)
          : null,
      kaynakUrunAdi: item.kaynak_urun_adi || "",
      kaynaklar: Array.isArray(item.kaynaklar) ? item.kaynaklar : [],
    };

    store.products.push(newProduct);
    existingSkuMap.set(skuKey, newProduct);
    yilbasiProducts.push(newProduct);
    added++;
  }

  // Write updated store.json
  fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), "utf-8");

  // Also write static bundled catalog for default-store.ts (Next.js static export)
  const yilbasiCategories = store.categories.filter(
    (c) => c.slug === "yilbasi" || c.parentSlug === "yilbasi"
  );
  fs.mkdirSync(path.dirname(GENERATED_CATALOG_PATH), { recursive: true });
  fs.writeFileSync(
    GENERATED_CATALOG_PATH,
    JSON.stringify(
      {
        categories: yilbasiCategories,
        products: yilbasiProducts,
      },
      null,
      2
    ),
    "utf-8"
  );

  const report = {
    sourceTotal: rawItems.length,
    added,
    matchedExisting,
    errorCount: errors.length,
    errors,
    categoriesAdded,
    categoriesMatched,
    subcategoriesTotal: subCatMap.size,
    imagesVerified: verifiedImages.size,
    totalProductsInStore: store.products.length,
    totalCategoriesInStore: store.categories.length,
  };

  console.log(JSON.stringify(report, null, 2));
}

main();
