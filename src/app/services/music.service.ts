import { Injectable, signal, computed } from '@angular/core';
import { IndexedDbStorageService } from './indexeddb-storage.service';

interface MusicTrack {
  id: string;
  name: string;
  videoId: string;
}

interface CampaignMusicStore {
  [campaignId: string]: MusicTrack[];
}


@Injectable({ providedIn: 'root' })
export class MusicService {

  private readonly storageKey = 'vtt_music';

  private store = signal<CampaignMusicStore>({});
  private activeCampaign = signal<string | null>(null);

  readonly tracks = computed(() => {
    const id = this.activeCampaign();
    if (!id) return [];
    return this.store()[id] || [];
  });

  constructor(private readonly dbStorage: IndexedDbStorageService) {
    void this.load();
  }

  setCampaign(id: string | null): void {
    this.activeCampaign.set(id);
  }

 add(name: string, url: string): void {
  const id = this.activeCampaign();
  if (!id) return;

  const videoId = this.extractVideoId(url);
  if (!videoId) return;

  const track: MusicTrack = {
    id: crypto.randomUUID(),
    name,
    videoId
  };

  this.store.update(all => ({
    ...all,
    [id]: [...(all[id] || []), track]
  }));

  this.save();
}


remove(trackId: string): void {
  const id = this.activeCampaign();
  if (!id) return;

  this.store.update(all => ({
    ...all,
    [id]: (all[id] || []).filter(t => t.id !== trackId)
  }));

  this.save();
}


  private extractVideoId(url: string): string | null {
    const match = url.match(
      /(?:youtube\.com\/.*v=|youtu\.be\/)([^&]+)/);
    return match ? match[1] : null;
  }

  private async save(): Promise<void> {
    // Persist the latest music library in IndexedDB.
    await this.dbStorage.set(this.storageKey, this.store());
  }

  private async load(): Promise<void> {
    try {
      // Migrate legacy localStorage music payload into IndexedDB once.
      const migrated = await this.dbStorage.migrateJsonFromLocalStorage<CampaignMusicStore>(this.storageKey);
      const stored = migrated ?? (await this.dbStorage.get<CampaignMusicStore>(this.storageKey));
      if (stored) this.store.set(stored);
    } catch {}
  }
}
