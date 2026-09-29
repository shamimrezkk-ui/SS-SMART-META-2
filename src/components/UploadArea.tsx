import React, { useRef, useState } from 'react';
import {
  CloudUpload,
  FolderOpen,
  Image as ImageIcon,
  GitFork,
  Film,
  Zap,
  Loader2,
  FolderSync,
} from 'lucide-react';
import { MediaType } from '../types';

interface UploadAreaProps {
  onFilesSelected: (files: FileList | File[], fileHandles?: any[]) => void;
  onProcessMetadata: () => void;
  isProcessing: boolean;
  hasWaitingItems: boolean;
  itemCount: number;
  onLoadSamples?: () => void;
}

export const UploadArea: React.FC<UploadAreaProps> = ({
  onFilesSelected,
  onProcessMetadata,
  isProcessing,
  hasWaitingItems,
  itemCount,
  onLoadSamples,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const [activeMediaType, setActiveMediaType] = useState<MediaType>('Images');
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
      e.target.value = '';
    }
  };

  // Modern browser File System Access API
  const handleOpenNativePicker = async () => {
    if ('showOpenFilePicker' in window) {
      try {
        const handles = await (window as any).showOpenFilePicker({
          multiple: true,
          types: [
            {
              description: 'Stock Media Images',
              accept: {
                'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.tiff', '.svg'],
              },
            },
          ],
        });

        const files: File[] = [];
        for (const h of handles) {
          const f = await h.getFile();
          files.push(f);
        }
        if (files.length > 0) {
          onFilesSelected(files, handles);
          return;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    fileInputRef.current?.click();
  };

  // Modern browser Folder Picker with direct File Handles
  const handleOpenFolderPicker = async () => {
    if ('showDirectoryPicker' in window) {
      try {
        const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        const files: File[] = [];
        const handles: any[] = [];
        for await (const entry of dirHandle.values()) {
          if (entry.kind === 'file') {
            const ext = entry.name.split('.').pop()?.toLowerCase();
            if (['jpg', 'jpeg', 'png', 'webp', 'tiff'].includes(ext || '')) {
              try {
                const f = await entry.getFile();
                files.push(f);
                handles.push(entry);
              } catch {}
            }
          }
        }
        if (files.length > 0) {
          onFilesSelected(files, handles);
          return;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    folderInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col items-center select-none pt-2 pb-2">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp,image/tiff,image/svg+xml"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Hidden folder input */}
      <input
        ref={folderInputRef}
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Outer Card with Sharp Solid Glowing Border Lines ("Dag Gulo Sposto") */}
      <div
        className={`w-full rounded-3xl border-2 transition-all p-4 md:p-6 shadow-2xl ${
          isDragOver
            ? 'border-[#FF0000] bg-[#160d12] shadow-[0_0_30px_rgba(255,0,0,0.45)]'
            : 'border-[#FF1A1A]/80 hover:border-[#FF1A1A] bg-[#101522] shadow-[0_0_20px_rgba(255,0,0,0.2)]'
        }`}
      >
        {/* Inner Dashed Border Box matching screenshot */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="w-full rounded-2xl border-2 border-dashed border-[#344766] hover:border-[#FF1A1A]/60 bg-[#0c1018]/90 transition-all p-6 md:p-8 flex flex-col items-center justify-center text-center"
        >
          {/* Upload Cloud Icon with Sharp Glowing Border */}
          <div className="w-14 h-14 rounded-2xl bg-[#1c1117] border-2 border-[#FF1A1A] flex items-center justify-center mb-3 shadow-[0_0_15px_rgba(255,0,0,0.35)]">
            <CloudUpload className="w-7 h-7 text-[#FF1A1A]" />
          </div>

          {/* Headings */}
          <h2 className="text-xl md:text-2xl font-black text-white mb-1.5 tracking-wide">
            Drop your images here or browse files
          </h2>
          <p className="text-xs text-slate-100 font-bold mb-1">
            JPG, PNG, WEBP, TIFF, SVG supported — batch 100+ files
          </p>
          <span className="text-[11px] tracking-wider text-slate-300 font-extrabold mb-5 uppercase">
            JPG • JPEG • PNG • WEBP • TIFF • SVG
          </span>

          {/* Browse Files and Select Folder Buttons with Clear Sharp Borders */}
          <div className="flex items-center gap-3 flex-wrap justify-center mb-6">
            <button
              type="button"
              onClick={handleOpenNativePicker}
              className="flex items-center gap-2 px-7 py-2.5 rounded-xl font-black text-xs text-white btn-red-gradient border border-[#ff6666] shadow-[0_0_18px_rgba(255,0,0,0.5)] hover:shadow-[0_0_25px_rgba(255,0,0,0.7)] cursor-pointer transition-all"
            >
              <FolderOpen className="w-4 h-4" />
              <span>Browse Files</span>
            </button>

            <button
              type="button"
              onClick={handleOpenFolderPicker}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-xs text-white bg-[#141b2c] hover:bg-[#1a243c] border-2 border-[#2b3a56] hover:border-[#FF1A1A] shadow-md transition-all cursor-pointer"
            >
              <FolderSync className="w-4 h-4 text-[#FF1A1A]" />
              <span>Select Folder</span>
            </button>

            {itemCount === 0 && onLoadSamples && (
              <button
                type="button"
                onClick={onLoadSamples}
                className="px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-[#161d2d] hover:bg-[#1f283c] border-2 border-[#2b364e] hover:border-slate-300 transition-colors cursor-pointer"
              >
                Load Sample Images
              </button>
            )}
          </div>

          {/* Media Selector Tabs: Images / Vectors / Videos with Sharp Border Outlines */}
          <div className="flex items-center gap-2 bg-[#0c1017] p-1.5 rounded-2xl border-2 border-[#24334c]">
            <button
              type="button"
              onClick={() => setActiveMediaType('Images')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border-1.5 ${
                activeMediaType === 'Images'
                  ? 'bg-[#1e1015] border-[#FF0000] text-[#FF1A1A] shadow-[0_0_10px_rgba(255,0,0,0.35)]'
                  : 'border-transparent text-slate-200 hover:text-white hover:border-[#2b3a56]'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-[#FF1A1A]" />
              <span>Images</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMediaType('Vectors')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border-1.5 ${
                activeMediaType === 'Vectors'
                  ? 'bg-[#1e1015] border-[#FF0000] text-[#FF1A1A] shadow-[0_0_10px_rgba(255,0,0,0.35)]'
                  : 'border-transparent text-slate-200 hover:text-white hover:border-[#2b3a56]'
              }`}
            >
              <GitFork className="w-3.5 h-3.5 text-[#FF1A1A]" />
              <span>Vectors</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMediaType('Videos')}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer border-1.5 ${
                activeMediaType === 'Videos'
                  ? 'bg-[#1e1015] border-[#FF0000] text-[#FF1A1A] shadow-[0_0_10px_rgba(255,0,0,0.35)]'
                  : 'border-transparent text-slate-200 hover:text-white hover:border-[#2b3a56]'
              }`}
            >
              <Film className="w-3.5 h-3.5 text-[#FF1A1A]" />
              <span>Videos</span>
            </button>
          </div>
        </div>
      </div>

      {/* Process Metadata Button with Glowing Sharp Border Line */}
      <div className="mt-4">
        <button
          type="button"
          disabled={isProcessing || itemCount === 0 || !hasWaitingItems}
          onClick={onProcessMetadata}
          className={`flex items-center gap-2.5 px-9 py-3 rounded-full text-sm font-black text-white transition-all cursor-pointer border-2 ${
            isProcessing
              ? 'bg-[#5e121a] border-[#8a1a25] cursor-not-allowed opacity-80'
              : itemCount === 0 || !hasWaitingItems
              ? 'bg-[#1a2130] text-slate-400 border-[#2b374c] cursor-not-allowed'
              : 'btn-red-gradient border-[#ff8888] shadow-[0_0_25px_rgba(255,0,0,0.6)] hover:shadow-[0_0_35px_rgba(255,0,0,0.85)]'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Processing Queue (1-by-1)...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 fill-white" />
              <span>Process Metadata</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
