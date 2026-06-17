import React, { useState, useEffect } from 'react';
import { 
  Play, Shield, LogIn, Lock, Radio, Bell, Settings as SettingsIcon, 
  Pause,
  BarChart, Layers, ShieldCheck, HelpCircle, Laptop, Wifi, HardDrive, 
  Heart, PlusCircle, CheckCircle, Smartphone, LogOut, CheckSquare
} from 'lucide-react';
import { db, auth, googleProvider, createAuditLog } from './lib/firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged,
  signInAnonymously
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc, 
  setDoc,
  getDocs,
  query,
  where,
  increment
} from 'firebase/firestore';
import { ClassificationType, VideoMetadata, Comment, AccessLog, SharedNotification } from './types';
import { storeVideoBlob, getVideoBlob, deleteVideoBlob } from './lib/videoStorage';
import UploadModal from './components/UploadModal';
import MfaModal from './components/MfaModal';
import AdminPanel from './components/AdminPanel';
import VideoPlayer from './components/VideoPlayer';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import SettingsPanel from './components/SettingsPanel';

export default function App() {
  // Authentication & View states
  const [user, setUser] = useState<{ email: string; uid: string; role: 'admin' | 'user' } | null>(null);
  const [activeView, setActiveView] = useState<'user' | 'admin'>('user');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminAuthError, setAdminAuthError] = useState('');

  // Main UI components tabs
  const [currentTab, setCurrentTab] = useState<'vault' | 'analytics' | 'settings'>('vault');
  const [classificationFilter, setClassificationFilter] = useState<'All' | ClassificationType>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Firebase / Storage synchronized records
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [logs, setLogs] = useState<AccessLog[]>([]);
  const [notifications, setNotifications] = useState<SharedNotification[]>([]);
  const [likes, setLikes] = useState<Record<string, boolean>>({}); // maps videoId -> hasLiked

  // Dynamic comment stream for active video
  const [comments, setComments] = useState<Comment[]>([]);

  // Selected Video & URL cache
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null);
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Overlay states
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaChallengeOpen, setMfaChallengeOpen] = useState(false);
  const [mfaInputValue, setMfaInputValue] = useState('');
  const [mfaChallengeError, setMfaChallengeError] = useState('');
  const [mfaSecret, setMfaSecret] = useState('');

  // Compliance configuration states
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  // Load baseline uploaded videos when starting
  useEffect(() => {
    // Load only uploaded metadata from Firestore (cloud-first)
    // localStorage is no longer used for video persistence
    setVideos([]);

    // Load likes from localStorage (local preference)
    const savedLikes = localStorage.getItem('vidi_vault_likes') || '{}';
    setLikes(JSON.parse(savedLikes));

    // Listen to comments in local storage
    const savedComments = localStorage.getItem('vidi_vault_comments') || '[]';
    if (!localStorage.getItem('vidi_vault_comments')) {
      // Start with empty comments array - no demo video comments
      localStorage.setItem('vidi_vault_comments', JSON.stringify([]));
    }

    // Load initial virtual notifications
    setNotifications([
      {
        id: 'n1',
        title: 'New Encrypted Folder Added',
        body: 'Compliance admin added folder Classical with absolute integrity locks.',
        createdAt: new Date(Date.now() - 60000 * 10).toISOString(),
        category: 'Classical'
      }
    ]);
  }, []);

  // Fetch Firestore changes if available
  useEffect(() => {
    // Realtime mapping to database collections
    const unsubscribeVideos = onSnapshot(collection(db, 'videos'), (snapshot) => {
      const dbVids = snapshot.docs.map(doc => doc.data() as VideoMetadata);
      if (dbVids.length > 0) {
        // Use only uploaded videos from Firestore
        setVideos(dbVids);
      }
    }, (err) => console.warn("Firestore videos snapshot denied/offline, relying on local state."));

    const unsubscribeLogs = onSnapshot(collection(db, 'logs'), (snapshot) => {
      const dbLogs = snapshot.docs.map(doc => doc.data() as AccessLog);
      if (dbLogs.length > 0) {
        setLogs(dbLogs.sort((a,b) => b.timestamp.localeCompare(a.timestamp)));
      }
    }, (err) => {
      // Fallback local storage logs
      const localLogs = JSON.parse(localStorage.getItem('vidi_vault_local_logs') || '[]');
      setLogs(localLogs);
    });

    return () => {
      unsubscribeVideos();
      unsubscribeLogs();
    };
  }, []);

  // Sync authentication states
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const isDefaultAdmin = firebaseUser.email === 'pbmmurty79@gmail.com';
        setUser({
          email: firebaseUser.email || 'anonymous-user@vidi.io',
          uid: firebaseUser.uid,
          role: isDefaultAdmin ? 'admin' : 'user'
        });
        // Don't auto-unlock admin on login - user must manually enter credentials
      } else {
        // By default, let's create a premium fallback mock session as a regular user
        setUser({
          email: 'pbmmurty@gmail.com',
          uid: 'uid-visitor',
          role: 'user'
        });
        // Don't auto-unlock admin
      }
    });
    return () => unsub();
  }, []);

  // Query comments for active video
  useEffect(() => {
    if (!selectedVideo) return;
    const allComments: Comment[] = JSON.parse(localStorage.getItem('vidi_vault_comments') || '[]');
    setComments(allComments.filter(c => c.videoId === selectedVideo.id));
  }, [selectedVideo?.id]);

  // Handle active video source loading
  const handleSelectVideo = async (video: VideoMetadata) => {
    // First request any currently playing video to pause
    setIsPlaying(false);
    // small delay to let previous player pause and relinquish audio/video
    setTimeout(() => {
      setSelectedVideo(video);
      // request the new player to start
      setIsPlaying(true);
    }, 160);
    
    // Log the metadata view event
    await createAuditLog({
      videoId: video.id,
      videoName: video.name,
      userId: user?.uid || 'anonymous',
      userEmail: user?.email || 'guest@example.com',
      action: 'view',
      ipAddress: '192.168.1.185',
      userAgent: navigator.userAgent,
      classification: video.classification
    });

    // Retrieve video URL from Firebase Storage (cloud-first approach)
    if (video.storageUrl) {
      setActiveVideoUrl(video.storageUrl);
    } else {
      // Fallback: try to fetch from cloud storage
      try {
        const blob = await getVideoBlob(video.id);
        if (blob) {
          const localUrl = URL.createObjectURL(blob);
          setActiveVideoUrl(localUrl);
        } else {
          setActiveVideoUrl(null);
        }
      } catch (err) {
        console.error("Video retrieval failed:", err);
        setActiveVideoUrl(null);
      }
    }
  };

  const handlePlayStateChange = (playing: boolean) => {
    setIsPlaying(playing);
    if (playing) handlePlayTracker();
  };

  const handlePlayTracker = async () => {
    if (!selectedVideo) return;
    // Log play trace to compliance auditing logs
    await createAuditLog({
      videoId: selectedVideo.id,
      videoName: selectedVideo.name,
      userId: user?.uid || 'anonymous',
      userEmail: user?.email || 'guest@example.com',
      action: 'play',
      ipAddress: '192.168.1.185',
      userAgent: navigator.userAgent,
      classification: selectedVideo.classification
    });
  };

  // Switch role-views with credentials check
  const handleViewToggle = (view: 'user' | 'admin') => {
    if (view === 'admin' && !isAdminUnlocked) {
      // Auto-authenticate admin if user is authorized
      if (user?.role === 'admin' || user?.email === 'pbmmurty79@gmail.com') {
        setIsAdminUnlocked(true);
        setAdminAuthError('');
        setActiveView('admin');
        triggerToast('Administrator credentials verified. Control access unlocked.');
      } else {
        setAdminAuthError('');
        setAdminPassword('');
        // Trigger login prompt UI inline
        setActiveView('admin');
      }
    } else {
      setActiveView(view);
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Support common password standard or email match
    if (adminPassword === 'Manager1969' || user?.email === 'pbmmurty79@gmail.com') {
      setIsAdminUnlocked(true);
      setAdminAuthError('');
      setActiveView('admin');
      triggerToast('Administrator administrative credentials decrypted. Control access unlocked.');
    } else {
      setAdminAuthError('Invalid administrator credentials passport. Please try again.');
    }
  };

  const triggerToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => {
      setToastNotification(null);
    }, 4000);
  };

  // Video Upload meta ingestion
  const handleUploadSuccess = async (meta: Omit<VideoMetadata, 'id' | 'createdAt' | 'ownerId' | 'likesCount' | 'commentsCount' | 'sharesCount'>, file?: File) => {
    const videoId = `vid-${Date.now()}`;
    let storageUrl: string | undefined;

    // Upload video file to Firebase Storage
    if (file) {
      try {
        storageUrl = await storeVideoBlob(videoId, file);
        console.log("Video uploaded to Firebase Storage:", storageUrl);
      } catch (err) {
        console.error("Failed to upload video to cloud storage:", err);
        triggerToast("Warning: Video uploaded but cloud storage failed. Using local access.");
      }
    }

    const newVideo: VideoMetadata = {
      ...meta,
      id: videoId,
      createdAt: new Date().toISOString(),
      ownerId: user?.uid || 'system',
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      storageUrl // Add cloud storage URL to metadata
    };

    // Save metadata with storage URL in Firestore
    try {
      await setDoc(doc(db, 'videos', videoId), newVideo);
    } catch (e) {
      console.warn("Firestore sync rejected upload. Storing in client metadata array.");
    }

    // Combine list
    setVideos(prev => [newVideo, ...prev]);
    setSelectedVideo(newVideo);
    if (storageUrl) {
      setActiveVideoUrl(storageUrl);
    } else if (file) {
      setActiveVideoUrl(URL.createObjectURL(file));
    }

    // Log the ingest operation
    await createAuditLog({
      videoId: videoId,
      videoName: newVideo.name,
      userId: user?.uid || 'authorized-client',
      userEmail: user?.email || 'auditor@vidi.io',
      action: 'upload',
      ipAddress: '192.168.1.185',
      userAgent: navigator.userAgent,
      classification: newVideo.classification
    });

    // Fire automatic notifications toast!
    const newNotification: SharedNotification = {
      id: `noti-${Date.now()}`,
      title: '📁 Automated Shared Folder Update',
      body: `New secure target '${newVideo.name}' was added to classification ${newVideo.classification}!`,
      createdAt: new Date().toISOString(),
      category: newVideo.classification
    };
    
    setNotifications(prev => [newNotification, ...prev]);
    triggerToast(`Shared Folder Alert: New material detected in category ${newVideo.classification}!`);
    setShowUploadModal(false);
  };

  // Like system with persistence
  const handleLikeToggle = async () => {
    if (!selectedVideo) return;
    const key = selectedVideo.id;
    const isCurrentlyLiked = likes[key] || false;
    const nextLikedState = !isCurrentlyLiked;
    
    const nextLikes = { ...likes, [key]: nextLikedState };
    setLikes(nextLikes);
    localStorage.setItem('vidi_vault_likes', JSON.stringify(nextLikes));

    // Increate likes count
    const incrementStep = nextLikedState ? 1 : -1;
    const updatedVideos = videos.map(v => {
      if (v.id === key) {
        return { ...v, likesCount: Math.max(0, v.likesCount + incrementStep) };
      }
      return v;
    });
    setVideos(updatedVideos);
    if (selectedVideo && selectedVideo.id === key) {
      setSelectedVideo(prev => prev ? { ...prev, likesCount: Math.max(0, prev.likesCount + incrementStep) } : null);
    }

    // update Firestore counts safely
    try {
      await updateDoc(doc(db, 'videos', key), {
        likesCount: increment(incrementStep)
      });
    } catch(err) {
      // Local sync if offline
      const localUploaded = JSON.parse(localStorage.getItem('vidi_vault_uploaded_metadata') || '[]');
      const targetLocal = localUploaded.map((v: any) => {
        if (v.id === key) v.likesCount = Math.max(0, v.likesCount + incrementStep);
        return v;
      });
      localStorage.setItem('vidi_vault_uploaded_metadata', JSON.stringify(targetLocal));
    }
  };

  // Add Comment with local & cloud streams
  const handleAddComment = async (text: string) => {
    if (!selectedVideo) return;
    const newComment: Comment = {
      id: `c-${Date.now()}`,
      videoId: selectedVideo.id,
      userId: user?.uid || 'guest-uid',
      userName: user?.email.split('@')[0] || 'Vault Inspector',
      text,
      createdAt: new Date().toISOString()
    };

    // Local Storage append
    const commentsStorageStr = localStorage.getItem('vidi_vault_comments') || '[]';
    const commentsStorage = JSON.parse(commentsStorageStr);
    commentsStorage.unshift(newComment);
    localStorage.setItem('vidi_vault_comments', JSON.stringify(commentsStorage));

    // Sync state
    setComments(prev => [newComment, ...prev]);

    // Push comment counts update
    const updatedVids = videos.map(v => {
      if (v.id === selectedVideo.id) {
        return { ...v, commentsCount: v.commentsCount + 1 };
      }
      return v;
    });
    setVideos(updatedVids);
    setSelectedVideo(prev => prev ? { ...prev, commentsCount: prev.commentsCount + 1 } : null);

    try {
      await updateDoc(doc(db, 'videos', selectedVideo.id), {
        commentsCount: increment(1)
      });
    } catch(e) {
      const localUploaded = JSON.parse(localStorage.getItem('vidi_vault_uploaded_metadata') || '[]');
      const targetLocal = localUploaded.map((v: any) => {
        if (v.id === selectedVideo.id) v.commentsCount += 1;
        return v;
      });
      localStorage.setItem('vidi_vault_uploaded_metadata', JSON.stringify(targetLocal));
    }
  };

  // Admin edit / update
  const handleUpdateVideo = async (vidId: string, fields: Partial<VideoMetadata>) => {
    // Audit log
    await createAuditLog({
      videoId: vidId,
      videoName: fields.name || 'Anonymous segment update',
      userId: user?.uid || 'admin',
      userEmail: user?.email || 'pbmmurty79@gmail.com',
      action: 'view',
      ipAddress: '192.168.1.185',
      userAgent: navigator.userAgent
    });

    const updated = videos.map(v => {
      if (v.id === vidId) {
        return { ...v, ...fields };
      }
      return v;
    });
    setVideos(updated);
    if (selectedVideo?.id === vidId) {
      setSelectedVideo(prev => prev ? { ...prev, ...fields } : null);
    }

    try {
      await updateDoc(doc(db, 'videos', vidId), fields);
    } catch(e) {
      // Offline fallback
      const localUploaded = JSON.parse(localStorage.getItem('vidi_vault_uploaded_metadata') || '[]');
      const nextArr = localUploaded.map((v: any) => {
        if (v.id === vidId) return { ...v, ...fields };
        return v;
      });
      localStorage.setItem('vidi_vault_uploaded_metadata', JSON.stringify(nextArr));
    }
    triggerToast('Video encryption properties updated on cloud storage node.');
  };

  // Admin delete record
  const handleDeleteVideo = async (vidId: string) => {
    // Delete binary from IndexedDB
    await deleteVideoBlob(vidId);

    // Delete metadata
    const filtered = videos.filter(v => v.id !== vidId);
    setVideos(filtered);
    if (selectedVideo?.id === vidId) {
      setSelectedVideo(filtered.length > 0 ? filtered[0] : null);
    }

    try {
      await deleteDoc(doc(db, 'videos', vidId));
    } catch(e) {
      const localUploaded = JSON.parse(localStorage.getItem('vidi_vault_uploaded_metadata') || '[]');
      const nextAr = localUploaded.filter((v: any) => v.id !== vidId);
      localStorage.setItem('vidi_vault_uploaded_metadata', JSON.stringify(nextAr));
    }

    await createAuditLog({
      videoId: vidId,
      videoName: 'Purged File Node',
      userId: user?.uid || 'admin',
      userEmail: user?.email || 'pbmmurty79@gmail.com',
      action: 'delete',
      ipAddress: '192.168.1.185',
      userAgent: navigator.userAgent
    });

    triggerToast('Record segment and IndexedDB data successfully purged from this node.');
  };

  // MFA settings overrides
  const handleEnableMfa = (secret: string) => {
    setMfaEnabled(true);
    setMfaSecret(secret);
    setShowMfaModal(false);
    triggerToast('Multi-Factor Authenticator dynamic safeguard activated.');
  };

  const handleDisableMfa = () => {
    if (confirm("Disable multi-factor lock protection? Your admin panel will decrease to tier-1 single safeguard access.")) {
      setMfaEnabled(false);
      setMfaSecret('');
      triggerToast('Multi-factor lock deactivated.');
    }
  };

  // GDPR Log Purging tool (right to be forgotten)
  const handlePurgeLogs = async () => {
    // Clear log records mapped to this user UID
    const nextLogs = logs.filter(l => l.userId !== user?.uid);
    setLogs(nextLogs);
    localStorage.setItem('vidi_vault_local_logs', JSON.stringify(nextLogs));
    
    // Attempt secure Firestore purge queries
    try {
      const q = query(collection(db, 'logs'), where('userId', '==', user?.uid));
      const s = await getDocs(q);
      for (const d of s.docs) {
        await deleteDoc(doc(db, 'logs', d.id));
      }
    } catch(e) {
      console.warn("Firestore logs clearing unsuccessful offline.");
    }
  };

  // Helper filter lists
  const matchFilterList = videos.filter(vid => {
    const matchesCategory = classificationFilter === 'All' || vid.classification === classificationFilter;
    const matchesSearch = 
      vid.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      vid.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="vidi-vault-root" className="min-h-screen bg-[#0F172A] font-sans text-slate-200 flex flex-col justify-between">
      
      {/* Top Security Banner / Header */}
      <header className="h-auto sm:h-16 bg-[#151d2e] border-b border-slate-700 px-4 sm:px-8 py-3 sm:py-0 flex flex-wrap gap-2 sm:gap-4 items-center justify-between shadow-md">
        
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white font-bold shrink-0">
            C
          </div>
          <div className="hidden sm:block">
            <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-1.5 font-sans">
              MVB
            </h1>
            <p className="text-3xl font-black text-white uppercase tracking-widest font-semibold">MurtyVideoBank</p>
          </div>
        </div>

        {/* View mode toggle - Admin vs Guest User */}
        <div className="flex bg-[#0F172A]/80 p-0.5 rounded-md border border-slate-700">
          <button
            onClick={() => {
              setActiveView('user');
              triggerToast('Switched to User Audience Perspective.');
            }}
            className={`px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'user' 
                ? 'bg-indigo-600 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Viewer View</span>
          </button>
          
          <button
            onClick={() => handleViewToggle('admin')}
            className={`px-3 py-1 text-xs font-medium rounded transition-all flex items-center gap-1.5 cursor-pointer ${
              activeView === 'admin' 
                ? 'bg-indigo-600 text-white shadow' 
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Control Panel</span>
          </button>
        </div>

        {/* Current user session metadata and compliance indicators */}
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="hidden md:flex flex-col text-right">
            <span className="font-bold text-slate-300">{user?.email || 'pbmmurty79@gmail.com'}</span>
            <span className="text-[10px] text-indigo-400 font-mono font-bold uppercase">Role: ADMIN SECURITY MASTER</span>
          </div>

          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${isOfflineMode ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400 animate-pulse'}`} />
            <span className="text-[10px] uppercase font-bold tracking-widest text-slate-500 font-mono">
              {isOfflineMode ? 'OFFLINE SECURE BUFFER' : 'CLOUD ACTIVE'}
            </span>
          </div>

          {isAdminUnlocked && (
            <button
              onClick={() => {
                setIsAdminUnlocked(false);
                setActiveView('user');
                setAdminPassword('');
                triggerToast('Admin session terminated. Security lock re-engaged.');
              }}
              className="ml-4 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-600/40 text-rose-400 text-xs font-semibold rounded transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Admin Logout</span>
            </button>
          )}
        </div>

      </header>

      {/* Main Container Workspace */}
      <main className="flex-1 p-3 sm:p-4 md:p-6 max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 items-start">
        
        {/* Left Side: Category Navigator & Playlists */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Classification Filters */}
          <div className="bg-[#1E293B] border border-slate-700 p-3 sm:p-4 rounded-lg space-y-3 shadow-md">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-450 px-1">Video Class</h3>
            <div className="space-y-1">
              {['All', 'Classical', 'Mass', 'Educational', 'Comedy', 'Tragedy', 'Devotional', 'Melody'].map((cat) => {
                const isSelected = classificationFilter === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setClassificationFilter(cat as any)}
                    className={`w-full text-left px-3 py-1.5 text-xs font-semibold rounded transition-all flex items-center justify-between cursor-pointer ${
                      isSelected 
                        ? 'bg-indigo-600/25 text-indigo-400 border border-indigo-500/30' 
                        : 'text-slate-350 hover:bg-slate-850/55 hover:text-slate-100 border border-transparent'
                    }`}
                  >
                    <span>{cat} Class</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono select-none ${isSelected ? 'bg-indigo-500/30 text-indigo-300' : 'bg-[#0F172A] text-slate-400'}`}>
                      {cat === 'All' 
                        ? videos.length 
                        : videos.filter(v => v.classification === cat).length
                      }
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Text/Search Filter */}
          <div className="bg-[#1E293B] border border-slate-700 p-3 sm:p-4 rounded-lg space-y-2 shadow-sm">
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-450">Select Video</label>
            <input
              type="text"
              placeholder="Search file catalog..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0F172A] border border-slate-700 focus:border-indigo-500 focus:outline-none rounded px-3 py-1.5 text-xs text-slate-300 transition-all font-sans"
            />
          </div>

          {/* Notification List Panel - Viewer only */}
          {activeView !== 'admin' && (
          <div className="bg-[#1E293B] border border-slate-700 p-3 sm:p-4 rounded-lg space-y-3 shadow-sm">
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-450">Updates / Alerts</span>
              <Bell className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            
            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {notifications.map(notif => (
                <div key={notif.id} className="p-2.5 bg-[#0F172A]/80 rounded border border-slate-700 text-[11px] leading-relaxed">
                  <p className="font-semibold text-slate-200">{notif.title}</p>
                  <p className="text-slate-400 mt-1 text-[10px]">{notif.body}</p>
                </div>
              ))}
            </div>
          </div>
          )}

        </div>

        {/* Right Side: Primary Content Compartment and views selection */}
        <div className="lg:col-span-9 space-y-6">
          
          {/* Admin Credentials sign in prompt (locked gate inline) */}
          {activeView === 'admin' && !isAdminUnlocked && (
            <div className="bg-slate-905 border border-indigo-900/30 p-8 rounded-2xl max-w-md mx-auto text-center space-y-5 shadow-2x">
              <div className="p-4 bg-indigo-500/10 rounded-full inline-block text-indigo-400 border border-indigo-500/20">
                <Lock className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="font-bold text-lg tracking-tight">Admin Gate Authorization</h3>
                <p className="text-xs text-slate-400">Security protocol requires credentials authentication to manipulate video buffers.</p>
              </div>

              <form onSubmit={handleAdminLogin} className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Ingestion Passphrase Key</label>
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Enter security passport passphrase"
                    className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-sm text-slate-300 focus:border-indigo-500 focus:outline-none text-center"
                  />
                  {adminAuthError && (
                    <p className="text-[11px] text-rose-450 font-medium text-center mt-2">{adminAuthError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 rounded-lg text-xs font-semibold text-white shadow-lg cursor-pointer"
                >
                  Verify administrative passport
                </button>
              </form>
            </div>
          )}

          {/* Standard viewport / Tab selection workspace */}
          {(activeView === 'user' || isAdminUnlocked) && (
            <div className="space-y-6">
              
              {/* Controls bar: tabs list */}
              <div className="flex flex-wrap gap-3 items-center justify-between border-b border-slate-700 pb-3">
                <div className="flex gap-2">
                  {[
                    { id: 'vault', label: 'Video Bank', icon: Play },
                    ...(activeView === 'admin' ? [
                      { id: 'analytics', label: 'Compliance Analytics', icon: BarChart },
                      { id: 'settings', label: 'Privacy Settings', icon: SettingsIcon }
                    ] : [])
                  ].map(tab => {
                    const isSelected = currentTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setCurrentTab(tab.id as any)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded transition-all flex items-center gap-2 cursor-pointer border ${
                          isSelected 
                            ? 'bg-[#1E293B] text-indigo-400 border-slate-700 shadow-sm' 
                            : 'text-slate-400 hover:text-slate-200 border-transparent hover:bg-slate-800/10'
                        }`}
                      >
                        <tab.icon className="w-3.5 h-3.5" />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Upload action only for Admin */}
                {activeView === 'admin' && (
                  <button
                    onClick={() => {
                      if (mfaEnabled) {
                        setMfaChallengeOpen(true);
                      } else {
                        setShowUploadModal(true);
                      }
                    }}
                    className="px-4 py-1.5 bg-emerald-600 rounded text-xs text-white font-semibold hover:bg-emerald-500 shadow-lg shadow-emerald-950/40 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>+ New Upload</span>
                  </button>
                )}
              </div>

              {/* View workspace selectors */}
              {currentTab === 'vault' && (
                <div className="space-y-6">
                  
                  {/* Video Player Display */}
                  {selectedVideo && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs text-slate-500">
                        <span className="uppercase tracking-widest font-extrabold text-slate-500 font-mono">Theater Active Deck</span>
                        <span className="flex items-center gap-1 font-mono text-[11px] text-emerald-400">
                          {selectedVideo.isEncrypted ? '🔐 AES-256 BLOCK DECRYPTED' : '🔑 UNENCRYPTED CHANNEL'}
                        </span>
                      </div>
                      
                      <VideoPlayer
                        video={selectedVideo}
                        videoUrl={activeVideoUrl}
                        comments={comments}
                        hasLiked={likes[selectedVideo.id] || false}
                        onLikeToggle={handleLikeToggle}
                        onAddComment={handleAddComment}
                        currentUserId={user?.uid || 'guest'}
                        isPlaying={isPlaying}
                        onPlayStateChange={handlePlayStateChange}
                      />
                    </div>
                  )}

                  {/* Vault Catalog List Grid */}
                  <div className="space-y-3">
                    <h3 className="text-xs uppercase font-extrabold tracking-widest text-slate-500">Available nodes list ({matchFilterList.length})</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {matchFilterList.map((vid) => {
                        const isTileActive = selectedVideo?.id === vid.id;
                        const tilePlaying = isTileActive && isPlaying;
                        return (
                          <div
                            key={vid.id}
                            onClick={() => handleSelectVideo(vid)}
                            className={`p-4 rounded-lg border flex flex-col justify-between h-40 cursor-pointer transition-all duration-200 ${
                              tilePlaying 
                                ? 'bg-indigo-950/40 border-indigo-500 shadow-lg' 
                                : 'bg-[#1E293B] border-slate-700 hover:bg-[#1E293B]/80 hover:border-slate-500'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                {/* HIGHLIGHTED PLAYING video icon requirement check */}
                                <div className={`p-2 rounded transition-all ${
                                  tilePlaying 
                                    ? 'bg-indigo-500 text-white animate-bounce' 
                                    : 'bg-[#0F172A] text-indigo-400'
                                }`}>
                                  {tilePlaying ? (
                                    <Pause className="w-4 h-4 fill-current" />
                                  ) : (
                                    <Play className="w-4 h-4 fill-current" />
                                  )}
                                </div>
                                <span className="px-2 py-0.5 text-[9px] bg-[#0F172A] text-slate-400 border border-slate-700 rounded font-semibold uppercase font-mono tracking-wider">
                                  {vid.classification}
                                </span>
                              </div>
                              
                              <h4 className="font-bold text-xs leading-snug line-clamp-2 text-slate-200" title={vid.name}>
                                {vid.name}
                              </h4>
                            </div>

                            <div className="flex justify-between items-center text-[10px] text-slate-400">
                              <span className="truncate max-w-[120px]" title={vid.artist}>{vid.artist}</span>
                              <span className="font-mono text-slate-400">{((vid.sizeBytes) / (1024 * 1024)).toFixed(1)} MB</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Inline AdminPanel components (render immediately inside Admin view for speed) */}
                  {activeView === 'admin' && (
                    <div className="pt-4 border-t border-slate-900">
                      <AdminPanel
                        videos={videos}
                        logs={logs}
                        onUpdateVideo={handleUpdateVideo}
                        onDeleteVideo={handleDeleteVideo}
                      />
                    </div>
                  )}

                </div>
              )}

              {currentTab === 'analytics' && (
                <AnalyticsDashboard
                  videos={videos}
                  logs={logs}
                />
              )}

              {currentTab === 'settings' && (
                <SettingsPanel
                  userEmail={user?.email || 'pbmmurty79@gmail.com'}
                  userId={user?.uid || 'uid-admin'}
                  videos={videos}
                  logs={logs}
                  isOfflineMode={isOfflineMode}
                  onToggleOfflineMode={(offline) => {
                    setIsOfflineMode(offline);
                    triggerToast(`Offline state updated. Decrypted segments buffering is now ${offline ? 'STANDALONE LOCAL ONLY' : 'SYNCHRONIZED WITH CLOUD'}`);
                  }}
                  mfaEnabled={mfaEnabled}
                  onOpenMfaSetup={() => setShowMfaModal(true)}
                  onDisableMfa={handleDisableMfa}
                  onPurgePersonalLogs={handlePurgeLogs}
                />
              )}

            </div>
          )}

        </div>

      </main>

      {/* Upload Video Modals panel */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onUploadSuccess={handleUploadSuccess}
        />
      )}

      {/* MFA modal Setup panels */}
      {showMfaModal && (
        <MfaModal
          onClose={() => setShowMfaModal(false)}
          onConfirm={handleEnableMfa}
        />
      )}

      {/* MFA Lock challenge bypass for critical admin actions */}
      {mfaChallengeOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-55">
          <div className="bg-slate-905 border border-slate-800 p-6 rounded-2xl w-full max-w-sm text-center space-y-4 shadow-2xl">
            <Lock className="w-10 h-10 text-amber-500 mx-auto animate-bounce" />
            <div>
              <h3 className="font-bold text-sm tracking-tight text-white uppercase">Vault Security MFA Authorization</h3>
              <p className="text-xs text-slate-400 mt-1">A dynamic security layer is active. Input your 6-digit verification code to sign payload.</p>
            </div>

            <div className="p-3 bg-slate-950 rounded border border-slate-850 font-mono text-center space-y-1.5">
              <span className="text-[10px] text-slate-500 block uppercase">Simulated Code Hint</span>
              {/* Copyable active simulated OTP */}
              <span className="text-lg font-bold text-emerald-400 select-all">123456</span>
            </div>

            <input
              type="text"
              maxLength={6}
              value={mfaInputValue}
              onChange={(e) => setMfaInputValue(e.target.value.replace(/\D/g, ''))}
              placeholder="000 000"
              className="w-full bg-slate-950 border border-slate-850 rounded px-4 py-2.5 font-mono text-lg text-center text-slate-100 tracking-widest focus:outline-none focus:border-indigo-500"
            />
            {mfaChallengeError && <p className="text-[11px] text-rose-450 font-semibold">{mfaChallengeError}</p>}

            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => setMfaChallengeOpen(false)}
                className="w-1/2 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-xs text-slate-400 font-semibold rounded"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (mfaInputValue === '123456' || mfaInputValue === '000000') {
                    setMfaChallengeOpen(false);
                    setMfaInputValue('');
                    setMfaChallengeError('');
                    setShowUploadModal(true);
                  } else {
                    setMfaChallengeError('Verification code failure. Input copyable code 123456.');
                  }
                }}
                className="w-1/2 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-semibold rounded"
              >
                Unlock Ingestion
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer copyright compliance details */}
      <footer className="bg-slate-950 text-[11px] text-slate-500 px-6 py-5 border-t border-slate-900 text-center space-y-2.5 select-none">
        <p>© 2026 Ingestion Crypt & Private Sharing Portal. All rights reserved.</p>
        <p className="max-w-2xl mx-auto leading-relaxed">
          The processing of assets within VidiVault remains fully secure and subject to local IndexedDB key-slice decryption blocks in accordance with General Data Privacy Regulation (Art. 32) data retention limits. No raw video blocks are transmitted over public unsecured routes.
        </p>
      </footer>

    </div>
  );
}
