import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { Order, OrderItem } from '../../models/order.model';

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './orders.html',
  styleUrls: ['./orders.css']
})
export class OrderListComponent implements OnInit {
  orders: Order[] = [];
  isLoading = true;
  errorMessage: string | null = null;
  filterStatus = 'all'; // 'all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'
  sortBy = 'newest'; // 'newest', 'oldest', 'total'

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef  // Added ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.errorMessage = null;

    this.orderService.getOrders().subscribe({
      next: (response: any) => {
        this.orders = response.orders || [];
        this.isLoading = false;
        this.cdr.detectChanges(); // Manually trigger change detection
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.errorMessage = error.message || 'Failed to load orders';
        this.isLoading = false;
        this.cdr.detectChanges(); // Manually trigger change detection
      }
    });
  }

  getFilteredOrders(): Order[] {
    let filtered = [...this.orders];

    // Apply status filter
    if (this.filterStatus !== 'all') {
      filtered = filtered.filter(order => order.status === this.filterStatus);
    }

    // Apply sorting
    switch (this.sortBy) {
      case 'oldest':
        filtered.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'total':
        filtered.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return filtered;
  }

  // Add methods to handle filter/sort changes if needed
  onFilterChange(): void {
    this.cdr.detectChanges(); // Trigger change detection when filter changes
  }

  onSortChange(): void {
    this.cdr.detectChanges(); // Trigger change detection when sort changes
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

  cancelOrder(order: Order): void {
    if (!confirm(`Are you sure you want to cancel order #${order.orderId}?`)) {
      return;
    }

    if (order.status === 'cancelled') {
      alert('This order is already cancelled.');
      return;
    }

    if (order.status === 'delivered') {
      alert('Cannot cancel delivered order.');
      return;
    }

    this.orderService.cancelOrder(order.orderId).subscribe({
      next: (response: any) => {
        alert(response.message || 'Order cancelled successfully');
        // Update the specific order locally for immediate feedback
        const index = this.orders.findIndex(o => o.orderId === order.orderId);
        if (index !== -1) {
          this.orders[index].status = 'cancelled';
          this.cdr.detectChanges(); // Trigger change detection
        }
        // Optionally reload orders for full sync
        // this.loadOrders();
      },
      error: (error) => {
        console.error('Error cancelling order:', error);
        alert(error.message || 'Failed to cancel order');
        this.cdr.detectChanges(); // Trigger change detection on error
      }
    });
  }

  canCancelOrder(order: Order): boolean {
    return order.status !== 'cancelled' && order.status !== 'delivered';
  }

  getOrderItemCount(order: Order): number {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  viewOrderDetails(orderId: string): void {
    this.router.navigate(['/orders', orderId]);
  }

  trackOrder(order: Order): void {
    if (order.trackingNumber) {
      // In a real app, you would redirect to tracking service
      alert(`Tracking number: ${order.trackingNumber}`);
    } else {
      alert('Tracking number not available yet.');
    }
  }
}