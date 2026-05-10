// src/app/components/admin/products/product-add/product-add.component.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, FormControl } from '@angular/forms';
import { AdminProductService } from '../../services/admin/admin-product';
import { AdminCategoryService } from '../../services/admin/admin-category';

@Component({
  selector: 'app-product-add',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  template: `
    <div class="product-add">
      <div class="header">
        <h2>Add New Product</h2>
        <a routerLink="/admin/products" class="btn btn-secondary">
          <i class="fas fa-arrow-left"></i> Back to Products
        </a>
      </div>

      <div class="card">
        <div class="card-body">
          <!-- Success Message -->
          <div *ngIf="successMessage" class="alert alert-success alert-dismissible fade show" role="alert">
            {{ successMessage }}
            <button type="button" class="btn-close" (click)="successMessage = ''"></button>
          </div>

          <!-- Error Message -->
          <div *ngIf="errorMessage" class="alert alert-danger alert-dismissible fade show" role="alert">
            {{ errorMessage }}
            <button type="button" class="btn-close" (click)="errorMessage = ''"></button>
          </div>

          <form [formGroup]="productForm" (ngSubmit)="onSubmit()" enctype="multipart/form-data">
            <div class="row">
              <!-- Left Column -->
              <div class="col-md-8">
                <!-- Basic Information -->
                <div class="card mb-3">
                  <div class="card-header">
                    <h5 class="mb-0">Basic Information</h5>
                  </div>
                  <div class="card-body">
                    <div class="mb-3">
                      <label for="name" class="form-label">Product Name *</label>
                      <input type="text" class="form-control" id="name" formControlName="name"
                             [class.is-invalid]="productForm.get('name')?.invalid && productForm.get('name')?.touched">
                      <div *ngIf="productForm.get('name')?.invalid && productForm.get('name')?.touched" 
                           class="invalid-feedback">
                        Product name is required
                      </div>
                    </div>

                    <div class="row mb-3">
                      <div class="col-md-6">
                        <label for="category" class="form-label">Category *</label>
                        <select class="form-control" id="category" formControlName="category"
                                [class.is-invalid]="productForm.get('category')?.invalid && productForm.get('category')?.touched">
                          <option value="">Select Category</option>
                          <option *ngFor="let category of categories" [value]="category._id">
                            {{ category.name }}
                          </option>
                        </select>
                        <div *ngIf="productForm.get('category')?.invalid && productForm.get('category')?.touched" 
                             class="invalid-feedback">
                          Category is required
                        </div>
                      </div>
                      <div class="col-md-6">
                        <label for="brand" class="form-label">Brand</label>
                        <input type="text" class="form-control" id="brand" formControlName="brand">
                      </div>
                    </div>

                    <div class="mb-3">
                      <label for="description" class="form-label">Description</label>
                      <textarea class="form-control" id="description" formControlName="description" rows="4"></textarea>
                    </div>
                  </div>
                </div>

                <!-- Pricing -->
                <div class="card mb-3">
                  <div class="card-header">
                    <h5 class="mb-0">Pricing</h5>
                  </div>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-6">
                        <label for="price" class="form-label">Price ($) *</label>
                        <input type="number" class="form-control" id="price" formControlName="price"
                               step="0.01" min="0"
                               [class.is-invalid]="productForm.get('price')?.invalid && productForm.get('price')?.touched">
                        <div *ngIf="productForm.get('price')?.invalid && productForm.get('price')?.touched" 
                             class="invalid-feedback">
                          Valid price is required (min: 0)
                        </div>
                      </div>
                      <div class="col-md-6">
                        <label for="discountPrice" class="form-label">Discount Price ($)</label>
                        <input type="number" class="form-control" id="discountPrice" formControlName="discountPrice"
                               step="0.01" min="0">
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Inventory -->
                <div class="card mb-3">
                  <div class="card-header">
                    <h5 class="mb-0">Inventory</h5>
                  </div>
                  <div class="card-body">
                    <div class="row">
                      <div class="col-md-6">
                        <label for="stock" class="form-label">Stock Quantity *</label>
                        <input type="number" class="form-control" id="stock" formControlName="stock"
                               min="0"
                               [class.is-invalid]="productForm.get('stock')?.invalid && productForm.get('stock')?.touched">
                        <div *ngIf="productForm.get('stock')?.invalid && productForm.get('stock')?.touched" 
                             class="invalid-feedback">
                          Stock quantity is required (min: 0)
                        </div>
                      </div>
                      <div class="col-md-6">
                        <label for="sku" class="form-label">SKU</label>
                        <input type="text" class="form-control" id="sku" formControlName="sku">
                        <small class="text-muted">Leave blank to auto-generate</small>
                      </div>
                    </div>
                    <div class="row mt-2">
                      <div class="col-md-6">
                        <label for="lowStockThreshold" class="form-label">Low Stock Threshold</label>
                        <input type="number" class="form-control" id="lowStockThreshold" formControlName="lowStockThreshold"
                               min="1" value="10">
                        <small class="text-muted">Alert when stock reaches this level</small>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Specifications -->
                <div class="card mb-3">
                  <div class="card-header">
                    <h5 class="mb-0">Specifications</h5>
                    <small class="text-muted">Key-value pairs (e.g., Weight: 500g)</small>
                  </div>
                  <div class="card-body">
                    <div class="specifications">
                      <div *ngFor="let spec of specifications.controls; let i = index" class="mb-2">
                        <div class="row g-2">
                          <div class="col-md-5">
                            <input type="text" class="form-control" placeholder="Key (e.g., Material)" 
                                   [formControl]="getSpecControl(i, 'key')">
                          </div>
                          <div class="col-md-5">
                            <input type="text" class="form-control" placeholder="Value (e.g., Cotton)" 
                                   [formControl]="getSpecControl(i, 'value')">
                          </div>
                          <div class="col-md-2">
                            <button type="button" class="btn btn-danger btn-sm w-100" 
                                    (click)="removeSpecification(i)">
                              <i class="fas fa-trash"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                      <button type="button" class="btn btn-outline-secondary btn-sm" 
                              (click)="addSpecification()">
                        <i class="fas fa-plus"></i> Add Specification
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Right Column -->
              <div class="col-md-4">
                <!-- Images -->
                <div class="card mb-3">
                  <div class="card-header">
                    <h5 class="mb-0">Product Images *</h5>
                    <small class="text-muted">Upload at least one image</small>
                  </div>
                  <div class="card-body">
                    <div class="mb-3">
                      <label for="images" class="form-label">Upload Images (Max 5)</label>
                      <input type="file" class="form-control" id="images" 
                             multiple accept="image/*" (change)="onFileSelect($event)"
                             [class.is-invalid]="selectedFiles.length === 0 && formSubmitted">
                      <small class="text-muted">Supported: JPG, PNG, GIF, WEBP (Max 5MB each)</small>
                      <div *ngIf="selectedFiles.length > 0" class="mt-2">
                        <small>Selected: {{ selectedFiles.length }} file(s)</small>
                      </div>
                      <div *ngIf="selectedFiles.length === 0 && formSubmitted" class="text-danger">
                        At least one image is required
                      </div>
                    </div>

                    <!-- Image Preview -->
                    <div *ngIf="imagePreviews.length > 0" class="image-previews mt-3">
                      <h6>Preview:</h6>
                      <div class="row">
                        <div *ngFor="let preview of imagePreviews; let i = index" class="col-6 mb-2">
                          <div class="position-relative">
                            <img [src]="preview" class="img-fluid rounded" alt="Preview" style="height: 80px; object-fit: cover;">
                            <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0 m-1" 
                                    (click)="removeImage(i)">
                              <i class="fas fa-times"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Variants -->
                <div class="card mb-3">
                  <div class="card-header">
                    <h5 class="mb-0">Variants</h5>
                  </div>
                  <div class="card-body">
                    <div class="mb-3">
                      <label for="colors" class="form-label">Colors</label>
                      <input type="text" class="form-control" id="colors" formControlName="colors"
                             placeholder="Red, Blue, Green">
                      <small class="text-muted">Separate with commas</small>
                    </div>
                    <div class="mb-3">
                      <label for="sizes" class="form-label">Sizes</label>
                      <input type="text" class="form-control" id="sizes" formControlName="sizes"
                             placeholder="S, M, L, XL">
                      <small class="text-muted">Separate with commas</small>
                    </div>
                  </div>
                </div>

                <!-- Update the template section for features: -->
<div class="features">
  <div *ngFor="let feature of features.controls; let i = index" class="mb-2">
    <div class="input-group">
      <input type="text" class="form-control" placeholder="Feature (e.g., Waterproof)" 
             [formControlName]="i">
      <button type="button" class="btn btn-danger" 
              (click)="removeFeature(i)">
        <i class="fas fa-trash"></i>
      </button>
    </div>
  </div>
  <button type="button" class="btn btn-outline-secondary btn-sm" 
          (click)="addFeature()">
    <i class="fas fa-plus"></i> Add Feature
  </button>
</div>
                <!-- Status -->
                <div class="card">
                  <div class="card-header">
                    <h5 class="mb-0">Product Status</h5>
                  </div>
                  <div class="card-body">
                    <div class="form-check mb-2">
                      <input class="form-check-input" type="checkbox" id="isFeatured" 
                             formControlName="isFeatured">
                      <label class="form-check-label" for="isFeatured">
                        Featured Product
                      </label>
                    </div>
                    <div class="form-check">
                      <input class="form-check-input" type="checkbox" id="isActive" 
                             formControlName="isActive" checked>
                      <label class="form-check-label" for="isActive">
                        Active (Visible to customers)
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Submit Button -->
            <div class="mt-4 border-top pt-3">
              <button type="submit" class="btn btn-primary btn-lg" [disabled]="isSubmitting">
                <i class="fas fa-plus me-2"></i>
                <span *ngIf="!isSubmitting">Create Product</span>
                <span *ngIf="isSubmitting">
                  <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating...
                </span>
              </button>
              <button type="button" class="btn btn-outline-secondary btn-lg ms-2" (click)="cancel()">
                <i class="fas fa-times me-2"></i>
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .product-add {
      padding: 20px 0;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    .image-previews img {
      width: 100%;
      height: 80px;
      object-fit: cover;
    }
    .invalid-feedback {
      display: block;
    }
    .features .input-group {
      margin-bottom: 5px;
    }
    .specifications .row {
      align-items: center;
    }
  `]
})
export class ProductAddComponent implements OnInit {
  private fb = inject(FormBuilder);
  private productService = inject(AdminProductService);
  private categoryService = inject(AdminCategoryService);
  private router = inject(Router);
  
