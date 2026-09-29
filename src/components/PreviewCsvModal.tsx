import React from 'react';
import { X, Download, FileText } from 'lucide-react';
import { ImageItem, PlatformType } from '../types';
import { generateCsvHeaders, generateCsvRow, buildCsvString, downloadCsvFile } from '../utils/csvExporter';

interface PreviewCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ImageItem[];
  platform: PlatformType;
}

export const PreviewCsvModal: React.FC<PreviewCsvModalProps> = ({
  isOpen,
  onClose,
  items,
  platform,
}) => {
  if (!isOpen) return null;

  const headers = generateCsvHeaders(platform);
  const rows = items.map((item) => generateCsvRow(item, platform));

  const handleDownload = () => {
    const csvStr = buildCsvString(items, platform);
    downloadCsvFile(csvStr, `${platform.toLowerCase()}_batch_metadata.csv`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#101522] border border-[#20293d] rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1b2234] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#FF1A1A]" />
            <h2 className="text-base font-bold text-white">
              CSV Preview — {platform} Format ({items.length} items)
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

        {/* Content Table */}
        <div className="p-5 overflow-auto flex-1">
          {items.length === 0 ? (
            <div className="text-center py-12 text-slate-300 text-xs font-bold">
              No items to preview. Upload images and generate metadata first.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#1e273a]">
              <table className="w-full text-left text-xs text-white">
                <thead className="bg-[#0b0f17] text-white font-black border-b border-[#1e273a]">
                  <tr>
                    {headers.map((h, i) => (
                      <th key={i} className="px-3 py-2.5 whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182132]">
                  {rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-[#131a29]/60">
                      {row.map((cell, cIdx) => (
                        <td
                          key={cIdx}
                          className="px-3 py-2 text-[11px] max-w-xs truncate font-mono text-white font-bold"
                          title={cell}
                        >
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#1b2234] bg-[#0c1017] flex items-center justify-between">
          <span className="text-xs text-slate-100 font-bold">
            Strictly formatted for {platform} specifications.
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#101522] border border-[#20293d] text-white hover:text-white cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={items.length === 0}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-black text-white btn-red-gradient shadow-[0_0_12px_rgba(255,0,0,0.35)] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
