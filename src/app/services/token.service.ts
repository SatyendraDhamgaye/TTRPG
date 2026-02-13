import { Injectable, signal, computed } from '@angular/core';
import { TokenData } from '../models/token.model';

interface CampaignTokenStore {
  [campaignId: string]: TokenData[];
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  // Full token database, grouped by campaign id.
  private store = signal<CampaignTokenStore>({});

  // Currently active campaign in canvas context.
  private activeCampaign = signal<string | null>(null);

  // Token list for the active campaign.
  readonly tokens = computed(() => {
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

  add(token: TokenData & { campaignId?: string }): void {
    const id = token.campaignId || this.activeCampaign();

    if (!id) return;

    this.store.update((all) => {
      const list = all[id] || [];

      return {
        ...all,
        [id]: [...list, token]
      };
    });

    this.save();
  }

  remove(id: string): void {
    const camp = this.activeCampaign();
    if (!camp) return;

    this.store.update((all) => {
      const list = all[camp] || [];

      return {
        ...all,
        [camp]: list.filter((x) => x.id !== id)
      };
    });

    this.save();
  }

  sizeToCells(size: string): number {
    switch (size) {
      case 'medium': return 1;
      case 'large': return 2;
      case 'huge': return 3;
      case 'gargantuan': return 4;
      default: return 1;
    }
  }

  // Persist token store to localStorage.
  private save(): void {
    localStorage.setItem('vtt_tokens', JSON.stringify(this.store()));
  }

  // Load token store from localStorage.
  private load(): void {
    try {
      const raw = localStorage.getItem('vtt_tokens');
      if (!raw) return;

      this.store.set(JSON.parse(raw));
    } catch {}
  }
}