  productForm: FormGroup;
  categories: any[] = [];
  selectedFiles: File[] = [];
  imagePreviews: string[] = [];
  isSubmitting = false;
  formSubmitted = false;
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
      lowStockThreshold: [10, [Validators.required, Validators.min(1)]],
      sku: [''],
      colors: [''],
      sizes: [''],
      isFeatured: [false],
      isActive: [true],
      specifications: this.fb.array([]),
      features: this.fb.array([])
    });

    // Initialize with one empty specification and feature
    this.addSpecification();
    this.addFeature();
  }

  ngOnInit() {
    this.loadCategories();
  }

  get specifications(): FormArray {
    return this.productForm.get('specifications') as FormArray;
  }

  get features(): FormArray {
    return this.productForm.get('features') as FormArray;
  }

  getSpecControl(index: number, controlName: string): FormControl {
    const specGroup = this.specifications.at(index) as FormGroup;
    return specGroup.get(controlName) as FormControl;
  }

  addSpecification() {
    const specGroup = this.fb.group({
      key: ['', Validators.required],
      value: ['', Validators.required]
    });
    this.specifications.push(specGroup);
  }

  removeSpecification(index: number) {
    if (this.specifications.length > 1) {
      this.specifications.removeAt(index);
    }
  }

  addFeature() {
    this.features.push(this.fb.control('', Validators.required));
  }

  removeFeature(index: number) {
    if (this.features.length > 1) {
      this.features.removeAt(index);
    }
  }

  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (response) => {
        this.categories = response.categories || [];
        if (this.categories.length === 0) {
          this.errorMessage = 'No categories found. Please create categories first.';
        }
      },
      error: (error) => {
        console.error('Error loading categories:', error);
        this.errorMessage = 'Failed to load categories. Please try again.';
      }
    });
  }

  onFileSelect(event: any) {
    const files = event.target.files;
    if (files) {
      // Clear previous selections if needed
      if (this.selectedFiles.length + files.length > 5) {
        this.errorMessage = 'Maximum 5 images allowed';
        return;
      }

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          this.errorMessage = `File ${file.name} is too large. Max size is 5MB.`;
          continue;
        }

        // Validate file type
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
        if (!validTypes.includes(file.type)) {
          this.errorMessage = `File ${file.name} is not a supported image type.`;
          continue;
        }

        this.selectedFiles.push(file);
        
        // Create preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagePreviews.push(e.target.result);
        };
        reader.readAsDataURL(file);
      }
      
      // Clear error if files were added successfully
      if (files.length > 0 && this.errorMessage.includes('File')) {
        this.errorMessage = '';
      }
    }
  }

  removeImage(index: number) {
    this.selectedFiles.splice(index, 1);
    this.imagePreviews.splice(index, 1);
  }

  onSubmit() {
    this.formSubmitted = true;
    
    // Reset messages
    this.successMessage = '';
    this.errorMessage = '';

    // Validate form
    if (this.productForm.invalid) {
      this.markFormGroupTouched(this.productForm);
      this.errorMessage = 'Please fill all required fields correctly.';
      return;
    }

    // Validate images
    if (this.selectedFiles.length === 0) {
      this.errorMessage = 'Please upload at least one product image.';
      return;
    }

    this.isSubmitting = true;

    // Create FormData
    const formData = new FormData();
    
    // Append basic fields
    const formValues = this.productForm.value;
    
    formData.append('name', formValues.name);
    formData.append('category', formValues.category);
    if (formValues.brand) formData.append('brand', formValues.brand);
    if (formValues.description) formData.append('description', formValues.description);
    formData.append('price', formValues.price.toString());
    if (formValues.discountPrice && formValues.discountPrice > 0) {
      formData.append('discountPrice', formValues.discountPrice.toString());
    }
    formData.append('stock', formValues.stock.toString());
    formData.append('lowStockThreshold', formValues.lowStockThreshold.toString());
    if (formValues.sku) formData.append('sku', formValues.sku);
    
    // Process colors and sizes
    if (formValues.colors) {
      formData.append('colors', formValues.colors);
    }
    if (formValues.sizes) {
      formData.append('sizes', formValues.sizes);
    }

    // Process specifications - convert to Map format for backend
    const specificationsObj: { [key: string]: string } = {};
    
    // Fix: Properly type the specGroup and ensure it's a FormGroup
    this.specifications.controls.forEach((control) => {
      if (control instanceof FormGroup) {
        const specGroup = control as FormGroup;
        const key = specGroup.get('key')?.value;
        const value = specGroup.get('value')?.value;
        
        // Only add if both key and value are provided
        if (key && value && typeof key === 'string' && typeof value === 'string') {
          specificationsObj[key] = value;
        }
      }
    });
    
    if (Object.keys(specificationsObj).length > 0) {
      formData.append('specifications', JSON.stringify(specificationsObj));
    }

    // Process features
    const featuresArray: string[] = [];
    this.features.controls.forEach((control) => {
      const featureValue = control.value;
      if (featureValue && typeof featureValue === 'string' && featureValue.trim() !== '') {
        featuresArray.push(featureValue.trim());
      }
    });
    
    if (featuresArray.length > 0) {
      // Convert to comma-separated string as expected by backend
      formData.append('features', featuresArray.join(','));
    }

    // Append status fields
    formData.append('isFeatured', formValues.isFeatured.toString());
    formData.append('isActive', formValues.isActive.toString());

    // Append images
    this.selectedFiles.forEach((file, index) => {
      formData.append('images', file, file.name);
    });

    // Log FormData contents for debugging
    console.log('FormData being sent:');
    for (let pair of (formData as any).entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    // Submit
    this.productService.createProduct(formData).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'Product created successfully!';
        this.isSubmitting = false;
        
        // Redirect after 2 seconds
        setTimeout(() => {
          this.router.navigate(['/admin/products']);
        }, 2000);
      },
      error: (error) => {
        console.error('Error creating product:', error);
        
        // Extract error message
        let errorMsg = 'Failed to create product. ';
        if (error.error?.message) {
          errorMsg += error.error.message;
        } else if (error.message) {
          errorMsg += error.message;
        } else {
          errorMsg += 'Please check your connection and try again.';
        }
        
        this.errorMessage = errorMsg;
        this.isSubmitting = false;
      }
    });
  }

  cancel() {
    if (confirm('Are you sure you want to cancel? Any unsaved changes will be lost.')) {
      this.router.navigate(['/admin/products']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup) {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        (control as FormArray).controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          } else {
            arrayControl.markAsTouched();
          }
        });
      }
    });
  }
}