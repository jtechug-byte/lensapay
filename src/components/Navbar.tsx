import React from 'react';
import { Camera, ArrowDownRight, Crown, ShieldAlert, LogOut, RefreshCw, Zap, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { formatUGX, getPackageById } from '../data/packages';
import { isUserAdmin } from '../lib/db';

interface NavbarProps {
  currentPath: string;
  navigate: (path: string) => void;
  user: User | null;
  onLogout: () => void;
  onRefreshUser?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPath,
  navigate,
  user,
  onLogout,
  onRefreshUser
}) => {
  // Security Check: Boss Terminal only visible if user is admin
  const isAdmin = isUserAdmin(user);
  const isCurrentAdminPage = currentPath === '/boss-terminal' || currentPath === '/admin';
  const userPackage = user?.package_id ? getPackageById(user.package_id) : null;

  return (
    <>
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <div
            onClick={() => navigate(user ? '/dashboard' : '/login')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src="/icon-512.png"
              alt="LensaPay Logo"
              className="w-10 h-10 rounded-xl shadow-md shadow-emerald-900/10 group-hover:scale-105 transition-transform object-cover"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight text-gray-900">
                  Lensa<span className="text-[#0f5d2f]">Pay</span>
                </span>
                <span className="bg-emerald-100 text-[#0f5d2f] text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                  Uganda
                </span>
              </div>
              <p className="text-[10px] text-gray-500 font-medium">Daily Photo Earning</p>
            </div>
          </div>

          {/* Desktop Nav Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              {/* Dashboard link always visible */}
              <button
                onClick={() => navigate('/dashboard')}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                  currentPath === '/dashboard'
                    ? 'bg-emerald-50 text-[#0f5d2f]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Camera className="w-4 h-4" />
                Dashboard
              </button>

              {/* VIP Packages always visible */}
              <button
                onClick={() => navigate('/packages')}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                  currentPath === '/packages'
                    ? 'bg-emerald-50 text-[#0f5d2f]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Crown className="w-4 h-4 text-amber-500" />
                VIP Packages
              </button>

              {/* Withdraw always visible */}
              <button
                onClick={() => navigate('/withdraw')}
                className={`px-3.5 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2 cursor-pointer ${
                  currentPath === '/withdraw'
                    ? 'bg-emerald-50 text-[#0f5d2f]'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                Withdraw
              </button>

              {/* Boss Terminal ONLY IF isAdmin === true */}
              {isAdmin && (
                <button
                  onClick={() => navigate('/boss-terminal')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs cursor-pointer ${
                    isCurrentAdminPage
                      ? 'bg-purple-900 text-white border-purple-950 shadow-md ring-2 ring-purple-300'
                      : 'bg-purple-50 text-purple-900 border-purple-200 hover:bg-purple-100'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-600 group-hover:text-purple-900" />
                  Boss Terminal
                </button>
              )}
            </nav>
          )}

          {/* User Profile & Balance Display (Production clean) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                {/* User Name Tag */}
                <div className="hidden lg:flex items-center gap-1.5 text-xs text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-xl">
                  <UserIcon className="w-3.5 h-3.5 text-gray-400" />
                  <span className="font-semibold text-gray-900 max-w-[130px] truncate">
                    {user.full_name}
                  </span>
                  {isAdmin && (
                    <span className="bg-purple-100 text-purple-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded uppercase">
                      Admin
                    </span>
                  )}
                </div>

                {/* Balance Display */}
                <div
                  onClick={() => navigate('/withdraw')}
                  className="cursor-pointer bg-gradient-to-r from-emerald-50 to-emerald-100/70 border border-emerald-200/80 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-xs hover:border-[#0f5d2f] transition-all"
                  title="Click to withdraw"
                >
                  <div className="text-right">
                    <span className="block text-[10px] uppercase font-bold text-emerald-800 tracking-wider">
                      Balance
                    </span>
                    <span className="block font-bold text-xs sm:text-sm text-[#0f5d2f]">
                      {formatUGX(user.balance || 0)}
                    </span>
                  </div>
                  {onRefreshUser && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRefreshUser();
                      }}
                      className="p-1 hover:bg-emerald-200/50 rounded-md text-emerald-700 transition-colors"
                      title="Refresh Balance"
                    >
                      <RefreshCw className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* VIP / Trial Badge */}
                <div className="hidden sm:flex items-center">
                  {userPackage ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
                      <Crown className="w-3.5 h-3.5 text-amber-600" />
                      {userPackage.name}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                      <Zap className="w-3 h-3 text-emerald-600" />
                      Free Trial
                    </span>
                  )}
                </div>

                {/* Logout Button */}
                <button
                  onClick={onLogout}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate('/login')}
                  className="px-3.5 py-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors cursor-pointer"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="px-4 py-2 text-sm font-semibold bg-[#0f5d2f] hover:bg-[#0c4a25] text-white rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Hidden on Boss Terminal) */}
      {user && !isCurrentAdminPage && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-2">
          <div className={`grid gap-1 ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <button
              onClick={() => navigate('/dashboard')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-semibold transition-all ${
                currentPath === '/dashboard'
                  ? 'text-[#0f5d2f] bg-emerald-50'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Camera className="w-5 h-5 mb-0.5" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => navigate('/packages')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-semibold transition-all ${
                currentPath === '/packages'
                  ? 'text-amber-700 bg-amber-50'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Crown className="w-5 h-5 mb-0.5 text-amber-500" />
              <span>VIP Plans</span>
            </button>
            <button
              onClick={() => navigate('/withdraw')}
              className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-semibold transition-all ${
                currentPath === '/withdraw'
                  ? 'text-[#0f5d2f] bg-emerald-50'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <ArrowDownRight className="w-5 h-5 mb-0.5" />
              <span>Withdraw</span>
            </button>

            {/* Boss Terminal in mobile nav ONLY if isAdmin */}
            {isAdmin && (
              <button
                onClick={() => navigate('/boss-terminal')}
                className={`flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-semibold transition-all ${
                  isCurrentAdminPage
                    ? 'text-purple-700 bg-purple-50'
                    : 'text-purple-600 hover:text-purple-900'
                }`}
              >
                <ShieldAlert className="w-5 h-5 mb-0.5" />
                <span>Boss</span>
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
