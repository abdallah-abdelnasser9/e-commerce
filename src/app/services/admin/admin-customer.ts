// src/app/services/admin/admin-customer.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Customer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  isActive: boolean;
  role: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomerOrder {
  _id: string;
  orderNumber: string;
  totalAmount: number;
  status: string;
  paymentStatus: string;
  createdAt: Date;
}

export interface CustomerStats {
  totalOrders: number;
  totalSpent: number;
}

export interface CustomerResponse {
  success: boolean;
  customer: Customer;
  orders: CustomerOrder[];
  stats: CustomerStats;
}

export interface CustomersResponse {
  success: boolean;
  customers: Customer[];
  total: number;
  page: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class AdminCustomerService {
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

  // Get all customers with pagination and filters
  getCustomers(
    page: number = 1,
    limit: number = 10,
    search: string = '',
    status: string = ''
  ): Observable<CustomersResponse> {
    let url = `${this.apiUrl}/customers?page=${page}&limit=${limit}`;
    
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    
    if (status) {
      url += `&status=${status}`;
    }
    
    return this.http.get<CustomersResponse>(url, { headers: this.getHeaders() });
  }

  // Get single customer with orders and stats
  getCustomer(id: string): Observable<CustomerResponse> {
    return this.http.get<CustomerResponse>(`${this.apiUrl}/customers/${id}`, 
      { headers: this.getHeaders() });
  }

  // Toggle customer status (active/inactive)
  toggleCustomerStatus(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/customers/${id}/toggle`, {},
      { headers: this.getHeaders() });
  }

  // Update customer details
  updateCustomer(id: string, customerData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/customers/${id}`, customerData,
      { headers: this.getHeaders() });
  }

  // Delete customer
  deleteCustomer(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/customers/${id}`,
      { headers: this.getHeaders() });
  }

  // Get customer stats for dashboard
  getCustomerStats(): Observable<{ totalCustomers: number }> {
    return this.http.get<{ totalCustomers: number }>(`${this.apiUrl}/customers/stats`,
      { headers: this.getHeaders() });
  }
}