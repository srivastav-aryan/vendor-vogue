export type ProductResponse = {
  id: string;
  vendorId: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  brand: string;
  hsnCode: string;
  gstRate: number;
  images: string[];
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PopulatedCategoryRef = {
  id: string;
  name: string;
  slug: string;
};

export type PopulatedBrandRef = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

export type ProductDetailResponse = Omit<ProductResponse, "category" | "brand"> & {
  category: PopulatedCategoryRef;
  brand: PopulatedBrandRef;
};
