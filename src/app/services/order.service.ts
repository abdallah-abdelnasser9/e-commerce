// order.service.ts (update with these methods)
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone: string;
}

export interface OrderItem {
  product: string;
  name: string;
  quantity: number;
  price: number;
  color?: string;
  size?: string;
}

export interface OrderData {
  shippingAddress: ShippingAddress;
  paymentMethod: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  totalAmount: number;
}

export interface OrderResponse {
  success: boolean;
  message: string;
  order: any;
  redirectUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = 'https://backend-1-xkmk.onrender.com';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getAuthHeader() {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }

  private handleError(error: any) {
    console.error('Order Service Error:', error);
    let errorMessage = 'An error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // Create new order
  createOrder(orderData: OrderData): Observable<OrderResponse> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('Please login to place an order'));
    }

    return this.http.post<OrderResponse>(`${this.apiUrl}/orders/create`, orderData, this.getAuthHeader())
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get all orders for current user
  getOrders(): Observable<any> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.get(`${this.apiUrl}/orders`, this.getAuthHeader())
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get specific order by ID
  getOrder(orderId: string): Observable<any> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.get(`${this.apiUrl}/orders/${orderId}`, this.getAuthHeader())
      .pipe(
        catchError(this.handleError)
      );
  }

  // Cancel an order
  cancelOrder(orderId: string): Observable<any> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.put(`${this.apiUrl}/orders/${orderId}/cancel`, {}, this.getAuthHeader())
      .pipe(
        catchError(this.handleError)
      );
  }
}