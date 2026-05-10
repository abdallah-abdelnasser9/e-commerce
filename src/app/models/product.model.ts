// product.model.ts
export interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  brand?: string;
  category: any;
  subcategory?: any;
  price: number;
  discountPrice?: number;
  discountPercentage?: number;
  images: string[];
  colors: string[];
  sizes: string[];
  specifications?: Record<string, string>;
  features: string[];
  stock: number;
  lowStockThreshold: number;
  sku: string;
  rating: number;
  reviewsCount: number;
  isFeatured: boolean;
  isActive: boolean;
  createdAt?: Date | string;  // Allow both Date and string
  updatedAt?: Date | string;  // Allow both Date and string
  imageUrl?: string;
}

// Also update ProductResponse if needed:
export interface ProductResponse {
  totalPages: number;
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}