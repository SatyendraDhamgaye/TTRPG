import { Injectable, signal, computed } from '@angular/core';

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

  private store = signal<CampaignMusicStore>({});
  private activeCampaign = signal<string | null>(null);

  readonly tracks = computed(() => {
    const id = this.activeCampaign();
    if (!id) return [];
    return this.store()[id] || [];
  });

  constructor() {
    this.load();
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

  private save(): void {
    localStorage.setItem('vtt_music', JSON.stringify(this.store()));
  }

  private load(): void {
    try {
      const raw = localStorage.getItem('vtt_music');
      if (raw) this.store.set(JSON.parse(raw));
    } catch {}
  }
}
