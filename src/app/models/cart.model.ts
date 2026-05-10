export interface Product {
    _id: string;
    name: string;
    price: number;
    images: string[];
    stock: number;
    slug?: string;
    brand?: string;
    sku?: string;
    isActive?: boolean;
}

export interface CartItem {
    _id: string;
    product: Product | string; // Can be string ID or populated Product object
    quantity: number;
    price: number;
    color?: string;
    size?: string;
    name?: string;
    image?: string;
    brand?: string;
}

export interface Cart {
    _id: string;
    user: string;
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    createdAt?: string;
    updatedAt?: string;
}

export interface AddToCartData {
    productId: string;
    quantity?: number;
    color?: string;
    size?: string;
}

export interface UpdateCartData {
    quantity: number;
}

export interface CartResponse {
    success: boolean;
    message: string;
    cart: Cart;
}

export interface ApiResponse {
    success: boolean;
    message: string;
    [key: string]: any;
}