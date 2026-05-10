import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Review } from '../models/review.model';

@Injectable({
  providedIn: 'root'
})
export class ReviewService {
  private apiUrl = 'https://backend-1-xkmk.onrender.com';

  constructor(private http: HttpClient) {}

  getProductReviews(productId: string): Observable<Review[]> {
    return this.http.get<Review[]>(`${this.apiUrl}/reviews/product/${productId}`);
  }

  addReview(reviewData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reviews`, reviewData);
  }

  markHelpful(reviewId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reviews/${reviewId}/helpful`, {});
  }

  markNotHelpful(reviewId: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reviews/${reviewId}/not-helpful`, {});
  }
}