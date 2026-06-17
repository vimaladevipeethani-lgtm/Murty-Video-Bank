import React, { useState } from 'react';
import { 
  Trash2, Edit3, Settings, ShieldAlert, 
  Search, Filter, ShieldCheck, CheckCircle2, Clapperboard, Calendar, Users, Eye, Play, Share2
} from 'lucide-react';
import { VideoMetadata, AccessLog, ClassificationType } from '../types';

interface AdminPanelProps {
  videos: VideoMetadata[];
  logs: AccessLog[];
  onUpdateVideo: (videoId: string, updatedFields: Partial<VideoMetadata>) => Promise<void>;
  onDeleteVideo: (videoId: string) => Promise<void>;
}

export default function AdminPanel({ videos, logs, onUpdateVideo, onDeleteVideo }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'files' | 'logs' | 'permissions'>('files');
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);

  // Editing draft states
  const [draftName, setDraftName] = useState('');
  const [draftArtist, setDraftArtist] = useState('');
  const [draftClass, setDraftClass] = useState<ClassificationType>('Mass');
  const [draftPrivacy, setDraftPrivacy] = useState<'public' | 'private'>('private');
  const [draftExpiration, setDraftExpiration] = useState<number | undefined>(undefined);

  // Search & Filters for Logs
  const [logSearch, setLogSearch] = useState('');
  const [logActionFilter, setLogActionFilter] = useState<string>('all');

  // Search for Files
  const [fileSearch, setFileSearch] = useState('');

  const startEditing = (vid: VideoMetadata) => {
    setEditingVideoId(vid.id);
    setDraftName(vid.name);
    setDraftArtist(vid.artist);
    setDraftClass(vid.classification);
    setDraftPrivacy(vid.sharedWith);
    setDraftExpiration(vid.expirationMinutes);
  };

  const saveEdit = async (id: string) => {
    await onUpdateVideo(id, {
      name: draftName,
      artist: draftArtist,
      classification: draftClass,
      sharedWith: draftPrivacy,
      expirationMinutes: draftExpiration
    });
    setEditingVideoId(null);
  };

  const getLogActionStyle = (action: string) => {
    switch(action) {
      case 'upload': return 'text-violet-400 bg-violet-400/10 border border-violet-400/20';
      case 'play': return 'text-emerald-400 bg-emerald-400/10 border border-emerald-400/20';
      case 'view': return 'text-indigo-400 bg-indigo-400/10 border border-indigo-400/20';
      case 'delete': return 'text-rose-400 bg-rose-400/10 border border-rose-400/20';
      case 'share': return 'text-amber-400 bg-amber-400/10 border border-amber-400/20';
      default: return 'text-slate-400 bg-slate-400/10';
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.videoName.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.userEmail.toLowerCase().includes(logSearch.toLowerCase()) ||
      log.action.toLowerCase().includes(logSearch.toLowerCase());
    
    const matchesAction = logActionFilter === 'all' || log.action === logActionFilter;
    return matchesSearch && matchesAction;
  });

  const filteredFiles = videos.filter(vid => 
    vid.name.toLowerCase().includes(fileSearch.toLowerCase()) || 
    vid.artist.toLowerCase().includes(fileSearch.toLowerCase()) || 
    vid.classification.toLowerCase().includes(fileSearch.toLowerCase())
  );

  return (
    <div id="admin-panel-container" className="bg-[#1E293B] border border-slate-700 rounded-lg overflow-hidden shadow-xl text-slate-100 flex flex-col h-full">
      
      {/* Admin Subheader / Navigation Tab Controls */}
      <div className="bg-[#151d2e] p-3 sm:p-4 border-b border-slate-700 flex flex-wrap gap-2 justify-between items-center">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-indigo-400" />
          <span className="font-semibold text-xs uppercase tracking-wider text-slate-200">Admin Control Terminal</span>
        </div>
        <div className="flex bg-[#0F172A] p-0.5 rounded border border-slate-700">
          {[
            { id: 'files', label: 'Video Catalog' },
            { id: 'logs', label: 'Access Audit Logs' },
            { id: 'permissions', label: 'Global Permissions' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1 text-xs font-semibold rounded transition-all cursor-pointer ${
                activeTab === tab.id 
                  ? 'bg-indigo-650 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tab View contents */}
      <div className="p-3 sm:p-4 flex-1 overflow-y-auto">
        
        {activeTab === 'files' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center gap-4 flex-col sm:flex-row">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Video Vault</h3>
              <div className="relative max-w-xs w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter secure nodes..."
                  value={fileSearch}
                  onChange={(e) => setFileSearch(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 focus:outline-none rounded pl-9 pr-4 py-1 text-xs text-slate-200"
                />
              </div>
            </div>

            {filteredFiles.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-750 rounded bg-[#0F172A]/20">
                <Clapperboard className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No archived records found matching search queries.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFiles.map(vid => (
                  <div 
                    key={vid.id} 
                    className={`p-3.5 border rounded-lg transition-all duration-200 ${
                      editingVideoId === vid.id 
                        ? 'bg-[#0F172A] border-indigo-500' 
                        : 'bg-[#0F172A]/45 border-slate-700 hover:bg-[#0F172A]/70 hover:border-slate-500'
                    }`}
                  >
                    {editingVideoId === vid.id ? (
                      /* Inline Editing View */
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Edit Title</label>
                            <input
                              type="text"
                              value={draftName}
                              onChange={(e) => setDraftName(e.target.value)}
                              className="w-full bg-[#0F172A] border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Artist</label>
                            <input
                              type="text"
                              value={draftArtist}
                              onChange={(e) => setDraftArtist(e.target.value)}
                              className="w-full bg-[#0F172A] border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Classification Type</label>
                            <select
                              value={draftClass}
                              onChange={(e) => setDraftClass(e.target.value as ClassificationType)}
                              className="w-full bg-[#0F172A] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="Classical">Classical</option>
                              <option value="Mass">Mass</option>
                              <option value="Educational">Educational</option>
                              <option value="Comedy">Comedy</option>
                              <option value="Tragedy">Tragedy</option>
                              <option value="Devotional">Devotional</option>
                              <option value="Melody">Melody</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Link Scope</label>
                            <select
                              value={draftPrivacy}
                              onChange={(e) => setDraftPrivacy(e.target.value as any)}
                              className="w-full bg-[#0F172A] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                            >
                              <option value="private">Private (Keys required)</option>
                              <option value="public">Shared (Public read)</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Expiry (Minutes)</label>
                            <input
                              type="number"
                              value={draftExpiration || ''}
                              placeholder="Never expire"
                              onChange={(e) => setDraftExpiration(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                              className="w-full bg-[#0F172A] border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-2.5 pt-2">
                          <button
                            onClick={() => setEditingVideoId(null)}
                            className="px-3.5 py-1.5 border border-slate-705 hover:bg-slate-800 rounded text-[11px] font-semibold text-slate-400 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => saveEdit(vid.id)}
                            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded text-[11px] font-semibold text-white transition-colors"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Active List View */
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-slate-200">{vid.name}</h4>
                            <span className="px-2 py-0.5 text-[9px] bg-[#0F172A] border border-slate-700 text-indigo-300 rounded font-semibold uppercase tracking-wider">{vid.classification}</span>
                            {vid.sharedWith === 'public' ? (
                              <span className="px-2 py-0.5 text-[9px] bg-emerald-500/10 text-emerald-400 rounded-full font-medium">Public</span>
                            ) : (
                              <span className="px-2 py-0.5 text-[9px] bg-rose-500/10 text-rose-400 rounded-full font-medium">Encrypted Link</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 font-medium">Director / Lead: <span className="text-slate-300">{vid.artist}</span></p>
                          <div className="flex items-center gap-3 text-[10px] text-slate-400 font-mono">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {new Date(vid.createdAt).toLocaleDateString()}
                            </span>
                            <span>•</span>
                            <span>{(vid.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                            <span>•</span>
                            <span>{vid.expirationMinutes ? `Expires: ${vid.expirationMinutes}m` : 'Persistent'}</span>
                          </div>
                        </div>

                        {/* Control Actions */}
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <button
                            onClick={() => startEditing(vid)}
                            className="p-1.5 bg-[#0F172A] border border-slate-700 hover:bg-slate-800 text-slate-305 hover:text-white rounded cursor-pointer transition-colors"
                            title="Edit metadata"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Are you absolutely sure you want to delete this file? ${vid.name}`)) {
                                onDeleteVideo(vid.id);
                              }
                            }}
                            className="p-1.5 bg-[#0F172A] border border-slate-705 hover:bg-rose-955/30 text-rose-400 hover:text-rose-300 rounded cursor-pointer transition-colors"
                            title="Delete file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            
            {/* Filtering options */}
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-[#151d2e] p-3 border border-slate-700 rounded">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Audit Security Log Streams</span>
              </div>
              <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                <select
                  value={logActionFilter}
                  onChange={(e) => setLogActionFilter(e.target.value)}
                  className="bg-[#0F172A] border border-slate-700 rounded px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
                >
                  <option value="all">All Actions</option>
                  <option value="play">Play (Listen)</option>
                  <option value="view">View (Metadata)</option>
                  <option value="share">Share Expiry Link</option>
                  <option value="upload">Ingest File</option>
                  <option value="delete">Purge Record</option>
                </select>

                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search entities..."
                    value={logSearch}
                    onChange={(e) => setLogSearch(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded pl-8 pr-3 py-1 text-xs text-slate-300 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Granular Logs Grid */}
            {filteredLogs.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-slate-700 rounded bg-[#0F172A]/20">
                <Users className="w-10 h-10 text-slate-700 mx-auto mb-2" />
                <p className="text-xs text-slate-500 font-medium">No audit access traces match current parameters.</p>
              </div>
            ) : (
              <div className="border border-slate-700 rounded overflow-hidden bg-[#0F172A]/40">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#151d2e] text-slate-400 font-bold uppercase border-b border-slate-700">
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">User Context</th>
                      <th className="p-3">Target Record</th>
                      <th className="p-3 text-center">Action</th>
                      <th className="p-3 text-right font-mono">Terminal Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700">
                    {filteredLogs.map(log => {
                      const dateObj = new Date(log.timestamp);
                      return (
                        <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                          <td className="p-3 text-slate-400 font-mono">
                            {dateObj.toLocaleDateString()} {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}
                          </td>
                          <td className="p-3">
                            <span className="font-semibold text-slate-200 block truncate max-w-[140px]" title={log.userEmail}>{log.userEmail}</span>
                            <span className="text-[10px] text-slate-500 font-mono">ID: {log.userId.substring(0, 8)}...</span>
                          </td>
                          <td className="p-3 truncate max-w-[180px] text-slate-350">
                            {log.videoName}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${getLogActionStyle(log.action)}`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3 text-right font-mono text-slate-400">
                            {log.ipAddress || "127.0.0.1"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'permissions' && (
          <div className="space-y-4">
            <div className="bg-[#0F172A] p-4 border border-slate-700 rounded space-y-4">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h4 className="text-xs font-bold tracking-tight">Active Vault Protection Directives</h4>
                  <p className="text-[11px] text-slate-400">Manage encryption levels, role privileges, and authentication mechanisms.</p>
                </div>
              </div>

              <div className="h-px bg-slate-700 my-3"></div>

              <div className="space-y-3.5 text-xs font-medium">
                <div className="flex items-center justify-between py-1.5">
                  <div>
                    <p className="text-slate-200 uppercase tracking-wide text-[10px] font-bold">Role-Based File Upload Lock</p>
                    <p className="text-slate-500 text-[11px]">Enforce that only administrators with verified corporate status can upload assets.</p>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[10px] font-semibold">ACTIVE</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-t border-slate-800">
                  <div>
                    <p className="text-slate-200 uppercase tracking-wide text-[10px] font-bold">Link Expirations Guard</p>
                    <p className="text-slate-500 text-[11px]">Enforce that non-owners cannot fetch secure assets outside their active timeframes.</p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-[10px] font-semibold">ACTIVE</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-t border-slate-800">
                  <div>
                    <p className="text-slate-200 uppercase tracking-wide text-[10px] font-bold">GDPR Compliance Enforcement</p>
                    <p className="text-slate-500 text-[11px]">Anonymize and allow explicit purge requests directly on tracking access nodes.</p>
                  </div>
                  <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[10px] font-semibold">ACTIVE</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-950/25 border border-indigo-900/30 rounded flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
              <p className="text-xs text-indigo-300 leading-relaxed font-sans">
                <strong>Zero-Knowledge Multi-Tenancy Invariant:</strong> Video raw blobs stored inside the device's IndexedDB compartment are encrypted on key slices before indexing. Even if a physical drive was audited, files remain unreadable without authorized credentials.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
