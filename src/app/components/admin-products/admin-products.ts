// src/app/components/admin/products/admin-products.component.ts
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminProductService } from '../../services/admin/admin-product';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './admin-products.html',
  styleUrls: ['./admin-products.css']
})
export class AdminProductsComponent implements OnInit {
  private productService = inject(AdminProductService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: any[] = [];
  currentPage = 1;
  totalPages = 1;
  totalProducts = 0;
  activeProducts = 0;
  featuredProducts = 0;
  lowStockProducts = 0;
  searchTerm = '';
  filterStatus = 'all';
  isLoading = false;

  ngOnInit() {
    this.loadProducts();
    this.cdr.detectChanges();
  }

  loadProducts() {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.productService.getProducts(this.currentPage).subscribe({
      next: (response: any) => {
        this.products = response.products || [];
        this.filteredProducts = [...this.products];
        this.totalPages = response.totalPages || 1;
        this.totalProducts = response.total || 0;
        this.calculateStats();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
        alert('Failed to load products');
      }
    });
  }

  calculateStats() {
    this.activeProducts = this.products.filter(p => p.isActive).length;
    this.featuredProducts = this.products.filter(p => p.isFeatured).length;
    this.lowStockProducts = this.products.filter(p => p.stock <= 10).length;
    this.cdr.detectChanges();
  }

  getCategoryName(category: any): string {
    if (!category) return 'No category';
    return typeof category === 'object' ? category.name : 'Unknown';
  }

  addProduct() {
    this.router.navigate(['/admin/products/new']);
  }

  editProduct(id: string) {
    this.router.navigate(['/admin/products/edit', id]);
  }

  viewProduct(slug: string) {
    window.open(`/products/${slug}`, '_blank');
  }

  toggleProductStatus(id: string, isActive: boolean) {
    const action = isActive ? 'deactivate' : 'activate';
    if (confirm(`Are you sure you want to ${action} this product?`)) {
      this.isLoading = true;
      this.cdr.detectChanges();
      
      this.productService.toggleProductStatus(id).subscribe({
        next: () => {
          this.loadProducts();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error toggling product status:', error);
          this.isLoading = false;
          this.cdr.detectChanges();
          alert('Failed to update product status');
        }
      });
    }
  }

  deleteProduct(id: string, name: string) {
    if (confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      this.isLoading = true;
      this.cdr.detectChanges();
      
      this.productService.deleteProduct(id).subscribe({
        next: () => {
          this.loadProducts();
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error deleting product:', error);
          this.isLoading = false;
          this.cdr.detectChanges();
          alert('Failed to delete product');
        }
      });
    }
  }

  searchProducts() {
    if (!this.searchTerm.trim()) {
      this.filteredProducts = [...this.products];
      this.cdr.detectChanges();
      return;
    }

    const searchTerm = this.searchTerm.toLowerCase();
    this.filteredProducts = this.products.filter(product =>
      product.name.toLowerCase().includes(searchTerm) ||
      (product.brand && product.brand.toLowerCase().includes(searchTerm)) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm))
    );
    this.cdr.detectChanges();
  }

  filterProducts(status: string) {
    this.filterStatus = status;
    
    switch(status) {
      case 'active':
        this.filteredProducts = this.products.filter(p => p.isActive);
        break;
      case 'inactive':
        this.filteredProducts = this.products.filter(p => !p.isActive);
        break;
      default:
        this.filteredProducts = [...this.products];
    }
    this.cdr.detectChanges();
  }

  getPageNumbers(): number[] {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(this.totalPages, start + maxVisible - 1);
    
    start = Math.max(1, end - maxVisible + 1);
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages && page !== this.currentPage) {
      this.currentPage = page;
      this.loadProducts();
      this.cdr.detectChanges();
    }
  }
}