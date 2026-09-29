import React, { useState } from 'react';
import { Plus, Edit, Trash2, ChevronDown } from 'lucide-react';

interface ToolbarProps {
  onUploadMore: () => void;
  onBatchEdit: () => void;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onRemoveSelected: () => void;
  selectedCount: number;
  totalCount: number;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  onUploadMore,
  onBatchEdit,
  onSelectAll,
  onDeselectAll,
  onRemoveSelected,
  selectedCount,
  totalCount,
  statusFilter,
  onStatusFilterChange,
}) => {
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);

  const statuses = ['All Status', 'WAITING', 'PROCESSING', 'SUCCESS', 'FAILED'];

  return (
    <div className="w-full flex flex-wrap items-center justify-between gap-2.5 py-1 text-xs select-none">
      {/* Left Action Buttons with Prominent Border Lines */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* + Upload More */}
        <button
          type="button"
          onClick={onUploadMore}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#101522] border-2 border-[#2b3a56] hover:border-[#FF0000] text-white font-black transition-colors cursor-pointer shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-[#FF1A1A]" />
          <span>+ Upload More</span>
        </button>

        {/* Batch Edit */}
        <button
          type="button"
          onClick={onBatchEdit}
          disabled={selectedCount === 0}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#101522] border-2 transition-colors cursor-pointer ${
            selectedCount === 0
              ? 'border-[#1e2738] text-slate-500 cursor-not-allowed'
              : 'border-[#2b3a56] hover:border-[#FF0000] text-white font-black shadow-xs'
          }`}
        >
          <Edit className="w-3.5 h-3.5 text-slate-300" />
          <span>Batch Edit {selectedCount > 0 && `(${selectedCount})`}</span>
        </button>

        {/* Select All */}
        <button
          type="button"
          onClick={onSelectAll}
          disabled={totalCount === 0}
          className="px-3 py-1.5 rounded-xl bg-[#101522] border-2 border-[#2b3a56] hover:border-slate-300 text-white font-black transition-colors cursor-pointer shadow-xs"
        >
          Select All
        </button>

        {/* Deselect */}
        <button
          type="button"
          onClick={onDeselectAll}
          disabled={selectedCount === 0}
          className="px-3 py-1.5 rounded-xl bg-[#101522] border-2 border-[#2b3a56] hover:border-slate-300 text-white font-black transition-colors cursor-pointer shadow-xs"
        >
          Deselect
        </button>

        {/* Remove Selected */}
        <button
          type="button"
          onClick={onRemoveSelected}
          disabled={selectedCount === 0}
          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border-2 transition-colors cursor-pointer ${
            selectedCount === 0
              ? 'border-transparent text-slate-600 cursor-not-allowed'
              : 'border-[#FF0000]/60 bg-[#1f1015] text-[#FF4D4D] hover:text-white hover:bg-[#FF0000] font-black shadow-xs'
          }`}
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Remove Selected</span>
        </button>
      </div>

      {/* Right: All Status Filter Dropdown with Sharp Border */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowStatusDropdown(!showStatusDropdown)}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#101522] border-2 border-[#2b3a56] hover:border-slate-300 text-white font-black transition-colors cursor-pointer"
        >
          <span>{statusFilter}</span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-300" />
        </button>

        {showStatusDropdown && (
          <div className="absolute right-0 mt-1.5 w-36 bg-[#101522] border-2 border-[#2b3a56] rounded-xl shadow-2xl py-1.5 z-20">
            {statuses.map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  onStatusFilterChange(st);
                  setShowStatusDropdown(false);
                }}
                className={`w-full text-left px-3.5 py-1.5 text-xs font-black transition-colors cursor-pointer ${
                  statusFilter === st
                    ? 'bg-[#1e1015] text-[#FF1A1A]'
                    : 'text-white hover:bg-[#182030]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
