export type ClassificationType = 'Classical' | 'Mass' | 'Educational' | 'Comedy' | 'Tragedy' | 'Devotional' | 'Melody';

export interface UserProfile {
  uid: string;
  email: string;
  role: 'admin' | 'user';
  mfaEnabled: boolean;
  mfaSecret: string;
  createdAt: string;
}

export interface VideoMetadata {
  id: string;
  name: string;
  artist: string;
  classification: ClassificationType;
  sizeBytes: number;
  durationSeconds: number;
  createdAt: string;
  ownerId: string;
  sharedWith: 'public' | 'private';
  expirationMinutes?: number; // expiry option
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  isEncrypted: boolean;
  storageUrl?: string; // Firebase Storage download URL for cloud video access
}

export interface Comment {
  id: string;
  videoId: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: string;
}

export interface Like {
  id: string;
  videoId: string;
  userId: string;
  createdAt: string;
}

export interface AccessLog {
  id: string;
  videoId: string;
  videoName: string;
  userId: string;
  userEmail: string;
  action: 'view' | 'play' | 'download' | 'share' | 'upload' | 'delete';
  timestamp: string;
  ipAddress: string;
  userAgent: string;
  classification?: string;
}

export interface SharedNotification {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  category: string;
}
