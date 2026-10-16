export type VariantAttribute = {
  name: string;
  value: string;
  meta?: string;
};

export type VariantResponse = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  description: string;
  sku: string;
  sellingPrice: number;
  mrp: number;
  stockQuantity: number;
  availableStock: number;
  weightInGrams: number;
  attributes: VariantAttribute[];
  images: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
