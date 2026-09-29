import React, { useState } from 'react';
import {
  Shield,
  X,
  Link as LinkIcon,
  Globe,
  Youtube,
  Facebook,
  Mail,
  Star,
  Clock,
  Send,
  CheckCircle2,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { AdminLinks } from '../types';
import { DEFAULT_ADMIN_LINKS, saveAdminLinks } from '../utils/adminManager';

interface AdminPanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminLinks: AdminLinks;
  onUpdateAdminLinks: (links: AdminLinks) => void;
}

export const AdminPanelModal: React.FC<AdminPanelModalProps> = ({
  isOpen,
  onClose,
  adminLinks,
  onUpdateAdminLinks,
}) => {
  const [formData, setFormData] = useState<AdminLinks>(adminLinks);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleChange = (key: keyof AdminLinks, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveAdminLinks(formData);
    onUpdateAdminLinks(formData);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    setFormData(DEFAULT_ADMIN_LINKS);
    saveAdminLinks(DEFAULT_ADMIN_LINKS);
    onUpdateAdminLinks(DEFAULT_ADMIN_LINKS);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#101522] border-2 border-[#FF0000]/60 rounded-2xl max-w-2xl w-full p-6 text-white shadow-[0_0_35px_rgba(255,0,0,0.3)] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#1e273a] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1d1017] border border-[#FF0000] flex items-center justify-center text-[#FF1A1A] shadow-[0_0_12px_rgba(255,0,0,0.4)]">
              <Shield className="w-5 h-5 text-[#FF1A1A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-wide">
                  ADMIN CONTROL PANEL
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-[#FF0000] text-white">
                  ROOT ADMIN
                </span>
              </div>
              <p className="text-xs text-slate-200 font-bold">
                Configure navigation links, external URLs, and generation engine settings.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs font-bold">
          {savedSuccess && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500 rounded-xl flex items-center gap-2 text-white">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>Links and admin settings saved successfully! All buttons updated.</span>
            </div>
          )}

          {/* Site Name Branding */}
          <div className="bg-[#0b0f17] border border-[#1e273a] rounded-xl p-3.5 space-y-2">
            <label className="flex items-center gap-2 text-white font-black text-xs">
              <Globe className="w-4 h-4 text-[#FF1A1A]" />
              Site Name / Branding Title
            </label>
            <input
              type="text"
              value={formData.siteName}
              onChange={(e) => handleChange('siteName', e.target.value)}
              placeholder="SS SMART META 2"
              className="w-full bg-[#101522] border border-[#222c42] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-[#FF0000] focus:outline-hidden font-bold"
            />
          </div>

          {/* Header Navigation Links */}
          <div className="bg-[#0b0f17] border border-[#1e273a] rounded-xl p-3.5 space-y-3">
            <h4 className="text-xs font-black text-white flex items-center gap-2 border-b border-[#1b2234] pb-2">
              <LinkIcon className="w-4 h-4 text-[#FF1A1A]" />
              Navigation & External Link Settings
            </h4>

            {/* Follow Page Link */}
            <div>
              <label className="flex items-center justify-between text-slate-200 mb-1">
                <span className="flex items-center gap-1.5">
                  <Facebook className="w-3.5 h-3.5 text-[#1877F2]" />
                  Follow Page URL (Facebook / Social)
                </span>
                <span className="text-[10px] text-slate-400">Linked to 'Follow Page' button</span>
              </label>
              <input
                type="url"
                value={formData.followPageUrl}
                onChange={(e) => handleChange('followPageUrl', e.target.value)}
                placeholder="https://facebook.com/yourpage"
                className="w-full bg-[#101522] border border-[#222c42] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-[#FF0000] focus:outline-hidden font-mono text-[11px]"
              />
            </div>

            {/* Tutorial Link */}
            <div>
              <label className="flex items-center justify-between text-slate-200 mb-1">
                <span className="flex items-center gap-1.5">
                  <Youtube className="w-3.5 h-3.5 text-red-500" />
                  Tutorial Video URL (YouTube / Guide)
                </span>
                <span className="text-[10px] text-slate-400">Linked to 'Tutorial' button</span>
              </label>
              <input
                type="url"
                value={formData.tutorialUrl}
                onChange={(e) => handleChange('tutorialUrl', e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full bg-[#101522] border border-[#222c42] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-[#FF0000] focus:outline-hidden font-mono text-[11px]"
              />
            </div>

            {/* Contact Email / URL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-slate-200 mb-1">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  Support Email Address
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  placeholder="support@thikanatech.com"
                  className="w-full bg-[#101522] border border-[#222c42] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-[#FF0000] focus:outline-hidden font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-slate-200 mb-1">
                  <Send className="w-3.5 h-3.5 text-sky-400" />
                  Support Direct Chat (Telegram / WhatsApp)
                </label>
                <input
                  type="text"
                  value={formData.contactUrl}
                  onChange={(e) => handleChange('contactUrl', e.target.value)}
                  placeholder="https://t.me/thikanatech"
                  className="w-full bg-[#101522] border border-[#222c42] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-[#FF0000] focus:outline-hidden font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Upgrade & Unlimited Links */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-slate-200 mb-1">
                  <Star className="w-3.5 h-3.5 text-amber-400" />
                  Upgrade to Ultra Target Link
                </label>
                <input
                  type="text"
                  value={formData.upgradeUrl}
                  onChange={(e) => handleChange('upgradeUrl', e.target.value)}
                  placeholder="https://yourshop.com/upgrade"
                  className="w-full bg-[#101522] border border-[#222c42] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-[#FF0000] focus:outline-hidden font-mono text-[11px]"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-slate-200 mb-1">
                  <Clock className="w-3.5 h-3.5 text-[#FF1A1A]" />
                  Unlimited Tier Target Link
                </label>
                <input
                  type="text"
                  value={formData.unlimitedUrl}
                  onChange={(e) => handleChange('unlimitedUrl', e.target.value)}
                  placeholder="https://yourshop.com/unlimited"
                  className="w-full bg-[#101522] border border-[#222c42] rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:border-[#FF0000] focus:outline-hidden font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Engine Mode */}
          <div className="bg-[#0b0f17] border border-[#1e273a] rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#FF0000]/15 flex items-center justify-center text-[#FF1A1A]">
                <Zap className="w-4 h-4 text-[#FF1A1A]" />
              </div>
              <div>
                <span className="text-xs font-black text-white">Ultra-Fast Zero-Error Engine</span>
                <p className="text-[11px] text-slate-300">
                  Instant stock metadata synthesis with zero rate-limit errors and instant throughput.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.fastGenerationSpeed}
                onChange={(e) => handleChange('fastGenerationSpeed', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF0000]" />
            </label>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#1e273a]">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#121826] hover:bg-[#1a2336] text-slate-300 hover:text-white text-xs font-bold rounded-xl cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-[#121826] hover:bg-[#1a2336] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-6 py-2 btn-red-gradient text-white text-xs font-black rounded-xl cursor-pointer shadow-[0_0_15px_rgba(255,0,0,0.5)]"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save All Links</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
