import React, { useState, useRef, useEffect } from 'react';
import { 
  CreditCard, Copy, Check, Upload, ArrowLeft, ShieldCheck, 
  Clock, CheckCircle2, AlertCircle, Phone, ArrowRight 
} from 'lucide-react';
import { VIP_PACKAGES, getPackageById, formatUGX } from '../data/packages';
import { dbService } from '../lib/db';
import { User, Package } from '../types';

interface PaymentPageProps {
  user: User | null;
  packageIdParam: string | null;
  navigate: (path: string) => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  user,
  packageIdParam,
  navigate,
  showToast
}) => {
  const [selectedPkgId, setSelectedPkgId] = useState<string>(packageIdParam || 'starter');
  const [transactionId, setTransactionId] = useState('');
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (packageIdParam) {
      setSelectedPkgId(packageIdParam);
    }
  }, [packageIdParam]);

  const selectedPkg: Package = getPackageById(selectedPkgId) || VIP_PACKAGES[0];

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    showToast(`Copied ${label} to clipboard`, 'info');
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG or JPG)');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Screenshot file size exceeds 5MB limit');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      setScreenshotUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      navigate('/login');
      return;
    }

    if (!transactionId.trim()) {
      setError('Please enter the Mobile Money Transaction ID / Reference');
      return;
    }

    if (!screenshotUrl) {
      setError('Please upload a screenshot of your Mobile Money SMS or App confirmation');
      return;
    }

    setSubmitting(true);
    try {
      // On submit: Insert into payments table: user_id, package_id, amount, transaction_id, screenshot_url, status=pending
      dbService.submitPayment(
        user.id,
        selectedPkg.id,
        selectedPkg.price,
        transactionId,
        screenshotUrl
      );

      setIsSuccess(true);
      showToast('Payment submitted for review!', 'success');
    } catch (err: any) {
      setError(err.message || 'Failed to submit payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 pb-24 md:pb-12">
      {/* Back button */}
      <button
        onClick={() => navigate('/packages')}
        className="mb-6 inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to VIP Packages
      </button>

      {/* Success View */}
      {isSuccess ? (
        <div className="bg-white rounded-3xl p-8 border border-emerald-200 shadow-xl text-center space-y-5 animate-in fade-in duration-300">
          <div className="w-16 h-16 bg-emerald-100 text-[#0f5d2f] rounded-2xl flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-9 h-9" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Payment Submitted for Approval</h2>
            {/* Exact message required */}
            <p className="text-sm font-semibold text-emerald-800 mt-2 bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
              "Your payment is now pending review. Will be verified and package activated once approved. Usually 5-15 minutes."
            </p>
          </div>

          <div className="bg-gray-50 rounded-2xl p-4 text-xs space-y-2 text-left max-w-md mx-auto">
            <div className="flex justify-between">
              <span className="text-gray-500">Selected Package:</span>
              <span className="font-bold text-gray-900">{selectedPkg.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Amount Paid:</span>
              <span className="font-bold text-[#0f5d2f]">{formatUGX(selectedPkg.price)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Transaction ID:</span>
              <span className="font-bold font-mono text-gray-900">{transactionId.toUpperCase()}</span>
            </div>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="px-8 py-3 bg-[#0f5d2f] hover:bg-[#0c4a25] text-white font-bold rounded-xl shadow-md transition-all text-xs cursor-pointer"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header & Selected Package Summary */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
              <div>
                <span className="text-xs font-bold text-[#0f5d2f] uppercase tracking-wider block mb-1">
                  Step 1: Selected VIP Plan
                </span>
                <h1 className="text-2xl font-extrabold text-gray-900">
                  {selectedPkg.name}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  5 photos/day • {formatUGX(selectedPkg.per_photo)} per photo • 6-Month Validity
                </p>
              </div>

              <div className="text-right sm:text-right">
                <span className="text-xs text-gray-400 block">Total Amount Due</span>
                <span className="text-2xl sm:text-3xl font-extrabold text-[#0f5d2f]">
                  {formatUGX(selectedPkg.price)}
                </span>
              </div>
            </div>

            {/* Change package selector */}
            <div className="mt-4 pt-2">
              <label className="block text-xs font-bold text-gray-600 mb-2">
                Need to change plan? Select below:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {VIP_PACKAGES.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedPkgId(p.id)}
                    className={`p-2 rounded-xl text-center text-xs font-bold transition-all border ${
                      selectedPkg.id === p.id
                        ? 'bg-[#0f5d2f] text-white border-[#0f5d2f] shadow-sm'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    <div>{p.name.replace(' VIP', '')}</div>
                    <div className="text-[10px] opacity-80 font-normal mt-0.5">
                      {formatUGX(p.price)}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Instructions Box as specified */}
          <div className="bg-gradient-to-br from-emerald-900 to-[#0f5d2f] text-white rounded-3xl p-6 sm:p-8 shadow-lg shadow-emerald-950/10 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-emerald-300" />
                Payment Instructions
              </h2>
              <div className="flex items-center gap-2">
                <span className="bg-[#ffcc00] text-black text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                  MTN MoMo
                </span>
                <span className="bg-[#ed1c24] text-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase">
                  Airtel Money
                </span>
              </div>
            </div>

            <div className="bg-black/20 rounded-2xl p-4 sm:p-5 border border-white/10 space-y-4">
              {/* Mobile Money Number */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div>
                  <span className="text-xs text-emerald-200 block">Mobile Money Number:</span>
                  <span className="text-xl sm:text-2xl font-mono font-extrabold text-white tracking-wider">
                    0791388644
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard('0791388644', 'MoMo Number')}
                  className="self-start sm:self-auto px-3.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold rounded-xl text-white flex items-center gap-1.5 transition-colors"
                >
                  {copiedField === 'MoMo Number' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'MoMo Number' ? 'Copied' : 'Copy Number'}</span>
                </button>
              </div>

              {/* Account Name */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div>
                  <span className="text-xs text-emerald-200 block">Account Name:</span>
                  <span className="text-base sm:text-lg font-bold text-white tracking-wide">
                    TAKIA NAMUDDU
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard('TAKIA NAMUDDU', 'Account Name')}
                  className="self-start sm:self-auto px-3.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold rounded-xl text-white flex items-center gap-1.5 transition-colors"
                >
                  {copiedField === 'Account Name' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'Account Name' ? 'Copied' : 'Copy Name'}</span>
                </button>
              </div>

              {/* Amount to Pay */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/10">
                <div>
                  <span className="text-xs text-emerald-200 block">Amount to Pay:</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-yellow-300 tracking-wide">
                    {formatUGX(selectedPkg.price)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(selectedPkg.price.toString(), 'Amount')}
                  className="self-start sm:self-auto px-3.5 py-1.5 bg-white/10 hover:bg-white/20 active:scale-95 text-xs font-semibold rounded-xl text-white flex items-center gap-1.5 transition-colors"
                >
                  {copiedField === 'Amount' ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedField === 'Amount' ? 'Copied' : 'Copy Amount'}</span>
                </button>
              </div>

              {/* Note */}
              <div className="text-xs text-emerald-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
                <span>
                  <strong>Note:</strong> Use exact amount via MTN or Airtel MoMo. Prompt will display recipient TAKIA NAMUDDU.
                </span>
              </div>
            </div>
          </div>

          {/* Verify Your Payment Form */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold text-[#0f5d2f] uppercase tracking-wider block mb-1">
                Step 2: Verification
              </span>
              <h2 className="text-xl font-bold text-gray-900">Verify Your Payment</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Submit your transaction reference and screenshot for rapid 5-15 minute activation.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Transaction ID / Reference */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Transaction ID / Reference <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="e.g. 19284729104 or TXN892348"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-mono uppercase focus:bg-white focus:outline-none focus:border-[#0f5d2f] focus:ring-2 focus:ring-[#0f5d2f]/20 transition-all placeholder:text-gray-400"
                  required
                />
                <p className="text-[11px] text-gray-400 mt-1">
                  Found in your MTN / Airtel confirmation SMS message
                </p>
              </div>

              {/* Screenshot Upload */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Payment Screenshot (PNG/JPG max 5MB) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/png, image/jpeg"
                  className="hidden"
                  id="screenshot-input"
                />

                {!screenshotUrl ? (
                  <label
                    htmlFor="screenshot-input"
                    className="cursor-pointer border-2 border-dashed border-gray-300 hover:border-[#0f5d2f] bg-gray-50 hover:bg-emerald-50/40 rounded-2xl p-6 flex flex-col items-center justify-center text-center transition-all group"
                  >
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#0f5d2f] mb-2 transition-colors" />
                    <span className="text-xs font-bold text-gray-800">
                      Click to upload payment screenshot
                    </span>
                    <span className="text-[11px] text-gray-400 mt-0.5">
                      PNG or JPG (Max 5MB)
                    </span>
                  </label>
                ) : (
                  <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 max-h-60 flex items-center justify-center">
                    <img
                      src={screenshotUrl}
                      alt="Payment screenshot"
                      className="max-h-60 object-contain"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setScreenshotUrl(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="absolute top-2 right-2 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-md hover:bg-red-700 transition-colors"
                    >
                      Change
                    </button>
                  </div>
                )}
              </div>

              {/* Submit for Approval Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-[#0f5d2f] hover:bg-[#0c4a25] active:scale-[0.99] text-white font-bold rounded-xl shadow-lg shadow-emerald-950/15 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-60 text-sm"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Submit for Approval</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
          {/* Note: Strictly NO admin support contact box on /payment as instructed */}
        </div>
      )}
    </div>
  );
};
