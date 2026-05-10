// src/app/services/admin/admin-order.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminOrderService {
  private http = inject(HttpClient);
  private apiUrl = 'https://backend-1-xkmk.onrender.com/api/admin'; // Keep this based on your backend

  // Helper method to get auth headers with token
  private getAuthHeaders(): HttpHeaders {
    // Get token from localStorage (or wherever you store it)
    const token = this.getToken();
    
    if (token) {
      return new HttpHeaders({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      });
    }
    
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  // Method to retrieve token (adjust based on your auth setup)
  private getToken(): string | null {
    // Check localStorage
    const token = localStorage.getItem('token');
    
    if (!token) {
      // Check sessionStorage
      return sessionStorage.getItem('token');
    }
    
    return token;
  }

  // Get all orders with authentication
  getOrders(page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    const headers = this.getAuthHeaders();
    
    return this.http.get(`${this.apiUrl}/orders`, { params, headers })
      .pipe(
        tap(response => console.log('Admin Orders Response:', response)),
        catchError(this.handleError)
      );
  }

  // Get order by ID
  getOrder(orderId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/orders/${orderId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Update order status
  updateOrderStatus(orderId: string, statusData: { status: string; paymentStatus?: string }): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/orders/${orderId}/status`, statusData, { headers })
      .pipe(catchError(this.handleError));
  }

  // Delete order
  deleteOrder(orderId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/orders/${orderId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get order statistics
  getOrderStats(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/orders/stats`, { headers })
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('Admin Order Service Error:', error);
    
    let errorMessage = 'An error occurred';
    
    if (error.status === 401) {
      errorMessage = 'Unauthorized. Please login as admin.';
      // Redirect to login page
      this.redirectToLogin();
    } else if (error.status === 403) {
      errorMessage = 'Access forbidden. Admin privileges required.';
    } else if (error.error?.message) {
      errorMessage = error.error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }

  private redirectToLogin(): void {
    // Redirect to login page
    window.location.href = '/login';
  }
}