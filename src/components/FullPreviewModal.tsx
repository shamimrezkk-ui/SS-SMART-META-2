import React from 'react';
import { X, Download, Tag, FileText, Info, Maximize2 } from 'lucide-react';
import { ImageItem } from '../types';
import { downloadEmbeddedImage } from '../utils/metadataEmbedder';

interface FullPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ImageItem | null;
}

export const FullPreviewModal: React.FC<FullPreviewModalProps> = ({
  isOpen,
  onClose,
  item,
}) => {
  if (!isOpen || !item) return null;

  const isVideo =
    ['MP4', 'WEBM', 'MOV', 'VIDEO'].includes(item.format?.toUpperCase()) ||
    Boolean(item.mimeType?.startsWith('video/')) ||
    Boolean(item.name.match(/\.(mp4|webm|mov)$/i));

  const isVector =
    ['SVG', 'EPS', 'AI', 'VECTOR'].includes(item.format?.toUpperCase()) ||
    Boolean(item.name.match(/\.(svg|eps|ai)$/i));

  const [backdrop, setBackdrop] = React.useState<'dark' | 'white' | 'checker' | 'studio'>(
    isVector ? 'white' : 'dark'
  );

  React.useEffect(() => {
    if (isVector) {
      setBackdrop('white');
    }
  }, [isVector]);

  const getBackdropStyle = () => {
    if (backdrop === 'white') {
      return { backgroundColor: '#FFFFFF' };
    }
    if (backdrop === 'studio') {
      return { backgroundColor: '#E2E8F0' };
    }
    if (backdrop === 'checker') {
      return {
        backgroundColor: '#1e293b',
        backgroundImage:
          'linear-gradient(45deg, #334155 25%, transparent 25%), linear-gradient(-45deg, #334155 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #334155 75%), linear-gradient(-45deg, transparent 75%, #334155 75%)',
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
      };
    }
    return { backgroundColor: 'rgba(0,0,0,0.8)' };
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const handleDownload = async () => {
    try {
      await downloadEmbeddedImage(item);
    } catch (e: any) {
      alert(`Download error: ${e?.message || 'Failed'}`);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl max-h-[92vh] bg-[#0c1018] border-2 border-[#2b3a56] rounded-3xl overflow-hidden shadow-2xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-[#1c2638] bg-[#101522]">
          <div className="flex items-center gap-3">
            <span
              className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
                isVideo
                  ? 'bg-purple-950/80 border-purple-500/80 text-purple-300'
                  : isVector
                  ? 'bg-amber-950/80 border-amber-500/80 text-amber-300'
                  : 'bg-emerald-950/80 border-emerald-500/80 text-emerald-300'
              }`}
            >
              {isVideo ? 'VIDEO PREVIEW' : isVector ? 'VECTOR PREVIEW' : 'IMAGE PREVIEW'}
            </span>
            <h3 className="text-sm md:text-base font-black text-white truncate max-w-md">
              {item.name}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black text-white btn-red-gradient shadow-[0_0_12px_rgba(255,0,0,0.4)] cursor-pointer hover:shadow-[0_0_18px_rgba(255,0,0,0.6)]"
              title="Download this file with embedded metadata and title-based filename"
            >
              <Download className="w-4 h-4" />
              <span>Save File</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-[#182133] hover:bg-rose-950/80 border-2 border-[#263550] hover:border-rose-500 text-slate-300 hover:text-rose-300 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Media Preview Stage */}
        <div className="flex-1 overflow-auto p-4 md:p-6 flex flex-col md:flex-row gap-6 items-center justify-center bg-[#07090e]">
          {/* Media Viewport with Ready-Made Backdrop Switcher for Transparent Assets */}
          <div
            className="flex-1 w-full flex items-center justify-center min-h-[300px] md:min-h-[440px] max-h-[60vh] rounded-2xl border-2 border-[#1c2638] overflow-hidden p-3 relative transition-colors duration-150"
            style={getBackdropStyle()}
          >
            {/* Backdrop Switcher (PREVIEW ONLY) */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-1 bg-black/80 backdrop-blur-xs border border-white/20 rounded-lg p-1 shadow-lg">
              <span className="text-[10px] text-slate-300 font-bold px-1 hidden sm:inline">Backdrop:</span>
              <button
                type="button"
                onClick={() => setBackdrop('dark')}
                className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer transition-all ${
                  backdrop === 'dark' ? 'bg-[#359FA0] text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Dark Theme"
              >
                Dark
              </button>
              <button
                type="button"
                onClick={() => setBackdrop('white')}
                className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer transition-all ${
                  backdrop === 'white' ? 'bg-[#359FA0] text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Studio White (Best for Transparent Cut-outs)"
              >
                White
              </button>
              <button
                type="button"
                onClick={() => setBackdrop('checker')}
                className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer transition-all ${
                  backdrop === 'checker' ? 'bg-[#359FA0] text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Transparency Checkerboard"
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setBackdrop('studio')}
                className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer transition-all ${
                  backdrop === 'studio' ? 'bg-[#359FA0] text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Neutral Studio Gray"
              >
                Gray
              </button>
            </div>

            {isVideo ? (
              <video
                src={item.previewUrl}
                controls
                autoPlay
                playsInline
                className="max-h-[56vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
            ) : (
              <img
                src={item.previewUrl}
                alt={item.title || item.name}
                className="max-h-[56vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
            )}
          </div>

          {/* Details Sidebar in Modal */}
          <div className="w-full md:w-80 shrink-0 flex flex-col gap-3 bg-[#101522] border-2 border-[#202c42] rounded-2xl p-4 text-xs">
            <div>
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">
                COMMERCIAL TITLE
              </span>
              <p className="font-bold text-white text-sm mt-0.5 leading-snug">
                {item.title || 'Metadata not yet generated'}
              </p>
            </div>

            {item.description && (
              <div>
                <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">
                  DESCRIPTION
                </span>
                <p className="font-medium text-slate-200 text-xs mt-0.5 leading-relaxed max-h-24 overflow-y-auto">
                  {item.description}
                </p>
              </div>
            )}

            <div>
              <span className="text-[10px] font-black uppercase text-slate-300 tracking-wider">
                KEYWORDS ({item.keywords?.length || 0})
              </span>
              <div className="flex flex-wrap gap-1 mt-1 max-h-32 overflow-y-auto pr-1">
                {item.keywords && item.keywords.length > 0 ? (
                  item.keywords.map((kw, i) => (
                    <span
                      key={i}
                      className="px-2 py-0.5 rounded-md bg-[#0b0f17] border border-[#263550] text-[10px] font-bold text-slate-200"
                    >
                      {kw}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500 italic">No keywords yet</span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t-2 border-[#1c2638] flex flex-col gap-1 text-[11px] text-slate-300 font-bold">
              <div className="flex justify-between">
                <span>Format:</span>
                <strong className="text-white">{item.format}</strong>
              </div>
              <div className="flex justify-between">
                <span>File Size:</span>
                <strong className="text-white">{formatSize(item.size)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Embedded Tags:</span>
                <strong className="text-emerald-400">EXIF + IPTC + XMP</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
