import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CartService } from '../../services/cart.service';
import { AuthService } from '../../services/auth.service';
import { Cart, CartItem } from '../../models/cart.model';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './cart.html',
  styleUrls: ['./cart.css']
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  isLoading = false;
  isLoggedIn = false;
  updatingItemId: string | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('CartComponent initialized');
    this.loadAuthStatus();
    this.loadCart();
  }

  loadAuthStatus(): void {
    this.authService.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
      this.cdr.detectChanges();
    });
  }

  loadCart(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.successMessage = null;
    this.cdr.detectChanges();
    
    this.cartService.loadCart().subscribe({
      next: () => {
        console.log('Cart loaded successfully');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading cart:', err);
        this.errorMessage = err.message || 'Failed to load cart';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });

    this.cartService.cart$.subscribe(cart => {
      console.log('Cart updated:', cart);
      this.cart = cart;
      this.cdr.detectChanges();
    });
  }

  onQuantityChange(item: CartItem, event: Event): void {
    const input = event.target as HTMLInputElement;
    const quantity = parseInt(input.value);
    
    if (isNaN(quantity) || quantity < 1) {
      input.value = item.quantity.toString();
      return;
    }
    
    this.updateQuantity(item, quantity);
  }

  updateQuantity(item: CartItem, quantity: number): void {
    if (quantity < 1 || quantity > 999 || quantity === item.quantity) {
      return;
    }
    
    this.updatingItemId = item._id;
    this.errorMessage = null;
    this.successMessage = null;
    this.cdr.detectChanges();
    
    this.cartService.updateCartItem(item._id, quantity).subscribe({
      next: () => {
        console.log('Quantity updated:', item._id, quantity);
        this.updatingItemId = null;
        this.successMessage = 'Quantity updated successfully';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error updating quantity:', err);
        this.errorMessage = err.message || 'Failed to update quantity';
        this.updatingItemId = null;
        this.cdr.detectChanges();
        this.loadCart();
      }
    });
  }

  removeItem(itemId: string): void {
    if (!confirm('Are you sure you want to remove this item from your cart?')) {
      return;
    }
    
    this.errorMessage = null;
    this.successMessage = null;
    this.cdr.detectChanges();
    
    this.cartService.removeCartItem(itemId).subscribe({
      next: () => {
        console.log('Item removed:', itemId);
        this.successMessage = 'Item removed from cart';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error removing item:', err);
        this.errorMessage = err.message || 'Failed to remove item';
        this.cdr.detectChanges();
      }
    });
  }

  clearCart(): void {
    if (!confirm('Are you sure you want to clear your entire cart?')) {
      return;
    }
    
    this.errorMessage = null;
    this.successMessage = null;
    this.cdr.detectChanges();
    
    this.cartService.clearCart().subscribe({
      next: () => {
        console.log('Cart cleared');
        this.cart = null;
        this.successMessage = 'Cart cleared successfully';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error clearing cart:', err);
        this.errorMessage = err.message || 'Failed to clear cart';
        this.cdr.detectChanges();
      }
    });
  }

  getSubtotal(): number {
    if (!this.cart?.items) return 0;
    const subtotal = this.cart.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    return parseFloat(subtotal.toFixed(2));
  }

  getShipping(): number {
    const subtotal = this.getSubtotal();
    // Free shipping for orders over $50
    return subtotal > 50 ? 0 : 10;
  }

  getTax(): number {
    const tax = this.getSubtotal() * 0.1;
    return parseFloat(tax.toFixed(2));
  }

  getTotal(): number {
    const total = this.getSubtotal() + this.getShipping() + this.getTax();
    return parseFloat(total.toFixed(2));
  }

  hasLowStockItems(): boolean {
    if (!this.cart?.items) return false;
    
    const hasLowStock = this.cart.items.some(item => {
      const product = this.cartService.getProductFromItem(item);
      return product?.stock && item.quantity > product.stock;
    });
    
    return hasLowStock;
  }

  // Helper methods to safely access product data
  getProductName(item: CartItem): string {
    return this.cartService.getProductDetails(item)?.name || 'Unknown Product';
  }

  getProductImage(item: CartItem): string {
    return this.cartService.getProductDetails(item)?.image || 'https://via.placeholder.com/100x100';
  }

  getProductStock(item: CartItem): number {
    return this.cartService.getProductDetails(item)?.stock || 0;
  }

  getProductSku(item: CartItem): string {
    return this.cartService.getProductDetails(item)?.sku || 'N/A';
  }

  getProductBrand(item: CartItem): string {
    return this.cartService.getProductDetails(item)?.brand || 'Unknown Brand';
  }

  getMaxQuantity(item: CartItem): number {
    const stock = this.getProductStock(item);
    return stock > 0 ? Math.min(stock, 999) : 0;
  }

  isItemAvailable(item: CartItem): boolean {
    return this.getProductStock(item) > 0;
  }

  proceedToCheckout(): void {
    if (!this.cart || this.cart.items.length === 0) {
      this.errorMessage = 'Your cart is empty';
      this.cdr.detectChanges();
      return;
    }
    
    // Check for low stock items
    if (this.hasLowStockItems()) {
      this.errorMessage = 'Some items in your cart have limited stock. Please adjust quantities before checkout.';
      this.cdr.detectChanges();
      return;
    }
    
    console.log('Proceeding to checkout');
    this.errorMessage = null;
    this.router.navigate(['/checkout']);
  }

  continueShopping(): void {
    console.log('Continuing shopping');
    this.router.navigate(['/products']);
  }

  getCartItemCount(): number {
    return this.cart?.items?.length || 0;
  }

  getEmptyCartMessage(): string {
    if (!this.isLoggedIn) {
      return 'Please login to view your cart';
    }
    return 'Your cart is empty. Start shopping!';
  }

  getCartSummary(): any {
    return {
      items: this.getCartItemCount(),
      subtotal: this.getSubtotal(),
      shipping: this.getShipping(),
      tax: this.getTax(),
      total: this.getTotal(),
      freeShipping: this.getShipping() === 0
    };
  }
}