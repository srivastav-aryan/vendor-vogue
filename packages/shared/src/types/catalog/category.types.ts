export type CategoryResponse = {
  id: string;
  name: string;
  slug: string;
  description: string;
  parent: string | null;
  ancestors: string[];
  isActive: boolean;
  isEffectivelyActive: boolean;
  blockingAncestorId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CategoryTreeNode = CategoryResponse & {
  children: CategoryTreeNode[];
};

export type CategoryTreeResponse = CategoryTreeNode;

export type CategoryDetailResponse = CategoryResponse & {
  childrenCount: number;
  parentDetail?: { id: string; name: string; slug: string; isActive: boolean } | null;
  ancestorDetails?: { id: string; name: string; slug: string; isActive: boolean }[];
};
