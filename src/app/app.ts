// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NavbarComponent } from './components/shared/navbar/navbar';
import { FooterComponent } from './components/shared/footer/footer';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent],
  template: `
    <div class="app-container">
      <!-- Only show navbar for non-admin routes -->
      @if (!isAdminPage) {
        <app-navbar></app-navbar>
      }
      
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      
      <!-- Only show footer for non-admin routes -->
      @if (!isAdminPage) {
        <app-footer></app-footer>
      }
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
    }
    .main-content {
      flex: 1;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'ecommerce-frontend';
  isAdminPage = false;

  constructor(private router: Router) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.isAdminPage = event.urlAfterRedirects.startsWith('/admin');
      });
  }
}