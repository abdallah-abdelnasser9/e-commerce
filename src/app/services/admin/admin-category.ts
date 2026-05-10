// src/app/services/admin-category.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminCategoryService {
  private http = inject(HttpClient);
  private apiUrl = 'https://backend-1-xkmk.onrender.com/api/admin';

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || 
                  localStorage.getItem('admin_token') || 
                  localStorage.getItem('access_token');
    
    return new HttpHeaders({
      'Authorization': `Bearer ${token || ''}`
    });
  }

  // Get all categories - FIXED
  getCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // Get category by ID - FIXED
  getCategory(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // Create category - FIXED
  createCategory(categoryData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/categories`, categoryData, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // Update category - FIXED
  updateCategory(id: string, categoryData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/categories/${id}`, categoryData, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // Delete category - FIXED
  deleteCategory(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/categories/${id}`, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  // Toggle category status - FIXED
  toggleCategoryStatus(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/categories/${id}/toggle`, {}, { 
      headers: this.getHeaders() 
    }).pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('❌ Admin Category Service Error:', error);
    return throwError(() => error.error?.message || 'An error occurred');
  }
}