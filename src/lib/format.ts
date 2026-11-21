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
