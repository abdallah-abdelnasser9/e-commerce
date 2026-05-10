import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminOrderService } from '../../services/admin/admin-order';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe, CurrencyPipe],
  templateUrl: './admin-orders.html',
  styleUrls: ['./admin-orders.css']
})
export class AdminOrdersComponent implements OnInit {
  private orderService = inject(AdminOrderService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  
  orders: any[] = [];
  filteredOrders: any[] = [];
  currentPage = 1;
  totalPages = 1;
  totalOrders = 0;
  completedOrders = 0;
  pendingOrders = 0;
  totalRevenue = 0;
  searchTerm = '';
  filterStatus = 'all';
  startDate = '';
  endDate = '';
  isLoading = false;

  ngOnInit() {
    console.log('AdminOrdersComponent initialized');
    this.loadOrders();
    this.cdr.detectChanges();
  }

  loadOrders() {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.orderService.getOrders(this.currentPage).subscribe({
      next: (response) => {
        console.log('Orders loaded:', response);
        this.orders = response.orders || [];
        this.filteredOrders = [...this.orders];
        this.totalPages = response.totalPages || 1;
        this.totalOrders = response.total || 0;
        this.calculateStats();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading orders:', error);
        this.orders = [];
        this.filteredOrders = [];
        this.loadMockOrders();
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadMockOrders() {
    // Mock data for testing
    this.orders = [
      { 
        orderId: 'ORD-001', 
        user: { name: 'John Doe', email: 'john@example.com' }, 
        createdAt: new Date(), 
        items: [{name: 'Product 1'}, {name: 'Product 2'}], 
        totalAmount: 199.99, 
        status: 'delivered', 
        paymentStatus: 'completed', 
        paymentMethod: 'PayPal' 
      },
      { 
        orderId: 'ORD-002', 
        user: { name: 'Jane Smith', email: 'jane@example.com' }, 
        createdAt: new Date(Date.now() - 86400000), 
        items: [{name: 'Product 3'}], 
        totalAmount: 89.50, 
        status: 'processing', 
        paymentStatus: 'pending', 
        paymentMethod: 'Credit Card' 
      },
      { 
        orderId: 'ORD-003', 
        user: { name: 'Bob Johnson', email: 'bob@example.com' }, 
        createdAt: new Date(Date.now() - 172800000), 
        items: [{name: 'Product 4'}, {name: 'Product 5'}], 
        totalAmount: 250.00, 
        status: 'shipped', 
        paymentStatus: 'completed', 
        paymentMethod: 'PayPal' 
      }
    ];
    this.filteredOrders = [...this.orders];
    this.totalOrders = this.orders.length;
    this.calculateStats();
  }

  calculateStats() {
    this.completedOrders = this.orders.filter(o => o.status === 'delivered').length;
    this.pendingOrders = this.orders.filter(o => o.status === 'pending').length;
    this.totalRevenue = this.orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    this.cdr.detectChanges();
  }

  getStatusBadgeClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'pending': return 'bg-warning';
      case 'processing': return 'bg-info';
      case 'shipped': return 'bg-primary';
      case 'delivered': return 'bg-success';
      case 'cancelled': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }

  getPaymentStatusBadgeClass(status: string): string {
    switch(status?.toLowerCase()) {
      case 'completed': return 'bg-success';
      case 'pending': return 'bg-warning';
      case 'failed': return 'bg-danger';
      case 'refunded': return 'bg-info';
      default: return 'bg-secondary';
    }
  }

  getOrderDate(order: any): Date {
    return order.createdAt ? new Date(order.createdAt) : new Date();
  }

  getOrderItemsCount(order: any): number {
    return order.items?.length || 0;
  }

  getOrderCustomerName(order: any): string {
    return order.user?.name || 'Guest';
  }

  getOrderCustomerEmail(order: any): string {
    return order.user?.email || 'No email';
  }

  getOrderTotal(order: any): number {
    return order.totalAmount || 0;
  }

  viewOrder(orderId: string) {
    console.log('Viewing order:', orderId);
    this.router.navigate(['/admin/orders', orderId]);
  }

  updateOrderStatus(order: any) {
    const newStatus = prompt('Enter new status (pending, processing, shipped, delivered, cancelled):', order.status);
    if (newStatus && ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(newStatus.toLowerCase())) {
      this.orderService.updateOrderStatus(order.orderId, { status: newStatus }).subscribe({
        next: () => {
          alert('Order status updated');
          this.loadOrders();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error updating order status:', error);
          alert('Failed to update order status');
          this.cdr.detectChanges();
        }
      });
    }
  }

  deleteOrder(orderId: string, customerName: string) {
    if (confirm(`Are you sure you want to delete order #${orderId} for ${customerName || 'customer'}? This action cannot be undone.`)) {
      this.orderService.deleteOrder(orderId).subscribe({
        next: () => {
          alert('Order deleted successfully');
          this.loadOrders();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error deleting order:', error);
          alert('Failed to delete order');
          this.cdr.detectChanges();
        }
      });
    }
  }

  searchOrders() {
    if (!this.searchTerm.trim()) {
      this.filteredOrders = [...this.orders];
      this.cdr.detectChanges();
      return;
    }

    const searchTerm = this.searchTerm.toLowerCase();
    this.filteredOrders = this.orders.filter(order =>
      order.orderId?.toLowerCase().includes(searchTerm) ||
      order.user?.name?.toLowerCase().includes(searchTerm) ||
      order.user?.email?.toLowerCase().includes(searchTerm)
    );
    this.cdr.detectChanges();
  }

  filterOrders(status: string) {
    this.filterStatus = status;
    
    if (status === 'all') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(order => order.status?.toLowerCase() === status.toLowerCase());
    }
    this.cdr.detectChanges();
  }

  filterByDate() {
    if (!this.startDate && !this.endDate) {
      this.filteredOrders = [...this.orders];
      this.cdr.detectChanges();
      return;
    }

    const start = this.startDate ? new Date(this.startDate) : null;
    const end = this.endDate ? new Date(this.endDate) : null;

    this.filteredOrders = this.orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      
      if (start && end) {
        return orderDate >= start && orderDate <= end;
      } else if (start) {
        return orderDate >= start;
      } else if (end) {
        return orderDate <= end;
      }
      return true;
    });
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
      this.loadOrders();
      this.cdr.detectChanges();
    }
  }

  getStatsSummary() {
    return {
      total: this.totalOrders,
      completed: this.completedOrders,
      pending: this.pendingOrders,
      revenue: this.totalRevenue
    };
  }
}