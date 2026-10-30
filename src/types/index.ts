export interface User {
  id: string;
  full_name: string;
  phone: string;
  password_hash: string;
  balance: number;
  package_id: string | null;
  package_start: string | null;
  package_expiry: string | null;
  free_trial_used: boolean;
  role: 'user' | 'admin';
  created_at: string;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  per_photo: number;
  per_day: number;
  validity_days: number;
  max_photos_per_day: number;
  roi_text: string;
  popular?: boolean;
  total_six_month?: string;
  color: string;
  textColor: string;
  accentBg: string;
}

export interface Photo {
  id: string;
  user_id: string;
  user_name?: string;
  user_phone?: string;
  user_package?: string;
  image_url: string;
  caption?: string;
  status: 'pending' | 'approved' | 'rejected';
  earning_amount: number;
  created_at: string;
  approved_at?: string | null;
  rejection_reason?: string;
}

export interface Payment {
  id: string;
  user_id: string;
  user_name?: string;
  user_phone?: string;
  package_id: string;
  package_name?: string;
  amount: number;
  transaction_id: string;
  screenshot_url: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_at?: string | null;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  phone_number: string;
  account_name: string;
  status: 'pending' | 'completed' | 'rejected';
  created_at: string;
  processed_at?: string | null;
}
