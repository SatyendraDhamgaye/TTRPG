import { Injectable } from '@angular/core';
import { Campaign, CampaignBoard } from './campaign';
import { IndexedDbStorageService } from './services/indexeddb-storage.service';

@Injectable({ providedIn: 'root' })
export class CampaignStorageService {
  private readonly key = 'vtt_campaigns';

  constructor(private readonly dbStorage: IndexedDbStorageService) {}

  async getAll(): Promise<Campaign[]> {
    // Migrate legacy localStorage campaigns into IndexedDB on first load.
    const migrated = await this.dbStorage.migrateJsonFromLocalStorage<Campaign[]>(this.key);
    if (Array.isArray(migrated)) {
      return migrated;
    }

    const stored = await this.dbStorage.get<Campaign[]>(this.key);
    return Array.isArray(stored) ? stored : [];
  }

  async saveAll(list: Campaign[]): Promise<void> {
    await this.dbStorage.set(this.key, list);
  }

  private randomCover(): string {
    const n = Math.floor(Math.random() * 6) + 1;
    return `/covers/${n}.jpg`;
  }

  async create(name: string, description: string): Promise<Campaign> {
    const campaigns = await this.getAll();

    const newCamp: Campaign = {
      id: 'camp-' + Math.random().toString(36).substring(2, 9),

      name,
      description,

      cover: this.randomCover(),

      createdAt: Date.now(),
      lastOpened: Date.now(),

      // Legacy field kept for old data compatibility.
      tokens: [],

      // Initial board state for this campaign.
      board: {
        tokens: [],
        map: null,
        version: 1
      }
    };

    campaigns.push(newCamp);
    await this.saveAll(campaigns);

    return newCamp;
  }

  async update(camp: Campaign): Promise<void> {
    const campaigns = await this.getAll();
    const i = campaigns.findIndex((c) => c.id === camp.id);

    if (i !== -1) {
      campaigns[i] = camp;
      await this.saveAll(campaigns);
    }
  }

  async delete(id: string): Promise<void> {
    const filtered = (await this.getAll()).filter((c) => c.id !== id);
    await this.saveAll(filtered);
  }

  async markOpened(id: string): Promise<void> {
    const camps = await this.getAll();
    const c = camps.find((x) => x.id === id);

    if (c) {
      c.lastOpened = Date.now();
      await this.saveAll(camps);
    }
  }

  async get(id: string): Promise<Campaign | undefined> {
    return (await this.getAll()).find((c) => c.id === id);
  }

  async updateBoard(id: string, data: Partial<CampaignBoard>): Promise<void> {
    const camps = await this.getAll();
    const camp = camps.find((c) => c.id === id);

    if (!camp) {
      return;
    }

    camp.board = {
      tokens: [],
      map: null,
      version: 1,
      ...(camp.board || {}),
      ...data
    };

    await this.saveAll(camps);
  }
}
