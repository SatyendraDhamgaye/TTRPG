import { Injectable, signal, computed } from '@angular/core';
import { TokenData } from '../models/token.model';
import { ImageStorageService } from './image-storage.service';
import { IndexedDbStorageService } from './indexeddb-storage.service';

interface CampaignTokenStore {
  [campaignId: string]: TokenData[];
}

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private readonly storageKey = 'vtt_tokens';
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

  constructor(
    private readonly imageStorage: ImageStorageService,
    private readonly dbStorage: IndexedDbStorageService
  ) {
    void this.load();
  }

  setCampaign(id: string | null): void {
    this.activeCampaign.set(id);
  }

  async add(token: TokenData & { campaignId?: string }): Promise<void> {
    const id = token.campaignId || this.activeCampaign();

    if (!id) return;

    let imageId = token.imageId;

    if (!imageId && token.image?.startsWith('data:')) {
      imageId = `token-${crypto.randomUUID()}`;
      await this.imageStorage.saveDataUrl(imageId, token.image);
    }

    const tokenToStore: TokenData = {
      ...token,
      imageId
    };

    this.store.update((all) => {
      const list = all[id] || [];

      return {
        ...all,
        [id]: [...list, tokenToStore]
      };
    });

    this.save();
  }

  async remove(id: string): Promise<void> {
    const camp = this.activeCampaign();
    if (!camp) return;

    const existing = (this.store()[camp] || []).find((x) => x.id === id);
    if (existing?.imageId) {
      await this.imageStorage.delete(existing.imageId);
    }

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

  // Persist token store to IndexedDB (legacy localStorage is migrated).
  private async save(): Promise<void> {
    const serialized: CampaignTokenStore = {};

    Object.entries(this.store()).forEach(([campaignId, tokens]) => {
      serialized[campaignId] = tokens.map((token) => ({
        ...token,
        image: token.imageId ? '' : token.image
      }));
    });

    await this.dbStorage.set(this.storageKey, serialized);
  }

  // Load token store from IndexedDB (legacy localStorage is migrated).
  private async load(): Promise<void> {
    try {
      // Migrate legacy token payload from localStorage into IndexedDB once.
      const migrated = await this.dbStorage.migrateJsonFromLocalStorage<CampaignTokenStore>(this.storageKey);
      const parsed = migrated ?? (await this.dbStorage.get<CampaignTokenStore>(this.storageKey));
      if (!parsed) return;
      const hydrated: CampaignTokenStore = {};

      for (const [campaignId, tokens] of Object.entries(parsed)) {
        hydrated[campaignId] = await Promise.all(
          tokens.map(async (token) => {
            if (!token.imageId && token.image?.startsWith('data:')) {
              const migratedId = `token-${token.id}`;
              await this.imageStorage.saveDataUrl(migratedId, token.image);
              return {
                ...token,
                imageId: migratedId
              };
            }

            if (!token.imageId) {
              return token;
            }

            const dataUrl = await this.imageStorage.getDataUrl(token.imageId);
            return {
              ...token,
              image: dataUrl ?? token.image
            };
          })
        );
      }

      this.store.set(hydrated);
      await this.save();
    } catch {}
  }
}
