import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, Upload, Clock, CheckCircle2, XCircle, AlertTriangle, 
  Crown, ArrowRight, Zap, RefreshCw, Image as ImageIcon, Sparkles, AlertCircle 
} from 'lucide-react';
import { User, Photo } from '../types';
import { dbService } from '../lib/db';
import { formatUGX, getPackageById, FREE_TRIAL_EARN_RATE } from '../data/packages';

interface DashboardPageProps {
  user: User;
  navigate: (path: string) => void;
  onRefreshUser: () => void;
  showToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  user,
  navigate,
  onRefreshUser,
  showToast
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = () => {
    const list = dbService.getUserPhotos(user.id);
    setPhotos(list);
  };

  useEffect(() => {
    loadData();
  }, [user.id, user.balance]);

  // Today's counts
  const todayPhotos = dbService.getTodayUploads(user.id);
  const todayCount = todayPhotos.length;

  // Today's approved earnings
  const todayEarnings = todayPhotos
    .filter(p => p.status === 'approved')
    .reduce((sum, p) => sum + p.earning_amount, 0);

  const currentPkg = user.package_id ? getPackageById(user.package_id) : null;
  const maxUploadsToday = user.package_id ? 5 : 1;
  const remainingToday = Math.max(0, maxUploadsToday - todayCount);

