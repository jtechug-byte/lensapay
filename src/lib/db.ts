import { User, Photo, Payment, Withdrawal } from '../types';
import { VIP_PACKAGES, FREE_TRIAL_EARN_RATE, getPackageById } from '../data/packages';
import { supabase, isSupabaseConfigured } from './supabase';

const USERS_STORAGE_KEY = 'lensapay_ug_users_v2';
const PHOTOS_STORAGE_KEY = 'lensapay_ug_photos_v2';
const PAYMENTS_STORAGE_KEY = 'lensapay_ug_payments_v2';
const WITHDRAWALS_STORAGE_KEY = 'lensapay_ug_withdrawals_v2';
const CURRENT_USER_KEY = 'lensapay_ug_current_user_v2';

// Initial Mock Seed Data for instantaneous, rich out-of-the-box experience
const INITIAL_USERS: User[] = [
  {
    id: 'user-trial-01',
    full_name: 'Kato Joseph',
    phone: '+256781234567',
    password_hash: '123456',
    balance: 0,
    package_id: null,
    package_start: null,
    package_expiry: null,
    free_trial_used: false,
    role: 'user',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'user-vip-gold',
    full_name: 'Namubiru Sarah',
    phone: '+256701234567',
    password_hash: '123456',
    balance: 133320,
    package_id: 'gold',
    package_start: new Date(Date.now() - 86400000 * 10).toISOString(),
    package_expiry: new Date(Date.now() + 86400000 * 170).toISOString(),
    free_trial_used: true,
    role: 'user',
    created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
  },
  {
    id: 'admin-boss-01',
    full_name: 'Takia Namuddu (Admin Boss)',
    phone: '0791388644',
    password_hash: 'admin123',
    balance: 12500000,
    package_id: 'diamond',
    package_start: new Date().toISOString(),
    package_expiry: new Date(Date.now() + 86400000 * 180).toISOString(),
    free_trial_used: true,
    role: 'admin',
    created_at: new Date(Date.now() - 86400000 * 30).toISOString(),
  }
];

const INITIAL_PHOTOS: Photo[] = [
  {
    id: 'photo-seed-01',
    user_id: 'user-vip-gold',
    user_name: 'Namubiru Sarah',
    user_phone: '+256701234567',
    user_package: 'gold',
    image_url: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=600&q=80',
    caption: 'Kampala City Morning Sunrise',
    status: 'approved',
    earning_amount: 3333,
    created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
    approved_at: new Date(Date.now() - 3600000 * 3).toISOString()
  },
  {
    id: 'photo-seed-02',
    user_id: 'user-vip-gold',
    user_name: 'Namubiru Sarah',
    user_phone: '+256701234567',
    user_package: 'gold',
    image_url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=600&q=80',
    caption: 'Ugandan Crafts at National Theatre',
    status: 'pending',
    earning_amount: 0,
    created_at: new Date(Date.now() - 1800000).toISOString(),
    approved_at: null
  }
];

const INITIAL_PAYMENTS: Payment[] = [
  {
    id: 'pmt-seed-01',
    user_id: 'user-trial-01',
    user_name: 'Kato Joseph',
    user_phone: '+256781234567',
    package_id: 'starter',
    package_name: 'Starter VIP',
    amount: 20000,
    transaction_id: 'TXN884129984',
    screenshot_url: 'https://images.unsplash.com/photo-1580048915913-4f8f5cb481c4?auto=format&fit=crop&w=500&q=80',
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 2).toISOString()
  }
];

const INITIAL_WITHDRAWALS: Withdrawal[] = [
  {
    id: 'wth-seed-01',
    user_id: 'user-vip-gold',
    amount: 25000,
    phone_number: '+256701234567',
    account_name: 'Namubiru Sarah',
    status: 'pending',
    created_at: new Date(Date.now() - 3600000 * 1).toISOString()
  }
];

function getStored<T>(key: string, defaultVal: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return defaultVal;
  }
}

function setStored<T>(key: string, val: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.error(`Error saving ${key} to storage:`, err);
  }
}

// Normalize Ugandan phone number (+256 format or local 07...)
export function normalizePhone(raw: string): string {
  let cleaned = raw.trim().replace(/\s+/g, '').replace(/-/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '+256' + cleaned.substring(1);
  } else if (cleaned.startsWith('256')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+256') && cleaned.length >= 9) {
    cleaned = '+256' + cleaned;
  }
  return cleaned;
}

