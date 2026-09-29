import React, { useState } from 'react';
import { X, CheckCircle2, User, Mail, ShieldCheck, LogOut, Sparkles } from 'lucide-react';
import { UserProfile } from '../types';

interface GoogleLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onLogin: (user: UserProfile) => void;
  onLogout: () => void;
}

export const GoogleLoginModal: React.FC<GoogleLoginModalProps> = ({
  isOpen,
  onClose,
  user,
  onLogin,
  onLogout,
}) => {
  const [emailInput, setEmailInput] = useState(user.email || 'shamimrezkk@gmail.com');
  const [nameInput, setNameInput] = useState(user.name || 'Shamim Reza');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const newUser: UserProfile = {
        name: nameInput.trim() || 'Shamim Reza',
        email: emailInput.trim() || 'shamimrezkk@gmail.com',
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(emailInput)}`,
        isLoggedIn: true,
        plan: 'Pro',
      };
      onLogin(newUser);
      setIsProcessing(false);
      setLoginSuccess(true);
      setTimeout(() => {
        setLoginSuccess(false);
        onClose();
      }, 1000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#101522] border-2 border-[#FF0000]/60 rounded-2xl max-w-md w-full p-6 text-white shadow-[0_0_35px_rgba(255,0,0,0.3)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1e273a] mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#1a1218] border border-[#FF0000] flex items-center justify-center text-[#FF1A1A]">
              <Mail className="w-5 h-5 text-[#FF1A1A]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Gmail / Google Sign In</h3>
              <p className="text-[11px] text-slate-200 font-bold">
                SS SMART META 2 Contributor Account
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {user.isLoggedIn ? (
          /* Already Logged In View */
          <div className="space-y-4">
            <div className="bg-[#0b0f17] border border-[#1e273a] rounded-xl p-4 flex items-center gap-3.5">
              <div className="relative">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-12 h-12 rounded-full border-2 border-[#FF0000] bg-slate-800 p-0.5"
                />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0b0f17]" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-black text-white">{user.name}</h4>
                  <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#FF0000] text-white">
                    PRO CONTRIBUTOR
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-mono">{user.email}</p>
              </div>
            </div>

            <div className="p-3 bg-[#151c2c] border border-[#202c42] rounded-xl space-y-2 text-xs font-bold text-slate-200">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Google Account Connected</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Your API keys, metadata presets, and in-place folder permissions are securely synchronized.
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onLogout}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#221016] hover:bg-[#331420] text-[#FF4D4D] text-xs font-bold rounded-xl cursor-pointer border border-[#FF0000]/40 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 btn-red-gradient text-white text-xs font-black rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          /* Sign In View */
          <div className="space-y-4 text-xs font-bold">
            {loginSuccess && (
              <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl flex items-center gap-2 text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Signed in successfully with Gmail!</span>
              </div>
            )}

            <p className="text-slate-200">
              Sign in with your Google / Gmail account to save multiple API keys, configure stock platforms, and sync settings.
            </p>

            {/* Official style Google Sign In Button */}
            <button
              type="button"
              disabled={isProcessing}
              onClick={handleGoogleSignIn}
              className="w-full py-3 px-4 bg-white hover:bg-slate-100 text-slate-900 rounded-xl flex items-center justify-center gap-3 font-black text-sm shadow-[0_4px_14px_rgba(0,0,0,0.4)] transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isProcessing ? 'Connecting to Google...' : 'Sign in with Google'}</span>
            </button>

            <div className="relative flex py-1 items-center">
              <div className="grow border-t border-[#1e273a]"></div>
              <span className="shrink mx-3 text-slate-400 text-[11px] font-bold">OR CONFIRM GMAIL DETAILS</span>
              <div className="grow border-t border-[#1e273a]"></div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-slate-200 mb-1">Gmail Address</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full bg-[#0b0f17] border border-[#1e273a] rounded-lg px-3 py-2 text-white focus:border-[#FF0000] focus:outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="block text-slate-200 mb-1">Display Name</label>
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Shamim Reza"
                  className="w-full bg-[#0b0f17] border border-[#1e273a] rounded-lg px-3 py-2 text-white focus:border-[#FF0000] focus:outline-hidden font-bold"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#121826] hover:bg-[#1a2336] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="px-5 py-2 btn-red-gradient text-white text-xs font-black rounded-xl cursor-pointer shadow-[0_0_12px_rgba(255,0,0,0.4)]"
              >
                Sign In with Gmail
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
