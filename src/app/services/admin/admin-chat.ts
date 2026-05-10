// src/app/services/admin-chat.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AdminChatService {
  private http = inject(HttpClient);
  private apiUrl = 'https://backend-1-xkmk.onrender.com/api/admin';

  // Get all chat users
  getChatUsers(): Observable<any> {
    return this.http.get(`${this.apiUrl}/chat/users`)
      .pipe(catchError(this.handleError));
  }

  // Get chat messages with user
  getChatMessages(userId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/chat/messages/${userId}`)
      .pipe(catchError(this.handleError));
  }

  // Send message to user
  sendMessage(userId: string, message: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/chat/send`, { receiverId: userId, message })
      .pipe(catchError(this.handleError));
  }

  // Mark messages as read
  markAsRead(messageIds: string[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/chat/mark-read`, { messageIds })
      .pipe(catchError(this.handleError));
  }

  // Get unread message count
  getUnreadCount(): Observable<any> {
    return this.http.get(`${this.apiUrl}/chat/unread-count`)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: any) {
    console.error('Admin Chat Service Error:', error);
    return throwError(() => error.error?.message || 'An error occurred');
  }
}