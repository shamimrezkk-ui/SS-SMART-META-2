import React, { useState } from 'react';
import {
  Image as ImageIcon,
  TableProperties,
  Download,
  Copy,
  Check,
  RotateCw,
  AlertTriangle,
  X,
  Box,
  CheckCircle2,
  Loader2,
  HardDrive,
} from 'lucide-react';
import { ImageItem, PlatformType } from '../types';
import { buildCsvString, downloadCsvFile } from '../utils/csvExporter';
import { embedDirectlyIntoItem, downloadEmbeddedImage } from '../utils/metadataEmbedder';

interface MetadataCardProps {
  item: ImageItem;
  platform: PlatformType;
  onUpdateItem: (id: string, updates: Partial<ImageItem>) => void;
  onRetryItem?: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onOpenEmbedModal?: () => void;
}

export const MetadataCard: React.FC<MetadataCardProps> = React.memo(
  ({ item, platform, onUpdateItem, onRetryItem, onRemoveItem, onOpenEmbedModal }) => {
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const [isEmbeddingSingle, setIsEmbeddingSingle] = useState(false);
    const [isDownloadingImage, setIsDownloadingImage] = useState(false);
    const [embedToast, setEmbedToast] = useState<string | null>(null);

    const handleCopy = (field: string, text: string) => {
      if (!text) return;
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1500);
    };

    const handleDownloadItemCsv = () => {
      const csvStr = buildCsvString([item], platform);
      const cleanName = item.name.replace(/\.[^/.]+$/, '');
      downloadCsvFile(csvStr, `${cleanName}_${platform.toLowerCase()}_metadata.csv`);
    };

    // Embed directly in-place without download!
    const handleEmbedSingleItem = async () => {
      if (item.fileHandle) {
        setIsEmbeddingSingle(true);
        try {
          const res = await embedDirectlyIntoItem(item);
          if (res.success) {
            setEmbedToast('Embedded directly in-place! ZERO files downloaded.');
            if (res.updatedName) {
              onUpdateItem(item.id, { name: res.updatedName, originalName: res.updatedName });
            }
          } else {
            setEmbedToast(res.message);
          }
        } catch (err: any) {
          setEmbedToast(`Embed error: ${err?.message || 'Failed'}`);
        } finally {
          setIsEmbeddingSingle(false);
          setTimeout(() => setEmbedToast(null), 3000);
        }
      } else if (onOpenEmbedModal) {
        // Open folder embedder to write in-place to directory
        onOpenEmbedModal();
      }
    };

    const handleDownloadSingleImage = async () => {
      setIsDownloadingImage(true);
      try {
        await downloadEmbeddedImage(item);
        setEmbedToast(`Downloaded "${item.name}" with full embedded EXIF, IPTC & XMP!`);
      } catch (err: any) {
        setEmbedToast(`Save error: ${err?.message || 'Failed'}`);
      } finally {
        setIsDownloadingImage(false);
        setTimeout(() => setEmbedToast(null), 3500);
      }
    };

    // Calculate file size in MB or KB
    const formatSize = (bytes: number) => {
      if (!bytes) return '0.00 MB';
      if (bytes < 1024 * 1024) {
        return `${(bytes / 1024).toFixed(2)} KB`;
      }
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    };

    // Status pill style with sharp borders
    const getStatusBadge = () => {
      switch (item.status) {
        case 'PROCESSING':
          return (
            <span className="px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-[#2a1017] border-1.5 border-[#FF0000] text-[#FF1A1A] animate-pulse shadow-[0_0_10px_rgba(255,0,0,0.5)]">
              PROCESSING
            </span>
          );
        case 'SUCCESS':
          return (
            <span className="px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-[#0f241a] border-1.5 border-emerald-500 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
              SUCCESS
            </span>
          );
        case 'FAILED':
          return (
            <div className="flex items-center gap-1.5">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-[#2e1319] border-1.5 border-rose-500 text-rose-400">
                FAILED
              </span>
              {onRetryItem && (
                <button
                  type="button"
                  onClick={() => onRetryItem(item.id)}
                  title="Retry this image"
                  className="p-1 rounded-md bg-[#1a0f14] border border-[#FF0000] text-[#FF1A1A] hover:bg-[#FF0000] hover:text-white transition-colors cursor-pointer"
                >
                  <RotateCw className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        case 'WAITING':
        default:
          return (
            <span className="px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-[#151c2c] border-1.5 border-[#304160] text-slate-300">
              WAITING
            </span>
          );
      }
    };

    return (
      <div
        className={`w-full bg-[#101522] rounded-2xl border-2 transition-all overflow-hidden shadow-lg ${
          item.selected
            ? 'border-[#FF0000] shadow-[0_0_18px_rgba(255,0,0,0.35)]'
            : item.status === 'PROCESSING'
            ? 'border-[#FF0000] shadow-[0_0_15px_rgba(255,0,0,0.3)]'
            : 'border-[#283854] hover:border-slate-300'
        }`}
      >
        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* LEFT COLUMN: IMAGE PREVIEW */}
          <div className="md:col-span-4 p-4 border-b-2 md:border-b-0 md:border-r-2 border-[#202c42] flex flex-col justify-between bg-[#0d121c]/70">
            {/* Header: Title & Status */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={item.selected}
                    onChange={(e) => onUpdateItem(item.id, { selected: e.target.checked })}
                    className="w-4 h-4 accent-[#FF0000] rounded-sm cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5 text-xs font-black text-amber-400">
                    <ImageIcon className="w-4 h-4" />
                    <span>IMAGE PREVIEW</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {getStatusBadge()}
                  <button
                    type="button"
                    onClick={() => onRemoveItem(item.id)}
                    className="text-slate-400 hover:text-rose-400 p-0.5 rounded-sm transition-colors cursor-pointer"
                    title="Remove item"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Thumbnail Display with Sharp Border Line */}
              <div className="relative rounded-xl overflow-hidden bg-[#070a10] border-2 border-[#263550] aspect-4/3 flex items-center justify-center group shadow-inner">
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  className="w-full h-full object-contain"
                  loading="lazy"
                />

                {item.status === 'PROCESSING' && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-2xs flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-[#FF0000] border-t-transparent animate-spin" />
                    <span className="text-[11px] text-[#FF1A1A] font-black uppercase tracking-wider">
                      Analyzing Image...
                    </span>
                  </div>
                )}

                {item.error && item.status === 'FAILED' && (
                  <div className="absolute bottom-0 inset-x-0 bg-rose-950/90 text-rose-200 text-[10px] p-2 flex items-center gap-1 border-t-2 border-rose-800 font-bold">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-rose-400" />
                    <span className="truncate">{item.error}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom File Info */}
            <div className="flex items-center justify-between text-[11px] text-slate-100 font-bold pt-3 mt-2 border-t-2 border-[#202c42]">
              <span>
                Format: <strong className="text-white font-black">{item.format}</strong>
              </span>
              <span>
                Size: <strong className="text-white font-black">{formatSize(item.size)}</strong>
              </span>
            </div>
          </div>

          {/* RIGHT COLUMN: GENERATED METADATA with Sharp Border Inputs */}
          <div className="md:col-span-8 p-4 flex flex-col justify-between space-y-3.5 bg-[#101522]">
            {/* Header: Title, Embed In-Place & Download CSV */}
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#202c42] flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-black text-amber-400">
                <TableProperties className="w-4 h-4" />
                <span>Generated Metadata</span>
              </div>

              <div className="flex items-center gap-2">
                {/* 1-Click Embed In-Place (Zero Downloads) */}
                <button
                  type="button"
                  onClick={handleEmbedSingleItem}
                  disabled={isEmbeddingSingle || (!item.title && (!item.keywords || item.keywords.length === 0))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-[#0b0f17] border-2 border-[#2b3a56] hover:border-[#FF0000] text-white transition-all cursor-pointer disabled:opacity-50"
                  title="Embed metadata directly in-place (No browser download)"
                >
                  {isEmbeddingSingle ? (
                    <Loader2 className="w-3.5 h-3.5 text-[#FF1A1A] animate-spin" />
                  ) : (
                    <Box className="w-3.5 h-3.5 text-[#FF1A1A]" />
                  )}
                  <span>Embed In-Place (No Download)</span>
                </button>

                {/* Direct Download Image with Embedded Metadata & Renamed to Title */}
                <button
                  type="button"
                  onClick={handleDownloadSingleImage}
                  disabled={isDownloadingImage || (!item.title && (!item.keywords || item.keywords.length === 0))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-[#0d1e17] border-2 border-emerald-500/80 hover:border-emerald-400 text-emerald-400 transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_8px_rgba(16,185,129,0.2)]"
                  title="Download image file with Title-filename and embedded EXIF, IPTC & XMP"
                >
                  {isDownloadingImage ? (
                    <Loader2 className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span>Save Image (Embedded)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadItemCsv}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-white btn-red-gradient shadow-[0_0_10px_rgba(255,0,0,0.35)] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            {/* In-Place Embed Toast feedback */}
            {embedToast && (
              <div className="p-2.5 rounded-xl bg-emerald-950/80 border-2 border-emerald-500/80 text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{embedToast}</span>
              </div>
            )}

            {/* Metadata Fields */}
            <div className="space-y-3">
              {/* Filename Field */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-amber-400 font-black">Filename:</span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/70 border border-emerald-500/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400" />
                      Auto-Synced with Title
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('filename', item.name)}
                    className="text-slate-200 hover:text-white flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                    title="Copy Filename"
                  >
                    {copiedField === 'filename' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <input
                  type="text"
                  value={item.name}
                  onChange={(e) => onUpdateItem(item.id, { name: e.target.value })}
                  className="w-full bg-[#0b0f17] border-2 border-[#283854] rounded-xl px-3 py-1.5 text-xs text-white font-black font-mono focus:border-[#FF0000] focus:outline-hidden"
                />
              </div>

              {/* Title Field */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-amber-400 font-black">Title:</span>
                    <span className="text-[10px] text-slate-300 font-semibold">
                      (Updates Filename instantly in sync)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopy('title', item.title)}
                    className="text-slate-200 hover:text-white flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                    title="Copy Title"
                  >
                    {copiedField === 'title' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={item.title}
                  onChange={(e) => onUpdateItem(item.id, { title: e.target.value })}
                  placeholder="Enter or generate title..."
                  className="w-full bg-[#0b0f17] border-2 border-[#283854] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 font-bold focus:border-[#FF0000] focus:outline-hidden resize-none leading-relaxed"
                />
              </div>

              {/* Description Field */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-amber-400 font-black">Description:</span>
                  <button
                    type="button"
                    onClick={() => handleCopy('description', item.description)}
                    className="text-slate-200 hover:text-white flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                    title="Copy Description"
                  >
                    {copiedField === 'description' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
                <textarea
                  rows={2}
                  value={item.description}
                  onChange={(e) => onUpdateItem(item.id, { description: e.target.value })}
                  placeholder="Enter or generate description..."
                  className="w-full bg-[#0b0f17] border-2 border-[#283854] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 font-bold focus:border-[#FF0000] focus:outline-hidden resize-none leading-relaxed"
                />
              </div>

              {/* Keywords Field */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-amber-400 font-black">
                    Keywords: ({item.keywords ? item.keywords.length : 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy('keywords', (item.keywords || []).join(', '))}
                    className="text-slate-200 hover:text-white flex items-center gap-1 text-[11px] font-bold cursor-pointer"
                    title="Copy Keywords"
                  >
                    {copiedField === 'keywords' ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {item.keywords && item.keywords.length > 0 ? (
                  <div className="bg-[#0b0f17] border-2 border-[#283854] rounded-xl p-2.5 max-h-28 overflow-y-auto flex flex-wrap gap-1.5">
                    {item.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#141d2e] border-1.5 border-[#304160] text-[11px] text-white font-bold"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() => {
                            const newKws = item.keywords.filter((_, idx) => idx !== i);
                            onUpdateItem(item.id, { keywords: newKws });
                          }}
                          className="text-slate-400 hover:text-rose-400 cursor-pointer font-bold ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="bg-[#0b0f17] border-2 border-[#283854] rounded-xl px-3 py-2 text-xs text-slate-400 italic font-semibold">
                    No keywords generated yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);
MetadataCard.displayName = 'MetadataCard';
