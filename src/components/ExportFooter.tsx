import React from 'react';
import { Eye, Download } from 'lucide-react';

interface ExportFooterProps {
  onPreviewCsv: () => void;
  onExportCsv: () => void;
  disabled: boolean;
  platformName: string;
}

export const ExportFooter: React.FC<ExportFooterProps> = ({
  onPreviewCsv,
  onExportCsv,
  disabled,
  platformName,
}) => {
  return (
    <div className="w-full bg-[#101522] border border-[#20293d] rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md select-none mt-4">
      {/* Left text */}
      <div>
        <h4 className="text-sm font-black text-white mb-0.5">Ready for Export</h4>
        <p className="text-xs text-slate-100 font-bold">
          Export {platformName}-compliant CSV file with exact headers for your microstock dashboard.
        </p>
      </div>

      {/* Right buttons */}
      <div className="flex items-center gap-2.5 shrink-0">
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
          className={`flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black text-white transition-all cursor-pointer ${
            disabled
              ? 'bg-[#222a3a] text-slate-500 border border-[#2b3548] cursor-not-allowed'
              : 'btn-red-gradient shadow-[0_0_15px_rgba(255,0,0,0.4)] hover:shadow-[0_0_22px_rgba(255,0,0,0.6)]'
          }`}
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>
    </div>
  );
};
