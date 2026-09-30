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
  Download,
  ShieldCheck,
  Check,
  Sparkles,
} from 'lucide-react';
import { ImageItem, PlatformType } from '../types';
import { embedMetadataInBytes, downloadEmbeddedImage } from '../utils/metadataEmbedder';
import { titleToFilename } from '../utils/filenameHelper';

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
        setStatusMessage('Please select your source images folder to embed directly in-place...');
        const dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
        });

        setStatusMessage('Folder connected. Writing EXIF, IPTC, XMP directly into files in-place...');

        let count = 0;
        const doneNames: string[] = [];

        for (let i = 0; i < validItems.length; i++) {
          const item = validItems[i];
          setCurrentFileIndex(i + 1);

          const oldName = item.originalName || item.name;
          const targetName = renameFileWithTitle ? titleToFilename(item.title, item.name) : oldName;

          setStatusMessage(`Embedding metadata into "${oldName}" in-place...`);

          try {
            // Locate existing file handle in folder
            let sourceBuffer: ArrayBuffer | null = null;
            let fileFound = false;

            try {
              const oldHandle = await dirHandle.getFileHandle(oldName, { create: false });
              const f = await oldHandle.getFile();
              sourceBuffer = await f.arrayBuffer();
              fileFound = true;
            } catch {
              try {
                // Try targetName in case it was previously renamed
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

            // Fallback to in-memory originalFile if present
            if (!sourceBuffer && item.originalFile) {
              sourceBuffer = await item.originalFile.arrayBuffer();
              fileFound = true;
            }

            if (fileFound && sourceBuffer) {
              const uint8 = new Uint8Array(sourceBuffer);
              // Embed full metadata: EXIF (XP tags for Windows Explorer), IPTC IIM (8BIM for Adobe), XMP (Dublin Core)
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
                  type: item.format === 'PNG' ? 'image/png' : 'image/jpeg',
                })
              );
              await writable.close();

              // If name changed, remove the old file entry to prevent duplicates
              if (targetName !== oldName) {
                try {
                  await dirHandle.removeEntry(oldName);
                } catch {}
              }

              // Update state in app
              if (onUpdateItem) {
                onUpdateItem(item.id, { name: targetName, originalName: targetName });
              }

              count++;
              doneNames.push(
                renameFileWithTitle
                  ? `✓ "${oldName}" ➜ "${targetName}" [EXIF, IPTC & XMP Set In-Place]`
                  : `✓ "${oldName}" [EXIF, IPTC & XMP Saved Directly Inside File]`
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
          `Success! ${count} files updated in-place with Title, Description & Keywords. ZERO downloads!`
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

  // Direct batch download of image files with embedded metadata
  const handleDownloadAllImages = async () => {
    setIsDownloadingAll(true);
    setStatusMessage('Downloading images with embedded EXIF, IPTC & XMP metadata...');
    setCompletedCount(0);
    setCompletedList([]);
    setIsFinished(false);

    try {
      let count = 0;
      const doneNames: string[] = [];
      for (let i = 0; i < validItems.length; i++) {
        const item = validItems[i];
        setCurrentFileIndex(i + 1);
        setStatusMessage(`Embedding & saving "${item.name}" (${i + 1}/${validItems.length})...`);
        const targetName = await downloadEmbeddedImage(item);
        count++;
        doneNames.push(`✓ "${item.name}" ➜ "${targetName}" [Downloaded with EXIF, IPTC & XMP]`);
        if (onUpdateItem) {
          onUpdateItem(item.id, { name: targetName });
        }
        setCompletedCount(count);
        setCompletedList([...doneNames]);
        await new Promise((r) => setTimeout(r, 200));
      }
      setIsFinished(true);
      setStatusMessage(`Completed! ${count} image files downloaded with full embedded metadata.`);
    } catch (e: any) {
      setStatusMessage(`Download error: ${e?.message || 'Failed to download files'}`);
    } finally {
      setIsDownloadingAll(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#101522] border-2 border-[#FF0000] rounded-2xl max-w-xl w-full p-6 text-white shadow-[0_0_35px_rgba(255,0,0,0.35)] max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#202c42] mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#1d1017] border-2 border-[#FF0000] flex items-center justify-center text-[#FF1A1A] shadow-[0_0_12px_rgba(255,0,0,0.4)]">
              <Box className="w-5 h-5 text-[#FF1A1A]" />
            </div>
            <div>
              <h3 className="text-base font-black text-white tracking-wide">
                IN-PLACE METADATA & TITLE EMBEDDER
              </h3>
              <p className="text-xs text-slate-200 font-bold">
                Zero Downloads. Metadata & Title-synced filenames are saved directly in your folder.
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
              <span className="text-[#FF1A1A] font-black">{platform}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Ready Files:</span>
              <span className="text-emerald-400 font-black">{validItems.length} Files with Metadata</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300">Filename Option:</span>
              <label className="flex items-center gap-2 cursor-pointer select-none text-amber-300 hover:text-white">
                <input
                  type="checkbox"
                  checked={renameFileWithTitle}
                  onChange={(e) => setRenameFileWithTitle(e.target.checked)}
                  className="w-4 h-4 rounded border-[#344666] text-[#FF0000] focus:ring-0 accent-[#FF0000] cursor-pointer"
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
              <span className="text-cyan-400 font-black">EXIF (XPTitle, XPKeywords) + IPTC + XMP</span>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-3.5 rounded-xl bg-[#161d2d] border-2 border-[#283854] space-y-2">
            <div className="flex items-center gap-2 text-white font-black">
              <HardDrive className="w-4 h-4 text-[#FF1A1A]" />
              <span>Direct In-Place Execution (No Browser Downloads):</span>
            </div>
            <p className="text-slate-200 text-[11px] leading-relaxed">
              When you click the button below, select your image folder. The app writes <strong>Windows Details (XPTitle, XPKeywords, Comments)</strong>, <strong>IPTC IIM (8BIM)</strong>, and <strong>Adobe XMP</strong> directly into each file on disk. <strong>No file will be downloaded through your browser!</strong>
            </p>
            <div className="bg-[#0f1523] border border-[#23324d] rounded-lg p-2 text-[11px] text-emerald-300 font-mono">
              ✓ যে ফোল্ডারে ফাইল আছে ঠিক সেই ফাইলের ভেতরেই মেটাডাটা সরাসরি সেভ হবে। ফাইলের কোয়ালিটি বা ফরম্যাট হুবহু অক্ষত থাকবে।
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
                  <Loader2 className="w-4 h-4 text-[#FF1A1A] animate-spin shrink-0" />
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
                    className="h-full bg-gradient-to-r from-[#FF0000] to-[#FF4D4D] transition-all duration-200 shadow-[0_0_8px_#FF0000]"
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

          <div className="flex items-center gap-2">
            {/* Direct Download Files with Embedded Metadata */}
            <button
              type="button"
              disabled={isEmbedding || isDownloadingAll || validItems.length === 0}
              onClick={handleDownloadAllImages}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-[#0d1e17] border-2 border-emerald-500/80 hover:border-emerald-400 text-emerald-400 text-xs font-black rounded-xl cursor-pointer shadow-[0_0_10px_rgba(16,185,129,0.25)] disabled:opacity-50"
              title="Download image files directly with embedded metadata"
            >
              {isDownloadingAll ? (
                <>
                  <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                  <span>Downloading...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>Download All Images (Embedded)</span>
                </>
              )}
            </button>

            {/* Direct In-Place Folder Overwrite */}
            <button
              type="button"
              disabled={isEmbedding || isDownloadingAll || validItems.length === 0}
              onClick={handleDirectFolderOverwrite}
              className="flex items-center gap-2 px-5 py-2.5 btn-red-gradient text-white text-xs font-black rounded-xl cursor-pointer shadow-[0_0_15px_rgba(255,0,0,0.5)] disabled:opacity-50"
            >
              {isEmbedding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Writing In-Place...</span>
                </>
              ) : (
                <>
                  <FolderSync className="w-4 h-4" />
                  <span>Select Folder & Save In-Place</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
