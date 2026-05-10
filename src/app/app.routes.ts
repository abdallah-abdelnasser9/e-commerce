// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { adminGuard } from './guards/admin-guard';

// Components
import { HomeComponent } from './components/home/home';
import { ProductListComponent } from './components/product-list/product-list';
import { ProductDetailComponent } from './components/product-detail/product-detail';
import { LoginComponent } from './components/auth/login/login';
import { RegisterComponent } from './components/auth/register/register';
import { CartComponent } from './components/cart/cart';
import { CheckoutComponent } from './components/checkout/checkout';
import { ProfileComponent } from './components/profile/profile';
import { OrderListComponent } from './components/orders/orders';
import { OrderDetailComponent } from './components/orders/order-detail/order-detail';
import { ChatComponent } from './components/chat/chat';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard';
import { AdminProductsComponent } from './components/admin-products/admin-products';
import { ProductAddComponent } from './components/admin-product-add/admin-product-add';
import { ProductEditComponent } from './components/admin-product-edit/admin-product-edit';
import { AdminOrdersComponent } from './components/admin-orders/admin-orders';
import { AdminCategoriesComponent } from './components/admin-category/admin-category';
import { AdminChatComponent } from './components/admin-chat/admin-chat';
import { CustomerListComponent } from './components/admin-customer-list/admin-customer-list';
import { CustomerDetailComponent } from './components/admin-customer-detail/admin-customer-detail';

// Create a separate AdminLayoutComponent or use AdminDashboardComponent as layout
// For now, let's create a simple wrapper for admin routes
export const routes: Routes = [
  { path: '', component: HomeComponent },

  { path: 'products', component: ProductListComponent },
  { path: 'products/category/:category', component: ProductListComponent },
  { path: 'products/:id', component: ProductDetailComponent },

  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  { path: 'cart', component: CartComponent, canActivate: [authGuard] },
  { path: 'checkout', component: CheckoutComponent, canActivate: [authGuard] },

  { path: 'profile', component: ProfileComponent, canActivate: [authGuard] },

  { path: 'orders', component: OrderListComponent, canActivate: [authGuard] },
  { path: 'orders/:id', component: OrderDetailComponent, canActivate: [authGuard] },

  {
    path: 'chat',
    component: ChatComponent,
    canActivate: [authGuard],
    data: { title: 'Chat Support' }
  },

  // ========= ADMIN ROUTES =========
  {
    path: 'admin',
    component: AdminDashboardComponent, // This acts as the layout
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: AdminDashboardComponent },
      { path: 'products', component: AdminProductsComponent },
      { path: 'products/new', component: ProductAddComponent },
      { path: 'products/edit/:id', component: ProductEditComponent },
      { path: 'categories', component: AdminCategoriesComponent },
      { path: 'orders', component: AdminOrdersComponent },
      { path: 'chat', component: AdminChatComponent },
      { path: 'customers', component: CustomerListComponent },
      { path: 'customers/:id', component: CustomerDetailComponent }
    ]
  },

  { path: '**', redirectTo: '' }
];