// Security Helper: Check if user is an administrator
export function isUserAdmin(user: User | null | undefined): boolean {
  if (!user) return false;
  const cleanPhone = normalizePhone(user.phone || '');
  const adminClean = normalizePhone('0791388644');
  const digits = (user.phone || '').replace(/[^0-9]/g, '');
  return (
    user.role === 'admin' ||
    user.phone === '0791388644' ||
    cleanPhone === adminClean ||
    digits.endsWith('791388644')
  );
}

// Initialize seed data if not present
export function initDatabase() {
  if (!localStorage.getItem(USERS_STORAGE_KEY)) {
    setStored(USERS_STORAGE_KEY, INITIAL_USERS);
  } else {
    // Ensure existing storage strictly enforces role='admin' ONLY for 0791388644 and 'user' for everyone else
    const existingUsers = getStored<User[]>(USERS_STORAGE_KEY, INITIAL_USERS);
    let changed = false;
    existingUsers.forEach(u => {
      const isAdminPhone = isUserAdmin(u);
      const expectedRole: 'admin' | 'user' = isAdminPhone ? 'admin' : 'user';
      if (u.role !== expectedRole) {
        u.role = expectedRole;
        changed = true;
      }
    });
    if (changed) {
      setStored(USERS_STORAGE_KEY, existingUsers);
    }
  }

  if (!localStorage.getItem(PHOTOS_STORAGE_KEY)) {
    setStored(PHOTOS_STORAGE_KEY, INITIAL_PHOTOS);
  }
  if (!localStorage.getItem(PAYMENTS_STORAGE_KEY)) {
    setStored(PAYMENTS_STORAGE_KEY, INITIAL_PAYMENTS);
  }
  if (!localStorage.getItem(WITHDRAWALS_STORAGE_KEY)) {
    setStored(WITHDRAWALS_STORAGE_KEY, INITIAL_WITHDRAWALS);
  }
}

