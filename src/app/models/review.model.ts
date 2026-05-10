export interface Review {
  _id: string;
  user: any;
  product: string;
  rating: number;
  comment: string;
  images: string[];
  isVerifiedPurchase: boolean;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
}