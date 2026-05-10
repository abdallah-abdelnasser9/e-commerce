import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { User, Address } from '../../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.html',
  styleUrls: ['./profile.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  // User data
  user: User | null = null;
  
  // Forms
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  addressForm!: FormGroup;
  
  // States
  activeTab: 'profile' | 'security' | 'addresses' | 'orders' | 'wishlist' = 'profile';
  isLoading = false;
  isEditingProfile = false;
  isEditingAddress: string | null = null;
  isAddingAddress = false;
  avatarFile: File | null = null;
  avatarPreview: string | null = null;
  
  // Data
  orders: any[] = [];
  wishlistItems: any[] = [];
  successMessage: string = '';
  errorMessage: string = '';
  
  private subscriptions: Subscription[] = [];

  // US states for dropdown
  states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
    this.initForms();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  loadUserProfile(): void {
    this.isLoading = true;
    const sub = this.authService.currentUser$.subscribe({
      next: (user) => {
        this.user = user;
        if (user) {
          this.updateFormsWithUserData();
          // Load additional profile data if needed
          this.loadFullProfile();
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading user:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
    this.subscriptions.push(sub);
  }

  loadFullProfile(): void {
    // Load full profile with addresses and wishlist if not already loaded
    if (this.user && (!this.user.addresses || !this.user.wishlist)) {
      this.isLoading = true;
      const sub = this.authService.getFullProfile().subscribe({
        next: (response: any) => {
          if (response.success && response.user) {
            this.user = response.user;
            this.updateFormsWithUserData();
          }
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading full profile:', error);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
      this.subscriptions.push(sub);
    }
  }

  initForms(): void {
    // Profile form
    this.profileForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', [Validators.pattern('^[0-9]{10}$')]]
    });

    // Password form
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required, Validators.minLength(6)]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });

    // Address form
    this.addressForm = this.fb.group({
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      country: ['United States', Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern('^[0-9]{5}(?:-[0-9]{4})?$')]],
      isDefault: [false]
    });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
  }

  updateFormsWithUserData(): void {
    if (!this.user) return;

    // Update profile form
    this.profileForm.patchValue({
      name: this.user.name,
      email: this.user.email,
      phone: this.user.phone || ''
    });

    // Reset address form for new address
    this.resetAddressForm();
  }

  resetAddressForm(): void {
    this.addressForm.reset({
      street: '',
      city: '',
      state: '',
      country: 'United States',
      zipCode: '',
      isDefault: this.user?.addresses?.length === 0
    });
    this.isEditingAddress = null;
    this.isAddingAddress = false;
  }

  setActiveTab(tab: 'profile' | 'security' | 'addresses' | 'orders' | 'wishlist'): void {
    this.activeTab = tab;
    this.successMessage = '';
    this.errorMessage = '';
    
    switch(tab) {
      case 'wishlist':
        this.loadWishlist();
        break;
      case 'orders':
        this.loadOrders();
        break;
    }
    this.cdr.detectChanges();
  }

  onAvatarSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        this.showError('Please select a valid image file (JPEG, PNG, or GIF)');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.showError('Image size should be less than 5MB');
        return;
      }

      this.avatarFile = file;
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.avatarPreview = e.target.result;
        this.cdr.detectChanges();
      };
      reader.readAsDataURL(file);
    }
  }

  uploadAvatar(): void {
    if (!this.avatarFile || !this.user) return;

    this.isLoading = true;
    const sub = this.authService.uploadAvatar(this.avatarFile).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.showSuccess('Profile picture updated successfully!');
          this.avatarFile = null;
          this.avatarPreview = null;
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.showError(error.message || 'Error uploading profile picture');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
    this.subscriptions.push(sub);
  }

  updateProfile(): void {
    if (this.profileForm.invalid) {
      this.markFormGroupTouched(this.profileForm);
      return;
    }

    this.isLoading = true;
    const profileData = this.profileForm.value;
    
    const sub = this.authService.updateProfile(profileData)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.showSuccess('Profile updated successfully!');
            this.isEditingProfile = false;
          } else {
            this.showError(response.message || 'Error updating profile');
          }
        },
        error: (error) => {
          this.showError(error.message || 'Error updating profile');
        }
      });
    
    this.subscriptions.push(sub);
  }

  updatePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormGroupTouched(this.passwordForm);
      return;
    }

    if (this.passwordForm.hasError('mismatch')) {
      this.showError('New passwords do not match');
      return;
    }

    this.isLoading = true;
    const { currentPassword, newPassword } = this.passwordForm.value;
    
    const sub = this.authService.updatePassword(currentPassword, newPassword)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.showSuccess('Password updated successfully!');
            this.passwordForm.reset();
          } else {
            this.showError(response.message || 'Error updating password');
          }
        },
        error: (error) => {
          this.showError(error.message || 'Error updating password');
        }
      });
    
    this.subscriptions.push(sub);
  }

  editAddress(address: Address): void {
    this.isEditingAddress = (address as any)._id || 'temp';
    this.isAddingAddress = false;
    this.addressForm.patchValue(address);
  }

  addNewAddress(): void {
    this.isAddingAddress = true;
    this.isEditingAddress = null;
    this.resetAddressForm();
  }

  saveAddress(): void {
    if (this.addressForm.invalid) {
      this.markFormGroupTouched(this.addressForm);
      return;
    }

    this.isLoading = true;
    const addressData = this.addressForm.value;
    
    if (this.isEditingAddress) {
      // Update existing address
      const sub = this.authService.updateAddress(this.isEditingAddress, addressData)
        .pipe(
          finalize(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.showSuccess('Address updated successfully!');
              this.resetAddressForm();
            } else {
              this.showError(response.message || 'Error updating address');
            }
          },
          error: (error) => {
            this.showError(error.message || 'Error updating address');
          }
        });
      this.subscriptions.push(sub);
    } else {
      // Add new address
      const sub = this.authService.addAddress(addressData)
        .pipe(
          finalize(() => {
            this.isLoading = false;
            this.cdr.detectChanges();
          })
        )
        .subscribe({
          next: (response: any) => {
            if (response.success) {
              this.showSuccess('Address added successfully!');
              this.resetAddressForm();
            } else {
              this.showError(response.message || 'Error adding address');
            }
          },
          error: (error) => {
            this.showError(error.message || 'Error adding address');
          }
        });
      this.subscriptions.push(sub);
    }
  }

  deleteAddress(addressId: string): void {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    this.isLoading = true;
    const sub = this.authService.deleteAddress(addressId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.showSuccess('Address deleted successfully!');
          } else {
            this.showError(response.message || 'Error deleting address');
          }
        },
        error: (error) => {
          this.showError(error.message || 'Error deleting address');
        }
      });
    this.subscriptions.push(sub);
  }

  setDefaultAddress(addressId: string): void {
    this.isLoading = true;
    const sub = this.authService.setDefaultAddress(addressId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response.success) {
            this.showSuccess('Default address updated!');
          } else {
            this.showError(response.message || 'Error setting default address');
          }
        },
        error: (error) => {
          this.showError(error.message || 'Error setting default address');
        }
      });
    this.subscriptions.push(sub);
  }

  loadOrders(): void {
    this.isLoading = true;
    // In a real app, you would fetch orders from an order service
    // For now, we'll use mock data
    setTimeout(() => {
      this.orders = [
        {
          _id: 'order1',
          orderNumber: 'ORD-2023-001',
          date: new Date('2023-12-15'),
          total: 149.99,
          status: 'Delivered',
          items: 3
        },
        {
          _id: 'order2',
          orderNumber: 'ORD-2023-002',
          date: new Date('2024-01-10'),
          total: 89.50,
          status: 'Processing',
          items: 2
        }
      ];
      this.isLoading = false;
      this.cdr.detectChanges();
    }, 500);
  }

  loadWishlist(): void {
    this.isLoading = true;
    const sub = this.authService.getWishlist().subscribe({
      next: (response: any) => {
        if (response.success && response.products) {
          this.wishlistItems = response.products;
        } else {
          // Mock data for demo
          this.wishlistItems = [
            {
              _id: 'product1',
              name: 'Premium Headphones',
              price: 199.99,
              image: 'https://via.placeholder.com/100',
              inStock: true
            },
            {
              _id: 'product2',
              name: 'Smart Watch',
              price: 299.99,
              image: 'https://via.placeholder.com/100',
              inStock: true
            }
          ];
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading wishlist:', error);
        // Mock data for demo
        this.wishlistItems = [
          {
            _id: 'product1',
            name: 'Premium Headphones',
            price: 199.99,
            image: 'https://via.placeholder.com/100',
            inStock: true
          }
        ];
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
    this.subscriptions.push(sub);
  }

  removeFromWishlist(productId: string): void {
    const sub = this.authService.removeFromWishlist(productId).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.wishlistItems = this.wishlistItems.filter(item => item._id !== productId);
          this.showSuccess('Item removed from wishlist');
        } else {
          this.showError(response.message || 'Error removing from wishlist');
        }
      },
      error: (error) => {
        this.showError(error.message || 'Error removing from wishlist');
      }
    });
    this.subscriptions.push(sub);
  }

  viewOrder(orderId: string): void {
    this.router.navigate(['/orders', orderId]);
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    this.cdr.detectChanges();
    setTimeout(() => {
      this.successMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    this.cdr.detectChanges();
    setTimeout(() => {
      this.errorMessage = '';
      this.cdr.detectChanges();
    }, 3000);
  }

  cancelEdit(): void {
    this.isEditingProfile = false;
    this.profileForm.patchValue({
      name: this.user?.name || '',
      email: this.user?.email || '',
      phone: this.user?.phone || ''
    });
  }

  cancelAddressEdit(): void {
    this.resetAddressForm();
  }

  logout(): void {
    this.authService.logout();
  }

  get defaultAddress(): Address | undefined {
    return this.user?.addresses?.find((addr: Address) => addr.isDefault);
  }

  // Helper method to get product count in wishlist
  get wishlistCount(): number {
    return this.user?.wishlist?.length || 0;
  }

  // Helper method to get address count
  get addressCount(): number {
    return this.user?.addresses?.length || 0;
  }
}