  // Exact Logic as specified:
  // Free Trial: If free_trial_used=false and count>=1: Disable upload, show:
  // "You're done with today photos! No more uploading. You used 1/1 free trial photo. Buy a package."
  // VIP: If count>=5: Disable upload, show:
  // "You're done with today photos! No more uploading today. Come back tomorrow. You uploaded 5/5."
  const isFreeTrial = !user.package_id;
  const isFreeTrialExhausted = isFreeTrial && (todayCount >= 1 || user.free_trial_used);
  const isVipExhausted = !isFreeTrial && todayCount >= 5;
  const isUploadDisabled = isFreeTrial ? isFreeTrialExhausted : isVipExhausted;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file (PNG/JPG)', 'error');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      showToast('Image size exceeds 10MB limit', 'error');
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewUrl) {
      showToast('Please choose a photo to upload', 'error');
      return;
    }

    if (isUploadDisabled) {
      showToast('Daily upload limit reached', 'error');
      return;
    }

    setUploading(true);
    try {
      // On upload: Insert into photos status=pending, earning_amount=0 initially
      await dbService.uploadPhoto(user.id, previewUrl, caption || 'Daily Submission');
      showToast('Photo uploaded successfully! Status: Pending review by Admin', 'success');
      setSelectedFile(null);
      setPreviewUrl(null);
      setCaption('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      loadData();
      onRefreshUser();
    } catch (err: any) {
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const filteredPhotos = photos.filter(p => {
    if (filter === 'all') return true;
    return p.status === filter;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-24 md:pb-12 space-y-6">
      {/* Top Banner / VIP Notice */}
      {isFreeTrial && (
        <div className="bg-gradient-to-r from-emerald-900 via-[#0f5d2f] to-emerald-900 text-white rounded-3xl p-5 sm:p-6 shadow-lg shadow-emerald-950/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/20">
              <Sparkles className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="font-bold text-base sm:text-lg">You are on the Free Trial</h3>
                <span className="text-[10px] bg-yellow-400 text-yellow-950 font-extrabold px-2 py-0.5 rounded-full uppercase">
                  1 Free Photo
                </span>
              </div>
              <p className="text-xs text-emerald-100 mt-1 max-w-xl">
                Unlock daily earnings up to <span className="font-bold text-white">83,335 UGX/day</span> (5 photos every day) with a VIP package. 60-day ROI guaranteed!
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/packages')}
            className="w-full sm:w-auto px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 active:scale-95 text-yellow-950 font-bold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0"
          >
            <Crown className="w-4 h-4 text-amber-900" />
            View VIP Packages
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top 3 Metric Cards as requested:
          Top: Account Balance UGX, Today Earnings, Today counter: X/5 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* 1. Account Balance */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Account Balance
            </span>
            <span className="p-2 bg-emerald-50 text-[#0f5d2f] rounded-xl">
              <Zap className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-[#0f5d2f] tracking-tight">
            {formatUGX(user.balance || 0)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-gray-100">
            <span className="text-gray-500">Available to cash out</span>
            <button
              onClick={() => navigate('/withdraw')}
              className="text-[#0f5d2f] hover:underline font-bold flex items-center gap-1"
            >
              Withdraw
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* 2. Today's Earnings */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Today Earnings
            </span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
            {formatUGX(todayEarnings)}
          </div>
          <div className="mt-3 flex items-center justify-between text-xs pt-3 border-t border-gray-100">
            <span className="text-gray-500">Rate per approved photo</span>
            <span className="font-bold text-emerald-700">
              {currentPkg ? `${formatUGX(currentPkg.per_photo)}/photo` : `${formatUGX(FREE_TRIAL_EARN_RATE)}/photo`}
            </span>
          </div>
        </div>

        {/* 3. Today Counter: X/5 */}
        <div className="bg-white rounded-2xl p-5 border border-emerald-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Today Uploads Counter
            </span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Camera className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              {todayCount}
            </span>
            <span className="text-base text-gray-400 font-bold">
              / {maxUploadsToday}
            </span>
            <span className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
              {remainingToday} left
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-3 w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                todayCount >= maxUploadsToday ? 'bg-amber-500' : 'bg-[#0f5d2f]'
              }`}
              style={{ width: `${Math.min(100, (todayCount / maxUploadsToday) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Camera className="w-5 h-5 text-[#0f5d2f]" />
              Upload Today's Photo
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              High quality photos of scenery, business, nature, culture, or daily life in Uganda.
            </p>
          </div>
          <div className="text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl self-start sm:self-auto">
            Remaining today: <span className="font-bold text-[#0f5d2f]">{remainingToday}</span> / {maxUploadsToday}
          </div>
        </div>

        {/* Free Trial Limit Warning Notice */}
        {isFreeTrial && isFreeTrialExhausted && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-amber-900">
                  You're done with today photos! No more uploading.
                </h4>
                <p className="text-xs text-amber-800 mt-0.5">
                  You used 1/1 free trial photo. Buy a package to unlock 5 uploads daily.
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/packages')}
              className="px-4 py-2 bg-[#0f5d2f] hover:bg-[#0c4a25] text-white text-xs font-bold rounded-xl shadow transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              Upgrade to VIP
            </button>
          </div>
        )}

        {/* VIP Limit Warning Notice */}
        {!isFreeTrial && isVipExhausted && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#0f5d2f] shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-sm text-emerald-950">
                You're done with today photos! No more uploading today.
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Come back tomorrow. You uploaded 5/5 daily limit for your VIP package.
              </p>
            </div>
          </div>
        )}

        {/* Upload Form (Active when not disabled) */}
        {!isUploadDisabled ? (
          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
              id="photo-file-upload"
            />

            {!previewUrl ? (
              <label
                htmlFor="photo-file-upload"
                className="cursor-pointer border-2 border-dashed border-emerald-300 hover:border-[#0f5d2f] bg-emerald-50/40 hover:bg-emerald-50/80 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all group"
              >
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center text-[#0f5d2f] group-hover:scale-110 transition-transform mb-3 border border-emerald-100">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-gray-900">
                  Click or drag photo here to upload
                </h4>
                <p className="text-xs text-gray-500 mt-1">
                  Supports PNG, JPG, WEBP (Max 10MB)
                </p>
                <div className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0f5d2f] bg-emerald-100/70 px-3 py-1 rounded-lg">
                  <Sparkles className="w-3.5 h-3.5" />
                  Earning rate: {currentPkg ? formatUGX(currentPkg.per_photo) : formatUGX(FREE_TRIAL_EARN_RATE)} on approval
                </div>
              </label>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-black/5 max-h-72 flex items-center justify-center">
                  <img
                    src={previewUrl}
                    alt="Upload Preview"
                    className="max-h-72 w-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute top-3 right-3 bg-red-600/90 hover:bg-red-700 text-white p-1.5 rounded-xl shadow-md transition-colors"
                    title="Remove Photo"
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Photo Title / Location (Optional)
                  </label>
                  <input
                    type="text"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="e.g. Jinja Nile Sunset, Kampala Owino Market"
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#0f5d2f]"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 py-3 bg-[#0f5d2f] hover:bg-[#0c4a25] active:scale-95 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {uploading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>Submit Photo for {currentPkg ? formatUGX(currentPkg.per_photo) : formatUGX(FREE_TRIAL_EARN_RATE)} Earning</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl text-sm transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </form>
        ) : (
          <div className="border border-dashed border-gray-300 bg-gray-50 rounded-2xl p-6 text-center text-gray-500">
            <Camera className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <p className="text-sm font-semibold">Upload Button Disabled for Today</p>
            <p className="text-xs text-gray-400 mt-1">
              {isFreeTrial
                ? 'Free trial allows 1 photo. Upgrade to a VIP package for 5 daily uploads.'
                : 'You have reached your 5 daily uploads limit. Counter resets at midnight.'}
            </p>
          </div>
        )}
      </div>

      {/* Recent Photos List: Pending / Approved / Rejected with Earning */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-emerald-100 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Your Photo Submissions</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Review history of uploaded photos and earned UGX credits
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              All ({photos.length})
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === 'pending' ? 'bg-amber-100 text-amber-900 font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Pending ({photos.filter(p => p.status === 'pending').length})
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === 'approved' ? 'bg-emerald-100 text-[#0f5d2f] font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Approved ({photos.filter(p => p.status === 'approved').length})
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filter === 'rejected' ? 'bg-red-100 text-red-900 font-bold' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Rejected ({photos.filter(p => p.status === 'rejected').length})
            </button>
          </div>
        </div>

        {filteredPhotos.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
            <ImageIcon className="w-10 h-10 mx-auto text-gray-300 mb-2" />
            <p className="text-sm font-semibold text-gray-600">No photos in this view</p>
            <p className="text-xs text-gray-400 mt-1">Upload your daily photos to start earning UGX</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPhotos.map((photo) => (
              <div
                key={photo.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="relative aspect-video bg-gray-100 overflow-hidden">
                  <img
                    src={photo.image_url}
                    alt={photo.caption || 'Photo'}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* Status badge */}
                  <div className="absolute top-2.5 right-2.5">
                    {photo.status === 'pending' && (
                      <span className="inline-flex items-center gap-1 bg-amber-500/95 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                        <Clock className="w-3 h-3" />
                        Pending Review
                      </span>
                    )}
                    {photo.status === 'approved' && (
                      <span className="inline-flex items-center gap-1 bg-[#0f5d2f]/95 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                        <CheckCircle2 className="w-3 h-3" />
                        Approved +{formatUGX(photo.earning_amount)}
                      </span>
                    )}
                    {photo.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 bg-red-600/95 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
                        <XCircle className="w-3 h-3" />
                        Rejected
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 truncate">
                      {photo.caption || 'Daily Upload'}
                    </h4>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {new Date(photo.created_at).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                    <span className="text-gray-500">Earnings Credited:</span>
                    <span
                      className={`font-bold ${
                        photo.status === 'approved'
                          ? 'text-[#0f5d2f]'
                          : photo.status === 'pending'
                          ? 'text-amber-600'
                          : 'text-gray-400'
                      }`}
                    >
                      {photo.status === 'approved'
                        ? formatUGX(photo.earning_amount)
                        : photo.status === 'pending'
                        ? 'Pending'
                        : '0 UGX'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
