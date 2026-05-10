import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminCustomerService, Customer } from '../../services/admin/admin-customer';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, DatePipe],
  templateUrl: './admin-customer-list.html',
  styleUrls: ['./admin-customer-list.css']
})
export class CustomerListComponent implements OnInit {
  private customerService = inject(AdminCustomerService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  Math = Math;
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  isLoading = false;
  isDeleting = false;
  
  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  
  // Filters
  searchTerm = '';
  statusFilter = '';
  
  // Status options
  statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' }
  ];
  
  // Modal state
  showDeleteModal = false;
  customerToDelete: Customer | null = null;

  ngOnInit() {
    console.log('CustomerListComponent initialized');
    this.loadCustomers();
    this.cdr.detectChanges();
  }

  loadCustomers() {
    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.customerService.getCustomers(
      this.currentPage,
      this.itemsPerPage,
      this.searchTerm,
      this.statusFilter
    ).subscribe({
      next: (response) => {
        this.customers = response.customers;
        this.filteredCustomers = [...this.customers];
        this.totalItems = response.total;
        this.totalPages = response.totalPages;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadCustomers();
    this.cdr.detectChanges();
  }

  onStatusChange() {
    this.currentPage = 1;
    this.loadCustomers();
    this.cdr.detectChanges();
  }

  clearFilters() {
    this.searchTerm = '';
    this.statusFilter = '';
    this.currentPage = 1;
    this.loadCustomers();
    this.cdr.detectChanges();
  }

  toggleCustomerStatus(customer: Customer) {
    if (confirm(`Are you sure you want to ${customer.isActive ? 'deactivate' : 'activate'} this customer?`)) {
      this.customerService.toggleCustomerStatus(customer._id).subscribe({
        next: (response) => {
          customer.isActive = !customer.isActive;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error toggling customer status:', error);
          this.cdr.detectChanges();
        }
      });
    }
  }

  openDeleteModal(customer: Customer) {
    this.customerToDelete = customer;
    this.showDeleteModal = true;
    this.cdr.detectChanges();
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.customerToDelete = null;
    this.cdr.detectChanges();
  }

  confirmDelete() {
    if (!this.customerToDelete) return;

    this.isDeleting = true;
    this.cdr.detectChanges();
    
    this.customerService.deleteCustomer(this.customerToDelete._id).subscribe({
      next: () => {
        this.loadCustomers();
        this.closeDeleteModal();
        this.isDeleting = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error deleting customer:', error);
        alert(error.error?.message || 'Error deleting customer');
        this.isDeleting = false;
        this.cdr.detectChanges();
      }
    });
  }

  editCustomer(customer: Customer) {
    this.router.navigate(['/admin/customers', customer._id]);
  }

  viewCustomer(customer: Customer) {
    this.router.navigate(['/admin/customers', customer._id]);
  }

  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadCustomers();
      this.cdr.detectChanges();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadCustomers();
      this.cdr.detectChanges();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadCustomers();
      this.cdr.detectChanges();
    }
  }

  get pagesArray(): number[] {
    const pages = [];
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  }
}