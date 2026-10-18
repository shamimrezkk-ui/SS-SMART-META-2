import React from 'react';
import { Eye, Download, Archive, Loader2 } from 'lucide-react';

interface ExportFooterProps {
  onPreviewCsv: () => void;
  onExportCsv: () => void;
  onDownloadZip?: () => void;
  isZipping?: boolean;
  disabled: boolean;
  platformName: string;
}

export const ExportFooter: React.FC<ExportFooterProps> = ({
  onPreviewCsv,
  onExportCsv,
  onDownloadZip,
  isZipping = false,
  disabled,
  platformName,
}) => {
  return (
    <div className="w-full bg-[#101522] border-2 border-[#263550] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md select-none mt-4">
      {/* Left text */}
      <div>
        <h4 className="text-sm font-black text-white mb-0.5">Ready for Export</h4>
        <p className="text-xs text-slate-100 font-bold">
          Download {platformName}-compliant CSV or download all images renamed with embedded metadata in a single ZIP.
        </p>
      </div>

      {/* Right buttons */}
      <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
        {/* Preview CSV */}
        <button
          type="button"
          onClick={onPreviewCsv}
          disabled={disabled}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-[#0d121c] border border-[#20293d] transition-colors cursor-pointer ${
            disabled ? 'text-slate-600 cursor-not-allowed' : 'text-white hover:text-white hover:border-slate-400'
          }`}
        >
          <Eye className="w-3.5 h-3.5 text-slate-200" />
          <span>Preview CSV</span>
        </button>

        {/* Export CSV */}
        <button
          type="button"
          onClick={onExportCsv}
          disabled={disabled}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white transition-all cursor-pointer ${
            disabled
              ? 'bg-[#222a3a] text-slate-500 border border-[#2b3548] cursor-not-allowed'
              : 'btn-teal-gradient shadow-[0_0_15px_rgba(53,159,160,0.4)] hover:shadow-[0_0_22px_rgba(53,159,160,0.6)]'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>

        {/* Download All as ZIP (Images + CSV) */}
        {onDownloadZip && (
          <button
            type="button"
            onClick={onDownloadZip}
            disabled={disabled || isZipping}
            className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black text-white transition-all cursor-pointer border-1.5 ${
              disabled || isZipping
                ? 'bg-[#222a3a] text-slate-500 border border-[#2b3548] cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 border-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:shadow-[0_0_22px_rgba(245,158,11,0.75)]'
            }`}
            title="Download full package: All original images renamed with embedded EXIF, IPTC & XMP + platform CSV"
          >
            {isZipping ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Archive className="w-3.5 h-3.5" />
            )}
            <span>{isZipping ? 'Creating ZIP...' : 'Download All (.ZIP)'}</span>
          </button>
        )}
      </div>
    </div>
  );
};
