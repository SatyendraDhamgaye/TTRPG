import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { MonsterData } from '../models/monster.model';

@Injectable({ providedIn: 'root' })
export class MonsterService {
  private _monsters = signal<MonsterData[]>([]);
  readonly monsters = this._monsters.asReadonly();

  private _loading = signal(false);
  readonly loading = this._loading.asReadonly();
  private loaded = false;

  constructor(private http: HttpClient) {}

  // Load monster compendium once and cache it in memory.
  load(): void {
    if (this.loaded) {
      return;
    }

    this._loading.set(true);

    this.http
      .get<any[]>('compendium/monsters/merged-all-monsters.json')
      .subscribe({
        next: (data) => {
          const monsters: MonsterData[] = data.map((monster: any) => ({
            id: String(monster.slug || monster.name.toLowerCase().replace(/\s+/g, '-')),
            name: monster.name,
            size: monster.size?.toLowerCase() || 'medium',
            type: monster.type,
            ac: monster.armor_class ?? 10,
            hp: monster.hit_points ?? 1,
            speed: monster.speed ?? '',
            cr: monster.challenge_rating ?? '0',
            image: this.getImagePath(monster.name)
          }));

          this.filterByExistingImages(monsters);
        },
        error: () => {
          this._monsters.set([]);
          this._loading.set(false);
          this.loaded = true;
        }
      });
  }

  // Remove monsters whose image files do not exist in the public assets.
  private filterByExistingImages(monsters: MonsterData[]): void {
    if (monsters.length === 0) {
      this._monsters.set([]);
      this._loading.set(false);
      this.loaded = true;
      return;
    }

    const valid: MonsterData[] = [];
    let checkedCount = 0;

    const completeCheck = (): void => {
      checkedCount += 1;

      if (checkedCount === monsters.length) {
        this._monsters.set(valid);
        this._loading.set(false);
        this.loaded = true;
      }
    };

    monsters.forEach((monster) => {
      const image = new Image();
      image.src = monster.image;

      image.onload = () => {
        valid.push(monster);
        completeCheck();
      };

      image.onerror = () => completeCheck();
    });
  }

  // Build image path from monster name using slug normalization.
  private getImagePath(name: string): string {
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/'/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .trim();

    return `compendium/monsters/images/${slug}.png`;
  }
}
