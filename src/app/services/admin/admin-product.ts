// src/app/services/admin-product.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminProductService {
  private http = inject(HttpClient);
  private apiUrl = 'https://backend-1-xkmk.onrender.com/api/admin';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('admin_token') || 
                  localStorage.getItem('access_token');
    
    console.log('🔑 Token used:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
    
    if (!token) {
      console.error('❌ No token found in localStorage!');
      console.log('Available localStorage keys:', Object.keys(localStorage));
    }
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token || ''}`
    });
  }

  // Get all products for admin - FIXED with headers
  getProducts(page: number = 1, limit: number = 10): Observable<any> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    console.log('📡 Calling GET products with headers');
    
    return this.http.get(`${this.apiUrl}/products`, { 
      params,
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // Get product by ID - FIXED
  getProductById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/products/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // Create product - Already has headers
  createProduct(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/products`, formData, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // Update product - FIXED
  updateProduct(id: string, formData: FormData): Observable<any> {
    return this.http.put(`${this.apiUrl}/products/${id}`, formData, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // Delete product - FIXED
  deleteProduct(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/products/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // Toggle product status - FIXED
  toggleProductStatus(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/products/${id}/toggle`, {}, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('❌ Admin Product Service Error:', error);
    
    if (error.status === 401) {
      console.error('💥 UNAUTHORIZED - Token invalid or missing');
      console.error('Check if token exists in localStorage');
      console.error('Token in localStorage:', localStorage.getItem('token'));
      
      // Clear invalid tokens
      localStorage.removeItem('token');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('access_token');
      
      // Redirect to login
      window.location.href = '/login';
    }
    
    return throwError(() => error.error?.message || 'An error occurred');
  }
}