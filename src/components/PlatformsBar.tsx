import React from 'react';
import { PlatformType } from '../types';
import {
  Circle,
  Camera,
  Diamond,
  Hexagon,
  Box,
  Zap,
  Square,
  Sparkles,
} from 'lucide-react';

interface PlatformsBarProps {
  selectedPlatform: PlatformType;
  onSelectPlatform: (platform: PlatformType) => void;
}

interface PlatformOption {
  id: PlatformType;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

export const PlatformsBar: React.FC<PlatformsBarProps> = ({
  selectedPlatform,
  onSelectPlatform,
}) => {
  const platforms: PlatformOption[] = [
    {
      id: 'General',
      label: 'General',
      icon: <Circle className="w-3.5 h-3.5" />,
    },
    {
      id: 'AdobeStock',
      label: 'AdobeStock',
      badge: 'St',
      icon: null,
    },
    {
      id: 'Magnific',
      label: 'Magnific',
      icon: <Sparkles className="w-3.5 h-3.5" />,
    },
    {
      id: 'Shutterstock',
      label: 'Shutterstock',
      icon: <Camera className="w-3.5 h-3.5" />,
    },
    {
      id: 'Vecteezy',
      label: 'Vecteezy',
      icon: <Diamond className="w-3.5 h-3.5" />,
    },
    {
      id: 'Depositphotos',
      label: 'Depositphotos',
      icon: <Hexagon className="w-3.5 h-3.5" />,
    },
    {
      id: '123RF',
      label: '123RF',
      icon: <Box className="w-3.5 h-3.5" />,
    },
    {
      id: 'Dreamstime',
      label: 'Dreamstime',
      icon: <Circle className="w-3.5 h-3.5 text-emerald-400" />,
    },
    {
      id: 'Freepik',
      label: 'Freepik',
      icon: <Zap className="w-3.5 h-3.5" />,
    },
    {
      id: 'iStock',
      label: 'iStock',
      icon: <Square className="w-3.5 h-3.5" />,
    },
  ];

  return (
    <div className="w-full flex flex-col items-center justify-center pt-2 pb-3 px-4 border-b-2 border-[#202c42] select-none">
      <div className="text-[11px] font-black tracking-widest text-[#FF1A1A] drop-shadow-[0_0_8px_rgba(255,0,0,0.6)] mb-2.5 uppercase">
        PLATFORMS
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5">
        {platforms.map((plat) => {
          const isSelected = selectedPlatform === plat.id;
          return (
            <button
              key={plat.id}
              type="button"
              onClick={() => onSelectPlatform(plat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all cursor-pointer border-2 ${
                isSelected
                  ? 'bg-[#1e1015] border-[#FF0000] text-white shadow-[0_0_14px_rgba(255,0,0,0.55)] scale-105'
                  : 'bg-[#101522] border-[#2b3a56] hover:border-slate-300 text-slate-100 hover:text-white'
              }`}
            >
              {plat.badge ? (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-sm ${
                    isSelected ? 'bg-[#FF0000] text-white' : 'bg-purple-600 text-white'
                  }`}
                >
                  {plat.badge}
                </span>
              ) : (
                plat.icon && (
                  <span className={isSelected ? 'text-[#FF1A1A]' : 'text-slate-300'}>
                    {plat.icon}
                  </span>
                )
              )}
              <span className="text-white font-bold">{plat.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
