import type {
  ProductDetailResponse,
  ProductWithVariantsResponse,
  VariantResponse,
  PaginationMeta,
  PaginatedResult,
} from "@e-com/shared/types";

export interface BestsellerProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  images: string[];
  tags: string[];
  sellingPrice: number;
  mrp: number;
  stockQuantity: number;
  rating: number;
  reviewCount: number;
  brand?: { id?: string; name: string; slug?: string } | string;
}

export interface ProductsApiResponse {
  success: boolean;
  data: ProductDetailResponse[];
  pagination?: PaginationMeta & { total?: number };
}

export interface ProductStorefrontApiResponse {
  success: boolean;
  data: ProductWithVariantsResponse;
}

export interface VariantsApiResponse {
  success: boolean;
  data: VariantResponse[];
}

export interface CatalogResult extends PaginatedResult<BestsellerProduct> {
  pagination: PaginationMeta & { total: number };
}

/**
 * Sample streetwear PDP product matching reference design.
 */
export const REFERENCE_STREETWEAR_PDP: ProductWithVariantsResponse = {
  id: "6adf3056ee0d7e7119f1ea06",
  vendorId: "Default Vendor",
  name: "BY MY SIDE LAYERED OVERSIZED FULL SLEEVE",
  slug: "by-my-side-layered-oversized-full-sleeve",
  description:
    "Heavyweight 240 GSM pure combed cotton layered long-sleeve tee. Features a vintage washed screenprinted portrait graphic on a drop-shoulder boxy silhouette with contrast layered optic-white waffle sleeves.",
  category: {
    id: "cat-men-topwear",
    name: "Topwear",
    slug: "men-topwear",
  },
  brand: {
    id: "brand-vendor-vogue",
    name: "Vendor Vogue Studio",
    slug: "vendor-vogue-studio",
    logo: null,
  },
  hsnCode: "610910",
  gstRate: 12,
  images: [
    "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=1200&auto=format&fit=crop&q=90",
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=1200&auto=format&fit=crop&q=90",
  ],
  tags: ["new-arrival", "bestseller", "trending"],
  isActive: true,
  createdAt: "2026-10-25T10:00:00.000Z",
  updatedAt: "2026-10-25T10:00:00.000Z",
  variants: [
    {
      id: "6adf3056ee0d7e7119f1ea0b",
      productId: "6adf3056ee0d7e7119f1ea06",
      name: "BY MY SIDE LAYERED OVERSIZED FULL SLEEVE - S",
      slug: "by-my-side-layered-oversized-full-sleeve-s",
      description: "Size S",
      sku: "VV-BMS-BLK-S",
      sellingPrice: 1999,
      mrp: 2499,
      stockQuantity: 25,
      availableStock: 25,
      weightInGrams: 240,
      attributes: [{ name: "Size", value: "S" }],
      images: [
        "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=1200&auto=format&fit=crop&q=90",
      ],
      isActive: true,
      createdAt: "2026-10-25T10:00:00.000Z",
      updatedAt: "2026-10-25T10:00:00.000Z",
    },
    {
      id: "6adf3056ee0d7e7119f1ea13",
      productId: "6adf3056ee0d7e7119f1ea06",
      name: "BY MY SIDE LAYERED OVERSIZED FULL SLEEVE - M",
      slug: "by-my-side-layered-oversized-full-sleeve-m",
      description: "Size M",
      sku: "VV-BMS-BLK-M",
      sellingPrice: 1999,
      mrp: 2499,
      stockQuantity: 35,
      availableStock: 35,
      weightInGrams: 240,
      attributes: [{ name: "Size", value: "M" }],
      images: [
        "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=1200&auto=format&fit=crop&q=90",
      ],
      isActive: true,
      createdAt: "2026-10-25T10:00:00.000Z",
      updatedAt: "2026-10-25T10:00:00.000Z",
    },
    {
      id: "6adf3056ee0d7e7119f1ea1c",
      productId: "6adf3056ee0d7e7119f1ea06",
      name: "BY MY SIDE LAYERED OVERSIZED FULL SLEEVE - L",
      slug: "by-my-side-layered-oversized-full-sleeve-l",
      description: "Size L",
      sku: "VV-BMS-BLK-L",
      sellingPrice: 1999,
      mrp: 2499,
      stockQuantity: 30,
      availableStock: 30,
      weightInGrams: 240,
      attributes: [{ name: "Size", value: "L" }],
      images: [
        "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=1200&auto=format&fit=crop&q=90",
      ],
      isActive: true,
      createdAt: "2026-10-25T10:00:00.000Z",
      updatedAt: "2026-10-25T10:00:00.000Z",
    },
    {
      id: "6adf3056ee0d7e7119f1ea22",
      productId: "6adf3056ee0d7e7119f1ea06",
      name: "BY MY SIDE LAYERED OVERSIZED FULL SLEEVE - XL",
      slug: "by-my-side-layered-oversized-full-sleeve-xl",
      description: "Size XL",
      sku: "VV-BMS-BLK-XL",
      sellingPrice: 1999,
      mrp: 2499,
      stockQuantity: 20,
      availableStock: 20,
      weightInGrams: 240,
      attributes: [{ name: "Size", value: "XL" }],
      images: [
        "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=1200&auto=format&fit=crop&q=90",
      ],
      isActive: true,
      createdAt: "2026-10-25T10:00:00.000Z",
      updatedAt: "2026-10-25T10:00:00.000Z",
    },
  ],
};

