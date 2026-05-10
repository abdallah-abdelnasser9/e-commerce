import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ProductService } from '../../services/product.service';
import { CartService } from '../../services/cart.service';
import { ReviewService } from '../../services/review.service';
import { AuthService } from '../../services/auth.service';
import { Product } from '../../models/product.model';
import { Review } from '../../models/review.model';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.css']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  reviews: Review[] = [];
  isLoading = true;
  isSubmittingReview = false;
  isLoadingReviews = false;
  selectedImage: string = '';
  selectedColor: string = '';
  selectedSize: string = '';
  quantity = 1;
  errorMessage: string = '';
  successMessage: string = '';
  reviewImages: string[] = [];
  reviewForm!: FormGroup;
  isLoggedIn = false;
  currentUserId: string | null = null;
  showReviewForm = false;

  @ViewChild('imageInput') imageInput!: ElementRef;
  @ViewChild('reviewModal') reviewModal: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private reviewService: ReviewService,
    private authService: AuthService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.initReviewForm();
  }

  ngOnInit(): void {
    this.checkAuthStatus();
    
    this.route.params.subscribe(params => {
      const productId = params['id'];
      if (productId) {
        this.loadProduct(productId);
        this.loadReviews(productId);
      } else {
        this.isLoading = false;
        this.errorMessage = 'Product ID is required';
        this.cdr.detectChanges();
      }
    });
  }

  private checkAuthStatus(): void {
    this.isLoggedIn = this.authService.isLoggedIn();
    if (this.isLoggedIn) {
      const user = this.authService.getCurrentUser();
      this.currentUserId = user?._id || null;
    }
  }

  private initReviewForm(): void {
    this.reviewForm = this.fb.group({
      rating: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(1000)]]
    });
  }

  loadProduct(id: string): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.cdr.detectChanges();
    
    this.productService.getProduct(id).subscribe({
      next: (response) => {
        this.product = response.product;
        
        // Check if product exists before accessing properties
        if (this.product) {
          // Initialize arrays to avoid null/undefined
          this.initializeProductArrays();
          
          // Initialize selections
          if (this.product.images && this.product.images.length > 0) {
            this.selectedImage = this.product.images[0];
          } else {
            this.selectedImage = 'https://via.placeholder.com/500x500?text=No+Image';
          }
          
          if (this.product.colors && this.product.colors.length > 0) {
            this.selectedColor = this.product.colors[0];
          }
          
          if (this.product.sizes && this.product.sizes.length > 0) {
            this.selectedSize = this.product.sizes[0];
          }
        }
        
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

  loadReviews(productId: string): void {
    this.isLoadingReviews = true;
    this.reviewService.getProductReviews(productId).subscribe({
      next: (reviews) => {
        this.reviews = reviews || [];
        this.isLoadingReviews = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading reviews:', error);
        this.reviews = [];
        this.isLoadingReviews = false;
        this.cdr.detectChanges();
      }
    });
  }

  private initializeProductArrays(): void {
    if (!this.product) return;
    
    // Initialize arrays to empty arrays if they are null/undefined
    this.product.images = this.product.images || [];
    this.product.colors = this.product.colors || [];
    this.product.sizes = this.product.sizes || [];
    this.product.features = this.product.features || [];
    
    // Ensure numeric properties have default values
    this.product.rating = this.product.rating || 0;
    this.product.reviewsCount = this.product.reviewsCount || 0;
    this.product.stock = this.product.stock || 0;
    this.product.lowStockThreshold = this.product.lowStockThreshold || 10;
    this.product.isActive = this.product.isActive !== undefined ? this.product.isActive : true;
    this.product.isFeatured = this.product.isFeatured !== undefined ? this.product.isFeatured : false;
    
    this.cdr.detectChanges();
  }

  getStockStatus(): string {
    if (!this.product) return '';
    
    if (this.product.stock === 0) {
      return 'Out of Stock';
    } else if (this.product.stock <= this.product.lowStockThreshold) {
      return `Low Stock: Only ${this.product.stock} left!`;
    } else {
      return `In Stock: ${this.product.stock} available`;
    }
  }

  getStarPercentage(star: number): number {
    if (!this.reviews.length) return 0;
    const count = this.reviews.filter(r => Math.round(r.rating) === star).length;
    return Math.round((count / this.reviews.length) * 100);
  }

  hasUserReviewed(): boolean {
    if (!this.isLoggedIn || !this.currentUserId || !this.reviews.length) return false;
    return this.reviews.some(review => review.user?._id === this.currentUserId);
  }

  increaseQuantity(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
      this.cdr.detectChanges();
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
      this.cdr.detectChanges();
    }
  }

  addToCart(): void {
    if (!this.product) {
      this.errorMessage = 'Product not loaded';
      this.cdr.detectChanges();
      return;
    }

    if (this.product.stock === 0) {
      this.errorMessage = 'Product is out of stock';
      this.cdr.detectChanges();
      return;
    }

    // Validate selections
    if (this.product.colors && this.product.colors.length > 0 && !this.selectedColor) {
      this.errorMessage = 'Please select a color';
      this.cdr.detectChanges();
      return;
    }

    if (this.product.sizes && this.product.sizes.length > 0 && !this.selectedSize) {
      this.errorMessage = 'Please select a size';
      this.cdr.detectChanges();
      return;
    }

    if (this.quantity > this.product.stock) {
      this.errorMessage = `Only ${this.product.stock} items available`;
      this.quantity = this.product.stock;
      this.cdr.detectChanges();
      return;
    }

    this.errorMessage = '';
    this.cdr.detectChanges();
    
    const cartData = {
      productId: this.product._id,
      quantity: this.quantity,
      color: this.selectedColor || undefined,
      size: this.selectedSize || undefined
    };

    this.cartService.addToCart(cartData).subscribe({
      next: (response) => {
        this.successMessage = 'Product added to cart successfully!';
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error adding to cart:', error);
        this.errorMessage = error.error?.message || 'Failed to add to cart';
        this.cdr.detectChanges();
      }
    });
  }

  addToWishlist(): void {
    if (!this.product) {
      this.errorMessage = 'Product not loaded';
      this.cdr.detectChanges();
      return;
    }
    
    // TODO: Implement wishlist service
    this.errorMessage = 'Wishlist feature coming soon!';
    this.cdr.detectChanges();
  }

  selectImage(image: string): void {
    this.selectedImage = image;
    this.cdr.detectChanges();
  }

  selectColor(color: string): void {
    this.selectedColor = color;
    this.cdr.detectChanges();
  }

  selectSize(size: string): void {
    this.selectedSize = size;
    this.cdr.detectChanges();
  }

  openReviewModal(): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
      return;
    }

    if (this.hasUserReviewed()) {
      this.errorMessage = 'You have already reviewed this product';
      this.cdr.detectChanges();
      setTimeout(() => {
        this.errorMessage = '';
        this.cdr.detectChanges();
      }, 3000);
      return;
    }

    this.reviewForm.reset();
    this.reviewImages = [];
    this.reviewForm.get('rating')?.setValue(0);
    
    // Create and show modal
    const modalElement = document.getElementById('reviewModal');
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  triggerImageUpload(): void {
    this.imageInput.nativeElement.click();
  }

  onImageSelect(event: any): void {
    const files = event.target.files;
    if (files) {
      for (let i = 0; i < Math.min(files.length, 4 - this.reviewImages.length); i++) {
        const file = files[i];
        
        // Validate file type
        if (!file.type.match('image.*')) {
          this.errorMessage = 'Please select image files only';
          this.cdr.detectChanges();
          continue;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          this.errorMessage = 'Image size should be less than 5MB';
          this.cdr.detectChanges();
          continue;
        }

        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.reviewImages.push(e.target.result);
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      }
    }
    // Reset file input
    event.target.value = '';
  }

  removeImage(index: number): void {
    this.reviewImages.splice(index, 1);
    this.cdr.detectChanges();
  }

  submitReview(): void {
    if (!this.product || this.reviewForm.invalid) {
      this.markFormGroupTouched(this.reviewForm);
      return;
    }

    this.isSubmittingReview = true;
    const reviewData = {
      ...this.reviewForm.value,
      productId: this.product._id,
      images: this.reviewImages
    };

    this.reviewService.addReview(reviewData).subscribe({
      next: (response) => {
        // Add the new review to the list
        this.reviews.unshift(response.review);
        
        // Update product rating and review count
        if (this.product) {
          this.product.rating = response.product?.rating || this.product.rating;
          this.product.reviewsCount = (this.product.reviewsCount || 0) + 1;
        }
        
        // Close modal
        const modalElement = document.getElementById('reviewModal');
        if (modalElement) {
          const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
          modal.hide();
        }
        
        // Show success message
        this.successMessage = 'Review submitted successfully!';
        this.isSubmittingReview = false;
        
        setTimeout(() => {
          this.successMessage = '';
          this.cdr.detectChanges();
        }, 3000);
        
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error submitting review:', error);
        this.errorMessage = error.error?.message || 'Failed to submit review';
        this.isSubmittingReview = false;
        this.cdr.detectChanges();
        
        setTimeout(() => {
          this.errorMessage = '';
          this.cdr.detectChanges();
        }, 5000);
      }
    });
  }

  markHelpful(reviewId: string): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
      return;
    }

    this.reviewService.markHelpful(reviewId).subscribe({
      next: () => {
        const review = this.reviews.find(r => r._id === reviewId);
        if (review) {
          review.helpful = (review.helpful || 0) + 1;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error marking helpful:', error);
        this.errorMessage = error.error?.message || 'Failed to mark helpful';
        this.cdr.detectChanges();
      }
    });
  }

  markNotHelpful(reviewId: string): void {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login'], { 
        queryParams: { returnUrl: this.router.url } 
      });
      return;
    }

    this.reviewService.markNotHelpful(reviewId).subscribe({
      next: () => {
        const review = this.reviews.find(r => r._id === reviewId);
        if (review) {
          review.notHelpful = (review.notHelpful || 0) + 1;
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error marking not helpful:', error);
        this.errorMessage = error.error?.message || 'Failed to mark not helpful';
        this.cdr.detectChanges();
      }
    });
  }

  viewImage(imageUrl: string): void {
    // You can implement a lightbox or modal for viewing images
    window.open(imageUrl, '_blank');
  }

  getRatingStars(rating: number): number[] {
    const stars = Math.round(rating * 2) / 2; // Round to nearest 0.5
    const fullStars = Math.floor(stars);
    const halfStar = stars % 1 !== 0;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    
    return [...Array(fullStars).fill(1), ...(halfStar ? [0.5] : []), ...Array(emptyStars).fill(0)];
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
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

  goBack(): void {
    this.router.navigate(['/products']);
  }
}