import { Injectable, signal, computed } from '@angular/core';
import { GameMap } from '../models/map.model';
import { ImageStorageService } from './image-storage.service';

@Injectable({ providedIn: 'root' })
export class MapService {

  private readonly STORAGE_KEY = 'vtt-maps';
  private readonly defaultGridSize = 100;

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

  constructor(private readonly imageStorage: ImageStorageService) {
    void this.loadFromStorage();
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

  private async loadFromStorage(): Promise<void> {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed: GameMap[] = JSON.parse(raw);

      const resolved = await Promise.all(
        parsed.map(async (map) => {
          const withGrid = {
            ...map,
            gridSize: Number.isFinite(map.gridSize) ? map.gridSize : this.defaultGridSize
          };

          // Legacy migration path: map image stored directly in localStorage.
          if (!withGrid.imageId && withGrid.image?.startsWith('data:')) {
            const imageId = `map-${withGrid.id}`;
            await this.imageStorage.saveDataUrl(imageId, withGrid.image);
            return { ...withGrid, imageId };
          }

          if (!withGrid.imageId) {
            return withGrid;
          }

          const dataUrl = await this.imageStorage.getDataUrl(withGrid.imageId);
          return {
            ...withGrid,
            image: dataUrl ?? withGrid.image
          };
        })
      );

      this._maps.set(resolved);
      this.saveToStorage();
    } catch {
      this._maps.set([]);
    }
  }

  private saveToStorage(): void {
    const serialized = this._maps().map((map) => ({
      ...map,
      image: map.imageId ? '' : map.image
    }));

    localStorage.setItem(
      this.STORAGE_KEY,
      JSON.stringify(serialized)
    );
  }

  // ===============================
  // CRUD
  // ===============================

  async create(name: string, image: string): Promise<void> {
    const campaignId = this._campaignId();
    if (!campaignId) return;

    const imageId = image.startsWith('data:') ? `map-${crypto.randomUUID()}` : undefined;

    if (imageId) {
      await this.imageStorage.saveDataUrl(imageId, image);
    }

    const newMap: GameMap = {
      id: crypto.randomUUID(),
      campaignId,
      name,
      image,
      imageId,
      gridSize: this.defaultGridSize,
      createdAt: Date.now()
    };

    this._maps.update(prev => [...prev, newMap]);
    this.saveToStorage();

    console.log('Creating map for campaign:', campaignId);

  }

  async delete(id: string): Promise<void> {
    const target = this._maps().find((m) => m.id === id);
    if (target?.imageId) {
      await this.imageStorage.delete(target.imageId);
    }

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

  setActiveMapGridSize(size: number): void {
    const activeId = this._activeMapId();
    const campaignId = this._campaignId();
    if (!activeId || !campaignId || !Number.isFinite(size)) {
      return;
    }

    this._maps.update((prev) =>
      prev.map((map) => {
        if (map.id !== activeId || map.campaignId !== campaignId) {
          return map;
        }

        return { ...map, gridSize: size };
      })
    );

    this.saveToStorage();
  }
}
