// src/app/services/auth.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { jwtDecode } from 'jwt-decode';
import { User } from '../models/user.model';

export interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  exp: number;
  iat: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'https://backend-1-xkmk.onrender.com';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    this.loadUserFromStorage();
  }

  private loadUserFromStorage(): void {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user: User = JSON.parse(userStr);
        if (user._id && !user.id) {
          user.id = user._id;
        } else if (user.id && !user._id) {
          user._id = user.id;
        }
        if (!user.addresses) {
          user.addresses = [];
        }
        if (!user.wishlist) {
          user.wishlist = [];
        }
        if (user.isActive === undefined) {
          user.isActive = true;
        }
        
        this.currentUserSubject.next(user);
      } catch (error) {
        this.clearAuthData();
      }
    }
  }

  // Add this method - it's an alias for isAuthenticated()
  isLoggedIn(): boolean {
    return this.isAuthenticated();
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, {
      name, email, password
    }).pipe(
      tap(response => {
        this.processAndSetUser(response.token, response.user);
      }),
      catchError(this.handleError)
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {
      email, password
    }).pipe(
      tap(response => {
        this.processAndSetUser(response.token, response.user);
      }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/']);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      const decoded = jwtDecode<JwtPayload>(token);
      const isExpired = decoded.exp * 1000 < Date.now();
      
      if (isExpired) {
        this.logout();
        return false;
      }
      
      return true;
    } catch {
      return false;
    }
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.role === 'admin' || false;
  }

  getUserRole(): string {
    const user = this.getCurrentUser();
    return user?.role || 'user';
  }

  updateProfile(data: { name?: string; phone?: string; avatar?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/profile`, data).pipe(
      tap((response: any) => {
        if (response.user) {
          this.updateUser(response.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  getFullProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/profile/full`).pipe(
      tap((response: any) => {
        if (response.user) {
          this.updateUser(response.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  updatePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/password`, {
      currentPassword,
      newPassword
    }).pipe(
      catchError(this.handleError)
    );
  }

  addAddress(address: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/addresses`, address).pipe(
      tap((response: any) => {
        if (response.user) {
          this.updateUser(response.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  updateAddress(addressId: string, address: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/auth/addresses/${addressId}`, address).pipe(
      tap((response: any) => {
        if (response.user) {
          this.updateUser(response.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  deleteAddress(addressId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/auth/addresses/${addressId}`).pipe(
      tap((response: any) => {
        if (response.user) {
          this.updateUser(response.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  setDefaultAddress(addressId: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/auth/addresses/${addressId}/default`, {}).pipe(
      tap((response: any) => {
        if (response.user) {
          this.updateUser(response.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  getWishlist(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/wishlist`).pipe(
      tap((response: any) => {
        if (response.user) {
          this.updateUser(response.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  addToWishlist(productId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/wishlist/${productId}`, {}).pipe(
      tap((response: any) => {
        if (response.user) {
          this.updateUser(response.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  removeFromWishlist(productId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/auth/wishlist/${productId}`).pipe(
      tap((response: any) => {
        if (response.user) {
          this.updateUser(response.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  uploadAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    return this.http.post(`${this.apiUrl}/auth/avatar`, formData).pipe(
      tap((response: any) => {
        if (response.user) {
          this.updateUser(response.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  refreshProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/profile`).pipe(
      tap((response: any) => {
        if (response.user) {
          this.updateUser(response.user);
        }
      }),
      catchError(this.handleError)
    );
  }

  private processAndSetUser(token: string, user: any): void {
    const processedUser: User = {
      _id: user._id || user.id || '',
      id: user.id || user._id || '',
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      phone: user.phone || '',
      avatar: user.avatar || '',
      addresses: user.addresses || [],
      wishlist: user.wishlist || [],
      isActive: user.isActive !== undefined ? user.isActive : true
    };
    
    this.setAuthData(token, processedUser);
  }

  private setAuthData(token: string, user: User): void {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private clearAuthData(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUserSubject.next(null);
  }

  private updateUser(user: any): void {
    const processedUser: User = {
      _id: user._id || user.id || '',
      id: user.id || user._id || '',
      name: user.name || '',
      email: user.email || '',
      role: user.role || 'user',
      phone: user.phone || '',
      avatar: user.avatar || '',
      addresses: user.addresses || [],
      wishlist: user.wishlist || [],
      isActive: user.isActive !== undefined ? user.isActive : true
    };
    
    localStorage.setItem('user', JSON.stringify(processedUser));
    this.currentUserSubject.next(processedUser);
  }

  private handleError(error: any): Observable<never> {
    console.error('Auth Service Error:', error);
    
    let errorMessage = 'An error occurred';
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
}