// src/app/models/user.model.ts
export interface User {
  _id: string;
  id?: string; // Add id property for backward compatibility
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  role: string;
  addresses: Address[];
  wishlist: string[];
  isActive: boolean;
  isOnline?: boolean;
  lastLogin?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}


export interface Address {
  _id?: string;
  street: string;
  city: string;
  state: string;
  country: string;
  zipCode: string;
  isDefault: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}