import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { Cart, CartItem } from '../../models/cart.model';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './checkout.html',
  styleUrls: ['./checkout.css']
})
export class CheckoutComponent implements OnInit, OnDestroy {
  checkoutForm!: FormGroup;
  cart: Cart | null = null;
  isLoading = true;
  isProcessing = false;
  paymentMethods = [
    { id: 'paypal_sandbox', name: 'PayPal Sandbox', icon: 'fab fa-paypal', description: 'Test payment with simulated PayPal' },
    { id: 'demo', name: 'Demo Payment', icon: 'fas fa-credit-card', description: 'Always successful for testing' },
    { id: 'fail', name: 'Failed Payment Test', icon: 'fas fa-times-circle', description: 'Simulate payment failure' }
  ];

  // Order summary calculations
  subtotal = 0;
  shipping = 10; // Fixed shipping fee
  tax = 0;
  total = 0;

  private cartSubscription: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private cartService: CartService,
    private orderService: OrderService,
    private authService: AuthService,
    public router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef // Added ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadCart();
  }

  ngOnDestroy(): void {
    // Clean up subscription
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
  }

  initForm(): void {
  const currentUser = this.authService.getCurrentUser();
  
  let firstName = '';
  let lastName = '';
  let email = '';
  let address = '123 Test Street'; // Add a default for testing
  let city = 'San Francisco'; // Add a default for testing
  let state = 'CA'; // Add a default for testing
  let zip = '94107'; // Add a default for testing
  let phone = '1234567890'; // Add a default for testing
  
  if (currentUser?.name) {
    const nameParts = currentUser.name.split(' ');
    firstName = nameParts[0];
    lastName = nameParts.slice(1).join(' ');
  }
  
  if (currentUser?.email) {
    email = currentUser.email;
  }

  this.checkoutForm = this.fb.group({
    firstName: [firstName, Validators.required],
    lastName: [lastName, Validators.required],
    email: [email, [Validators.required, Validators.email]],
    address: [address, Validators.required], // Added default
    city: [city, Validators.required], // Added default
    state: [state, Validators.required], // Added default
    zip: [zip, [Validators.required, Validators.pattern('^[0-9]{5}(?:-[0-9]{4})?$')]], // Added default
    phone: [phone, [Validators.required, Validators.pattern('^[0-9]{10}$')]], // Added default
    paymentMethod: ['paypal_sandbox', Validators.required],
    saveInfo: [true]
  });

  // Trigger change detection after form initialization
  this.cdr.detectChanges();
}

  loadCart(): void {
    this.isLoading = true;
    this.cdr.detectChanges(); // Show loading state immediately

    this.cartService.loadCart().subscribe({
      next: () => {
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading cart:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });

    this.cartSubscription = this.cartService.cart$.subscribe(cart => {
      this.cart = cart;
      this.calculateTotals();
      this.cdr.detectChanges(); // Trigger change detection when cart updates
    });
  }

  calculateTotals(): void {
    if (!this.cart?.items) {
      this.subtotal = 0;
      this.tax = 0;
      this.total = 0;
      return;
    }

    this.subtotal = this.cart.items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);

    // Free shipping for orders over $50
    this.shipping = this.subtotal > 50 ? 0 : 10;
    this.tax = this.subtotal * 0.1; // 10% tax
    this.total = this.subtotal + this.shipping + this.tax;

    // Trigger change detection after calculations
    this.cdr.detectChanges();
  }

  getProductName(item: CartItem): string {
    if (typeof item.product === 'string') {
      return item.name || 'Unknown Product';
    }
    return item.product?.name || item.name || 'Unknown Product';
  }

  getProductImage(item: CartItem): string {
    if (typeof item.product === 'string') {
      return item.image || 'https://via.placeholder.com/150';
    }
    return item.product?.images?.[0] || item.image || 'https://via.placeholder.com/150';
  }

  getProductPrice(item: CartItem): number {
    return item.price || 0;
  }

  processPayment(): void {
    if (this.isProcessing) return;

    // Mark all fields as touched to show validation errors
    Object.keys(this.checkoutForm.controls).forEach(key => {
      const control = this.checkoutForm.get(key);
      control?.markAsTouched();
    });

    if (this.checkoutForm.invalid) {
      alert('Please fill in all required fields correctly.');
      return;
    }

    if (!this.cart || this.cart.items.length === 0) {
      alert('Your cart is empty.');
      return;
    }

    this.isProcessing = true;
    this.cdr.detectChanges(); // Update UI to show processing state

    const formData = this.checkoutForm.value;
    const orderData = {
      shippingAddress: {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        phone: formData.phone
      },
      paymentMethod: formData.paymentMethod,
      items: this.cart.items.map(item => ({
        product: typeof item.product === 'string' ? item.product : item.product?._id,
        name: this.getProductName(item),
        quantity: item.quantity,
        price: this.getProductPrice(item),
        color: item.color,
        size: item.size
      })),
      subtotal: this.subtotal,
      shipping: this.shipping,
      tax: this.tax,
      totalAmount: this.total
    };

    // Show processing modal
    this.showPaymentModal();
    this.cdr.detectChanges(); // Ensure modal is shown

    this.orderService.createOrder(orderData).subscribe({
      next: (response: any) => {
        this.isProcessing = false;
        this.hidePaymentModal();
        
        if (response.success) {
          this.showSuccessModal(response.order);
          
          // Clear cart after successful order
          this.cartService.clearCart().subscribe({
            next: () => {
              this.cdr.detectChanges(); // Update cart state
            },
            error: (err) => {
              console.error('Error clearing cart:', err);
            }
          });
        } else {
          this.showErrorModal(response.message || 'Payment failed');
        }
        this.cdr.detectChanges(); // Update UI state
      },
      error: (error) => {
        this.isProcessing = false;
        this.hidePaymentModal();
        console.error('Order creation error:', error);
        
        let errorMessage = 'An error occurred while processing your order.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        this.showErrorModal(errorMessage);
        this.cdr.detectChanges(); // Update UI state
      }
    });
  }

  showPaymentModal(): void {
    const modal = document.getElementById('paymentModal');
    if (modal) {
      modal.style.display = 'block';
      modal.classList.add('show');
      this.cdr.detectChanges(); // Ensure modal rendering
    }
  }

  hidePaymentModal(): void {
    const modal = document.getElementById('paymentModal');
    if (modal) {
      modal.style.display = 'none';
      modal.classList.remove('show');
      this.cdr.detectChanges(); // Ensure modal is hidden
    }
  }

  showSuccessModal(order: any): void {
    const modal = document.getElementById('resultModal');
    const successDiv = document.getElementById('successResult');
    const errorDiv = document.getElementById('errorResult');
    const orderIdSpan = document.getElementById('orderId');
    const successMessage = document.getElementById('successMessage');
    const viewOrderBtn = document.getElementById('viewOrderBtn');
    
    if (modal && successDiv && errorDiv) {
      successDiv.style.display = 'block';
      errorDiv.style.display = 'none';
      
      if (orderIdSpan) {
        orderIdSpan.textContent = order.orderId || order._id;
      }
      
      if (successMessage) {
        successMessage.textContent = 'Your order has been placed successfully!';
      }
      
      if (viewOrderBtn) {
        viewOrderBtn.onclick = () => {
          this.closeModal();
          this.navigateToOrders();
        };
      }
      
      modal.style.display = 'block';
      modal.classList.add('show');
      this.cdr.detectChanges(); // Ensure modal rendering
    }
  }

  showErrorModal(message: string): void {
    const modal = document.getElementById('resultModal');
    const successDiv = document.getElementById('successResult');
    const errorDiv = document.getElementById('errorResult');
    const errorMessageSpan = document.getElementById('errorMessage');
    
    if (modal && successDiv && errorDiv && errorMessageSpan) {
      successDiv.style.display = 'none';
      errorDiv.style.display = 'block';
      errorMessageSpan.textContent = message;
      
      modal.style.display = 'block';
      modal.classList.add('show');
      this.cdr.detectChanges(); // Ensure modal rendering
    }
  }

  closeModal(): void {
    const paymentModal = document.getElementById('paymentModal');
    const resultModal = document.getElementById('resultModal');
    
    if (paymentModal) {
      paymentModal.style.display = 'none';
      paymentModal.classList.remove('show');
    }
    
    if (resultModal) {
      resultModal.style.display = 'none';
      resultModal.classList.remove('show');
    }
    
    this.cdr.detectChanges(); // Update UI after closing modals
  }

  navigateToOrders(): void {
    this.router.navigate(['/orders']);
  }

  continueShopping(): void {
    this.router.navigate(['/products']);
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.checkoutForm.get(fieldName);
    return field ? field.invalid && (field.dirty || field.touched) : false;
  }

  // New method to get validation error message
  getErrorMessage(fieldName: string): string {
    const field = this.checkoutForm.get(fieldName);
    
    if (!field?.errors) return '';
    
    if (field.errors['required']) {
      return 'This field is required';
    }
    if (field.errors['email']) {
      return 'Please enter a valid email address';
    }
    if (field.errors['pattern']) {
      if (fieldName === 'zip') {
        return 'Please enter a valid ZIP code (e.g., 12345 or 12345-6789)';
      }
      if (fieldName === 'phone') {
        return 'Please enter a valid 10-digit phone number';
      }
    }
    
    return 'Invalid value';
  }

  // Helper method to validate form before submission
  validateForm(): boolean {
    if (this.checkoutForm.invalid) {
      // Mark all fields as touched to show errors
      Object.keys(this.checkoutForm.controls).forEach(key => {
        const control = this.checkoutForm.get(key);
        control?.markAsTouched();
      });
      
      this.cdr.detectChanges(); // Update UI to show validation errors
      return false;
    }
    
    if (!this.cart || this.cart.items.length === 0) {
      alert('Your cart is empty.');
      return false;
    }
    
    return true;
  }

  // Method to update form values and trigger change detection
  updateFormField(fieldName: string, value: any): void {
    const control = this.checkoutForm.get(fieldName);
    if (control) {
      control.setValue(value);
      control.markAsTouched();
      this.cdr.detectChanges();
    }
  }
}