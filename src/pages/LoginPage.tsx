import React, { useState } from 'react';
import { Camera, Lock, Phone, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { dbService, normalizePhone, isUserAdmin } from '../lib/db';
import { User } from '../types';

interface LoginPageProps {
  navigate: (path: string) => void;
  onLoginSuccess: (user: User) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ navigate, onLoginSuccess }) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!phone.trim()) {
      setError('Please enter your mobile phone number');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);
    try {
      // Check users table phone + password, no package check before login (as specified)
      const user = await dbService.login(phone, password);
      onLoginSuccess(user);
      if (isUserAdmin(user)) {
        navigate('/boss-terminal');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoPhone: string, demoPw: string) => {
    setPhone(demoPhone);
    setPassword(demoPw);
    setError(null);
  };

  return (
    <div className="min-h-[85vh] flex flex-col justify-center items-center px-4 py-8 sm:px-6">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-emerald-950/5 border border-emerald-100 overflow-hidden">
        {/* Brand Header */}
        <div className="bg-gradient-to-br from-[#0f5d2f] via-[#0c4a25] to-[#072a15] p-6 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 transform translate-x-4 -translate-y-4 w-28 h-28 bg-white/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl overflow-hidden shadow-lg border-2 border-white/30 mb-3 bg-white">
            <img src="/icon-512.png" alt="LensaPay Icon" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Lensa<span className="text-emerald-300">Pay</span> Uganda
          </h1>
          <p className="text-emerald-100 text-xs mt-1 font-medium">
            Upload photos daily & earn instant Mobile Money
          </p>

          <div className="mt-3 inline-flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full text-[11px] text-emerald-200 border border-white/10">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            MTN & Airtel MoMo Payouts Supported
          </div>
        </div>

        {/* Login Form */}
        <div className="p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Sign in to your account</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Enter your registered Ugandan phone number and password
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Phone input with Uganda flag & +256 */}
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Phone Number
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
              <p className="text-[11px] text-gray-400 mt-1">E.g. 0781234567 or +256781234567</p>
            </div>

            {/* Password input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-[#0f5d2f] focus:ring-2 focus:ring-[#0f5d2f]/20 transition-all placeholder:text-gray-400"
                  required
                />
              </div>
            </div>

            {/* Login button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-[#0f5d2f] hover:bg-[#0c4a25] active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-emerald-900/15 flex items-center justify-center gap-2 transition-all disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Login</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Link to /register */}
          <div className="mt-6 text-center text-xs text-gray-600 border-t border-gray-100 pt-5">
            Don't have an account yet?{' '}
            <button
              onClick={() => navigate('/register')}
              className="font-bold text-[#0f5d2f] hover:underline cursor-pointer"
            >
              Register here
            </button>
          </div>

          {/* Quick 1-click test credentials */}
          <div className="mt-6 pt-4 border-t border-dashed border-gray-200">
            <span className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">
              Quick 1-Click Fill Demo Credentials
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={() => fillQuickDemo('+256781234567', '123456')}
                className="p-2 rounded-lg bg-gray-50 hover:bg-emerald-50 text-gray-700 hover:text-[#0f5d2f] border border-gray-200 transition-colors text-left"
              >
                <span className="font-bold block">Free Trial User</span>
                <span className="text-[10px] text-gray-500">0781234567 / 123456</span>
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('+256701234567', '123456')}
                className="p-2 rounded-lg bg-amber-50/70 hover:bg-amber-100 text-amber-900 border border-amber-200 transition-colors text-left"
              >
                <span className="font-bold block">VIP Gold Member</span>
                <span className="text-[10px] text-amber-700">0701234567 / 123456</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
