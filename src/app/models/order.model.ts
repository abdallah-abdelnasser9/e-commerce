export interface Order {
  _id: string;
  orderId: string;
  user: any;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: string;
  paymentStatus: string;
  paymentId?: string;
  status: string;
  subtotal: number;
  shippingFee: number;
  tax: number;
  totalAmount: number;
  trackingNumber?: string;
  cancelledAt?: string; // Add optional
  deliveredAt?: string; 
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  product: any;
  name: string;
  quantity: number;
  price: number;
  color?: string;
  size?: string;
  subtotal: number;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault?: boolean;
}

export interface CreateOrderData {
  items: any[];
  shippingAddress: Address;
  paymentMethod: string;
}