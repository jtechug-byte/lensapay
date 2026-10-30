import React, { useState } from 'react';
import { Camera, Lock, User as UserIcon, Phone, ArrowRight, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { dbService } from '../lib/db';
import { User } from '../types';

interface RegisterPageProps {
  navigate: (path: string) => void;
  onRegisterSuccess: (user: User) => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ navigate, onRegisterSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fullName.trim()) {
      setError('Please provide your full legal name (as registered on your Mobile Money SIM)');
      return;
    }
    if (!phone.trim()) {
      setError('Please provide your Ugandan mobile phone number');
      return;
    }
    if (password.length < 5) {
      setError('Password should be at least 5 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    setLoading(true);
    try {
      // On register: Insert into users, balance=0, free_trial_used=false
      const newUser = await dbService.register(fullName, phone, password);
      onRegisterSuccess(newUser);
      // Redirect to /dashboard
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-emerald-950/5 border border-emerald-100 overflow-hidden">
        {/* Brand Banner */}
        <div className="bg-gradient-to-br from-[#0f5d2f] via-[#0c4a25] to-[#072a15] p-6 text-white text-center relative overflow-hidden">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white/30 mb-3 bg-white">
            <img src="/icon-512.png" alt="LensaPay Icon" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create Free Account</h1>
          <p className="text-emerald-100 text-xs mt-1 font-medium">
            Start with 1 Free Trial photo upload & explore VIP earning plans
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 bg-emerald-500/20 px-3 py-1 rounded-full text-[11px] text-emerald-200 border border-emerald-400/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
            Automatic Mobile Money Verification
          </div>
        </div>

        {/* Form Container */}
        <div className="p-6 sm:p-8">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Kato Joseph"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-[#0f5d2f] focus:ring-2 focus:ring-[#0f5d2f]/20 transition-all placeholder:text-gray-400"
                  required
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Must match your MoMo registered name for withdrawals</p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Phone Number (MTN / Airtel)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-500 font-semibold text-xs border-r border-gray-200 pr-2.5 my-2">
                  <span className="mr-1">🇺🇬</span> +256
                </div>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="781234567"
                  className="w-full pl-24 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-[#0f5d2f] focus:ring-2 focus:ring-[#0f5d2f]/20 transition-all placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-[#0f5d2f] focus:ring-2 focus:ring-[#0f5d2f]/20 transition-all placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-[#0f5d2f] focus:ring-2 focus:ring-[#0f5d2f]/20 transition-all placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {/* Terms notice */}
            <div className="text-[11px] text-gray-500 leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-200">
              By creating an account, you agree to LensaPay Uganda guidelines: genuine photo uploads, daily caps (1 free trial / max 5 VIP daily), and mobile money payout terms.
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-[#0f5d2f] hover:bg-[#0c4a25] active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-emerald-900/15 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Create Account & Continue</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link to login */}
          <div className="mt-6 text-center text-xs text-gray-600 border-t border-gray-100 pt-5">
            Already have an account?{' '}
            <button
              onClick={() => navigate('/login')}
              className="font-bold text-[#0f5d2f] hover:underline cursor-pointer"
            >
              Log in here
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