export const dbService = {
  // ---- AUTH & USERS ----
  getCurrentUser(): User | null {
    const user = getStored<User | null>(CURRENT_USER_KEY, null);
    if (!user) return null;
    // Refresh user from latest store
    const users = getStored<User[]>(USERS_STORAGE_KEY, INITIAL_USERS);
    const updated = users.find(u => u.id === user.id);
    if (updated) {
      setStored(CURRENT_USER_KEY, updated);
      return updated;
    }
    return user;
  },

  setCurrentUser(user: User | null): void {
    setStored(CURRENT_USER_KEY, user);
  },

  logout(): void {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  async login(phoneInput: string, password: string): Promise<User> {
    const cleanPhone = normalizePhone(phoneInput);
    const users = getStored<User[]>(USERS_STORAGE_KEY, INITIAL_USERS);

    // Also check for admin username or admin phone
    const user = users.find(u => {
      const matchPhone = normalizePhone(u.phone) === cleanPhone || u.phone === phoneInput.trim();
      const matchAdminUsername = (phoneInput.trim().toLowerCase() === 'admin' || phoneInput.trim() === '0791388644') && u.role === 'admin';
      return matchPhone || matchAdminUsername;
    });

    if (!user) {
      throw new Error('Account not found with this phone number. Please register first.');
    }

    if (user.password_hash !== password) {
      throw new Error('Incorrect password. Please verify and try again.');
    }

    // Update in Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.from('users').select('*').eq('phone', cleanPhone).single();
        if (data) {
          user.balance = Number(data.balance ?? user.balance);
          user.package_id = data.package_id ?? user.package_id;
          user.free_trial_used = Boolean(data.free_trial_used ?? user.free_trial_used);
        }
      } catch (e) {
        console.warn('Supabase sync skipped:', e);
      }
    }

    // Strictly enforce role
    user.role = isUserAdmin(user) ? 'admin' : 'user';

    setStored(CURRENT_USER_KEY, user);
    return user;
  },

  async register(fullName: string, phoneInput: string, password: string): Promise<User> {
    const cleanPhone = normalizePhone(phoneInput);
    if (cleanPhone.length < 12) {
      throw new Error('Please enter a valid Ugandan phone number (e.g. +256 781 234567 or 0781234567)');
    }

    const users = getStored<User[]>(USERS_STORAGE_KEY, INITIAL_USERS);
    const exists = users.find(u => normalizePhone(u.phone) === cleanPhone);
    if (exists) {
      throw new Error('An account with this phone number already exists. Please login instead.');
    }

    const newUser: User = {
      id: 'usr_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      full_name: fullName.trim(),
      phone: cleanPhone,
      password_hash: password,
      balance: 0,
      package_id: null,
      package_start: null,
      package_expiry: null,
      free_trial_used: false,
      role: 'user',
      created_at: new Date().toISOString()
    };

    users.push(newUser);
    setStored(USERS_STORAGE_KEY, users);
    setStored(CURRENT_USER_KEY, newUser);

    // Insert to Supabase if configured
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('users').insert({
          id: newUser.id,
          full_name: newUser.full_name,
          phone: newUser.phone,
          password_hash: newUser.password_hash,
          balance: 0,
          free_trial_used: false,
          created_at: newUser.created_at
        });
      } catch (err) {
        console.warn('Supabase insert skipped:', err);
      }
    }

    return newUser;
  },

  getAllUsers(): User[] {
    return getStored<User[]>(USERS_STORAGE_KEY, INITIAL_USERS);
  },

  getUserById(id: string): User | undefined {
    const users = getStored<User[]>(USERS_STORAGE_KEY, INITIAL_USERS);
    return users.find(u => u.id === id);
  },

  // ---- TODAY'S UPLOADS & PHOTO LOGIC ----
  getTodayUploads(userId: string): Photo[] {
    const photos = getStored<Photo[]>(PHOTOS_STORAGE_KEY, INITIAL_PHOTOS);
    const todayStr = new Date().toDateString();
    return photos.filter(p => {
      if (p.user_id !== userId) return false;
      const createdDate = new Date(p.created_at).toDateString();
      return createdDate === todayStr;
    });
  },

  getTodayUploadsCount(userId: string): number {
    return this.getTodayUploads(userId).length;
  },

  getUserPhotos(userId: string): Photo[] {
    const photos = getStored<Photo[]>(PHOTOS_STORAGE_KEY, INITIAL_PHOTOS);
    return photos
      .filter(p => p.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async uploadPhoto(userId: string, imageDataUrl: string, caption?: string): Promise<Photo> {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found. Please log in.');

    const todayCount = this.getTodayUploadsCount(userId);

    // Rule 1: Free Trial Logic
    // If free_trial_used = false and count >= 1: Disable upload
    if (!user.package_id) {
      if (todayCount >= 1 || user.free_trial_used) {
        throw new Error("You're done with today photos! No more uploading. You used 1/1 free trial photo. Buy a package.");
      }
    } else {
      // Rule 2: VIP Logic
      // If count >= 5: Disable upload
      if (todayCount >= 5) {
        throw new Error("You're done with today photos! No more uploading today. Come back tomorrow. You uploaded 5/5.");
      }
    }

    const newPhoto: Photo = {
      id: 'pht_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      user_id: user.id,
      user_name: user.full_name,
      user_phone: user.phone,
      user_package: user.package_id || 'free_trial',
      image_url: imageDataUrl,
      caption: caption || 'Daily Submission',
      status: 'pending',
      earning_amount: 0, // initially 0 until admin approves
      created_at: new Date().toISOString(),
      approved_at: null
    };

    const photos = getStored<Photo[]>(PHOTOS_STORAGE_KEY, INITIAL_PHOTOS);
    photos.unshift(newPhoto);
    setStored(PHOTOS_STORAGE_KEY, photos);

    // Supabase sync
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('photos').insert({
          id: newPhoto.id,
          user_id: newPhoto.user_id,
          image_url: newPhoto.image_url,
          status: 'pending',
          earning_amount: 0,
          created_at: newPhoto.created_at
        });
      } catch (err) {
        console.warn('Supabase photo insert failed:', err);
      }
    }

    return newPhoto;
  },

  // ---- ADMIN PHOTO APPROVAL ----
  getPendingPhotos(): Photo[] {
    const photos = getStored<Photo[]>(PHOTOS_STORAGE_KEY, INITIAL_PHOTOS);
    return photos
      .filter(p => p.status === 'pending')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  approvePhoto(photoId: string): { photo: Photo; user: User } {
    const photos = getStored<Photo[]>(PHOTOS_STORAGE_KEY, INITIAL_PHOTOS);
    const photo = photos.find(p => p.id === photoId);
    if (!photo) throw new Error('Photo not found');

    const users = getStored<User[]>(USERS_STORAGE_KEY, INITIAL_USERS);
    const user = users.find(u => u.id === photo.user_id);
    if (!user) throw new Error('Photo owner user not found');

    // Calculate earn rate according to user package
    let earnRate = FREE_TRIAL_EARN_RATE; // default free trial rate (50 UGX)
    if (user.package_id) {
      const pkg = getPackageById(user.package_id);
      if (pkg) {
        earnRate = pkg.per_photo;
      }
    }

    // Update photo
    photo.status = 'approved';
    photo.earning_amount = earnRate;
    photo.approved_at = new Date().toISOString();

    // Update user balance & free_trial_used
    user.balance = (user.balance || 0) + earnRate;
    user.free_trial_used = true;

    setStored(PHOTOS_STORAGE_KEY, photos);
    setStored(USERS_STORAGE_KEY, users);

    // Refresh current user if it's the one logged in
    const current = getStored<User | null>(CURRENT_USER_KEY, null);
    if (current && current.id === user.id) {
      setStored(CURRENT_USER_KEY, user);
    }

    return { photo, user };
  },

  rejectPhoto(photoId: string, reason?: string): Photo {
    const photos = getStored<Photo[]>(PHOTOS_STORAGE_KEY, INITIAL_PHOTOS);
    const photo = photos.find(p => p.id === photoId);
    if (!photo) throw new Error('Photo not found');

    photo.status = 'rejected';
    photo.rejection_reason = reason || 'Low quality or ineligible photo';

    setStored(PHOTOS_STORAGE_KEY, photos);
    return photo;
  },

  // ---- PAYMENTS ----
  getUserPayments(userId: string): Payment[] {
    const payments = getStored<Payment[]>(PAYMENTS_STORAGE_KEY, INITIAL_PAYMENTS);
    return payments
      .filter(p => p.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getPendingPayments(): Payment[] {
    const payments = getStored<Payment[]>(PAYMENTS_STORAGE_KEY, INITIAL_PAYMENTS);
    return payments
      .filter(p => p.status === 'pending')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  submitPayment(
    userId: string,
    packageId: string,
    amount: number,
    transactionId: string,
    screenshotUrl: string
  ): Payment {
    const user = this.getUserById(userId);
    if (!user) throw new Error('User not found');

    const pkg = getPackageById(packageId);
    const newPayment: Payment = {
      id: 'pay_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      user_id: user.id,
      user_name: user.full_name,
      user_phone: user.phone,
      package_id: packageId,
      package_name: pkg ? pkg.name : packageId,
      amount,
      transaction_id: transactionId.trim().toUpperCase(),
      screenshot_url: screenshotUrl,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const payments = getStored<Payment[]>(PAYMENTS_STORAGE_KEY, INITIAL_PAYMENTS);
    payments.unshift(newPayment);
    setStored(PAYMENTS_STORAGE_KEY, payments);

    return newPayment;
  },

  approvePayment(paymentId: string): { payment: Payment; user: User } {
    const payments = getStored<Payment[]>(PAYMENTS_STORAGE_KEY, INITIAL_PAYMENTS);
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) throw new Error('Payment record not found');

    const users = getStored<User[]>(USERS_STORAGE_KEY, INITIAL_USERS);
    const user = users.find(u => u.id === payment.user_id);
    if (!user) throw new Error('User for this payment was not found');

    payment.status = 'approved';
    payment.approved_at = new Date().toISOString();

    // Package validity 6 months = 180 days
    const now = new Date();
    const expiry = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

    user.package_id = payment.package_id;
    user.package_start = now.toISOString();
    user.package_expiry = expiry.toISOString();

    setStored(PAYMENTS_STORAGE_KEY, payments);
    setStored(USERS_STORAGE_KEY, users);

    const current = getStored<User | null>(CURRENT_USER_KEY, null);
    if (current && current.id === user.id) {
      setStored(CURRENT_USER_KEY, user);
    }

    return { payment, user };
  },

  rejectPayment(paymentId: string): Payment {
    const payments = getStored<Payment[]>(PAYMENTS_STORAGE_KEY, INITIAL_PAYMENTS);
    const payment = payments.find(p => p.id === paymentId);
    if (!payment) throw new Error('Payment record not found');

    payment.status = 'rejected';
    setStored(PAYMENTS_STORAGE_KEY, payments);
    return payment;
  },

  // ---- WITHDRAWALS ----
  getUserWithdrawals(userId: string): Withdrawal[] {
    const withdrawals = getStored<Withdrawal[]>(WITHDRAWALS_STORAGE_KEY, INITIAL_WITHDRAWALS);
    return withdrawals
      .filter(w => w.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getPendingWithdrawals(): Withdrawal[] {
    const withdrawals = getStored<Withdrawal[]>(WITHDRAWALS_STORAGE_KEY, INITIAL_WITHDRAWALS);
    return withdrawals
      .filter(w => w.status === 'pending')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  submitWithdrawal(
    userId: string,
    amount: number,
    phoneNumber: string,
    accountName: string
  ): Withdrawal {
    const users = getStored<User[]>(USERS_STORAGE_KEY, INITIAL_USERS);
    const user = users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');

    if (amount < 5000) {
      throw new Error('Minimum withdrawal amount is 5,000 UGX');
    }

    if (amount > user.balance) {
      throw new Error(`Insufficient balance. Available: ${user.balance} UGX`);
    }

    // Deduct / lock balance immediately
    user.balance -= amount;
    setStored(USERS_STORAGE_KEY, users);

    const newWithdrawal: Withdrawal = {
      id: 'wth_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
      user_id: user.id,
      amount,
      phone_number: phoneNumber,
      account_name: accountName,
      status: 'pending',
      created_at: new Date().toISOString()
    };

    const withdrawals = getStored<Withdrawal[]>(WITHDRAWALS_STORAGE_KEY, INITIAL_WITHDRAWALS);
    withdrawals.unshift(newWithdrawal);
    setStored(WITHDRAWALS_STORAGE_KEY, withdrawals);

    const current = getStored<User | null>(CURRENT_USER_KEY, null);
    if (current && current.id === user.id) {
      setStored(CURRENT_USER_KEY, user);
    }

    return newWithdrawal;
  },

  completeWithdrawal(withdrawalId: string): Withdrawal {
    const withdrawals = getStored<Withdrawal[]>(WITHDRAWALS_STORAGE_KEY, INITIAL_WITHDRAWALS);
    const withdrawal = withdrawals.find(w => w.id === withdrawalId);
    if (!withdrawal) throw new Error('Withdrawal record not found');

    withdrawal.status = 'completed';
    withdrawal.processed_at = new Date().toISOString();

    setStored(WITHDRAWALS_STORAGE_KEY, withdrawals);
    return withdrawal;
  },

  rejectWithdrawal(withdrawalId: string): Withdrawal {
    const withdrawals = getStored<Withdrawal[]>(WITHDRAWALS_STORAGE_KEY, INITIAL_WITHDRAWALS);
    const withdrawal = withdrawals.find(w => w.id === withdrawalId);
    if (!withdrawal) throw new Error('Withdrawal record not found');

    // Refund locked balance back to user
    const users = getStored<User[]>(USERS_STORAGE_KEY, INITIAL_USERS);
    const user = users.find(u => u.id === withdrawal.user_id);
    if (user) {
      user.balance += withdrawal.amount;
      setStored(USERS_STORAGE_KEY, users);
    }

    withdrawal.status = 'rejected';
    withdrawal.processed_at = new Date().toISOString();

    setStored(WITHDRAWALS_STORAGE_KEY, withdrawals);
    return withdrawal;
  },

  // ---- ADMIN STATS ----
  getAdminStats() {
    const users = getStored<User[]>(USERS_STORAGE_KEY, INITIAL_USERS);
    const photos = getStored<Photo[]>(PHOTOS_STORAGE_KEY, INITIAL_PHOTOS);
    const payments = getStored<Payment[]>(PAYMENTS_STORAGE_KEY, INITIAL_PAYMENTS);
    const withdrawals = getStored<Withdrawal[]>(WITHDRAWALS_STORAGE_KEY, INITIAL_WITHDRAWALS);

    const pendingPaymentsSum = payments
      .filter(p => p.status === 'pending')
      .reduce((sum, p) => sum + p.amount, 0);

    const totalApprovedPaymentsSum = payments
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.amount, 0);

    const pendingWithdrawalsSum = withdrawals
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + w.amount, 0);

    const completedWithdrawalsSum = withdrawals
      .filter(w => w.status === 'completed')
      .reduce((sum, w) => sum + w.amount, 0);

    const totalApprovedEarnings = photos
      .filter(p => p.status === 'approved')
      .reduce((sum, p) => sum + p.earning_amount, 0);

    return {
      totalUsers: users.length,
      vipUsersCount: users.filter(u => u.package_id).length,
      pendingPhotosCount: photos.filter(p => p.status === 'pending').length,
      pendingPaymentsCount: payments.filter(p => p.status === 'pending').length,
      pendingWithdrawalsCount: withdrawals.filter(w => w.status === 'pending').length,
      pendingPaymentsSum,
      totalApprovedPaymentsSum,
      pendingWithdrawalsSum,
      completedWithdrawalsSum,
      totalApprovedEarnings
    };
  },

  // Reset to default demo data
  resetAllData() {
    setStored(USERS_STORAGE_KEY, INITIAL_USERS);
    setStored(PHOTOS_STORAGE_KEY, INITIAL_PHOTOS);
    setStored(PAYMENTS_STORAGE_KEY, INITIAL_PAYMENTS);
    setStored(WITHDRAWALS_STORAGE_KEY, INITIAL_WITHDRAWALS);
    setStored(CURRENT_USER_KEY, INITIAL_USERS[0]);
  }
};
