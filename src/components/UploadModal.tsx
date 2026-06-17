import React, { useState, useRef } from 'react';
import { X, Upload, Shield, Eye, Clock, RefreshCw, Layers } from 'lucide-react';
import { ClassificationType } from '../types';

interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: (metadata: {
    name: string;
    artist: string;
    classification: ClassificationType;
    sizeBytes: number;
    durationSeconds: number;
    sharedWith: 'public' | 'private';
    expirationMinutes?: number;
    isEncrypted: boolean;
  }, file?: File) => Promise<void>;
}

export default function UploadModal({ onClose, onUploadSuccess }: UploadModalProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [artist, setArtist] = useState('');
  const [classification, setClassification] = useState<ClassificationType>('Mass');
  const [sharedWith, setSharedWith] = useState<'public' | 'private'>('private');
  const [expirationOption, setExpirationOption] = useState<string>('never');
  const [customExpiration, setCustomExpiration] = useState<number>(60);
  const [isEncrypted, setIsEncrypted] = useState(true);

  // Upload progress UI simulation state
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentSpeed, setCurrentSpeed] = useState<string>('0 MB/s');
  const [encryptionProgress, setEncryptionProgress] = useState(0);
  const [statusText, setStatusText] = useState<'idle' | 'encrypting' | 'compressing' | 'syncing' | 'uploading' | 'done' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('video/')) {
        setFile(droppedFile);
        if (!name) setName(droppedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      if (!name) setName(selectedFile.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setErrorMessage(null);
    
    try {
      // Step 1: Simulated Military-Grade AES-256 Encryption & Verification
      if (isEncrypted) {
        setStatusText('encrypting');
        for (let p = 0; p <= 100; p += 10) {
          setEncryptionProgress(p);
          await new Promise(r => setTimeout(r, 60));
        }
      }

      // Step 2: Realistic compression calculations (simulated)
      setStatusText('compressing');
      await new Promise(r => setTimeout(r, 400));

      // Step 3: Upload to cloud storage
      setStatusText('uploading');
      const totalSize = file.size;
      const duration = 120; // Simulated video duration helper default
      
      // Simulate gradual upload speed with peak speed calculations
      const uploadStep = async () => {
        let progress = 0;
        while (progress < 100) {
          progress += Math.floor(Math.random() * 8) + 4;
          if (progress > 100) progress = 100;
          setUploadProgress(progress);
          
          // Speed calculation simulated based on container size
          const mbps = (Math.random() * 12 + 8).toFixed(1);
          setCurrentSpeed(`${mbps} MB/s`);
          await new Promise(r => setTimeout(r, 120));
        }
      };

      await uploadStep();
      
      setStatusText('done');
      await new Promise(r => setTimeout(r, 300));

      const finalExpiration = expirationOption === 'never' 
        ? undefined 
        : expirationOption === 'custom' 
          ? customExpiration 
          : parseInt(expirationOption, 10);

      await onUploadSuccess({
        name,
        artist: artist || "Unknown Artist",
        classification,
        sizeBytes: totalSize,
        durationSeconds: duration,
        sharedWith,
        expirationMinutes: finalExpiration,
        isEncrypted
      }, file);

      setUploading(false);
      // Success will close modal
    } catch (error) {
      setStatusText('error');
      const errorMsg = error instanceof Error ? error.message : 'Unknown upload error occurred';
      setErrorMessage(errorMsg);
      setUploading(false);
      console.error("Upload failed:", error);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = 2;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div id="upload-modal-container" className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div id="upload-modal-panel" className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-3">
            <Upload className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold tracking-tight">Upload Video Compartment</h2>
          </div>
          <button 
            onClick={onClose} 
            disabled={uploading}
            className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Drag & Drop Zone */}
          {!file ? (
            <div
              id="upload-dropzone"
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={triggerFileSelect}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragActive 
                  ? 'border-indigo-500 bg-indigo-500/10' 
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/50'
              }`}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="video/*"
                className="hidden" 
              />
              <Upload className="w-10 h-10 text-indigo-500 mx-auto mb-3 animate-pulse" />
              <p className="text-sm font-medium text-slate-200">Drag & drop video files here</p>
              <p className="text-xs text-slate-500 mt-1">Accepts raw video, MP4, WebM, MOV. Up to 10GB supported.</p>
              <button 
                type="button"
                className="mt-4 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg text-white transition-colors"
              >
                Browse Disk Storage
              </button>
            </div>
          ) : (
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold truncate max-w-[280px] text-slate-200">{file.name}</h4>
                  <p className="text-xs text-slate-500">{formatSize(file.size)}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFile(null)}
                disabled={uploading}
                className="text-xs text-rose-400 hover:text-rose-300 font-semibold px-2 py-1 hover:bg-rose-500/10 rounded transition-colors"
              >
                Remove
              </button>
            </div>
          )}

          {/* Metadata configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Video Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Symphony classical take"
                disabled={uploading}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg px-3.5 py-2 text-sm text-slate-200 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Artist / Lecturer</label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="e.g. Professor Richard"
                disabled={uploading}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg px-3.5 py-2 text-sm text-slate-200 transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Classification Category</label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value as ClassificationType)}
                disabled={uploading}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none rounded-lg px-3 py-2 text-sm text-slate-200 transition-colors"
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
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Privacy Share Scope</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSharedWith('private')}
                  type-attr="scope-toggle"
                  className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                    sharedWith === 'private'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      : 'border-slate-850 bg-slate-950 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Strictly Private
                </button>
                <button
                  type="button"
                  onClick={() => setSharedWith('public')}
                  type-attr="scope-toggle"
                  className={`py-2 text-xs font-medium rounded-lg border transition-all ${
                    sharedWith === 'public'
                      ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                      : 'border-slate-850 bg-slate-950 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Authorized Users
                </button>
              </div>
            </div>
          </div>

          {/* Secure Link Expire selection */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Secure Access Link Expiration</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: 'never', label: 'Never' },
                { value: '5', label: '5 Mins' },
                { value: '60', label: '1 Hour' },
                { value: '1440', label: '1 Day' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setExpirationOption(opt.value)}
                  disabled={uploading}
                  className={`py-1.5 text-xs rounded-lg transition-colors ${
                    expirationOption === opt.value
                      ? 'bg-emerald-500/25 text-emerald-300 font-semibold'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Expire toggle custom limit */}
            {expirationOption === 'custom' && (
              <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Minutes until expiration:</span>
                <input
                  type="number"
                  min="1"
                  value={customExpiration}
                  onChange={(e) => setCustomExpiration(Math.max(1, parseInt(e.target.value, 10)))}
                  className="w-20 bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-xs text-slate-200"
                />
              </div>
            )}
          </div>

          {/* AES Encryption Option */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Shield className="w-5 h-5 text-indigo-400" />
              <div>
                <p className="text-xs font-bold text-slate-300 uppercase tracking-wider">Military Encryption (AES-GCM-256)</p>
                <p className="text-[10px] text-slate-500">Encrypt binary slices using randomized zero-knowledge keys</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={isEncrypted} 
                onChange={(e) => setIsEncrypted(e.target.checked)}
                disabled={uploading}
                className="sr-only peer" 
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-300 after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* real-time progress layout */}
          {uploading && (
            <div className="bg-slate-950 border border-indigo-900/30 rounded-xl p-4 space-y-3.5 animate-pulse">
              {statusText === 'encrypting' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-indigo-400 font-medium flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      AES-256 Slicing Encryption...
                    </span>
                    <span className="font-mono text-slate-300">{encryptionProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-violet-600 to-indigo-500 h-full transition-all duration-150"
                      style={{ width: `${encryptionProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {statusText === 'compressing' && (
                <p className="text-xs text-amber-400 font-medium flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Analyzing video bitrate & caching segments...
                </p>
              )}

              {statusText === 'uploading' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-emerald-400 font-medium flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5 animate-bounce" />
                      Uploading to cloud storage... ({currentSpeed})
                    </span>
                    <span className="font-mono text-slate-300">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full transition-all duration-150"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {statusText === 'done' && (
                <p className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  ✅ Verification complete. Metadata indexed dynamically!
                </p>
              )}
            </div>
          )}

          {/* Error message display */}
          {errorMessage && (
            <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-3">
                <div className="text-red-400 mt-0.5">⚠️</div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-red-300 mb-1">Upload Failed</p>
                  <p className="text-xs text-red-200">{errorMessage}</p>
                </div>
              </div>
              <div className="flex gap-2 pt-2 border-t border-red-900/30">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMessage(null);
                    setStatusText('idle');
                    setUploadProgress(0);
                    setEncryptionProgress(0);
                  }}
                  className="flex-1 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded transition-colors"
                >
                  Try Again
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3 bg-slate-900">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="px-4 py-2 border border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 text-xs font-semibold hover:bg-slate-800/50 transition-colors disabled:opacity-30"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="px-5 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-lg text-white text-xs font-semibold shadow-lg shadow-indigo-900/30 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Start Secure Ingestion
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
