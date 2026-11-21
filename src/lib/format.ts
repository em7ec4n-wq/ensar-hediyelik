export function formatPriceTRY(amount: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function buildWhatsAppProductUrl(params: {
  whatsappNumber: string;
  productName: string;
  selectedOption?: string;
  quantity: number;
  productUrl: string;
}): string {
  const { whatsappNumber, productName, selectedOption, quantity, productUrl } = params;
  const optionSegment = selectedOption ? ` Seçenek: ${selectedOption}.` : "";
  const message = `Merhaba, ${productName} hakkında bilgi alabilir miyim?${optionSegment} Adet: ${quantity}. ${productUrl}`;
  const cleanPhone = whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

export function buildWhatsAppGeneralUrl(whatsappNumber: string, text?: string): string {
  const cleanPhone = whatsappNumber.replace(/\D/g, "");
  if (!text) return `https://wa.me/${cleanPhone}`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function buildWhatsAppCartUrl(params: {
  whatsappNumber: string;
  items: {
    sku: string;
    name: string;
    slug: string;
    selectedOption?: string;
    quantity: number;
    unitPrice: number;
  }[];
  subtotal: number;
  shippingFee: number;
  total: number;
  origin?: string;
}): string {
  const { whatsappNumber, items, subtotal, shippingFee, total, origin } = params;
  const base = origin || "https://www.ensarhediyelik.com.tr";
  const lines = [
    "Merhaba, sepetimdeki ürünler için sipariş/bilgi almak istiyorum:",
    "",
    ...items.map((item, idx) => {
      const opt = item.selectedOption ? ` (${item.selectedOption})` : "";
      const lineTotal = formatPriceTRY(item.unitPrice * item.quantity);
      return `${idx + 1}. ${item.name}${opt} [${item.sku}] × ${item.quantity} adet = ${lineTotal}\n   ${base}/urun/${item.slug}`;
    }),
    "",
    `Ara Toplam: ${formatPriceTRY(subtotal)}`,
    `Kargo: ${shippingFee === 0 ? "Ücretsiz" : formatPriceTRY(shippingFee)}`,
    `Genel Toplam: ${formatPriceTRY(total)}`,
  ];
  const cleanPhone = whatsappNumber.replace(/\D/g, "");
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(lines.join("\n"))}`;
}
