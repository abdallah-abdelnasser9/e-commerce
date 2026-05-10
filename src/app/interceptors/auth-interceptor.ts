// src/app/interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('Auth Interceptor triggered for:', req.url);
  
  let token: string | null = null;
  
  // Check all possible token storage locations
  if (typeof window !== 'undefined' && window.localStorage) {
    token = localStorage.getItem('access_token') || 
            localStorage.getItem('admin_token') || 
            localStorage.getItem('token');
  }
  
  console.log('Token found:', !!token);
  
  if (token) {
    const cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('Authorization header added');
    return next(cloned);
  }
  
  console.log('No token found, proceeding without Authorization header');
  return next(req);
};