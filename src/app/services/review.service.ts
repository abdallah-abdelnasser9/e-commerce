// review.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Review } from '../models/review.model';

export interface ReviewResponse {
  message: string;
  review: Review;
  product?: {
    rating: number;
    reviewsCount: number;
  };
}

export interface VoteResponse {
  message: string;
  helpful: number;
  notHelpful: number;
}

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = 'https://backend-1-xkmk.onrender.com';

  constructor(private http: HttpClient) {}

  // Get all reviews for a specific product
  getProductReviews(productId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/reviews/product/${productId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get user's review for a specific product
  getUserReview(productId: string): Observable<Review> {
    return this.http.get<Review>(`${this.apiUrl}/reviews/user/${productId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Add a new review
  addReview(reviewData: {
    productId: string;
    rating: number;
    comment: string;
    images?: string[];
  }): Observable<ReviewResponse> {
    return this.http.post<ReviewResponse>(`${this.apiUrl}/reviews`, reviewData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Mark review as helpful
  markHelpful(reviewId: string): Observable<VoteResponse> {
    return this.http.post<VoteResponse>(`${this.apiUrl}/reviews/${reviewId}/helpful`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  // Mark review as not helpful
  markNotHelpful(reviewId: string): Observable<VoteResponse> {
    return this.http.post<VoteResponse>(`${this.apiUrl}/reviews/${reviewId}/not-helpful`, {})
      .pipe(
        catchError(this.handleError)
      );
  }

  // Update an existing review
  updateReview(reviewId: string, reviewData: Partial<Review>): Observable<ReviewResponse> {
    return this.http.put<ReviewResponse>(`${this.apiUrl}/reviews/${reviewId}`, reviewData)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Delete a review
  deleteReview(reviewId: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/reviews/${reviewId}`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Get reviews by the current user
  getMyReviews(): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/reviews/my-reviews`)
      .pipe(
        catchError(this.handleError)
      );
  }

  // Error handling
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = error.error?.message || error.statusText || `Error Code: ${error.status}`;
    }
    
    console.error('Review Service Error:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}