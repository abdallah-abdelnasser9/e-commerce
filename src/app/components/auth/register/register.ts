import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class RegisterComponent {
  userData = {
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  };
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  get passwordsMatch(): boolean {
    return this.userData.password === this.userData.confirmPassword;
  }

  get isFormValid(): boolean {
    return (
      this.userData.name.trim() !== '' &&
      this.userData.email.trim() !== '' &&
      this.userData.password.trim() !== '' &&
      this.userData.confirmPassword.trim() !== '' &&
      this.passwordsMatch &&
      this.userData.password.length >= 6
    );
  }

  validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  onSubmit(): void {
    // Reset messages
    this.errorMessage = '';
    this.successMessage = '';

    // Validation
    if (!this.userData.name.trim()) {
      this.errorMessage = 'Name is required';
      return;
    }

    if (!this.userData.email.trim()) {
      this.errorMessage = 'Email is required';
      return;
    }

    if (!this.validateEmail(this.userData.email)) {
      this.errorMessage = 'Please enter a valid email address';
      return;
    }

    if (!this.userData.password) {
      this.errorMessage = 'Password is required';
      return;
    }

    if (this.userData.password.length < 6) {
      this.errorMessage = 'Password must be at least 6 characters';
      return;
    }

    if (!this.userData.confirmPassword) {
      this.errorMessage = 'Please confirm your password';
      return;
    }

    if (!this.passwordsMatch) {
      this.errorMessage = 'Passwords do not match';
      return;
    }

    this.isLoading = true;

    this.authService.register(
      this.userData.name,
      this.userData.email,
      this.userData.password
    ).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Registration successful! Redirecting to home page...';
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error.message || 'Registration failed. Please try again.';
      }
    });
  }

  resetForm(): void {
    this.userData = {
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    };
    this.errorMessage = '';
    this.successMessage = '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}