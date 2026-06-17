import React, { useState } from 'react';
import { 
  ShieldCheck, Download, Trash2, CheckCircle2, 
  WifiOff, Volume2, Bell, AlertTriangle, Layers, Save, HelpCircle
} from 'lucide-react';
import { VideoMetadata, AccessLog } from '../types';

interface SettingsPanelProps {
  userEmail: string;
  userId: string;
  videos: VideoMetadata[];
  logs: AccessLog[];
  isOfflineMode: boolean;
  onToggleOfflineMode: (offline: boolean) => void;
  mfaEnabled: boolean;
  onOpenMfaSetup: () => void;
  onDisableMfa: () => void;
  onPurgePersonalLogs: () => Promise<void>;
}

export default function SettingsPanel({
  userEmail,
  userId,
  videos,
  logs,
  isOfflineMode,
  onToggleOfflineMode,
  mfaEnabled,
  onOpenMfaSetup,
  onDisableMfa,
  onPurgePersonalLogs
}: SettingsPanelProps) {
  const [showComplianceToast, setShowComplianceToast] = useState(false);
  const [complianceActionText, setComplianceActionText] = useState('');
  
  // Notification subscriptions
  const [subscriptions, setSubscriptions] = useState({
    Classical: true,
    Mass: true,
    Educational: true,
    Comedy: false,
    Tragedy: false,
    Devotional: true,
    folderAlerts: true
  });

  const handleSubToggle = (key: keyof typeof subscriptions) => {
    setSubscriptions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Export GDPR JSON
  const handleExportGDPR = () => {
    const userLogs = logs.filter(l => l.userId === userId);
    const dataToExport = {
      complianceStandard: "GDPR (Article 15) & CCPA Portability Report",
      generatedAt: new Date().toISOString(),
      user: {
        id: userId,
        email: userEmail,
        vaultMfaSecured: mfaEnabled
      },
      auditTrails: userLogs,
      cachedVideosMetadata: videos.filter(v => v.ownerId === userId)
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataToExport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `GDPR_Portability_Trace_Report_${userId}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    triggerToast('GDPR personal payload exported. Your data is prepared according to strict global compliance protocols.');
  };

  const triggerToast = (text: string) => {
    setComplianceActionText(text);
    setShowComplianceToast(true);
    setTimeout(() => {
      setShowComplianceToast(false);
    }, 4500);
  };

  const handlePurge = async () => {
    if (confirm("Are you absolutely sure you want to trigger GDPR Article 17 (Right to be Forgotten)? \n\nThis will instantly wipe your access trace history, likes records, and authentication metadata from our network servers. This is irreversible.")) {
      await onPurgePersonalLogs();
      triggerToast('GDPR logs successfully purged from server collections.');
    }
  };

  return (
    <div id="settings-panel-container" className="bg-[#1E293B] border border-slate-705 rounded-lg p-4 text-slate-100 shadow-xl space-y-5">
      
      {/* Toast Notification for privacy changes */}
      {showComplianceToast && (
        <div className="fixed bottom-6 right-6 max-w-sm bg-indigo-650 border border-indigo-500 rounded p-4 shadow-2xl z-50 flex items-start gap-2.5 animate-bounce">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-white leading-relaxed">{complianceActionText}</p>
        </div>
      )}

      {/* Header */}
      <div>
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-350">Privacy & Vault Configuration</h3>
        <p className="text-xs text-slate-400">Exercise statutory access controls and toggle local offline states.</p>
      </div>

      <div className="h-px bg-slate-700"></div>

      {/* GDPR CCPA Compliance tools */}
      <div className="bg-[#0F172A] p-4 border border-slate-700 rounded space-y-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <div>
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Global Privacy Shield Compliance</h4>
            <p className="text-[10px] text-slate-500 font-mono">We keep metadata under strict compliance with EU-GDPR standards & CalOPPA regulations.</p>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed font-sans">
          As a private tenant, you hold structural ownership over your decryption logs and keys. Access audit coordinates can be purged or downloaded below according to global right-to-portability and deletion provisions.
        </p>

        <div className="flex flex-wrap gap-2 pt-1.5">
          <button
            type="button"
            onClick={handleExportGDPR}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1E293B] border border-slate-700 hover:bg-slate-700 rounded text-xs text-slate-200 transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-indigo-400" />
            <span>GDPR Export Portable Data</span>
          </button>

          <button
            type="button"
            onClick={handlePurge}
            className="flex items-center gap-2 px-3 py-1.5 bg-[#1E293B] border border-slate-705 hover:bg-rose-955/20 rounded text-xs text-rose-400 hover:text-rose-350 transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-rose-500" />
            <span>GDPR Purge Logs (Right to be Forgotten)</span>
          </button>
        </div>
      </div>

      {/* Offline Mode Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        <div className="bg-[#0F172A] p-4 border border-slate-700 rounded flex items-start gap-4">
          <div className={`p-2 rounded ${isOfflineMode ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'}`}>
            <WifiOff className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex justify-between items-center">
              <p className="text-xs font-extrabold uppercase tracking-wider text-slate-350">Offline Caching Mode</p>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={isOfflineMode} 
                  onChange={(e) => onToggleOfflineMode(e.target.checked)}
                  className="sr-only peer" 
                />
                <div className="w-8 h-4 bg-slate-800 rounded peer peer-checked:bg-amber-500 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-200 after:rounded after:h-3 after:w-3 after:transition-all"></div>
              </label>
            </div>
            <p className="text-[11px] text-slate-400 leading-normal font-sans">
              When toggled, playback relies entirely on decrypted raw blobs cached directly inside your local IndexedDB compartment, bypassing external server handshakes for completely offline transport.
            </p>
          </div>
        </div>

        {/* Multi-Factor Secure Panel */}
        <div className="bg-[#0F172A] p-4 border border-slate-700 rounded flex items-start gap-4">
          <div className={`p-2 rounded ${mfaEnabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1.5 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-wider text-slate-300">Authenticators (MFA) Lock</p>
            <p className="text-[11px] text-slate-404 leading-normal font-sans">
              Activate a second cryptographic factor using secure time-based 6-digit OTP codes to auth critical permission manipulations.
            </p>
            <div className="pt-1">
              {mfaEnabled ? (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 rounded px-2 py-0.5 font-bold font-mono uppercase">SECURED</span>
                  <button
                    type="button"
                    onClick={onDisableMfa}
                    className="text-[11px] text-slate-500 hover:text-slate-300 font-semibold underline"
                  >
                    Disable Lock
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenMfaSetup}
                  className="px-3 py-1 bg-indigo-600/95 hover:bg-indigo-600 rounded text-[11px] font-bold text-white transition-colors cursor-pointer"
                >
                  Configure 2-Factor Auth
                </button>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Automatic notification settings */}
      <div className="bg-[#0F172A] border border-slate-700 p-4 rounded space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-indigo-400" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">Alerts & Folder Notifications</h4>
          </div>
          <span className="text-[9px] text-slate-400 uppercase font-mono bg-[#1E293B] border border-slate-750 px-2 py-0.5 rounded">AUTO SYNCHRONIZED</span>
        </div>

        <p className="text-[11px] text-slate-400 leading-normal font-sans">
          Select which private video categories triggers an instant portal banner alert when updated with fresh uploads by administrative users:
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1.5 text-xs">
          {[
            { id: 'Classical', label: 'Classical segment' },
            { id: 'Mass', label: 'Mass updates' },
            { id: 'Educational', label: 'Educational' },
            { id: 'Devotional', label: 'Devotional seeds' }
          ].map(opt => (
            <button
              key={opt.id}
              onClick={() => handleSubToggle(opt.id as any)}
              className={`p-2 rounded border text-left flex items-center justify-between transition-all ${
                (subscriptions as any)[opt.id]
                  ? 'bg-indigo-505/10 border-indigo-500/40 text-slate-100'
                  : 'bg-[#1E293B]/50 border-slate-700 text-slate-400'
              }`}
            >
              <span className="font-semibold text-[11px]">{opt.label}</span>
              <div className={`w-2 h-2 rounded-full ${ (subscriptions as any)[opt.id] ? 'bg-indigo-400' : 'bg-slate-700'}`}></div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

}
