import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css']
})
export class HomeComponent implements OnInit {
  featuredProducts: any[] = [];
  newArrivals: any[] = [];
  categories: any[] = [];
  isLoading = false;
  isLoggedIn = false;
  router: any;

  constructor(
    private productService: ProductService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('HomeComponent initialized');
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      
      if (user?.role === 'admin') {
        // Redirect admin users to admin dashboard
        this.router.navigate(['/admin/dashboard']);
        return; // Don't load data if redirecting
      }
    }
    
    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    // Subscribe to auth state
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.cdr.detectChanges();
    });

    // Load featured products
    this.productService.getFeaturedProducts().subscribe({
      next: (res) => {
        console.log('Featured products loaded:', res);
        this.featuredProducts = res.products || res || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading featured products:', error);
        this.featuredProducts = [];
        this.cdr.detectChanges();
      }
    });

    // Load new arrivals
    this.productService.getProducts(1, 8).subscribe({
      next: (res) => {
        console.log('New arrivals loaded:', res);
        this.newArrivals = res.products || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading new arrivals:', error);
        this.newArrivals = [];
        this.cdr.detectChanges();
      }
    });

    // Load categories
    this.productService.getCategories().subscribe({
      next: (res) => {
        console.log('Categories loaded:', res);
        this.categories = res.categories || res || [];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.categories = [];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  addToCart(product: any): void {
    console.log('Adding to cart:', product.name);
    alert(`${product.name} added to cart!`);
  }

  addToWishlist(product: any): void {
    console.log('Adding to wishlist:', product.name);
    alert(`${product.name} added to wishlist!`);
  }

  getLimitedCategories(): any[] {
    return this.categories.slice(0, 6);
  }

  getLimitedFeaturedProducts(): any[] {
    return this.featuredProducts.slice(0, 6);
  }

  getLimitedNewArrivals(): any[] {
    return this.newArrivals.slice(0, 6);
  }

  getProductImage(product: any): string {
    return product.images?.[0] || 'https://via.placeholder.com/300x200';
  }

  getProductPrice(product: any): string {
    if (product.discountPrice) {
      return `$${product.discountPrice} <span class="text-danger text-decoration-line-through small">$${product.price}</span>`;
    }
    return `$${product.price || 0}`;
  }
}