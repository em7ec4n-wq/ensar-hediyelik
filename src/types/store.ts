export interface ProductOption {
  name: string; // e.g., "Renk", "Boyut", "Işık Tonu"
  required: boolean;
  values: string[];
}

export interface ProductSourceRef {
  dosya: string;
  sayfa: number;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string; // Full catalog name (used on product detail)
  shortName: string; // Concise card display name (e.g., "Balerinli Piyano")
  categorySlug: string;
  extraCategorySlugs?: string[];
  description: string;
  price: number | null; // Managed via admin panel (TRY); null for unpriced drafts
  stock: number | null; // Managed via admin panel; null for unstocked drafts
  published: boolean;
  image: string;
  gallery: string[];
  imageAlt: string;
  isConceptImage?: boolean;
  isNewArrival?: boolean;
  newArrivalOrder?: number;
  occasions: string[]; // e.g. ["Doğum Günü", "Sevgililer Günü", "Yıldönümü"]
  giftTypes: string[]; // e.g. ["Işıklı Ürünler", "Cam Küreler", "Müzik Kutuları"]
  options?: ProductOption[];
  legacyPath?: string;
  // Admin-only source catalog fields (never auto-converted to retail price or stock)
  birim?: string;
  koliIciAdet?: number | null;
  pdfBirimFiyati?: string | null;
  kaynakUrunAdi?: string;
  kaynaklar?: ProductSourceRef[];
}

export interface Category {
  slug: string;
  name: string;
  description: string;
  image: string;
  imageAlt: string;
  showOnHome: boolean;
  homeOrder?: number;
  parentSlug?: string;
  isConceptImage?: boolean;
}

export interface HeroSlide {
  id: string;
  titleLines: string[]; // e.g. ["Her anın", "bir hediyesi", "var."]
  buttonLabel: string;
  buttonHref: string;
  image: string;
  imageAlt: string;
  isConceptImage: boolean;
  desktopObjectPosition?: string;
  mobileObjectPosition?: string;
}

export interface OrderItem {
  productId: string;
  sku: string;
  slug: string;
  name: string;
  selectedOption?: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  paymentMethod: "kapida-odeme" | "havale-eft" | "kredi-karti";
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  status: "Yeni" | "Hazırlanıyor" | "Kargolandı" | "Teslim Edildi" | "İptal";
}

export interface StoreSettings {
  brandName: string;
  logoLightBg: string; // /ensar-web/logo/ensar-logo-seffaf.png
  logoDarkBg: string; // /ensar-web/logo/ensar-logo-beyaz.png
  favicon: string; // /ensar-web/logo/favicon.png
  phoneDisplay: string;
  whatsappNumber: string; // digits only with country code e.g. 905413567162
  email: string;
  address: string;
  workingHours: string;
  legalEntityName: string;
  taxOfficeAndNo: string;
  shippingThreshold: number;
  shippingFee: number;
  deliverySummary: string;
  returnSummary: string;
  paymentSummary: string;
  agencyRoleNote: string;
}

export interface StoreData {
  settings: StoreSettings;
  heroSlides: HeroSlide[];
  categories: Category[];
  products: Product[];
  orders: Order[];
}

export interface CartItem {
  productId: string;
  slug: string;
  sku: string;
  name: string;
  image: string;
  unitPrice: number;
  stock: number;
  quantity: number;
  selectedOption?: string;
}
