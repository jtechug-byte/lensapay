import React from 'react';
import { Crown, Check, ArrowRight, ShieldCheck, Zap, Sparkles, Calendar, TrendingUp } from 'lucide-react';
import { VIP_PACKAGES, formatUGX } from '../data/packages';
import { User } from '../types';

interface PackagesPageProps {
  user: User | null;
  navigate: (path: string) => void;
}

export const PackagesPage: React.FC<PackagesPageProps> = ({ user, navigate }) => {
  const handleSelectPackage = (packageId: string) => {
    navigate(`/payment?package=${packageId}`);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-[#0f5d2f] px-3 py-1 rounded-full text-xs font-bold mb-3 uppercase tracking-wider">
          <Crown className="w-3.5 h-3.5" />
          Option B Final VIP Packages
        </div>
        <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Earn Up To <span className="text-[#0f5d2f]">83,335 UGX Daily</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-600 mt-2">
          Transparent 60-day ROI formula. Upload 5 photos daily, receive verified earnings directly to MTN or Airtel Mobile Money.
        </p>

        {/* Formula Note Banner as requested */}
        <div className="mt-4 p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-2xl text-xs text-emerald-950 inline-flex flex-col sm:flex-row items-center gap-2">
          <span className="font-bold flex items-center gap-1 text-[#0f5d2f]">
            <TrendingUp className="w-4 h-4" />
            Transparent ROI Formula:
          </span>
          <span>Per photo = Price ÷ (5 photos × 60 days). Your full investment is returned within 60 days!</span>
        </div>
      </div>

      {/* 6 VIP Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {VIP_PACKAGES.map((pkg) => {
          const isCurrentActive = user?.package_id === pkg.id;

          return (
            <div
              key={pkg.id}
              className={`relative bg-white rounded-3xl border-2 transition-all duration-200 flex flex-col justify-between overflow-hidden ${
                pkg.popular
                  ? 'border-[#0f5d2f] shadow-xl shadow-emerald-900/10 scale-[1.02]'
                  : 'border-gray-200 hover:border-emerald-300 shadow-sm hover:shadow-md'
              }`}
            >
              {/* Popular / Top Tier Pill */}
              {pkg.popular && (
                <div className="bg-[#0f5d2f] text-white text-[11px] font-bold py-1 px-4 text-center tracking-wider uppercase flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                  {pkg.id === 'diamond' ? 'Highest Return (15M 6-Mo Total)' : 'Most Popular Plan'}
                </div>
              )}

              <div className="p-6">
                {/* Header & Badges */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">{pkg.name}</h3>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-[#0f5d2f] text-[11px] font-bold px-2 py-0.5 rounded-md">
                        Badge 5 photos/day
                      </span>
                    </div>
                  </div>
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm"
                    style={{ backgroundColor: `${pkg.color}15`, color: pkg.color }}
                  >
                    <Crown className="w-5 h-5" />
                  </div>
                </div>

                {/* Price Display */}
                <div className="mb-5 pb-5 border-b border-gray-100">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-gray-950 tracking-tight">
                      {formatUGX(pkg.price)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">One-time payment • Valid 6 Months</p>
                </div>

                {/* Core Earnings Metrics as specified */}
                <div className="space-y-3 text-xs">
                  <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                    <span className="text-gray-600 font-medium">Per photo:</span>
                    <span className="font-bold text-[#0f5d2f] text-sm">
                      {formatUGX(pkg.per_photo)}
                    </span>
                  </div>

                  <div className="bg-emerald-50/60 rounded-xl p-3 flex items-center justify-between border border-emerald-100">
                    <span className="text-emerald-900 font-medium">Per day (5 photos):</span>
                    <span className="font-bold text-[#0f5d2f] text-sm">
                      {formatUGX(pkg.per_day)}/day
                    </span>
                  </div>

                  {pkg.total_six_month && (
                    <div className="bg-amber-50/60 rounded-xl p-3 flex items-center justify-between border border-amber-200/60">
                      <span className="text-amber-900 font-medium">
                        {pkg.id === 'diamond' ? 'Diamond 6-Month Total:' : 'Total 6-Month Earnings:'}
                      </span>
                      <span className="font-extrabold text-amber-900 text-sm">
                        {pkg.total_six_month}
                      </span>
                    </div>
                  )}

                  <div className="pt-2 space-y-2">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check className="w-4 h-4 text-[#0f5d2f] shrink-0" />
                      <span>{pkg.roi_text}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check className="w-4 h-4 text-[#0f5d2f] shrink-0" />
                      <span>Validity 6 months (180 days)</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check className="w-4 h-4 text-[#0f5d2f] shrink-0" />
                      <span>Max 5 photos/day (strictly capped, no unlimited)</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Check className="w-4 h-4 text-[#0f5d2f] shrink-0" />
                      <span>Direct MTN & Airtel MoMo cashouts</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 pt-0 mt-auto">
                {isCurrentActive ? (
                  <div className="w-full py-3 bg-emerald-100 text-[#0f5d2f] font-bold rounded-xl text-center text-xs flex items-center justify-center gap-1.5 border border-emerald-300">
                    <Check className="w-4 h-4" />
                    Currently Active Plan
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectPackage(pkg.id)}
                    className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                      pkg.popular
                        ? 'bg-[#0f5d2f] hover:bg-[#0c4a25] text-white shadow-emerald-900/20'
                        : 'bg-gray-900 hover:bg-black text-white'
                    }`}
                  >
                    <span>Select Package</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Safety & Compliance info */}
      <div className="bg-white rounded-3xl p-6 border border-emerald-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#0f5d2f] flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-gray-900">
              Guaranteed Daily Payouts & Transparent Policy
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              All packages have a strictly controlled 5 photos/day limit to protect platform liquidity and ensure consistent daily cashouts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
