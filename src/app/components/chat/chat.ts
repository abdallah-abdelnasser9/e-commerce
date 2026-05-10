import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewChecked, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { ChatService } from '../../services/chat.service';
import { ProductService } from '../../services/product.service';
import { AuthService } from '../../services/auth.service';
import { ChatMessage, ProductInquiryData } from '../../models/chat.model';
import { Product } from '../../models/product.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <!-- Main Chat Container -->
    <div class="chat-app">
      <!-- Sidebar for Mobile -->
      <div class="sidebar-overlay" [class.active]="showMobileSidebar" (click)="toggleMobileSidebar()"></div>
      <div class="mobile-sidebar-toggle" (click)="toggleMobileSidebar()">
        <span class="toggle-icon">{{ showMobileSidebar ? '✕' : '☰' }}</span>
        <span class="toggle-text">Products</span>
      </div>

      <!-- Left Sidebar - Product Selection -->
      <div class="chat-sidebar" [class.active]="showMobileSidebar">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
          <div class="sidebar-avatar">
            <div class="avatar-initials">{{ getUserInitials() }}</div>
            <div class="avatar-status" [class.online]="isSocketConnected"></div>
          </div>
          <div class="sidebar-user-info">
            <h3>{{ user?.name || 'Guest' }}</h3>
            <p class="user-email">{{ user?.email || 'user@example.com' }}</p>
          </div>
          <button class="sidebar-close" (click)="toggleMobileSidebar()" *ngIf="showMobileSidebar">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Product Search Section -->
        <div class="product-search-section">
          <div class="section-header">
            <div class="section-icon">🛒</div>
            <div class="section-title">
              <h4>Product Inquiry</h4>
              <p class="section-subtitle">Ask about any product</p>
            </div>
          </div>

          <!-- Search Input -->
          <div class="search-container">
            <div class="search-input-wrapper">
              <svg class="search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" stroke-width="2"/>
                <path d="M21 21l-4.35-4.35" stroke-width="2" stroke-linecap="round"/>
              </svg>
              <input
                type="text"
                [(ngModel)]="productSearchTerm"
                (input)="onProductSearch()"
                placeholder="Search products..."
                class="search-input"
                (focus)="showProductSuggestions = true"
              />
              @if (productSearchTerm) {
                <button class="search-clear" (click)="clearSearch()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
              }
            </div>

            <!-- Product Suggestions -->
            @if (showProductSuggestions && filteredProducts.length > 0) {
              <div class="suggestions-dropdown">
                <div class="suggestions-header">
                  <span class="suggestions-title">Search Results</span>
                  <span class="suggestions-count">{{ filteredProducts.length }} found</span>
                </div>
                <div class="suggestions-list">
                  @for (product of filteredProducts; track product._id) {
                    <div class="suggestion-item" (click)="selectProduct(product)">
                      <div class="suggestion-image">
                        <img 
                          [src]="getSafeImageUrl(product.imageUrl, 'thumbnail')" 
                          alt="Product"
                          (error)="onImageError($event)"
                        />
                      </div>
                      <div class="suggestion-details">
                        <div class="suggestion-name">{{ product.name }}</div>
                      </div>
                      <div class="suggestion-arrow">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                          <path d="M9 18l6-6-6-6" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Selected Product -->
          @if (selectedProduct) {
            <div class="selected-product-card">
              <div class="selected-product-header">
                <div class="selected-product-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" 
                      stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span>Selected Product</span>
                </div>
                <button class="selected-product-remove" (click)="clearProductSelection()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
              <div class="selected-product-body">
                <div class="selected-product-image">
                  <img 
                    [src]="getSafeImageUrl(selectedProduct.imageUrl)" 
                    alt="Product" 
                    (error)="onSelectedProductImageError($event)"
                  />
                  <div class="product-stock-badge" [class.in-stock]="selectedProduct.stock > 0">
                    {{ selectedProduct.stock > 0 ? 'In Stock' : 'Out of Stock' }}
                  </div>
                </div>
                <div class="selected-product-info">
                  <h5>{{ selectedProduct.name }}</h5>
                  @if (selectedProduct.description) {
                    <p class="product-description">{{ selectedProduct.description | slice:0:100 }}...</p>
                  }
                </div>
              </div>
              <div class="selected-product-actions">
                <button class="btn-view-details" (click)="viewProductDetails()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke-width="2"/>
                    <circle cx="12" cy="12" r="3" stroke-width="2"/>
                  </svg>
                  View Details
                </button>
                <button class="btn-ask-about" (click)="focusMessageInput()">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2"/>
                  </svg>
                  Ask About This
                </button>
              </div>
            </div>
          } @else {
            <!-- Empty State -->
            <div class="empty-state">
              <div class="empty-state-icon">🛒</div>
              <h4>No Product Selected</h4>
              <p>Search for a product above to ask specific questions about it</p>
            </div>
          }

          <!-- Quick Questions -->
          @if (selectedProduct) {
            <div class="quick-questions-section">
              <div class="section-header">
                <div class="section-icon">⚡</div>
                <div class="section-title">
                  <h4>Quick Questions</h4>
                  <p class="section-subtitle">One-click common questions</p>
                </div>
              </div>
              <div class="quick-questions-grid">
                @for (question of quickQuestions; track question.type) {
                  <button 
                    class="quick-question-btn"
                    (click)="useQuickQuestion(question)"
                    [disabled]="!isSocketConnected"
                    [title]="question.text"
                  >
                    <span class="question-icon">{{ question.icon }}</span>
                    <span class="question-text">{{ question.text }}</span>
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <!-- Connection Status -->
        <div class="connection-status-card">
          <div class="connection-status-header">
            <div class="connection-icon">
              <div class="connection-dot" [class.connected]="isSocketConnected"></div>
            </div>
            <div class="connection-info">
              <h5>Chat Status</h5>
              <p class="connection-text">
                {{ isSocketConnected ? 'Connected to chat server' : 'Disconnected' }}
              </p>
            </div>
          </div>
          <div class="connection-details">
            <div class="connection-item">
              <span class="item-label">Support Status:</span>
              <span class="item-value" [class.online]="isAdminOnline" [class.offline]="!isAdminOnline">
                {{ isAdminOnline ? '🟢 Online' : '🔴 Offline' }}
              </span>
            </div>
            <div class="connection-item">
              <span class="item-label">Response Time:</span>
              <span class="item-value">{{ isAdminOnline ? '< 5 minutes' : 'When online' }}</span>
            </div>
          </div>
          <button class="btn-reconnect" (click)="reconnect()" [disabled]="isSocketConnected">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M23 4v6h-6M1 20v-6h6" stroke-width="2"/>
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" stroke-width="2"/>
            </svg>
            {{ isSocketConnected ? 'Connected' : 'Reconnect' }}
          </button>
        </div>
      </div>

      <!-- Main Chat Area -->
      <div class="chat-main-area">
        <!-- Chat Header -->
        <div class="chat-main-header">
          <div class="header-content">
            <div class="chat-info">
              <div class="chat-avatar">
                <div class="chat-avatar-icon">💬</div>
                <div class="chat-avatar-status" [class.online]="isAdminOnline"></div>
              </div>
              <div class="chat-details">
                <h2>Customer Support</h2>
                <div class="chat-status">
                  <span class="status-indicator" [class.online]="isAdminOnline"></span>
                  <span class="status-text">
                    {{ isAdminOnline ? 'Support agent is online' : 'Support agent is offline' }}
                  </span>
                  @if (isAdminTyping) {
                    <span class="typing-indicator-text">
                      <span class="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </span>
                      typing...
                    </span>
                  }
                </div>
              </div>
            </div>
            <div class="header-actions">
              <button class="btn-action" (click)="clearChat()" title="Clear chat">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" 
                    stroke-width="2"/>
                </svg>
              </button>
              <button class="btn-action" (click)="toggleTheme()" title="Toggle theme">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke-width="2"/>
                </svg>
              </button>
              <button class="btn-action btn-close" (click)="goHome()" title="Close chat">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Connection Banner -->
        @if (!isSocketConnected) {
          <div class="connection-banner offline">
            <div class="banner-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2"/>
              </svg>
              <span>Connection lost. Trying to reconnect...</span>
              <button class="banner-btn" (click)="reconnect()">Reconnect Now</button>
            </div>
          </div>
        }
        @if (isSocketConnected && !isAdminOnline) {
          <div class="connection-banner offline">
            <div class="banner-content">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" stroke-width="2"/>
              </svg>
              <span>Support is currently offline. Your messages will be saved and answered when available.</span>
            </div>
          </div>
        }

        <!-- Chat Messages Container -->
        <div class="chat-messages-container" #chatContainer (scroll)="onScroll()">
          @if (isLoading) {
            <div class="loading-state">
              <div class="loading-spinner">
                <div class="spinner-circle"></div>
              </div>
              <p>Loading your conversation...</p>
            </div>
          } @else {
            <!-- Welcome Message -->
            @if (messages.length === 0) {
              <div class="welcome-state">
                <div class="welcome-illustration">
                  <div class="illustration-circle">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke-width="2"/>
                    </svg>
                  </div>
                </div>
                <h3>Welcome to Customer Support! 👋</h3>
                <p class="welcome-subtitle">How can we help you today?</p>
                <div class="welcome-features">
                  <div class="feature-item">
                    <div class="feature-icon">🛒</div>
                    <div class="feature-text">
                      <strong>Product Inquiries</strong>
                      <span>Get information about any product</span>
                    </div>
                  </div>
                  <div class="feature-item">
                    <div class="feature-icon">⚡</div>
                    <div class="feature-text">
                      <strong>Quick Responses</strong>
                      <span>Fast answers to common questions</span>
                    </div>
                  </div>
                  <div class="feature-item">
                    <div class="feature-icon">👥</div>
                    <div class="feature-text">
                      <strong>24/7 Support</strong>
                      <span>Our team is here to help you</span>
                    </div>
                  </div>
                </div>
              </div>
            }

            <!-- Messages List -->
            <div class="messages-list">
              @for (message of messages; track message._id; let i = $index) {
                <!-- Date Separator -->
                @if (shouldShowDate(i)) {
                  <div class="date-separator">
                    <div class="separator-line"></div>
                    <span class="separator-text">{{ formatDate(message.createdAt) }}</span>
                    <div class="separator-line"></div>
                  </div>
                }

                <!-- Message Item -->
                <div class="message-item" 
                     [class.outgoing]="!isAdminMessage(message)" 
                     [class.incoming]="isAdminMessage(message)"
                     [class.product-inquiry]="isProductInquiryMessage(message)"
                     [class.auto-response]="isAutoResponseMessage(message)">
                  
                  <!-- Message Bubble -->
                  <div class="message-bubble">
                    <!-- Message Header -->
                    <div class="message-header">
                      <div class="message-sender">
                        @if (isAdminMessage(message)) {
                          <div class="sender-avatar admin">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke-width="2"/>
                              <circle cx="8.5" cy="7" r="4" stroke-width="2"/>
                              <path d="M20 8v6M23 11h-6" stroke-width="2"/>
                            </svg>
                          </div>
                          <span class="sender-name">Support Agent</span>
                        } @else {
                          <div class="sender-avatar user">
                            {{ getUserInitials() }}
                          </div>
                          <span class="sender-name">You</span>
                        }
                      </div>
                      <span class="message-time">{{ formatTime(message.createdAt) }}</span>
                    </div>

                    <!-- Message Content -->
                    <div class="message-content">
                      <!-- Badges -->
                      @if (isProductInquiryMessage(message)) {
                        <div class="message-badge product">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" stroke-width="2"/>
                            <line x1="7" y1="7" x2="7" y2="7" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                          Product Inquiry
                        </div>
                      }
                      @if (isAutoResponseMessage(message)) {
                        <div class="message-badge auto">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2"/>
                          </svg>
                          Automated Response
                        </div>
                      }

                      <!-- Message Text -->
                      <div class="message-text" [innerHTML]="formatMessage(message.message)"></div>

                      <!-- Message Footer -->
                      <div class="message-footer">
                        @if (!isAdminMessage(message)) {
                          <div class="message-status" [class.read]="message.isRead">
                            @if (message.isRead) {
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <path d="M20 6L9 17l-5-5" stroke-width="2" stroke-linecap="round"/>
                              </svg>
                              <span>Read</span>
                            } @else {
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                              </svg>
                              <span>Sent</span>
                            }
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              }

              <!-- Admin Typing Indicator -->
              @if (isAdminTyping) {
                <div class="typing-indicator incoming">
                  <div class="typing-bubble">
                    <div class="typing-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    <span class="typing-text">Support is typing...</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Message Input Area -->
        <div class="message-input-area" [class.disabled]="!isSocketConnected">
          @if (selectedProduct) {
            <div class="selected-product-preview">
              <div class="preview-content">
                <img 
                  [src]="getSafeImageUrl(selectedProduct.imageUrl, 'thumbnail')" 
                  alt="Product" 
                  class="preview-image"
                />
                <div class="preview-info">
                  <div class="preview-name">{{ selectedProduct.name | slice:0:30 }}{{ selectedProduct.name.length > 30 ? '...' : '' }}</div>
                  <div class="preview-tag">Selected Product</div>
                </div>
                <button class="preview-remove" (click)="clearProductSelection()">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M18 6L6 18M6 6l12 12" stroke-width="2" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            </div>
          }
          
          <div class="input-container">
            <div class="input-actions">
              <button class="input-action-btn" (click)="attachFile()" title="Attach file">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" 
                    stroke-width="2"/>
                </svg>
              </button>
              <button class="input-action-btn" (click)="addEmoji()" title="Add emoji">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" stroke-width="2"/>
                  <path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01" stroke-width="2"/>
                </svg>
              </button>
            </div>
            
            <textarea
              #messageInput
              [(ngModel)]="newMessage"
              (input)="onInputChange()"
              (keydown)="onKeyPress($event)"
              placeholder="Type your message here..."
              class="message-input"
              rows="1"
              [disabled]="!isSocketConnected || isSending"
            ></textarea>
            
            <div class="send-button-wrapper">
              <button 
                class="send-button"
                (click)="sendMessage()"
                [disabled]="!newMessage.trim() || isSending || !isSocketConnected"
                [class.sending]="isSending"
              >
                @if (isSending) {
                  <div class="sending-spinner">
                    <div class="spinner-dot"></div>
                    <div class="spinner-dot"></div>
                    <div class="spinner-dot"></div>
                  </div>
                } @else {
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" stroke-width="2"/>
                  </svg>
                }
              </button>
            </div>
          </div>
          
          <div class="input-footer">
            <div class="input-hint">
              @if (!isSocketConnected) {
                <span class="hint-warning">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke-width="2"/>
                  </svg>
                  Reconnect to send messages
                </span>
              } @else {
                <span class="hint-text">
                  Press <kbd>Enter</kbd> to send • <kbd>Shift</kbd> + <kbd>Enter</kbd> for new line
                </span>
              }
            </div>
            @if (isTyping) {
              <div class="typing-status">
                <span class="typing-dots small">
                  <span></span>
                  <span></span>
                  <span></span>
                </span>
                <span>You are typing...</span>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    /* Modern Chat App Styles */
    :host {
      display: block;
      height: 100vh;
      overflow: hidden;
    }

    .chat-app {
      display: flex;
      height: 100vh;
      background: #f8fafc;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    /* Sidebar Styles */
    .sidebar-overlay {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      z-index: 999;
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .sidebar-overlay.active {
      display: block;
      opacity: 1;
    }

    .mobile-sidebar-toggle {
      display: none;
      position: fixed;
      top: 20px;
      left: 20px;
      z-index: 1000;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 10px 16px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
      cursor: pointer;
      align-items: center;
      gap: 10px;
      font-size: 14px;
      font-weight: 500;
      color: #4a5568;
      transition: all 0.3s ease;
    }

    .mobile-sidebar-toggle:hover {
      background: #f7fafc;
      box-shadow: 0 6px 25px rgba(0, 0, 0, 0.1);
    }

    .toggle-icon {
      font-size: 18px;
    }

    .chat-sidebar {
      width: 360px;
      background: white;
      border-right: 1px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      transition: transform 0.3s ease;
      z-index: 1000;
    }

    .chat-sidebar.active {
      transform: translateX(0);
    }

    /* Sidebar Header */
    .sidebar-header {
      padding: 24px;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      align-items: center;
      gap: 16px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .sidebar-avatar {
      position: relative;
      flex-shrink: 0;
    }

    .avatar-initials {
      width: 48px;
      height: 48px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: 600;
      color: white;
    }

    .avatar-status {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      background: #48bb78;
    }

    .avatar-status.online {
      background: #48bb78;
    }

    .avatar-status:not(.online) {
      background: #e53e3e;
    }

    .sidebar-user-info {
      flex: 1;
    }

    .sidebar-user-info h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: white;
    }

    .user-email {
      margin: 4px 0 0;
      font-size: 13px;
      opacity: 0.9;
    }

    .sidebar-close {
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: background 0.2s;
    }

    .sidebar-close:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    /* Product Search Section */
    .product-search-section {
      padding: 24px;
      flex: 1;
      overflow-y: auto;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .section-icon {
      font-size: 24px;
    }

    .section-title h4 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: #2d3748;
    }

    .section-subtitle {
      margin: 4px 0 0;
      font-size: 13px;
      color: #718096;
    }

    /* Search Input */
    .search-container {
      position: relative;
      margin-bottom: 20px;
    }

    .search-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      color: #a0aec0;
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 12px 40px 12px 40px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      font-size: 14px;
      transition: all 0.3s ease;
      background: #f8fafc;
    }

    .search-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      background: white;
    }

    .search-clear {
      position: absolute;
      right: 12px;
      background: none;
      border: none;
      color: #a0aec0;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: color 0.2s;
    }

    .search-clear:hover {
      color: #4a5568;
    }

    /* Suggestions Dropdown */
    .suggestions-dropdown {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      margin-top: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      z-index: 100;
      overflow: hidden;
    }

    .suggestions-header {
      padding: 12px 16px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .suggestions-title {
      font-size: 13px;
      font-weight: 600;
      color: #4a5568;
    }

    .suggestions-count {
      font-size: 12px;
      color: #718096;
      background: #edf2f7;
      padding: 2px 8px;
      border-radius: 12px;
    }

    .suggestions-list {
      max-height: 300px;
      overflow-y: auto;
    }

    .suggestion-item {
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      transition: background 0.2s;
      border-bottom: 1px solid #f1f5f9;
    }

    .suggestion-item:last-child {
      border-bottom: none;
    }

    .suggestion-item:hover {
      background: #f8fafc;
    }

    .suggestion-image {
      width: 40px;
      height: 40px;
      border-radius: 8px;
      overflow: hidden;
      flex-shrink: 0;
    }

    .suggestion-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .suggestion-details {
      flex: 1;
      min-width: 0;
    }

    .suggestion-name {
      font-size: 14px;
      font-weight: 500;
      color: #2d3748;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .suggestion-price {
      font-size: 13px;
      color: #48bb78;
      font-weight: 600;
      margin-top: 2px;
    }

    .suggestion-arrow {
      color: #cbd5e0;
    }

    /* Selected Product Card */
    .selected-product-card {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 24px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
      animation: slideIn 0.3s ease;
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .selected-product-header {
      padding: 12px 16px;
      background: linear-gradient(135deg, #4299e1 0%, #3182ce 100%);
      color: white;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .selected-product-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 500;
    }

    .selected-product-remove {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      color: white;
      cursor: pointer;
      padding: 6px;
      border-radius: 6px;
      transition: background 0.2s;
    }

    .selected-product-remove:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    .selected-product-body {
      padding: 16px;
      display: flex;
      gap: 16px;
    }

    .selected-product-image {
      position: relative;
      flex-shrink: 0;
    }

    .selected-product-image img {
      width: 80px;
      height: 80px;
      border-radius: 12px;
      object-fit: cover;
    }

    .product-stock-badge {
      position: absolute;
      bottom: -6px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 11px;
      font-weight: 600;
      padding: 3px 8px;
      border-radius: 10px;
      white-space: nowrap;
    }

    .product-stock-badge.in-stock {
      background: #48bb78;
      color: white;
    }

    .product-stock-badge:not(.in-stock) {
      background: #fed7d7;
      color: #c53030;
    }

    .selected-product-info {
      flex: 1;
    }

    .selected-product-info h5 {
      margin: 0 0 8px;
      font-size: 16px;
      font-weight: 600;
      color: #2d3748;
    }

    .product-price {
      font-size: 18px;
      font-weight: 700;
      color: #4299e1;
      margin-bottom: 8px;
    }

    .product-description {
      font-size: 13px;
      color: #718096;
      line-height: 1.4;
      margin: 0;
    }

    .selected-product-actions {
      padding: 12px 16px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      gap: 8px;
    }

    .btn-view-details, .btn-ask-about {
      flex: 1;
      padding: 10px;
      border: none;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      transition: all 0.2s;
    }

    .btn-view-details {
      background: #edf2f7;
      color: #4a5568;
    }

    .btn-view-details:hover {
      background: #e2e8f0;
    }

    .btn-ask-about {
      background: #4299e1;
      color: white;
    }

    .btn-ask-about:hover {
      background: #3182ce;
    }

    /* Empty State */
    .empty-state {
      text-align: center;
      padding: 40px 20px;
      color: #a0aec0;
    }

    .empty-state-icon {
      font-size: 48px;
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .empty-state h4 {
      margin: 0 0 8px;
      font-size: 16px;
      font-weight: 600;
      color: #4a5568;
    }

    .empty-state p {
      margin: 0;
      font-size: 14px;
      line-height: 1.4;
    }

    /* Quick Questions */
    .quick-questions-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .quick-question-btn {
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: white;
      color: #4a5568;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      text-align: center;
    }

    .quick-question-btn:hover:not(:disabled) {
      border-color: #667eea;
      background: #f7fafc;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    }

    .quick-question-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .question-icon {
      font-size: 20px;
    }

    .question-text {
      line-height: 1.2;
    }

    /* Connection Status Card */
    .connection-status-card {
      padding: 20px;
      background: white;
      border-top: 1px solid #e2e8f0;
    }

    .connection-status-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .connection-icon {
      position: relative;
    }

    .connection-dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: #e53e3e;
    }

    .connection-dot.connected {
      background: #48bb78;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0 rgba(72, 187, 120, 0.7);
      }
      70% {
        box-shadow: 0 0 0 6px rgba(72, 187, 120, 0);
      }
      100% {
        box-shadow: 0 0 0 0 rgba(72, 187, 120, 0);
      }
    }

    .connection-info h5 {
      margin: 0;
      font-size: 14px;
      font-weight: 600;
      color: #2d3748;
    }

    .connection-text {
      margin: 4px 0 0;
      font-size: 13px;
      color: #718096;
    }

    .connection-details {
      margin-bottom: 16px;
    }

    .connection-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid #f1f5f9;
    }

    .connection-item:last-child {
      border-bottom: none;
    }

    .item-label {
      font-size: 13px;
      color: #718096;
    }

    .item-value {
      font-size: 13px;
      font-weight: 500;
    }

    .item-value.online {
      color: #48bb78;
    }

    .item-value.offline {
      color: #e53e3e;
    }

    .btn-reconnect {
      width: 100%;
      padding: 12px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: white;
      color: #4a5568;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }

    .btn-reconnect:hover:not(:disabled) {
      border-color: #667eea;
      color: #667eea;
      background: #f7fafc;
    }

    .btn-reconnect:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    /* Main Chat Area */
    .chat-main-area {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    /* Chat Header */
    .chat-main-header {
      padding: 16px 24px;
      background: white;
      border-bottom: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chat-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .chat-avatar {
      position: relative;
    }

    .chat-avatar-icon {
      width: 48px;
      height: 48px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      color: white;
    }

    .chat-avatar-status {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid white;
      background: #e53e3e;
    }

    .chat-avatar-status.online {
      background: #48bb78;
    }

    .chat-details h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #2d3748;
    }

    .chat-status {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
    }

    .status-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #e53e3e;
    }

    .status-indicator.online {
      background: #48bb78;
      animation: pulse 2s infinite;
    }

    .status-text {
      font-size: 14px;
      color: #718096;
    }

    .typing-indicator-text {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: #667eea;
    }

    .typing-dots {
      display: flex;
      gap: 3px;
    }

    .typing-dots span {
      width: 6px;
      height: 6px;
      background: currentColor;
      border-radius: 50%;
      animation: typing 1.4s infinite ease-in-out;
    }

    .typing-dots span:nth-child(1) { animation-delay: -0.32s; }
    .typing-dots span:nth-child(2) { animation-delay: -0.16s; }

    @keyframes typing {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .btn-action {
      width: 40px;
      height: 40px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: white;
      color: #4a5568;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .btn-action:hover {
      border-color: #cbd5e0;
      background: #f7fafc;
    }

    .btn-close:hover {
      border-color: #fed7d7;
      background: #fff5f5;
      color: #e53e3e;
    }

    /* Connection Banner */
    .connection-banner {
      padding: 12px 24px;
      background: #fff5f5;
      border-bottom: 1px solid #fed7d7;
      color: #c53030;
    }

    .connection-banner.offline {
      background: #fff5f5;
      border-color: #fed7d7;
      color: #c53030;
    }

    .banner-content {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 14px;
    }

    .banner-btn {
      margin-left: auto;
      padding: 6px 12px;
      border: 1px solid #c53030;
      border-radius: 6px;
      background: #c53030;
      color: white;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }

    .banner-btn:hover {
      background: #e53e3e;
    }

    /* Chat Messages Container */
    .chat-messages-container {
      flex: 1;
      overflow-y: auto;
      padding: 24px;
      background: #f8fafc;
      scroll-behavior: smooth;
    }

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: #a0aec0;
    }

    .loading-spinner {
      margin-bottom: 16px;
    }

    .spinner-circle {
      width: 48px;
      height: 48px;
      border: 3px solid #e2e8f0;
      border-top-color: #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Welcome State */
    .welcome-state {
      text-align: center;
      padding: 60px 20px;
      max-width: 500px;
      margin: 0 auto;
    }

    .welcome-illustration {
      margin-bottom: 24px;
    }

    .illustration-circle {
      width: 96px;
      height: 96px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
      color: white;
    }

    .welcome-state h3 {
      margin: 0 0 8px;
      font-size: 24px;
      font-weight: 600;
      color: #2d3748;
    }

    .welcome-subtitle {
      margin: 0 0 32px;
      font-size: 16px;
      color: #718096;
    }

    .welcome-features {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .feature-item {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 16px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      text-align: left;
    }

    .feature-icon {
      font-size: 24px;
      flex-shrink: 0;
    }

    .feature-text {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .feature-text strong {
      font-size: 14px;
      font-weight: 600;
      color: #2d3748;
    }

    .feature-text span {
      font-size: 13px;
      color: #718096;
    }

    /* Messages List */
    .messages-list {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    /* Date Separator */
    .date-separator {
      display: flex;
      align-items: center;
      gap: 16px;
      margin: 20px 0;
    }

    .separator-line {
      flex: 1;
      height: 1px;
      background: #e2e8f0;
    }

    .separator-text {
      font-size: 13px;
      color: #a0aec0;
      font-weight: 500;
      padding: 4px 12px;
      background: white;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
    }

    /* Message Item */
    .message-item {
      display: flex;
      animation: messageSlide 0.3s ease;
    }

    @keyframes messageSlide {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .message-item.outgoing {
      justify-content: flex-end;
    }

    .message-item.incoming {
      justify-content: flex-start;
    }

    /* Message Bubble */
    .message-bubble {
      max-width: 70%;
      background: white;
      border-radius: 18px;
      padding: 16px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid #e2e8f0;
    }

    .message-item.outgoing .message-bubble {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-color: transparent;
      color: white;
    }

    .message-item.product-inquiry .message-bubble {
      border-left: 4px solid #4299e1;
    }

    .message-item.auto-response .message-bubble {
      border-left: 4px solid #48bb78;
    }

    /* Message Header */
    .message-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .message-sender {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .sender-avatar {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: 600;
    }

    .sender-avatar.admin {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
    }

    .sender-avatar.user {
      background: rgba(72, 187, 120, 0.1);
      color: #48bb78;
    }

    .message-item.outgoing .sender-avatar.user {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .sender-name {
      font-size: 13px;
      font-weight: 600;
    }

    .message-item.outgoing .sender-name {
      color: rgba(255, 255, 255, 0.9);
    }

    .message-time {
      font-size: 12px;
      color: #a0aec0;
    }

    .message-item.outgoing .message-time {
      color: rgba(255, 255, 255, 0.7);
    }

    /* Message Content */
    .message-content {
      position: relative;
    }

    .message-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 500;
      padding: 4px 8px;
      border-radius: 6px;
      margin-bottom: 8px;
    }

    .message-badge.product {
      background: rgba(66, 153, 225, 0.1);
      color: #4299e1;
    }

    .message-badge.auto {
      background: rgba(72, 187, 120, 0.1);
      color: #48bb78;
    }

    .message-item.outgoing .message-badge {
      background: rgba(255, 255, 255, 0.2);
      color: white;
    }

    .message-text {
      font-size: 14px;
      line-height: 1.5;
      word-wrap: break-word;
    }

    .message-text a {
      color: #4299e1;
      text-decoration: none;
    }

    .message-text a:hover {
      text-decoration: underline;
    }

    .message-item.outgoing .message-text a {
      color: white;
      text-decoration: underline;
    }

    /* Message Footer */
    .message-footer {
      margin-top: 8px;
      display: flex;
      justify-content: flex-end;
    }

    .message-status {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #a0aec0;
    }

    .message-status.read {
      color: #48bb78;
    }

    .message-item.outgoing .message-status {
      color: rgba(255, 255, 255, 0.7);
    }

    .message-item.outgoing .message-status.read {
      color: rgba(255, 255, 255, 0.9);
    }

    /* Typing Indicator */
    .typing-indicator {
      display: flex;
      justify-content: flex-start;
    }

    .typing-indicator.incoming .typing-bubble {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 18px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .typing-text {
      font-size: 13px;
      color: #718096;
    }

    /* Message Input Area */
    .message-input-area {
      padding: 20px 24px;
      background: white;
      border-top: 1px solid #e2e8f0;
      position: relative;
    }

    .message-input-area.disabled {
      opacity: 0.7;
      pointer-events: none;
    }

    .selected-product-preview {
      background: #f7fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 12px;
      margin-bottom: 12px;
      animation: slideIn 0.3s ease;
    }

    .preview-content {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .preview-image {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      object-fit: cover;
    }

    .preview-info {
      flex: 1;
    }

    .preview-name {
      font-size: 13px;
      font-weight: 500;
      color: #2d3748;
    }

    .preview-tag {
      font-size: 11px;
      color: #4299e1;
      background: rgba(66, 153, 225, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      display: inline-block;
      margin-top: 2px;
    }

    .preview-remove {
      background: none;
      border: none;
      color: #a0aec0;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: color 0.2s;
    }

    .preview-remove:hover {
      color: #4a5568;
    }

    /* Input Container */
    .input-container {
      display: flex;
      align-items: flex-end;
      gap: 12px;
    }

    .input-actions {
      display: flex;
      gap: 8px;
      align-self: flex-end;
      margin-bottom: 10px;
    }

    .input-action-btn {
      width: 36px;
      height: 36px;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      background: white;
      color: #a0aec0;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .input-action-btn:hover {
      border-color: #cbd5e0;
      color: #4a5568;
      background: #f7fafc;
    }

    .message-input {
      flex: 1;
      padding: 12px 16px;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.5;
      resize: none;
      max-height: 120px;
      min-height: 44px;
      background: #f8fafc;
      transition: all 0.3s ease;
      font-family: inherit;
    }

    .message-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
      background: white;
    }

    .message-input::placeholder {
      color: #a0aec0;
    }

    .send-button-wrapper {
      align-self: flex-end;
      margin-bottom: 10px;
    }

    .send-button {
      width: 44px;
      height: 44px;
      border: none;
      border-radius: 12px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .send-button:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .send-button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    .send-button.sending {
      background: #a0aec0;
    }

    .sending-spinner {
      display: flex;
      gap: 3px;
    }

    .spinner-dot {
      width: 6px;
      height: 6px;
      background: white;
      border-radius: 50%;
      animation: bounce 1.4s infinite ease-in-out;
    }

    .spinner-dot:nth-child(1) { animation-delay: -0.32s; }
    .spinner-dot:nth-child(2) { animation-delay: -0.16s; }

    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }

    /* Input Footer */
    .input-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 8px;
    }

    .input-hint {
      font-size: 12px;
      color: #a0aec0;
    }

    .hint-warning {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #e53e3e;
    }

    .hint-text kbd {
      font-family: monospace;
      background: #edf2f7;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 11px;
      color: #4a5568;
      border: 1px solid #cbd5e0;
    }

    .typing-status {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #718096;
    }

    .typing-dots.small span {
      width: 4px;
      height: 4px;
      background: #718096;
    }

    /* Responsive Design */
    @media (max-width: 1024px) {
      .chat-sidebar {
        position: fixed;
        left: 0;
        top: 0;
        bottom: 0;
        transform: translateX(-100%);
        box-shadow: 10px 0 30px rgba(0, 0, 0, 0.1);
      }
      
      .mobile-sidebar-toggle {
        display: flex;
      }
      
      .chat-sidebar {
        width: 320px;
      }
    }

    @media (max-width: 768px) {
      .chat-app {
        flex-direction: column;
      }
      
      .chat-main-header {
        padding: 12px 16px;
      }
      
      .chat-details h2 {
        font-size: 18px;
      }
      
      .chat-messages-container {
        padding: 16px;
      }
      
      .message-bubble {
        max-width: 85%;
      }
      
      .quick-questions-grid {
        grid-template-columns: 1fr;
      }
      
      .input-container {
        gap: 8px;
      }
      
      .message-input-area {
        padding: 16px;
      }
      
      .selected-product-body {
        flex-direction: column;
        text-align: center;
      }
      
      .selected-product-image {
        align-self: center;
      }
    }

    @media (max-width: 480px) {
      .chat-sidebar {
        width: 100%;
      }
      
      .message-bubble {
        max-width: 90%;
      }
      
      .welcome-features {
        gap: 12px;
      }
      
      .feature-item {
        padding: 12px;
      }
    }

    /* Scrollbar Styling */
    ::-webkit-scrollbar {
      width: 6px;
    }

    ::-webkit-scrollbar-track {
      background: #f1f5f9;
      border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb {
      background: #cbd5e0;
      border-radius: 3px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: #a0aec0;
    }

    /* Dark Mode Support */
    @media (prefers-color-scheme: dark) {
      .chat-app {
        background: #1a202c;
      }
      
      .chat-sidebar, 
      .chat-main-header,
      .message-input-area,
      .selected-product-card,
      .connection-status-card,
      .quick-question-btn,
      .btn-action,
      .btn-reconnect,
      .feature-item,
      .message-bubble,
      .input-action-btn,
      .typing-indicator.incoming .typing-bubble {
        background: #2d3748;
        border-color: #4a5568;
        color: #e2e8f0;
      }
      
      .search-input,
      .message-input {
        background: #4a5568;
        border-color: #718096;
        color: #e2e8f0;
      }
      
      .search-input:focus,
      .message-input:focus {
        background: #4a5568;
        border-color: #667eea;
      }
      
      .suggestions-dropdown {
        background: #2d3748;
        border-color: #4a5568;
      }
      
      .suggestions-header {
        background: #4a5568;
        border-color: #718096;
      }
      
      .suggestion-item {
        border-color: #4a5568;
      }
      
      .suggestion-item:hover {
        background: #4a5568;
      }
      
      .chat-messages-container {
        background: #1a202c;
      }
      
      .separator-text {
        background: #2d3748;
        border-color: #4a5568;
        color: #a0aec0;
      }
      
      .separator-line {
        background: #4a5568;
      }
      
      .message-item.outgoing .message-bubble {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      }
    }
  `
})
export class ChatComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('chatContainer') private chatContainer!: ElementRef<HTMLDivElement>;
  @ViewChild('messageInput') private messageInput!: ElementRef<HTMLTextAreaElement>;
  
  // Services
  private chatService = inject(ChatService);
  private productService = inject(ProductService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdRef = inject(ChangeDetectorRef);
  
  // Chat state
  messages: ChatMessage[] = [];
  newMessage: string = '';
  isTyping: boolean = false;
  isAdminTyping: boolean = false;
  isSending: boolean = false;
  user: User | null = null;
  userId: string = '';
  
  // Product inquiry state
  products: Product[] = [];
  filteredProducts: Product[] = [];
  showProductSuggestions: boolean = false;
  productSearchTerm: string = '';
  selectedProduct: Product | null = null;
  
  // Connection status
  isAdminOnline: boolean = false;
  isSocketConnected: boolean = false;
  connectionStatus: string = 'Connecting...';
  
  // Quick questions
  quickQuestions = [
    { text: 'What is the price?', type: 'price', icon: '💰' },
    { text: 'Is it in stock?', type: 'stock', icon: '📦' },
    { text: 'What are the specifications?', type: 'specs', icon: '📋' },
    { text: 'What is the delivery time?', type: 'delivery', icon: '🚚' },
    { text: 'Any discounts available?', type: 'discount', icon: '💸' }
  ];
  
  // Loading states
  isLoading: boolean = true;
  
  // Auto-scroll
  shouldScroll: boolean = true;
  
  // Mobile sidebar
  showMobileSidebar: boolean = false;
  
  // Timers
  private typingTimer: any;
  private reconnectTimer: any;
  private typingTimeout = 2000;
  private reconnectInterval = 5000;

  constructor() {
    this.messages = [];
    this.products = [];
    this.filteredProducts = [];
  }

  ngOnInit(): void {
    this.initializeUser();
    this.initializeSocket();
    this.subscribeToEvents();
    this.loadInitialData();
    this.checkForProductInUrl();
  }

  ngOnDestroy(): void {
    this.cleanup();
  }

  ngAfterViewChecked(): void {
    if (this.shouldScroll) {
      this.scrollToBottom();
    }
  }

  private initializeUser(): void {
    // Get current user from auth service or create a test user
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      this.user = currentUser;
      this.userId = currentUser._id;
    } else {
      // For testing, create a mock user
      this.user = {
        _id: 'user_' + Date.now(),
        email: 'user@example.com',
        name: 'Guest User',
        role: 'user'
      } as User;
      this.userId = this.user._id;
    }
    
    console.log('Initialized user:', this.userId);
  }

  private initializeSocket(): void {
    this.chatService.reconnect();
    
    // Check initial connection status
    setTimeout(() => {
      this.isSocketConnected = this.chatService.isSocketConnected();
      this.updateConnectionStatus();
      this.cdRef.detectChanges();
    }, 1000);
  }

  private subscribeToEvents(): void {
    // Messages
    this.chatService.messages$.subscribe({
      next: (message) => {
        console.log('New message received:', message);
        this.handleIncomingMessage(message);
      },
      error: (error) => {
        console.error('Error in messages subscription:', error);
      }
    });

    // Admin status
    this.chatService.adminStatus$.subscribe({
      next: (status) => {
        console.log('Admin status update:', status);
        this.isAdminOnline = status.isOnline;
        this.updateConnectionStatus();
        this.cdRef.detectChanges();
      }
    });

    // Typing indicators
    this.chatService.typing$.subscribe({
      next: (data) => {
        if (data.userId === 'admin') {
          this.isAdminTyping = data.isTyping;
          this.cdRef.detectChanges();
          
          // Clear typing indicator after timeout
          if (data.isTyping) {
            setTimeout(() => {
              this.isAdminTyping = false;
              this.cdRef.detectChanges();
            }, this.typingTimeout);
          }
        }
      }
    });

    // Message status
    this.chatService.messageStatus$.subscribe({
      next: (status) => {
        console.log('Message status:', status);
        // Update message read status
        const messageIndex = this.messages.findIndex(m => m._id === status.messageId);
        if (messageIndex !== -1) {
          this.messages[messageIndex].isRead = status.status === 'read';
          this.cdRef.detectChanges();
        }
      }
    });

    // Auto-response
    this.chatService.autoResponse$.subscribe({
      next: (response) => {
        console.log('Auto-response:', response);
      }
    });

    // User activity
    this.chatService.userActivity$.subscribe({
      next: (activity) => {
        console.log('User activity:', activity);
      }
    });

    // Admin message sent
    this.chatService.adminMessageSent$.subscribe({
      next: (message) => {
        console.log('Admin message sent:', message);
      }
    });

    // Connection status check
    setInterval(() => {
      const wasConnected = this.isSocketConnected;
      this.isSocketConnected = this.chatService.isSocketConnected();
      
      if (wasConnected !== this.isSocketConnected) {
        this.updateConnectionStatus();
        this.cdRef.detectChanges();
      }
    }, 3000);
  }

  private loadInitialData(): void {
    this.isLoading = true;
    
    // Join chat with user ID
    setTimeout(() => {
      if (this.userId) {
        this.chatService.joinChat(this.userId);
        
        // Load chat history with admin
        this.chatService.getSocketChatHistory(this.userId, 'admin');
        
        // Load initial messages via HTTP as fallback
        this.chatService.getMessages().subscribe({
          next: (response) => {
            if (response.messages && response.messages.length > 0) {
              this.messages = response.messages;
            } else {
              // Add welcome message if no messages
              this.messages = [{
                _id: 'welcome_1',
                sender: 'admin',
                receiver: this.userId,
                message: '👋 Hello! Welcome to our customer support chat. How can I help you today?',
                isRead: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              }];
            }
            this.isLoading = false;
            this.shouldScroll = true;
            this.cdRef.detectChanges();
          },
          error: (error) => {
            console.error('Error loading messages:', error);
            this.isLoading = false;
            this.cdRef.detectChanges();
          }
        });
      } else {
        this.isLoading = false;
        this.cdRef.detectChanges();
      }
    }, 500);
  }

  private handleIncomingMessage(message: ChatMessage): void {
    // Check if message is for this user
    if (message.receiver === this.userId || message.sender === 'admin') {
      const exists = this.messages.some(m => m._id === message._id);
      if (!exists) {
        this.messages.push(message);
        this.shouldScroll = true;
        
        // Mark as read if it's from admin
        if (message.sender === 'admin' && !message.isRead) {
          this.chatService.markAsRead(message._id, 'admin', this.userId);
        }
        
        this.cdRef.detectChanges();
      }
    }
  }

  private updateConnectionStatus(): void {
    if (!this.isSocketConnected) {
      this.connectionStatus = '🔴 Disconnected';
    } else if (this.isAdminOnline) {
      this.connectionStatus = '🟢 Online';
    } else {
      this.connectionStatus = '🟡 Support Offline';
    }
  }

  // Send message
  sendMessage(): void {
    if (!this.canSendMessage()) {
      return;
    }

    const messageText = this.newMessage.trim();
    if (!messageText) return;

    this.isSending = true;
    this.isTyping = false;
    
    // Create temporary message for immediate display
    const tempId = 'temp_' + Date.now();
    const userMessage: ChatMessage = {
      _id: tempId,
      sender: this.userId,
      receiver: 'admin',
      message: messageText,
      messageType: 'text',
      metadata: this.selectedProduct ? {
        productId: this.selectedProduct._id,
        productName: this.selectedProduct.name,
        type: 'product_inquiry'
      } : {},
      isRead: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    this.messages.push(userMessage);
    this.newMessage = '';
    this.shouldScroll = true;
    this.cdRef.detectChanges();
    
    // Auto-resize textarea
    this.resizeTextarea();
    
    // Send via socket
    try {
      if (this.selectedProduct && this.isProductInquiry(messageText)) {
        // Send as product inquiry
        const inquiryData: ProductInquiryData = {
          userId: this.userId,
          productId: this.selectedProduct._id,
          productName: this.selectedProduct.name,
          question: messageText
        };
        this.chatService.sendProductInquiry(inquiryData);
      } else {
        // Send as regular message
        this.chatService.sendMessage(this.userId, 'admin', messageText, 
          this.selectedProduct ? {
            productId: this.selectedProduct._id,
            productName: this.selectedProduct.name
          } : undefined
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      this.showError('Failed to send message');
    } finally {
      setTimeout(() => {
        this.isSending = false;
        this.cdRef.detectChanges();
      }, 500);
    }
  }

  isProductInquiry(messageText: string): boolean {
    return this.chatService.isProductInquiry(messageText);
  }

  // Product search
  searchProducts(): void {
    if (!this.productSearchTerm.trim()) {
      this.filteredProducts = [];
      this.showProductSuggestions = false;
      return;
    }
    
    this.filteredProducts = this.products
      .filter(p => 
        p.name.toLowerCase().includes(this.productSearchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(this.productSearchTerm.toLowerCase()))
      )
      .slice(0, 5);
    
    this.showProductSuggestions = this.filteredProducts.length > 0;
    this.cdRef.detectChanges();
  }

  onProductSearch(): void {
    this.searchProducts();
  }

  // Quick questions
  useQuickQuestion(question: any): void {
    if (!this.selectedProduct) return;
    
    let questionText = '';
    switch (question.type) {
      case 'price':
        questionText = `What is the price of ${this.selectedProduct.name}?`;
        break;
      case 'stock':
        questionText = `Is ${this.selectedProduct.name} in stock?`;
        break;
      case 'specs':
        questionText = `What are the specifications of ${this.selectedProduct.name}?`;
        break;
      case 'delivery':
        questionText = `What is the delivery time for ${this.selectedProduct.name}?`;
        break;
      case 'discount':
        questionText = `Are there any discounts available for ${this.selectedProduct.name}?`;
        break;
      default:
        questionText = question.text;
    }
    
    this.newMessage = questionText;
    this.cdRef.detectChanges();
    this.focusMessageInput();
    
    // Auto-resize textarea
    this.resizeTextarea();
  }

  // Typing indicator
  onInputChange(): void {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    
    // Auto-resize textarea
    this.resizeTextarea();
    
    if (this.newMessage.trim() && !this.isTyping) {
      this.isTyping = true;
      this.chatService.sendTypingIndicator('admin', true);
      this.cdRef.detectChanges();
    }
    
    this.typingTimer = setTimeout(() => {
      if (this.isTyping) {
        this.isTyping = false;
        this.chatService.sendTypingIndicator('admin', false);
        this.cdRef.detectChanges();
      }
    }, 1000);
  }

  // Keyboard handling
  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  // Resize textarea
  private resizeTextarea(): void {
    setTimeout(() => {
      if (this.messageInput?.nativeElement) {
        const textarea = this.messageInput.nativeElement;
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
      }
    }, 0);
  }

  // Reconnect
  reconnect(): void {
    this.chatService.reconnect();
    setTimeout(() => {
      this.isSocketConnected = this.chatService.isSocketConnected();
      this.updateConnectionStatus();
      this.cdRef.detectChanges();
    }, 500);
  }

  // Toggle mobile sidebar
  toggleMobileSidebar(): void {
    this.showMobileSidebar = !this.showMobileSidebar;
    this.cdRef.detectChanges();
  }

  // Toggle theme
  toggleTheme(): void {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', newTheme);
  }

  // Clear chat
  clearChat(): void {
    if (confirm('Are you sure you want to clear the chat history? This will only clear your local view.')) {
      this.messages = [];
      this.cdRef.detectChanges();
    }
  }

  // Attach file (placeholder)
  attachFile(): void {
    alert('File attachment functionality coming soon!');
  }

  // Add emoji (placeholder)
  addEmoji(): void {
    alert('Emoji picker coming soon!');
  }

  // Helper methods
  private canSendMessage(): boolean {
    return this.isSocketConnected && 
           !this.isSending && 
           !!this.newMessage.trim();
  }

  private showError(message: string): void {
    console.error('Error:', message);
    // You can implement toast notification here
  }

  private cleanup(): void {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.chatService.disconnect();
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

  formatMessage(text: string): string {
    return text.replace(/\n/g, '<br>');
  }

  isAdminMessage(message: ChatMessage): boolean {
    return message.sender === 'admin';
  }

  isProductInquiryMessage(message: ChatMessage): boolean {
    return message.messageType === 'product_inquiry' || 
           message.message.includes('Product Inquiry') ||
           message.metadata?.type === 'product_inquiry';
  }

  isAutoResponseMessage(message: ChatMessage): boolean {
    return message.messageType === 'auto_response' ||
           message.metadata?.type === 'auto_response';
  }

  shouldShowDate(index: number): boolean {
    if (index === 0) return true;
    if (!this.messages || this.messages.length === 0) return false;
    
    const current = this.messages[index];
    const previous = this.messages[index - 1];
    
    if (!current || !previous) return false;
    
    const currentDate = this.formatDate(current.createdAt);
    const previousDate = this.formatDate(previous.createdAt);
    
    return currentDate !== previousDate;
  }

  formatDate(timestamp: string): string {
    try {
      const date = new Date(timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (date.toDateString() === today.toDateString()) {
        return 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
      } else {
        return date.toLocaleDateString([], {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
        });
      }
    } catch {
      return 'Unknown date';
    }
  }

  getProductNameFromInquiry(message: ChatMessage): string {
    if (message.metadata?.productName) {
      return message.metadata.productName;
    }
    
    if (message.message.includes('Product Inquiry:')) {
      const parts = message.message.split('Product Inquiry:');
      if (parts[1]) {
        return parts[1].split('\n')[0].trim();
      }
    }
    
    return 'Product Inquiry';
  }

  // Get user initials
  getUserInitials(): string {
    if (!this.user?.name) return 'GU';
    return this.user.name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  // Navigation
  goHome(): void {
    this.router.navigate(['/']);
  }

  // Product methods
  clearSearch(): void {
    this.productSearchTerm = '';
    this.filteredProducts = [];
    this.showProductSuggestions = false;
    this.cdRef.detectChanges();
  }

  selectProduct(product: Product): void {
    this.selectedProduct = product;
    this.productSearchTerm = product.name;
    this.showProductSuggestions = false;
    this.showMobileSidebar = false;
    this.focusMessageInput();
    this.cdRef.detectChanges();
  }

  clearProductSelection(): void {
    this.selectedProduct = null;
    this.productSearchTerm = '';
    this.cdRef.detectChanges();
  }

  viewProductDetails(): void {
    if (this.selectedProduct) {
      this.router.navigate(['/product', this.selectedProduct._id]);
    }
  }

  focusMessageInput(): void {
    setTimeout(() => {
      if (this.messageInput?.nativeElement) {
        this.messageInput.nativeElement.focus();
      }
    }, 100);
  }

  onScroll(): void {
    this.shouldScroll = false;
  }

  scrollToBottom(): void {
    try {
      setTimeout(() => {
        if (this.chatContainer?.nativeElement) {
          const container = this.chatContainer.nativeElement;
          container.scrollTop = container.scrollHeight;
          this.shouldScroll = false;
        }
      }, 100);
    } catch (err) {
      console.error('Scroll error:', err);
    }
  }

  // Image error handlers
  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://via.placeholder.com/400x400/667eea/ffffff?text=Product';
    img.onerror = null;
  }

  onSelectedProductImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'https://via.placeholder.com/800x600/667eea/ffffff?text=Product+Image';
    img.onerror = null;
  }

  getSafeImageUrl(imageUrl: string | undefined, type: 'thumbnail' | 'full' = 'thumbnail'): string {
    if (!imageUrl || imageUrl.trim() === '') {
      return type === 'thumbnail' 
        ? 'https://via.placeholder.com/400x400/667eea/ffffff?text=Product'
        : 'https://via.placeholder.com/800x600/667eea/ffffff?text=Product+Image';
    }
    return imageUrl;
  }

  private checkForProductInUrl(): void {
    this.route.queryParams.subscribe(params => {
      if (params['productId']) {
        console.log('Product ID from URL:', params['productId']);
        // Load product by ID
        this.productService.getProduct(params['productId']).subscribe({
          next: (product) => {
            this.selectedProduct = product;
            this.cdRef.detectChanges();
          },
          error: (error) => {
            console.error('Error loading product:', error);
          }
        });
      }
    });
  }
}