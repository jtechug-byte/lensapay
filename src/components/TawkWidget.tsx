import React, { useEffect, useState } from 'react';
import { MessageSquare, X, Send, Bot, User, CheckCircle2, Phone, ShieldCheck } from 'lucide-react';

interface TawkWidgetProps {
  currentPath: string;
}

export const TawkWidget: React.FC<TawkWidgetProps> = ({ currentPath }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{ sender: 'support' | 'user'; text: string; time: string }[]>([
    {
      sender: 'support',
      text: 'Oli otya! Welcome to LensaPay Uganda Community Support. Need help with daily uploads, VIP package activation, or MTN/Airtel MoMo payouts?',
      time: 'Just now'
    }
  ]);
  const [inputVal, setInputVal] = useState('');

  // Check if current route is admin or boss-terminal
  const isAdmin = currentPath.startsWith('/admin') || currentPath.startsWith('/boss-terminal');

  useEffect(() => {
    // If admin route, do not load or hide widget
    if (isAdmin) {
      if ((window as any).Tawk_API?.hideWidget) {
        (window as any).Tawk_API.hideWidget();
      }
      return;
    }

    // Embed official Tawk.to script with user's property ID
    const propertyId = import.meta.env.VITE_TAWK_PROPERTY_ID || '6ae372ef7413b83475c3fdcb';
    const tawkId = import.meta.env.VITE_TAWK_ID || 'default';

    if (!document.getElementById('tawk-script')) {
      const s1 = document.createElement('script');
      s1.id = 'tawk-script';
      s1.async = true;
      s1.src = `https://embed.tawk.to/${propertyId}/${tawkId}`;
      s1.charset = 'UTF-8';
      s1.setAttribute('crossorigin', '*');
      document.body.appendChild(s1);

      (window as any).Tawk_API = (window as any).Tawk_API || {};
      (window as any).Tawk_API.customStyle = {
        theme: {
          primaryColor: '#0f5d2f'
        }
      };
      (window as any).Tawk_API.onLoad = function () {
        if ((window as any).Tawk_API?.setAttributes) {
          (window as any).Tawk_API.setAttributes({ name: 'LensaPay User' }, function () {});
        }
      };
    } else if ((window as any).Tawk_API?.showWidget) {
      (window as any).Tawk_API.showWidget();
    }
  }, [isAdmin]);

  if (isAdmin) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const userText = inputVal.trim();
    const newMsg = {
      sender: 'user' as const,
      text: userText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputVal('');

    // Instant intelligent Ugandan MoMo support assistant
    setTimeout(() => {
      let reply = 'Thank you for reaching out to LensaPay Uganda. An agent is reviewing your query.';
      const lower = userText.toLowerCase();

      if (lower.includes('package') || lower.includes('vip') || lower.includes('upgrade')) {
        reply = 'VIP packages allow up to 5 photo uploads daily with 60-day ROI! You can upgrade anytime via MTN or Airtel MoMo in the VIP Packages tab.';
      } else if (lower.includes('withdraw') || lower.includes('money') || lower.includes('cashout') || lower.includes('balance')) {
        reply = 'Withdrawals are processed within 1-6 hours directly to your registered MTN or Airtel phone number. Minimum withdrawal is 5,000 UGX.';
      } else if (lower.includes('approve') || lower.includes('pending') || lower.includes('payment') || lower.includes('screenshot')) {
        reply = 'Payments to TAKIA NAMUDDU (0791388644) are reviewed within 5-15 minutes once your transaction ID and screenshot are submitted!';
      } else if (lower.includes('photo') || lower.includes('upload') || lower.includes('limit')) {
        reply = 'Free trial users can upload 1 photo to test earning. VIP package holders can upload up to 5 high quality photos daily!';
      }

      setMessages(prev => [
        ...prev,
        {
          sender: 'support',
          text: reply,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 800);
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 print:hidden">
      {/* Support Chat Modal */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col transition-all duration-200">
          {/* Header */}
          <div className="bg-[#0f5d2f] text-white p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-emerald-700 border-2 border-white/20 flex items-center justify-center font-bold">
                  LP
                </div>
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#0f5d2f] rounded-full" />
              </div>
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-1.5">
                  LensaPay Support
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                </h4>
                <p className="text-xs text-emerald-100">Uganda Live Community Support</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Notice */}
          <div className="bg-emerald-50 px-3 py-2 border-b border-emerald-100 flex items-center justify-between text-xs text-emerald-900">
            <span className="flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-emerald-700" />
              MoMo Admin: 0791388644
            </span>
            <span className="font-semibold text-[#0f5d2f]">Online 24/7</span>
          </div>

          {/* Messages list */}
          <div className="p-4 h-64 overflow-y-auto space-y-3 bg-slate-50 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'support' && (
                  <div className="w-6 h-6 rounded-full bg-[#0f5d2f] text-white flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                    LP
                  </div>
                )}
                <div
                  className={`p-2.5 rounded-xl max-w-[80%] leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-[#0f5d2f] text-white rounded-br-none'
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-xs'
                  }`}
                >
                  <p>{m.text}</p>
                  <span
                    className={`block text-[9px] mt-1 text-right ${
                      m.sender === 'user' ? 'text-emerald-100' : 'text-gray-400'
                    }`}
                  >
                    {m.time}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-2.5 bg-white border-t border-gray-100 flex gap-2">
            <input
              type="text"
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              placeholder="Ask support a question..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#0f5d2f] focus:ring-1 focus:ring-[#0f5d2f]"
            />
            <button
              type="submit"
              className="bg-[#0f5d2f] hover:bg-[#0c4a25] text-white p-2 rounded-xl transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#0f5d2f] hover:bg-[#0c4a25] text-white px-4 py-3 rounded-full shadow-lg hover:shadow-xl transition-all transform active:scale-95 border-2 border-white/20"
      >
        <MessageSquare className="w-5 h-5" />
        <span className="text-sm font-semibold hidden sm:inline">Live Support</span>
        <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
      </button>
    </div>
  );
};
