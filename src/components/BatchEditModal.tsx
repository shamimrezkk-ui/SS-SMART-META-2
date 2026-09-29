import React, { useState } from 'react';
import { X, Edit3, Plus, RefreshCw } from 'lucide-react';
import { ImageItem } from '../types';

interface BatchEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedItems: ImageItem[];
  onApplyBatchEdit: (updates: {
    appendKeywords?: string[];
    prependKeywords?: string[];
    category?: string;
    findReplace?: { find: string; replace: string };
  }) => void;
}

export const BatchEditModal: React.FC<BatchEditModalProps> = ({
  isOpen,
  onClose,
  selectedItems,
  onApplyBatchEdit,
}) => {
  const [newKeywords, setNewKeywords] = useState('');
  const [actionType, setActionType] = useState<'append' | 'prepend'>('append');
  const [category, setCategory] = useState('');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  if (!isOpen) return null;

  const handleApply = () => {
    const kws = newKeywords
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);

    onApplyBatchEdit({
      appendKeywords: actionType === 'append' && kws.length > 0 ? kws : undefined,
      prependKeywords: actionType === 'prepend' && kws.length > 0 ? kws : undefined,
      category: category.trim() || undefined,
      findReplace: findText.trim() ? { find: findText.trim(), replace: replaceText } : undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#101522] border border-[#20293d] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1b2234] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-[#FF1A1A]" />
            <h2 className="text-base font-black text-white">
              Batch Edit ({selectedItems.length} Selected Images)
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg hover:bg-[#192233] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs">
          {/* Keywords Section */}
          <div className="space-y-1.5">
            <label className="block text-white font-bold">
              Add Keywords to Selected
            </label>
            <div className="flex items-center gap-2 mb-2">
              <button
                type="button"
                onClick={() => setActionType('append')}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  actionType === 'append'
                    ? 'bg-[#FF0000] text-white shadow-[0_0_8px_rgba(255,0,0,0.4)]'
                    : 'bg-[#0d121c] border border-[#20293d] text-slate-100'
                }`}
              >
                Append to End
              </button>
              <button
                type="button"
                onClick={() => setActionType('prepend')}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                  actionType === 'prepend'
                    ? 'bg-[#FF0000] text-white shadow-[0_0_8px_rgba(255,0,0,0.4)]'
                    : 'bg-[#0d121c] border border-[#20293d] text-slate-100'
                }`}
              >
                Prepend to Beginning
              </button>
            </div>
            <input
              type="text"
              value={newKeywords}
              onChange={(e) => setNewKeywords(e.target.value)}
              placeholder="e.g. 4k resolution, high quality, commercial"
              className="w-full bg-[#0b0f17] border border-[#1e273a] rounded-lg px-3 py-2 text-white font-bold placeholder-slate-400 focus:border-[#FF0000] focus:outline-hidden"
            />
          </div>

          {/* Set Category */}
          <div className="space-y-1.5">
            <label className="block text-white font-bold">
              Set Stock Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Animals, Nature, Technology, Business"
              className="w-full bg-[#0b0f17] border border-[#1e273a] rounded-lg px-3 py-2 text-white font-bold placeholder-slate-400 focus:border-[#FF0000] focus:outline-hidden"
            />
          </div>

          {/* Find and Replace */}
          <div className="space-y-1.5 pt-2 border-t border-[#1b2234]">
            <label className="block text-white font-bold">
              Find & Replace in Title / Description
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                placeholder="Find text..."
                className="w-full bg-[#0b0f17] border border-[#1e273a] rounded-lg px-3 py-1.5 text-white font-bold placeholder-slate-400 focus:border-[#FF0000] focus:outline-hidden"
              />
              <input
                type="text"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
                placeholder="Replace with..."
                className="w-full bg-[#0b0f17] border border-[#1e273a] rounded-lg px-3 py-1.5 text-white font-bold placeholder-slate-400 focus:border-[#FF0000] focus:outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-[#1b2234] bg-[#0c1017] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-[#101522] border border-[#20293d] text-white hover:text-white cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-xl text-xs font-black text-white btn-red-gradient shadow-[0_0_12px_rgba(255,0,0,0.35)] cursor-pointer"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
};
