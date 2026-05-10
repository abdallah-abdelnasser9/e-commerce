import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { ChatMessage, ProductInquiryData } from '../models/chat.model';
import { AuthService } from './auth.service';
import { User } from '../models/user.model';

export interface ConnectedUser {
  userId: string;
  name?: string;
  isOnline: boolean;
}

export interface UserActivity {
  userId: string;
  action: string;
  timestamp?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'https://backend-1-xkmk.onrender.com';
  private socket: Socket | null = null;
  private isConnected = false;
  
  // Subjects
  private messagesSubject = new Subject<ChatMessage>();
  public messages$ = this.messagesSubject.asObservable();
  
  private typingSubject = new Subject<{userId: string, isTyping: boolean}>();
  public typing$ = this.typingSubject.asObservable();
  
  private adminStatusSubject = new BehaviorSubject<{isOnline: boolean}>({isOnline: false});
  public adminStatus$ = this.adminStatusSubject.asObservable();
  
  private messageStatusSubject = new Subject<{messageId: string, status: string}>();
  public messageStatus$ = this.messageStatusSubject.asObservable();
  
  private connectedUsersSubject = new BehaviorSubject<string[]>([]);
  public connectedUsers$ = this.connectedUsersSubject.asObservable();
  
  private chatHistorySubject = new Subject<{targetId: string, messages: ChatMessage[]}>();
  public chatHistory$ = this.chatHistorySubject.asObservable();
  
  // Add this - User Activity Subject
  private userActivitySubject = new Subject<UserActivity>();
  public userActivity$ = this.userActivitySubject.asObservable();
  
  // Add this - Admin Message Sent Subject (for admin panel)
  private adminMessageSentSubject = new Subject<ChatMessage>();
  public adminMessageSent$ = this.adminMessageSentSubject.asObservable();
  
  // Add this - Auto Response Subject
  private autoResponseSubject = new Subject<any>();
  public autoResponse$ = this.autoResponseSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {
    this.initializeSocket();
  }

  private initializeSocket(): void {
    if (this.socket?.connected) {
      return;
    }

    this.socket = io('http://localhost:3000', {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('✅ Connected to chat server');
      this.isConnected = true;
      
      const user = this.authService.getCurrentUser();
      if (user && user._id) {
        this.joinChat(user._id);
      }
    });

    this.socket.on('receiveMessage', (message: ChatMessage) => {
      console.log('📩 New message received from socket:', message);
      this.messagesSubject.next(message);
    });

    this.socket.on('userTyping', (data: {userId: string, isTyping: boolean}) => {
      this.typingSubject.next(data);
    });

    this.socket.on('adminTyping', (data: {isTyping: boolean}) => {
      this.typingSubject.next({userId: 'admin', ...data});
    });

    this.socket.on('adminStatus', (data: {isOnline: boolean}) => {
      this.adminStatusSubject.next(data);
    });

    this.socket.on('messageSent', (data: {messageId: string, status: string}) => {
      this.messageStatusSubject.next(data);
    });

    this.socket.on('messageRead', (data: {messageId: string, readAt: Date}) => {
      this.messageStatusSubject.next({messageId: data.messageId, status: 'read'});
    });

    this.socket.on('connectedUsers', (users: string[]) => {
      this.connectedUsersSubject.next(users);
    });

    this.socket.on('userConnected', (data: {userId: string, timestamp: Date}) => {
      const currentUsers = this.connectedUsersSubject.value;
      if (!currentUsers.includes(data.userId)) {
        this.connectedUsersSubject.next([...currentUsers, data.userId]);
      }
      // Emit user activity
      this.userActivitySubject.next({
        userId: data.userId,
        action: 'connected',
        timestamp: data.timestamp
      });
    });

    this.socket.on('userDisconnected', (data: {userId: string, timestamp: Date}) => {
      const currentUsers = this.connectedUsersSubject.value;
      this.connectedUsersSubject.next(currentUsers.filter(id => id !== data.userId));
      // Emit user activity
      this.userActivitySubject.next({
        userId: data.userId,
        action: 'disconnected',
        timestamp: data.timestamp
      });
    });

    this.socket.on('chatHistory', (data: {targetId: string, messages: ChatMessage[]}) => {
      this.chatHistorySubject.next(data);
    });

    this.socket.on('autoResponseSent', (data: any) => {
      console.log('Auto-response sent:', data);
      this.autoResponseSubject.next(data);
    });

    this.socket.on('adminMessageSent', (message: ChatMessage) => {
      console.log('Admin message sent:', message);
      this.adminMessageSentSubject.next(message);
    });

    this.socket.on('userJoined', (data: {userId: string, userCount: number}) => {
      this.userActivitySubject.next({
        userId: data.userId,
        action: 'joined'
      });
    });

    this.socket.on('userLeft', (data: {userId: string, userCount: number}) => {
      this.userActivitySubject.next({
        userId: data.userId,
        action: 'left'
      });
    });

    this.socket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server');
      this.isConnected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.isConnected = false;
    });
  }

  // Join chat
  joinChat(userId: string): void {
  console.log('Attempting to join chat as:', userId);
  
  if (!userId) {
    console.error('Cannot join chat: User ID is required');
    return;
  }
  
  // Ensure socket is initialized
  if (!this.socket) {
    console.log('Socket not initialized, initializing...');
    this.initializeSocket();
  }
  
  // Wait for connection
  const connectInterval = setInterval(() => {
    if (this.socket?.connected) {
      clearInterval(connectInterval);
      console.log('Socket connected, joining chat as:', userId);
      this.socket.emit('join', userId);
    } else if (!this.socket) {
      clearInterval(connectInterval);
      console.error('Socket initialization failed');
    }
  }, 100);
  
  // Timeout after 5 seconds
  setTimeout(() => {
    clearInterval(connectInterval);
    if (!this.socket?.connected) {
      console.error('Failed to connect to chat server');
    }
  }, 5000);
}

