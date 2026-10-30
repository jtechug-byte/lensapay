import React, { useEffect, useState } from 'react';
import { Download, X, Smartphone, CheckCircle2, Share, PlusSquare, ArrowRight } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallAppModalProps {
  isLoggedIn: boolean;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({ isLoggedIn }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showIOSSteps, setShowIOSSteps] = useState(false);

  useEffect(() => {
    // Check if already running as standalone PWA
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      localStorage.getItem('lensapay_pwa_installed') === 'true';

    setIsInstalled(isStandalone);

    // Detect iOS
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua);
    setIsIOS(isIOSDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsOpen(false);
      localStorage.setItem('lensapay_pwa_installed', 'true');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Show download modal after login only if not already installed and not dismissed in this session
    if (isLoggedIn && !isStandalone) {
      const dismissed = sessionStorage.getItem('lensapay_pwa_modal_dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => {
          setIsOpen(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isLoggedIn]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
        localStorage.setItem('lensapay_pwa_installed', 'true');
        setIsOpen(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSSteps(true);
    } else {
      // General fallback instructions for Android / Desktop Chrome
      alert('To install, tap your browser menu (⋮) and select "Add to Home screen" or "Install App".');
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    setIsOpen(false);
    sessionStorage.setItem('lensapay_pwa_modal_dismissed', 'true');
  };

  if (!isOpen || isInstalled) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-emerald-100 p-6 space-y-5 animate-in zoom-in-95 duration-200 relative">
        {/* Close Button */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          title="Maybe Later"
        >
          <X className="w-5 h-5" />
        </button>

        {/* App Icon & Camera Lens */}
        <div className="text-center pt-2">
          <div className="relative inline-block">
            <img
              src="/icon-512.png"
              alt="LensaPay App Icon"
              className="w-20 h-20 rounded-2xl shadow-xl shadow-emerald-900/20 mx-auto object-cover border border-emerald-100"
            />
            {/* Camera lens badge 📷 */}
            <div className="absolute -bottom-2 -right-2 bg-white text-emerald-800 p-1.5 rounded-full shadow-md border border-emerald-100 text-sm">
              📷
            </div>
          </div>

          <h3 className="text-xl font-extrabold text-gray-900 mt-4 tracking-tight">
            LensaPay Uganda
          </h3>
          {/* Required slogan text */}
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#0CA651] px-3 py-1 rounded-full text-xs font-bold mt-1.5">
            <span>📷</span>
            <span>Snap, Sell, Get Paid</span>
          </div>
          <p className="text-xs text-gray-500 mt-2 px-2 leading-relaxed">
            Install LensaPay on your device for instant photo uploads, VIP notifications, and faster Mobile Money cashouts!
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 text-xs border border-gray-100">
          <div className="flex items-center gap-2 text-gray-700">
            <CheckCircle2 className="w-4 h-4 text-[#0CA651] shrink-0" />
            <span>Fast 1-tap home screen access</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <CheckCircle2 className="w-4 h-4 text-[#0CA651] shrink-0" />
            <span>Daily 5/5 photo upload reminders</span>
          </div>
          <div className="flex items-center gap-2 text-gray-700">
            <CheckCircle2 className="w-4 h-4 text-[#0CA651] shrink-0" />
            <span>Instant MTN & Airtel MoMo alerts</span>
          </div>
        </div>

        {/* iOS Step-by-Step Instructions if on Safari */}
        {showIOSSteps ? (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-2 text-amber-950">
            <h4 className="font-bold flex items-center gap-1.5 text-amber-900">
              <Smartphone className="w-4 h-4 text-amber-700" />
              How to Install on iPhone / iPad:
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-gray-700 pt-1">
              <li>Tap the <Share className="w-3.5 h-3.5 inline mx-1 text-blue-600" /> <strong>Share</strong> button at bottom of Safari.</li>
              <li>Scroll down and tap <PlusSquare className="w-3.5 h-3.5 inline mx-1 text-gray-700" /> <strong>Add to Home Screen</strong>.</li>
              <li>Tap <strong>Add</strong> in top-right corner.</li>
            </ol>
            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-2 py-2.5 bg-gray-900 text-white font-bold rounded-xl text-xs hover:bg-black transition-colors"
            >
              Got It
            </button>
          </div>
        ) : (
          <div className="space-y-2 pt-1">
            <button
              onClick={handleInstallClick}
              className="w-full py-3.5 px-4 bg-[#0CA651] hover:bg-[#0a8b43] active:scale-[0.98] text-white font-bold rounded-xl shadow-lg shadow-emerald-900/15 flex items-center justify-center gap-2 text-sm transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download & Install App</span>
            </button>

            <button
              onClick={handleDismiss}
              className="w-full py-2.5 text-xs text-gray-500 hover:text-gray-800 font-semibold transition-colors"
            >
              Continue in Browser
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
