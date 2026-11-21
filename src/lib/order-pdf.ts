"use client";

import type { CartItem, Category, Product } from "@/types/store";

export interface SiparisEntry {
  sku: string;
  name: string;
  categoryName: string;
  image: string;
  unitPrice: number;
  quantity: number;
  selectedOption?: string;
}

export interface SiparisPayload {
  createdAt: string;
  payment: string;
  address: string;
  entries: SiparisEntry[];
}

export function formatTRYExact(amount: number): string {
  return (
    new Intl.NumberFormat("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount) + " TL"
  );
}

/**
 * Compact URL-safe encoding of an order so the shopkeeper can open
 * the visual Sipariş Listesi (with product photos) directly from a WhatsApp link:
 * Format: v1|payment|address|sku~qty~price~opt,sku~qty~price~opt
 */
export function encodeSiparisQuery(params: {
  items: CartItem[];
  payment?: string;
  address?: string;
}): string {
  const pay = (params.payment || "-").replace(/[|,~]/g, " ").trim() || "-";
  const addr = (params.address || "-").replace(/[|,~]/g, " ").trim() || "-";
  const rows = params.items
    .map((i) => {
      const opt = (i.selectedOption || "").replace(/[|,~]/g, " ");
      return `${i.sku}~${i.quantity}~${i.unitPrice}${opt ? `~${opt}` : ""}`;
    })
    .join(",");
  const raw = `v1|${pay}|${addr}|${rows}`;
  if (typeof window === "undefined") return "";
  return btoa(unescape(encodeURIComponent(raw)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function decodeSiparisQuery(
  encoded: string,
  products: Product[],
  categories: Category[]
): SiparisPayload | null {
  try {
    const base64 = encoded.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    const raw = decodeURIComponent(escape(atob(padded)));
    const [ver, payment = "-", address = "-", rowsStr = ""] = raw.split("|");
    if (ver !== "v1" || !rowsStr) return null;

    const catMap = new Map(categories.map((c) => [c.slug, c.name]));
    const entries: SiparisEntry[] = [];

    for (const token of rowsStr.split(",")) {
      if (!token) continue;
      const [sku, qtyStr, priceStr, opt] = token.split("~");
      const prod = products.find(
        (p) => p.sku.toUpperCase() === (sku || "").toUpperCase()
      );
      const quantity = Math.max(1, Number(qtyStr) || 1);
      const unitPrice = Number(priceStr) || prod?.price || 0;
      const catName = prod
        ? catMap.get(prod.categorySlug) || "HEDİYELİK"
        : "HEDİYELİK";

      entries.push({
        sku: prod?.sku || sku,
        name: prod?.name || sku,
        categoryName: catName.toLocaleUpperCase("tr-TR"),
        image:
          prod?.image || "/ensar-web/gorseller/hero-astronot-cam-kure.webp",
        unitPrice,
        quantity,
        selectedOption: opt || undefined,
      });
    }

    return {
      createdAt: new Date().toLocaleString("tr-TR").slice(0, 16),
      payment: payment || "-",
      address: address || "-",
      entries,
    };
  } catch {
    return null;
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/**
 * Packs an array of JPEG data URLs (each representing an A4 page) into a valid
 * standalone multi-page PDF Blob without external libraries.
 */
function buildPdfFromJpegPages(
  pages: { jpegBytes: Uint8Array; widthPx: number; heightPx: number }[]
): Blob {
  const encoder = new TextEncoder();
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [];
  let byteLength = 0;

  const pushStr = (s: string) => {
    const arr = encoder.encode(s);
    chunks.push(arr);
    byteLength += arr.length;
  };
  const pushBytes = (arr: Uint8Array) => {
    chunks.push(arr);
    byteLength += arr.length;
  };
  const startObj = (id: number) => {
    offsets[id] = byteLength;
    pushStr(`${id} 0 obj\n`);
  };
  const endObj = () => {
    pushStr("endobj\n");
  };

  // A4 dimensions in PDF points
  const pageW = 595.28;
  const pageH = 841.89;

  pushStr("%PDF-1.4\n%\xFF\xFF\xFF\xFF\n");

  // 1: Catalog, 2: Pages
  // For each page i (0..N-1):
  //   pageObjId = 3 + i * 3
  //   contentObjId = 4 + i * 3
  //   imgObjId = 5 + i * 3
  const pageObjIds: number[] = [];

  for (let i = 0; i < pages.length; i++) {
    const pageObjId = 3 + i * 3;
    const contentObjId = 4 + i * 3;
    const imgObjId = 5 + i * 3;
    pageObjIds.push(pageObjId);

    const p = pages[i];

    // Image XObject
    startObj(imgObjId);
    pushStr(
      `<< /Type /XObject /Subtype /Image /Width ${p.widthPx} /Height ${p.heightPx} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${p.jpegBytes.length} >>\nstream\n`
    );
    pushBytes(p.jpegBytes);
    pushStr("\nendstream\n");
    endObj();

    // Content stream drawing image full page
    const contentCmd = `q\n${pageW.toFixed(2)} 0 0 ${pageH.toFixed(2)} 0 0 cm\n/Im0 Do\nQ\n`;
    startObj(contentObjId);
    pushStr(`<< /Length ${contentCmd.length} >>\nstream\n${contentCmd}endstream\n`);
    endObj();

    // Page object
    startObj(pageObjId);
    pushStr(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW.toFixed(2)} ${pageH.toFixed(2)}] /Resources << /XObject << /Im0 ${imgObjId} 0 R >> >> /Contents ${contentObjId} 0 R >>\n`
    );
    endObj();
  }

  // Object 2: Pages root
  startObj(2);
  pushStr(
    `<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>\n`
  );
  endObj();

  // Object 1: Catalog
  startObj(1);
  pushStr("<< /Type /Catalog /Pages 2 0 R >>\n");
  endObj();

  const totalObjs = 2 + pages.length * 3;
  const xrefOffset = byteLength;
  pushStr(`xref\n0 ${totalObjs + 1}\n`);
  pushStr("0000000000 65535 f \n");
  for (let id = 1; id <= totalObjs; id++) {
    const off = String(offsets[id] || 0).padStart(10, "0");
    pushStr(`${off} 00000 n \n`);
  }
  pushStr(
    `trailer\n<< /Size ${totalObjs + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  return new Blob(chunks as BlobPart[], { type: "application/pdf" });
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] || "";
  const bin = atob(base64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

/**
 * Generates a real multi-page A4 PDF matching the exact visual layout of the
 * customer's sample "Sipariş Listesi.pdf" (centered header on page 1, rounded
 * white product cards with square thumbnail photos on the left, category,
 * bold product name, Fiyat, Adet, Toplam on the right, and footer with page X / N).
 */
export async function generateSiparisPdfBlob(
  payload: SiparisPayload,
  siteUrl = "https://ensar-hediyelik.onizlememerkezi.com/siparis"
): Promise<Blob> {
  // High-resolution A4 canvas (1240 x 1754 px = ~150 DPI A4)
  const W = 1240;
  const H = 1754;
  const marginX = 110;
  const cardW = W - marginX * 2;
  const cardH = 142;
  const cardGap = 16;

  // Page 1 has the centered header ("Sipariş Listesi", Ürün Sayısı, Genel Toplam, Ödeme, Adres), so fits 8 cards.
  // Subsequent pages fit 10 cards (matching the uploaded sample PDF!)
  const pageSlices: SiparisEntry[][] = [];
  if (payload.entries.length <= 8) {
    pageSlices.push(payload.entries);
  } else {
    pageSlices.push(payload.entries.slice(0, 8));
    let cursor = 8;
    while (cursor < payload.entries.length) {
      pageSlices.push(payload.entries.slice(cursor, cursor + 10));
      cursor += 10;
    }
  }

  const totalProductsCount = payload.entries.length;
  const grandTotal = payload.entries.reduce(
    (sum, e) => sum + e.unitPrice * e.quantity,
    0
  );

  // Preload all unique images
  const imgMap = new Map<string, HTMLImageElement | null>();
  await Promise.all(
    payload.entries.map(async (entry) => {
      if (!imgMap.has(entry.image)) {
        const loaded = await loadImageElement(entry.image);
        imgMap.set(entry.image, loaded);
      }
    })
  );

  const renderedPages: {
    jpegBytes: Uint8Array;
    widthPx: number;
    heightPx: number;
  }[] = [];

  for (let pIdx = 0; pIdx < pageSlices.length; pIdx++) {
    const slice = pageSlices[pIdx];
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d")!;

    // White A4 background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, W, H);

    let currentY = 85;

    // Centered Header on Page 1
    if (pIdx === 0) {
      ctx.fillStyle = "#111111";
      ctx.textAlign = "center";

      ctx.font = "bold 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
      ctx.fillText("Sipariş Listesi", W / 2, currentY + 32);

      ctx.font = "bold 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
      ctx.fillText(`Ürün Sayısı: ${totalProductsCount}`, W / 2, currentY + 70);

      ctx.font = "bold 23px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
      ctx.fillText(
        `Genel Toplam: ${formatTRYExact(grandTotal)}`,
        W / 2,
        currentY + 104
      );

      ctx.font = "bold 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
      ctx.fillText(`Ödeme: ${payload.payment || "-"}`, W / 2, currentY + 134);
      ctx.fillText(`Adres: ${payload.address || "-"}`, W / 2, currentY + 160);

      currentY += 195;
    }

    ctx.textAlign = "left";

    // Draw each product card
    for (const item of slice) {
      // Card border & background
      drawRoundedRect(ctx, marginX, currentY, cardW, cardH, 16);
      ctx.fillStyle = "#FFFFFF";
      ctx.fill();
      ctx.lineWidth = 1.5;
      ctx.strokeStyle = "#E2E2E2";
      ctx.stroke();

      // Thumbnail image box (left)
      const imgBoxX = marginX + 14;
      const imgBoxY = currentY + 14;
      const imgBoxSize = cardH - 28; // 114x114

      ctx.save();
      drawRoundedRect(ctx, imgBoxX, imgBoxY, imgBoxSize, imgBoxSize, 12);
      ctx.fillStyle = "#FAFAFA";
      ctx.fill();
      ctx.clip();

      const imgEl = imgMap.get(item.image);
      if (imgEl && imgEl.naturalWidth > 0) {
        // Fit image inside square nicely
        const scale = Math.min(
          imgBoxSize / imgEl.naturalWidth,
          imgBoxSize / imgEl.naturalHeight
        );
        const drawW = imgEl.naturalWidth * scale;
        const drawH = imgEl.naturalHeight * scale;
        const dx = imgBoxX + (imgBoxSize - drawW) / 2;
        const dy = imgBoxY + (imgBoxSize - drawH) / 2;
        ctx.drawImage(imgEl, dx, dy, drawW, drawH);
      }
      ctx.restore();

      // Right text column
      const textX = imgBoxX + imgBoxSize + 22;

      // Category + SKU line
      ctx.fillStyle = "#757575";
      ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
      ctx.fillText(
        `${item.categoryName}${item.sku ? ` · ${item.sku}` : ""}`,
        textX,
        currentY + 32
      );

      // Product Title
      ctx.fillStyle = "#0F0F0F";
      ctx.font = "bold 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
      const titleText = item.selectedOption
        ? `${item.name} (${item.selectedOption})`
        : item.name;
      ctx.fillText(titleText.slice(0, 62), textX, currentY + 59);

      // Fiyat, Adet, Toplam
      ctx.font = "bold 17px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
      ctx.fillText(
        `Fiyat: ${formatTRYExact(item.unitPrice)}`,
        textX,
        currentY + 84
      );
      ctx.fillText(`Adet: ${item.quantity}`, textX, currentY + 106);
      ctx.fillText(
        `Toplam: ${formatTRYExact(item.unitPrice * item.quantity)}`,
        textX,
        currentY + 128
      );

      currentY += cardH + cardGap;
    }

    // Footer (URL on left, Date & Page on right)
    ctx.fillStyle = "#888888";
    ctx.font = "15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(siteUrl, marginX - 20, H - 55);

    ctx.textAlign = "right";
    ctx.fillText(payload.createdAt, W - marginX + 20, H - 74);
    ctx.fillText(
      `Sayfa ${pIdx + 1} / ${pageSlices.length}`,
      W - marginX + 20,
      H - 52
    );

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    renderedPages.push({
      jpegBytes: dataUrlToBytes(dataUrl),
      widthPx: W,
      heightPx: H,
    });
  }

  return buildPdfFromJpegPages(renderedPages);
}
