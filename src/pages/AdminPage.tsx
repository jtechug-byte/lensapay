import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, CreditCard, Camera, ArrowDownRight, CheckCircle2, 
  XCircle, Eye, ExternalLink, Lock, AlertCircle, RefreshCw, Send, Sparkles, X, RotateCcw 
} from 'lucide-react';
import { User, Photo, Payment, Withdrawal } from '../types';
import { dbService } from '../lib/db';
import { formatUGX, getPackageById } from '../data/packages';

import { isUserAdmin } from '../lib/db';

interface AdminPageProps {
  currentUser: User | null;
  navigate: (path: string) => void;
  onRefreshUser: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminPage: React.FC<AdminPageProps> = ({
  currentUser,
  navigate,
  onRefreshUser,
  showToast
}) => {
  // Admin authentication state
  const isAdmin = isUserAdmin(currentUser);
  const [accessDenied, setAccessDenied] = useState(false);
  const [adminPhone, setAdminPhone] = useState('0791388644');
  const [adminPassword, setAdminPassword] = useState('admin123');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Tabs: 'payments' | 'photos' | 'withdrawals'
  const [activeTab, setActiveTab] = useState<'payments' | 'photos' | 'withdrawals'>('payments');

  // Data states (initially empty - NO data fetched for non-admins)
  const [pendingPayments, setPendingPayments] = useState<Payment[]>([]);
  const [pendingPhotos, setPendingPhotos] = useState<Photo[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Withdrawal[]>([]);
  const [stats, setStats] = useState<any>(null);

  // Modal preview states
  const [modalImage, setModalImage] = useState<{ url: string; title: string } | null>(null);
  const [selectedWithdrawalToSend, setSelectedWithdrawalToSend] = useState<Withdrawal | null>(null);

  const loadData = () => {
    // STRICT SECURITY: Do not fetch any admin data for non-admin
    if (!isUserAdmin(currentUser)) return;
    setPendingPayments(dbService.getPendingPayments());
    setPendingPhotos(dbService.getPendingPhotos());
    setPendingWithdrawals(dbService.getPendingWithdrawals());
    setStats(dbService.getAdminStats());
  };

  useEffect(() => {
    // ROUTE PROTECTION CHECK:
    // If user is logged in but is NOT admin (role !== 'admin' and phone !== '0791388644'):
    // Show "Access Denied - Admin Only" and redirect to /dashboard
    if (currentUser && !isAdmin) {
      setAccessDenied(true);
      showToast('Access Denied - Admin Only', 'error');
      const timer = setTimeout(() => {
        navigate('/dashboard');
      }, 1200);
      return () => clearTimeout(timer);
    } else if (isAdmin) {
      loadData();
    }
  }, [currentUser, isAdmin]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const user = await dbService.login(adminPhone, adminPassword);
      if (user.role !== 'admin') {
        throw new Error('Access denied. This account does not have Admin Boss privileges.');
      }
      onRefreshUser();
      showToast('Welcome to Boss Terminal, Admin Takia!', 'success');
      loadData();
    } catch (err: any) {
      setLoginError(err.message || 'Admin authentication failed');
    }
  };

  // Tab A: Payments Pending Approve/Reject
  const handleApprovePayment = (paymentId: string) => {
    try {
      const { payment, user } = dbService.approvePayment(paymentId);
      showToast(`Payment of ${formatUGX(payment.amount)} approved! ${user.full_name}'s package is now activated.`, 'success');
      loadData();
      onRefreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve payment', 'error');
    }
  };

  const handleRejectPayment = (paymentId: string) => {
    try {
      dbService.rejectPayment(paymentId);
      showToast('Payment rejected.', 'info');
      loadData();
      onRefreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject payment', 'error');
    }
  };

  // Tab B: Photos Pending Approve/Reject
  const handleApprovePhoto = (photoId: string) => {
    try {
      const { photo, user } = dbService.approvePhoto(photoId);
      showToast(`Photo approved! Credited ${formatUGX(photo.earning_amount)} to ${user.full_name}.`, 'success');
      loadData();
      onRefreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to approve photo', 'error');
    }
  };

  const handleRejectPhoto = (photoId: string) => {
    try {
      dbService.rejectPhoto(photoId, 'Photo does not meet Uganda scenery/quality standards');
      showToast('Photo rejected.', 'info');
      loadData();
      onRefreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to reject photo', 'error');
    }
  };

  // Tab C: Withdrawals Pending Send Money + Confirm Done
  const handleConfirmWithdrawal = (withdrawalId: string) => {
    try {
      const w = dbService.completeWithdrawal(withdrawalId);
      showToast(`Withdrawal of ${formatUGX(w.amount)} to ${w.phone_number} marked as Completed & Sent!`, 'success');
      setSelectedWithdrawalToSend(null);
      loadData();
      onRefreshUser();
    } catch (err: any) {
      showToast(err.message || 'Failed to complete withdrawal', 'error');
    }
  };

  // If user is a logged-in non-admin, show Access Denied and redirect
  if (accessDenied || (currentUser && !isAdmin)) {
    return (
      <div className="min-h-[70vh] flex flex-col justify-center items-center px-4 py-8">
        <div className="bg-white rounded-3xl p-8 max-w-md w-full border border-red-200 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Access Denied - Admin Only</h2>
          <p className="text-xs text-gray-500 leading-relaxed">
            You do not have administrative permissions to view the Boss Terminal. Redirecting to your dashboard...
          </p>
          <div className="w-6 h-6 border-2 border-[#0f5d2f] border-t-transparent rounded-full animate-spin mx-auto mt-2" />
        </div>
      </div>
    );
  }

  // If not logged in as admin, show Boss Terminal separate login
  if (!isAdmin) {
    return (
      <div className="min-h-[80vh] flex flex-col justify-center items-center px-4 py-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border-2 border-purple-900/20 overflow-hidden">
          <div className="bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950 p-6 text-white text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/20">
              <ShieldAlert className="w-7 h-7 text-purple-300" />
            </div>
            <h1 className="text-2xl font-black tracking-tight">Boss Terminal</h1>
            <p className="text-purple-200 text-xs mt-1">
              LensaPay Uganda Master Administrator Console
            </p>
          </div>

          <div className="p-6 sm:p-8">
            {loginError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleAdminLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Admin Mobile / Identifier
                </label>
                <input
                  type="text"
                  value={adminPhone}
                  onChange={e => setAdminPhone(e.target.value)}
                  placeholder="0791388644 or admin"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-purple-800"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Master Password
                </label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={e => setAdminPassword(e.target.value)}
                  placeholder="admin123"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:border-purple-800"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-purple-900 hover:bg-purple-950 text-white font-bold rounded-xl shadow-lg transition-all text-sm cursor-pointer"
              >
                Enter Boss Terminal
              </button>
            </form>

            <div className="mt-5 p-3 rounded-xl bg-purple-50 text-purple-900 text-xs text-center border border-purple-200">
              <span className="font-bold">Default Boss Credentials:</span>
              <p className="font-mono mt-0.5">Phone: 0791388644 • Password: admin123</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 space-y-6">
      {/* Boss Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
            <ShieldAlert className="w-8 h-8 text-purple-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">Boss Terminal</h1>
              <span className="bg-purple-400 text-purple-950 font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase">
                Uganda Admin
              </span>
            </div>
            <p className="text-xs text-purple-200 mt-1">
              Logged in as Takia Namuddu (0791388644). Review payments, approve photos, and process MoMo payouts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={loadData}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white flex items-center justify-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button
            onClick={() => {
              dbService.resetAllData();
              loadData();
              onRefreshUser();
              showToast('Demo data reset to initial state', 'info');
            }}
            className="flex-1 sm:flex-none px-3.5 py-2 bg-red-900/40 hover:bg-red-900/60 border border-red-500/30 rounded-xl text-xs font-bold text-red-200 flex items-center justify-center gap-1.5 transition-colors"
            title="Reset to fresh demo data"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Data
          </button>
        </div>
      </div>

      {/* Admin Stats Strip */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Pending Payments
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-amber-600">
                {stats.pendingPaymentsCount}
              </span>
              <span className="text-xs text-gray-500 font-semibold">
                ({formatUGX(stats.pendingPaymentsSum)})
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Pending Photos
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-[#0f5d2f]">
                {stats.pendingPhotosCount}
              </span>
              <span className="text-xs text-gray-500">To review</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Pending Payouts
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-purple-600">
                {stats.pendingWithdrawalsCount}
              </span>
              <span className="text-xs text-gray-500 font-semibold">
                ({formatUGX(stats.pendingWithdrawalsSum)})
              </span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              Registered Users
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-xl sm:text-2xl font-black text-gray-900">
                {stats.totalUsers}
              </span>
              <span className="text-xs text-[#0f5d2f] font-bold">
                ({stats.vipUsersCount} VIPs)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tabs as specified:
          a) Payments Pending
          b) Photos Pending
          c) Withdrawals Pending */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-gray-200 bg-gray-50/50 p-2 gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('payments')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-purple-900 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Payments Pending ({pendingPayments.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('photos')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'photos'
                ? 'bg-[#0f5d2f] text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Photos Pending ({pendingPhotos.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              activeTab === 'withdrawals'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Withdrawals Pending ({pendingWithdrawals.length})</span>
          </button>
        </div>

        {/* Tab A Content: Payments Pending */}
        {activeTab === 'payments' && (
          <div className="p-4 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-base text-gray-900">
                  Payments Pending Verification
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Verify MoMo Transaction ID & Screenshot before activating user VIP package.
                </p>
              </div>
            </div>

            {pendingPayments.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl text-gray-400 text-xs">
                No pending payments awaiting review.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 uppercase font-bold text-[10px] tracking-wider bg-gray-50/70">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Package</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Transaction ID</th>
                      <th className="py-3 px-4">Screenshot</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingPayments.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-semibold text-gray-900">
                          <div>{p.user_name || 'Member'}</div>
                          <span className="text-[10px] text-gray-400 font-mono">{p.user_phone}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-bold text-purple-900 bg-purple-100 px-2 py-0.5 rounded-md">
                            {p.package_name || p.package_id}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-black text-emerald-800 text-sm">
                          {formatUGX(p.amount)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-700 bg-gray-50 rounded">
                          {p.transaction_id}
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            type="button"
                            onClick={() => setModalImage({ url: p.screenshot_url, title: `Payment Screenshot - ${p.transaction_id}` })}
                            className="inline-flex items-center gap-1 text-[#0f5d2f] hover:underline font-bold"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View Proof
                          </button>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => handleApprovePayment(p.id)}
                            className="px-3 py-1.5 bg-[#0f5d2f] hover:bg-[#0c4a25] text-white font-bold rounded-lg shadow-xs transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectPayment(p.id)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 font-semibold rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab B Content: Photos Pending */}
        {activeTab === 'photos' && (
          <div className="p-4 sm:p-6">
            <div className="mb-4">
              <h3 className="font-bold text-base text-gray-900">
                Photos Pending Approval
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                On approve: Photo status=approved, earnings credited to user, and free trial updated.
              </p>
            </div>

            {pendingPhotos.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl text-gray-400 text-xs">
                No pending photos to review at this moment.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 uppercase font-bold text-[10px] tracking-wider bg-gray-50/70">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Photo Preview</th>
                      <th className="py-3 px-4">Package</th>
                      <th className="py-3 px-4">Earn Rate</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingPhotos.map((photo) => {
                      const user = dbService.getUserById(photo.user_id);
                      const pkg = user?.package_id ? getPackageById(user.package_id) : null;
                      const earnRate = pkg ? pkg.per_photo : 50;

                      return (
                        <tr key={photo.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-gray-900">
                            <div>{user?.full_name || photo.user_name || 'Member'}</div>
                            <span className="text-[10px] text-gray-400 font-mono">
                              {user?.phone || photo.user_phone}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={photo.image_url}
                                alt="Submission"
                                className="w-14 h-10 object-cover rounded-lg border border-gray-200 cursor-pointer shadow-xs hover:scale-105 transition-transform"
                                onClick={() => setModalImage({ url: photo.image_url, title: `Photo Submission by ${user?.full_name}` })}
                              />
                              <div className="max-w-xs truncate">
                                <span className="font-semibold text-gray-800 block truncate">
                                  {photo.caption || 'Daily Photo'}
                                </span>
                                <span className="text-[10px] text-gray-400">
                                  {new Date(photo.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-[#0f5d2f] border border-emerald-200">
                              {pkg ? pkg.name : 'Free Trial'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-black text-emerald-800 text-sm">
                            {formatUGX(earnRate)}
                          </td>
                          <td className="py-3.5 px-4 text-right space-x-2">
                            <button
                              onClick={() => handleApprovePhoto(photo.id)}
                              className="px-3 py-1.5 bg-[#0f5d2f] hover:bg-[#0c4a25] text-white font-bold rounded-lg shadow-xs transition-colors"
                            >
                              Approve (+{formatUGX(earnRate)})
                            </button>
                            <button
                              onClick={() => handleRejectPhoto(photo.id)}
                              className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700 font-semibold rounded-lg transition-colors"
                            >
                              Reject
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab C Content: Withdrawals Pending */}
        {activeTab === 'withdrawals' && (
          <div className="p-4 sm:p-6">
            <div className="mb-4">
              <h3 className="font-bold text-base text-gray-900">
                Pending Withdrawal Requests
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Send money via MTN or Airtel Mobile Money to the recipient, then click Confirm Done.
              </p>
            </div>

            {pendingWithdrawals.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl text-gray-400 text-xs">
                No pending withdrawal cashouts right now.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 uppercase font-bold text-[10px] tracking-wider bg-gray-50/70">
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Phone</th>
                      <th className="py-3 px-4">Account Name</th>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {pendingWithdrawals.map((w) => (
                      <tr key={w.id} className="hover:bg-gray-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-gray-900">
                          {w.account_name}
                        </td>
                        <td className="py-3.5 px-4 font-black text-emerald-800 text-sm">
                          {formatUGX(w.amount)}
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-gray-700">
                          {w.phone_number}
                        </td>
                        <td className="py-3.5 px-4 text-gray-800 font-medium">
                          {w.account_name}
                        </td>
                        <td className="py-3.5 px-4 text-gray-400 text-[11px]">
                          {new Date(w.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                            Pending
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => setSelectedWithdrawalToSend(w)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs transition-colors inline-flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            Send Money
                          </button>
                          <button
                            onClick={() => handleConfirmWithdrawal(w.id)}
                            className="px-3 py-1.5 bg-[#0f5d2f] hover:bg-[#0c4a25] text-white font-bold rounded-lg shadow-xs transition-colors"
                          >
                            Confirm Done
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for Screenshot / Photo Previews */}
      {modalImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95">
            <div className="p-4 bg-gray-900 text-white flex items-center justify-between">
              <h4 className="font-bold text-sm truncate">{modalImage.title}</h4>
              <button
                onClick={() => setModalImage(null)}
                className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-black/5 max-h-[75vh] overflow-auto flex items-center justify-center">
              <img
                src={modalImage.url}
                alt="Enlarged"
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow"
              />
            </div>
            <div className="p-4 bg-gray-50 flex justify-end">
              <button
                onClick={() => setModalImage(null)}
                className="px-5 py-2 bg-gray-900 text-white rounded-xl text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MoMo Send Money Assistant Modal */}
      {selectedWithdrawalToSend && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl animate-in zoom-in-95 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-lg text-gray-900 flex items-center gap-2">
                <Send className="w-5 h-5 text-emerald-600" />
                Disburse MoMo Payout
              </h4>
              <button
                onClick={() => setSelectedWithdrawalToSend(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-200 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-500">Recipient Name:</span>
                <span className="font-bold text-gray-900">{selectedWithdrawalToSend.account_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Phone Number:</span>
                <span className="font-bold font-mono text-[#0f5d2f] text-sm">{selectedWithdrawalToSend.phone_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Amount to Send:</span>
                <span className="font-extrabold text-gray-950 text-base">{formatUGX(selectedWithdrawalToSend.amount)}</span>
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Open your MTN MoMo / Airtel Money app or dial *165# / *185# to send <strong>{formatUGX(selectedWithdrawalToSend.amount)}</strong> to <strong>{selectedWithdrawalToSend.phone_number}</strong>. Once sent, click "Confirm Done" below.
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleConfirmWithdrawal(selectedWithdrawalToSend.id)}
                className="flex-1 py-3 bg-[#0f5d2f] hover:bg-[#0c4a25] text-white font-bold rounded-xl text-xs transition-colors"
              >
                Confirm Done & Complete
              </button>
              <button
                onClick={() => setSelectedWithdrawalToSend(null)}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
