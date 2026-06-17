const DB_NAME = "vidi_vault_local_storage";
const STORE_NAME = "videos_blobs";
const DB_VERSION = 1;

export function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function storeVideoBlob(id: string, blob: Blob): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(blob, id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function getVideoBlob(id: string): Promise<Blob | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteVideoBlob(id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Preset preloaded secure demo libraries so the vault contains data immediately.
export const DEMO_VIDEOS = [
  {
    id: "demo-bunny",
    name: "Big Buck Bunny - Animated Short",
    artist: "Blender Foundation",
    classification: "Classical" as const,
    sizeBytes: 10518742,
    durationSeconds: 60,
    createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
    ownerId: "system-admin",
    sharedWith: "public" as const,
    likesCount: 24,
    commentsCount: 3,
    sharesCount: 12,
    isEncrypted: true,
    demoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
  },
  {
    id: "demo-dream",
    name: "Elephants Dream - Surreal SciFi",
    artist: "Project Orange",
    classification: "Mass" as const,
    sizeBytes: 25489617,
    durationSeconds: 120,
    createdAt: new Date(Date.now() - 3600000 * 48).toISOString(),
    ownerId: "system-admin",
    sharedWith: "public" as const,
    likesCount: 42,
    commentsCount: 6,
    sharesCount: 19,
    isEncrypted: true,
    demoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
  },
  {
    id: "demo-escape",
    name: "Tech-Flight Flight Cinematics",
    artist: "Alpha Productions",
    classification: "Educational" as const,
    sizeBytes: 15482910,
    durationSeconds: 85,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    ownerId: "system-admin",
    sharedWith: "public" as const,
    likesCount: 15,
    commentsCount: 1,
    sharesCount: 5,
    isEncrypted: false,
    demoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4"
  },
  {
    id: "demo-subaru",
    name: "Wild Earth Driving Chronicles",
    artist: "Nature Exploration Film",
    classification: "Comedy" as const,
    sizeBytes: 12048921,
    durationSeconds: 50,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    ownerId: "system-admin",
    sharedWith: "public" as const,
    likesCount: 8,
    commentsCount: 0,
    sharesCount: 2,
    isEncrypted: true,
    demoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4"
  }
];
