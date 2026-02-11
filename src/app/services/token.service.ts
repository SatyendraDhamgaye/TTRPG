import { Injectable, signal, computed } from '@angular/core';
import { TokenData } from '../models/token.model';

interface CampaignTokenStore {
  [campaignId: string]: TokenData[];
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {

  // full database of tokens by campaign
  private store = signal<CampaignTokenStore>({});

  // currently active campaign
  private activeCampaign = signal<string | null>(null);

  // 👉 tokens of current campaign (what sidebar uses)
  tokens = computed(() => {
    const id = this.activeCampaign();
    if (!id) return [];

    return this.store()[id] || [];
  });

  constructor() {
    this.load();
  }

  setCampaign(id: string | null) {
    this.activeCampaign.set(id);
  }

  add(token: TokenData & { campaignId?: string }) {
    const id = token.campaignId || this.activeCampaign();

    if (!id) return;

    this.store.update(all => {
      const list = all[id] || [];

      return {
        ...all,
        [id]: [...list, token]
      };
    });

    this.save();
  }

  remove(id: string) {
    const camp = this.activeCampaign();
    if (!camp) return;

    this.store.update(all => {
      const list = all[camp] || [];

      return {
        ...all,
        [camp]: list.filter(x => x.id !== id)
      };
    });

    this.save();
  }

  sizeToCells(size: string): number {
    switch(size) {
      case 'medium': return 1;
      case 'large': return 2;
      case 'huge': return 3;
      case 'gargantuan': return 4;
      default: return 1;
    }
  }

  // ===== PERSISTENCE =====

  private save() {
    localStorage.setItem(
      'vtt_tokens',
      JSON.stringify(this.store())
    );
  }

  private load() {
    try {
      const raw = localStorage.getItem('vtt_tokens');
      if (!raw) return;

      this.store.set(JSON.parse(raw));
    } catch {}
  }
}
