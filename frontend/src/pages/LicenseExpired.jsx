import React from 'react';
import { ShieldExclamationIcon, CreditCardIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

const LicenseExpired = () => {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 font-sans selection:bg-rose-500/30">
      <div className="max-w-md w-full animate-in fade-in zoom-in duration-700">
        <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-black/50 text-center relative overflow-hidden">
          
          {/* Decorative Background Glow */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-rose-500/10 blur-[80px] rounded-full"></div>
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-primary-500/10 blur-[80px] rounded-full"></div>

          <div className="relative z-10">
            <div className="w-20 h-20 bg-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-rose-500/30">
              <ShieldExclamationIcon className="w-10 h-10 animate-pulse" />
            </div>

            <h1 className="text-3xl font-black text-white tracking-tight mb-4 uppercase">
              License <span className="text-rose-500">Expired</span>
            </h1>
            
            <p className="text-slate-400 font-bold leading-relaxed mb-10 text-sm">
              Your annual subscription has concluded. Access to the management suite is restricted until renewal is processed.
            </p>

            <div className="space-y-4">
              <button 
                onClick={() => window.location.reload()}
                className="w-full bg-white text-slate-900 h-14 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl"
              >
                <CreditCardIcon className="w-5 h-5" />
                Renew Subscription
              </button>
              
              <a 
                href="mailto:support@yourdomain.com"
                className="w-full bg-slate-700/50 text-slate-300 h-14 rounded-2xl font-black uppercase tracking-widest text-xs border border-slate-600 hover:bg-slate-700 transition-all flex items-center justify-center gap-3"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                Contact Developer
              </a>
            </div>

            <p className="mt-12 text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]">
              Product of <span className="text-primary-500">Virtual Tech Solution</span>
            </p>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          Hardware ID: {window.navigator.userAgent.substring(0, 20).replace(/[^a-zA-Z0-9]/g, '').toUpperCase()}
        </p>
      </div>
    </div>
  );
};

export default LicenseExpired;
