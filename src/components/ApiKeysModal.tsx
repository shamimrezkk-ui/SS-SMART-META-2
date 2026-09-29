import React, { useState } from 'react';
import {
  Key,
  X,
  Eye,
  EyeOff,
  PlusCircle,
  KeyRound,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
} from 'lucide-react';
import { GeminiKey } from '../types';
import {
  maskKey,
  validateApiKey,
  saveStoredKeys,
  testGeminiApiKey,
} from '../utils/apiKeyManager';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  storedKeys: GeminiKey[];
  onKeysUpdated: (keys: GeminiKey[]) => void;
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({
  isOpen,
  onClose,
  storedKeys,
  onKeysUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'gemini' | 'openrouter'>('gemini');
  const [inputKey, setInputKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'idle' | 'testing' | 'connected' | 'not_connected'
  >(storedKeys.length > 0 ? 'connected' : 'not_connected');
  const [statusMessage, setStatusMessage] = useState<string>(
    storedKeys.length > 0 ? 'Connected' : 'Not Connected'
  );

  if (!isOpen) return null;

  const handleSaveKey = () => {
    setInputError(null);
    const validation = validateApiKey(inputKey, storedKeys);
    if (!validation.valid) {
      setInputError(validation.error || 'Invalid API key');
      return;
    }

    const trimmed = inputKey.trim();
    const newKey: GeminiKey = {
      id: `key_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      masked: maskKey(trimmed),
      fullKey: trimmed,
      addedAt: Date.now(),
      status: 'active',
    };

    const updated = [...storedKeys, newKey];
    onKeysUpdated(updated);
    saveStoredKeys(updated);
    setInputKey('');
    setConnectionStatus('connected');
    setStatusMessage('Connected');
  };

  const handleDeleteKey = (id: string) => {
    const updated = storedKeys.filter((k) => k.id !== id);
    onKeysUpdated(updated);
    saveStoredKeys(updated);
    if (updated.length === 0) {
      setConnectionStatus('not_connected');
      setStatusMessage('Not Connected');
    }
  };

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setStatusMessage('Testing...');

    // If input key is typed, test that, otherwise test the first stored key or server key
    const keyToTest = inputKey.trim() || (storedKeys.length > 0 ? storedKeys[0].fullKey : undefined);

    const result = await testGeminiApiKey(keyToTest);
    if (result.success) {
      setConnectionStatus('connected');
      setStatusMessage('CONNECTED');
    } else {
      setConnectionStatus('not_connected');
      setStatusMessage('NOT CONNECTED');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 select-none">
      <div className="bg-[#101522] border border-[#20293d] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-[#1b2234] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Key className="w-5 h-5 text-[#FF1A1A]" />
            <h2 className="text-base font-bold text-white tracking-wide">
              API Secrets Management
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#192233] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Provider Tabs */}
        <div className="px-5 pt-4 pb-2 border-b border-[#1b2234] flex items-center gap-2 bg-[#0c1017]">
          {/* Gemini Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('gemini')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'gemini'
                ? 'bg-[#1e1015] border-2 border-[#FF0000] text-white shadow-[0_0_12px_rgba(255,0,0,0.4)]'
                : 'bg-[#101522] border border-[#20293d] text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-4 h-4 rounded-full bg-[#FF0000] text-white flex items-center justify-center text-[10px] font-black">
              G
            </span>
            <span>Gemini</span>
          </button>

          {/* OpenRouter Tab (Under Maintenance) */}
          <button
            type="button"
            onClick={() => setActiveTab('openrouter')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              activeTab === 'openrouter'
                ? 'bg-[#1e1015] border-2 border-[#FF0000] text-white'
                : 'bg-[#101522] border-[#20293d] text-slate-400'
            }`}
          >
            <span className="text-[11px] font-mono">☍</span>
            <span>OpenRouter</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-amber-950/60 border border-amber-600/70 text-amber-400 font-bold">
              Under Maintenance
            </span>
          </button>
        </div>

        {/* Modal Body */}
        {activeTab === 'gemini' ? (
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left Column: CONFIGURATION */}
            <div className="space-y-4">
              <h3 className="text-xs font-black tracking-widest text-[#FF1A1A] drop-shadow-[0_0_6px_rgba(255,0,0,0.6)] uppercase">
                CONFIGURATION
              </h3>

              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  Add New API Key
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showKey ? 'text' : 'password'}
                      value={inputKey}
                      onChange={(e) => {
                        setInputKey(e.target.value);
                        setInputError(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveKey();
                      }}
                      placeholder="AIza..."
                      className={`w-full bg-[#0b0f17] border rounded-xl pl-3 pr-9 py-2 text-xs text-white placeholder-slate-400 font-bold focus:outline-hidden font-mono ${
                        inputError ? 'border-rose-500' : 'border-[#20293d] focus:border-[#FF0000]'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 hover:text-white cursor-pointer"
                      title={showKey ? 'Hide key' : 'Show key'}
                    >
                      {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveKey}
                    className="px-4 py-2 rounded-xl text-xs font-black text-white btn-red-gradient shadow-[0_0_10px_rgba(255,0,0,0.3)] cursor-pointer shrink-0"
                  >
                    Save
                  </button>
                </div>

                {inputError && (
                  <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1 font-bold">
                    <AlertCircle className="w-3 h-3" />
                    <span>{inputError}</span>
                  </p>
                )}
              </div>

              {/* Add Another Key Info / Action */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setInputKey('');
                    setInputError(null);
                  }}
                  className="flex items-center gap-1.5 text-xs font-black text-[#FF1A1A] hover:text-[#FF4D4D] transition-colors cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>+ Add Another Key</span>
                </button>
                <p className="text-[10px] text-slate-200 font-semibold mt-1 leading-relaxed">
                  Support multiple keys! The queue automatically rotates 1-by-1 sequentially across all keys with rate-limit recovery.
                </p>
              </div>

              {/* Get API Key from Google */}
              <div className="pt-2">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[#FF0000]/70 text-xs font-black text-[#FF1A1A] bg-[#1a0f14] hover:bg-[#FF0000] hover:text-white transition-all shadow-[0_0_10px_rgba(255,0,0,0.2)] cursor-pointer"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Get API Key from Google</span>
                  <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                </a>
              </div>
            </div>

            {/* Right Column: STORED KEYS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black tracking-widest text-white uppercase">
                  STORED KEYS
                </h3>
                {storedKeys.length > 0 && (
                  <span className="text-[10px] text-[#FF1A1A] font-black">
                    {storedKeys.length} {storedKeys.length === 1 ? 'Key' : 'Keys'} Available
                  </span>
                )}
              </div>

              {/* Stored Keys Container */}
              <div className="bg-[#0b0f17] border border-[#20293d] rounded-xl p-3 min-h-[190px] max-h-[220px] overflow-y-auto flex flex-col justify-center">
                {storedKeys.length === 0 ? (
                  <div className="flex flex-col items-center justify-center text-center p-4">
                    <div className="w-10 h-10 rounded-full bg-[#151c2a] flex items-center justify-center text-slate-300 mb-2">
                      <Key className="w-5 h-5 line-through opacity-70" />
                    </div>
                    <span className="text-xs font-black text-white mb-1">
                      No Key Connected
                    </span>
                    <p className="text-[11px] text-slate-200 font-bold max-w-[200px]">
                      Enter your Google Gemini API key and click Save to connect
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 w-full my-auto">
                    {storedKeys.map((keyItem, index) => {
                      const isRateLimited =
                        keyItem.rateLimitedUntil && keyItem.rateLimitedUntil > Date.now();
                      return (
                        <div
                          key={keyItem.id}
                          className="bg-[#101522] border border-[#20293d] rounded-lg p-2.5 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-[#1d1217] border border-[#FF0000]/60 text-[#FF1A1A] flex items-center justify-center text-[10px] font-black">
                              {index + 1}
                            </span>
                            <div>
                              <div className="font-mono text-white font-black">
                                {keyItem.masked}
                              </div>
                              <div className="text-[9px] text-slate-300 flex items-center gap-1.5 mt-0.5">
                                {isRateLimited ? (
                                  <span className="text-amber-400 font-bold">
                                    Cooldown active
                                  </span>
                                ) : (
                                  <span className="text-emerald-400 font-bold">
                                    Ready in rotation
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteKey(keyItem.id)}
                            className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-[#1f1015] transition-colors cursor-pointer"
                            title="Remove Key"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* OpenRouter Tab Maintenance Screen */
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-950/40 border border-amber-600/60 flex items-center justify-center text-amber-400 shadow-[0_0_15px_rgba(217,119,6,0.3)]">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-white">OpenRouter Integration</h3>
            <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-950/80 border border-amber-500/80 text-amber-400">
              Under Maintenance
            </span>
            <p className="text-xs text-slate-200 font-bold max-w-md">
              The OpenRouter provider gateway is currently undergoing scheduled platform maintenance. Please switch to the Gemini tab to use your Gemini API keys for seamless sequential metadata generation.
            </p>
          </div>
        )}

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-[#1b2234] bg-[#0c1017] flex items-center justify-between">
          {/* Connection Status indicator */}
          <div className="flex items-center gap-2 text-xs font-bold">
            <span className="text-white font-bold">Status:</span>
            <div className="flex items-center gap-1.5">
              {connectionStatus === 'testing' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                  <span className="font-black text-amber-400">{statusMessage}</span>
                </>
              ) : connectionStatus === 'connected' ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
                  <span className="font-black text-emerald-400">{statusMessage}</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="font-black text-slate-200">{statusMessage}</span>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={connectionStatus === 'testing'}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-[#101522] border border-[#20293d] hover:border-slate-400 text-white transition-colors cursor-pointer"
            >
              Test Connection
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl text-xs font-black text-white btn-red-gradient shadow-[0_0_10px_rgba(255,0,0,0.35)] cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
