import { uploadVideoToStorage, downloadVideoFromStorage, deleteVideoFromStorage } from './firebase';

// Cloud-first video storage using Firebase Storage
// Videos are stored in Firebase Storage and accessed via download URLs cached in VideoMetadata as 'storageUrl'

export async function storeVideoBlob(id: string, blob: Blob): Promise<string> {
  try {
    // Upload to Firebase Storage and get the download URL
    const downloadUrl = await uploadVideoToStorage(id, blob);
    return downloadUrl;
  } catch (error) {
    console.error("Failed to store video in cloud:", error);
    throw error;
  }
}

export async function getVideoBlob(id: string): Promise<Blob | null> {
  try {
    // Download from Firebase Storage
    const blob = await downloadVideoFromStorage(id);
    return blob;
  } catch (error) {
    console.error("Failed to retrieve video from cloud:", error);
    return null;
  }
}

export async function deleteVideoBlob(id: string): Promise<void> {
  try {
    // Delete from Firebase Storage
    await deleteVideoFromStorage(id);
  } catch (error) {
    console.error("Failed to delete video from cloud:", error);
    throw error;
  }
}

// No demo videos - only display uploaded/loaded video files
export const DEMO_VIDEOS: any[] = [];
