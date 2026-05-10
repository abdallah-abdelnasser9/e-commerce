import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  
  credentials = {
    email: '',
    password: ''
  };
  isLoading = false;
  errorMessage = '';
  showPassword = false;
  submitted = false;
  returnUrl = '/'; // Default redirect URL

  ngOnInit(): void {
    // Get return URL from route parameters or default to '/'
    this.route.queryParams.subscribe(params => {
      this.returnUrl = params['returnUrl'] || '/';
    });
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  get isFormValid(): boolean {
    return (
      this.credentials.email.trim() !== '' &&
      this.credentials.password.trim() !== '' &&
      this.validateEmail(this.credentials.email)
    );
  }

  onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    // Validation
    if (!this.credentials.email.trim()) {
      this.errorMessage = 'Email is required';
      return;
    }

    if (!this.validateEmail(this.credentials.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    if (!this.credentials.password) {
      this.errorMessage = 'Password is required';
      return;
    }

    this.isLoading = true;

    this.authService.login(this.credentials.email, this.credentials.password).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        // Check user role and redirect accordingly
        const user = this.authService.getCurrentUser();
        
        if (user?.role === 'admin') {
          // Redirect admin users to admin dashboard
          this.router.navigate(['/admin/dashboard']);
        } else {
          // Redirect regular users to return URL or home
          this.router.navigateByUrl(this.returnUrl);
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Login failed. Please check your credentials.';
      }
    });
  }

  resetForm(): void {
    this.credentials = { email: '', password: '' };
    this.errorMessage = '';
    this.submitted = false;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}