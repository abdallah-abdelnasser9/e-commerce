// src/app/guards/admin.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated() && authService.isAdmin()) {
    return true;
  }

  // Check if user is authenticated but not admin
  if (authService.isAuthenticated()) {
    // User is logged in but not admin - redirect to home
    router.navigate(['/']);
  } else {
    // User is not logged in - redirect to login
    const currentUrl = router.url;
    router.navigate(['/login'], { 
      queryParams: { returnUrl: currentUrl } 
    });
  }
  
  return false;
};