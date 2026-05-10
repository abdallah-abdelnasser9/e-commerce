// src/app/components/admin/categories/categories-manager.component.ts
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminCategoryService } from '../../services/admin/admin-category';

@Component({
  selector: 'app-categories-manager',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  templateUrl: './admin-category.html',
  styleUrls: ['./admin-category.css']
})
export class AdminCategoriesComponent implements OnInit {
  private categoryService = inject(AdminCategoryService);
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  
  categories: any[] = [];
  filteredCategories: any[] = [];
  isLoading = false;
  isSubmitting = false;
  showAddForm = false;
  isEditing = false;
  currentCategoryId = '';
  searchTerm = '';
  
  categoryForm: FormGroup;
  successMessage = '';
  errorMessage = '';

  constructor() {
    this.categoryForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      description: [''],
      isActive: [true],
      icon: [''],
      order: [0]
    });
  }

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.detectChanges();
    
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        if (response && (response.categories || response.data)) {
          this.categories = response.categories || response.data || [];
        } else {
          this.categories = response || [];
        }
        this.filteredCategories = [...this.categories];
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.errorMessage = 'Failed to load categories. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  searchCategories(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredCategories = [...this.categories];
      this.cdr.detectChanges();
      return;
    }

    const term = this.searchTerm.toLowerCase().trim();
    this.filteredCategories = this.categories.filter(category => {
      const name = category.name ? category.name.toLowerCase() : '';
      const description = category.description ? category.description.toLowerCase() : '';
      return name.includes(term) || description.includes(term);
    });
    this.cdr.detectChanges();
  }

  showAddCategoryForm(): void {
    this.showAddForm = true;
    this.isEditing = false;
    this.currentCategoryId = '';
    this.categoryForm.reset({
      name: '',
      description: '',
      isActive: true,
      icon: '',
      order: 0
    });
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  showEditCategoryForm(category: any): void {
    this.showAddForm = true;
    this.isEditing = true;
    this.currentCategoryId = category._id || '';
    
    this.categoryForm.patchValue({
      name: category.name || '',
      description: category.description || '',
      isActive: category.isActive !== false,
      icon: category.icon || '',
      order: category.order || 0
    });
    
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  cancelForm(): void {
    this.showAddForm = false;
    this.isEditing = false;
    this.currentCategoryId = '';
    this.categoryForm.reset();
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) {
      this.markFormGroupTouched(this.categoryForm);
      this.errorMessage = 'Please fill all required fields correctly';
      this.cdr.detectChanges();
      return;
    }

    this.isSubmitting = true;
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.detectChanges();

    const categoryData = this.categoryForm.value;

    if (this.isEditing && this.currentCategoryId) {
      this.categoryService.updateCategory(this.currentCategoryId, categoryData).subscribe({
        next: (response) => {
          const message = response && response.message ? response.message : 'Category updated successfully!';
          this.successMessage = message;
          this.isSubmitting = false;
          this.cancelForm();
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error updating category:', error);
          const message = error && error.error && error.error.message ? error.error.message : 'Failed to update category';
          this.errorMessage = message;
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.categoryService.createCategory(categoryData).subscribe({
        next: (response) => {
          const message = response && response.message ? response.message : 'Category created successfully!';
          this.successMessage = message;
          this.isSubmitting = false;
          this.cancelForm();
          this.loadCategories();
        },
        error: (error) => {
          console.error('Error creating category:', error);
          const message = error && error.error && error.error.message ? error.error.message : 'Failed to create category';
          this.errorMessage = message;
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  toggleCategoryStatus(category: any): void {
    const action = category.isActive ? 'deactivate' : 'activate';
    const name = category.name || 'this category';
    if (!confirm(`Are you sure you want to ${action} "${name}"?`)) {
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.categoryService.toggleCategoryStatus(category._id).subscribe({
      next: () => {
        this.loadCategories();
      },
      error: (error) => {
        console.error('Error toggling category status:', error);
        this.errorMessage = 'Failed to update category status';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteCategory(category: any): void {
    const name = category.name || 'this category';
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    this.isLoading = true;
    this.cdr.detectChanges();
    
    this.categoryService.deleteCategory(category._id).subscribe({
      next: () => {
        this.successMessage = 'Category deleted successfully!';
        this.loadCategories();
      },
      error: (error) => {
        console.error('Error deleting category:', error);
        const message = error && error.error && error.error.message ? error.error.message : 'Failed to delete category';
        this.errorMessage = message;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getCategoryIcon(category: any): string {
    if (category.icon && category.icon.trim() !== '') {
      return category.icon;
    }
    return 'fas fa-tag';
  }
}