// Firebase Firestore Schema for CaraConnect
// This file defines the TypeScript types for all Firestore collections

export interface User {
  id: string;
  email: string;
  phone?: string;
  full_name: string;
  photo_url?: string;
  bio?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  preferred_payment_method?: 'card' | 'bank_transfer' | 'wallet';
  is_runner: boolean;
  is_requester: boolean;
  is_admin?: boolean;
  is_verified: boolean;
  rating: number;
  total_tasks_completed: number;
  total_tasks_posted: number;
  created_at: any; // Firestore Timestamp
  updated_at: any; // Firestore Timestamp
  last_active_at: any; // Firestore Timestamp
}

export interface Task {
  id: string;
  requester_id: string;
  runner_id?: string;
  title: string;
  description: string;
  category: 'delivery' | 'pickup' | 'errand' | 'other';
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'disputed';
  reward_amount: number;
  commission_amount: number;
  runner_amount: number;
  pickup_location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    instructions?: string;
  };
  delivery_location: {
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    instructions?: string;
  };
  deadline: any; // Firestore Timestamp
  expected_duration?: number; // in minutes
  photos?: string[]; // URLs to uploaded photos
  created_at: any; // Firestore Timestamp
  updated_at: any; // Firestore Timestamp
  accepted_at?: any; // Firestore Timestamp
  started_at?: any; // Firestore Timestamp
  completed_at?: any; // Firestore Timestamp
  cancelled_at?: any; // Firestore Timestamp
  cancellation_reason?: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  escrow_balance: number; // Amount held in escrow
  total_earned: number;
  total_spent: number;
  created_at: any; // Firestore Timestamp
  updated_at: any; // Firestore Timestamp
}

export interface Transaction {
  id: string;
  user_id: string;
  type: 'deposit' | 'withdrawal' | 'task_payment' | 'task_earning' | 'commission' | 'refund' | 'escrow_hold' | 'escrow_release';
  amount: number;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  description: string;
  task_id?: string;
  payment_method?: 'card' | 'bank_transfer' | 'wallet';
  payment_reference?: string;
  external_transaction_id?: string;
  created_at: any; // Firestore Timestamp
  updated_at: any; // Firestore Timestamp
  completed_at?: any; // Firestore Timestamp
}

export interface Message {
  id: string;
  task_id: string;
  sender_id: string;
  receiver_id: string;
  type: 'text' | 'image' | 'voice' | 'location';
  content: string;
  metadata?: {
    image_url?: string;
    voice_url?: string;
    location?: {
      lat: number;
      lng: number;
      address?: string;
    };
  };
  is_read: boolean;
  created_at: any; // Firestore Timestamp
}

export interface Review {
  id: string;
  task_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number; // 1-5
  comment?: string;
  created_at: any; // Firestore Timestamp
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'task_accepted' | 'task_started' | 'task_completed' | 'task_cancelled' | 'new_message' | 'payment_received' | 'payment_sent' | 'new_task_nearby';
  title: string;
  message: string;
  data?: {
    task_id?: string;
    amount?: number;
    [key: string]: any;
  };
  is_read: boolean;
  created_at: any; // Firestore Timestamp
}

export interface PlatformSettings {
  id: string;
  commission_percentage: number;
  minimum_task_amount: number;
  maximum_task_amount: number;
  payment_methods: string[];
  supported_categories: string[];
  maintenance_mode: boolean;
  announcement?: string;
  updated_at: any; // Firestore Timestamp
  updated_by: string;
}

export interface Escrow {
  id: string;
  task_id: string;
  requester_id: string;
  runner_id: string;
  amount: number;
  commission_amount: number;
  status: 'active' | 'released' | 'refunded';
  created_at: any; // Firestore Timestamp
  released_at?: any; // Firestore Timestamp
  refunded_at?: any; // Firestore Timestamp
}

// Firestore collection names
export const COLLECTIONS = {
  USERS: 'users',
  TASKS: 'tasks',
  WALLETS: 'wallets',
  TRANSACTIONS: 'transactions',
  MESSAGES: 'messages',
  REVIEWS: 'reviews',
  NOTIFICATIONS: 'notifications',
  PLATFORM_SETTINGS: 'platform_settings',
  ESCROWS: 'escrows',
} as const;

// Default platform settings
export const DEFAULT_PLATFORM_SETTINGS: Omit<PlatformSettings, 'id' | 'updated_at' | 'updated_by'> = {
  commission_percentage: 10,
  minimum_task_amount: 100, // ₦100
  maximum_task_amount: 50000, // ₦50,000
  payment_methods: ['card', 'bank_transfer', 'wallet'],
  supported_categories: ['delivery', 'pickup', 'errand', 'other'],
  maintenance_mode: false,
};
