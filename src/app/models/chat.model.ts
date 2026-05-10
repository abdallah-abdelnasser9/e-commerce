export interface ChatMessage {
  _id: string;
  sender: string;
  receiver: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
}
// src/app/models/chat.model.ts
export interface ChatMessage {
  _id: string;
  sender: string;
  receiver: string;
  message: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
  messageType?: 'text' | 'product_inquiry' | 'product_response' | 'auto_response';
  metadata?: {
    type?: string;
    productId?: string;
    productName?: string;
    question?: string;
    [key: string]: any;
  };
}

// Add this interface for product inquiry data
export interface ProductInquiryData {
  userId: string;
  productId?: string;
  productName?: string;
  question: string;
}