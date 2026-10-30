import { Package } from '../types';

export const VIP_PACKAGES: Package[] = [
  {
    id: 'starter',
    name: 'Starter VIP',
    price: 20000,
    per_photo: 67,
    per_day: 335,
    validity_days: 180,
    max_photos_per_day: 5,
    roi_text: '60-Day ROI = Price Back',
    popular: false,
    total_six_month: '60,300 UGX',
    color: '#0f5d2f',
    textColor: 'text-emerald-800',
    accentBg: 'bg-emerald-50 border-emerald-200'
  },
  {
    id: 'bronze',
    name: 'Bronze VIP',
    price: 100000,
    per_photo: 333,
    per_day: 1665,
    validity_days: 180,
    max_photos_per_day: 5,
    roi_text: '60-Day ROI = Price Back',
    popular: false,
    total_six_month: '299,700 UGX',
    color: '#b45309',
    textColor: 'text-amber-800',
    accentBg: 'bg-amber-50 border-amber-200'
  },
  {
    id: 'silver',
    name: 'Silver VIP',
    price: 500000,
    per_photo: 1667,
    per_day: 8335,
    validity_days: 180,
    max_photos_per_day: 5,
    roi_text: '60-Day ROI = Price Back',
    popular: false,
    total_six_month: '1,500,300 UGX',
    color: '#475569',
    textColor: 'text-slate-800',
    accentBg: 'bg-slate-50 border-slate-200'
  },
  {
    id: 'gold',
    name: 'Gold VIP',
    price: 1000000,
    per_photo: 3333,
    per_day: 16665,
    validity_days: 180,
    max_photos_per_day: 5,
    roi_text: '60-Day ROI = Price Back',
    popular: true,
    total_six_month: '2,999,700 UGX',
    color: '#d97706',
    textColor: 'text-yellow-800',
    accentBg: 'bg-yellow-50 border-yellow-200'
  },
  {
    id: 'platinum',
    name: 'Platinum VIP',
    price: 2500000,
    per_photo: 8333,
    per_day: 41665,
    validity_days: 180,
    max_photos_per_day: 5,
    roi_text: '60-Day ROI = Price Back',
    popular: false,
    total_six_month: '7,499,700 UGX',
    color: '#0284c7',
    textColor: 'text-sky-800',
    accentBg: 'bg-sky-50 border-sky-200'
  },
  {
    id: 'diamond',
    name: 'Diamond VIP',
    price: 5000000,
    per_photo: 16667,
    per_day: 83335,
    validity_days: 180,
    max_photos_per_day: 5,
    roi_text: '60-Day ROI = Price Back',
    popular: true,
    total_six_month: '15,000,000 UGX (15M)',
    color: '#7c3aed',
    textColor: 'text-purple-800',
    accentBg: 'bg-purple-50 border-purple-200'
  }
];

export const FREE_TRIAL_EARN_RATE = 50; // standard trial credit per photo

export function getPackageById(id: string | null | undefined): Package | undefined {
  if (!id) return undefined;
  return VIP_PACKAGES.find(p => p.id === id);
}

export function formatUGX(amount: number): string {
  return new Intl.NumberFormat('en-UG', {
    style: 'decimal',
    maximumFractionDigits: 0
  }).format(Math.round(amount)) + ' UGX';
}
