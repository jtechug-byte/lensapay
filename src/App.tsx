import React, { useState, useEffect } from 'react';
import { dbService, initDatabase, isUserAdmin } from './lib/db';
import { User } from './types';
import { Navbar } from './components/Navbar';
import { TawkWidget } from './components/TawkWidget';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { DashboardPage } from './pages/DashboardPage';
import { PackagesPage } from './pages/PackagesPage';
import { PaymentPage } from './pages/PaymentPage';
import { WithdrawPage } from './pages/WithdrawPage';
import { AdminPage } from './pages/AdminPage';
import { InstallAppModal } from './components/InstallAppModal';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export default function App() {
  // Initialize storage & seed database
  useEffect(() => {
    initDatabase();
  }, []);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    initDatabase();
    return dbService.getCurrentUser() || dbService.getAllUsers()[0] || null;
  });

  // Client-side path router supporting browser history & direct URL params
  const [currentPath, setCurrentPath] = useState<string>(() => {
    const p = window.location.pathname;
    const search = window.location.search;
    return p === '/' ? '/dashboard' : p + search;
  });

  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  const navigate = (path: string) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Sync with browser back/forward buttons
  useEffect(() => {
    const handlePopState = () => {
      const p = window.location.pathname + window.location.search;
      setCurrentPath(p === '/' ? '/dashboard' : p);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleRefreshUser = () => {
    const refreshed = dbService.getCurrentUser();
    setCurrentUser(refreshed);
  };

  const handleLogout = () => {
    dbService.logout();
    setCurrentUser(null);
    showToast('Logged out successfully', 'info');
    navigate('/login');
  };

  // Extract base route and query parameters
  const [baseRoute, queryString] = currentPath.split('?');
  const searchParams = new URLSearchParams(queryString || '');
  const packageParam = searchParams.get('package');

  // Security Middleware: Protect Boss Terminal route from non-admins
  useEffect(() => {
    if (baseRoute === '/boss-terminal' || baseRoute === '/admin') {
      if (currentUser && !isUserAdmin(currentUser)) {
        showToast('Access Denied - Admin Only', 'error');
        navigate('/dashboard');
      }
    }
  }, [baseRoute, currentUser]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Navigation Header (Boss Terminal link is conditionally rendered ONLY for admins) */}
      <Navbar
        currentPath={baseRoute}
        navigate={navigate}
        user={currentUser}
        onLogout={handleLogout}
        onRefreshUser={handleRefreshUser}
      />

      {/* Main Page Content Router */}
      <main className="flex-1">
        {/* /login */}
        {baseRoute === '/login' && (
          <LoginPage
            navigate={navigate}
            onLoginSuccess={(u) => {
              setCurrentUser(u);
              showToast(`Welcome back, ${u.full_name}!`, 'success');
            }}
          />
        )}

        {/* /register */}
        {baseRoute === '/register' && (
          <RegisterPage
            navigate={navigate}
            onRegisterSuccess={(u) => {
              setCurrentUser(u);
              showToast(`Account created successfully! Welcome to LensaPay Uganda.`, 'success');
            }}
          />
        )}

        {/* /dashboard (Protected) */}
        {baseRoute === '/dashboard' && (
          currentUser ? (
            <DashboardPage
              user={currentUser}
              navigate={navigate}
              onRefreshUser={handleRefreshUser}
              showToast={showToast}
            />
          ) : (
            <LoginPage
              navigate={navigate}
              onLoginSuccess={(u) => {
                setCurrentUser(u);
                navigate('/dashboard');
              }}
            />
          )
        )}

        {/* /packages */}
        {baseRoute === '/packages' && (
          <PackagesPage
            user={currentUser}
            navigate={navigate}
          />
        )}

        {/* /payment */}
        {baseRoute === '/payment' && (
          <PaymentPage
            user={currentUser}
            packageIdParam={packageParam}
            navigate={navigate}
            showToast={showToast}
          />
        )}

        {/* /withdraw */}
        {baseRoute === '/withdraw' && (
          currentUser ? (
            <WithdrawPage
              user={currentUser}
              navigate={navigate}
              onRefreshUser={handleRefreshUser}
              showToast={showToast}
            />
          ) : (
            <LoginPage
              navigate={navigate}
              onLoginSuccess={(u) => {
                setCurrentUser(u);
                navigate('/withdraw');
              }}
            />
          )
        )}

        {/* /boss-terminal and /admin (Boss Terminal Protected Route) */}
        {(baseRoute === '/boss-terminal' || baseRoute === '/admin') && (
          <AdminPage
            currentUser={currentUser}
            navigate={navigate}
            onRefreshUser={handleRefreshUser}
            showToast={showToast}
          />
        )}

        {/* Default fallback to dashboard or login */}
        {!['/login', '/register', '/dashboard', '/packages', '/payment', '/withdraw', '/admin', '/boss-terminal'].includes(baseRoute) && (
          <DashboardPage
            user={currentUser || dbService.getAllUsers()[0]}
            navigate={navigate}
            onRefreshUser={handleRefreshUser}
            showToast={showToast}
          />
        )}
      </main>

      {/* Toast Notification Container */}
      <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-xl border flex items-start gap-3 transform transition-all duration-300 animate-in slide-in-from-top-2 ${
              toast.type === 'success'
                ? 'bg-white border-emerald-300 text-emerald-950 shadow-emerald-950/10'
                : toast.type === 'error'
                ? 'bg-white border-red-300 text-red-950 shadow-red-950/10'
                : 'bg-white border-blue-300 text-blue-950 shadow-blue-950/10'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-[#0f5d2f] shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />}
            
            <p className="text-xs font-semibold leading-relaxed flex-1">
              {toast.message}
            </p>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Tawk.to live support integration (renders on all user pages, strictly hidden on /admin and /boss-terminal) */}
      <TawkWidget currentPath={baseRoute} />

      {/* PWA Install / Download Modal (shown after login if not already installed) */}
      <InstallAppModal isLoggedIn={!!currentUser} />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 text-center text-xs text-gray-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-gray-900">
              Lensa<span className="text-[#0f5d2f]">Pay</span> Uganda
            </span>
            <span>•</span>
            <span>Kampala, Uganda</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] text-gray-400">
            <span>MTN & Airtel MoMo Payouts</span>
            <span>•</span>
            <span>60-Day ROI Guarantee</span>
            {isUserAdmin(currentUser) && (
              <>
                <span>•</span>
                <button
                  onClick={() => navigate('/boss-terminal')}
                  className="text-purple-700 hover:text-purple-900 font-bold"
                >
                  Boss Terminal
                </button>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
