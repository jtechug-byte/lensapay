import React, { useState, useEffect } from 'react';
import { 
  ArrowDownRight, ShieldCheck, Clock, CheckCircle2, AlertCircle, 
  Wallet, Phone, User as UserIcon, History 
} from 'lucide-react';
import { User, Withdrawal } from '../types';
import { dbService } from '../lib/db';
import { formatUGX } from '../data/packages';

interface WithdrawPageProps {
  user: User;
  navigate: (path: string) => void;
  onRefreshUser: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const WithdrawPage: React.FC<WithdrawPageProps> = ({
  user,
  navigate,
  onRefreshUser,
  showToast
}) => {
  const [amountStr, setAmountStr] = useState('');
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingSuccess, setPendingSuccess] = useState<Withdrawal | null>(null);

  const loadWithdrawals = () => {
    const list = dbService.getUserWithdrawals(user.id);
    setWithdrawals(list);
  };

  useEffect(() => {
    loadWithdrawals();
  }, [user.id]);

  const numAmount = parseInt(amountStr, 10) || 0;
  const minAmount = 5000;
  const maxBalance = user.balance || 0;

  const handleQuickAmount = (val: number) => {
    const clamped = Math.min(val, maxBalance);
    setAmountStr(clamped.toString());
    setError(null);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numAmount < minAmount) {
      setError(`Minimum withdrawal is ${formatUGX(minAmount)}.`);
      return;
    }

    if (numAmount > maxBalance) {
      setError(`Amount exceeds your available balance (${formatUGX(maxBalance)}).`);
      return;
    }

    setSubmitting(true);
    try {
      // On submit: Insert withdrawals: user_id, amount, phone_number, account_name, status=pending, lock balance (show pending deduction)
      const newRecord = dbService.submitWithdrawal(
        user.id,
        numAmount,
        user.phone,
        user.full_name
      );

      setPendingSuccess(newRecord);
      setAmountStr('');
      showToast(`Withdrawal request for ${formatUGX(numAmount)} submitted!`, 'success');
      loadWithdrawals();
      onRefreshUser();
    } catch (err: any) {
      setError(err.message || 'Withdrawal submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12 space-y-6">
      {/* Balance Card & Verified Badge */}
      <div className="bg-gradient-to-br from-[#0f5d2f] via-[#0c4a25] to-[#072a15] rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold tracking-wider text-emerald-300">
              Account Balance Available
            </span>
            {/* Verified account badge as requested */}
            <span className="inline-flex items-center gap-1 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white border border-white/20">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
              Verified Account Badge
            </span>
          </div>
          <div className="text-3xl sm:text-5xl font-black tracking-tight text-white">
            {formatUGX(maxBalance)}
          </div>
          <p className="text-xs text-emerald-200">
            Min. withdrawal: {formatUGX(minAmount)} • Instant Mobile Money transfer
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 sm:text-right shrink-0">
          <span className="text-[11px] text-emerald-200 uppercase font-bold block">
            Payout Method
          </span>
          <span className="text-sm font-bold text-white flex items-center sm:justify-end gap-1 mt-0.5">
            MTN / Airtel Mobile Money
          </span>
          <span className="text-[10px] text-emerald-300 block mt-1">
            0% Withdrawal Processing Fee
          </span>
        </div>
      </div>

      {/* Pending Success Notification */}
      {pendingSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-[#0f5d2f] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-emerald-950">
                Withdrawal of {formatUGX(pendingSuccess.amount)} Submitted!
              </h4>
              <p className="text-xs text-emerald-800 mt-1">
                Your request is locked and pending admin disbursement to {pendingSuccess.phone_number}.
              </p>
            </div>
          </div>
          <button
            onClick={() => setPendingSuccess(null)}
            className="text-xs font-bold text-[#0f5d2f] hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Withdrawal Form Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ArrowDownRight className="w-5 h-5 text-[#0f5d2f]" />
            Request Cash Withdrawal
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Funds will be transferred directly to your verified phone number.
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleWithdrawSubmit} className="space-y-5">
          {/* Amount to withdraw UGX */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Amount to withdraw (UGX)
              </label>
              <span className="text-xs text-gray-500">
                Max: <button type="button" onClick={() => handleQuickAmount(maxBalance)} className="font-bold text-[#0f5d2f] hover:underline">{formatUGX(maxBalance)}</button>
              </span>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 font-bold text-sm">
                UGX
              </div>
              <input
                type="number"
                min={minAmount}
                max={maxBalance}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="e.g. 50000"
                className="w-full pl-14 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-base font-bold focus:bg-white focus:outline-none focus:border-[#0f5d2f] focus:ring-2 focus:ring-[#0f5d2f]/20 transition-all placeholder:text-gray-400"
                required
              />
            </div>

            {/* Quick chips */}
            <div className="flex gap-2 mt-2 flex-wrap text-xs">
              {[5000, 20000, 50000, 100000, maxBalance].filter(v => v > 0).map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleQuickAmount(chip)}
                  className="px-2.5 py-1 bg-gray-100 hover:bg-emerald-50 hover:text-[#0f5d2f] rounded-lg font-medium text-gray-600 border border-gray-200 transition-colors"
                >
                  {chip === maxBalance ? `All (${formatUGX(chip)})` : formatUGX(chip)}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Details auto-filled from users table (read-only) as specified */}
          <div className="bg-gray-50/80 rounded-2xl p-5 border border-gray-200 space-y-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Recipient Details (Auto-filled from user profile)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Account Name */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Account Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={user.full_name}
                    readOnly
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-100/90 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={user.phone}
                    readOnly
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-100/90 border border-gray-200 rounded-xl text-xs font-bold text-gray-800 cursor-not-allowed select-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Processing time box as specified */}
          <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
            <Clock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Processing Time Notice:</strong>
              <p className="mt-0.5">
                "Your request will be processed by admin within 1-6 hours. You will receive SMS confirmation once complete."
              </p>
            </div>
          </div>

          {/* Button Withdraw [amount] UGX */}
          <button
            type="submit"
            disabled={submitting || maxBalance < minAmount}
            className="w-full py-4 bg-[#0f5d2f] hover:bg-[#0c4a25] active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-emerald-950/15 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 text-sm"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ArrowDownRight className="w-4 h-4" />
                <span>Withdraw {numAmount > 0 ? formatUGX(numAmount) : 'Funds'}</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Withdrawals History */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm">
        <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-4">
          <History className="w-4 h-4 text-gray-500" />
          Recent Withdrawals History
        </h3>

        {withdrawals.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-xs border border-dashed border-gray-200 rounded-2xl">
            No withdrawal requests made yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {withdrawals.map((w) => (
              <div key={w.id} className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <div className="font-bold text-sm text-gray-900">
                    {formatUGX(w.amount)}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {w.phone_number} • {new Date(w.created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>

                <div>
                  {w.status === 'pending' && (
                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-lg">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Pending Review
                    </span>
                  )}
                  {w.status === 'completed' && (
                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-[#0f5d2f] text-xs font-bold px-2.5 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Paid via MoMo
                    </span>
                  )}
                  {w.status === 'rejected' && (
                    <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 text-xs font-bold px-2.5 py-1 rounded-lg">
                      Refunded / Rejected
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
