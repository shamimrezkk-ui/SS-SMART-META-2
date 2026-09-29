import React from 'react';
import { X, HelpCircle, Key, Layers, FileSpreadsheet, ShieldAlert, Cpu } from 'lucide-react';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#101522] border border-[#20293d] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1b2234] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#FF1A1A]" />
            <h2 className="text-base font-bold text-white">
              THIKANA TECH — Guide & Documentation
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#192233] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-white overflow-y-auto">
          {/* Section 1: Sequential 1-by-1 Queue */}
          <div className="bg-[#0b0f17] border border-[#1e273a] rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-black text-sm">
              <Cpu className="w-4 h-4 text-[#FF1A1A]" />
              <span>Sequential 1-by-1 Processing (Anti-Spam & Rate-Limit Safe)</span>
            </div>
            <p className="text-slate-100 font-bold leading-relaxed">
              When processing large batches (e.g. 10, 50, 100, or 200+ images), the application processes strictly <strong>one image at a time</strong>. This guarantees your browser UI stays perfectly responsive, avoids rate-limit bans, and lets you view and edit generated metadata simultaneously.
            </p>
          </div>

          {/* Section 2: Multi-API Key Support & Rotation */}
          <div className="bg-[#0b0f17] border border-[#1e273a] rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-black text-sm">
              <Key className="w-4 h-4 text-[#FF1A1A]" />
              <span>Multiple Gemini API Keys & Automatic Failover</span>
            </div>
            <p className="text-slate-100 font-bold leading-relaxed">
              In <strong>API Keys &gt; Configure</strong>, you can add multiple Gemini API keys. The queue automatically rotates 1-by-1 sequentially across your keys. If a key hits temporary 429 quota limits, it smoothly switches to the next available key without pausing the batch.
            </p>
          </div>

          {/* Section 3: Microstock Standards */}
          <div className="bg-[#0b0f17] border border-[#1e273a] rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-black text-sm">
              <FileSpreadsheet className="w-4 h-4 text-[#FF1A1A]" />
              <span>Platform CSV Specifications</span>
            </div>
            <p className="text-slate-100 font-bold leading-relaxed">
              Export exact microstock dashboard schemas for <strong>Adobe Stock</strong>, <strong>Shutterstock</strong>, <strong>Freepik</strong>, <strong>Vecteezy</strong>, <strong>Depositphotos</strong>, <strong>123RF</strong>, <strong>iStock</strong>, and more. Use <em>Preview CSV</em> to audit column formats before exporting.
            </p>
          </div>

          {/* Section 4: Commercial Quality Rules */}
          <div className="bg-[#0b0f17] border border-[#1e273a] rounded-xl p-3.5 space-y-1.5">
            <div className="flex items-center gap-2 text-white font-black text-sm">
              <Layers className="w-4 h-4 text-[#FF1A1A]" />
              <span>Keyword & Title Length Settings</span>
            </div>
            <p className="text-slate-100 font-bold leading-relaxed">
              Use the sidebar sliders to control minimum and maximum title lengths and keyword counts. Turn on <em>Single-Word Keywords</em> for maximum indexing performance on agency search algorithms.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#1b2234] bg-[#0c1017] flex items-center justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-black text-white btn-red-gradient cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