// Add a method to check connection status:
getConnectionStatus(): { isConnected: boolean, adminOnline: boolean } {
  return {
    isConnected: this.isSocketConnected(),
    adminOnline: this.adminStatusSubject.value.isOnline
  };
}

// Add a method to send typing indicator with better error handling:
sendTypingIndicator(receiverId: string, isTyping: boolean): void {
  if (!receiverId || !this.socket?.connected) {
    return;
  }
  
  try {
    this.socket.emit('typing', {
      receiverId,
      isTyping
    });
  } catch (error) {
    console.error('Error sending typing indicator:', error);
  }
}

// Update sendMessage method with better error handling:
sendMessage(senderId: string, receiverId: string, message: string, metadata?: any): void {
  if (!senderId || !receiverId || !message) {
    console.error('Missing required fields for sending message');
    return;
  }
  
  if (!this.socket?.connected) {
    console.error('Socket not connected, attempting to reconnect...');
    this.reconnect();
    
    // Try again after reconnection
    setTimeout(() => {
      if (this.socket?.connected) {
        this.sendMessage(senderId, receiverId, message, metadata);
      } else {
        console.error('Still not connected, message not sent');
      }
    }, 1000);
    return;
  }
  
  try {
    this.socket.emit('sendMessage', {
      senderId,
      receiverId,
      message,
      messageType: 'text',
      metadata
    });
  } catch (error) {
    console.error('Error sending message:', error);
  }
}

  // Send product inquiry
  sendProductInquiry(data: ProductInquiryData): void {
    if (!data.userId || !data.question) {
      console.error('Missing required fields for product inquiry');
      return;
    }
    
    if (!this.socket?.connected) {
      console.error('Socket not connected, cannot send inquiry');
      return;
    }
    
    this.socket.emit('productInquiry', data);
  }

  // Send admin product response
  sendAdminProductResponse(data: {
    userId: string;
    productId?: string;
    response: string;
    inquiryId?: string;
  }): void {
    if (!data.userId || !data.response) {
      console.error('Missing required fields for admin product response');
      return;
    }
    
    if (!this.socket?.connected) {
      console.error('Socket not connected, cannot send product response');
      return;
    }
    
    this.socket.emit('adminProductResponse', data);
  }

  // Get chat history via socket
  // In chat.service.ts, update the getSocketChatHistory method:

