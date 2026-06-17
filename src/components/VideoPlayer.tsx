import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Heart, MessageSquare, ShieldCheck, 
  Clock, Share2, Volume2, Maximize, AlertCircle, FileKey, Send, Trash2, HeartHandshake, Eye
} from 'lucide-react';
import { VideoMetadata, Comment } from '../types';

interface VideoPlayerProps {
  video: VideoMetadata;
  videoUrl: string | null;
  comments: Comment[];
  hasLiked: boolean;
  onLikeToggle: () => Promise<void>;
  onAddComment: (commentText: string) => Promise<void>;
  onDeleteComment?: (commentId: string) => Promise<void>;
  currentUserId: string;
  isPlaying: boolean;
  onPlayStateChange: (playing: boolean) => void;
}

export default function VideoPlayer({ 
  video, 
  videoUrl, 
  comments, 
  hasLiked, 
  onLikeToggle, 
  onAddComment,
  onDeleteComment,
  currentUserId,
  isPlaying,
  onPlayStateChange
}: VideoPlayerProps) {
  const [commentText, setCommentText] = useState('');
  const [showShareTooltip, setShowShareTooltip] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [volume, setVolume] = useState(0.4);
  const [isDecrypted, setIsDecrypted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);

  // Restart decryption state when video changes and attempt autoplay when requested
  useEffect(() => {
    setIsDecrypted(false);
    const timer = setTimeout(async () => {
      setIsDecrypted(true);
      // apply latest volume and playbackRate
      if (videoRef.current) {
        videoRef.current.volume = volume;
        videoRef.current.playbackRate = playbackSpeed;
      }
      // If external state requests play, try to start playback
      if (isPlaying && videoRef.current) {
        try {
          await videoRef.current.play();
          setAutoplayBlocked(false);
          onPlayStateChange(true);
        } catch (e) {
          // Autoplay may be blocked; fallback to paused state and show prompt
          setAutoplayBlocked(true);
          onPlayStateChange(false);
        }
      }
    }, 850); // Animated decryption latency
    return () => clearTimeout(timer);
  }, [video.id]);

  // Respond to external play state changes (pause if requested)
  useEffect(() => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.play().then(() => {
        setAutoplayBlocked(false);
      }).catch(() => {
        setAutoplayBlocked(true);
        onPlayStateChange(false);
      });
    } else {
      try {
        videoRef.current.pause();
      } catch (e) {
        // ignore
      }
    }
  }, [isPlaying]);

  const handlePlayPause = async () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      onPlayStateChange(false);
    } else {
      try {
        await videoRef.current.play();
        onPlayStateChange(true);
      } catch (e) {
        onPlayStateChange(false);
      }
    }
  };

  const changeSpeed = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    await onAddComment(commentText.trim());
    setCommentText('');
  };

  const copyShareLink = () => {
    const fakeExp = video.expirationMinutes ? `?expires=${video.expirationMinutes}m` : '';
    const shareUrl = `${window.location.origin}/share/${video.id}${fakeExp}`;
    navigator.clipboard.writeText(shareUrl);
    setShowShareTooltip(true);
    setTimeout(() => {
      setShowShareTooltip(false);
    }, 2500);
  };

  return (
    <div id="video-theater-stage" className="bg-[#1E293B] border border-slate-705 rounded-lg overflow-hidden shadow-2xl flex flex-col lg:flex-row text-slate-100 max-w-full">
      
      {/* Player Section */}
      <div className="flex-1 bg-black flex flex-col relative group min-h-[280px] sm:min-h-[380px] lg:min-h-[440px]">
        
        {/* Upper Decryption Header */}
        <div className="absolute top-0 inset-x-0 p-3 bg-gradient-to-b from-black/85 to-transparent flex items-center justify-between z-10 transition-opacity duration-300 opacity-100 group-hover:opacity-100">
          <div className="flex items-center gap-2">
            <div className="p-1 px-2.5 bg-indigo-500/20 border border-indigo-500/30 rounded text-[9px] font-mono tracking-widest font-bold text-indigo-300 flex items-center gap-1.5 animate-pulse">
              <FileKey className="w-3 h-3 text-indigo-400" />
              <span>AES-256 ZERO-KNOWLEDGE BLOCK</span>
            </div>
            {video.expirationMinutes && (
              <div className="p-1 px-2.5 bg-emerald-500/20 border border-emerald-500/35 rounded text-[9px] font-mono font-bold text-emerald-400">
                LOCKED WINDOW: {video.expirationMinutes}m ID
              </div>
            )}
          </div>
          <span className="px-2 py-0.5 text-[10px] bg-indigo-600/90 border border-indigo-550 rounded text-white font-semibold">
            {video.classification} Target
          </span>
        </div>

        {/* Video Screen */}
        <div className="relative flex-1 flex items-center justify-center overflow-hidden h-full">
          {!isDecrypted ? (
            <div className="flex flex-col items-center justify-center space-y-3 p-6 bg-[#0F172A] absolute inset-0 z-20">
              <div className="relative">
                <div className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-400 animate-spin"></div>
                <FileKey className="w-4 h-4 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-xs font-semibold text-slate-300 tracking-wider">Loading segment array...</p>
              <p className="text-[10px] text-slate-500 font-mono">Retrieving randomized encryption salts & decoding buffers</p>
            </div>
          ) : null}

          {videoUrl ? (
            <video
              ref={videoRef}
              src={videoUrl}
              onClick={handlePlayPause}
              volume={volume}
              className="w-full h-full object-contain max-h-[500px]"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 space-y-2 text-center absolute inset-0 text-slate-500 bg-[#0F172A]">
              <AlertCircle className="w-9 h-9 text-rose-500" />
              <p className="text-xs font-semibold text-slate-400">Decryption stream offline or object missing</p>
              <p className="text-[10pt] font-mono text-slate-500">No binary source registered in local sandbox storage.</p>
            </div>
          )}

          {/* Big Center Play Overlay Toggle */}
          {isDecrypted && !isPlaying && (
            <button
              onClick={handlePlayPause}
              className="absolute p-3.5 rounded-full bg-indigo-600/85 hover:bg-indigo-600 hover:scale-105 transition-all text-white shadow-2xl cursor-pointer"
            >
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </button>
          )}

          {/* Autoplay blocked prompt */}
          {autoplayBlocked && (
            <div className="absolute inset-0 z-30 flex items-center justify-center">
              <button
                onClick={async () => {
                  if (!videoRef.current) return;
                  try {
                    await videoRef.current.play();
                    setAutoplayBlocked(false);
                    onPlayStateChange(true);
                  } catch (e) {
                    setAutoplayBlocked(true);
                    onPlayStateChange(false);
                  }
                }}
                className="p-4 rounded-full bg-indigo-600/85 hover:bg-indigo-600 hover:scale-110 transition-all text-white shadow-2xl cursor-pointer"
              >
                <Play className="w-8 h-8 fill-white" />
              </button>
            </div>
          )}
        </div>

        {/* Customized Custom Controls Shell */}
        <div className="p-2 sm:p-3 bg-[#0F172A] border-t border-slate-700 flex flex-wrap items-center justify-between gap-2 sm:gap-3 text-xs select-none">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              className="p-1.5 bg-[#1E293B] border border-slate-700 hover:bg-slate-700 rounded text-slate-200 transition-colors cursor-pointer"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-slate-400 font-bold" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={handleVolumeChange}
                className="w-16 accent-indigo-500 bg-slate-800 h-1 rounded cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Speed selection */}
            <div className="flex items-center gap-1.5 bg-[#1E293B]/80 px-2 py-0.5 rounded border border-slate-700">
              <span className="text-[9px] text-slate-450 uppercase font-mono font-bold">Speed</span>
              {[1, 1.25, 1.5, 2].map(speed => (
                <button
                  key={speed}
                  onClick={() => changeSpeed(speed)}
                  className={`px-1 rounded text-[9px] font-mono font-bold transition-all ${
                    playbackSpeed === speed 
                      ? 'bg-indigo-600 text-white' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Meta, Socials, Likes & Comments Sidebar Section */}
      <div className="w-full lg:w-[325px] bg-[#151d2e] border-t lg:border-t-0 lg:border-l border-slate-700 p-3 sm:p-4 flex flex-col justify-between max-h-[550px] lg:max-h-none overflow-y-auto shadow-inner">
        
        <div className="space-y-3.5">
          
          {/* Metadata Display */}
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm tracking-tight text-slate-100">{video.name}</h3>
            <p className="text-xs text-slate-400 font-medium font-sans">Director / Artist: <strong className="text-slate-300 font-bold">{video.artist}</strong></p>
            <div className="pt-1 text-[10px] text-slate-500 font-mono flex items-center gap-2">
              <span>{video.createdAt.split('T')[0]}</span>
              <span>•</span>
              <span>{(video.sizeBytes / (1024 * 1024)).toFixed(1)} MB archived</span>
            </div>
          </div>

          <div className="h-px bg-slate-700"></div>

          {/* User view only layout options - likes, share, comments */}
          <div className="flex items-center justify-between gap-4 py-0.5">
            
            {/* Like */}
            <button
              onClick={onLikeToggle}
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded transition-colors cursor-pointer ${
                hasLiked 
                  ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20' 
                  : 'bg-[#0F172A] border border-slate-700 hover:bg-slate-700 text-slate-300'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-400 text-rose-400' : ''}`} />
              <span>{video.likesCount} Likes</span>
            </button>

            {/* Share link with tooltips */}
            <div className="relative">
              <button
                onClick={copyShareLink}
                className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 bg-[#0F172A] border border-slate-700 hover:bg-slate-700 rounded text-slate-300 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Share Securely</span>
              </button>

              {showShareTooltip && (
                <div className="absolute bottom-full right-0 mb-2 whitespace-nowrap bg-indigo-650 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-lg z-30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Secure link copied!</span>
                </div>
              )}
            </div>

          </div>

          <div className="h-px bg-slate-700"></div>

          {/* Comments Panel */}
          <div className="space-y-2.5">
            <h4 className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              Comments ({comments.length})
            </h4>

            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
              {comments.length === 0 ? (
                <p className="text-[10px] text-slate-600 italic">No comments written yet. Be the first!</p>
              ) : (
                comments.map(c => (
                  <div key={c.id} className="p-2 bg-[#0F172A] rounded border border-slate-700 text-xs text-slate-300">
                    <div className="flex justify-between items-center gap-1">
                      <span className="font-bold text-slate-200 truncate max-w-[100px]" title={c.userName}>{c.userName}</span>
                      <div className="flex items-center gap-1 text-[9px] text-slate-500 font-mono">
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        {onDeleteComment && (c.userId === currentUserId) && (
                          <button
                            onClick={() => onDeleteComment(c.id)}
                            className="p-0.5 hover:text-rose-455 hover:bg-slate-850 rounded transition-colors"
                            title="Delete comment"
                          >
                            <Trash2 className="w-2.5 h-2.5 text-rose-400" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-[10.5px] text-slate-400 mt-1 leading-normal break-words font-sans">{c.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Comment Writing Form */}
        <form onSubmit={handleCommentSubmit} className="mt-4 pt-2.5 border-t border-slate-700 flex gap-2">
          <input
            type="text"
            required
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Type private comment..."
            className="flex-1 bg-[#0F172A] border border-slate-710 focus:border-indigo-500 focus:outline-none rounded px-2.5 py-1 text-xs text-slate-200 transition-colors"
          />
          <button
            type="submit"
            className="p-1.5 rounded bg-indigo-600 hover:bg-indigo-500 text-white transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

      </div>

    </div>
  );
}
