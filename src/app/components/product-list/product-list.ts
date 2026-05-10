import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { combineLatestWith, debounceTime } from 'rxjs/operators';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './product-list.html',
  styleUrls: ['./product-list.css']
})
export class ProductListComponent implements OnInit {

  products: any[] = [];
  categories: any[] = [];
  isLoading = false;
  isLoggedIn = false;

  category = '';
  searchQuery = '';

  pagination = {
    page: 1,
    limit: 9,
    totalPages: 0
  };

  constructor(
    private productService: ProductService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
  console.log('ProductListComponent initialized');
  this.loadCategories();
  
  // Use combineLatest to handle both params and queryParams together
  this.route.params.pipe(
    combineLatestWith(this.route.queryParams),
    debounceTime(0) // Small debounce to prevent rapid calls
  ).subscribe(([params, queryParams]) => {
    this.category = params['category'] || '';
    this.searchQuery = queryParams['search'] || '';
    this.pagination.page = Number(queryParams['page']) || 1;
    
    console.log('Route params updated:', { 
      category: this.category, 
      search: this.searchQuery, 
      page: this.pagination.page 
    });
    
    this.loadProducts();
  });

  this.authService.currentUser$.subscribe(user => {
    this.isLoggedIn = !!user;
    this.cdr.detectChanges();
  });
}

  loadCategories(): void {
    this.productService.getCategories().subscribe({
      next: (res) => {
        this.categories = res.categories || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.cdr.detectChanges();

    this.productService.getProducts(
      this.pagination.page,
      this.pagination.limit,
      this.category,
      this.searchQuery
    ).subscribe({
      next: (res) => {
        console.log('Products loaded:', res);
        this.products = res.products || [];
        this.pagination.totalPages = res.totalPages || 1;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.products = [];
        this.pagination.totalPages = 0;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Helper method to get category name
  getCategoryName(): string {
    if (!this.category || !this.categories.length) {
      return this.category || '';
    }
    const foundCategory = this.categories.find(cat => cat.slug === this.category);
    return foundCategory ? foundCategory.name : this.category;
  }

 onCategoryChange(event: Event): void {
  const select = event.target as HTMLSelectElement;
  const category = select.value;
  
  console.log('Category changed to:', category);
  
  // If category is empty, navigate to base products page
  if (!category) {
    this.router.navigate(['/products'], {
      queryParams: { 
        page: 1,
        search: this.searchQuery || null 
      }
    });
  } else {
    // Navigate with category as route parameter
    this.router.navigate(['/products', 'category', category], {
      queryParams: { 
        page: 1,
        search: this.searchQuery || null 
      }
    });
  }
}

  onSearch(): void {
    console.log('Searching for:', this.searchQuery);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: this.searchQuery.trim() || null,
        page: 1
      },
      queryParamsHandling: 'merge'
    });
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.pagination.totalPages) return;
    
    console.log('Page changed to:', page);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  clearFilters(): void {
    console.log('Clearing filters');
    this.searchQuery = '';
    this.category = '';
    this.pagination.page = 1;
    
    this.router.navigate(['/products'], {
      queryParams: { page: 1 }
    });
  }

  addToCart(product: any): void {
    console.log('Adding to cart:', product.name);
    // Implement add to cart logic here
    alert(`${product.name} added to cart!`);
  }

  getPages(): number[] {
    return Array.from(
      { length: this.pagination.totalPages },
      (_, i) => i + 1
    );
  }
}