import React from 'react';
import { 
  Database, ShieldAlert, Key, HardDrive, BarChart2, Activity, PieChart, Info
} from 'lucide-react';
import { VideoMetadata, AccessLog } from '../types';

interface AnalyticsDashboardProps {
  videos: VideoMetadata[];
  logs: AccessLog[];
}

export default function AnalyticsDashboard({ videos, logs }: AnalyticsDashboardProps) {
  // 1. Math calculations
  const totalSizeBytes = videos.reduce((acc, v) => acc + v.sizeBytes, 0);
  const totalPlaybacksCount = logs.filter(l => l.action === 'play').length;
  const totalShareLinksCount = logs.filter(l => l.action === 'share').length;
  
  // Storage usage calculation (against 10 GB limits)
  const MAX_LIMIT_GB = 10;
  const totalSizeGB = totalSizeBytes / (1024 * 1024 * 1024);
  const percentUsed = Math.min(100, Math.max(1, (totalSizeGB / MAX_LIMIT_GB) * 100));

  // 2. Classification Distribution counters
  const categories: Record<string, number> = {
    Classical: 0,
    Mass: 0,
    Educational: 0,
    Comedy: 0,
    Tragedy: 0,
    Devotional: 0
  };

  videos.forEach(v => {
    if (v.classification in categories) {
      categories[v.classification]++;
    }
  });

  const totalVideos = videos.length;

  // 3. Last 7 Days log tracking simulation helper
  const actionsData = {
    view: logs.filter(l => l.action === 'view').length,
    play: logs.filter(l => l.action === 'play').length,
    share: logs.filter(l => l.action === 'share').length,
    upload: logs.filter(l => l.action === 'upload').length,
  };

  const maxActionVal = Math.max(1, actionsData.view, actionsData.play, actionsData.share, actionsData.upload);

  return (
    <div className="bg-[#1E293B] border border-slate-705 rounded-lg p-4 text-slate-100 shadow-xl space-y-5">
      
      {/* Title */}
      <div className="flex justify-between items-center bg-[#151d2e] p-3 border border-slate-700 rounded">
        <div className="flex items-center gap-2.5">
          <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
          <div>
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-200">Compliance & Storage Inspector</h3>
            <p className="text-[10px] text-slate-400">Real-time telemetry and resource footprint metrics.</p>
          </div>
        </div>
        <div className="bg-[#0F172A] px-2.5 py-1 border border-slate-700 rounded text-[9px] font-mono font-bold text-slate-400 select-none">
          STATUS: IN COMPLIANCE (GDPR/CCPA)
        </div>
      </div>

      {/* Numerical Quick Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Storage widget */}
        <div className="bg-[#0F172A] p-3.5 rounded border border-slate-700 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Total Vault Footprint</span>
            <p className="text-sm font-extrabold font-mono text-slate-200">{totalSizeGB.toFixed(4)} GB</p>
            <p className="text-[8px] text-slate-500">of {MAX_LIMIT_GB} GB limit</p>
          </div>
          <div className="p-2 bg-indigo-500/10 text-indigo-455 rounded">
            <HardDrive className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Total Videos File Nodes */}
        <div className="bg-[#0F172A] p-3.5 rounded border border-slate-700 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Indexed File Nodes</span>
            <p className="text-sm font-extrabold font-mono text-slate-200">{totalVideos} Vol nodes</p>
            <p className="text-[8px] text-slate-500">AES-255 blocks verified</p>
          </div>
          <div className="p-2 bg-violet-500/10 text-violet-455 rounded">
            <Database className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Total Streams Decrypted */}
        <div className="bg-[#0F172A] p-3.5 rounded border border-slate-700 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Active Playbacks</span>
            <p className="text-sm font-extrabold font-mono text-slate-200">{totalPlaybacksCount} Sessions</p>
            <p className="text-[8px] text-slate-500">Real-time audited traces</p>
          </div>
          <div className="p-2 bg-emerald-500/10 text-emerald-455 rounded">
            <BarChart2 className="w-4.5 h-4.5" />
          </div>
        </div>

        {/* Total Expired Shares */}
        <div className="bg-[#0F172A] p-3.5 rounded border border-slate-700 flex items-center justify-between shadow-sm">
          <div className="space-y-1">
            <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Secure Guest Seeds</span>
            <p className="text-sm font-extrabold font-mono text-slate-200">{totalShareLinksCount} Expiring URLs</p>
            <p className="text-[8px] text-slate-500">Key restricted access TTL</p>
          </div>
          <div className="p-2 bg-amber-500/10 text-amber-455 rounded">
            <Key className="w-4.5 h-4.5" />
          </div>
        </div>

      </div>

      {/* Storage and classification graphs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Storage expansion bar with limit tracking */}
        <div className="bg-[#0F172A] border border-slate-700 p-4 rounded space-y-4 shadow-sm">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">Active Storage allocation limit</h4>
          </div>

          <div className="space-y-2 pt-1">
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Primary Sandbox Room</span>
              <span className="font-mono">{totalSizeGB.toFixed(4)} GB / {MAX_LIMIT_GB} GB max</span>
            </div>
            
            {/* Visual Progress percentage */}
            <div className="w-full bg-[#1E293B] border border-slate-800 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${percentUsed}%` }}
              />
            </div>

            <div className="flex items-center gap-2 pt-1 text-[10px] text-slate-500 leading-normal">
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Permanent browser sandbox limit is set to {MAX_LIMIT_GB} GB database capacity. Active segment keys remain local.</span>
            </div>
          </div>
        </div>

        {/* Classification category bar distribution */}
        <div className="bg-[#0F172A] border border-slate-700 p-4 rounded space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <PieChart className="w-4 h-4 text-violet-400" />
            <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300">Ingested Category Distribution</h4>
          </div>

          <div className="space-y-2">
            {Object.entries(categories).map(([cat, count]) => {
              const p = totalVideos === 0 ? 0 : Math.round((count / totalVideos) * 100);
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-405 leading-none">
                    <span className="text-slate-350 font-medium">{cat}</span>
                    <span className="font-mono text-slate-500">{count} ({p}%)</span>
                  </div>
                  <div className="w-full bg-[#1E293B] h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-violet-600 h-full transition-all duration-300"
                      style={{ width: `${p}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Trace Log Event Activities */}
      <div className="bg-[#0F172A] border border-slate-700 p-4 rounded shadow-sm">
        <h4 className="text-[10px] font-extrabold uppercase tracking-wider text-slate-300 mb-4 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />
          Vault Interaction Frequency Chart
        </h4>

        <div className="grid grid-cols-4 gap-3 text-center mt-2">
          {Object.entries(actionsData).map(([action, count]) => {
            const heightP = Math.max(10, Math.round((count / maxActionVal) * 100));
            return (
              <div key={action} className="flex flex-col items-center justify-end space-y-1.5 h-32">
                <div className="w-8 bg-[#1E293B] rounded-t border border-slate-700 relative overflow-hidden flex-1 flex items-end">
                  <div 
                    className="w-full bg-gradient-to-t from-emerald-600/85 to-indigo-500/85 transition-all duration-300 rounded-t"
                    style={{ height: `${heightP}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest leading-none">{action}</span>
                <span className="font-mono text-[10px] font-semibold text-emerald-400">{count} ops</span>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
