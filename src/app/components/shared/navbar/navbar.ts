import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../services/auth.service';
import { CartService } from '../../../services/cart.service';
import { ChatService } from '../../../services/chat.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './navbar.html',
  styleUrls: ['./navbar.css']
})
export class NavbarComponent implements OnInit, OnDestroy {
  cartItemsCount = 0;
  isMenuCollapsed = true;
  searchTerm = '';
  isLoggedIn = false;
  user: any = null;
  unreadMessagesCount = 0;
  
  private authSubscription!: Subscription;
  private cartSubscription!: Subscription;
  private chatSubscription!: Subscription;

  constructor(
    private authService: AuthService,
    private cartService: CartService,
    private chatService: ChatService,
    private router: Router,
    private cdRef: ChangeDetectorRef // Add this
  ) {}

  ngOnInit(): void {
    // Initialize without setting isLoggedIn here
    // Don't call getCurrentUser() directly
    
    // Subscribe to cart updates
    this.cartSubscription = this.cartService.cart$.subscribe(cart => {
      this.cartItemsCount = cart ? cart.totalItems : 0;
      this.cdRef.markForCheck(); // Mark for change detection
    });

    // Subscribe to auth state - this should be the only place isLoggedIn is set
    this.authSubscription = this.authService.currentUser$.subscribe(user => {
      this.user = user;
      this.isLoggedIn = !!user; // Set isLoggedIn only here
      
      // If user is logged in, subscribe to chat messages
      if (user) {
        this.subscribeToChatMessages();
      } else {
        this.unreadMessagesCount = 0;
        if (this.chatSubscription) {
          this.chatSubscription.unsubscribe();
        }
      }
      
      this.cdRef.markForCheck(); // Mark for change detection
    });
  }

  private subscribeToChatMessages(): void {
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
    
    this.chatSubscription = this.chatService.messages$.subscribe(message => {
      // If message is from admin and not read, increment count
      if (message.sender === 'admin' && !message.isRead) {
        this.unreadMessagesCount++;
        this.cdRef.markForCheck(); // Mark for change detection
      }
    });
    
    // Load initial unread count
    this.loadUnreadCount();
  }

  private loadUnreadCount(): void {
    // Implement based on your chat service
    // For example:
    // this.chatService.getUnreadCount().subscribe(count => {
    //   this.unreadMessagesCount = count;
    //   this.cdRef.markForCheck();
    // });
  }

  ngOnDestroy(): void {
    // Clean up all subscriptions
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.cartSubscription) {
      this.cartSubscription.unsubscribe();
    }
    if (this.chatSubscription) {
      this.chatSubscription.unsubscribe();
    }
  }

  goToProducts(): void {
    this.router.navigate(['/products']);
  }

  logout(): void {
    this.authService.logout();
    this.chatService.disconnect();
    this.router.navigate(['/']);
  }

  searchProducts(): void {
    if (this.searchTerm.trim()) {
      this.router.navigate(['/products'], { 
        queryParams: { search: this.searchTerm.trim() } 
      });
      this.searchTerm = '';
    }
  }

  onSearchKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.searchProducts();
    }
  }

  toggleMenu(): void {
    this.isMenuCollapsed = !this.isMenuCollapsed;
  }
}