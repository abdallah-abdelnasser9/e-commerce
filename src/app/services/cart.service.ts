import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Cart, CartItem, AddToCartData, CartResponse } from '../models/cart.model';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = 'https://backend-1-xkmk.onrender.com';
  private cartSubject = new BehaviorSubject<Cart | null>(null);
  public cart$ = this.cartSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    // Load cart when user logs in
    this.authService.currentUser$.subscribe(user => {
      if (user) {
        this.loadCart().subscribe({
          error: (err) => console.error('Error loading cart:', err)
        });
      } else {
        this.clearLocalCart();
      }
    });
  }

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
    console.error('Cart Service Error:', error);
    let errorMessage = 'An error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  // Load user's cart
  loadCart(): Observable<Cart> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.get<CartResponse>(`${this.apiUrl}/cart`, this.getAuthHeader())
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to load cart');
          }
          return response.cart;
        }),
        tap(cart => {
          this.cartSubject.next(cart);
        }),
        catchError(this.handleError)
      );
  }

  // Add item to cart
  addToCart(data: AddToCartData): Observable<Cart> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('Please login to add items to cart'));
    }

    return this.http.post<CartResponse>(`${this.apiUrl}/cart/add`, data, this.getAuthHeader())
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to add to cart');
          }
          return response.cart;
        }),
        tap(cart => {
          this.cartSubject.next(cart);
        }),
        catchError(this.handleError)
      );
  }

  // Update item quantity
  updateCartItem(itemId: string, quantity: number): Observable<Cart> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.put<CartResponse>(`${this.apiUrl}/cart/update/${itemId}`, { quantity }, this.getAuthHeader())
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to update cart');
          }
          return response.cart;
        }),
        tap(cart => {
          this.cartSubject.next(cart);
        }),
        catchError(this.handleError)
      );
  }

  // Remove item from cart
  removeCartItem(itemId: string): Observable<Cart> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.delete<CartResponse>(`${this.apiUrl}/cart/remove/${itemId}`, this.getAuthHeader())
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to remove item');
          }
          return response.cart;
        }),
        tap(cart => {
          this.cartSubject.next(cart);
        }),
        catchError(this.handleError)
      );
  }

  // Clear entire cart
  clearCart(): Observable<any> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.delete<CartResponse>(`${this.apiUrl}/cart/clear`, this.getAuthHeader())
      .pipe(
        map(response => {
          if (!response.success) {
            throw new Error(response.message || 'Failed to clear cart');
          }
          this.cartSubject.next(null);
          return response;
        }),
        catchError(this.handleError)
      );
  }

  // Get cart items count
  getCartItemsCount(): number {
    const cart = this.cartSubject.value;
    return cart?.totalItems || 0;
  }

  // Get cart total
  getCartTotal(): number {
    const cart = this.cartSubject.value;
    return cart?.totalPrice || 0;
  }

  // Get cart item count observable
  getCartItemCount(): Observable<number> {
    return new Observable<number>(observer => {
      this.cart$.subscribe(cart => {
        observer.next(cart?.totalItems || 0);
      });
    });
  }

  // Apply coupon (optional)
  applyCoupon(couponCode: string): Observable<any> {
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('User not authenticated'));
    }

    return this.http.put(`${this.apiUrl}/cart/apply-coupon`, { couponCode }, this.getAuthHeader())
      .pipe(
        catchError(this.handleError)
      );
  }

  // Helper to get product from cart item
  getProductFromItem(item: CartItem): any | null {
    if (typeof item.product === 'string') {
      return null;
    }
    return item.product;
  }

  // Helper to get product details
  getProductDetails(item: CartItem): {
    name: string;
    image: string;
    stock: number;
    sku: string;
    brand: string;
  } {
    const product = this.getProductFromItem(item);
    
    return {
      name: item.name || product?.name || 'Unknown Product',
      image: item.image || product?.images?.[0] || 'https://via.placeholder.com/150',
      stock: product?.stock || 0,
      sku: product?.sku || 'N/A',
      brand: item.brand || product?.brand || 'Unknown Brand'
    };
  }

  private clearLocalCart(): void {
    this.cartSubject.next(null);
  }
}