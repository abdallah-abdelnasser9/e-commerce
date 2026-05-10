import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Product, ProductResponse } from '../models/product.model';
import { Category } from '../models/category.model';

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = 'https://backend-1-xkmk.onrender.com';

  constructor(private http: HttpClient) { }

  getProducts(page: number = 1, limit: number = 10, category?: string, search?: string): Observable<ProductResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (category) {
      params = params.set('category', category);
    }

    if (search) {
      params = params.set('search', search);
    }

    return this.http.get<ProductResponse>(`${this.apiUrl}/products`, { params });
  }

  getProduct(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products/${id}`);
  }

  getProductBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/products/slug/${slug}`);
  }

  getFeaturedProducts(): Observable<any> {
    // FIXED: Changed from '/products/featured/featured' to '/products/featured'
    return this.http.get<any>(`${this.apiUrl}/products/featured`);
  }

  getCategories(): Observable<{ categories: Category[] }> {
    return this.http.get<{ categories: Category[] }>(`${this.apiUrl}/categories`);
  }

  searchProducts(query: string): Observable<ProductResponse> {
    return this.getProducts(1, 10, undefined, query);
  }
}