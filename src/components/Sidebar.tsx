import React from 'react';
import {
  Key,
  Code,
  Image as ImageIcon,
  Sliders,
  Droplets,
  Contrast,
  Type as TypeIcon,
  HelpCircle,
  Info,
  Plus,
  Minus,
} from 'lucide-react';
import { AppSettings } from '../types';

interface SidebarProps {
  onOpenApiKeys: () => void;
  activeTab: 'metadata' | 'imageToPrompt';
  onTabChange: (tab: 'metadata' | 'imageToPrompt') => void;
  settings: AppSettings;
  onUpdateSettings: (settings: Partial<AppSettings>) => void;
  onOpenHelp: () => void;
  storedKeyCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onOpenApiKeys,
  activeTab,
  onTabChange,
  settings,
  onUpdateSettings,
  onOpenHelp,
  storedKeyCount,
}) => {
  return (
    <aside className="w-80 shrink-0 bg-[#0d121c] border-r-2 border-[#24334c] flex flex-col h-[calc(100vh-53px)] overflow-y-auto p-3.5 space-y-4 select-none">
      {/* 1. API Keys Banner / Configure with Sharp Visible Border */}
      <div className="bg-[#101522] border-2 border-[#283854] hover:border-[#FF0000]/70 rounded-2xl p-3 flex items-center justify-between shadow-md transition-all">
        <div className="flex items-center gap-2.5">
          <Key className="w-4 h-4 text-[#FF1A1A]" />
          <span className="text-xs font-black text-white tracking-wide">API Keys</span>
          {storedKeyCount > 0 && (
            <span className="text-[10px] bg-[#221015] border border-[#FF0000] text-[#FF1A1A] px-2 py-0.5 rounded-full font-black shadow-[0_0_6px_rgba(255,0,0,0.4)]">
              {storedKeyCount} Active
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onOpenApiKeys}
          className="px-3.5 py-1.5 rounded-full text-xs font-black bg-[#1a0f14] border-1.5 border-[#FF0000] text-[#FF1A1A] hover:bg-[#FF0000] hover:text-white transition-all shadow-[0_0_10px_rgba(255,0,0,0.35)] cursor-pointer"
        >
          Configure
        </button>
      </div>

      {/* 2. Main Tabs: METADATA & IMAGE TO PROMPT with Clear Border Lines */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => onTabChange('metadata')}
          className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl text-xs font-black tracking-wider transition-all cursor-pointer ${
            activeTab === 'metadata'
              ? 'bg-[#1a0f14] border-2 border-[#FF0000] text-[#FF1A1A] shadow-[0_0_15px_rgba(255,0,0,0.4)]'
              : 'bg-[#101522] border-2 border-[#24334c] text-slate-200 hover:border-slate-400 hover:text-white'
          }`}
        >
          <Code className="w-4 h-4 mb-1 text-[#FF1A1A]" />
          <span>METADATA</span>
        </button>

        <button
          type="button"
          onClick={() => onTabChange('imageToPrompt')}
          className={`flex flex-col items-center justify-center py-3 px-2 rounded-2xl text-xs font-black tracking-wider transition-all cursor-pointer ${
            activeTab === 'imageToPrompt'
              ? 'bg-[#1a0f14] border-2 border-[#FF0000] text-[#FF1A1A] shadow-[0_0_15px_rgba(255,0,0,0.4)]'
              : 'bg-[#101522] border-2 border-[#24334c] text-slate-200 hover:border-slate-400 hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4 mb-1 text-[#FF1A1A]" />
          <span>IMAGE TO PROMPT</span>
        </button>
      </div>

      {/* 3. Settings Card with Prominent Visible Border Lines */}
      <div className="bg-[#101522] border-2 border-[#283854] rounded-2xl p-4 space-y-4 shadow-lg">
        {/* Settings Header with Toggle */}
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#202c42]">
          <div className="flex items-center gap-2 text-white text-xs font-black">
            <Sliders className="w-4 h-4 text-[#FF1A1A]" />
            <span className="tracking-wide">Settings</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdateSettings({ settingsActive: !settings.settingsActive })}
              className={`w-10 h-5.5 rounded-full p-0.5 border-1.5 transition-all cursor-pointer flex items-center ${
                settings.settingsActive
                  ? 'bg-[#FF0000] border-[#FF4D4D] shadow-[0_0_10px_rgba(255,0,0,0.6)]'
                  : 'bg-[#1b2436] border-[#31415f]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.settingsActive ? 'translate-x-4.5' : 'translate-x-0'
                }`}
              />
            </button>
            <span className="text-[10px] font-black text-white min-w-[24px]">
              {settings.settingsActive ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Title Words Range Slider with Clear Lines & Kom-Beshi Buttons */}
        <div className="bg-[#0b0f17] border-1.5 border-[#24334c] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white font-black flex items-center gap-1.5">
              Title Words
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#1d1016] border border-[#FF0000] text-[#FF1A1A] font-black text-[11px] shadow-[0_0_8px_rgba(255,0,0,0.3)]">
              {settings.titleWordsMin} - {settings.titleWordsMax}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Min Title Words */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-200 font-bold">
                <span>Min: <strong className="text-white">{settings.titleWordsMin}</strong></span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        titleWordsMin: Math.max(5, settings.titleWordsMin - 1),
                      })
                    }
                    className="w-4 h-4 rounded bg-[#162032] border border-[#304160] hover:border-[#FF0000] text-white flex items-center justify-center cursor-pointer text-[10px]"
                    title="Decrease Min"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        titleWordsMin: Math.min(settings.titleWordsMax, settings.titleWordsMin + 1),
                      })
                    }
                    className="w-4 h-4 rounded bg-[#162032] border border-[#304160] hover:border-[#FF0000] text-white flex items-center justify-center cursor-pointer text-[10px]"
                    title="Increase Min"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="5"
                max="50"
                value={settings.titleWordsMin}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onUpdateSettings({
                    titleWordsMin: Math.min(val, settings.titleWordsMax),
                  });
                }}
                className="w-full"
              />
            </div>

            {/* Max Title Words */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-200 font-bold">
                <span>Max: <strong className="text-white">{settings.titleWordsMax}</strong></span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        titleWordsMax: Math.max(settings.titleWordsMin, settings.titleWordsMax - 1),
                      })
                    }
                    className="w-4 h-4 rounded bg-[#162032] border border-[#304160] hover:border-[#FF0000] text-white flex items-center justify-center cursor-pointer text-[10px]"
                    title="Decrease Max"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        titleWordsMax: Math.min(120, settings.titleWordsMax + 1),
                      })
                    }
                    className="w-4 h-4 rounded bg-[#162032] border border-[#304160] hover:border-[#FF0000] text-white flex items-center justify-center cursor-pointer text-[10px]"
                    title="Increase Max"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                value={settings.titleWordsMax}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onUpdateSettings({
                    titleWordsMax: Math.max(val, settings.titleWordsMin),
                  });
                }}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Keywords Range Slider with Clear Lines & Kom-Beshi Buttons */}
        <div className="bg-[#0b0f17] border-1.5 border-[#24334c] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white font-black flex items-center gap-1.5">
              Keywords
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#1d1016] border border-[#FF0000] text-[#FF1A1A] font-black text-[11px] shadow-[0_0_8px_rgba(255,0,0,0.3)]">
              {settings.keywordsMin} - {settings.keywordsMax}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Min Keywords */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-200 font-bold">
                <span>Min: <strong className="text-white">{settings.keywordsMin}</strong></span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        keywordsMin: Math.max(10, settings.keywordsMin - 1),
                      })
                    }
                    className="w-4 h-4 rounded bg-[#162032] border border-[#304160] hover:border-[#FF0000] text-white flex items-center justify-center cursor-pointer text-[10px]"
                    title="Decrease Min"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        keywordsMin: Math.min(settings.keywordsMax, settings.keywordsMin + 1),
                      })
                    }
                    className="w-4 h-4 rounded bg-[#162032] border border-[#304160] hover:border-[#FF0000] text-white flex items-center justify-center cursor-pointer text-[10px]"
                    title="Increase Min"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                value={settings.keywordsMin}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onUpdateSettings({
                    keywordsMin: Math.min(val, settings.keywordsMax),
                  });
                }}
                className="w-full"
              />
            </div>

            {/* Max Keywords */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-200 font-bold">
                <span>Max: <strong className="text-white">{settings.keywordsMax}</strong></span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        keywordsMax: Math.max(settings.keywordsMin, settings.keywordsMax - 1),
                      })
                    }
                    className="w-4 h-4 rounded bg-[#162032] border border-[#304160] hover:border-[#FF0000] text-white flex items-center justify-center cursor-pointer text-[10px]"
                    title="Decrease Max"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        keywordsMax: Math.min(50, settings.keywordsMax + 1),
                      })
                    }
                    className="w-4 h-4 rounded bg-[#162032] border border-[#304160] hover:border-[#FF0000] text-white flex items-center justify-center cursor-pointer text-[10px]"
                    title="Increase Max"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="20"
                max="50"
                value={settings.keywordsMax}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onUpdateSettings({
                    keywordsMax: Math.max(val, settings.keywordsMin),
                  });
                }}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Description Range Slider with Clear Lines & Kom-Beshi Buttons */}
        <div className="bg-[#0b0f17] border-1.5 border-[#24334c] rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white font-black flex items-center gap-1.5">
              Description
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#1d1016] border border-[#FF0000] text-[#FF1A1A] font-black text-[11px] shadow-[0_0_8px_rgba(255,0,0,0.3)]">
              {settings.descriptionMin} - {settings.descriptionMax}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 pt-1">
            {/* Min Description */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-200 font-bold">
                <span>Min: <strong className="text-white">{settings.descriptionMin}</strong></span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        descriptionMin: Math.max(50, settings.descriptionMin - 10),
                      })
                    }
                    className="w-4 h-4 rounded bg-[#162032] border border-[#304160] hover:border-[#FF0000] text-white flex items-center justify-center cursor-pointer text-[10px]"
                    title="Decrease Min"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        descriptionMin: Math.min(settings.descriptionMax, settings.descriptionMin + 10),
                      })
                    }
                    className="w-4 h-4 rounded bg-[#162032] border border-[#304160] hover:border-[#FF0000] text-white flex items-center justify-center cursor-pointer text-[10px]"
                    title="Increase Min"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                value={settings.descriptionMin}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onUpdateSettings({
                    descriptionMin: Math.min(val, settings.descriptionMax),
                  });
                }}
                className="w-full"
              />
            </div>

            {/* Max Description */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] text-slate-200 font-bold">
                <span>Max: <strong className="text-white">{settings.descriptionMax}</strong></span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        descriptionMax: Math.max(settings.descriptionMin, settings.descriptionMax - 10),
                      })
                    }
                    className="w-4 h-4 rounded bg-[#162032] border border-[#304160] hover:border-[#FF0000] text-white flex items-center justify-center cursor-pointer text-[10px]"
                    title="Decrease Max"
                  >
                    <Minus className="w-2.5 h-2.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSettings({
                        descriptionMax: Math.min(500, settings.descriptionMax + 10),
                      })
                    }
                    className="w-4 h-4 rounded bg-[#162032] border border-[#304160] hover:border-[#FF0000] text-white flex items-center justify-center cursor-pointer text-[10px]"
                    title="Increase Max"
                  >
                    <Plus className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min="100"
                max="500"
                value={settings.descriptionMax}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  onUpdateSettings({
                    descriptionMax: Math.max(val, settings.descriptionMin),
                  });
                }}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Custom Prompt Override with Prominent Border */}
        <div className="space-y-1.5 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white font-black">Custom Prompt Override</span>
            <span className="text-[10px] text-slate-300 font-bold">Optional</span>
          </div>
          <textarea
            rows={2}
            value={settings.customPrompt}
            onChange={(e) => onUpdateSettings({ customPrompt: e.target.value })}
            placeholder="e.g. Focus on commercial minimalism..."
            className="w-full bg-[#0b0f17] border-2 border-[#283854] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 font-bold focus:outline-hidden focus:border-[#FF0000] focus:shadow-[0_0_10px_rgba(255,0,0,0.35)] resize-none"
          />
        </div>
      </div>

      {/* 4. Bottom Preset Pill Toggles with Sharp Clear Borders */}
      <div className="space-y-2.5">
        {/* Transparent Background */}
        <div
          onClick={() =>
            onUpdateSettings({ transparentBackground: !settings.transparentBackground })
          }
          className={`rounded-2xl p-3 flex items-center justify-between transition-all cursor-pointer ${
            settings.transparentBackground
              ? 'bg-[#181119] border-2 border-[#FF0000] shadow-[0_0_12px_rgba(255,0,0,0.3)]'
              : 'bg-[#101522] border-2 border-[#283854] hover:border-slate-400'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-black text-white">
            <Droplets className="w-4 h-4 text-[#FF1A1A]" />
            <span>Transparent Background</span>
            <span title="Optimizes metadata for PNG/cutouts">
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-5 rounded-full p-0.5 border-1.5 transition-colors flex items-center ${
                settings.transparentBackground
                  ? 'bg-[#FF0000] border-[#FF4D4D]'
                  : 'bg-[#1b2436] border-[#31415f]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.transparentBackground ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="text-[10px] font-black text-white min-w-[20px]">
              {settings.transparentBackground ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Silhouette */}
        <div
          onClick={() => onUpdateSettings({ silhouette: !settings.silhouette })}
          className={`rounded-2xl p-3 flex items-center justify-between transition-all cursor-pointer ${
            settings.silhouette
              ? 'bg-[#181119] border-2 border-[#FF0000] shadow-[0_0_12px_rgba(255,0,0,0.3)]'
              : 'bg-[#101522] border-2 border-[#283854] hover:border-slate-400'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-black text-white">
            <Contrast className="w-4 h-4 text-[#FF1A1A]" />
            <span>Silhouette</span>
            <span title="Tags shadow, outline and silhouette aesthetics">
              <Info className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-5 rounded-full p-0.5 border-1.5 transition-colors flex items-center ${
                settings.silhouette
                  ? 'bg-[#FF0000] border-[#FF4D4D]'
                  : 'bg-[#1b2436] border-[#31415f]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.silhouette ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="text-[10px] font-black text-white min-w-[20px]">
              {settings.silhouette ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {/* Single-Word Keywords */}
        <div
          onClick={() =>
            onUpdateSettings({ singleWordKeywords: !settings.singleWordKeywords })
          }
          className={`rounded-2xl p-3 flex items-center justify-between transition-all cursor-pointer ${
            settings.singleWordKeywords
              ? 'bg-[#181119] border-2 border-[#FF0000] shadow-[0_0_12px_rgba(255,0,0,0.3)]'
              : 'bg-[#101522] border-2 border-[#283854] hover:border-slate-400'
          }`}
        >
          <div className="flex items-center gap-2 text-xs font-black text-white">
            <TypeIcon className="w-4 h-4 text-[#FF1A1A]" />
            <span>Single-Word Keywords</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className={`w-9 h-5 rounded-full p-0.5 border-1.5 transition-colors flex items-center ${
                settings.singleWordKeywords
                  ? 'bg-[#FF0000] border-[#FF4D4D]'
                  : 'bg-[#1b2436] border-[#31415f]'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-white transition-transform ${
                  settings.singleWordKeywords ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="text-[10px] font-black text-white min-w-[20px]">
              {settings.singleWordKeywords ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>
      </div>

      {/* 5. Help & Tutorial Button with Sharp Border */}
      <button
        type="button"
        onClick={onOpenHelp}
        className="w-full flex items-center justify-center gap-2 py-3 px-3 rounded-2xl text-xs font-black text-white bg-[#101522] hover:bg-[#161e30] border-2 border-[#283854] hover:border-[#FF0000] transition-all cursor-pointer shadow-md mt-auto"
      >
        <HelpCircle className="w-4 h-4 text-[#FF1A1A]" />
        <span>Help & Tutorial Guide</span>
      </button>
    </aside>
  );
};