getSocketChatHistory(userId: string, targetId: string): void {
  if (!this.socket?.connected) {
    console.error('Socket not connected, cannot get history');
    // Try to reconnect
    this.reconnect();
    
    // Try again after reconnection
    setTimeout(() => {
      if (this.socket?.connected) {
        this.getSocketChatHistory(userId, targetId);
      }
    }, 1000);
    return;
  }
  
  console.log(`Requesting chat history for ${userId} with ${targetId}`);
  this.socket.emit('getChatHistory', { userId, targetId });
}
  // Mark message as read
  markAsRead(messageId: string, senderId: string, receiverId: string): void {
    if (!messageId || !senderId || !receiverId) {
      console.error('Missing required fields for marking message as read');
      return;
    }
    
    if (!this.socket?.connected) {
      return;
    }
    
    this.socket.emit('markAsRead', {
      messageId,
      senderId,
      receiverId
    });
  }

  // HTTP Methods
  private getAuthHeader() {
    const token = this.authService.getToken();
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  }

  getMessages(): Observable<{ messages: ChatMessage[] }> {
    return this.http.get<{ messages: ChatMessage[] }>(
      `${this.apiUrl}/chat/messages`, 
      this.getAuthHeader()
    );
  }

  getChatHistory(userId: string): Observable<{ messages: ChatMessage[] }> {
    return this.http.get<{ messages: ChatMessage[] }>(
      `${this.apiUrl}/chat/history/${userId}`, 
      this.getAuthHeader()
    );
  }

  markMessagesAsRead(messageIds: string[]): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/chat/mark-read`, 
      { messageIds }, 
      this.getAuthHeader()
    );
  }

  getUnreadCount(): Observable<{ count: number }> {
    return this.http.get<{ count: number }>(
      `${this.apiUrl}/chat/unread-count`, 
      this.getAuthHeader()
    );
  }

  getOnlineUsers(): Observable<{ users: User[], count: number }> {
    return this.http.get<{ users: User[], count: number }>(
      `${this.apiUrl}/chat/online-users`, 
      this.getAuthHeader()
    );
  }

  // Helper method to detect if message is a product inquiry
  isProductInquiry(message: string): boolean {
    if (!message) return false;
    
    const productKeywords = [
      'price', 'cost', 'how much',
      'stock', 'available', 'in stock',
      'specification', 'feature', 'detail',
      'delivery', 'shipping', 'dispatch',
      'discount', 'sale', 'offer',
      'compare', 'alternative', 'similar'
    ];
    
    return productKeywords.some(keyword => 
      message.toLowerCase().includes(keyword)
    );
  }

  // Extract product information from message
  extractProductInfo(message: string): { 
    productName?: string; 
    inquiryType?: string; 
  } {
    if (!message) return { inquiryType: 'general' };
    
    const lowerMessage = message.toLowerCase();
    
    // Detect inquiry type
    let inquiryType = 'general';
    if (lowerMessage.includes('price') || lowerMessage.includes('cost') || lowerMessage.includes('how much')) {
      inquiryType = 'price';
    } else if (lowerMessage.includes('stock') || lowerMessage.includes('available')) {
      inquiryType = 'availability';
    } else if (lowerMessage.includes('spec') || lowerMessage.includes('detail') || lowerMessage.includes('feature')) {
      inquiryType = 'specifications';
    } else if (lowerMessage.includes('delivery') || lowerMessage.includes('shipping')) {
      inquiryType = 'shipping';
    } else if (lowerMessage.includes('discount') || lowerMessage.includes('sale')) {
      inquiryType = 'discount';
    } else if (lowerMessage.includes('compare') || lowerMessage.includes('alternative')) {
      inquiryType = 'comparison';
    } else if (lowerMessage.includes('review') || lowerMessage.includes('rating')) {
      inquiryType = 'reviews';
    }
    
    // Try to extract product name (simple pattern matching)
    const words = message.split(' ');
    const productIndex = words.findIndex(word => 
      ['of', 'for', 'about', 'regarding', 'concerning'].includes(word.toLowerCase())
    );
    
    if (productIndex !== -1 && productIndex + 1 < words.length) {
      const productName = words.slice(productIndex + 1).join(' ');
      return { productName, inquiryType };
    }
    
    return { inquiryType };
  }

  // Check if socket is connected
  isSocketConnected(): boolean {
    return this.isConnected && this.socket?.connected === true;
  }

  // Reconnect socket
  reconnect(): void {
    this.initializeSocket();
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.isConnected = false;
    }
  }

  // New method: Get user display name (you might want to fetch actual user data)
  getUserDisplayName(userId: string): string {
    // In a real app, you would fetch user data from a service
    // For now, return a formatted version of the userId
    return `User ${userId.substring(0, 8)}...`;
  }
}