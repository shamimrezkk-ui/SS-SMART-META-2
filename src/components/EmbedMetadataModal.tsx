import React, { useState } from 'react';
import {
  Box,
  X,
  FolderSync,
  CheckCircle2,
  HardDrive,
  Loader2,
  AlertCircle,
  FileCheck,
  ShieldCheck,
  Check,
  Sparkles,
  Archive,
  Star,
} from 'lucide-react';
import { ImageItem, PlatformType } from '../types';
import { embedMetadataInBytes } from '../utils/metadataEmbedder';
import { titleToFilename } from '../utils/filenameHelper';
import { downloadAllAsZip } from '../utils/zipExporter';

interface EmbedMetadataModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: ImageItem[];
  platform: PlatformType;
  onUpdateItem?: (id: string, updates: Partial<ImageItem>) => void;
}

export const EmbedMetadataModal: React.FC<EmbedMetadataModalProps> = ({
  isOpen,
  onClose,
  items,
  platform,
  onUpdateItem,
}) => {
  const [isEmbedding, setIsEmbedding] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [completedCount, setCompletedCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [completedList, setCompletedList] = useState<string[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [renameFileWithTitle, setRenameFileWithTitle] = useState(true);

  if (!isOpen) return null;

  const validItems = items.filter((i) => i.title || (i.keywords && i.keywords.length > 0));

  // Direct In-Place Folder Overwrite (Zero Browser Downloads)
  const handleDirectFolderOverwrite = async () => {
    setIsEmbedding(true);
    setStatusMessage('Accessing local source folder...');
    setCompletedCount(0);
    setCompletedList([]);
    setIsFinished(false);

    try {
      if ('showDirectoryPicker' in window) {
        setStatusMessage('Please select your source folder to save metadata directly in-place...');
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
        });

        setStatusMessage('Folder connected. Writing 5-Star Rating, Title & Keywords directly into files in-place...');

        let count = 0;
        const doneNames: string[] = [];

        for (let i = 0; i < validItems.length; i++) {
          const item = validItems[i];
          setCurrentFileIndex(i + 1);

          const oldName = item.originalName || item.name;
          const targetName = renameFileWithTitle ? titleToFilename(item.title, item.name) : oldName;

          setStatusMessage(`Embedding metadata & 5-Star rating into "${oldName}" in-place...`);

          try {
            // Locate existing file in folder
            let sourceBuffer: ArrayBuffer | null = null;
            let fileFound = false;

            try {
              const oldHandle = await dirHandle.getFileHandle(oldName, { create: false });
              const f = await oldHandle.getFile();
              sourceBuffer = await f.arrayBuffer();
              fileFound = true;
            } catch {
              try {
                // Try targetName in case it was already named with targetName
                const h = await dirHandle.getFileHandle(targetName, { create: false });
                const f = await h.getFile();
                sourceBuffer = await f.arrayBuffer();
                fileFound = true;
              } catch {
                // Scan directory case-insensitively
                try {
                  for await (const entry of dirHandle.values()) {
                    if (
                      entry.kind === 'file' &&
                      entry.name.toLowerCase() === oldName.toLowerCase()
                    ) {
                      const f = await entry.getFile();
                      sourceBuffer = await f.arrayBuffer();
                      fileFound = true;
                      break;
                    }
                  }
                } catch {}
              }
            }

            // Fallback to in-memory originalFile
            if (!sourceBuffer && item.originalFile) {
              sourceBuffer = await item.originalFile.arrayBuffer();
              fileFound = true;
            }

            if (fileFound && sourceBuffer) {
              const uint8 = new Uint8Array(sourceBuffer);
              // Embed full metadata with 5-Star Rating (EXIF, IPTC, XMP with xmp:Rating="5" and MicrosoftPhoto:Rating="99")
              const embeddedBytes = embedMetadataInBytes(
                uint8,
                item.title || item.name,
                item.description || item.title || '',
                item.keywords || []
              );

              // Write directly to disk in-place!
              const newHandle = await dirHandle.getFileHandle(targetName, { create: true });
              const writable = await newHandle.createWritable();
              await writable.write(
                new Blob([embeddedBytes.buffer as ArrayBuffer], {
                  type:
                    item.format === 'PNG'
                      ? 'image/png'
                      : item.format === 'EPS'
                      ? 'application/postscript'
                      : 'image/jpeg',
                })
              );
              await writable.close();

              // If name changed, remove the old file entry so there are no duplicates
              if (targetName !== oldName) {
                try {
                  await dirHandle.removeEntry(oldName);
                } catch {}
              }

              // Update state in app so UI immediately reflects the new name!
              if (onUpdateItem) {
                onUpdateItem(item.id, { name: targetName, originalName: targetName });
              }

              count++;
              doneNames.push(
                renameFileWithTitle
                  ? `✓ "${oldName}" ➜ "${targetName}" [5★ Rating, EXIF, IPTC & XMP Saved In-Place]`
                  : `✓ "${oldName}" [5★ Rating, EXIF, IPTC & XMP Saved Directly Inside File]`
              );
              setCompletedCount(count);
            } else {
              doneNames.push(`⚠ "${oldName}" (File not found in selected directory)`);
            }
          } catch (fileErr: any) {
            console.warn(`File error for ${item.name}:`, fileErr);
            doneNames.push(`⚠ "${oldName}" error: ${fileErr?.message || 'Access error'}`);
          }

          setCompletedList([...doneNames]);
          await new Promise((r) => setTimeout(r, 40));
        }

        setIsFinished(true);
        setStatusMessage(
          `Success! ${count} files updated in-place with 5-Star Rating, Title & Keywords. ZERO downloads!`
        );
      } else {
        setStatusMessage(
          'Please use Chrome, Edge, or a browser with File System Access for in-place writing.'
        );
      }
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setStatusMessage('Folder selection was cancelled.');
      } else {
        setStatusMessage(`Error: ${err?.message || 'Failed to embed files.'}`);
      }
    } finally {
      setIsEmbedding(false);
    }
  };

  // 1-Click All Images ZIP Export (Packages everything in ONE single .zip file - ZERO 1-by-1 downloads!)
  const handleDownloadAllZip = async () => {
    setIsDownloadingAll(true);
    setStatusMessage('Embedding 5-Star Rating, metadata and packaging all files into single ZIP archive...');
    setCompletedCount(0);
    setCompletedList([]);
    setIsFinished(false);

    try {
      await downloadAllAsZip(validItems, platform, (pct, msg) => {
        setStatusMessage(msg);
        setCompletedCount(Math.round((pct / 100) * validItems.length));
      });
      setIsFinished(true);
      setStatusMessage(`Completed! All ${validItems.length} media files packaged into one single ZIP with 5-Star ratings and embedded metadata.`);
    } catch (e: any) {
      setStatusMessage(`ZIP error: ${e?.message || 'Failed to download ZIP'}`);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#101522] border-2 border-[#359FA0] rounded-2xl max-w-xl w-full p-6 text-white shadow-[0_0_35px_rgba(53,159,160,0.35)] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#202c42] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0d2223] border-2 border-[#359FA0] flex items-center justify-center text-[#359FA0] shadow-[0_0_12px_rgba(53,159,160,0.4)]">
              <Box className="w-5 h-5 text-[#359FA0]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-wide">
                IN-PLACE METADATA & 5-STAR RATING EMBEDDER
              </h3>
              <p className="text-xs text-slate-200 font-bold">
                Zero Downloads. Metadata, 5-Star Ratings & Title filenames are saved directly in your folder.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-300 hover:text-white p-1 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Details */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs font-bold">
          {/* Summary Box */}
          <div className="bg-[#0b0f17] border-2 border-[#222f46] rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Target Agency:</span>
              <span className="text-[#359FA0] font-black">{platform}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Ready Files:</span>
              <span className="text-emerald-400 font-black">{validItems.length} Files with Metadata</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">5-Star Rating:</span>
              <span className="text-amber-400 font-black flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>★★★★★ 5-Stars Embedded (EXIF & XMP)</span>
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Filename Option:</span>
              <label className="flex items-center gap-2 cursor-pointer select-none text-[#42B4B5] hover:text-white">
                <input
                  type="checkbox"
                  checked={renameFileWithTitle}
                  onChange={(e) => setRenameFileWithTitle(e.target.checked)}
                  className="w-4 h-4 rounded border-[#344666] text-[#359FA0] focus:ring-0 accent-[#359FA0] cursor-pointer"
                />
                <span className="text-xs">
                  {renameFileWithTitle
                    ? 'Rename to match Title'
                    : 'Keep Original Filename (e.g. 1.jpg)'}
                </span>
              </label>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Browser Downloads:</span>
              <span className="text-emerald-400 font-black">DISABLED (Zero Downloads, Direct In-Place)</span>
            </div>
            <div className="flex items-center justify-between text-xs pt-1 border-t border-[#1e273a]">
              <span className="text-slate-300">Tags Written:</span>
              <span className="text-[#42B4B5] font-black">EXIF (Rating 5, XPTitle, XPKeywords) + IPTC + XMP (Rating 5)</span>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-3.5 rounded-xl bg-[#161d2d] border-2 border-[#283854] space-y-2">
            <div className="flex items-center gap-2 text-white font-black">
              <HardDrive className="w-4 h-4 text-[#359FA0]" />
              <span>Direct In-Place Execution (No Browser Downloads):</span>
            </div>
            <p className="text-slate-200 text-[11px] leading-relaxed">
              When you click the button below, select your image folder. The app writes <strong>5-Star Ratings (Rating: 5, RatingPercent: 99)</strong>, <strong>Windows Details (XPTitle, XPKeywords)</strong>, <strong>IPTC IIM</strong>, and <strong>Adobe XMP</strong> directly into each file on disk. <strong>No individual files will be downloaded through your browser!</strong>
            </p>
            <div className="bg-[#0f1523] border border-[#23324d] rounded-lg p-2 text-[11px] text-[#42B4B5] font-mono">
              ✓ যে ফোল্ডারে ফাইল আছে ঠিক সেই ফাইলের ভেতরেই মেটাডাটা ও ৫-স্টার রেটিং সরাসরি সেভ হবে। ফাইলের কোয়ালিটি বা ফরম্যাট হুবহু অক্ষত থাকবে।
            </div>
          </div>

          {/* Progress / Status display */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl border-2 flex flex-col gap-2 ${
                isFinished
                  ? 'bg-emerald-950/70 border-emerald-500'
                  : 'bg-[#151c2c] border-[#293854]'
              }`}
            >
              <div className="flex items-center gap-2 text-white">
                {isEmbedding ? (
                  <Loader2 className="w-4 h-4 text-[#359FA0] animate-spin shrink-0" />
                ) : isFinished ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                )}
                <span className="font-bold text-xs">{statusMessage}</span>
              </div>

              {isEmbedding && (
                <div className="w-full bg-[#0b0f17] h-2.5 rounded-full overflow-hidden border border-[#2b3a56]">
                  <div
                    className="h-full bg-gradient-to-r from-[#359FA0] to-[#42B4B5] transition-all duration-200 shadow-[0_0_8px_#359FA0]"
                    style={{
                      width: `${(currentFileIndex / Math.max(1, validItems.length)) * 100}%`,
                    }}
                  />
                </div>
              )}

              {completedList.length > 0 && (
                <div className="max-h-36 overflow-y-auto bg-[#090d14] rounded-lg p-2.5 text-[11px] space-y-1.5 font-mono text-slate-200 border border-[#1e273a]">
                  {completedList.map((entry, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-1.5 ${
                        entry.startsWith('✓') ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      <FileCheck className="w-3.5 h-3.5 shrink-0" />
                      <span>{entry}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t-2 border-[#202c42] mt-4 flex-wrap gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#121826] hover:bg-[#1a2336] text-white text-xs font-bold rounded-xl border border-[#23314a] cursor-pointer"
          >
            {isFinished ? 'Close' : 'Cancel'}
          </button>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* 1-Click Embed & Download All in Single ZIP (No one-by-one downloads) */}
            <button
              type="button"
              disabled={isEmbedding || isDownloadingAll || validItems.length === 0}
              onClick={handleDownloadAllZip}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 hover:from-amber-500 hover:to-orange-500 border-2 border-amber-400 text-white text-xs font-black rounded-xl cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.5)] hover:shadow-[0_0_22px_rgba(245,158,11,0.7)] disabled:opacity-50"
              title="Download all media files packaged in a single ZIP archive (1-Click, no one-by-one downloads)"
            >
              {isDownloadingAll ? (
                <>
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                  <span>Packaging ZIP...</span>
                </>
              ) : (
                <>
                  <Archive className="w-4 h-4 text-white" />
                  <span>Embed & Download All (.ZIP)</span>
                </>
              )}
            </button>

            {/* Direct In-Place Folder Overwrite */}
            <button
              type="button"
              disabled={isEmbedding || isDownloadingAll || validItems.length === 0}
              onClick={handleDirectFolderOverwrite}
              className="flex items-center gap-2 px-4 py-2.5 btn-teal-gradient text-white text-xs font-black rounded-xl cursor-pointer shadow-[0_0_12px_rgba(53,159,160,0.4)] disabled:opacity-50"
            >
              {isEmbedding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Writing In-Place...</span>
                </>
              ) : (
                <>
                  <FolderSync className="w-4 h-4" />
                  <span>Save In-Place to Folder</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