/**
 * High-fidelity fallback bestsellers dataset.
 * Used for zero-layout-shift SSR and resilient degradation.
 */
export const FALLBACK_BESTSELLERS: BestsellerProduct[] = [
  {
    id: "bs-1",
    name: "FELL IN LOVE IN OCT V2 WASHED OVERSIZED TEE",
    slug: "fell-in-love-in-oct-v2-washed-oversized-tee",
    description: "Heavyweight 280 GSM cotton washed oversized t-shirt in vintage crimson burgundy.",
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["bestseller", "back in stock"],
    sellingPrice: 1798,
    mrp: 1798,
    stockQuantity: 0,
    rating: 4.7,
    reviewCount: 142,
  },
  {
    id: "bs-2",
    name: "MUSIC MONEY FASHION WAFFLE OVERSIZED FULL SLEEVE",
    slug: "music-money-fashion-waffle-oversized-full-sleeve",
    description: "Thermal waffle knit long sleeve tee with dropped shoulders and ribbed cuffs.",
    images: [
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["bestseller"],
    sellingPrice: 2198,
    mrp: 2198,
    stockQuantity: 18,
    rating: 4.7,
    reviewCount: 98,
  },
  {
    id: "bs-3",
    name: "90210 WAFFLE OVERSIZED FULL SLEEVE",
    slug: "90210-waffle-oversized-full-sleeve",
    description: "Off-white cream thermal waffle long sleeve featuring back collegiate typography.",
    images: [
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["bestseller", "back in stock"],
    sellingPrice: 1998,
    mrp: 1998,
    stockQuantity: 24,
    rating: 4.3,
    reviewCount: 86,
  },
  {
    id: "bs-4",
    name: "DRUGS HEAVYWEIGHT OVERSIZED T-SHIRT",
    slug: "drugs-heavyweight-oversized-t-shirt",
    description: "Boxy heavyweight raw-edge tee in washed bone oatmeal with puff print graphic.",
    images: [
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["bestseller"],
    sellingPrice: 1679,
    mrp: 1679,
    stockQuantity: 30,
    rating: 4.7,
    reviewCount: 210,
  },
  {
    id: "bs-5",
    name: "NO SURPRISES CROPPED TEE",
    slug: "no-surprises-cropped-tee",
    description: "Relaxed silhouette cropped tee with vibrant rear multi-color graphic artwork.",
    images: [
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["limited", "bestseller"],
    sellingPrice: 1388,
    mrp: 1598,
    stockQuantity: 7,
    rating: 4.7,
    reviewCount: 165,
  },
  {
    id: "bs-6",
    name: "SHABANG CONTRAST RINGER TEE",
    slug: "shabang-contrast-ringer-tee",
    description: "Retro 70s inspired ivory tee with ocean blue ribbed ringer collar and retro chest insignia.",
    images: [
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["bestseller", "trending"],
    sellingPrice: 1499,
    mrp: 1799,
    stockQuantity: 15,
    rating: 4.6,
    reviewCount: 74,
  },
  {
    id: "bs-7",
    name: "ARCHIVE MANIFESTO OVERSIZED TEE",
    slug: "archive-manifesto-oversized-tee",
    description: "Pure combed jersey knit tee with full rear typographic poetry editorial print.",
    images: [
      "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["bestseller"],
    sellingPrice: 1799,
    mrp: 1799,
    stockQuantity: 22,
    rating: 4.8,
    reviewCount: 119,
  },
  {
    id: "bs-8",
    name: "CAN'T BELIEVE THERMAL CREW SWEATER",
    slug: "cant-believe-thermal-crew-sweater",
    description: "Heavyweight black rib textured thermal sweater with metallic rear typographic statement.",
    images: [
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["limited", "bestseller"],
    sellingPrice: 2499,
    mrp: 2999,
    stockQuantity: 4,
    rating: 4.9,
    reviewCount: 52,
  },
  {
    id: "bs-9",
    name: "HOPE MINIMALIST EMBROIDERED BABY TEE",
    slug: "hope-minimalist-embroidered-baby-tee",
    description: "Structured cotton stretch baby tee in optic white with royal blue abstract chest script.",
    images: [
      "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["bestseller", "trending"],
    sellingPrice: 1299,
    mrp: 1299,
    stockQuantity: 28,
    rating: 4.5,
    reviewCount: 88,
  },
  {
    id: "bs-10",
    name: "MUSTARD LOGO OVERSIZED GRAPHIC TEE",
    slug: "mustard-logo-oversized-graphic-tee",
    description: "Vintage faded washed charcoal tee with repetitive acid green typographical stack print.",
    images: [
      "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["bestseller"],
    sellingPrice: 1599,
    mrp: 1899,
    stockQuantity: 11,
    rating: 4.7,
    reviewCount: 134,
  },
];

/**
 * Curated fallback dataset for Trending Streetwear products.
 */
export const FALLBACK_TRENDING: BestsellerProduct[] = [
  {
    id: "tr-1",
    name: "BY MY SIDE LAYERED OVERSIZED FULL SLEEVE",
    slug: "by-my-side-layered-oversized-full-sleeve",
    description: "Heavyweight 240 GSM pure combed cotton layered long-sleeve tee with contrast waffle sleeves.",
    images: [
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["trending", "new-arrival"],
    sellingPrice: 1999,
    mrp: 2499,
    stockQuantity: 15,
    rating: 4.9,
    reviewCount: 186,
  },
  {
    id: "tr-2",
    name: "ACID WASH DISTRESSED BOX HOODIE",
    slug: "acid-wash-distressed-box-hoodie",
    description: "450 GSM custom French Terry with acid enzyme wash, raw hems, and dropped shoulders.",
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["trending", "limited"],
    sellingPrice: 3499,
    mrp: 4299,
    stockQuantity: 12,
    rating: 4.8,
    reviewCount: 114,
  },
  {
    id: "tr-3",
    name: "SHABANG CONTRAST RINGER TEE",
    slug: "shabang-contrast-ringer-tee",
    description: "Retro 70s inspired ivory tee with ocean blue ribbed ringer collar and chest insignia.",
    images: [
      "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["trending"],
    sellingPrice: 1499,
    mrp: 1799,
    stockQuantity: 20,
    rating: 4.6,
    reviewCount: 74,
  },
  {
    id: "tr-4",
    name: "TACTICAL NYLON CARGO PARACHUTE PANT",
    slug: "tactical-nylon-cargo-parachute-pant",
    description: "Ultra-wide balloon silhouette parachute cargo trousers with bungee cinch toggles.",
    images: [
      "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["trending", "limited"],
    sellingPrice: 3299,
    mrp: 3999,
    stockQuantity: 8,
    rating: 4.9,
    reviewCount: 92,
  },
  {
    id: "tr-5",
    name: "HOPE MINIMALIST EMBROIDERED BABY TEE",
    slug: "hope-minimalist-embroidered-baby-tee",
    description: "Structured cotton stretch baby tee in optic white with royal blue typography.",
    images: [
      "https://images.unsplash.com/photo-1503342394128-c104d54dba01?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["trending"],
    sellingPrice: 1299,
    mrp: 1299,
    stockQuantity: 28,
    rating: 4.5,
    reviewCount: 88,
  },
  {
    id: "tr-6",
    name: "DECONSTRUCTED VINTAGE FLANNEL OVERSHIRT",
    slug: "deconstructed-vintage-flannel-overshirt",
    description: "Heavy brushed plaid flannel overshirt with frayed raw edging and double chest flap pockets.",
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["trending"],
    sellingPrice: 2799,
    mrp: 3299,
    stockQuantity: 14,
    rating: 4.7,
    reviewCount: 65,
  },
  {
    id: "tr-7",
    name: "PHANTOM RAW-EDGE DISTRESSED KNIT",
    slug: "phantom-raw-edge-distressed-knit",
    description: "Loose gauge open-weave destroyed sweater featuring laddering details throughout.",
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["trending", "limited"],
    sellingPrice: 2899,
    mrp: 3499,
    stockQuantity: 6,
    rating: 4.8,
    reviewCount: 47,
  },
  {
    id: "tr-8",
    name: "CYBERPUNK INDUSTRIAL GRAPHIC HOODIE",
    slug: "cyberpunk-industrial-graphic-hoodie",
    description: "Black oversized thermal hoodie with neon reflective cyber graphics on front and back.",
    images: [
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["trending"],
    sellingPrice: 3199,
    mrp: 3899,
    stockQuantity: 18,
    rating: 4.6,
    reviewCount: 103,
  },
  {
    id: "tr-9",
    name: "SUBWAY GRAFFITI HEAVYWEIGHT TEE",
    slug: "subway-graffiti-heavyweight-tee",
    description: "Oversized 280 GSM cotton t-shirt with airbrushed street tag artwork across the chest.",
    images: [
      "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["trending"],
    sellingPrice: 1899,
    mrp: 2199,
    stockQuantity: 22,
    rating: 4.7,
    reviewCount: 81,
  },
  {
    id: "tr-10",
    name: "MUTED OLIVE OVERSIZED CARPENTER DENIM",
    slug: "muted-olive-oversized-carpenter-denim",
    description: "14oz rigid broken twill denim in vintage washed olive with utility hammer loop and tool pockets.",
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["trending", "limited"],
    sellingPrice: 3699,
    mrp: 4499,
    stockQuantity: 9,
    rating: 4.9,
    reviewCount: 77,
  },
];

/**
 * Curated fallback dataset for Limited Edition drop pieces.
 */
export const FALLBACK_LIMITED: BestsellerProduct[] = [
  {
    id: "ltd-1",
    name: "ACID WASH DISTRESSED BOX HOODIE",
    slug: "acid-wash-distressed-box-hoodie",
    description: "450 GSM custom French Terry with acid enzyme wash, raw hems, and dropped shoulders.",
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["limited", "trending"],
    sellingPrice: 3499,
    mrp: 4299,
    stockQuantity: 12,
    rating: 4.8,
    reviewCount: 114,
  },
  {
    id: "ltd-2",
    name: "TACTICAL NYLON CARGO PARACHUTE PANT",
    slug: "tactical-nylon-cargo-parachute-pant",
    description: "Ultra-wide balloon silhouette parachute cargo trousers with bungee cinch toggles.",
    images: [
      "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["limited"],
    sellingPrice: 3299,
    mrp: 3999,
    stockQuantity: 8,
    rating: 4.9,
    reviewCount: 92,
  },
  {
    id: "ltd-3",
    name: "CAN'T BELIEVE THERMAL CREW SWEATER",
    slug: "cant-believe-thermal-crew-sweater",
    description: "Heavyweight black rib textured thermal sweater with metallic rear typographic statement.",
    images: [
      "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["limited"],
    sellingPrice: 2499,
    mrp: 2999,
    stockQuantity: 4,
    rating: 4.9,
    reviewCount: 52,
  },
  {
    id: "ltd-4",
    name: "PHANTOM RAW-EDGE DISTRESSED KNIT",
    slug: "phantom-raw-edge-distressed-knit",
    description: "Loose gauge open-weave destroyed sweater featuring laddering details throughout.",
    images: [
      "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["limited"],
    sellingPrice: 2899,
    mrp: 3499,
    stockQuantity: 6,
    rating: 4.8,
    reviewCount: 47,
  },
  {
    id: "ltd-5",
    name: "NO SURPRISES CROPPED TEE",
    slug: "no-surprises-cropped-tee",
    description: "Relaxed silhouette cropped tee with vibrant rear multi-color graphic artwork.",
    images: [
      "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["limited"],
    sellingPrice: 1388,
    mrp: 1598,
    stockQuantity: 7,
    rating: 4.7,
    reviewCount: 165,
  },
  {
    id: "ltd-6",
    name: "MUTED OLIVE OVERSIZED CARPENTER DENIM",
    slug: "muted-olive-oversized-carpenter-denim",
    description: "14oz rigid broken twill denim in vintage washed olive with utility hammer loop and tool pockets.",
    images: [
      "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["limited"],
    sellingPrice: 3699,
    mrp: 4499,
    stockQuantity: 9,
    rating: 4.9,
    reviewCount: 77,
  },
  {
    id: "ltd-7",
    name: "MONOLITH HEAVYWEIGHT BOMBER JACKET",
    slug: "monolith-heavyweight-bomber-jacket",
    description: "Curved sleeve flight jacket in resin-coated nylon twill with emergency orange quilted lining.",
    images: [
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["limited", "new-arrival"],
    sellingPrice: 4999,
    mrp: 5999,
    stockQuantity: 5,
    rating: 4.9,
    reviewCount: 38,
  },
  {
    id: "ltd-8",
    name: "ARCHIVE WASHED LEATHER TRUCKER",
    slug: "archive-washed-leather-trucker",
    description: "Supple full-grain sheepskin leather jacket with vintage patina wash and custom nickel hardware.",
    images: [
      "https://images.unsplash.com/photo-1529374255404-311a2a4f1fd9?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["limited"],
    sellingPrice: 6499,
    mrp: 7999,
    stockQuantity: 3,
    rating: 5.0,
    reviewCount: 29,
  },
  {
    id: "ltd-9",
    name: "VANGUARD WIDE LEG WAXED TROUSER",
    slug: "vanguard-wide-leg-waxed-trouser",
    description: "Structured water-repellent dry waxed cotton trousers with deep front pleats and horn buttons.",
    images: [
      "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1517445312882-bc9910d016b7?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["limited"],
    sellingPrice: 3499,
    mrp: 4199,
    stockQuantity: 11,
    rating: 4.8,
    reviewCount: 61,
  },
  {
    id: "ltd-10",
    name: "SILENCE OVERSIZED MOHAIR CARDIGAN",
    slug: "silence-oversized-mohair-cardigan",
    description: "Brushed Italian mohair-wool blend cardigan with contrast intarsia pattern and dropped shoulder drape.",
    images: [
      "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=85",
    ],
    tags: ["limited"],
    sellingPrice: 3899,
    mrp: 4699,
    stockQuantity: 7,
    rating: 4.9,
    reviewCount: 44,
  },
];

/**
 * Deduplicated master list of all fallback catalog products.
 * Provides resilient 30+ product streetwear catalog when backend is booting.
 */
export const ALL_FALLBACK_PRODUCTS: BestsellerProduct[] = (() => {
  const map = new Map<string, BestsellerProduct>();
  for (const p of [
    ...FALLBACK_BESTSELLERS,
    ...FALLBACK_TRENDING,
    ...FALLBACK_LIMITED,
  ]) {
    if (!map.has(p.slug)) {
      map.set(p.slug, p);
    }
  }
  return Array.from(map.values());
})();
