import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminCustomerService, Customer, CustomerOrder, CustomerStats } from '../../services/admin/admin-customer';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatePipe, CurrencyPipe],
  templateUrl: './admin-customer-detail.html',
  styleUrls: ['./admin-customer-detail.css']
})
export class CustomerDetailComponent implements OnInit {
  private customerService = inject(AdminCustomerService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  customer: Customer | null = null;
  orders: CustomerOrder[] = [];
  stats: CustomerStats = { totalOrders: 0, totalSpent: 0 };
  isLoading = false;
  isEditing = false;
  editData: any = {};

  ngOnInit() {
    console.log('CustomerDetailComponent initialized');
    this.loadCustomer();
    this.cdr.detectChanges();
  }

  loadCustomer() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.customerService.getCustomer(id).subscribe({
      next: (response) => {
        this.customer = response.customer;
        this.orders = response.orders;
        this.stats = response.stats;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading customer:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (this.isEditing && this.customer) {
      this.editData = {
        name: this.customer.name,
        email: this.customer.email,
        phone: this.customer.phone || '',
        address: this.customer.address || {
          street: '',
          city: '',
          state: '',
          country: '',
          zipCode: ''
        }
      };
    }
    this.cdr.detectChanges();
  }

  saveChanges() {
    if (!this.customer) return;

    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.customerService.updateCustomer(this.customer._id, this.editData).subscribe({
      next: (response) => {
        this.customer = response.customer;
        this.isEditing = false;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error updating customer:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelEdit() {
    this.isEditing = false;
    this.cdr.detectChanges();
  }

  toggleStatus() {
    if (!this.customer) return;

    if (confirm(`Are you sure you want to ${this.customer.isActive ? 'deactivate' : 'activate'} this customer?`)) {
      this.customerService.toggleCustomerStatus(this.customer._id).subscribe({
        next: (response) => {
          if (this.customer) {
            this.customer.isActive = !this.customer.isActive;
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error toggling status:', error);
          this.cdr.detectChanges();
        }
      });
    }
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

  viewOrder(orderId: string) {
    this.router.navigate(['/admin/orders', orderId]);
  }

  goBack() {
    this.router.navigate(['/admin/customers']);
  }
}