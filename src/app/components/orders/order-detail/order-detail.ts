import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { OrderService } from '../../../services/order.service';
import { AuthService } from '../../../services/auth.service';
import { Order, OrderItem } from '../../../models/order.model';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './order-detail.html',
  styleUrls: ['./order-detail.css']
})
export class OrderDetailComponent implements OnInit {
  order: Order | null = null;
  isLoading = true;
  errorMessage: string | null = null;
  orderId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef // Added ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.orderId = params['orderId'];
      this.loadOrder();
    });
  }

  loadOrder(): void {
    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.detectChanges(); // Trigger change detection for loading state

    this.orderService.getOrder(this.orderId).subscribe({
      next: (response: any) => {
        this.order = response.order;
        this.isLoading = false;
        this.cdr.detectChanges(); // Trigger change detection after data loads
      },
      error: (error) => {
        console.error('Error loading order:', error);
        this.errorMessage = error.message || 'Order not found';
        this.isLoading = false;
        this.cdr.detectChanges(); // Trigger change detection on error
      }
    });
  }

  getDeliveredAt(): string | null {
    if (!this.order) return null;
    return (this.order as any).deliveredAt || null;
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  cancelOrder(): void {
    if (!this.order) return;

    if (!confirm(`Are you sure you want to cancel order #${this.order.orderId}?`)) {
      return;
    }

    if (this.order.status === 'cancelled') {
      alert('This order is already cancelled.');
      return;
    }

    if (this.order.status === 'delivered') {
      alert('Cannot cancel delivered order.');
      return;
    }

    // Update local state optimistically for better UX
    const originalStatus = this.order.status;
    this.order.status = 'cancelled';
    this.cdr.detectChanges(); // Immediate UI update

    this.orderService.cancelOrder(this.order.orderId).subscribe({
      next: (response: any) => {
        alert(response.message || 'Order cancelled successfully');
        // Reload order details to ensure consistency
        this.loadOrder();
      },
      error: (error) => {
        console.error('Error cancelling order:', error);
        // Revert to original status on error
        if (this.order) {
          this.order.status = originalStatus;
        }
        alert(error.message || 'Failed to cancel order');
        this.cdr.detectChanges(); // Trigger change detection on error
      }
    });
  }

  canCancelOrder(): boolean {
    if (!this.order) return false;
    return this.order.status !== 'cancelled' && this.order.status !== 'delivered';
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'pending':
        return 'badge bg-warning';
      case 'processing':
        return 'badge bg-info';
      case 'shipped':
        return 'badge bg-primary';
      case 'delivered':
        return 'badge bg-success';
      case 'cancelled':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }

  getStatusText(status: string): string {
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  getPaymentStatusBadgeClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'badge bg-success';
      case 'pending':
        return 'badge bg-warning';
      case 'failed':
        return 'badge bg-danger';
      case 'refunded':
        return 'badge bg-info';
      default:
        return 'badge bg-secondary';
    }
  }

  getPaymentMethodIcon(method: string): string {
    switch (method) {
      case 'paypal':
        return 'fab fa-paypal';
      case 'cod':
        return 'fas fa-money-bill-wave';
      case 'card':
        return 'fas fa-credit-card';
      default:
        return 'fas fa-money-bill';
    }
  }

  getOrderItemCount(): number {
    if (!this.order) return 0;
    return this.order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  getTotalPrice(): number {
    if (!this.order) return 0;
    return this.order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  trackOrder(): void {
    if (!this.order?.trackingNumber) {
      alert('Tracking number not available yet.');
      return;
    }
    
    // In a real app, you would redirect to tracking service
    alert(`Tracking number: ${this.order.trackingNumber}\n\nTracking link will be available when carrier provides it.`);
  }

  printOrder(): void {
    // Add a small delay to ensure DOM is ready
    setTimeout(() => {
      window.print();
    }, 100);
  }

  reorder(): void {
    if (!this.order) return;
    
    // Show loading state
    this.isLoading = true;
    this.cdr.detectChanges();
    
    // Simulate API call to add items to cart
    setTimeout(() => {
      alert('All items from this order have been added to your cart.');
      this.isLoading = false;
      this.cdr.detectChanges();
      this.router.navigate(['/cart']);
    }, 500);
  }

  contactSupport(): void {
    this.router.navigate(['/chat']);
  }

  // Helper method to extract error message
  getErrorMessage(): string {
    if (this.errorMessage?.includes('404')) {
      return 'Order not found. Please check the order ID.';
    }
    if (this.errorMessage?.includes('401') || this.errorMessage?.includes('403')) {
      return 'You are not authorized to view this order.';
    }
    return this.errorMessage || 'An unexpected error occurred.';
  }

  // Method to retry loading the order
  retryLoadOrder(): void {
    this.errorMessage = null;
    this.loadOrder();
  }
}