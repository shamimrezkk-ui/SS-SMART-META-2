import React, { useState } from 'react';
import {
  Clock,
  Star,
  Facebook,
  HelpCircle,
  Mail,
  Shield,
  LogIn,
  CheckCircle,
  Sparkles,
  Send,
  ExternalLink,
  ShieldCheck,
  UserCheck,
} from 'lucide-react';
import { AdminLinks, UserProfile } from '../types';
import { GoogleLoginModal } from './GoogleLoginModal';

interface HeaderProps {
  onOpenTutorial: () => void;
  aiActive: boolean;
  onToggleAi: () => void;
  onOpenAdminPanel: () => void;
  adminLinks: AdminLinks;
  user: UserProfile;
  onUpdateUser: (user: UserProfile) => void;
  onLogoutUser: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenTutorial,
  aiActive,
  onToggleAi,
  onOpenAdminPanel,
  adminLinks,
  user,
  onUpdateUser,
  onLogoutUser,
}) => {
  const [showUnlimitedModal, setShowUnlimitedModal] = useState(false);
  const [showUltraModal, setShowUltraModal] = useState(false);
  const [showFollowModal, setShowFollowModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState(user.name || '');
  const [contactEmail, setContactEmail] = useState(user.email || '');
  const [contactMsg, setContactMsg] = useState('');
  const [contactSent, setContactSent] = useState(false);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactEmail.trim() || !contactMsg.trim()) return;
    setContactSent(true);
    setTimeout(() => {
      setContactSent(false);
      setShowContactModal(false);
      setContactMsg('');
    }, 2000);
  };

  const handleFollowClick = () => {
    if (adminLinks.followPageUrl && adminLinks.followPageUrl.startsWith('http')) {
      window.open(adminLinks.followPageUrl, '_blank', 'noopener,noreferrer');
    } else {
      setShowFollowModal(true);
    }
  };

  const handleTutorialClick = () => {
    if (adminLinks.tutorialUrl && adminLinks.tutorialUrl.startsWith('http')) {
      window.open(adminLinks.tutorialUrl, '_blank', 'noopener,noreferrer');
    } else {
      onOpenTutorial();
    }
  };

  const handleUpgradeClick = () => {
    if (adminLinks.upgradeUrl && adminLinks.upgradeUrl.startsWith('http') && !adminLinks.upgradeUrl.includes('thikanatech.com/upgrade')) {
      window.open(adminLinks.upgradeUrl, '_blank', 'noopener,noreferrer');
    } else {
      setShowUltraModal(true);
    }
  };

  const handleUnlimitedClick = () => {
    if (adminLinks.unlimitedUrl && adminLinks.unlimitedUrl.startsWith('http') && !adminLinks.unlimitedUrl.includes('thikanatech.com/unlimited')) {
      window.open(adminLinks.unlimitedUrl, '_blank', 'noopener,noreferrer');
    } else {
      setShowUnlimitedModal(true);
    }
  };

  return (
    <>
      <header className="w-full bg-[#0b0f17] border-b border-[#1b2234] px-4 py-2.5 flex items-center justify-between sticky top-0 z-30 select-none">
        {/* Left: SS SMART META 2 Logo & Title */}
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF0000] via-[#7A0000] to-[#121824] p-[2px] flex items-center justify-center shadow-[0_0_15px_rgba(255,0,0,0.6)]">
            <div className="w-full h-full rounded-full bg-[#0d121c] flex flex-col items-center justify-center">
              <span className="text-[10px] font-black tracking-tighter text-[#FF1A1A] leading-none">SS</span>
              <span className="text-[7px] font-extrabold tracking-widest text-white leading-none">META</span>
            </div>
          </div>
          <div className="flex items-center text-xl font-black tracking-wide">
            <span className="text-white drop-shadow-sm font-black">SS SMART</span>
            <span className="text-[#FF1A1A] ml-2 drop-shadow-[0_0_12px_rgba(255,0,0,0.85)] font-black">
              META 2
            </span>
          </div>
        </div>

        {/* Right Navigation & Action Items */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Unlimited Button */}
          <button
            type="button"
            onClick={handleUnlimitedClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-[#111726] border border-[#FF0000]/70 text-[#FF1A1A] shadow-[0_0_10px_rgba(255,0,0,0.25)] hover:shadow-[0_0_16px_rgba(255,0,0,0.5)] transition-all cursor-pointer"
          >
            <Clock className="w-3.5 h-3.5 text-[#FF1A1A]" />
            <span>∞ UNLIMITED</span>
          </button>

          {/* Upgrade to Ultra */}
          <button
            type="button"
            onClick={handleUpgradeClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black text-white btn-red-gradient shadow-[0_0_12px_rgba(255,0,0,0.4)] hover:shadow-[0_0_18px_rgba(255,0,0,0.6)] cursor-pointer"
          >
            <Star className="w-3.5 h-3.5 fill-white text-white" />
            <span>Upgrade to Ultra</span>
          </button>

          {/* Follow Page */}
          <button
            type="button"
            onClick={handleFollowClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#111622] hover:bg-[#182030] text-white border border-[#20293d] transition-colors cursor-pointer"
          >
            <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
            <span>Follow Page</span>
          </button>

          {/* Tutorial */}
          <button
            type="button"
            onClick={handleTutorialClick}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#111622] hover:bg-[#182030] text-white border border-[#20293d] transition-colors cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5 text-slate-300" />
            <span>Tutorial</span>
          </button>

          {/* Contact */}
          <button
            type="button"
            onClick={() => setShowContactModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold bg-[#111622] hover:bg-[#182030] text-white border border-[#20293d] transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-slate-300" />
            <span>Contact</span>
          </button>

          {/* Admin Panel Button */}
          <button
            type="button"
            onClick={onOpenAdminPanel}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-[#1a111a] hover:bg-[#251525] text-white border border-[#FF0000]/60 shadow-[0_0_8px_rgba(255,0,0,0.3)] transition-all cursor-pointer"
          >
            <Shield className="w-3.5 h-3.5 text-[#FF1A1A]" />
            <span>Admin Panel</span>
          </button>

          {/* AI ON / OFF Toggle */}
          <button
            type="button"
            onClick={onToggleAi}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              aiActive
                ? 'bg-[#181015] border-[#FF0000] text-[#FF1A1A] shadow-[0_0_10px_rgba(255,0,0,0.3)]'
                : 'bg-[#121620] border-[#222a3e] text-slate-200 hover:text-white'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                aiActive ? 'bg-[#FF1A1A] shadow-[0_0_6px_#FF0000]' : 'bg-slate-400'
              }`}
            />
            <span>{aiActive ? '• AI ON' : '• AI OFF'}</span>
          </button>

          {/* Log In / Sign Up (Gmail) */}
          <button
            type="button"
            onClick={() => setShowLoginModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#111622] hover:bg-[#182030] text-white border border-[#20293d] transition-colors cursor-pointer"
          >
            {user.isLoggedIn ? (
              <div className="flex items-center gap-1.5">
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-4 h-4 rounded-full border border-emerald-400"
                />
                <span className="text-emerald-400 font-bold truncate max-w-[120px]">
                  {user.email.split('@')[0]}
                </span>
              </div>
            ) : (
              <>
                <LogIn className="w-3.5 h-3.5 text-slate-300" />
                <span>Log In / Sign Up</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* 1. UNLIMITED MODAL */}
      {showUnlimitedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
          <div className="bg-[#101522] border-2 border-[#FF0000]/60 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-6 h-6 text-[#FF1A1A]" />
              <h3 className="text-base font-black text-white">SS SMART META 2 — Unlimited Engine</h3>
            </div>
            <p className="text-xs text-slate-200 font-bold mb-4 leading-relaxed">
              Your unlimited generation tier is fully enabled! You can process 10, 50, 100, or 200+ images with sequential anti-spam concurrency and multiple Gemini API keys rotation.
            </p>
            <div className="bg-[#0b0f17] p-3 rounded-xl border border-[#1e273a] text-xs space-y-2 mb-5">
              <div className="flex justify-between font-bold">
                <span className="text-slate-300">Daily Generation Limit:</span>
                <span className="text-emerald-400">UNLIMITED ∞</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-300">Batch Processing:</span>
                <span className="text-emerald-400">Enabled (1-by-1)</span>
              </div>
              <div className="flex justify-between font-bold">
                <span className="text-slate-300">Image to Prompt:</span>
                <span className="text-emerald-400">Ultra High-Res Active</span>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowUnlimitedModal(false)}
                className="px-5 py-2 btn-red-gradient text-white text-xs font-black rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. UPGRADE TO ULTRA MODAL */}
      {showUltraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
          <div className="bg-[#101522] border-2 border-[#FF0000]/60 rounded-2xl max-w-lg w-full p-6 text-white shadow-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-6 h-6 text-amber-400" />
              <h3 className="text-base font-black text-white">Upgrade to SS SMART ULTRA</h3>
            </div>
            <p className="text-xs text-slate-200 font-bold mb-4">
              Unlock enterprise stock automation, automated IPTC embedding, and unlimited multi-model prompt extractions.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-[#0b0f17] border border-[#1e273a] rounded-xl p-3.5 space-y-2">
                <span className="text-xs font-bold text-slate-300">Free Community</span>
                <div className="text-lg font-black text-white">$0 <span className="text-xs font-normal text-slate-400">/mo</span></div>
                <ul className="text-[11px] text-slate-300 font-bold space-y-1">
                  <li>✓ Standard Gemini API Keys</li>
                  <li>✓ 1-by-1 Sequential Queue</li>
                  <li>✓ Microstock CSV Export</li>
                </ul>
              </div>

              <div className="bg-[#191016] border-2 border-[#FF0000] rounded-xl p-3.5 space-y-2 shadow-[0_0_15px_rgba(255,0,0,0.3)]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-[#FF1A1A]">ULTRA PRO</span>
                  <span className="text-[9px] bg-[#FF0000] text-white px-1.5 py-0.5 rounded-sm font-black">ACTIVE</span>
                </div>
                <div className="text-lg font-black text-white">Lifetime Access</div>
                <ul className="text-[11px] text-slate-100 font-bold space-y-1">
                  <li>✓ Unlimited Multi-Key Rotation</li>
                  <li>✓ Folder Batch Image to Prompt</li>
                  <li>✓ Instant CSV & TXT Export</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowUltraModal(false)}
                className="px-4 py-2 bg-[#121826] hover:bg-[#1a2336] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Ultra Features are already activated in your current session!');
                  setShowUltraModal(false);
                }}
                className="px-5 py-2 btn-red-gradient text-white text-xs font-black rounded-xl cursor-pointer shadow-[0_0_12px_rgba(255,0,0,0.4)]"
              >
                Activate All Ultra Features
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. FOLLOW PAGE MODAL */}
      {showFollowModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
          <div className="bg-[#101522] border-2 border-[#FF0000]/60 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
            <h3 className="text-base font-black text-white mb-2 flex items-center gap-2">
              <Facebook className="w-5 h-5 text-[#1877F2]" />
              Follow SS SMART META 2 Official Page
            </h3>
            <p className="text-xs text-slate-200 font-bold mb-4">
              Join our community of professional stock photographers and AI contributors to get daily prompt recipes, keyword presets, and updates.
            </p>
            <div className="p-3 bg-[#0b0f17] border border-[#1e273a] rounded-xl flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-300 font-mono">
                {adminLinks.followPageUrl}
              </span>
              <a
                href={adminLinks.followPageUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-xs font-black text-[#FF1A1A] hover:underline"
              >
                <span>Visit</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowFollowModal(false)}
                className="px-5 py-2 btn-red-gradient text-white text-xs font-black rounded-xl cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. CONTACT MODAL */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
          <div className="bg-[#101522] border-2 border-[#FF0000]/60 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl">
            <h3 className="text-base font-black text-white mb-1 flex items-center gap-2">
              <Mail className="w-5 h-5 text-[#FF1A1A]" />
              Contact Developer & Support
            </h3>
            <p className="text-xs text-slate-200 font-bold mb-4">
              Have a suggestion, custom preset request, or question? Send a message directly below.
            </p>

            {contactSent ? (
              <div className="p-6 bg-emerald-950/60 border border-emerald-500 rounded-xl text-center space-y-2 mb-4">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-sm font-black text-white">Message Sent Successfully!</h4>
                <p className="text-xs text-slate-200 font-bold">We will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="space-y-3 mb-4 text-xs font-bold">
                <div>
                  <label className="block text-slate-200 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-[#0b0f17] border border-[#1e273a] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-[#FF0000] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-200 mb-1">Your Email</label>
                  <input
                    type="email"
                    required
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full bg-[#0b0f17] border border-[#1e273a] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-[#FF0000] focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-200 mb-1">Message</label>
                  <textarea
                    rows={3}
                    required
                    value={contactMsg}
                    onChange={(e) => setContactMsg(e.target.value)}
                    placeholder="Type your message or request..."
                    className="w-full bg-[#0b0f17] border border-[#1e273a] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-[#FF0000] focus:outline-hidden resize-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowContactModal(false)}
                    className="px-4 py-2 bg-[#121826] hover:bg-[#1a2336] text-white text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 btn-red-gradient text-white text-xs font-black rounded-xl cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Message</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 5. GMAIL / GOOGLE SIGN IN MODAL */}
      <GoogleLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        user={user}
        onLogin={onUpdateUser}
        onLogout={onLogoutUser}
      />
    </>
  );
};
