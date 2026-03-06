import { Injectable, signal, computed } from '@angular/core';
import { GameMap } from '../models/map.model';

@Injectable({ providedIn: 'root' })
export class MapService {

  private readonly STORAGE_KEY = 'vtt-maps';

  // All maps (all campaigns)
  private _maps = signal<GameMap[]>([]);

  // Active campaign context
  private _campaignId = signal<string | null>(null);

  // Active map id (per campaign)
  private _activeMapId = signal<string | null>(null);

  // Public readonly access
  readonly maps = computed(() => {
    const campaignId = this._campaignId();
    if (!campaignId) return [];
    return this._maps().filter(m => m.campaignId === campaignId);
  });

  readonly activeMap = computed(() => {
    const campaignId = this._campaignId();
    const activeId = this._activeMapId();
    if (!campaignId || !activeId) return null;

    return this._maps().find(
      m => m.id === activeId && m.campaignId === campaignId
    ) || null;
  });

  constructor() {
    this.loadFromStorage();
  }

  // ===============================
  // Campaign Context
  // ===============================

  setCampaign(campaignId: string | null): void {
    this._campaignId.set(campaignId);
    this._activeMapId.set(null);
  }

  // ===============================
  // Storage
  // ===============================

  private loadFromStorage(): void {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed: GameMap[] = JSON.parse(raw);
      this._maps.set(parsed);
    } catch {
      this._maps.set([]);
    }
  }

  private saveToStorage(): void {
    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(this._maps())
    );
  }

  // ===============================
  // CRUD
  // ===============================

  create(name: string, image: string): void {
    const campaignId = this._campaignId();
    if (!campaignId) return;

    const newMap: GameMap = {
      id: crypto.randomUUID(),
      campaignId,
      name,
      image,
      createdAt: Date.now()
    };

    this._maps.update(prev => [...prev, newMap]);
    this.saveToStorage();

    console.log('Creating map for campaign:', campaignId);

  }

  delete(id: string): void {
    this._maps.update(prev => prev.filter(m => m.id !== id));

    if (this._activeMapId() === id) {
      this._activeMapId.set(null);
    }

    this.saveToStorage();
  }

  setActive(id: string): void {
    this._activeMapId.set(id);
  }

  clearActive(): void {
    this._activeMapId.set(null);
  }
}
