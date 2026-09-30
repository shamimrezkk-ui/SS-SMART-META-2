import React, { useState } from 'react';
import { Download, Box, X, Folder, ChevronDown } from 'lucide-react';

interface CountersBarProps {
  successCount: number;
  processingCount: number;
  failedCount: number;
  formatFilter: string;
  onFormatFilterChange: (format: string) => void;
  onDownloadAllCsv: () => void;
  onEmbedMetadata: () => void;
  onClearAll: () => void;
  totalCount: number;
}

export const CountersBar: React.FC<CountersBarProps> = ({
  successCount,
  processingCount,
  failedCount,
  formatFilter,
  onFormatFilterChange,
  onDownloadAllCsv,
  onEmbedMetadata,
  onClearAll,
  totalCount,
}) => {
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);

  const pad = (n: number) => n.toString().padStart(2, '0');
  const formats = ['All Formats', 'JPG', 'PNG', 'WEBP', 'TIFF', 'SVG'];

  return (
    <div className="w-full bg-[#101522] border-2 border-[#2b3a56] rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-md select-none">
      {/* Left: Badge & Counters with Sharp Borders */}
      <div className="flex items-center gap-2.5 flex-wrap">
        <span className="px-3.5 py-1.5 rounded-xl bg-[#0b0f17] border-2 border-[#384a6b] text-xs font-black tracking-wider text-white uppercase shadow-xs">
          GENERATED DATA
        </span>

        {/* Success Counter */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0b0f17] border-2 border-emerald-500/80 text-xs font-black text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.2)]">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
          <span>SUCCESS: {pad(successCount)}</span>
        </div>

        {/* Processing Counter */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0b0f17] border-2 border-[#FF1A1A] text-xs font-black text-[#FF1A1A] shadow-[0_0_8px_rgba(255,0,0,0.25)]">
          <span
            className={`w-2.5 h-2.5 rounded-full bg-[#FF1A1A] ${
              processingCount > 0 ? 'animate-ping shadow-[0_0_8px_#FF0000]' : ''
            }`}
          />
          <span>PROCESSING: {pad(processingCount)}</span>
        </div>

        {/* Failed Counter */}
        <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0b0f17] border-2 border-rose-500/80 text-xs font-black text-rose-400">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
          <span>FAILED: {pad(failedCount)}</span>
        </div>
      </div>

      {/* Right: Actions & All Formats with Sharp Visible Borders */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* All Formats Dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowFormatDropdown(!showFormatDropdown)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-[#0b0f17] border-2 border-[#2b3a56] hover:border-slate-300 text-white transition-colors cursor-pointer"
          >
            <Folder className="w-3.5 h-3.5 text-amber-400" />
            <span>{formatFilter}</span>
            <ChevronDown className="w-3 h-3 text-slate-300" />
          </button>

          {showFormatDropdown && (
            <div className="absolute right-0 mt-1.5 w-36 bg-[#101522] border-2 border-[#2b3a56] rounded-xl shadow-2xl py-1.5 z-20">
              {formats.map((fmt) => (
                <button
                  key={fmt}
                  type="button"
                  onClick={() => {
                    onFormatFilterChange(fmt);
                    setShowFormatDropdown(false);
                  }}
                  className={`w-full text-left px-3.5 py-1.5 text-xs font-black transition-colors cursor-pointer ${
                    formatFilter === fmt
                      ? 'bg-[#1e1015] text-[#FF1A1A]'
                      : 'text-white hover:bg-[#182030]'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Download All CSV */}
        <button
          type="button"
          onClick={onDownloadAllCsv}
          disabled={totalCount === 0}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black text-white transition-all cursor-pointer border-1.5 ${
            totalCount === 0
              ? 'bg-[#1a2130] text-slate-500 border-[#2b374c] cursor-not-allowed'
              : 'btn-red-gradient border-[#ff7777] shadow-[0_0_12px_rgba(255,0,0,0.4)] hover:shadow-[0_0_18px_rgba(255,0,0,0.6)]'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download All CSV</span>
        </button>

        {/* Save & Embed Images */}
        <button
          type="button"
          onClick={onEmbedMetadata}
          disabled={totalCount === 0}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black bg-[#0b0f17] border-2 border-emerald-500/80 transition-colors cursor-pointer ${
            totalCount === 0 ? 'text-slate-500 border-[#232f46] cursor-not-allowed' : 'text-emerald-400 hover:border-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.25)]'
          }`}
          title="Download or Overwrite Images with Title-synced Filenames and Embedded EXIF, IPTC & XMP Metadata"
        >
          <Box className="w-3.5 h-3.5 text-emerald-400" />
          <span>Save & Embed Images</span>
        </button>

        {/* Clear All */}
        <button
          type="button"
          onClick={onClearAll}
          disabled={totalCount === 0}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black bg-[#0b0f17] border-2 border-[#2b3a56] transition-colors cursor-pointer ${
            totalCount === 0 ? 'text-slate-500 border-[#232f46] cursor-not-allowed' : 'text-slate-200 hover:text-rose-400 hover:border-rose-500'
          }`}
        >
          <X className="w-3.5 h-3.5 text-slate-300" />
          <span>Clear All</span>
        </button>
      </div>
    </div>
  );
};
