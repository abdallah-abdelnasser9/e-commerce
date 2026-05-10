import { Component, OnInit, OnDestroy, ElementRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription, interval } from 'rxjs'; // Add these imports
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { ChatMessage, ProductInquiryData } from '../../models/chat.model';

@Component({
  selector: 'app-admin-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CurrencyPipe],
  templateUrl: './admin-chat.html', 
  styleUrls: ['./admin-chat.css']
})
export class AdminChatComponent implements OnInit, OnDestroy {
  @ViewChild('chatContainer') private chatContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('messageInput') private messageInput!: ElementRef<HTMLTextAreaElement>;
  
  private chatService = inject(ChatService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  
  // Subscriptions
  private chatHistorySubscription: Subscription | undefined; // Add this
  private connectionSubscription: Subscription | undefined; // Add this
  
  // Connected users
  connectedUsers: string[] = [];
  filteredConnectedUsers: string[] = [];
  selectedUserId: string = '';
  messages: ChatMessage[] = [];
  
  // Chat state
  newMessage: string = '';
  isTyping: boolean = false;
  isSending: boolean = false;
  isLoading: boolean = true;
  isSocketConnected: boolean = false;
  
  // User typing state
  userTypingMap: Map<string, boolean> = new Map();
  
  // Product inquiry state
  currentInquiry: any = null;
  productResponse: string = '';
  showProductResponse: boolean = false;
  
  // Search
  userSearchTerm: string = '';
  
  // Unread counts
  unreadCounts: Map<string, number> = new Map();
  
  // Timers
  private typingTimer: ReturnType<typeof setTimeout> | undefined;
  private connectionMonitorInterval: ReturnType<typeof setInterval> | undefined;

  ngOnInit(): void {
    console.log('AdminChatComponent initialized');
    
    // Check if user is admin
    const user = this.authService.getCurrentUser();
    if (!user || user.role !== 'admin') {
      console.error('Access denied: User is not admin');
      return;
    }
    
    // Initialize as admin
    this.initializeAdmin();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  private initializeAdmin(): void {
    // Join as admin
    this.chatService.joinChat('admin');
    
    // Check connection status
    setTimeout(() => {
      this.isSocketConnected = this.chatService.isSocketConnected();
      this.cdr.detectChanges();
    }, 1000);
    
    // Subscribe to events
    this.subscribeToEvents();
    
    // Load initial data
    this.loadInitialData();
    
    // Start connection monitoring
    this.monitorConnection();
  }

  private subscribeToEvents(): void {
    // Connected users
    this.chatService.connectedUsers$.subscribe({
      next: (users) => {
        console.log('Connected users updated:', users);
        this.connectedUsers = users;
        this.filteredConnectedUsers = [...users];
        this.updateUnreadCounts();
        this.cdr.detectChanges();
      },
      error: (error) => console.error('Connected users subscription error:', error)
    });
    
    // Messages
    this.chatService.messages$.subscribe({
      next: (message) => {
        console.log('New message received in admin:', message);
        this.handleIncomingMessage(message);
      },
      error: (error) => console.error('Messages subscription error:', error)
    });
    
    // Admin messages sent (from other admins)
    this.chatService.adminMessageSent$.subscribe({
      next: (message) => {
        console.log('Admin message sent by other admin:', message);
        if (message.receiver === this.selectedUserId) {
          this.addMessage(message);
        }
      },
      error: (error) => console.error('Admin message sent subscription error:', error)
    });
    
    // Typing indicators
    this.chatService.typing$.subscribe({
      next: (data) => {
        console.log('Typing indicator:', data);
        if (data.userId && data.userId !== 'admin') {
          this.userTypingMap.set(data.userId, data.isTyping);
          this.cdr.detectChanges();
          
          // Clear typing indicator after timeout
          if (data.isTyping) {
            setTimeout(() => {
              this.userTypingMap.set(data.userId, false);
              this.cdr.detectChanges();
            }, 2000);
          }
        }
      },
      error: (error) => console.error('Typing subscription error:', error)
    });
    
    // Auto-response events
    this.chatService.autoResponse$.subscribe({
      next: (response) => {
        console.log('Auto-response sent:', response);
        // You could show a notification here
      },
      error: (error) => console.error('Auto-response subscription error:', error)
    });
    
    // Message status
    this.chatService.messageStatus$.subscribe({
      next: (status) => {
        console.log('Message status update:', status);
        // Update message read status
        const messageIndex = this.messages.findIndex(m => m._id === status.messageId);
        if (messageIndex !== -1) {
          this.messages[messageIndex].isRead = status.status === 'read';
          this.cdr.detectChanges();
        }
      },
      error: (error) => console.error('Message status subscription error:', error)
    });
  }

  private loadInitialData(): void {
    this.isLoading = false;
    this.cdr.detectChanges();
    
    // Connected users will be loaded via socket events
    // For now, simulate some users for testing
    setTimeout(() => {
      if (this.connectedUsers.length === 0) {
        // Add some test users
        this.connectedUsers = ['user1', 'user2', 'user3'];
        this.filteredConnectedUsers = [...this.connectedUsers];
        this.updateUnreadCounts();
        this.cdr.detectChanges();
      }
    }, 2000);
  }

  private monitorConnection(): void {
    // Use RxJS interval instead of setInterval for better Angular integration
    this.connectionSubscription = interval(3000).subscribe(() => {
      const wasConnected = this.isSocketConnected;
      this.isSocketConnected = this.chatService.isSocketConnected();
      
      if (wasConnected !== this.isSocketConnected) {
        console.log('Connection status changed:', this.isSocketConnected);
        this.cdr.detectChanges();
        
        if (!this.isSocketConnected) {
          this.reconnect();
        }
      }
    });
  }

  // Select user to chat with
  selectUser(userId: string): void {
    if (this.selectedUserId === userId) return;
    
    console.log('Selecting user:', userId);
    this.selectedUserId = userId;
    this.messages = [];
    this.isLoading = true;
    this.showProductResponse = false;
    this.currentInquiry = null;
    this.cdr.detectChanges();
    
    // Reset unread count for this user
    this.unreadCounts.set(userId, 0);
    this.cdr.detectChanges();
    
    // Stop typing indicator
    this.userTypingMap.set(userId, false);
    
    // Clear previous subscription to avoid memory leaks
    if (this.chatHistorySubscription) {
      this.chatHistorySubscription.unsubscribe();
    }
    
    // Load chat history via socket
    this.chatService.getSocketChatHistory('admin', userId);
    
    // Subscribe to chat history updates
    this.chatHistorySubscription = this.chatService.chatHistory$.subscribe({
      next: (data) => {
        console.log('Chat history received:', data);
        if (data.targetId === userId) {
          this.messages = data.messages || [];
          this.isLoading = false;
          this.scrollToBottom();
          
          // Mark messages as read
          this.markMessagesAsRead();
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error loading chat history:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
    
    // Also load via HTTP as fallback
    this.chatService.getChatHistory(userId).subscribe({
      next: (response: any) => {
        console.log('HTTP chat history response:', response);
        // Only update if we haven't received data from socket
        if (this.messages.length === 0) {
          this.messages = response.messages || [];
          this.isLoading = false;
          this.scrollToBottom();
          
          // Mark messages as read
          this.markMessagesAsRead();
          this.cdr.detectChanges();
        }
      },
      error: (error) => {
        console.error('Error loading HTTP chat history:', error);
        if (this.messages.length === 0) {
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      }
    });
    
    // Focus on message input
    setTimeout(() => {
      this.focusMessageInput();
    }, 100);
  }

  // Handle incoming messages
  private handleIncomingMessage(message: ChatMessage): void {
    console.log('Processing incoming message:', message);
    
    // If message is for admin from any user
    if (message.receiver === 'admin') {
      const senderId = message.sender;
      
      // Update unread count if not the selected user
      if (senderId !== this.selectedUserId) {
        const currentCount = this.unreadCounts.get(senderId) || 0;
        this.unreadCounts.set(senderId, currentCount + 1);
        this.cdr.detectChanges();
      }
      
      // If this message is from the selected user, add to messages
      if (senderId === this.selectedUserId) {
        this.addMessage(message);
        
        // Check if it's a product inquiry
        if (this.isProductInquiryMessage(message)) {
          this.handleProductInquiry(message);
        }
        
        // Mark as read
        setTimeout(() => {
          this.chatService.markAsRead(message._id, senderId, 'admin');
        }, 500);
      }
    }
    
    // If message is from admin to the selected user (sent by another admin)
    if (message.sender === 'admin' && message.receiver === this.selectedUserId) {
      this.addMessage(message);
    }
  }

  private addMessage(message: ChatMessage): void {
    // Check if message already exists
    const exists = this.messages.some(m => m._id === message._id);
    if (!exists) {
      this.messages.push(message);
      this.scrollToBottom();
      this.cdr.detectChanges();
    }
  }

  private handleProductInquiry(message: ChatMessage): void {
    console.log('Handling product inquiry:', message);
    
    this.currentInquiry = {
      userId: message.sender,
      messageId: message._id,
      productId: message.metadata?.productId,
      productName: message.metadata?.productName || this.extractProductName(message.message),
      question: message.metadata?.question || this.extractQuestion(message.message),
      productData: message.metadata?.['productData']
    };
    
    this.showProductResponse = true;
    this.productResponse = `Regarding "${this.currentInquiry.productName}":\n\n`;
    this.cdr.detectChanges();
  }

  private extractProductName(message: string): string {
    if (message.includes('Product Inquiry:')) {
      const parts = message.split('Product Inquiry:');
      if (parts[1]) {
        return parts[1].split('\n')[0].trim();
      }
    }
    return 'Unknown Product';
  }

  private extractQuestion(message: string): string {
    if (message.includes('Question:')) {
      const parts = message.split('Question:');
      if (parts[1]) {
        return parts[1].trim();
      }
    }
    return message;
  }

  // Send message to user
  sendMessage(): void {
    if (!this.canSendMessage()) {
      return;
    }

    const messageText = this.newMessage.trim();
    this.isSending = true;
    this.isTyping = false;
    this.cdr.detectChanges();
    
    // Create local message for immediate display
    const tempId = 'admin_temp_' + Date.now();
    const adminMessage: ChatMessage = {
      _id: tempId,
      sender: 'admin',
      receiver: this.selectedUserId,
      message: messageText,
      messageType: 'text',
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.messages.push(adminMessage);
    this.scrollToBottom();
    this.cdr.detectChanges();
    
    try {
      // Send via socket
      this.chatService.sendMessage('admin', this.selectedUserId, messageText);
      
      // Clear input
      this.newMessage = '';
      this.cdr.detectChanges();
      
      // Focus back on input
      this.focusMessageInput();
    } catch (error) {
      console.error('Error sending message:', error);
      this.showError('Failed to send message');
    } finally {
      // Reset sending state after a short delay
      setTimeout(() => {
        this.isSending = false;
        this.cdr.detectChanges();
      }, 500);
    }
  }

  // Send product response
  sendProductResponse(): void {
    if (!this.canSendResponse()) {
      return;
    }

    this.isSending = true;
    this.cdr.detectChanges();
    
    // Send response
    this.chatService.sendMessage('admin', this.currentInquiry.userId, this.productResponse.trim());
    
    // Add to messages
    const tempId = 'response_' + Date.now();
    const responseMessage: ChatMessage = {
      _id: tempId,
      sender: 'admin',
      receiver: this.currentInquiry.userId,
      message: this.productResponse.trim(),
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messageType: 'product_response',
      metadata: {
        type: 'product_response',
        originalInquiry: this.currentInquiry.messageId,
        productId: this.currentInquiry.productId,
        productName: this.currentInquiry.productName
      }
    };
    
    this.messages.push(responseMessage);
    this.scrollToBottom();
    this.cdr.detectChanges();
    
    // Clear response and hide panel
    setTimeout(() => {
      this.productResponse = '';
      this.showProductResponse = false;
      this.currentInquiry = null;
      this.isSending = false;
      this.cdr.detectChanges();
      this.focusMessageInput();
    }, 500);
  }

  // Quick responses for product inquiries
  useQuickResponse(type: string): void {
    if (!this.currentInquiry) return;
    
    let response = '';
    const productName = this.currentInquiry.productName;
    
    switch (type) {
      case 'price':
        response = `The price of ${productName} is $${this.currentInquiry.productData?.price || 'not specified'}.`;
        break;
      case 'stock':
        const stock = this.currentInquiry.productData?.stock || 0;
        response = `${productName} is currently ${stock > 0 ? 'in stock' : 'out of stock'}.`;
        if (stock > 0) {
          response += ` We have ${stock} units available.`;
        }
        break;
      case 'shipping':
        response = `Shipping for ${productName} usually takes 3-5 business days.`;
        break;
      default:
        response = `Regarding ${productName}: `;
    }
    
    this.productResponse = response;
    this.cdr.detectChanges();
  }

  // Close product response panel
  closeProductResponse(): void {
    this.showProductResponse = false;
    this.productResponse = '';
    this.currentInquiry = null;
    this.cdr.detectChanges();
  }

  // Typing indicator
  onInputChange(): void {
    if (!this.selectedUserId) return;
    
    // Clear existing timer
    if (this.isTyping && this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    
    if (this.newMessage.trim() && !this.isTyping) {
      this.isTyping = true;
      this.chatService.sendTypingIndicator(this.selectedUserId, true);
    } else if (!this.newMessage.trim() && this.isTyping) {
      this.isTyping = false;
      this.chatService.sendTypingIndicator(this.selectedUserId, false);
    }
    
    // Set timer to stop typing indicator
    this.typingTimer = setTimeout(() => {
      if (this.isTyping) {
        this.isTyping = false;
        this.chatService.sendTypingIndicator(this.selectedUserId, false);
      }
    }, 2000);
  }

  // Mark messages as read
  private markMessagesAsRead(): void {
    const unreadMessages = this.messages.filter(msg => 
      msg.sender !== 'admin' && !msg.isRead
    );
    
    if (unreadMessages.length > 0) {
      const messageIds = unreadMessages.map(msg => msg._id);
      this.chatService.markMessagesAsRead(messageIds).subscribe({
        next: () => {
          // Update local messages
          this.messages.forEach(msg => {
            if (msg.sender !== 'admin') {
              msg.isRead = true;
            }
          });
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error marking messages as read:', error);
        }
      });
    }
  }

  // Filter users
  filterUsers(): void {
    if (!this.userSearchTerm.trim()) {
      this.filteredConnectedUsers = [...this.connectedUsers];
      return;
    }
    
    const searchTerm = this.userSearchTerm.toLowerCase();
    this.filteredConnectedUsers = this.connectedUsers.filter(userId =>
      this.getUserName(userId).toLowerCase().includes(searchTerm) ||
      userId.toLowerCase().includes(searchTerm)
    );
  }

  // Update unread counts
  private updateUnreadCounts(): void {
    this.connectedUsers.forEach(userId => {
      if (!this.unreadCounts.has(userId)) {
        this.unreadCounts.set(userId, 0);
      }
    });
  }

  // Get user display name
  getUserName(userId: string): string {
    // In a real app, you might fetch user details
    return `User ${userId.substring(0, 8)}`;
  }

  // Get unread count for user
  getUnreadCount(userId: string): number {
    return this.unreadCounts.get(userId) || 0;
  }

  // Get total unread count
  getTotalUnreadCount(): number {
    let total = 0;
    this.unreadCounts.forEach(count => {
      total += count;
    });
    return total;
  }

  // Check if user is typing
  isUserTyping(userId: string): boolean {
    return this.userTypingMap.get(userId) || false;
  }

  // UI Helpers
  formatTime(timestamp: string): string {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '--:--';
    }
  }

  formatDate(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      }
      
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      });
    } catch {
      return 'Unknown date';
    }
  }

  isAdminMessage(message: ChatMessage): boolean {
    return message.sender === 'admin';
  }

  isProductInquiryMessage(message: ChatMessage): boolean {
    return message.messageType === 'product_inquiry' || 
           (message.metadata?.type === 'product_inquiry') ||
           message.message.includes('Product Inquiry');
  }

  // Scroll to bottom
  private scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.chatContainer?.nativeElement) {
          const container = this.chatContainer.nativeElement;
          container.scrollTop = container.scrollHeight;
        }
      }, 100);
    } catch(err) {
      console.error('Scroll error:', err);
    }
  }

  // Keyboard handling
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Focus on message input
  focusMessageInput(): void {
    setTimeout(() => {
      if (this.messageInput?.nativeElement) {
        this.messageInput.nativeElement.focus();
      }
    }, 100);
  }

  // Reconnect
  reconnect(): void {
    console.log('Reconnecting...');
    this.chatService.reconnect();
    setTimeout(() => {
      this.isSocketConnected = this.chatService.isSocketConnected();
      if (this.isSocketConnected) {
        // Re-join as admin
        this.chatService.joinChat('admin');
        
        // If a user is selected, reload their chat
        if (this.selectedUserId) {
          this.selectUser(this.selectedUserId);
        }
      }
      this.cdr.detectChanges();
    }, 1000);
  }

  // Load chat history
  loadChatHistory(): void {
    if (this.selectedUserId) {
      this.chatService.getSocketChatHistory('admin', this.selectedUserId);
      this.showToast('Refreshing chat history...', 'info');
    }
  }

  // Clear chat (local only)
  clearChat(): void {
    if (confirm('Clear chat history (local only)?')) {
      this.messages = [];
      this.cdr.detectChanges();
    }
  }

  // Helper methods
  private canSendMessage(): boolean {
    return this.isSocketConnected && 
           !!this.selectedUserId && 
           !this.isSending && 
           !!this.newMessage.trim();
  }

  private canSendResponse(): boolean {
    return this.isSocketConnected && 
           this.currentInquiry && 
           !this.isSending && 
           !!this.productResponse.trim();
  }

  private showError(message: string): void {
    console.error('Error:', message);
    // Implement toast notification
    this.showToast(message, 'error');
  }

  private showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    console.log(`Toast [${type}]: ${message}`);
    // You can implement a toast service here
  }

  private cleanup(): void {
    // Clear timers
    if (this.typingTimer !== undefined) {
      clearTimeout(this.typingTimer);
    }
    
    if (this.connectionMonitorInterval) {
      clearInterval(this.connectionMonitorInterval);
    }
    
    // Unsubscribe from RxJS subscriptions
    if (this.chatHistorySubscription) {
      this.chatHistorySubscription.unsubscribe();
    }
    
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
    }
    
    // Disconnect socket if needed
    this.chatService.disconnect();
  }

  // Get user initials
  getUserInitials(userId: string): string {
    if (!userId) return '??';
    return userId.substring(0, 2).toUpperCase();
  }

  // Check if should show date separator
  shouldShowDate(index: number): boolean {
    if (index === 0) return true;
    
    const currentMessage = this.messages[index];
    const previousMessage = this.messages[index - 1];
    
    if (!currentMessage || !previousMessage) return false;
    
    const currentDate = this.formatDate(currentMessage.createdAt);
    const previousDate = this.formatDate(previousMessage.createdAt);
    
    return currentDate !== previousDate;
  }

  // Get user status color
  getUserStatusColor(userId: string): string {
    if (this.isUserTyping(userId)) return 'success';
    if (this.getUnreadCount(userId) > 0) return 'warning';
    return 'secondary';
  }
}