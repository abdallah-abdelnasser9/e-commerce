// src/app/guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Redirect to login page with return URL
  const currentUrl = router.url;
  router.navigate(['/login'], { 
    queryParams: { returnUrl: currentUrl } 
  });
  return false;
};