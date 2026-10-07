import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export class MemoryAndDiskCache {
  private static memoryStore: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get data from ultra-fast in-memory RAM first; fallback to persistent AsyncStorage.
   */
  static async get<T>(key: string, maxAgeMs: number = 1000 * 60 * 60 * 24): Promise<T | null> {
    const now = Date.now();

    // 1. Check in-memory RAM
    const memoryItem = this.memoryStore.get(key);
    if (memoryItem) {
      if (now - memoryItem.timestamp < maxAgeMs) {
        return memoryItem.data as T;
      }
    }

    // 2. Check persistent disk (AsyncStorage)
    try {
      const diskRaw = await AsyncStorage.getItem(`app_cache_${key}`);
      if (diskRaw) {
        const parsed: CacheEntry<T> = JSON.parse(diskRaw);
        // Put in memory store for instant subsequent reads
        this.memoryStore.set(key, parsed);

        if (now - parsed.timestamp < maxAgeMs) {
          return parsed.data;
        }
        // Return stale data if offline or network saving
        return parsed.data;
      }
    } catch (_) {}

    return null;
  }

  /**
   * Store data instantly in RAM and write-through to AsyncStorage
   */
  static async set<T>(key: string, data: T): Promise<void> {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
    };

    // Store in RAM
    this.memoryStore.set(key, entry);

    // Persist to Disk asynchronously
    try {
      await AsyncStorage.setItem(`app_cache_${key}`, JSON.stringify(entry));
    } catch (_) {}
  }

  /**
   * Synchronously get from RAM if available
   */
  static getInMemory<T>(key: string): T | null {
    const memoryItem = this.memoryStore.get(key);
    if (memoryItem) {
      return memoryItem.data as T;
    }
    return null;
  }

  /**
   * Invalidate specific key or prefix
   */
  static async remove(key: string): Promise<void> {
    this.memoryStore.delete(key);
    try {
      await AsyncStorage.removeItem(`app_cache_${key}`);
    } catch (_) {}
  }

  static async delete(key: string): Promise<void> {
    return this.remove(key);
  }
}
