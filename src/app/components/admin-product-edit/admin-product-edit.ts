// src/app/components/admin/products/product-edit/product-edit.component.ts
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminProductService } from '../../services/admin/admin-product';
import { AdminCategoryService } from '../../services/admin/admin-category';

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule, DatePipe],
  templateUrl: './admin-product-edit.html',
  styleUrls: ['./admin-product-edit.css']
})
export class ProductEditComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(AdminProductService);
  private categoryService = inject(AdminCategoryService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  
  product: any = null;
  categories: any[] = [];
  productForm: FormGroup;
  
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  keepImages: boolean[] = [];
  isSubmitting = false;
  isLoading = true;
  productId: string = '';
  successMessage = '';
  errorMessage = '';

  constructor() {
    this.productForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      category: ['', Validators.required],
      brand: [''],
      description: [''],
      price: [0, [Validators.required, Validators.min(0)]],
      discountPrice: [0, Validators.min(0)],
      stock: [0, [Validators.required, Validators.min(0)]],
      sku: [''],
      colors: [''],
      sizes: [''],
      isFeatured: [false],
      isActive: [true]
    });
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.productId = params['id'];
      console.log('Editing product ID:', this.productId);
      this.loadProduct();
      this.loadCategories();
    });
  }

  loadProduct() {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
    
    console.log('Loading product from API...');
    
    this.productService.getProductById(this.productId).subscribe({
      next: (response) => {
        console.log('API Response:', response);
        
        // Handle different response formats
        if (response.product) {
          this.product = response.product;
        } else if (response.data) {
          this.product = response.data;
        } else {
          this.product = response;
        }
        
        if (!this.product) {
          this.errorMessage = 'Product not found';
          this.isLoading = false;
          this.cdr.detectChanges();
          return;
        }
        
        console.log('Product loaded:', this.product);
        this.populateForm();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading product:', error);
        this.errorMessage = error.error?.message || 'Failed to load product';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        console.log('Categories response:', response);
        this.categories = response.categories || response.data || [];
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.cdr.detectChanges();
      }
    });
  }

  populateForm() {
    if (!this.product) return;

    console.log('Populating form with:', this.product);
    
    this.productForm.patchValue({
      name: this.product.name || '',
      category: this.product.category?._id || this.product.category || '',
      brand: this.product.brand || '',
      description: this.product.description || '',
      price: this.product.price || 0,
      discountPrice: this.product.discountPrice || 0,
      stock: this.product.stock || 0,
      sku: this.product.sku || '',
      colors: Array.isArray(this.product.colors) ? this.product.colors.join(', ') : (this.product.colors || ''),
      sizes: Array.isArray(this.product.sizes) ? this.product.sizes.join(', ') : (this.product.sizes || ''),
      isFeatured: !!this.product.isFeatured,
      isActive: this.product.isActive !== false
    });

    // Initialize keepImages array
    if (this.product.images && Array.isArray(this.product.images)) {
      this.keepImages = new Array(this.product.images.length).fill(true);
    } else {
      this.keepImages = [];
    }
    
    this.cdr.detectChanges();
  }

  toggleKeepImage(index: number, event: any) {
    if (index >= 0 && index < this.keepImages.length) {
      this.keepImages[index] = event.target.checked;
      this.cdr.detectChanges();
    }
  }

  onFileSelect(event: any) {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
          this.errorMessage = `File ${file.name} is not a supported image type`;
          this.cdr.detectChanges();
          continue;
        }

        this.selectedFiles.push(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviews.push(e.target.result);
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      }
    }
  }

  removeNewImage(index: number) {
    if (index >= 0 && index < this.selectedFiles.length) {
      this.selectedFiles.splice(index, 1);
      this.imagePreviews.splice(index, 1);
      this.cdr.detectChanges();
    }
  }

  onSubmit() {
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.detectChanges();
    
    if (this.productForm.invalid) {
      this.markFormGroupTouched(this.productForm);
      this.errorMessage = 'Please fill all required fields correctly';
      this.cdr.detectChanges();
      return;
    }

    this.isSubmitting = true;
    this.cdr.detectChanges();

    // Create FormData
    const formData = new FormData();
    const formValues = this.productForm.value;
    
    // Append basic fields
    formData.append('name', formValues.name);
    formData.append('category', formValues.category);
    formData.append('brand', formValues.brand || '');
    formData.append('description', formValues.description || '');
    formData.append('price', formValues.price.toString());
    formData.append('discountPrice', formValues.discountPrice.toString());
    formData.append('stock', formValues.stock.toString());
    formData.append('sku', formValues.sku || '');
    
    // Handle colors and sizes arrays
    if (formValues.colors) {
      const colorsArray = formValues.colors.split(',').map((c: string) => c.trim()).filter((c: string) => c);
      formData.append('colors', JSON.stringify(colorsArray));
    }
    
    if (formValues.sizes) {
      const sizesArray = formValues.sizes.split(',').map((s: string) => s.trim()).filter((s: string) => s);
      formData.append('sizes', JSON.stringify(sizesArray));
    }
    
    formData.append('isFeatured', formValues.isFeatured.toString());
    formData.append('isActive', formValues.isActive.toString());

    // Append keepImages
    const keptImages = [];
    if (this.product.images && Array.isArray(this.product.images)) {
      for (let i = 0; i < this.product.images.length; i++) {
        if (this.keepImages[i]) {
          keptImages.push(this.product.images[i]);
        }
      }
    }
    formData.append('keepImages', JSON.stringify(keptImages));

    // Append new images
    this.selectedFiles.forEach((file) => {
      formData.append('images', file, file.name);
    });

    console.log('Updating product...');
    
    // Submit
    this.productService.updateProduct(this.productId, formData).subscribe({
      next: (response) => {
        console.log('Update success:', response);
        this.successMessage = response.message || 'Product updated successfully!';
        this.isSubmitting = false;
        this.cdr.detectChanges();
        
        // Reload product data
        setTimeout(() => {
          this.loadProduct();
        }, 1000);
      },
      error: (error) => {
        console.error('Update error:', error);
        this.errorMessage = error.error?.message || 'Failed to update product';
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  deleteProduct() {
    if (!confirm(`Are you sure you want to delete "${this.product?.name}"?`)) {
      return;
    }
    
    this.isSubmitting = true;
    this.cdr.detectChanges();
    
    this.productService.deleteProduct(this.productId).subscribe({
      next: () => {
        this.successMessage = 'Product deleted successfully!';
        this.isSubmitting = false;
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.router.navigate(['/admin/products']);
        }, 1500);
      },
      error: (error) => {
        console.error('Delete error:', error);
        this.errorMessage = error.error?.message || 'Failed to delete product';
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancel() {
    this.router.navigate(['/admin/products']);
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}