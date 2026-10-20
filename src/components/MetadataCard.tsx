import React, { useState, useEffect } from 'react';
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
  Maximize2,
  Film,
  GitFork,
  Star,
  FileCode,
} from 'lucide-react';
import { ImageItem, PlatformType } from '../types';
import { buildCsvString, downloadCsvFile } from '../utils/csvExporter';
import { embedDirectlyIntoItem, downloadEmbeddedImage, embedMetadataInBytes } from '../utils/metadataEmbedder';
import { titleToFilename } from '../utils/filenameHelper';
import { FullPreviewModal } from './FullPreviewModal';

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
    const [isFullPreviewOpen, setIsFullPreviewOpen] = useState(false);

    const isVideo =
      ['MP4', 'WEBM', 'MOV', 'VIDEO'].includes(item.format?.toUpperCase()) ||
      Boolean(item.mimeType?.startsWith('video/')) ||
      Boolean(item.name.match(/\.(mp4|webm|mov)$/i));

    const isVector =
      ['SVG', 'EPS', 'AI', 'VECTOR'].includes(item.format?.toUpperCase()) ||
      Boolean(item.name.match(/\.(svg|eps|ai)$/i));

    // Default to clean crisp white background for vectors so artwork is 100% visible
    const [previewBackdrop, setPreviewBackdrop] = useState<'dark' | 'white' | 'checker' | 'studio'>(
      isVector ? 'white' : 'dark'
    );

    useEffect(() => {
      if (isVector) {
        setPreviewBackdrop('white');
      }
    }, [isVector]);

    const getBackdropStyle = () => {
      if (previewBackdrop === 'white') {
        return { backgroundColor: '#FFFFFF' };
      }
      if (previewBackdrop === 'studio') {
        return { backgroundColor: '#E2E8F0' };
      }
      if (previewBackdrop === 'checker') {
        return {
          backgroundColor: '#1e293b',
          backgroundImage:
            'linear-gradient(45deg, #334155 25%, transparent 25%), linear-gradient(-45deg, #334155 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #334155 75%), linear-gradient(-45deg, transparent 75%, #334155 75%)',
          backgroundSize: '16px 16px',
          backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
        };
      }
      return { backgroundColor: '#070a10' };
    };

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
            setEmbedToast('Embedded directly in-place with 5-Star Rating & Renamed filename!');
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
          setTimeout(() => setEmbedToast(null), 3500);
        }
      } else if (typeof (window as any).showSaveFilePicker === 'function') {
        setIsEmbeddingSingle(true);
        try {
          const targetName = titleToFilename(item.title || item.name, item.name);
          const ext = targetName.split('.').pop()?.toLowerCase() || 'jpg';
          const mime = item.format === 'PNG' ? 'image/png' : item.format === 'EPS' ? 'application/postscript' : 'image/jpeg';
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: targetName,
            types: [
              {
                description: `${item.format} Stock Asset`,
                accept: { [mime]: [`.${ext}`] },
              },
            ],
          });
          let sourceBuffer: ArrayBuffer;
          if (item.originalFile) {
            sourceBuffer = await item.originalFile.arrayBuffer();
          } else {
            const res = await fetch(item.previewUrl);
            sourceBuffer = await res.arrayBuffer();
          }
          const uint8 = new Uint8Array(sourceBuffer);
          const embeddedBytes = embedMetadataInBytes(
            uint8,
            item.title || item.name,
            item.description || item.title || '',
            item.keywords || []
          );
          const writable = await handle.createWritable();
          await writable.write(new Blob([embeddedBytes.buffer as ArrayBuffer]));
          await writable.close();

          const finalName = handle.name || targetName;
          onUpdateItem(item.id, {
            name: finalName,
            originalName: finalName,
            fileHandle: handle,
          });
          setEmbedToast(`Saved in-place as "${finalName}" with 5★ Rating and metadata embedded!`);
        } catch (pickerErr: any) {
          if (pickerErr?.name !== 'AbortError') {
            if (onOpenEmbedModal) onOpenEmbedModal();
          }
        } finally {
          setIsEmbeddingSingle(false);
          setTimeout(() => setEmbedToast(null), 3500);
        }
      } else if (onOpenEmbedModal) {
        // Open folder embedder to write in-place directly into disk folder
        onOpenEmbedModal();
      }
    };

    const handleDownloadSingleImage = async () => {
      setIsDownloadingImage(true);
      try {
        const savedName = await downloadEmbeddedImage(item);
        if (savedName) {
          onUpdateItem(item.id, { name: savedName, originalName: savedName });
        }
        setEmbedToast(`Saved "${savedName || item.name}" with 5-Star Rating, EXIF, IPTC & XMP embedded!`);
      } catch (err: any) {
        setEmbedToast(`Save error: ${err?.message || 'Failed'}`);
      } finally {
        setIsDownloadingImage(false);
        setTimeout(() => setEmbedToast(null), 4000);
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

    // Status badge style
    const getStatusBadge = () => {
      switch (item.status) {
        case 'PROCESSING':
          return (
            <span className="px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-[#0d2223] border-1.5 border-[#359FA0] text-[#359FA0] animate-pulse shadow-[0_0_10px_rgba(53,159,160,0.5)]">
              PROCESSING
            </span>
          );
        case 'SUCCESS':
          return (
            <span className="px-3 py-0.5 rounded-full text-[10px] font-black tracking-wider bg-[#0d2223] border-1.5 border-[#359FA0] text-[#42B4B5] shadow-[0_0_8px_rgba(53,159,160,0.3)]">
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
                  className="p-1 rounded-md bg-[#0d2223] border border-[#359FA0] text-[#359FA0] hover:bg-[#359FA0] hover:text-white transition-colors cursor-pointer"
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
            ? 'border-[#359FA0] shadow-[0_0_18px_rgba(53,159,160,0.35)]'
            : item.status === 'PROCESSING'
            ? 'border-[#359FA0] shadow-[0_0_15px_rgba(53,159,160,0.3)]'
            : 'border-[#283854] hover:border-[#359FA0]/60'
        }`}
      >
        {/* TOP BAR: PROMINENT FILENAME & 5-STAR RATING (User Request: uporer file name change hoi na 5star bose na) */}
        <div className="px-4 py-2 bg-[#0b0f17] border-b-2 border-[#202c42] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <input
              type="checkbox"
              checked={item.selected}
              onChange={(e) => onUpdateItem(item.id, { selected: e.target.checked })}
              className="w-4 h-4 accent-[#359FA0] rounded-sm cursor-pointer shrink-0"
            />
            <div className="flex items-center gap-1.5 text-xs font-black text-[#42B4B5] shrink-0">
              {isVideo ? (
                <Film className="w-4 h-4 text-purple-400" />
              ) : isVector ? (
                <GitFork className="w-4 h-4 text-amber-400" />
              ) : (
                <ImageIcon className="w-4 h-4 text-[#359FA0]" />
              )}
              <span className="uppercase text-[11px] font-bold text-slate-300">
                {item.format}
              </span>
            </div>

            {/* Prominently Displayed Current Filename at the Top Header */}
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[11px] font-bold text-slate-400">File:</span>
              <span
                className="font-mono text-xs font-black text-white px-2 py-0.5 rounded-md bg-[#131b2a] border border-[#359FA0]/50 truncate max-w-[260px] sm:max-w-[420px] md:max-w-[550px]"
                title={item.name}
              >
                {item.name}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 5-Star Rating Indicator (Ensures user knows 5-Star Rating is active) */}
            <div
              className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-950/50 border border-amber-500/70 text-amber-300 text-[10px] font-black shadow-[0_0_8px_rgba(245,158,11,0.25)]"
              title="5-Star Rating (EXIF 0x4746 Rating 5, RatingPercent 99, XMP xmp:Rating=5, MicrosoftPhoto:Rating=99)"
            >
              <div className="flex text-amber-400">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              </div>
              <span>5★ Embedded</span>
            </div>

            {getStatusBadge()}

            <button
              type="button"
              onClick={() => onRemoveItem(item.id)}
              className="text-slate-400 hover:text-rose-400 p-1 rounded-sm transition-colors cursor-pointer"
              title="Remove item"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* LEFT COLUMN: IMAGE PREVIEW */}
          <div className="md:col-span-4 p-4 border-b-2 md:border-b-0 md:border-r-2 border-[#202c42] flex flex-col justify-between bg-[#0d121c]/70">
            <div>
              {/* Thumbnail Display: Handles Image, Video, Vector with Full Preview & Ready-Made Backdrop Switcher */}
              <div
                className="relative rounded-xl overflow-hidden border-2 border-[#263550] aspect-4/3 flex items-center justify-center group shadow-inner transition-colors duration-150"
                style={getBackdropStyle()}
              >
                {/* Backdrop Switcher for transparent vectors */}
                <div className="absolute top-2 left-2 z-10 flex items-center gap-0.5 bg-black/80 backdrop-blur-xs border border-white/20 rounded-md p-0.5 shadow-md opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewBackdrop('dark');
                    }}
                    className={`w-4 h-4 rounded-xs flex items-center justify-center text-[9px] font-black transition-all cursor-pointer ${
                      previewBackdrop === 'dark' ? 'bg-[#359FA0] text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Dark Backdrop (Preview Only)"
                  >
                    D
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewBackdrop('white');
                    }}
                    className={`w-4 h-4 rounded-xs flex items-center justify-center text-[9px] font-black transition-all cursor-pointer ${
                      previewBackdrop === 'white' ? 'bg-[#359FA0] text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title="White Backdrop (Vector Preview)"
                  >
                    W
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewBackdrop('checker');
                    }}
                    className={`w-4 h-4 rounded-xs flex items-center justify-center text-[9px] font-black transition-all cursor-pointer ${
                      previewBackdrop === 'checker' ? 'bg-[#359FA0] text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Transparency Grid"
                  >
                    G
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewBackdrop('studio');
                    }}
                    className={`w-4 h-4 rounded-xs flex items-center justify-center text-[9px] font-black transition-all cursor-pointer ${
                      previewBackdrop === 'studio' ? 'bg-[#359FA0] text-white shadow-xs' : 'text-slate-300 hover:text-white'
                    }`}
                    title="Studio Grey Backdrop"
                  >
                    S
                  </button>
                </div>

                {isVideo ? (
                  <video
                    src={item.previewUrl}
                    muted
                    playsInline
                    controls
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <img
                    src={item.previewUrl}
                    alt={item.name}
                    className="w-full h-full object-contain p-2 cursor-pointer transition-transform duration-200 group-hover:scale-102"
                    loading="lazy"
                    onClick={() => setIsFullPreviewOpen(true)}
                  />
                )}

                {/* Full Preview Hover Button */}
                <button
                  type="button"
                  onClick={() => setIsFullPreviewOpen(true)}
                  className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/80 hover:bg-[#359FA0] text-white border border-white/20 transition-all opacity-0 group-hover:opacity-100 cursor-pointer shadow-md z-10"
                  title="Open Full Resolution Preview"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>

                {item.status === 'PROCESSING' && (
                  <div className="absolute inset-0 bg-black/70 backdrop-blur-2xs flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-full border-2 border-[#359FA0] border-t-transparent animate-spin" />
                    <span className="text-[11px] text-[#42B4B5] font-black uppercase tracking-wider">
                      Analyzing {isVideo ? 'Video' : isVector ? 'Vector' : 'Image'}...
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

          {/* RIGHT COLUMN: GENERATED METADATA */}
          <div className="md:col-span-8 p-4 flex flex-col justify-between space-y-3.5 bg-[#101522]">
            {/* Header: Title, Source badge, Embed In-Place & Download Actions */}
            <div className="flex items-center justify-between pb-2 border-b-2 border-[#202c42] flex-wrap gap-2">
              <div className="flex items-center gap-2 text-xs font-black text-[#42B4B5]">
                <TableProperties className="w-4 h-4 text-[#359FA0]" />
                <span className="text-white">Generated Metadata</span>
                {item.source === 'gemini' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-[#0d2223] border border-[#359FA0] text-[#42B4B5] shadow-[0_0_8px_rgba(53,159,160,0.3)]">
                    ✨ Gemini Vision
                  </span>
                )}
                {item.source === 'instant_engine' && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-950/80 border border-blue-500/80 text-blue-300">
                    ⚡ Instant Engine
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* Save Single Image with Embedded Metadata & Renamed to Title */}
                <button
                  type="button"
                  onClick={handleDownloadSingleImage}
                  disabled={isDownloadingImage || (!item.title && (!item.keywords || item.keywords.length === 0))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-[#0d2223] border-2 border-[#359FA0] hover:border-[#42B4B5] text-[#42B4B5] transition-all cursor-pointer disabled:opacity-50 shadow-[0_0_12px_rgba(53,159,160,0.3)] hover:shadow-[0_0_18px_rgba(53,159,160,0.5)]"
                  title="Download image renamed to match Title with embedded EXIF, 5-Star Rating, IPTC & XMP"
                >
                  {isDownloadingImage ? (
                    <Loader2 className="w-3.5 h-3.5 text-[#42B4B5] animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-[#359FA0]" />
                  )}
                  <span>
                    {isDownloadingImage
                      ? 'Saving...'
                      : isVideo
                      ? 'Save Video'
                      : isVector
                      ? 'Save Vector (Renamed & Embedded)'
                      : 'Save Image (Renamed & 5★)'}
                  </span>
                </button>

                {/* 1-Click Embed In-Place (Zero Downloads) */}
                <button
                  type="button"
                  onClick={handleEmbedSingleItem}
                  disabled={isEmbeddingSingle || (!item.title && (!item.keywords || item.keywords.length === 0))}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-[#0b0f17] border-2 border-[#2b3a56] hover:border-[#359FA0] text-white transition-all cursor-pointer disabled:opacity-50"
                  title="Embed metadata and 5-star rating directly in-place without browser download"
                >
                  {isEmbeddingSingle ? (
                    <Loader2 className="w-3.5 h-3.5 text-[#359FA0] animate-spin" />
                  ) : (
                    <Box className="w-3.5 h-3.5 text-[#359FA0]" />
                  )}
                  <span>Save In-Place</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadItemCsv}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black text-white btn-teal-gradient shadow-[0_0_10px_rgba(53,159,160,0.35)] cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download CSV</span>
                </button>
              </div>
            </div>

            {/* In-Place Embed Toast feedback */}
            {embedToast && (
              <div className="p-2.5 rounded-xl bg-[#0d2223] border-2 border-[#359FA0] text-[#42B4B5] text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#359FA0] shrink-0" />
                <span>{embedToast}</span>
              </div>
            )}

            {/* Metadata Fields */}
            <div className="space-y-3">
              {/* Filename Field */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white font-black">Filename:</span>
                    <span className="text-[10px] text-[#42B4B5] font-bold bg-[#0d2223] border border-[#359FA0]/60 px-1.5 py-0.5 rounded flex items-center gap-1">
                      <Check className="w-3 h-3 text-[#359FA0]" />
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
                  className="w-full bg-[#0b0f17] border-2 border-[#283854] rounded-xl px-3 py-1.5 text-xs text-white font-black font-mono focus:border-[#359FA0] focus:outline-hidden"
                />
              </div>

              {/* Title Field */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-black">Title:</span>
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
                  className="w-full bg-[#0b0f17] border-2 border-[#283854] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 font-bold focus:border-[#359FA0] focus:outline-hidden resize-none leading-relaxed"
                />
              </div>

              {/* Description Field */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white font-black">Description:</span>
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
                  className="w-full bg-[#0b0f17] border-2 border-[#283854] rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-400 font-bold focus:border-[#359FA0] focus:outline-hidden resize-none leading-relaxed"
                />
              </div>

              {/* Keywords Field */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-white font-black">
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
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-[#141d2e] border-1.5 border-[#304160] hover:border-[#359FA0] text-[11px] text-white font-bold"
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

        {/* Full Preview Lightbox Modal */}
        <FullPreviewModal
          isOpen={isFullPreviewOpen}
          onClose={() => setIsFullPreviewOpen(false)}
          item={item}
        />
      </div>
    );
  }
);
MetadataCard.displayName = 'MetadataCard';
